'use strict';

var Crawler = function () {
	var Crawler = require('crawler');
	
	this.crawler = new Crawler({
		maxConnections: 3,
		rateLimit: 2000,
		skipDuplicates: true,
		jQuery: 'cheerio',
		callback: function (error, res, done) {
			if (error) {
				console.log(error);
			} else {
				console.log(res);
			}

			done();
		}
	});

	this.url = require('url');
};

Crawler.prototype.GlobalNewsCallback = function (error, res, done) {
	if (error) {
		console.log(error);
	} else if (res.options.url == 'http://globalnews.ca/world/') {
		var $ = res.$;

		setInterval(function (jQuery) {
			var moreStories = jQuery('h3.story-h > a');

			for (var i = 0; i < moreStories.length; i++) {
				this.crawler.queue([{
					url: moreStories[i].attribs.href,
					callback: this.GlobalNewsCallback.bind(this)
				}]);
			}

		}.bind(this, $), 3000);
	} else {
		var $ = res.$;
		var title = $('h1.story-h').text();
		var texts = $('span.gnca-article-story-txt > p');
		var url = res.options.url;

		console.log('tick tack');

		var fullText = '';

		texts.contents().each(function() {
	        if (this.nodeType == 3 && this.data) {
	            fullText += this.data.trim();
	        }
	    });

		var dateCreated;
		var dateModified;
		var dateCreatedString = '';
		var dateModifiedString = '';

	    var dates = $('div.meta-bar-time-group > span.meta-bar-date');
	    var times = $('div.meta-bar-time-group > span.meta-bar-time');

	    if (dates && times && dates.length > 0 && times.length > 0) {
	    	var dateString = dates[0].children[0].data;
	    	var timeString = times[1].children[0].data;
	    	dateCreatedString = dateString + ' ' + timeString;
	    }

	    if (dates && times && dates.length > 0 && times.length > 0) {
	    	var dateString = dates[1].children[0].data;
	    	var timeString = times[1].children[0].data;
	    	dateModifiedString = dateString + ' ' + timeString;
	    }

	    dateCreated = new Date(Date.parse(dateCreatedString));
	    dateModified = new Date(Date.parse(dateModifiedString));

		if (url && title && fullText && dateCreated && dateModified) {
			console.log(url);
			console.log(title);
			console.log(fullText);
			console.log(dateCreated);
			console.log(dateModified);
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

module.exports = Crawler;