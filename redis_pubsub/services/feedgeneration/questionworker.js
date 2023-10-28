/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-07 16:13:28
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-22 15:10:23
*/

const moment = require('moment')
const feedStreamModel = require('../../dbmodels/mongo/feedstream')

module.exports = class QuestionWorker {
	constructor(){

	} 

	 static async queueQuestion(activityStreamData,db){
	 	console.log(activityStreamData)
		console.log("IN queuequestion")
		let operation_start_time = moment().valueOf()
		let  questionid = activityStreamData.object_id
		if (activityStreamData.verb ==='MATCHED') {
			questionid = activityStreamData.target_id
		}else{
			 questionid = activityStreamData.object_id
		}
		let questionFeed = await feedStreamModel.findOneAndUpdate({entity_id:questionid,$or: [ { "entity_type": "unanswered" }, { "entity_type": "matched" }, { "entity_type": "answered" } ]},{$set:{is_deleted:true}},{sort: { '_id': -1 } })
		let sql = "SELECT * FROM questions WHERE question_id = ?"
		let question = await db.mysql.read.query(sql,[questionid])
		let sql1 = "SELECT * FROM students WHERE student_id = ?"
		let student = await db.mysql.read.query(sql1,[question[0].student_id])
		let feedData = {}
		let FeedGroup = "Class_Group"
		 feedData.class  = question[0].class
		 feedData.feed_group = FeedGroup
		 feedData.entity_id = questionid
		 feedData.relevancy = activityStreamData.relevancy
		 feedData.activity_id = activityStreamData._id
		 feedData.entity_data = question[0]
		 feedData.entity_data.student = student[0]
		if (activityStreamData.verb === 'COMMUNITY') {
			feedData.entity_type = "unanswered"
			feedData.activity_type = "POST_COMMUNITY"
		}else if(activityStreamData.verb === 'ANSWERED'){
			feedData.entity_type = "answered"
			feedData.activity_type = "POST_ANSWERED"
		}else if (activityStreamData.verb ==='MATCHED'){
			feedData.entity_type = "matched"
			feedData.activity_type = "POST_MATCHED"
		}
		feedData.visible_from = moment(question[0].timestamp).toISOString()
 		let operation_end_time = moment().valueOf()
		let timetaken = operation_end_time - operation_start_time
		feedData.timetaken = timetaken
		let feedStream = new feedStreamModel(feedData);
		let feed = await feedStream.save()
		return feed
	}


}

async function _questionToFeedData(ugc){
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