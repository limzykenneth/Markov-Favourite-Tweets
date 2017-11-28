require("dotenv").config();
const fetch = require("node-fetch");
const Base64 = require("js-base64").Base64;
const _ = require("lodash");
const rita = require("rita");
const cache = require("memory-cache");

// For local testing only
const screenName = process.env.AccountHandle;
const count = 200;

const endPointURL = "https://api.twitter.com/1.1/favorites/list.json";
const consumerKey = process.env.ConsumerKey;
const consumerSecret = process.env.ConsumerSecret;
const bearerTokenCred = `${consumerKey}:${consumerSecret}`;
const base64TokenCred = Base64.encode(bearerTokenCred);

// Authenticate with twitter server, return promise with accessToken
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

// Get favourited tweets of the user given by screenName
let getFavourites = function(screenName, count=100, returnSize=5){
	var rm = new rita.RiMarkov(3, true, false);

	if(cache.get(screenName) !== null){
		rm.loadText(cache.get(screenName));

		return Promise.resolve({
			rm: rm,
			returnSize: returnSize
		});
	}else{
		return authenticate.then(function(accessToken){
			var reqURL = `${endPointURL}?screen_name=${screenName}&count=${count}&tweet_mode=extended`;
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
					if(el.full_text && el.full_text.length > 0){
						tweets.push(el.full_text);
					}
				});

				tweets = _.map(tweets, filterTweets);
				var text = tweets.join(" ");

				rm.loadText(text);
				cache.put(screenName, text, 5*60*1000);

				return Promise.resolve({
					rm: rm,
					returnSize: returnSize
				});
			}).catch(function(err){
				console.log(err.stack);
			});
		});
	}
};

// Utility function to filter tweets content
function filterTweets(tweet){
	// Remove URLS, tend to mess up the Markov Chain
	var urlRegex = /(?:(?:http[s]?|ftp):\/)?\/?(?:[^:/\s]+)(?:(?:\/\w+)*\/)(?:[\w\-.]+[^#?\s]+)(?:.*)?(?:#[\w-]+)?/gm;

	var result = tweet.replace(urlRegex, "");

	return result;
}

// generateSentence based on the favourited tweets
let generateSentence = function(res){
	return new Promise(function(resolve, reject){
		// Removing spaces left after certain symbols
		var symbolsRegex = /([#$&]) (.+?)\b/gm;

		if(res.rm.ready()){
			var sentences = [];
			while(res.returnSize-sentences.length > 0){
				var s = res.rm.generateSentences(res.returnSize-sentences.length).map(function(sentence){
					var sen = sentence.replace(symbolsRegex, "$1$2");
					return sen;
				}).filter(function(sentence){
					return sentence.length <= (140 - (process.env.AccountHandle.length + 6));
				});
				sentences = sentences.concat(s);
			}

			// What is returned here is NOT sanitized,
			// the frontend should sanitize appropriately by HTML encoding or URL encoding
			resolve(sentences);
			return;
		}else{
			var interval = setInterval(function(){
				if(res.rm.ready()){
					var sentences = [];
					while(res.returnSize-sentences.length > 0){
						var s = res.rm.generateSentences(res.returnSize-sentences.length).map(function(sentence){
							var sen = sentence.replace(symbolsRegex, "$1$2");
							return sen;
						}).filter(function(sentence){
							return sentence.length <= 140;
						});
						sentences = sentences.concat(s);
					}


					// What is returned here is NOT sanitized,
					// the frontend should sanitize appropriately by HTML encoding or URL encoding
					resolve(sentences);
					clearInterval(interval);
					return;
				}
			}, 100);
		}
	});
};

// If running locally
if (require.main === module) {
	getFavourites(screenName, count).then(function(rm){
		generateSentence(rm).then(function(sentences){
			console.log(sentences);
		});
	}).catch(function(err){
		console.log(err);
	});

// If required as a module
} else {
	module.exports = {
		getFavourites: getFavourites,
		generateSentence: generateSentence
	};
}