var ElasticSearch = function () {
	this.elastic = require('elasticsearch');
	this.fs = require('fs');

	this.client = new this.elastic.Client({
	  host: 'localhost:9200',
	  log: 'error'
	});
};

ElasticSearch.prototype.Search = function(terms) {
	var searchBody = {
		"size" : 20,
		"query": {
		    "multi_match" : {
		      "query": terms,
		      "fields": [ "title", "tags" ] ,
		  	  "fuzziness": 2
		    }
		  }
		};

	return this.client.search({index: 'news', type: "article", body: searchBody});
};

ElasticSearch.prototype.DeleteIndex = function() {
	return this.client.indices.delete({index: "news"});
};

ElasticSearch.prototype.CreateIndex = function() {
	return this.client.indices.create({
		index: "news",
		body: {
			"mappings": {
		      "article": {
		        "properties": {
		          "date": {
		            "type": "date"
		          },
		          "id": {
		            "type": "long"
		          },
		          "tags": {
		            "type": "text",
		            "fields": {
		              "keyword": {
		                "type": "keyword",
		                "ignore_above": 256
		              }
		            }
		          },
		          "title": {
		            "type": "text",
		            "fields": {
		              "keyword": {
		                "type": "keyword",
		                "ignore_above": 256
		              }
		            }
		          },
		          "url": {
		            "type": "text",
		            "fields": {
		              "keyword": {
		                "type": "keyword",
		                "ignore_above": 256
		              }
		            }
		          }
		        }
		      }
		    },
		    "settings": {
		    	"index": {
			        "number_of_shards": "5",
			        "number_of_replicas": "1"
			    },
			    "analysis": {
			      "filter": {
			        "english_stop": {
			          "type":       "stop",
			          "stopwords":  ["a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with"],
			        },
			        "english_stemmer": {
			          "type":       "stemmer",
			          "language":   "english"
			        },
			        "english_possessive_stemmer": {
			          "type":       "stemmer",
			          "language":   "possessive_english"
			        }
			      },
			      "analyzer": {
			        "english": {
			          "tokenizer":  "standard",
			          "filter": [
			            "english_possessive_stemmer",
			            "lowercase",
			            "english_stop",
			            "english_stemmer"
			          ]
			        }
			      }
			    }
			}
		}
	});
};

ElasticSearch.prototype.UpdateIndex = function() {
	return this.client.indices.exists({index: 'news'}).then((indexExists => {
		if (indexExists) {
			this.DeleteIndex().then((deleteResponse => {
				this.CreateIndex().then((createResponse => {
					this.BulkInsertDocuments();
				}).bind(this))
				.catch(console.log);
			}).bind(this))
		} else {
			this.CreateIndex().then((createResponse => {
				this.BulkInsertDocuments();
			}).bind(this))
			.catch(console.log);
		}
	}).bind(this))
	.catch(console.err);
};

ElasticSearch.prototype.BulkInsertDocuments = function () {
	var jsons = [];
	var files = this.fs.readdirSync('./docs/');

	if (files && files.length > 0) {
		files.forEach(file => {
			var content = this.fs.readFileSync('./docs/' + file, "utf8");
			var json = JSON.parse(content);
			delete json.text;
			jsons.push(json);
		});
	}

	var index = 'news';
	var type = 'article';
	var bulkBody = [];

	jsons.forEach(json => {
		bulkBody.push({
			index: {
				_index: index,
				_type: type,
				_id: json.id
			}
		});

		bulkBody.push(json);
	});

	this.client.bulk({body: bulkBody})
	.then(response => {
	    var errorCount = 0;
	    
	    response.items.forEach(item => {
	      if (item.index && item.index.error) {
	        console.log(++errorCount, item.index.error);
	      }
	    });

	    console.log(
	      'Successfully indexed ' + data.length - errorCount +
	       ' out of ' + data.length + ' items'
	    );
  	})
  	.catch(console.err);
};

module.exports = ElasticSearch;