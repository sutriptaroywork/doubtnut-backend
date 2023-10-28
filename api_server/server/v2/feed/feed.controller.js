/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-02 15:43:30
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-24T11:43:45+05:30
*/
"use strict";
let _ = require('lodash');
const Community = require('../../../modules/community')
const Question = require('../../../modules/question')
const Home = require('../../../modules/home')
const EntityReportModel = require('../../../modules/mongo/entityreport')
const MysqlFeed = require('../../../modules/mysql/feed')
const Feed = require('../../../modules/feed')
const FeedContainer = require('../../../modules/containers/feed')
const Utility = require('../../../modules/utility')
const PostModel = require('../../../modules/mongo/post')
const BannedUser = require('../../../modules/mysql/banneduser')
const CommentModel = require('../../../modules/mongo/comment');
const GroupChatMessageModel = require('../../../modules/mongo/groupchatmessage')
const bluebird = require('bluebird')
const async = require('async')
bluebird.promisifyAll(async);
require('../../../modules/mongo/comment')
const mongoose = require("mongoose");
bluebird.promisifyAll(mongoose);
const Comment = mongoose.model("Comment");
const Post = mongoose.model("Post");
const GroupChatMessage = mongoose.model("GroupChatMessage");
let config, db

function handleAsync(value, callback) {

  value['profile_image'] = config.logo_path
  value['asked_by'] = "doubtnut";

  if (value.type === "polling") {
    if (value['image_url'] === "") {
      value['image_url'] = null;
    }
    callback(null, value)
  } else {
    value['entity_name'] = value['type'];
    callback(null, value)
  }
}

function addOne(number, callback) {
  // process.nextTick(function () {
  //   callback(null, ++number);
  // });

}

