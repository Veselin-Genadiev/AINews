'use strict';

var Crawler = function () {
	var Crawler = require('crawler');
	var jsdom = require('jsdom');

	this.currentDocId = 1;
	this.fs = require('fs');
	this.urls = [];
	this.filePaths = [];
	this.crawler = new Crawler({
		maxConnections: 3,
		rateLimit: 2000,
		jQuery: jsdom, 
		callback: function (error, res, done) {
			if (error) {
				console.log(error);
			} else {
				console.log(res);
			}

			done();
		}
	});
};

Crawler.prototype.LoadAvailableEntries = function() {
	var files = this.fs.readdirSync('./docs/');

	if (files && files.length > 0) {
		files.forEach(file => {
			var content = this.fs.readFileSync('./docs/' + file, "utf8");
			var json = JSON.parse(content);
			this.urls.push(json.url);

			if (this.currentDocId <= json.id) {
				this.currentDocId = json.id + 1;
			}
		});
	}
}

Crawler.prototype.WriteNewsEntry = function (url, title, text, date, tags) {
	var filePath = './docs/' + this.currentDocId + '.txt';
	this.filePaths.push(filePath);
	var json = JSON.stringify({'id': this.currentDocId, 'url': url, 'title': title, 'date': date, 'text': text, 'tags': tags});
	this.currentDocId++;
	this.fs.writeFile(filePath, json);
}

Crawler.prototype.GlobalNewsCallback = function (error, res, done) {
	if (error) {
		console.log(error);
		this.QueueGlobalNews();
	} else if (res.options.url == 'http://globalnews.ca/world/') {
		var $ = res.$;
		//queue more links
		var moreStories = $('h3.story-h > a');

		for (var i = 0; i < moreStories.length; i++) {
			if (this.urls.indexOf(moreStories[i].href) < 0) {
				this.urls.push(moreStories[i].href);
				this.crawler.queue([{
					url: moreStories[i].href,
					callback: this.GlobalNewsCallback.bind(this)
				}]);
			}
		}

		var popularStories = $('.popular-now-well > .story a');

		for (var i = 0; i < popularStories.length; i++) {
			if (this.urls.indexOf(popularStories[i].href) < 0) {
				this.urls.push(popularStories[i].href);
				this.crawler.queue([{
					url: popularStories[i].href,
					callback: this.GlobalNewsCallback.bind(this)
				}]);
			}
		}

		this.crawler.queue([{
			url: 'http://globalnews.ca/world/',
			callback: this.GlobalNewsCallback.bind(this)
		}])
	} else {
		var $ = res.$;
		//queue more links
		var moreStories = $('h3.story-h > a');

		for (var i = 0; i < moreStories.length; i++) {
			if (this.urls.indexOf(moreStories[i].href) < 0) {
				this.urls.push(moreStories[i].href);
				this.crawler.queue([{
					url: moreStories[i].href,
					callback: this.GlobalNewsCallback.bind(this)
				}]);
			}
		}

		var editorPicks = $('.slick-slide > a');
		
		for (var i = 0; i < editorPicks.length; i++) {
			if (this.urls.indexOf(editorPicks[i].href) < 0) {
				this.urls.push(editorPicks[i].href);
				this.crawler.queue([{
					url: editorPicks[i].href,
					callback: this.GlobalNewsCallback.bind(this)
				}]);
			}
		}

		var title = $('h1.story-h').text().trim();
		var texts = $('span.gnca-article-story-txt > p');
		var url = res.options.url;
		var fullText = '';

		texts.contents().each(function() {
	        if (this.nodeType == 3 && this.textContent) {
	            fullText += this.textContent.trim();
	        }
	    });

		var dateCreated;
		var dateCreatedString = '';

	    var dates = $('div.meta-bar-time-group > span.meta-bar-date');
	    var times = $('div.meta-bar-time-group > span.meta-bar-time');

	    if (dates && times && dates.length > 0 && times.length > 0) {
	    	var dateString = dates[0].textContent;
	    	var timeString = times[0].textContent;
	    	dateCreatedString = dateString + ' ' + timeString;
	    }

	    dateCreated = new Date(Date.parse(dateCreatedString));

	    var tagElements = $('.story-tags > .story-tag > a');
	    var tags = [];

	    tagElements.contents().each(function() {
	        if (this.nodeType == 3 && this.textContent) {
	            tags.push(this.textContent.trim());
	        }
	    });

		if (url && title && fullText && dateCreated && tags.length > 0) {
			this.WriteNewsEntry(url, title, fullText, dateCreated, tags);
		}
	}

	done();
};

Crawler.prototype.QueueGlobalNews = function () {
	this.crawler.queue([{
		url: 'http://globalnews.ca/world/',
		callback: this.GlobalNewsCallback.bind(this)
		}]);
}

Crawler.prototype.QueueTheGuardianNews = function() {
	this.crawler.queue([{
		url: 'https://www.theguardian.com/world/all',
		callback: this.TheGuardianNewsCallback.bind(this)
	}]);
}

Crawler.prototype.TheGuardianNewsCallback = function (error, res, done) {
	if (error) {
		console.log(error);
		console.log(res.options.url);
	} else if (res.options.url == 'https://www.theguardian.com/world/all' ||
				res.options.url.startsWith('https://www.theguardian.com/world?page=')) {
		var $ = res.$;
		//queue more links
		var moreStories = $('div.fc-item > div.fc-item__container > a');

		for (var i = 0; i < moreStories.length; i++) {
			if (this.urls.indexOf(moreStories[i].href) < 0) {
				this.urls.push(moreStories[i].href);
			
				this.crawler.queue([{
					url: moreStories[i].href,
					callback: this.TheGuardianNewsCallback.bind(this)
				}]);
			}
		}

		var nextButton = $('a[rel="next"].pagination__action--static');

		if (nextButton.length > 0) {
			this.crawler.queue([{
				url: nextButton[0].href,
				callback: this.TheGuardianNewsCallback.bind(this)
			}])
		}
	} else {
		var $ = res.$;
		var title = $('h1.content__headline').text().trim();
		var texts = $('div.content__article-body > p');
		var url = res.options.url;
		var fullText = '';

		texts.contents().each(function() {
	        if (this.nodeType == 3 && this.textContent) {
	            fullText += this.textContent.trim();
	        }
	    });

		var dateCreatedString = $('time.content__dateline-wpd').attr('datetime');
		var dateCreated = new Date(dateCreatedString);

		var tagElements = $('.keyword-list > .inline-list__item > a');
	    var tags = [];

	    tagElements.contents().each(function() {
	        if (this.nodeType == 3 && this.textContent) {
	            tags.push(this.textContent.trim());
	        }
	    });

		if (url && title && fullText && dateCreated && tags.length > 0) {
			this.WriteNewsEntry(url, title, fullText, dateCreated, tags);
		}
	}

	done();
}

module.exports = Crawler;