/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-02 15:43:30
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-16 14:05:27
*/
"use strict";
let _ = require('lodash');
const Community = require('../../../modules/community')
const Question = require('../../../modules/question')
const Home = require('../../../modules/home')
const Feed = require('../../../modules/feed')
const Utility = require('../../../modules/utility')
const Notification = require('../../../modules/notifications')
const FeedContainer = require('../../../modules/containers/feed')
const bluebird = require('bluebird')
const async = require('async')
bluebird.promisifyAll(async);
require('../../../modules/mongo/comment')
require('../../../modules/mongo/post')
const mongoose = require("mongoose");
bluebird.promisifyAll(mongoose);


const Comment = mongoose.model("Comment");
const Post = mongoose.model("Post");
let config, db



async function getFeed(req, res, next) {

  try {
    db = req.app.get('db');
    config = req.app.get('config');
    let student_id = req.user.student_id;
    let promises = [];
    let data = [];
    let page_no = req.params.page
    let student_class = req.user.student_class;
    // let query

    //From here we can set limits
    let unanswererdLimit = 2, answererdLimit = 5, viralLimit = 1, trendingLimit = 1, engagementLimit = 2,matchedQuestionLimit = 6;

    // promises.push(Question.getCommunityQuestionsForFeed(student_id, page_no, answererdLimit, '0', db.mysql.read));
    promises.push(Feed.getMatchedQuestions(matchedQuestionLimit, page_no, db.mysql.read));
    promises.push(Question.getCommunityQuestionsForFeed(student_id, page_no, unanswererdLimit, 1, db.mysql.read));
    promises.push(Feed.getEngagementQuestions(student_id, student_class, engagementLimit, page_no, db.mysql.read));
    // promises.push(Question.getViralVideoByLimitWithViewsForForumFeed(student_id, viralLimit, page_no, db.mysql.read));
    // promises.push(Feed.getTrendingVideo(trendingLimit, page_no, student_class, student_id, db.mysql.read));


    let result = await Promise.all(promises);
    let values = [];


    if (result[0].length !== 0) {
     values = result[0];
      for (let i = 0; i < values.length; i++) {
        if (typeof values[i]['question_image'] === 'undefined' || values[i]['question_image'] === null) {
          values[i]['image_url'] = null
        } else {
          values[i]['image_url'] = config.blob_url + "q-images/" + values[i]['question_image']
        }
        if (typeof values[i]['profile_image'] === 'undefined' || values[i]['profile_image'] === '') {
          values[i]['profile_image'] = null
        }
        values[i]['type'] = "unanswered";
        values[i]['asked_by'] = values[i]['student_username'];
        values[i]['entity_name'] = "question";
        let query = {entity_type: values[i]['type'], entity_id: values[i]["question_id"], is_deleted: false}
        values[i]['comments_count'] = await Comment.countDocuments(query)
        values[i]['like_count'] = await Question.getLikeCount(values[i]['type'], values[i]["question_id"], db.mysql.read)
        values[i]['vote_count'] = await Question.getUpvoteCount(values[i]["question_id"], db.mysql.read)
        values[i]['like_count'] = values[i]['like_count'][0]['like_count']
        values[i]['vote_count'] = values[i]['vote_count'][0]['vote_count']
        data.push(values[i]);
      }
    }
    // values = [];
    if (result[1].length !== 0) {
      values = result[1];
      for (let i = 0; i < values.length; i++) {
        if (typeof values[i]['question_image'] === 'undefined' || values[i]['question_image'] === null) {
          values[i]['image_url'] = null
        } else {
          values[i]['image_url'] = config.blob_url + "q-images/" + values[i]['question_image']
        }
        if (typeof values[i]['profile_image'] === 'undefined' || values[i]['profile_image'] === '') {
          values[i]['profile_image'] = null
        }
        values[i]['type'] = "unanswered";
        values[i]['asked_by'] = values[i]['student_username'];
        values[i]['entity_name'] = "question";
        let query = {entity_type: values[i]['type'], entity_id: values[i]["question_id"], is_deleted: false}
        values[i]['comments_count'] = await Comment.countDocuments(query)
        values[i]['like_count'] = await Question.getLikeCount(values[i]['type'], values[i]["question_id"], db.mysql.read)
        values[i]['vote_count'] = await Question.getUpvoteCount(values[i]["question_id"], db.mysql.read)
        values[i]['like_count'] = values[i]['like_count'][0]['like_count']
        values[i]['vote_count'] = values[i]['vote_count'][0]['vote_count']
        data.push(values[i]);
      }
    }
    if (result[2].length !== 0) {
      values = result[2];
      for (let i = 0; i < values.length; i++) {
        values[i]['asked_by'] = "doubtnut";
        values[i]['profile_image'] = config.logo_path
        let query = {entity_type: values[i]['type'], entity_id: values[i]["id"], is_deleted: false}
        values[i]['comments_count'] = await Comment.countDocuments(query)
        values[i]['like_count'] = await Question.getLikeCount(values[i]['type'], values[i]["id"], db.mysql.read)
        values[i]['vote_count'] = await Question.getUpvoteCount(values[i]["id"], db.mysql.read)
        values[i]['like_count'] = values[i]['like_count'][0]['like_count']
        values[i]['vote_count'] = values[i]['vote_count'][0]['vote_count']
        if (values[i]['image_url'] === "") {
          values[i]['image_url'] = null;
        }
        if (values[i]['type'] === "polling") {
          var isPolled = 0;
          let pollResults = await Feed.getPollResults(values[i]["id"], db.mysql.read);
          //console.log("poll result")
          //console.log(pollResults)
          const index = pollResults.filter(obj => {
            if(obj.student_id === student_id){
              return obj
            }
          });
          //console.log("index")
          //console.log(index)
          // if (index !== -1) {
          //   isPolled = 1
          // }
          values[i]['user_response'] = null;

          if(index.length > 0){
            //console.log("polled")
            isPolled = 1
            values[i]['user_response'] = index[0]['option_id'];
          }
          values[i]['is_polled'] = isPolled;
          if (values[i]['options'] !== '' || values[i]['options'] !== null) {
            let options_value = values[i]['options'].split(":");
            if (options_value.length > 0) {
              values[i]['options'] = options_value;
            }
            else if (options_value.length === 0) {
              values[i]['options'] = [];
            }
          } else {
            values[i]['options'] = [];
          }
          values[i]['entity_name'] = "poll";
          values[i]['total_polled_count'] = pollResults.length;
          let result = Utility.calculatePollResults(pollResults, values[i]['options'])
          values[i]['result'] = result;
          data.push(values[i]);
        } else {
          values[i]['entity_name'] = values[i]['type'];
          delete values[i]['options']
          delete values[i]['blog_url']
          data.push(values[i]);
        }
      }
    }
    let firstThree = []
    let firstE = []
    let firstC = []
    let lastC = []
    let lastThree = []
    let lastE = []
    firstThree = data.slice(0,3)
    lastThree = data.slice(3,6)
    firstC = data.slice(6,7)
    lastC = data.slice(7,8)
    firstE = data.slice(8,9)
    lastE = data.slice(9,10)
    // for (let i = 0; i < data.length; i++) {
    //   if (data[i]['type'] === 'unanswered') {
    //     if (firstThree.length === 3) {
    //       lastThree.push(data[i])
    //     } else {
    //       firstThree.push(data[i])
    //     }
    //   }
    //   if (data[i]['type'] !== 'unanswered') {
    //     if (firstE.length === 0) {
    //       firstE.push(data[i])
    //     } else {
    //       lastE.push(data[i])
    //     }
    //   }
    // }
    data = Array.prototype.concat.apply([], [firstThree, firstC, firstE,lastThree,lastC,lastE]);
    let totalCount = 0;
    totalCount += data.length;
    if (totalCount < 10) {
      let ansPromise = await Feed.getRemainingAnsweredQuestions(10 - totalCount, page_no, req.user.student_class, student_id, db.mysql.read)
      for (let i = 0; i < ansPromise.length; i++) {
        if (typeof ansPromise[i]['question_id'] === 'undefined' || ansPromise[i]['question_id'] === null) {
          ansPromise[i]['image_url'] = null
        } else {
          ansPromise[i]['image_url'] = config.blob_url + "q-thumbnail/" + ansPromise[i]['question_id'] + ".png"
        }
        ansPromise[i]['profile_image'] = config.logo_path
        ansPromise[i]['type'] = "answered";
        let query = {entity_type: ansPromise[i]['type'], entity_id: ansPromise[i]["question_id"], is_deleted: false}
        ansPromise[i]['comments_count'] = await Comment.countDocuments(query)
        ansPromise[i]['asked_by'] = "doubtnut";
        ansPromise[i]['entity_name'] = "question";
        ansPromise[i]['like_count'] = await Question.getLikeCount(ansPromise[i]['type'], ansPromise[i]["question_id"], db.mysql.read)
        ansPromise[i]['vote_count'] = await Question.getUpvoteCount(ansPromise[i]["question_id"], db.mysql.read)
        ansPromise[i]['like_count'] = ansPromise[i]['like_count'][0]['like_count']
        ansPromise[i]['vote_count'] = ansPromise[i]['vote_count'][0]['vote_count']
        data.push(ansPromise[i]);
      }
    }
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!"
      },
      "data": data
    }
    res.status(responseData.meta.code).json(responseData);
  }
  catch (e) {
    //console.log(e);
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error!"
    //   },
    //   "data": null,
    //   'error': e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }
}