//The done function must take an error first
// and the results array second
function done(error, result) {
  //console.log("map completed. Error: ", error, " result: ", result);
}

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
    let unanswererdLimit = 8, answererdLimit = 5, viralLimit = 1, trendingLimit = 1, engagementLimit = 2;

    // promises.push(Question.getCommunityQuestionsForFeed(student_id, page_no, answererdLimit, '0', db.mysql.read));
    promises.push(Question.getCommunityQuestionsForFeed(student_id, page_no, unanswererdLimit, 1, db.mysql.read));
    promises.push(Feed.getEngagementQuestions(student_id, student_class, engagementLimit, page_no, db.mysql.read));
    // promises.push(Question.getViralVideoByLimitWithViewsForForumFeed(student_id, viralLimit, page_no, db.mysql.read));
    // promises.push(Feed.getTrendingVideo(trendingLimit, page_no, student_class, student_id, db.mysql.read));


    let result = await Promise.all(promises);

    let values = [];
    // values = [];
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
    if (result[1].length !== 0) {
      values = result[1];
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
          let isPolled = 0;
          let pollResults = await Feed.getPollResults(values[i]["id"], db.mysql.read);
          const index = pollResults.filter(obj => {
            if (obj.student_id === student_id) {
              return obj
            }
          });
          values[i]['user_response'] = null;

          if (index.length > 0) {
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


    // values = []
    // if (result[1].length !== 0) {
    //   values = result[1];
    //   for (let i = 0; i < values.length; i++) {
    //     if (values[i]['matched_question'] == null) {
    //       if (typeof values[i]['question_id'] === 'undefined' || values[i]['question_id'] === null) {
    //         values[i]['image_url'] = null
    //       } else {
    //         values[i]['image_url'] = config.blob_url + "q-thumbnail/" + values[i]['question_id'] + ".png"
    //       }
    //     }
    //     else {
    //       values[i]['image_url'] = config.blob_url + "q-thumbnail/" + values[i]['matched_question'] + ".png"
    //     }
    //
    //     if (typeof values[i]['profile_image'] === 'undefined' || values[i]['profile_image'] === '') {
    //       values[i]['profile_image'] = null
    //     }
    //     values[i]['type'] = "answered";
    //     values[i]['asked_by'] = values[i]['student_username'];
    //     values[i]['entity_name'] = "question";
    //     // values[i]['created_at'] = values[i]['timestamp'];
    //     // delete values[i]['qid'];
    //
    //     data.push(values[i]);
    //   }
    // }


    // values = []
    // if (result[2].length !== 0) {
    //   values = result[2];
    //   if (values.length > 0) {
    //     for (let i = 0; i < values.length; i++) {
    //       values[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + values[i]['question_id'] + ".png"
    //       values[i]['image_url'] = config.blob_url + "q-thumbnail/" + values[i]['question_id'] + ".png"
    //
    //
    //       values[i]['profile_image'] = config.logo_path;
    //
    //       values[i]['total_views'] = Utility.getViews(values[i]['total_views'])
    //       values[i]['type'] = "viral_videos";
    //       values[i]['asked_by'] = "doubtnut";
    //       values[i]['entity_name'] = "question";
    //       delete values[i]['old_views']
    //       delete values[i]['new_views']
    //       data.push(values[i]);
    //     }
    //   }
    // }


    // values = []

    // if (result[2].length !== 0) {
    //   values = result[2];
    //   for (let i = 0; i < values.length; i++) {
    //     if (typeof values[i]['question_id'] === 'undefined' || values[i]['question_id'] === null) {
    //       values[i]['image_url'] = null
    //     } else {
    //       values[i]['image_url'] = config.blob_url + "q-thumbnail/" + values[i]['question_id'] + ".png"
    //     }
    //     values[i]['profile_image'] = config.logo_path
    //     values[i]['type'] = "trending_videos";
    //     let query = {entity_type: values[i]['type'], entity_id: values[i]["question_id"], is_deleted: false}
    //     values[i]['comments_count'] = await Comment.countDocuments(query)
    //     values[i]['asked_by'] = "doubtnut";
    //     values[i]['entity_name'] = "question";
    //     values[i]['like_count'] = await Question.getLikeCount(values[i]['type'],values[i]["question_id"],db.mysql.read)
    //     values[i]['vote_count'] = await Question.getUpvoteCount(values[i]["question_id"],db.mysql.read)
    //     values[i]['like_count'] = values[i]['like_count'][0]['like_count']
    //     values[i]['vote_count'] = values[i]['vote_count'][0]['vote_count']
    //     delete values[i]['qid'];
    //     data.push(values[i]);
    //   }
    // }
    let firstFour = []
    let firstE = []
    let lastFour = []
    let lastE = []
    for (let i = 0; i < data.length; i++) {
      if (data[i]['type'] === 'unanswered') {
        if (firstFour.length === 4) {
          lastFour.push(data[i])
        } else {
          firstFour.push(data[i])
        }
      }
      if (data[i]['type'] !== 'unanswered') {
        if (firstE.length === 0) {
          firstE.push(data[i])
        } else {
          lastE.push(data[i])
        }
      }
    }
    data = Array.prototype.concat.apply([], [firstFour, firstE, lastFour, lastE]);
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

async function getFeedAnsweredQuestions(req, res, next) {
  db = req.app.get('db');
  let config = req.app.get('config');
  let student_id = req.user.student_id;
  let page_no = req.params.page;
  let answererdLimit = 10
  let class1;
  try {
    // let student = await Class.getStudentClass(student_id, db.mysql.read)
    // if (student.length > 0) {
    //   class1 = student[0].class
    // } else {
    //   class1 = req.user.student_class
    // }
    Question.getCommunityQuestionsForFeed(student_id, page_no, answererdLimit, '2', db.mysql.read).then((values) => {
      for (let i = 0; i < values.length; i++) {
        if (values[i]['matched_question'] == null) {
          if (typeof values[i]['question_id'] === 'undefined' || values[i]['question_id'] === null) {
            values[i]['image_url'] = null
          } else {
            values[i]['image_url'] = config.blob_url + "q-thumbnail/" + values[i]['question_id'] + ".png"
          }
        }
        else {
          values[i]['image_url'] = config.blob_url + "q-thumbnail/" + values[i]['matched_question'] + ".png"
        }

        if (typeof values[i]['profile_image'] === 'undefined' || values[i]['profile_image'] === '') {
          values[i]['profile_image'] = null
        }
        values[i]['type'] = "answered";
        if (typeof  values[i]['student_username'] !== 'undefined' && values[i]['student_username'] !== null && values[i]['student_username'] !== '') {
          values[i]['asked_by'] = values[i]['student_username'];
        } else {
          values[i]['asked_by'] = "Doubtnut User";
        }
        values[i]['entity_name'] = "question";
        // values[i]['created_at'] = values[i]['timestamp'];
        // delete values[i]['qid'];
      }
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS!"
        },
        "data": values
      }
      res.status(responseData.meta.code).json(responseData);
    }).catch((error) => {
      //console.log(error)
      next(error)

      // let responseData = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "ERROR"
      //   },
      //   "data": null,
      //   "error": error
      // }
      // res.status(responseData.meta.code).json(responseData);
    });
  } catch (e) {
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "ERROR"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }
}


