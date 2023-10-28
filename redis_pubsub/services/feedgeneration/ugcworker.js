/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-03 13:43:11
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-18 11:39:40
*/
const moment = require('moment')
const feedStreamModel = require('../../dbmodels/mongo/feedstream')

module.exports = class UgcWorker {
	constructor(){

	}

	 static async queueUGC(activityStreamData,db){

	 	console.log(activityStreamData)
		console.log("IN queueUGC")
		let operation_start_time = moment().valueOf()
		let ugc = activityStreamData.object
		let feedData = {}
		let FeedGroup = "Universal"
		 feedData.class  = ugc.class_group
		 feedData.feed_group = FeedGroup
		 feedData.entity_type = "ugc"
		 feedData.entity_id = ugc._id
		 feedData.relevancy = activityStreamData.relevancy
		 feedData.activity_id = activityStreamData._id
		 feedData.actor_id = activityStreamData.actor_id

		if (activityStreamData.verb === 'POST') {
			feedData.activity_type = "POST_UGC"
			feedData.entity_data = await _ugcToFeedData(ugc)
			let sql1 = "SELECT * FROM students WHERE student_id = ?"
			let student = await db.mysql.read.query(sql1,ugc.student_id)
			feedData.entity_data.student = student[0]
		console.log(feedData)
		let operation_end_time = moment().valueOf()
		let timetaken = operation_end_time - operation_start_time
		feedData.timetaken = timetaken
		feedData.visible_from = ugc.createdAt
		let feedStream = new feedStreamModel(feedData);
		let feed = await feedStream.save()
		return feed
		console.log(feed)
		}else if(activityStreamData.verb === 'DELETE'){
			let feed = await feedStreamModel.findOneAndUpdate({entity_id:feedData.entity_id,entity_type:feedData.entity_type},{$set:{is_deleted:true}},{sort: { '_id': -1 } })
			//delete post from feed
			return feed
		}
	}
}

async function _ugcToFeedData(ugc){
		let feedDataStructure = {
			"type": "UGC",
			"id":ugc._id,
			"post_type":ugc.type,
			"student_id":ugc.student_id,
			"text":ugc.text,
			"url":ugc.url,
			"image_url":ugc.image,
			"audio":ugc.audio,
			"video":ugc.video,
			"student_username":ugc.student_username,
			"profile_image":ugc.student_avatar,
			"created_at":ugc.createdAt
		}
		return feedDataStructure

}