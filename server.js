'use strict';

var express = require('express');
var app = express();
var Crawler = require('./js/crawler.js');
var craw = new Crawler();
craw.QueueGlobalNews();

app.get('/', function (request, response) {
	 response.sendFile(__dirname + '/index.html');
});

//app.get('/js/crawler.js', function (request, response) {
//	 response.sendFile(__dirname + '/js/crawler.js');
//});

app.listen(3000, function () {
  	console.log('Example app listening on port 3000!');
});