async function updatePolls(req, res, next) {

  try {

    db = req.app.get('db');
    let config = req.app.get('config');
    let poll_id = req.body.poll_id;
    let option_id = req.body.option_id;
    let student_id = req.user.student_id;
    let promises = [];
    let data = [];
    let student_class = req.user.student_class;


    let result = await Feed.updatePollsResult(poll_id, student_id, option_id, db.mysql.write);
    if (result !== null && result !== undefined) {
      let allOptions = await Feed.getAllOptions(poll_id, db.mysql.read);
      let options = (allOptions[0].en_options).split(":");

      let count = await Feed.getOptionCounts("total", poll_id, null, db.mysql.read);
      let weightage = await Feed.calcWeightage(options.length, count[0]['totalCount'], poll_id, db.mysql.read);
      for (let i = 0; i < weightage.length; i++) {
        data.push({"option": options[i], "value": weightage[i]});
      }
      /*
      Activity Stream Entry
      */
        db.redis.read.publish("activitystream_service", JSON.stringify({
          "actor_id":req.user.student_id,
          "actor_type":"USER",
          "actor":{"student_username":req.user.student_username,"user_avatar":req.user.img_url},
          "verb":"POLLED",
          "object":"",
          "object_id":poll_id,
          "object_type":"POLL",
          "target_id":"",
          "target_type":"",
          "target":"",
      }));

      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS!"
        },
        "data": {
          "poll_id": poll_id,
          "result": data,
          "user_response": option_id,
          "correct_option": allOptions[0].en_correct_option
        }
      }
      res.status(responseData.meta.code).json(responseData);

    }

  }
  catch (e) {
    //console.log(e)
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

async function getEntityDetails(req, res, next) {

  try {
    db = req.app.get('db');
    let config = req.app.get('config');
    let id = req.body.id;
    let type = req.body.type;
    let student_id = req.user.student_id;
    let promises = [];
    let data = [];
    let student_class = req.user.student_class;
    let response;
    if (type == "unanswered") {
      //console.log('1')
      response = await Feed.getEntityDetails(type, student_id, student_class, id, db.mysql.read);
      //console.log("response")
      //console.log(response)
      if (response.length > 0) {
        if (typeof response[0]['question_image'] === 'undefined' || response[0]['question_image'] === null) {
          response[0]['image_url'] = null
        } else {
          response[0]['image_url'] = config.blob_url + "q-images/" + response[0]['question_image']
        }
        response[0]['type'] = "unanswered";
        if (typeof response[0]['profile_image'] === 'undefined' || response[0]['profile_image'] === '') {
          response[0]['profile_image'] = null;
        }
        response[0]['asked_by'] = response[0]['student_username'];
        response[0]['entity_name'] = "question";
        response[0]['vote_count'] = await Question.getUpvoteCount(id, db.mysql.read)
        response[0]['vote_count'] = response[0]['vote_count'][0]['vote_count']
        delete response[0]['qid'];
        //console.log(response)
      }
    }
    else if (type == "answered") {
      response = await Feed.getEntityDetails(type, student_id, student_class, id, db.mysql.read);
      if (response.length > 0) {
        response[0]['vote_count'] = 0

        if (response[0]['matched_question'] == null) {
          if (typeof response[0]['question_id'] === 'undefined' || response[0]['question_id'] === null) {
            response[0]['image_url'] = null
          } else {
            response[0]['image_url'] = config.blob_url + "q-thumbnail/" + response[0]['question_id'] + ".png"
          }
        }
        else {
          response[0]['image_url'] = config.blob_url + "q-thumbnail/" + response[0]['matched_question'] + ".png"
        }

        if (typeof response[0]['profile_image'] === 'undefined' || response[0]['profile_image'] === '') {
          response[0]['profile_image'] = null;
        }
        response[0]['type'] = "answered";
        response[0]['asked_by'] = response[0]['student_username'];
        response[0]['entity_name'] = "question";
        delete response[0]['qid'];
        //console.log(response)
      }
    }
    // else if (type == "viral_videos") {
    //   response = await Feed.getEntityDetails(type, student_id, student_class, id, db.mysql.read);
    //   if (response.length > 0) {
    //
    //     response[0]['image_url'] = config.blob_url + "q-thumbnail/" + response[0]['question_id'] + ".png"
    //     response[0]['total_views'] = Utility.getViews(response[0]['total_views'])
    //     response[0]['type'] = "viral_videos";
    //     response[0]['asked_by'] = "doubtnut";
    //     response[0]['entity_name'] = "question";
    //     response[0]['profile_image'] = config.logo_path;
    //     // response[0]['created_at'] = response[0]["timestamp"];
    //     delete response[0]['old_views']
    //     delete response[0]['new_views']
    //   }
    // }
    else if (type == "trending_videos") {
      response = await Feed.getEntityDetails(type, student_id, student_class, id, db.mysql.read);
      if (response.length > 0) {
        response[0]['vote_count'] = 0

        if (typeof response[0]['question_id'] === 'undefined' || response[0]['question_id'] === null) {
          response[0]['image_url'] = null
        } else {
          response[0]['image_url'] = config.blob_url + "q-thumbnail/" + response[0]['question_id'] + ".png"
        }
        response[0]['type'] = "trending_videos";
        response[0]['asked_by'] = "doubtnut";
        response[0]['entity_name'] = "question";
        response[0]['profile_image'] = config.logo_path;

        delete response[0]['qid'];
      }
    }
    else if (type == "ncert_questions") {
      response = await Feed.getEntityDetails(type, student_id, student_class, id, db.mysql.read);
      if (response.length > 0) {

        if (typeof response[0]['question_id'] === 'undefined' || response[0]['question_id'] === null) {
          response[0]['image_url'] = null
        } else {
          response[0]['image_url'] = config.blob_url + "q-thumbnail/" + response[0]['question_id'] + ".png"
        }
        response[0]['type'] = "ncert_questions";
        response[0]['asked_by'] = "doubtnut";
        response[0]['entity_name'] = "question";
        response[0]['profile_image'] = config.logo_path;
        // response[0]['created_at'] = response[0]['timestamp'];
      }
    }
    if (type == "polling" || type == "success-story" || type == "news" || type == "blog" || type == "trending-questions" || type == "tips" || type == "viral_videos") {
      response = await Feed.getEntityDetails(type, student_id, student_class, id, db.mysql.read);
      //console.log(response)
      if (response.length > 0) {
        response[0]['vote_count'] = 0

        if (type === 'polling') {
          if (response[0]['options'] != '' || response[0]['options'] != null) {
            let options_value = response[0]['options'].split(":");
            if (options_value.length > 0) {
              response[0]['options'] = options_value;
            }
            else if (options_value.length == 0) {
              response[0]['options'] = [];
            }
          }
          else {
            response[0]['options'] = [];
          }
          let isPolled = 0;
          let checkResult = await Feed.checkUserAnsweredPolls(student_id, response[0]['id'], db.mysql.read);
          if (checkResult.length > 0) {
            isPolled = 1;
            response[0]['user_response'] = response[0]['option_id'];
          }
          else {
            isPolled = 0;
            response[0]['user_response'] = null;

          }

          let options = response[0]['options'];

          let count = await Feed.getOptionCounts("total", response[0]["id"], null, db.mysql.read);
          response[0]['total_polled_count'] = count[0]['totalCount'];

          let weightage = await Feed.calcWeightage(options.length, count[0]['totalCount'], response[0]['id'], db.mysql.read);
          response[0]['result'] = [];
          for (let j = 0; j < weightage.length; j++) {
            response[0]['result'].push({"option": options[j], "value": weightage[j]});
          }

          response[0]['is_polled'] = isPolled;
          response[0]['entity_name'] = "poll";
        }
        else {
          response[0]['entity_name'] = response[0]['type'];
          delete response[0]['options'];
        }


        if (response[0]['image_url'] == "" || response[0]['image_url'] == undefined) {
          response[0]['image_url'] = null;
        }

        response[0]['asked_by'] = "doubtnut";
        response[0]['profile_image'] = config.logo_path;
        // response[0]['created_at'] = response[0]['start_date'] + "T" + response[0]['start_time'] + ":00.000Z";

      }
    }
    let query = {entity_type: type, entity_id: id, is_deleted: false}
    // let getCommentQuery = {entity_type: type, entity_id: id, is_deleted: false,$or : [{question_id:{$exists : true}},{image:{$exists:true}}]}
    let result = await Comment.countDocuments(query)
    //console.log("result")
    //console.log(result)
    //console.log(response)
    response[0]['comments_count'] = await Comment.countDocuments(query)
    // response[0]['top_comment'] = await Comment.find(getCommentQuery).limit( 1 ).sort( { createdAt: -1 } )
    response[0]['like_count'] = await Question.getLikeCount(type, id, db.mysql.read)
    response[0]['like_count'] = response[0]['like_count'][0]['like_count']
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": response[0]
    }
    res.status(responseData.meta.code).json(responseData);
  }
  catch (e) {
    //console.log(e)
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

async function getData(req, res, next) {
  try {
    db = req.app.get('db')
    let config = req.app.get('config')
    let type = req.params.type, data
    let student_class = req.user.student_class
    if (!_.isNull(type) && !_.isEmpty(type)) {
      if (type == "banner") {
        data = await FeedContainer.getAppBanners(student_class, db)
        for (let i = 0; i < data.length; i++) {
          //console.log("data")
          //console.log(data[i])
          if (!_.isNull(data[i]['action_data'])) {
            data[i]['action_data'] = JSON.parse(data[i]['action_data'])
          }
        }
        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "App banners"
          },
          "data": data
        }
        res.status(responseData.meta.code).json(responseData);
      }
    } else {
      let responseData = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "Error!"
        },
        "data": null,
        'error': "No type is passed in api"
      }
      res.status(responseData.meta.code).json(responseData);
    }
  } catch (e) {
    next(e)

  }
}

