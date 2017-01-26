'use strict';

var Crawler = function () {
	var Crawler = require('crawler');
	var jsdom = require('jsdom');

	this.urls = [];
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

Crawler.prototype.GlobalNewsCallback = function (error, res, done) {
	if (error) {
		console.log(error);
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

		var title = $('h1.story-h').text();
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

		if (url && title && fullText && dateCreated) {
			console.log(title);
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
	} else if (res.options.url == 'https://www.theguardian.com/world/all' ||
				res.options.url.startsWith('https://www.theguardian.com/world?page=')) {
		var $ = res.$;
		//queue more links
		var moreStories = $('div.fc-item > div.fc-item__container > a');

		for (var i = 0; i < moreStories.length; i++) {
			this.crawler.queue([{
				url: moreStories[i].href,
				callback: this.TheGuardianNewsCallback.bind(this)
			}]);
		}

		var nextButton = $('a.pagination__action--static');
		if (nextButton.length == 1) {
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

		if (title && fullText && url && dateCreated) {
			console.log(title);
			console.log(dateCreated);
		}
	}

	done();
}

module.exports = Crawler;