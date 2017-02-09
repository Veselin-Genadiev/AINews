'use strict';
var path = require('path');
var natural = require('natural');
var fs = require('fs');
//var categories = ['alt.atheism', 'comp.graphics', 'comp.os.ms-windows.misc', 'comp.sys.ibm.pc.hardware', 'comp.sys.mac.hardware',
//'comp.windows.x', 'misc.forsale', 'rec.autos', 'rec.motorcycles', 'rec.sport.baseball', 'rec.sport.hockey', 'sci.crypt', 'sci.electronics',
//'sci.med', 'sci.space', 'soc.religion.christian', 'talk.politics.guns', 'talk.politics.mideast', 'talk.politics.misc', 'talk.religion.misc'];

var categories = ['rec.autos', 'rec.sport.baseball', 'sci.electronics', 'sci.space', 'talk.politics.misc', 'talk.religion.misc'];

function getDirectories (srcpath) {
	return categories;
 // return fs.readdirSync(srcpath)
  //  .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory())
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
	this.testRowsTfidfIndexes = [];
	this.trainingRowsTfidfIndexes = [];
	this.trainingRowsFeatures = [];
	this.testRowsFeatures = [];
	this.tfidf = new natural.TfIdf();
	this.documentIndexes = {};
	this.currentDocumentIndex = -1;

	var base_folder = "./node_modules/natural/lib/natural/brill_pos_tagger";
	var rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
	var lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
	var defaultCategory = 'N';

	this.tagger = new natural.BrillPOSTagger(lexiconFilename, rulesFilename, defaultCategory, callback);
};

FeatureExtractor.prototype.SelectFeatures = function (tfidfFolder) {
	console.log(this.trainingRowsTfidfIndexes.length);

	if (!fs.existsSync(tfidfFolder)) {
		fs.mkdirSync(tfidfFolder);
	}

	for (var i = 0; i < categories.length; i++) {
		var newsCategory = categories[i];

		if (!fs.existsSync(tfidfFolder + '/' + newsCategory)) {
			fs.mkdirSync(tfidfFolder + '/' + newsCategory);
		}
	}

	var allRowsFeatures = this.trainingRowsTfidfIndexes.map(index => {
		console.log(this.trainingRowsFeatures.length);
		var terms = this.tfidf.listTerms(index.index).splice(0, 15).map(tf => tf.term);
		terms.push(index.category);
		var text = terms.join(' ');
		fs.writeFileSync(tfidfFolder + '/' + index.category + '/' + index.file, text);
		this.trainingRowsFeatures.push(terms);
		return terms;
	});

	console.log('set start');
	var flatten = [].concat.apply([], allRowsFeatures);
	this.allFeatureSet = new Set(flatten);
	console.log('set end');
};

FeatureExtractor.prototype.GetTestRowsFeatures = function () {
	return this.testRowsFeatures;
};

FeatureExtractor.prototype.GetTrainingRowsFeatures = function () {
	return this.trainingRowsFeatures;
};

FeatureExtractor.prototype.LoadExtractedTfIdfs = function (trainFolder, tfidfFolder) {
	var filePaths = [];

	if (fs.existsSync(tfidfFolder)) {
		for (var i = 0; i < categories.length; i++) {
			var newsCategory = categories[i];

			if (fs.existsSync(trainFolder + '/' + newsCategory)) {
				var files = fs.readdirSync(trainFolder + "/" + newsCategory);


				files.forEach(file => {
					filePaths.push(tfidfFolder + '/' + newsCategory + '/' + file);
				});
			}
		}
	}

	if (filePaths.lengt == 0 || !filePaths.every(path => fs.existsSync(path))) {
		return false;
	}

	filePaths.forEach(path => {
		var text = fs.readFileSync(path, 'utf8');
		this.trainingRowsFeatures.push(text.split(' '));
	});

	var flatten = [].concat.apply([], this.trainingRowsFeatures);
	this.allFeatureSet = new Set(flatten);
	return true;
};

