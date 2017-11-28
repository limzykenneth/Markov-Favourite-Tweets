require("dotenv").config();
var Twit = require("twit");
var Promise = require("bluebird");
var redis = require("redis");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
var client;
if(process.env.NODE_ENV === "production"){
	client = redis.createClient(process.env.REDIS_URL);
}else{
	client = redis.createClient();
}
const _ = require("lodash");
const async = require("async");

var T = new Twit({
	consumer_key:         process.env.ConsumerKey,
	consumer_secret:      process.env.ConsumerSecret,
	access_token:         process.env.AccessToken,
	access_token_secret:  process.env.AccessTokenSecret,
	timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

var tweetMonitor = function(){
	this.interval = null;
};

tweetMonitor.prototype.setInterval = function(){
	this.interval = setInterval(function(self){
		return function(){
			self.getMentions();
		};
	}(this), 30 * 1000);
};

tweetMonitor.prototype.clearInterval = function(){
	clearInterval(this.interval);
	this.interval = null;
};

tweetMonitor.prototype.getMentions = function(){
	T.get("statuses/mentions_timeline").then((result) => {
		// Search for matches between what's in redis and what's here
		// Store complete tweet in matches array
		var matches = result.data;
		// Simple Regex to pare down tweets that we want to look at
		var viaRegex = new RegExp(` via @${process.env.AccountHandle}$`, "g");
		matches = matches.filter(function(tweet){
			return viaRegex.test(tweet.text);
		});

		// Filter tweets to those in Redis (ie. we want to like)
		async.each(matches, (match, cb) => {
			// Find the tweet in Redis
			client.getAsync(match.text).then((res) => {
				if(res !== null){
					// Like the tweet
					// If found, call callback with no arguments
					this.likeMatch(match).then(cb);
				}
			}).catch(function(err){
				cb(err);
			});
		}, function(err){
			if(err) throw err;
		});
	}).catch(function(err){
		throw err;
	});
};

// Like the tweet, return promise
tweetMonitor.prototype.likeMatch = function(match){
	return T.post("favorites/create", {id: match.id_str}).then(function(res){
		// Check for errors returned by the endpoint
		if(res.data.errors === undefined){
			// Delete the tweet from Redis
			return client.delAsync(match.text);
		}else{
			return Promise.reject(new Error(res.data.errors));
		}
	});
};

module.exports = tweetMonitor;