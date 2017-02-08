'use strict';

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
	this.natural = require('natural');
	this.fs = require('fs');
	this.natural.PorterStemmer.attach();
	this.tokenizer = new this.natural.WordTokenizer();
	this.allFeatureSet = new Set();
	this.rowFeturesList = [];

	var base_folder = "./node_modules/natural/lib/natural/brill_pos_tagger";
	var rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
	var lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
	var defaultCategory = 'N';

	this.tagger = new this.natural.BrillPOSTagger(lexiconFilename, rulesFilename, defaultCategory, callback);
};

FeatureExtractor.prototype.ExtractDocument = function (text, category, addToFeatureVector) {
	var features = [];

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
	var bigrams = this.natural.NGrams.bigrams(tokens);
	var trigrams = this.natural.NGrams.trigrams(tokens);

	// stems
	var stems = text.tokenizeAndStem();
	

	// collect all features
	features = features.concat(bigrams.map(bigram => bigram.join(' ')))
	.concat(trigrams.map(trigram => trigram.join(' ')))
	.concat(posFeatures)
	.concat(stems);
	var featuresSet = new Set(features);
	features = Array.from(featuresSet);

	if (addToFeatureVector) {
		this.allFeatureSet = this.allFeatureSet.union(featuresSet);
	}

	features.push(category);
	this.rowFeturesList.push(features);
};

module.exports = FeatureExtractor;