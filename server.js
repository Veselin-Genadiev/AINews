'use strict';

var express = require('express');
var app = express();

var natural = require('natural');

var Crawler = require('./js/crawler.js');
var craw = new Crawler();
craw.LoadAvailableEntries();
craw.QueueTheGuardianNews();

var ElasticSearch = require('./js/elastic_search.js');
var elastic = new ElasticSearch();

var targz = require('tar.gz');
var fs = require('fs');

var ImageRetriever = require('./js/image_retriever.js');
var imr = new ImageRetriever();

var FeatureExtractor = require('./js/feature_extractor.js');
var NaiveBayes = require('./js/naive_bayes.js');
var naiveBayes = null;

var ft = new FeatureExtractor(function(error) {
	if (error) {
		console.log(error);
	} else {
		// Extract 20newsgroup
		if (!fs.existsSync('20newsgroup')) {
			console.log('Extracting 20newsgroup...');

			targz().extract('20news-bydate.tar.gz', '20newsgroup', function(err){
			  if(err)
			    console.log('Something is wrong ', err.stack);

			  console.log('Extracted 20newsgroup!');
			});
		}

		// Extract features for all documents.
		var extractedTrainSetFolder = '20newsgroupextracted/20news-bydate-train';
		var extractedTestSetFolder = '20newsgroupextracted/20news-bydate-test';

		var trainSetFolder = '20newsgroup/20news-bydate-train';
		var testSetFolder = '20newsgroup/20news-bydate-test';

		ft.LoadExtractedCategories(extractedTrainSetFolder, true);
		ft.LoadExtractedCategories(extractedTestSetFolder, false);

		if (!fs.existsSync('20newsgroupextracted')) {
			fs.mkdirSync('20newsgroupextracted');
		}
		
		ft.ExtractCategories(trainSetFolder, extractedTrainSetFolder, true);
		ft.SelectFeatures();
		ft.ExtractCategories(testSetFolder, extractedTestSetFolder, false);

		var trainingSet = ft.GetTrainingRowsFeatures();
		var testSet = ft.GetTestRowsFeatures();

		naiveBayes = new NaiveBayes(trainingSet, testSet);

		elastic.UpdateIndex();
	}
});

var bodyParser = require('body-parser');

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

setTimeout(function () {
	craw.QueueTheGuardianNews();
	elastic.UpdateIndex();
}, 1800000);

app.get('/', function (request, response) {
	 response.sendFile(__dirname + '/index.html');
});

app.get('/css/index.css', function (request, response) {
	 response.sendFile(__dirname + '/css/index.css');
});

app.get('/js/index.js', function (request, response) {
	 response.sendFile(__dirname + '/js/index.js');
});

app.post('/query', function(req, res) {
    var query = req.body.query;

    elastic.Search(query).then(response => {
    	var hits = [];

    	response.hits.hits.forEach((hit, index) => {
    		hit._source.text = '';
			hits.push(hit._source);
		});

    	res.send(hits);
    });
});

app.post('/images', function (req, res) {
	var id = req.body.id;
	var json = JSON.parse(fs.readFileSync('./docs/' + id + '.txt', "utf8"));

	imr.GetPhotos(json.tags, function (photos) {
		res.send(photos);
	});
});

app.post('/category', function (req, res) {
	var id = req.body.id;
	var json = JSON.parse(fs.readFileSync('./docs/' + id + '.txt', "utf8"));
	var text = json.text;
	var features = ft.ExtractDocument(text);
	var documentCategory = null;

	if (naiveBayes != null) {
		documentCategory = naiveBayes.Classify(features);
	}

	res.send(documentCategory);
});

var categories = ['alt.atheism', 'comp.graphics', 'comp.os.ms-windows.misc', 'comp.sys.ibm.pc.hardware', 'comp.sys.mac.hardware',
'comp.windows.x', 'misc.forsale', 'rec.autos', 'rec.motorcycles', 'rec.sport.baseball', 'rec.sport.hockey', 'sci.crypt', 'sci.electronics',
'sci.med', 'sci.space', 'soc.religion.christian', 'talk.politics.guns', 'talk.politics.mideast', 'talk.politics.misc', 'talk.religion.misc'];

for (var i = 0; i < categories.length ; i++) {
	var imageCategory = categories[i];
	app.get('/images/' + imageCategory + '.jpg', function (req, res) {
		console.log(this);
		res.sendFile(__dirname + '/images/' + this + '.jpg');
	}.bind(imageCategory));
};

app.get('/js/jquery.min.js', function (request, response) {
	 response.sendFile(__dirname + '/js/jquery.min.js');
});

app.listen(3000, function () {
  	console.log('Example app listening on port 3000!');
});