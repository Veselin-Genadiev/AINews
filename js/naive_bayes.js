'use strict';
var limdu = require('limdu');
var fs = require('fs');

var NaiveBayes  = function (trainSet, testSet) {
	this.trainSet = trainSet;
	this.testSet = testSet;
	this.naiveBayes = null;

	this.Build();
	this.Train();
	this.Test();
};

NaiveBayes.prototype.Build = function () {
	var WordExtractor = function(input, features) {
		input.forEach(feature => features[feature] = 1);
	};

	// Initialize a classifier with the base classifier type and the feature extractor:
	this.naiveBayes = new limdu.classifiers.EnhancedClassifier({
	    classifierType: limdu.classifiers.Bayesian,
	    featureExtractor: WordExtractor
	});
};

NaiveBayes.prototype.Train = function () {
	var trainBatch = this.trainSet.map(function (features) {
		return {input: features, output: features[features.length - 1]};
	});
	
	this.naiveBayes.trainBatch(trainBatch);
};

NaiveBayes.prototype.Test = function () {
	var errors = 0;

	for (var i = 0; i < this.testSet.length; i++) {
		var features = this.testSet[i];
		var testCategory = features.pop();
		var category = this.naiveBayes.classify(features);
		if (category != testCategory) {
			errors++;
		}
	};

	console.log('Accuracy: ' + (this.testSet.length - errors) / this.testSet.length)
};

NaiveBayes.prototype.Classify = function (features) {
	return this.naiveBayes.classify(features);
};

module.exports = NaiveBayes;