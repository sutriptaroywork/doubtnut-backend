/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-14 13:36:27
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-18 11:46:41
*/
const moment = require('moment')
const feedStreamModel = require('../../dbmodels/mongo/feedstream')

module.exports = class EngagementWorker {
	constructor(){

	}
	 static async queueEngagement(activityStreamData,db){
	 	console.log(activityStreamData)
		console.log("IN queueEngagement")
		let operation_start_time = moment().valueOf()
		let  engagementId = activityStreamData.object_id
		let sql = "SELECT * FROM engagement WHERE id = ?"
		let engagement = await db.mysql.read.query(sql,[engagementId])
		let sql1 = "SELECT * FROM students WHERE student_id = 98"
		let student = await db.mysql.read.query(sql1)
		let feedData = {}
		let FeedGroup = "Class_Group"
		feedData.class  = engagement[0].class
		if (feedData.class === 'all') {
			FeedGroup = "Universal"
		}
		feedData.feed_group = FeedGroup
		feedData.entity_id = engagementId
		feedData.relevancy = moment(engagementsql[0].start_date).valueOf()
		feedData.activity_id = activityStreamData._id
		feedData.entity_type = activityStreamData.object_type
		feedData.activity_type = "POST_ENGAGEMENT"
		feedData.entity_data = engagement[0]
		feedData.entity_data.student = student[0]
		feedData.visible_from = moment(engagementsql[0].start_date).toISOString()
		feedData.visible_to = moment(engagementsql[0].end_date).toISOString()
 		let operation_end_time = moment().valueOf()
		let timetaken = operation_end_time - operation_start_time
		feedData.timetaken = timetaken
		console.log(feedData)
		let feedStream = new feedStreamModel(feedData);
		let feed = await feedStream.save()
		console.log("Out queueEngagement")
		return feed
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
			"image_url":ugc.image_url,
			"audio":ugc.audio,
			"video":ugc.video,
			"student_username":ugc.student_username,
			"profile_image":ugc.student_avatar,
			"created_at":ugc.createdAt
		}
		return feedDataStructure

}