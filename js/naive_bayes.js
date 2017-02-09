'use strict';
var limdu = require('limdu');

var NaiveBayes  = function (trainSet, testSet) {
	this.trainSet = trainSet;
	this.testSet = testSet;
	this.naiveBayes = null;

	this.BuildNaiveBayes();
	this.TrainNaiveBayes();
	//this.CrossValidateNaiveBayes();
};

NaiveBayes.prototype.BuildNaiveBayes = function () {
	var WordExtractor = function(input, features) {
		input.forEach(feature => features[feature] = 1);
	};

	// Initialize a classifier with the base classifier type and the feature extractor:
	this.naiveBayes = new limdu.classifiers.EnhancedClassifier({
	    classifierType: limdu.classifiers.Bayesian,
	    featureExtractor: WordExtractor
	});
};

NaiveBayes.prototype.TrainNaiveBayes = function () {
	var trainBatch = this.trainSet.map(function (features) {
		return {input: features, output: features[features.length - 1]};
	});
	
	this.naiveBayes.trainBatch(trainBatch);
};

NaiveBayes.prototype.CrossValidateNaiveBayes = function () {
	var microAverage = new limdu.utils.PrecisionRecall();
	var macroAverage = new limdu.utils.PrecisionRecall();
	
	var testBatch = this.testSet.map(function (features) {
		return {input: features, output: features[features.length - 1]};
	});

	limdu.utils.test(this.naiveBayes, this.testSet, /* verbosity = */0,
        microAverage, macroAverage);

	macroAverage.calculateMacroAverageStats(numOfFolds);
	console.log("\n\nMACRO AVERAGE:"); console.dir(macroAverage.fullStats());

	microAverage.calculateStats();
	console.log("\n\nMICRO AVERAGE:"); console.dir(microAverage.fullStats());
};

NaiveBayes.prototype.Classify = function (features) {
	return this.naiveBayes.classify(features);
}

module.exports = NaiveBayes;