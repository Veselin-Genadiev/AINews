'use strict';

var express = require('express');
var app = express();
var Crawler = require('./js/crawler.js');
var craw = new Crawler();
craw.LoadAvailableEntries();
craw.QueueTheGuardianNews();
var ElasticSearch = require('./js/elastic_search.js');
var elastic = new ElasticSearch();
elastic.UpdateIndex();

setTimeout(function () {
	craw.QueueTheGuardianNews();
	elastic.UpdateIndex();
}, 1800000);

app.get('/', function (request, response) {
	 response.sendFile(__dirname + '/index.html');
});

//app.get('/js/crawler.js', function (request, response) {
//	 response.sendFile(__dirname + '/js/crawler.js');
//});

app.listen(3000, function () {
  	console.log('Example app listening on port 3000!');
});