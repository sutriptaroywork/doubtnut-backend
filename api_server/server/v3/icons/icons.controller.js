const _ = require('lodash')
let db,config,client
const moment = require('moment')
const iconsMysql = require('../../../modules/mysql/icons')
async function geticonsByIconOrderByClass(req,res,next){
	try{
		db = req.app.get('db')
		config = req.app.get('config')
		let student_class = req.user.student_class
		let app_version=req.query.app_version
		if(req.params.class)
		{
			student_class=req.params.class
		}
		if(app_version!=='' && typeof app_version!=='undefined'){
			let str=req.query.app_version.split(".")
			if(str.length>=3 && parseInt(str[0])>6){
				app_version='6.8.0'
			}else if(str.length>=3 && parseInt(str[0])==6 && parseInt(str[1])>=8){
				app_version='6.8.0'
			}else{
				app_version='all'
			}
		}else{
			app_version='all'
		}
		let data = await iconsMysql.getIconDataByClassNew(db.mysql.read,student_class,app_version)
		for(let i=0;i<data.length;i++)
		{
			if(data[i].playlist_details.length>0){
				let temp=JSON.parse(data[i].playlist_details)
				data[i].playlist_id=temp.playlist_id
				data[i].playlist_title=temp.name
				data[i].external_url=temp.external_url
			}else{
				data[i].playlist_id=""
				data[i].playlist_title=""
				data[i].external_url=""
			}
			delete data[i].playlist_details
		}
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