async function submitResult(req, res, next) {
  try {
    let db = req.app.get('db');
    let resource_type = req.body.type;
    let resource_id = req.body.id;
    let is_like = req.body.is_like;
    let student_id = req.user.student_id;
    let params = {}
    params.student_id = student_id
    params.resource_type = resource_type
    params.resource_id = resource_id
    params.is_like = is_like
    //check if user submitted the before
    let checkSubmit = await Feed.checkIsSubmit(student_id, resource_type, resource_id, db.mysql.read)
    if (checkSubmit.length > 0) {
      //update
      let result = await Feed.updateFeedResult(checkSubmit[0]['id'], is_like, db.mysql.write)
      //console.log("result")
      //console.log(result)
      if (result) {
        await FeedContainer.updateLikeCount(resource_type,resource_id,is_like,db)
        if(is_like){
          if(resource_type === "ugc"){
            //get post details
            let query = {_id:resource_id}
            // //console.log(query)
            let result = await Post.find(query);
            // //console.log(result)
            if(result[0]['student_id'] !== student_id){
              //console.log('send notification')
              let event = "feed_details"
              let title = req.user.student_username + " liked your post."
              let data ={id:resource_id,type:resource_type}
              let message = "Check now!!"
              Notification.sendNotification(result[0]['student_id'],event,title,message,null,data,null,db)
            }
            // return res.send(result)
          }
        }

        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS!"
          },
          "data": null
        }
        res.status(responseData.meta.code).json(responseData);
      } else {
        let responseData = {
          "meta": {
            "code": 403,
            "success": false,
            "message": "Unable to submit(update)"
          },
          "data": null
        }
        res.status(responseData.meta.code).json(responseData);
      }
    } else {
      //insert
      let result = await Feed.isLikeFeed(params, db.mysql.write)

      //console.log("result")
      //console.log(result)
      if (result['affectedRows']) {
        await FeedContainer.updateLikeCount(resource_type,resource_id,is_like,db)
        if(is_like){
          if(resource_type === "ugc"){
            //get post details
            let query = {_id:resource_id}
            // //console.log(query)
            let result = await Post.find(query);
            // //console.log(result)
            if(result[0]['student_id'] !== student_id){
              //console.log('send notification')
              let event = "feed_details"
              let title = req.user.student_username + " liked your post."
              let data ={id:resource_id,type:resource_type}
              let message = "Check now!!"
              Notification.sendNotification(result[0]['student_id'],event,title,message,null,data,null,db)
            }
            // return res.send(result)
          }
        }
        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS!"
          },
          "data": null
        }
        res.status(responseData.meta.code).json(responseData);
      } else {
        let responseData = {
          "meta": {
            "code": 403,
            "success": false,
            "message": "Unable to submit"
          },
          "data": null
        }
        res.status(responseData.meta.code).json(responseData);
      }
    }
            if (is_like) {
              /*
                 Activity Stream Entry
              */
                db.redis.read.publish("activitystream_service", JSON.stringify({
                  "actor_id":req.user.student_id,
                  "actor_type":"USER",
                  "actor":{"student_username":req.user.student_username,"user_avatar":req.user.img_url},
                  "verb":"LIKE",
                  "object":"",
                  "object_id":resource_id,
                  "object_type":resource_type,
                  "target_id":"",
                  "target_type":"",
                  "target":"",
              }));
        }else{
              /*
                 Activity Stream Entry
              */
                db.redis.read.publish("activitystream_service", JSON.stringify({
                  "actor_id":req.user.student_id,
                  "actor_type":"USER",
                  "actor":{"student_username":req.user.student_username,"user_avatar":req.user.img_url},
                  "verb":"DISLIKE",
                  "object":"",
                  "object_id":resource_id,
                  "object_type":resource_type,
                  "target_id":"",
                  "target_type":"",
                  "target":"",
             }));
        }

  } catch (e) {
    //console.log(e)
    next(e)

    // if (e.code === "ER_DUP_ENTRY") {
    //   let responseData = {
    //     "meta": {
    //       "code": 403,
    //       "success": false,
    //       "message": "Duplicate"
    //     },
    //     "data": null,
    //     // 'error': e
    //   }
    //   res.status(responseData.meta.code).json(responseData);
    // } else {
    //   let responseData = {
    //     "meta": {
    //       "code": 403,
    //       "success": false,
    //       "message": "Error!"
    //     },
    //     "data": null,
    //     'error': e
    //   }
    //   res.status(responseData.meta.code).json(responseData);
    // }
  }
}


module.exports = {getFeed, submitResult};
