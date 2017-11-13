require("dotenv").config();
const fetch = require("node-fetch");
const Base64 = require("js-base64").Base64;
const _ = require("lodash");
const rita = require("rita");

const endPointURL = "https://api.twitter.com/1.1/favorites/list.json";
const screenName = "limzykenneth";
const count = 200;

const consumerKey = process.env.ConsumerKey;
const consumerSecret = process.env.ConsumerSecret;
const bearerTokenCred = `${consumerKey}:${consumerSecret}`;
const base64TokenCred = Base64.encode(bearerTokenCred);

let authenticate = fetch("https://api.twitter.com/oauth2/token", {
	method: "post",
	headers: {
		"Authorization": `Basic ${base64TokenCred}`,
		"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
		"Accept-Encoding": "gzip"
	},
	body: "grant_type=client_credentials"
}).then(function(response){
	return response.json();
}).then(function(data){
	if(data.errors) throw new Error(JSON.stringify(data.errors));
	if(data.token_type != "bearer") throw new Error("Unrecognized token type");

	var accessToken = data.access_token;
	return Promise.resolve(accessToken);
});

let getFavourites = function(screenName, count=100, returnSize=5){
	return authenticate.then(function(accessToken){
		var rm = new rita.RiMarkov(3, true, false);
		var reqURL = `${endPointURL}?screen_name=${screenName}&count=${count}`;
		return fetch(reqURL, {
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Accept-Encoding": "gzip"
			}
		}).then(function(response){
			return response.json();
		}).then(function(data){
			if(data.errors) throw new Error(JSON.stringify(data.errors));

			var tweets = [];

			_.each(data, function(el, i){
				if(el.text && el.text.length > 0){
					tweets.push(el.text);
				}
			});

			tweets = _.map(tweets, filterTweets);
			console.log(tweets);

			rm.loadText(tweets.join(" "));

			return Promise.resolve({
				rm: rm,
				returnSize: returnSize
			});
		});
	});
};

function filterTweets(tweet){
	var urlRegex = /(?:(?:http[s]?|ftp):\/)?\/?(?:[^:/\s]+)(?:(?:\/\w+)*\/)(?:[\w\-.]+[^#?\s]+)(?:.*)?(?:#[\w-]+)?/gm;

	var result = tweet.replace(urlRegex, "");

	return result;
}

var generateSentence = function(res){
	return new Promise(function(resolve, reject){
		if(res.rm.ready()){
			resolve(res.rm.generateSentences(res.returnSize));
			return;
		}else{
			var interval = setInterval(function(){
				if(res.rm.ready()){
					resolve(res.rm.generateSentences(res.returnSize));
					clearInterval(interval);
					return;
				}
			}, 100);
		}
	});
};

if (require.main === module) {
	getFavourites(screenName, count).then(function(rm){
		generateSentence(rm).then(function(sentences){
			console.log(sentences);
		});
	}).catch(function(err){
		console.log(err);
	});
} else {
	module.exports = {
		getFavourites: getFavourites,
		generateSentence: generateSentence
	};
}