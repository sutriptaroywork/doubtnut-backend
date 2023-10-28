const _ = require('lodash')
let db,config,client
const moment = require('moment')
const iconsMysql = require('../../../modules/mysql/icons')
async function geticonsByIconOrderByClass(req,res,next){
  async function hasUserVisitedAnnouncement(studentId, announcementId,valid_from,valid_till) {

    console.log("studentId", studentId);
    let query = {
      "user_id": studentId,
      "announcement_id": parseInt(announcementId),
      "seen":{$gte: valid_from,$lte: valid_till}
    };
    console.log(query);
    let result = await db.mongo.read.collection('announcement_activity').find(query).toArray();

    console.log("announcement_activity",result);
    if (result.length)
      return true;

    return false;

  }

  async function checkForNewContentForUser(data, student_id) {


    if (data.playlist_id.trim().length) {
      let announcementInfo = await iconsMysql.getInfoFromAnnouncementByTableNameAndLibraryId(db.mysql.read, "new_library", data.playlist_id);


      if (announcementInfo.length) {
        if (await hasUserVisitedAnnouncement(student_id, announcementInfo[0].id,announcementInfo[0].valid_from,announcementInfo[0].valid_till))
          return true;

        let announcement = new Object();
        announcement.type = announcementInfo[0].type;
        announcement.state = true;
        data.announcement = announcement;

      }


    }
  }

	try{
		db = req.app.get('db')
		config = req.app.get('config')
		let student_class = req.user.student_class
		let app_version=req.user.app_version
		if(req.params.class)
		{
			student_class=req.params.class
		}
		// if(app_version!=='' && typeof app_version!=='undefined'){
		// 	let str=req.query.app_version.split(".")
		// 	if(str.length>=3 && parseInt(str[0])>7){
		// 		app_version='7.0.0'
		// 	}else if(str.length>=3 && parseInt(str[0])==7 && parseInt(str[1])>=0){
		// 		app_version='7.0.0'
		// 	}else{
		// 		app_version='all'
		// 	}
		// }else{
		// 	app_version='all'
		// }
		let data = await iconsMysql.getIconDataByClassv4(db.mysql.read,student_class,'7.0.0')
		for(let i=0;i<data.length;i++)
		{
			if(data[i].playlist_details.length>0){
				let temp=JSON.parse(data[i].playlist_details)
				data[i].playlist_id=temp.playlist_id
				data[i].playlist_title=temp.name
				data[i].external_url=temp.external_url
				data[i].is_last=temp.is_last
			}else{
				data[i].playlist_id=""
				data[i].playlist_title=""
				data[i].external_url=""
				data[i].is_last=""
			}

      await checkForNewContentForUser(data[i], req.user.student_id);
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