async function getEntityLikes(req, res, next) {
  try {
    db = req.app.get('db');
    let id = req.params.id;
    let type = req.params.type;
    let student_id = req.user.student_id;
    let student_avatar = req.user.img_url;
    let student_username = req.user.student_username;
    let created_at = req.user.created_at;
    let data = {};
    let response;
    response = await MysqlFeed.entityLikes(id, type, db.mysql.read);
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!"
      },
      "data": response
    }
    res.status(responseData.meta.code).json(responseData);
  }
  catch (e) {
    next(e)
  }
}

async function reportEntity(req, res, next) {
  try {
    db = req.app.get('db');
    let entity_type = req.body['entity_type']
    let entity_id = req.params['entityId']
    let student_id = req.user.student_id;
    let student_avatar = req.user.img_url;
    let student_username = req.user.student_username;
    let message = "";
    if (req.body['message']) {
      message = req.body['message']
    }

    let entity_report_data = {
      student_id: student_id,
      student_username: student_username,
      student_avatar: student_avatar,
      entity_type: entity_type,
      entity_id: entity_id,
      message: message
    }

    let entity_report = new EntityReportModel(entity_report_data);
    entity_report.save().then(async result => {
      if(entity_type === 'group_chat'){
        let query = GroupChatMessage.where({_id: entity_id});
        let reported_message = await GroupChatMessage.findOne(query).lean()
        let reported_array = reported_message['reported_by']
        let index = reported_array.indexOf(student_id)
        if (index == -1) {
          reported_array.push(student_id)
          let update = await GroupChatMessage.updateOne(query, {$set: {reported_by: reported_array}})
        }
      }
      if (entity_type == 'ugc' || entity_type == 'group_chat') {
        let entity_reports = await EntityReportModel.find({"entity_id": entity_id,"entity_type":entity_type})
        console.log(entity_reports)
        if (entity_reports.length > 0) {
          let group_report_by_users = _.keys(_.groupBy(entity_reports,'student_id'))
          console.log(group_report_by_users)
          if (group_report_by_users.length > 9) {
           let postData = {
                _id:entity_id
            }
            if (entity_type == 'ugc') {
              PostModel.findOne(postData).then( async result => {
                console.log(result)
                if (result.student_id) {
                  let checkbanned = await BannedUser.getBannedUserBystudentIdAndModule(db.mysql.read,result.student_id)
                  if (checkbanned.length > 0) {
                    console.log("BANNED")
                    //already BANNED
                  }else{
                    let criteria = {
                      "student_id":result.student_id.toString()
                    }
                    //console.log(criteria)
                    let deleteugc = await PostModel.updateMany(criteria, { is_deleted: true })
                    let deletecomment = await  CommentModel.updateMany(criteria, { is_deleted: true })
                    let bandata = {
                      'student_id':result.student_id,
                      'app_module':'ALL',
                      'ban_type':'Perma',
                      'is_active':'1'
                    }
                    console.log(bandata)
                    let insertBan = "INSERT INTO banned_users SET ?"
                    console.log(insertBan)
                    let data = await db.mysql.write.query(insertBan,bandata)
                    console.log(data)
                  }
                }
              })
            }else if ( entity_type =='group_chat') {
              GroupChatMessageModel.findOne(postData).then( async result => {
                console.log(result)
                if (result.student_id) {
                  let checkbanned = await BannedUser.getBannedUserBystudentIdAndModule(db.mysql.read,result.student_id)
                  if (checkbanned.length > 0) {
                    console.log("BANNED")
                    //already BANNED
                  }else{
                    let criteria = {
                      "student_id":result.student_id.toString()
                    }

                    let deleteugc = await PostModel.updateMany(criteria, { is_deleted: true })
                    let deletecomment = await  CommentModel.updateMany(criteria, { is_deleted: true })
                    let deletemsg = await GroupChatMessageModel.updateMany(criteria, { is_deleted: true })
                    let bandata = {
                      'student_id':result.student_id,
                      'app_module':'ALL',
                      'ban_type':'Perma',
                      'is_active':'1'
                    }
                    console.log(bandata)
                    let insertBan = "INSERT INTO banned_users SET ?"
                    console.log(insertBan)
                    let data = await db.mysql.write.query(insertBan,bandata)
                    console.log(data)
                  }
                }
              })
            }
          }
        }
      }
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": result
      }
      res.status(responseData.meta.code).json(responseData);
    })

  }
  catch (e) {
    next(e)
  }
}

