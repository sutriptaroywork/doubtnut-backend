const request = require('request');
const bluebird = require('bluebird');
const redis = require('redis');
const { Translate } = require('@google-cloud/translate');

const projectId = 'doubtnut-vm';
bluebird.promisifyAll(redis);
const redisClient = redis.createClient(`redis://${process.env.REDIS_HOST}:6379`);
const keyFilename = 'vision_gcp.json';
const translate = new Translate({ projectId, keyFilename });
const image2base64 = require('image-to-base64');
const aws = require('aws-sdk');

aws.config.update({
	accessKeyId: process.env.ACCESS_KEY_ID,
	secretAccessKey: process.env.ACCESS_SECRET_KEY,
	region: 'ap-south-1',
	signatureVersion: 'v4',
});
const sqs = new aws.SQS();

const askBucket = 'dn-test-questionupload';
const currentBucket = 'doubtnut-static';
const oldPrefix = '';
const newPrefix = 'images/';
const s3AskBucket = new aws.S3({ params: { Bucket: askBucket }, region: 'ap-south-1' });
const s3StaticBucket = new aws.S3({ params: { Bucket: currentBucket }, region: 'ap-south-1' });
async function moveObject(qAskBucket, staticBucket, fileName) {
	const listObjectPromiseR = await qAskBucket.listObjects(
		{ Prefix: oldPrefix },
	).promise();
	if (listObjectPromiseR.Contents.length) {
		for (let i = 0; i < listObjectPromiseR.Contents.length; i += 1) {
			if (fileName === listObjectPromiseR.Contents[i].Key) {
				const promise = [];
				const params = {
					Bucket: currentBucket,
					CopySource: `${askBucket}/${listObjectPromiseR.Contents[i].Key}`,
					Key: listObjectPromiseR.Contents[i].Key.replace(
						oldPrefix,
						newPrefix,
					),
				};
				// copy image
				promise.push(staticBucket.copyObject(params).promise());
				console.log('Copied: ', params.Key);
				promise.push(qAskBucket.deleteObject({
					Bucket: askBucket,
					Key: listObjectPromiseR.Contents[i].Key,
				}).promise());
				console.log('Deleted: ',
					listObjectPromiseR.Contents[i].Key);
				return (await Promise.all(promise));
			}
			if ((listObjectPromiseR.Contents.length - 1) === i) {
				return false;
			}
		}
	} else {
		return false;
	}
}

function setOcr(fileName, ocrData, studentId, redisConnection) {
	console.log(fileName)
	return redisConnection.hsetAsync('student_question_ask',
		`${studentId}_${fileName}`,
		JSON.stringify(ocrData));
}
function mathpixOcrWithThreshold(imageUrl,app_key,app_id) {
	// let url = host + "/static/uploads/" + fileName
	const options = {
		method: 'POST',
		uri: 'https://api.mathpix.com/v3/latex',
		body: {
			url: imageUrl,
			formats: ['asciimath', 'text'],
			ocr: ['math', 'text'],
			confidence_threshold: 0.005,
		},
		json: true,
		headers: {
			app_id: app_id,
			app_key: app_key,
			'Content-Type': 'application/json',
		},
	};
	return new Promise(((resolve, reject) => {
		// Do async job
		request(options, (err, resp, body) => {
			if (err) {
				console.log(err);
				// logger.error({ "tag": 'ask', 'source': 'mathpixOcr3', 'error': err })
				reject(err);
			} else {
				resolve(body);
			}
		});
	}));
}
function mathpixOcr2(imageUrl) {
	// let url = host + "/static/uploads/" + fileName
	const options = {
		method: 'POST',
		uri: 'https://api.mathpix.com/v3/latex',
		body: {
			url: imageUrl,
			formats: ['asciimath', 'text'],
			ocr: ['math', 'text'],
		},
		json: true,
		headers: {
			app_id: 'aditya_doubtnut_com',
			app_key: '500f7f41d6ef6141251a',
			'Content-Type': 'application/json',
		},
	};
	return new Promise(((resolve, reject) => {
		// Do async job
		request(options, (err, resp, body) => {
			if (err) {
				reject(err);
			} else {
				resolve(body);
			}
		});
	}));
}
// function getIndexOfRegex(str, matchResults) {
// 	return str.indexOf(matchResults[0]);
// }

function httpVisionApiWithContent(image, google_key) {
	// console.log(image)
	const url = `https://vision.googleapis.com/v1/images:annotate?key=${google_key}`;
	const options = {
		method: 'POST',
		uri: url,
		body: {
			requests: [
				{
					image: {
						content: image,
					},
					features: [
						{
							type: 'DOCUMENT_TEXT_DETECTION',
						},
						// {
						//   "type": "WEB_DETECTION"
						// }
					],
				},
			],
		},
		json: true,
		headers: {
			// app_id: "aditya_doubtnut_com",
			// app_key: "500f7f41d6ef6141251a",
			'Content-Type': 'application/json',
		},
	};
		// let client = new vision.ImageAnnotatorClient();
		// return client.webDetection(url);
	return new Promise(((resolve, reject) => {
		// Do async job
		request(options, (err, resp, body) => {
			if (err) {
				// logger.error({"tag":'ask','source':'httpVisionApi','error':err})
				reject(err);
			} else {
				resolve(body);
			}
		});
	}));
}


function translateApi(text, translatePackage) {
	return translatePackage.translate(text, 'en');
}


// function getExtraThingsRemoved1(str) {
// 	const str1 = str.trim();
// 	return str1;
// }

