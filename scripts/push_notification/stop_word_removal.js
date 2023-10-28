const XLSX = require('xlsx');
const aws = require('aws-sdk');
const bluebird = require('bluebird');
const fs = require('fs');
const _ = require('lodash')
const filePath = './stop_words.xlsx';
const bucketName = 'doubtnut-static';
const key = 'meta_info/stock_stop_words_v1.xlsx';
// require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
// console.log(config)
aws.config.setPromisesDependency(bluebird);
const redis = require('redis');
bluebird.promisifyAll(redis);
aws.config.update({
	accessKeyId: config.aws_access_id,
	secretAccessKey: config.aws_secret,
	region: config.aws_region,
	signatureVersion: config.aws_signature_version
});
var s3 = new aws.S3();
console.log(config.redis.host)
const redisClient = redis.createClient({host: config.redis.host});

const s3download = (bucketName, keyName, localDest) => {

	if (typeof localDest == 'undefined') {
		localDest = keyName;
	}

	let params = {
		Bucket: bucketName,
		Key: keyName
	};

	let file = fs.createWriteStream(localDest);

	return new Promise((resolve, reject) => {
		s3.getObject(params).createReadStream()
		.on('end', () => {
			return resolve();
		})
		.on('error', (error) => {
			return reject(error);
		}).pipe(file);
	});
};
let blocked = ['Input - Team', 'Std Stock/Stop Work dictionary', 'word', 'Source']
async function main () {
	try {

		// download file from s3
		// await s3download(bucketName, key, filePath)
		// //read file
		// var buf = fs.readFileSync(filePath);
		// var wb = XLSX.read(buf, {type: 'buffer'});
		// let listObject = {}
		// listObject.stopWordList = []
	    // listObject.stopPhraseList = []
		// let stopWordList = [];
		// let stopPhraseList = [];
		// //create stop word array
		// for (let i = 0; i < wb.Strings.length; i++) {
		// 	if (!_.includes(blocked,wb.Strings[i].t)) {
		// 		let breakString = wb.Strings[i].t.split(" ")
		// 		let length = breakString.length
		// 		let obj = {}
		// 		obj.length = length
		// 		wb.Strings[i].t = wb.Strings[i].t.replace("’", "'")
		// 		obj.value = wb.Strings[i].t
		// 		if(length > 1){
		// 			listObject.stopPhraseList.push(obj)
		// 		}else{
		// 			listObject.stopWordList.push(obj)
		// 		}
		// 		// wb.Strings[i].t = wb.Strings[i].t.replace("’", "'")
		// 		// stopWordList.push(wb.Strings[i].t);
		//
		// // 		//replace few mapping
		//
		// 	}
		//
		// }
		// console.log(listObject)
		//set value in redis
		// await redisClient.hsetAsync('meta_info', 'stock_word_list', JSON.stringify(listObject))
		let stopWordList =  await redisClient.hgetAsync('meta_info', 'stock_word_list')
		stopWordList = JSON.parse(stopWordList)
		console.log(stopWordList)
		// console.log('DONE')
		let ocrString = '[" The value of "int_(0)^(2)[sin((x)/(12))+cos((x)/(12))]{x}dx" where I lenctes the geater integer "],[" function and "{-}" denotes the factional part is "]'
		let cleanedOcr = removeStopEntityWrapper(ocrString, stopWordList);

		console.log(cleanedOcr)
		console.log(ocrString)
	} catch(e) {
		console.log('Error: ')
		console.log(e)
	}
}

main();
function removeStopEntityWrapper(cleanedOcr, stopEntity){
	cleanedOcr = removePhrases(cleanedOcr,stopEntity.stopPhraseList)
	cleanedOcr = removeStopWords(cleanedOcr,stopEntity.stopWordList)
	return cleanedOcr
}

function removePhrases (cleansed_string,stop_phrases){
	for (let i = 0; i < stop_phrases.length; i++) {
		let stopPhrase = stop_phrases[i].value
		let rx = new RegExp(stopPhrase, 'gi')
		cleansed_string = cleansed_string.replace(rx, '');
	}
	return cleansed_string.replace(/^\s+|\s+$/g, '');
}

function removeStopWords (cleansed_string, stop_words) {
	for(let i=0;i<stop_words.length;i++){
		let stopWords = stop_words[i].value
		let pattern = '\\b'+stopWords+'\\b';

		let rx = new RegExp(pattern, 'gi')
		// console.log(`/\b(${stopWords})\b/`)
		// cleansed_string = cleansed_string.replace(`/\b(${stopWords})\b/`,'')
		cleansed_string = cleansed_string.replace(rx, '');
	}
	return cleansed_string.replace(/^\s+|\s+$/g, '');
}
	// console.log(stop_words)
	// var x;
	// var y;
	// var word;
	// var stop_word;
	// var regex_str;
	// var regex;
	// // Split out all the individual words in the phrase
	// words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g);
	// // Review all the words
	// for (x = 0; x < words.length; x++) {
	// 	// For each word, check all the stop words
	// 	for (y = 0; y < stop_words.length; y++) {
	// 		// Get the current word
	// 		word = words[x].replace(/\s+|[^a-z]+/ig, '');	// Trim the word and remove non-alpha
    //         // stop_words[y] = stop_words[y].value
	// 		// Get the stop word
	// 		stop_word = stop_words[y].value
	//
	// 			stop_word1 = stop_words[y].value.replace(/\s+|[^a-z]+/ig, '')
	// 			// If the word matches the stop word, remove it from the keywords
	//
	// 			if (word.toLowerCase() == stop_word1) {
	// 				// Build the regex
	// 				regex_str = '^\\s*' + stop_word + '\\s*$';		// Only word
	// 				regex_str += '|^\\s*' + stop_word + '\\s+';		// First word
	// 				regex_str += '|\\s+' + stop_word + '\\s*$';		// Last word
	// 				regex_str += '|\\s+' + stop_word + '\\s+';		// Word somewhere in the middle
	// 				regex = new RegExp(regex_str, 'ig');
	// 				// Remove the word from the keywords
	// 				cleansed_string = cleansed_string.replace(regex, '');
	// 			}
	// 	}
	// }
	// return cleansed_string.replace(/^\s+|\s+$/g, '');
// }
