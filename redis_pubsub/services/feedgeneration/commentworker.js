/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-03 13:43:11
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-18 12:42:06
*/
const moment = require('moment')
const feedStreamModel = require('../../dbmodels/mongo/feedstream')
const commentModel = require('../../dbmodels/mongo/comment')
let Enum = require('enum');
let EngagementType = new Enum(['news','pdf','polling','product_features','tips','url','viral_videos','youtube']);
let QuestionType = new Enum(['answered','matched','unanswered']);

module.exports = class CommentWorker {
	constructor(){
	}

	 static async queueComment(activityStreamData,db){
	 	let commentOffset = 30*60*1000;
	 	console.log(activityStreamData)
		console.log("IN queueComment")
		let operation_start_time = moment().valueOf()
		let  comment = activityStreamData.object
		let comment_entity_type = comment.entity_type
		let feedData = {}
		if (activityStreamData.verb === 'DELETE') {
			//let questionFeed = await feedStreamModel.findOneAndUpdate({entity_id:comment.entity_id,entity_type:comment.entity_type},{$set:{is_past:true}},{sort: { '_id': -1 } })
		}else if(activityStreamData.verb === 'POST'){
			if (QuestionType.isDefined(comment_entity_type)) {
				let questionFeed = await feedStreamModel.findOneAndUpdate({entity_id:comment.entity_id,entity_type:comment.entity_type},{$set:{is_past:true}},{sort: { '_id': -1 } })
				if (!questionFeed) {
					let sql = "SELECT * FROM questions WHERE question_id = ?"
					let questionsql = await db.mysql.read.query(sql,[comment.entity_id])
					let sql1 = "SELECT * FROM students WHERE student_id = ?"
					let student = await db.mysql.read.query(sql1,[questionsql[0].student_id])
					let FeedGroup = "Class_Group"
				 	feedData.class  = questionsql[0].class
				 	feedData.feed_group = FeedGroup
			 		feedData.entity_id = comment.entity_id
			 		feedData.relevancy = moment(questionsql[0].timestamp).valueOf() + commentOffset 
			 		feedData.activity_id = activityStreamData._id
 					feedData.entity_data = questionsql[0]
 					feedData.entity_data.student = student[0]
					feedData.topcomment = comment
					feedData.visible_from = moment(questionsql[0].timestamp).toISOString()
					let commentCount = await commentModel.countDocuments({entity_id:comment.entity_id,entity_type:comment.entity_type,is_deleted: false})
					feedData.commentcount = commentCount
				}else{
					feedData = questionFeed.toObject()
					feedData.relevancy += commentOffset
					feedData.topcomment = comment
					feedData.activity_id = activityStreamData._id
					let commentCount = await commentModel.countDocuments({entity_id:comment.entity_id,entity_type:comment.entity_type,is_deleted: false})
					feedData.commentcount = commentCount
					//insert comment count
					delete feedData._id
				}
				let operation_end_time = moment().valueOf()
				let timetaken = operation_end_time - operation_start_time

				feedData.timetaken = timetaken

				feedData.activity_type = "POST_COMMENT"
				feedData.entity_type = comment.entity_type
				let feedStream = new feedStreamModel(feedData)
				let feed = await feedStream.save()
				return feed
			}else if(EngagementType.isDefined(comment_entity_type)){
				//PUSH IN ENGAGEMENT FEED
				let engagementFeed = await feedStreamModel.findOneAndUpdate({entity_id:comment.entity_id,entity_type:comment.entity_type},{$set:{is_past:true}},{sort: { '_id': -1 } })
				if (!engagementFeed) {
					let sql = "SELECT * FROM engagement WHERE id = ?"
					let engagementsql = await db.mysql.read.query(sql,[comment.entity_id])
					let sql1 = "SELECT * FROM students WHERE student_id = 98"
					console.log()
					let student = await db.mysql.read.query(sql1)
					let FeedGroup = "Class_Group"
				 	feedData.class  = engagementsql[0].class
				 	feedData.feed_group = FeedGroup
			 		feedData.entity_id = comment.entity_id
			 		feedData.relevancy = moment(engagementsql[0].start_date).valueOf() + commentOffset 
			 		feedData.activity_id = activityStreamData._id
 					feedData.entity_data = engagementsql[0]
 					feedData.entity_data.student = student[0]
					feedData.visible_from = moment(engagementsql[0].start_date).toISOString()
		 			feedData.visible_to = moment(engagementsql[0].end_date).toISOString()
					feedData.topcomment = comment
					let commentcount = await commentModel.countDocuments({entity_id:comment.entity_id,entity_type:comment.entity_type})
					feedData.commentcount = commentcount
					//insert comment count
				}else{
					feedData = engagementFeed.toObject()
					feedData.relevancy += commentOffset
					feedData.topcomment = comment
					feedData.commentcount += 1
					feedData.activity_id = activityStreamData._id
					let commentcount = await commentModel.countDocuments({entity_id:comment.entity_id,entity_type:comment.entity_type})
					feedData.commentcount = commentcount
					//insert comment count
					delete feedData._id
				}
								let operation_end_time = moment().valueOf()
				let timetaken = operation_end_time - operation_start_time

				feedData.timetaken = timetaken
				feedData.activity_type = "POST_COMMENT"
				feedData.entity_type = comment.entity_type
				let feedStream = new feedStreamModel(feedData);
				let feed = await feedStream.save()
				return feed
			}
			//Push Parent
		}
	}


}

async function _commentToFeedData(ugc){
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