function isEligibleForAbTesting(studentId) {
	if (studentId % 2 === 0) {
		return true;
	}
	return false;
}
async function handleOcr(isAbEligible, imageUrl) {
	let promiseResolve;
	const promise = new Promise(((resolve) => {
		promiseResolve = resolve;
		// promiseReject = reject;
	}));
	try {
		let latex;

		latex = await mathpixOcrWithThreshold(imageUrl,process.env.MATHPIX_KEY,process.env.MATHPIX_ID);
		let locale = 'en';
		let originalOcr;

		// check for handwritten
		let handwritten = 0;
		let ocr = '';
		if (typeof latex !== 'undefined'
			&& (typeof latex.detection_map !== 'undefined')
			&& (typeof latex.detection_map.is_printed !== 'undefined')
			&& (latex.detection_map.is_printed < 0.8)) {
			// //console.log('handwritten')
			handwritten = 1;
		}
		// check if ocr2 is coming
		if ((typeof latex.asciimath !== 'undefined')
		&& (latex.asciimath.length > 0)) {
			console.log('ocr2');
			ocr = latex.asciimath;
			originalOcr = ocr;
			// if (isAbEligible) {
			// 	ocr = optionRemovalFromMathPixOcr(ocr);
			// }
			promiseResolve({
				ocr,
				ocr_type: 0,
				original_ocr: originalOcr,
				handwritten,
				locale,
				ocr_origin: 'img_mathpix',
				translate_done: 0,
			});
			return promise;
		}
		// do ocr1
		const questionImage = await image2base64(imageUrl);
		let visionApiResp = await httpVisionApiWithContent(questionImage, process.env.GOOGLE_KEY);
		visionApiResp = visionApiResp.responses;
		if (typeof visionApiResp[0].fullTextAnnotation !== 'undefined'
		&& visionApiResp[0].fullTextAnnotation !== null) {
			console.log('ocr1');
			ocr = visionApiResp[0].textAnnotations[0].description;
			originalOcr = ocr;
			locale = visionApiResp[0].textAnnotations[0].locale;
		} else {
			promiseResolve({
				ocr: '',
				ocr_type: 1,
				handwritten,
				locale,
				ocr_done: 0,
				translate_done: 0,
			});
			return promise;
		}

		if (locale !== 'en'
			&& locale !== 'es'
			&& locale !== 'gl'
			&& locale !== 'ca'
			&& locale !== 'cy'
			&& locale !== 'it'
			&& locale !== 'gd'
			&& locale !== 'sv'
			&& locale !== 'da'
			&& locale !== 'ro'
			&& locale !== 'fil'
			&& locale !== 'mt'
			&& locale !== 'pt-PT') {
			if (ocr !== '') {
				// let transLateApiResp = await httpTranslateApi(ocr)
				// ocr = transLateApiResp['data']['translations'][0]['translatedText']
				const transLateApiResp = await translateApi(ocr, translate);
				if (transLateApiResp.length > 0
					&& transLateApiResp[1].data !== undefined
					&& transLateApiResp[1].data.translations !== undefined
					&& transLateApiResp[1].data.translations[0].translatedText !== undefined) {
					ocr = transLateApiResp[1].data.translations[0].translatedText;
					promiseResolve({
						ocr,
						ocr_type: 1,
						handwritten,
						locale,
						ocr_done: 1,
						translate_done: 1,
						original_ocr: ocr,
						ocr_origin: 'img_gv_translate',
					});
					return promise;
				}
				promiseResolve({
					ocr,
					ocr_type: 1,
					handwritten,
					locale,
					ocr_done: 1,
					translate_done: 0,
					original_ocr: originalOcr,
				});
				return promise;
			}
			promiseResolve({
				ocr,
				ocr_type: 1,
				handwritten,
				locale,
				ocr_done: 0,
				translate_done: 0,
				ocr_origin: 'null_ocr',
				original_ocr: ocr,
			});
			return promise;
		}
		promiseResolve({
			ocr,
			ocr_type: 1,
			handwritten,
			locale,
			ocr_done: 0,
			translate_done: 0,
			ocr_origin: 'img_google_vision',
			original_ocr: ocr,
		});
		return promise;
	} catch (e) {
		console.log(e);
		promiseResolve({
			ocr: '',
			ocr_type: 1,
			handwritten: 0,
			locale: null,
			ocr_done: 0,
			translate_done: 0,
			error: e,
		});
		return promise;
	}
}

exports.handler = async (event) => {
	let data = event.Records[0];
	const fileName = data.s3.object.key;
	const imageUrl = `https://${data.s3.bucket.name}.s3.amazonaws.com/${fileName}`;
	try {
		data = fileName.split('_');
		const studentId = data[2];
		const isAbEligible = isEligibleForAbTesting(studentId);
		const ocrData = await handleOcr(isAbEligible, imageUrl);
		ocrData.is_processed = 0;
		console.log(ocrData);
		await setOcr(fileName, ocrData, studentId, redisClient);
			// await moveObject(s3AskBucket, s3StaticBucket, fileName);
			const params = {
				MessageBody: JSON.stringify({
						"file_name": fileName
				}),
				QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/942682721582/moveObject	',
			};
			sqs.sendMessage(params, (err, data) => {
				if (err) {
					console.log('Error', err);
				} else {
					console.log(data);
				}
			});
		return new Promise(((resolve) => {
			resolve('Completed');
		}));
	} catch (e) {
		console.log("Error from catch block")
		console.log(e)
		return new Promise(((resolve, reject) => {
			reject(new Error('Galat Scene'));
		}));
		// retry logic of lambdas
	}
};
