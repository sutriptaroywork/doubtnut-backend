 /*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-03 13:00:12
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-17 14:46:00
*/

const Utils = require('../feedgeneration/feedutils')
const moment = require('moment')
const UgcWorker = require('../feedgeneration/ugcworker')
const CommentWorker = require('../feedgeneration/commentworker')
const QuestionWorker = require('../feedgeneration/questionworker')
const EngagementWorker = require('../feedgeneration/engagementworker')
const LikeWorker = require('../feedgeneration/likeworker')
module.exports = class FeedWorker {
	constructor(){
	}

	static async queueFeed(activityStreamData,db){
		console.log("IN queueFeed")
		// console.log(activityStreamData)
		let start_time = moment();
		let is_feed = Utils.checkIsFeed(activityStreamData.verb,activityStreamData.object_type);
		console.log(is_feed)
		if (is_feed) {
			if(activityStreamData.verb === 'LIKE' || activityStreamData.verb === 'DISLIKE'){
				await LikeWorker.queueLike(activityStreamData,db)
			}else if (activityStreamData.object_type === "UGC") {
				await UgcWorker.queueUGC(activityStreamData,db)
			}else if(activityStreamData.object_type === "COMMENT"){
				await CommentWorker.queueComment(activityStreamData,db)
			}else if(activityStreamData.object_type === "QUESTION" && activityStreamData.verb !== "ASKED"){
				await QuestionWorker.queueQuestion(activityStreamData,db)
			}else if(activityStreamData.verb === 'POST_ENGAGEMENT'){
				await EngagementWorker.queueEngagement(activityStreamData,db)
			}
		}
		console.log("Out queueFeed")
		return 1

	}

}