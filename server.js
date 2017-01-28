'use strict';

var express = require('express');
var app = express();
var Crawler = require('./js/crawler.js');
var craw = new Crawler();
craw.LoadAvailableEntries();
//craw.QueueTheGuardianNews();
var ElasticSearch = require('./js/elastic_search.js');
var elastic = new ElasticSearch();
//elastic.UpdateIndex();
var fs = require('fs');;
var ImageRetriever = require('./js/image_retriever.js');
var imr = new ImageRetriever();

var bodyParser = require('body-parser')

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

app.get('/js/jquery.min.js', function (request, response) {
	 response.sendFile(__dirname + '/js/jquery.min.js');
});

app.listen(3001, function () {
  	console.log('Example app listening on port 3000!');
});