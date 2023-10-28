const brainlyContainer = require('../../../modules/containers/brainly')
const QuestionSql = require('../../../modules/mysql/question')
const brainlyQuery = require('../../../modules/brainly')

const _ = require('lodash')
let db,config,client

async function search(req,res,next){
	try{
		db = req.app.get('db')
		config = req.app.get('config')
		let qid = req.params.qid
		// let qData = await brainlyContainer.getBrainlyQuestion(qid, db);
		// let textSol = await brainlyContainer.getBrainlyTextSol(qid, db);

		let promise = []
		promise.push(brainlyContainer.getBrainlyQuestion(qid, db))
		promise.push(brainlyContainer.getBrainlyTextSol(qid, db))

		let brainlyRes = await Promise.all(promise)

		if(brainlyRes[0].length > 0)
		{
			let qData = brainlyRes[0][0]

			let textSolutions = ""
			if(brainlyRes[1].length > 0)
			{
				textSolutions = brainlyRes[1][0]
			}
			let new_res = [];
			let new_res_2 = [];

			let subject = "math"
			if(qData['subject_id'] == 2)
			{
			  subject = "phy"
			}
			else if(qData['subject_id'] == 3)
			{
			  subject = "chem"
			}

			elasticSearchInstance = req.app.get('elasticSearchInstance');
			
			let matchPromise = [];
			matchPromise.push(elasticSearchInstance.findByOcrBySubject(qData['question'], subject));
			matchPromise.push(elasticSearchInstance.findByOcrNew(qData['question']));
			
			let results = await Promise.all(matchPromise);
			
			for(let i = 0; i < results[0].hits.hits.length; i++)
			{
				var qDtails = await QuestionSql.getQuestionByIdLocalised(results[0].hits.hits[i]['_id'], db.mysql.read)
				if(qDtails.length != 0)
				{
					results[0].hits.hits[i]['url'] = qDtails[0]['url_text']
					results[0].hits.hits[i]['matched_question'] = qDtails[0]['matched_question']
					new_res.push(results[0].hits.hits[i])
				}
			}
			for(let j = 0; j < results[1].hits.hits.length; j++)
			{
				var qDtailsExternal = await brainlyContainer.getBrainlyQuestion(results[1].hits.hits[j]['_id'], db)
				if(qDtailsExternal.length != 0)
				{
					results[1].hits.hits[j]['url'] = qDtailsExternal[0]['url']
					results[1].hits.hits[j]['canonical_url'] = qDtailsExternal[0]['canonical_url']
					new_res_2.push(results[1].hits.hits[j])
				}
			}

			let data = { "question_details": qData, "text_solution": textSolutions, "matched_question": new_res, "external_matched_question": new_res_2 }

			let responseData = {
				"meta": {
					"code": 200,
					"success": true,
					"message": "SUCCESS"
				},
				"data": data
			}
			res.status(responseData.meta.code).json(responseData);
		}
		else
		{
			let responseData = {
				"meta": {
					"code": 404,
					"success": false,
					"message": "Question Not Found"
				},
				"data": null
			}
			res.status(responseData.meta.code).json(responseData);
		}
	}catch(e){
		next(e)
	}
}

async function feedback(req,res,next){
	var responseData = ""
	try{
		db = req.app.get('db')
	    config = req.app.get('config')
		let qid = req.body.qid;
		let gcm = req.body.gcm;
		let rating = req.body.rating;

		let insertRating = await brainlyQuery.insertBrainlyRating(gcm, qid, rating, db.mysql.write);
		responseData = {
	        "meta": {
	          "code": 200,
	          "success": true,
	          "message": "SUCCESS"
	        }
	    }
	}catch(e){
		responseData = {
	        "meta": {
	          "code": 500,
	          "success": false,
	          "message": "Error from catch block"
	        }
	    }
	}
	res.status(responseData.meta.code).json(responseData);
}

module.exports = {search,feedback}
