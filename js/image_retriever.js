var ImageRetriever = function () {
	var fs = require('fs');
	var apiKey = fs.readFileSync('flickr.txt', "utf8");
	var Flickr = require("node-flickr");
	var keys = {"api_key": apiKey}
	this.flickr = new Flickr(keys);
};

ImageRetriever.prototype.GetPhotos = function (tags, callback) {
	var actualCallback = function (err, result) {
	    if (err) return console.error(err);

	    var photos = [];

	    for (var i = 0; i <= result.photos.photo.length; i++) {
	    	var photo = result.photos.photo[i];
	
	    	if (photo) {
		    	var url = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
		    	photos.push(url);
	    	}
	    };

	    if (callback) {
		    callback(photos);
	    }
	};
	
	this.flickr.get("photos.search", {"tags": tags.join()}, actualCallback);
};

module.exports = ImageRetriever;