FeatureExtractor.prototype.LoadExtractedCategories = function (rootFolder, isTraining) {
	if (fs.existsSync(rootFolder)) {
		for (var i = 0; i < categories.length; i++) {
			var newsCategory = categories[i];

			if (fs.existsSync(rootFolder + '/' + newsCategory)) {
				var files = fs.readdirSync(rootFolder + "/" + newsCategory);

				files.forEach(file => {
					if (fs.existsSync(rootFolder + "/" + newsCategory + "/" + file)) {
						var text = fs.readFileSync(rootFolder + "/" + newsCategory + "/" + file, "utf8");

						if (isTraining) {
							this.currentDocumentIndex++;
							this.documentIndexes[file] = this.currentDocumentIndex;
							this.tfidf.addDocument(text);
							this.trainingRowsTfidfIndexes.push({ index: this.currentDocumentIndex, category: newsCategory, file: file });
						} else {
							var features = text.split(' ');
							features.push(newsCategory);
							this.testRowsFeatures.push(features);
							this.testRowsTfidfIndexes.push({ index: this.currentDocumentIndex, category: newsCategory, file: file });
						}
					}
				});
			}
		}
	}
};

FeatureExtractor.prototype.ExtractCategories = function (rootFolder, rootFolderExtracted, isTraining) {
	if (!fs.existsSync(rootFolderExtracted)) {
		fs.mkdirSync(rootFolderExtracted);
	}
	
	for (var i = 0; i < categories.length; i++) {
		var newsCategory = categories[i];

		var files = fs.readdirSync(rootFolder + "/" + newsCategory);

		if (!fs.existsSync(rootFolderExtracted + "/" + newsCategory)) {
			fs.mkdirSync(rootFolderExtracted + "/" + newsCategory);
		}

		files.forEach(file => {
			var text = fs.readFileSync(rootFolder + "/" + newsCategory + "/" + file, "utf8");
			var extractedPath = rootFolderExtracted + "/" + newsCategory + "/" + file;
			
			if (!fs.existsSync(extractedPath)) {
				var features = this.ExtractDocument(text, isTraining);
				var text = features.join(' ');
				fs.writeFileSync(extractedPath, text);

				
				if (isTraining) {
					this.currentDocumentIndex++;
					this.documentIndexes[file] = this.currentDocumentIndex;
					this.tfidf.addDocument(text);
					this.trainingRowsTfidfIndexes.push({ index: this.currentDocumentIndex, category: newsCategory, file: file });
				} else {
					features.push(newsCategory);
					this.testRowsFeatures.push(features);
					this.testRowsTfidfIndexes.push({ index: this.currentDocumentIndex, category: newsCategory, file: file });
				}
			}
		});
	}
};

FeatureExtractor.prototype.ExtractDocument = function (text, isTraining) {
	var features = [];
	text = text.substring(text.indexOf("\n\n") + 1).toLowerCase();

	// Pos tagger - count part of speech
	var tokens = this.tokenizer.tokenize(text);
	var posTagged = this.tagger.tag(tokens);
	var posWords = posTagged.map(wordPos => wordPos[0]);
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
	bigrams = bigrams.filter(bigram => posWords.includes(bigram[0]) || posWords.includes(bigram[1]));

	var trigrams = natural.NGrams.trigrams(tokens);
	trigrams = trigrams.filter(trigram => posWords.includes(trigram[0]) || posWords.includes(trigram[1]) || posWords.includes(trigram[2]));

	// stems
	tokens = posWords;
	var stems = tokens.join(' ').tokenizeAndStem();

	// collect all features
	features = features
	.concat(bigrams.map(bigram => bigram.join('_')))
	.concat(trigrams.map(trigram => trigram.join('_')))
	.concat(posFeatures)
	.concat(stems);

	if (!isTraining) {
		features = features.filter(feature => this.allFeatureSet.has(feature));
	}

	return features;
};

module.exports = FeatureExtractor;