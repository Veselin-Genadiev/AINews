var ImageRetriever = function () {
	var fs = require('fs');
	var apiKey = fs.readFileSync('flickr.txt', "utf8");
	var Flickr = require("node-flickr");
	var keys = {"api_key": apiKey}
	this.flickr = new Flickr(keys);
	this.photos = [];
	this.pairs = [];
};

Array.prototype.pairs = function () {
    var pairs = [];
    for (var i = 0; i < this.length - 1; i++) {
        for (var j = i + 1; j < this.length; j++) {
        	pairs.push([this[i], this[j]]);
        }
    }

    return pairs
};


ImageRetriever.prototype.GetPhotos = function (tags, callback) {
    this.photos = [];
    this.pairs = [];
	
	var actualCallback = function (err, result) {
	    this.pairs.pop();

	    if (err) return console.error(err);

	    for (var i = 0; i <= result.photos.photo.length; i++) {
	    	var photo = result.photos.photo[i];
	
	    	if (photo) {
		    	var url = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
		    	this.photos.push(url);
	    	}
	    };

	    if (this.pairs.length == 0 && callback) {
		    callback(this.photos);
	    }
	};
	
	this.pairs = tags.pairs();

	for (var i = 0; i < this.pairs.length; i++) {
		this.flickr.get("photos.search", {"tags": this.pairs[i].join(), "sort": "relevance"}, actualCallback.bind(this));
	}
};

module.exports = ImageRetriever;