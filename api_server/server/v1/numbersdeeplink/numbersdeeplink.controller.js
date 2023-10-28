"use strict";
const _ = require('lodash')
const moment = require('moment')
const request = require("request")
const DeepLink = require('../../../modules/deeplink')
const Utility = require('../../../modules/utility')
const IPUtility = require('../../../modules/Utility.IP');
let config,db

async function get(req,res,next){
	try{
		config=req.app.get('config')
		db = req.app.get('db')
		let mobile = req.query.mobile
		let source = req.query.source
		let deeplink = ""

		if(await IPUtility.hasReachedLimit(db.redis,config.deepLinkPerDay , req.headers['True-Client-IP'] || req.headers['x-forwarded-for']))
        {
          const response = IPUtility.maxLimitReached();
          return res.status(response.meta.code).json(response);

        }

		if(source == "get_app")
			deeplink = 'https://bit.ly/2UrurjT'
		else if(source == "video_page")
		{
			var deeplinkGenerate  = await new Promise(async function(resolve, reject) {
				try {
					var myJSONObject = {
						branch_key: "key_live_cbx3cYpK30NM7Ph4H3OX7ihpqsn9tgQ4",
						channel: "pwa_video_end_popup",
						feature: "video",
						campaign: "web_viral",
						data: {
							qid: req.query.qid,
							sid: '115'
						}
					};
					request(
						{
							url: "https://api.branch.io/v1/url",
							method: "POST",
							json: true, // <--Very important!!!
							body: myJSONObject
						},
						function(error, response, body) {
							if (error) {
							//console.log(error);
							} else {
							////console.log(body);
							return resolve(body);
							}
						}
					);
				} catch (e) {
					//console.log(e);
					return reject(e);
				}
			});

			deeplink = deeplinkGenerate.url
		}

		// let SMS="Thank you for your interest in Doubtnut e-learning platform. Here is a quick link to download it from Google Play Store "+deeplink
		let SMS="Doubtnut se judne ke liye dhanyawaad :) For Free instant DOUBTs/PDFs/NCERT/IIT-JEE solutions & Motivation abhi download kare Doubtnut App -"+deeplink
		let data1= await DeepLink.addNumber(mobile,source,db.mysql.write)
		let options = {
		    method: 'POST',
		    uri: "https://2factor.in/API/V1/" +config.two_fa_key+ "/ADDON_SERVICES/SEND/PSMS",
		    body : {
		    	Msg : SMS,
		    	To : mobile,
		    	From : 'DOUBTN'
		    },
		    json : true
		  }
		  request(options, function (error, response, body) {
		  	if(!error){
			  	//console.log(body);
			  	let responseData = {
		          "meta": {
		            "code": 200,
		            "success": true,
		            "message": "SMS is send and added at id :"
		          },
		          "data": body
		  		}
		  		res.status(responseData.meta.code).json(responseData)
		  	}
		  else{
		  		let responseData = {
		          "meta": {
		            "code": 200,
		            "success": false,
		            "message": "Error in sending message"
		          },
		          "data": {},
		          "error": error
		  		}
		  		res.status(responseData.meta.code).json(responseData)
		  	}
        })
	}catch(e){
		next(e)
	}
}

module.exports = {get}
