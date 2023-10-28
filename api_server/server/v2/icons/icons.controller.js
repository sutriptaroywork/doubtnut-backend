const _ = require('lodash')
let db,config,client
const moment = require('moment')
const iconsContainer = require('../../../modules/containers/icons')
async function geticonsByIconOrderByClass(req,res,next){
	try{
		db = req.app.get('db')
		config = req.app.get('config')
		let student_class = req.user.student_class
		let app_version=req.query.app_version
		////console.log(app_version)
		if(req.params.class)
		{
			student_class=req.params.class
		}
		if(app_version!=='' && typeof app_version!=='undefined'){
			let str=req.query.app_version.split(".")
			if(str.length>=3 && parseInt(str[0])>6){
				////console.log("1111111")
				app_version='6.8.0'
			}else if(str.length>=3 && parseInt(str[0])==6 && parseInt(str[1])>=8){
				////console.log("22222222222")
				app_version='6.8.0'
			}else{
				////console.log("333333333")
				app_version='all'
			}
		}else{
			app_version='all'
		}
		let data = await iconsContainer.geticonsByIconOrderByClass(db,student_class,app_version)
		 let responseData = {
	        "meta": {
	          "code": 200,
	          "success": true,
	          "message": "SUCCESS"
	        },
	        "data": data
	      }
      res.status(responseData.meta.code).json(responseData);
	}catch(e){
		next(e)
	}
}

module.exports = {geticonsByIconOrderByClass}
