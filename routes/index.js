var express = require("express");
var router = express.Router();
var getFavourites = require("../analyseTweet.js").getFavourites;
var genSentence = require("../analyseTweet.js").generateSentence;
var Promise = require("bluebird");
var redis = require("redis");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
var	client = redis.createClient();

client.on("error", function(err){
	throw err;
});

/* GET home page. */
router.get("/", function(req, res, next) {
	res.render("index", { title: "We are what we like." });
});

router.post("/", function(req, res, next){
	getFavourites(req.body.handle, req.body.sampleSize, req.body.returnSize).then(genSentence).then(function(sentences){
		res.json(sentences);
	});
});

router.get("/me", function(req, res, next){
	getFavourites("limzykenneth", 200).then(genSentence).then(function(sentences){
		res.json(sentences);
	});
});

router.post("/tweeted", function(req, res, next){
	// Save tweet into Redis store with the tweet as the key
	client.setexAsync(req.body.tweet, 240, Date.now()).then(function(res){
		// Should say "OK"
		console.log(res);
	}).catch(function(err){
		next(err);
	});
	res.json(["liked"]);
});

module.exports = router;
