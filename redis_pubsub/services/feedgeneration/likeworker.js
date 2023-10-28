/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-15 11:59:11
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-18 12:45:50
*/
const moment = require('moment')
const feedStreamModel = require('../../dbmodels/mongo/feedstream')
let Enum = require('enum');
let EngagementType = new Enum(['news','pdf','polling','product_features','tips','url','viral_videos','youtube']);
let QuestionType = new Enum(['answered','matched','unanswered']);


module.exports = class LikeWorker {
	constructor(){

	}

	static async queueLike(activityStreamData,db){
	 	console.log(activityStreamData)
		console.log("IN likequeue")
		let likeOffset = 15*60*1000
		let operation_start_time = moment().valueOf()
		let entity_id = activityStreamData.object_id
		let entity_type = activityStreamData.object_type
		let feedData = await feedStreamModel.findOneAndUpdate({entity_id:entity_id,entity_type:entity_type},{$set:{'is_past':true}},{sort: { '_id': -1 } })
		console.log(feedData)
		if (feedData) {
			console.log(feedData);
			feedData = feedData.toObject()
			let sql = "SELECT count(*) AS likecount from user_engagement_feedback WHERE resource_type = ? AND resource_id = ? AND is_like = 1"
			let likecountquery = await db.mysql.read.query(sql,[entity_type,entity_id])
			feedData.likecount = likecountquery[0].likecount
			//feedData.likecountunt += 1
			if (activityStreamData.actor && activityStreamData.actor.student_username) {
				feedData.recent_likedBy = activityStreamData.actor.student_username
			}
			feedData.relevancy += likeOffset
			feedData.activity_id = activityStreamData._id
			feedData.activity_type = "LIKE_"+entity_type
			delete feedData._id
			let operation_end_time = moment().valueOf()
			let timetaken = operation_end_time - operation_start_time
			feedData.timetaken = timetaken
			let feedStream = new feedStreamModel(feedData)
			let feed = await feedStream.save()
			return feed
		}else{
			if (QuestionType.isDefined(entity_type)) {
				let  questionid = activityStreamData.object_id
				let sql = "SELECT * FROM questions WHERE question_id = ?"
				let question = await db.mysql.read.query(sql,[questionid])
				let sql1 = "SELECT * FROM students WHERE student_id = ?"
				let student = await db.mysql.read.query(sql1,[question[0].student_id])
				let feedData = {}
				let FeedGroup = "Class_Group"
				 feedData.class  = question[0].class
				 feedData.feed_group = FeedGroup
				 feedData.entity_id = questionid
				 feedData.relevancy = moment(question[0].timestamp).valueOf() + likeOffset 
				 feedData.activity_id = activityStreamData._id
				 			let sql3 = "SELECT count(*) AS likecount from user_engagement_feedback WHERE resource_type = ? AND resource_id = ? AND is_like = 1"
			let likecountquery = await db.mysql.read.query(sql3,[entity_type,entity_id])
			feedData.likecount = likecountquery[0].likecount
				 feedData.entity_type = entity_type
				 feedData.activity_type = "LIKE_"+entity_type
				 if (activityStreamData.actor && activityStreamData.actor.student_username) {
					feedData.recent_likedBy = activityStreamData.actor.student_username
				 }
				 feedData.entity_data = question[0]
				 feedData.entity_data.student = student[0]
		 		let operation_end_time = moment().valueOf()
				let timetaken = operation_end_time - operation_start_time
				feedData.visible_from = moment(question[0].timestamp).toISOString()
				feedData.timetaken = timetaken
				let feedStream = new feedStreamModel(feedData);
				let feed = await feedStream.save()
				return feed

			}else if (EngagementType.isDefined(entity_type)) {
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
					let sql3 = "SELECT count(*) AS likecount from user_engagement_feedback WHERE resource_type = ? AND resource_id = ? AND is_like = 1"
					let likecountquery = await db.mysql.read.query(sql3,[entity_type,entity_id])
					feedData.likecount = likecountquery[0].likecount
					feedData.feed_group = FeedGroup
					feedData.entity_id = engagementId
					feedData.relevancy =  moment(engagement[0].start_date).valueOf() + likeOffset 
					feedData.activity_id = activityStreamData._id
					feedData.entity_type = entity_type
					feedData.activity_type = "LIKE_"+entity_type
					 if (activityStreamData.actor && activityStreamData.actor.student_username) {
						feedData.recent_likedBy = activityStreamData.actor.student_username
					 }					
					feedData.entity_data = engagement[0]
 					feedData.entity_data.student = student[0]
					feedData.visible_from = moment(engagement[0].start_date).toISOString()
					feedData.visible_to = moment(engagement[0].end_date).toISOString()
			 		let operation_end_time = moment().valueOf()
					let timetaken = operation_end_time - operation_start_time
					feedData.timetaken = timetaken
					console.log(feedData)
					let feedStream = new feedStreamModel(feedData);
					let feed = await feedStream.save()
					return feed
			}
		}

	}

}