async function addOg(req, res, next) {
  try {
    //console.log(req.headers.host)
    let post_id = req.body.post_id
    let og_title = req.body.og_title
    let og_des = req.body.og_des
    let og_url = req.body.og_url
    let og_image = req.body.og_image
    let query = Post.where({_id: post_id});
    let updateQuery = {og_title: og_title, og_des: og_des, og_url: og_url, og_image: og_image};
    let result = await Post.findOneAndUpdate(query, updateQuery, {})
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!"
      },
      "data": null,
      'error': result
    }
    res.status(responseData.meta.code).json(responseData);
  } catch (e) {
    next(e)
  }
}

async function getPostsUnsubscribe(req,res,next){
  try{
      db = req.app.get('db');
      let entity_id = req.body.entity_id
      let entity_type = req.body.entity_type
      let student_id = req.user.student_id
      // let gcm_reg_id =req.user.gcm_reg_id
    let promise = []
    /*
      ! DEPRECATED. Maybe used in previous app verions. NEW API --> v2/commnet/mute
      * Admin Dependency Has been removed in US LAUNCH merge (PR#824 Us launch staging)
    */
    // promise.push(Utility.unsubscribeNotification(entity_type,entity_id,gcm_reg_id, null))
    promise.push(MysqlFeed.postsUnsubscribe(entity_id,entity_type,student_id,db.mysql.write))
    await Promise.all(promise)
      let responseData ={
        "meta":{
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": {
          "muted":0
        }
      }
      res.status(responseData.meta.code).json(responseData);
  }
  catch(e){
    //console.log(e)
    if(typeof e.code !== 'undefined' && e.code === "ER_DUP_ENTRY"){
      let responseData ={
        "meta":{
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": {
          "muted":0
        }
      }
      res.status(responseData.meta.code).json(responseData);
    }
    next(e)
  }
}

module.exports = {
  getFeed,
  updatePolls,
  submitResult,
  getEntityDetails,
  getFeedAnsweredQuestions,
  getData,
  getEntityLikes,
  reportEntity,
  addOg,
  getPostsUnsubscribe
};
