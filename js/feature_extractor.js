'use strict';
var path = require('path');
var natural = require('natural');
var fs = require('fs');

function getDirectories (srcpath) {
  return fs.readdirSync(srcpath)
    .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory())
}

Set.prototype.isSuperset = function(subset) {
    for (var elem of subset) {
        if (!this.has(elem)) {
            return false;
        }
    }
    return true;
};

Set.prototype.union = function(setB) {
    var union = new Set(this);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
};

Set.prototype.intersection = function(setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
};

Set.prototype.difference = function(setB) {
    var difference = new Set(this);
    for (var elem of setB) {
        difference.delete(elem);
    }
    return difference;
};

var FeatureExtractor = function (callback) {
	natural.PorterStemmer.attach();
	this.tokenizer = new natural.WordTokenizer();
	this.allFeatureSet = new Set();
	this.testRowsFeturesList = [];
	this.trainingRowFeaturesList = [];
	this.tfidfTops = {};

	var base_folder = "./node_modules/natural/lib/natural/brill_pos_tagger";
	var rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
	var lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
	var defaultCategory = 'N';

	this.tagger = new natural.BrillPOSTagger(lexiconFilename, rulesFilename, defaultCategory, callback);
};

FeatureExtractor.prototype.ExtractCategories = function (rootFolder, isTraining) {
	var categories = getDirectories(rootFolder);
	
	if (isTraining) {
		for (var i = 0; i < categories.length; i++) {
			var tfidf = new natural.TfIdf();
			var newsCategory = categories[i];
			var files = fs.readdirSync(rootFolder + "/" + newsCategory);
			files.forEach(file => tfidf.addFileSync(rootFolder + "/" + newsCategory + "/" + file));
			this.tfidfTops[newsCategory] = tfidf.listTerms(0).splice(0, 1000);
		}

	}
	
	for (var i = 0; i < categories.length; i++) {
		var newsCategory = categories[i];
		var files = fs.readdirSync(rootFolder + "/" + newsCategory);

		files.forEach(file => {
			var text = fs.readFileSync(rootFolder + "/" + newsCategory + "/" + file, "utf8");
			this.AddDocument(text, newsCategory, isTraining);
		});
	}
};

FeatureExtractor.prototype.AddDocument = function (text, category, isTraining) {
	var featuresSet = this.ExtractDocument(text, isTraining, category);
	var features = Array.from(featuresSet);
	features.push(category);

	if (isTraining) {
		this.allFeatureSet = this.allFeatureSet.union(featuresSet);
	}

	if (isTraining) {
		this.trainingRowFeaturesList.push(features);
	} else {
		this.testRowsFeturesList.push(features);
	}

	if (this.trainingRowFeaturesList.length % 100 == 0) {
		console.log(this.trainingRowFeaturesList.length);
		console.log(this.allFeatureSet.size);
	}
};

FeatureExtractor.prototype.ExtractDocument = function (text, isTraining, category) {
	var features = [];
	text = text.toLowerCase();

	// Pos tagger - count part of speech
	var tokens = this.tokenizer.tokenize(text);
	var posTagged = this.tagger.tag(tokens);
	var posEntries = posTagged.map(wordPos => wordPos[1]);
	var posTypes = {};
	var posFeatures = [];

	for (var i = 0; i < posEntries.length; i++) {
		posTypes[posEntries[i]] = 0;
	}

	for (var i = 0; i < posEntries.length; i++) {
		posTypes[posEntries[i]]++;
	}

	for (var type in posTypes) {
		posFeatures.push(type + posTypes[type]);
	}

	// bigrams, trigrams
	var bigrams = natural.NGrams.bigrams(tokens);

	if (category != null) {
		bigrams = bigrams.filter(bigram => bigram.filter(b => this.tfidfTops[category].includes(b)) > 0);
	}
	
	var trigrams = natural.NGrams.trigrams(tokens);
	
	if (category != null) {
		trigrams = trigrams.filter(trigram => trigram.filter(t => this.tfidfTops[category].includes(t)) > 0);
	}

	// stems
	if (category != null) {
		tokens = tokens.filter(token => this.tfidfTops[category].includes(token));
	}

	var stems = tokens.join(' ').tokenizeAndStem();
	

	// collect all features
	features = features
	.concat(bigrams.map(bigram => bigram.join(' ')))
	.concat(trigrams.map(trigram => trigram.join(' ')))
	.concat(posFeatures)
	.concat(stems);

	if (!isTraining) {
		features = features.filter(feature => this.allFeatureSet.has(feature));
	}

	var featuresSet = new Set(features);
	return featuresSet;
};

module.exports = FeatureExtractor;