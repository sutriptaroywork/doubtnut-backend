/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-02 15:43:30
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-07-27T17:45:39+05:30
*/
'use strict';
const ActivityStreamModel = require('../dbmodels/mongo/activitystream');
const CommentModel = require('../dbmodels/mongo/comment')
const FeedWorker = require('./feedworker/feedworker')
module.exports = class ActivityStreamService {
    constructor(config) {
        this.config=config
    }

    async run(message, db) {
      return 1
        // try {
        //     let activityStream = new ActivityStreamModel(message);
        //     let newActivity = await activityStream.save()
        //     console.log(newActivity)
        //     await FeedWorker.queueFeed(newActivity,db)
        //     return 1
        // }
        // catch (e) {
        //     console.log(e)
        // }
    }
}
