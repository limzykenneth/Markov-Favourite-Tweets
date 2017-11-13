var express = require("express");
var router = express.Router();
var getFavourites = require("../analyseTweet.js").getFavourites;
var genSentence = require("../analyseTweet.js").generateSentence;

/* GET home page. */
router.get("/", function(req, res, next) {
	res.render("index", { title: "Markov's Favourite Tweet" });
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

module.exports = router;
