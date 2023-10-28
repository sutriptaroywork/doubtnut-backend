
const Utility = require('../../../modules/utility')

const _ = require('lodash')
let config


async function generate(req,res,next){
	try{
		config = req.app.get('config')
		let channel = req.body.channel
		let feature = req.body.feature
		let campaign = req.body.campaign
		let question_id = req.body.question_id
		let type = (typeof req.body.type !== 'undefined') ? req.body.type : null
		let page = (typeof req.body.page !== 'undefined') ? req.body.page : 'DEEPLINK'
		let student_id = (typeof req.body.student_id !== 'undefined') ? req.body.student_id : null

		let resolvedPromise = await Utility.generateDeepLink(config,channel,feature,campaign,question_id,type,page,student_id)
		console.log("resolvedPromise")
		console.log(resolvedPromise)

		 let responseData = {
	        "meta": {
	          "code": 200,
	          "success": true,
	          "message": "SUCCESS"
	        },
	        "data": resolvedPromise
	      }
      return res.status(responseData.meta.code).json(responseData);
	}catch(e){
		next(e)
	}
}

module.exports = {generate}


