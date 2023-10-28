"use strict";
let _ = require('lodash');
// const FeedContainer = require('../../../modules/containers/feed')

const FeedContainer = require('../../../modules/containers/feed')
const CommentContainer = require('../../../modules/containers/comment')
const MysqlFeed = require('../../../modules/mysql/feed')
const FeedQuiz = require('../../../modules/mysql/quiz')
const Feed = require('../../../modules/feed')
const redisFeed = require("../../../modules/redis/feed")
const Utility = require('../../../modules/utility')
const Notification = require('../../../modules/notifications')
const moment = require('moment');

require('../../../modules/mongo/comment')
require('../../../modules/mongo/post')
const bluebird = require("bluebird");
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
    //From here we can set limits
    let unanswererdLimit = 1, engagementLimit = 3, matchedQuestionLimit = 1, answeredLimit = 1, productFeatureLimit = 1,
      viralVideosLimit = 2, ugcContentLimit = 6;
    let dn_logo = config.logo_path, j

    // 0 => matched
    // 1 => unanswered
    // 2 => answered
    // 3 => engagement
    // 4 => product feature
    // 5 => viral videos
    // 6 => rate/invite
    //7 => contest/quiz/milestone
    //8 => contest/quiz/milestone
    let matched = req.query.matched;
    let unanswered = req.query.unanswered;
    let answered = req.query.answered;
    let ugc = req.query.ugc;
    let filter = req.query.filter, selectArray;
    //console.log("filter")
    //console.log(filter)
    switch (filter) {
      case "answered":
        if ((answered != null) && (matched != null)) {
          promises.push(FeedContainer.getMatchedQuestionsAfterViewID(matched, student_class, 5, db));
          promises.push(FeedContainer.getAnsweredQuestionAfterAnswerId(answered, 5, student_class, db));
        }
        else {
          promises.push(FeedContainer.getMatchedQuestions(5, page_no, student_class, db));
          promises.push(FeedContainer.getAnsweredQuestion(page_no, 5, student_class, db));
        }
        promises.push(FeedContainer.getEngagementType('viral_videos', student_class, dn_logo, page_no, 10, db))
        break;
      case "unanswered":
        if (unanswered != null) {
          promises.push(FeedContainer.getCommunityQuestionsForFeedAfterId(unanswered, 1, 5, student_class, db));
        }
        else {
          promises.push(FeedContainer.getCommunityQuestionsForFeed(page_no, 5, 1, student_class, db));
        }
        break;
      case "my":
        //console.log("my filter")
        promises.push(FeedContainer.getMyMatchedQuestions(student_id, page_no, 5, db));
        promises.push(FeedContainer.getMyAnsweredQuestions(student_id, page_no, 5, db));
        promises.push(FeedContainer.getMyCommunityQuestionsForFeed(student_id, page_no, 5, db));
        promises.push(FeedContainer.getUgcContentByStudentId(student_id, page_no, ugcContentLimit, db))
        break;
      case "pdf":
        promises.push(FeedContainer.getEngagementType('pdf', student_class, dn_logo, page_no, 10, db));
        break;
      case "youtube":
        promises.push(FeedContainer.getEngagementType('youtube', student_class, dn_logo, page_no, 10, db))
        break;
      case "news":
        promises.push(FeedContainer.getEngagementType('news', student_class, dn_logo, page_no, 10, db))
        break;
      case "viral_videos":
        promises.push(FeedContainer.getEngagementType('viral_videos', student_class, dn_logo, page_no, 10, db))
        break;
      default:
        promises.push(FeedContainer.getEngagementQuestions(dn_logo, student_class, engagementLimit, productFeatureLimit, viralVideosLimit, page_no, db));
        if (matched != null && unanswered != null && answered != null) {
          promises.push(FeedContainer.getUgcContentAfterId(ugc, student_class, page_no, ugcContentLimit, db))
          promises.push(FeedContainer.getMatchedQuestionsAfterViewID(matched, student_class, matchedQuestionLimit, db));
          promises.push(FeedContainer.getAnsweredQuestionAfterAnswerId(answered, answeredLimit, student_class, db));
          promises.push(FeedContainer.getCommunityQuestionsForFeedAfterId(unanswered, 1, unanswererdLimit, student_class, db));
        } else {
          promises.push(FeedContainer.getUgcContent(student_class, page_no, ugcContentLimit, db))
          promises.push(FeedContainer.getMatchedQuestions(matchedQuestionLimit, page_no, student_class, db));
          promises.push(FeedContainer.getAnsweredQuestion(page_no, answeredLimit, student_class, db));
          promises.push(FeedContainer.getCommunityQuestionsForFeed(page_no, unanswererdLimit, 1, student_class, db));
        }
        promises.push(FeedContainer.getPreviousWinnerList("top", "max_views", page_no, db))
        promises.push(FeedContainer.getPreviousQuizWinnerList(page_no, db))

    }
    // Any 1 out of these
    selectArray = []
    // selectArray = ["quiz"]
    selectArray = Utility.shuffle(selectArray)
    j = selectArray[0];
    if (j === "quiz") {
      promises.push(FeedQuiz.checkQuizActiveAndUpcoming(student_class, student_id, db.mysql.read))
    } else if (j === "milestone") {
      promises.push(FeedContainer.getMilestone(1, page_no, db))
    }
    //Either rate us or Invites__________________________________________________________________________________
    let arr = ["rate", "invite"]
    selectArray = Utility.shuffle(arr)
    let result = await Promise.all(promises)
    //console.log("result")
    //console.log(result)
    let values = [];
    let lastMatchedId;
    let lastCommunityId;
    let lastAnsweredId;
    let lastUgcId;
    //MY FILTER___________________________________________________________________________________________________
    if (filter == 'my') {
      //console.log('reached in my filter')
      //My MATCHED
      if (result[0].length !== 0) {
        values = result[0];
        lastMatchedId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateMatchedData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
      //My ANSWERED
      if (result[1].length != 0) {
        values = result[1];
        lastAnsweredId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateAnsweredData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
      //My UNANSWERED
      if ((result[2].length !== 0)) {
        values = result[2];
        lastCommunityId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateUnansweredData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
      //UGC
      if ((result[3].length !== 0)) {
        values = result[3];
        // lastCommunityId = values[values.length - 1]['id'];
        lastUgcId = values[values.length - 1]['_id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateUgcData(values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          data.push(value);
        }
      }
    }

    //Engagement
    if (filter == null) {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    } else if (filter == 'answered') {
      if ((result[2].length !== 0)) {
        values = result[2];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }
    //UGC
    if (filter == null) {
      if ((result[1].length !== 0)) {
        //console.log("UGC")
        //console.log(result[1])
        values = result[1];
        lastUgcId = values[values.length - 1]['_id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateUgcData(values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          data.push(value);
        }
      }
    }
    //MATCHED
    if (filter == null) {
      if (result[2].length !== 0) {
        values = result[2];
        lastMatchedId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateMatchedData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    } else if (filter == 'answered') {
      if (result[0].length !== 0) {
        values = result[0];
        lastMatchedId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateMatchedData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }
    //ANSWERED
    if (filter == null) {
      if (result[3].length != 0) {
        values = result[3];
        lastAnsweredId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateAnsweredData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    } else if (filter == 'answered') {
      if (result[1].length !== 0) {
        values = result[1];
        lastMatchedId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateAnsweredData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }
    //UNANSWERED
    if (filter == null) {
      if ((result[4].length !== 0)) {
        values = result[4];
        lastCommunityId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateUnansweredData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }
    else if (filter == 'unanswered') {
      if ((result[0].length !== 0)) {
        values = result[0];
        lastCommunityId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateUnansweredData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }

    //ENGAGEMENT
    if (filter == null) {
      //contest winners
      if (typeof result[5] !== 'undefined' && result[5].length > 0) {
        values = result[5];
        data = await Utility.generateContestTypes(data, config.cdn_url, values, page_no, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
      }
      //quiz winners
      if (typeof result[6] !== 'undefined' && result[6].length > 0) {
        values = result[6];
        let value = await Utility.generateQuizWinners(config.cdn_url, values, page_no, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
        data.push(value);
      }
      //quiz/milestone
      // if (result[7].length !== 0) {
      //   if (j === "quiz") {
      //     values = result[7][0];
      //     values = await Utility.generateQuizData(config.cdn_url, values, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
      //     data.push(values);
      //   } else if (j === "milestone") {
      //     values = result[7][0];
      //     values = await Utility.generateMilestone(config.cdn_url, values, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
      //     data.push(values)
      //   }
      // }
      if (page_no == 1) {
        //rating/invite
        if (selectArray[0] === "invite") {
          let values = await Utility.generateInvite(config.cdn_url, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          data.push(values)
        } else {
          let values = await Utility.generateRateUs(config.cdn_url, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          data.push(values)
        }
      }


    } else if (filter === "pdf") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    } else if (filter === "youtube") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    } else if (filter === "news") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }

    if (filter === "my" || filter === "pdf") {
      data.sort(function (a, b) {
        var keyA = new Date(a.created_at),
          keyB = new Date(b.created_at);
        // Compare the 2 dates
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
      });
      //console.log(data)
      if (page_no > 1 && data.length === 1) {
        data.push(data[0])

      }
    } else if (filter === "unanswered") {
      // if (page_no == 1) {
      //   let s = await FeedContainer.isShowPinnedPost(student_id, filter, db)
      //   if (s.length > 0) {
      //     let pinnedPost = FeedContainer.getPinnedPost(student_class, filter, db)
      //     if (pinnedPost.length > 0) {
      //       data.unshift(pinnedPost[0])
      //     }
      //   }
      // }
    } else {
      data = Utility.shuffle(data)
    }
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!"
      },
      "data": {
        entities: data,
        next_cursor: {
          "matched": lastMatchedId,
          "unanswered": lastCommunityId,
          "answered": lastAnsweredId,
          "ugc": lastUgcId
        },
        //filter
        filters: [{key: 'unanswered', description: 'ANSWER IT!'}, {
          key: 'answered',
          description: 'RECENT VIDEOS'
        }, {
          key: 'news',
          description: 'NEWS'
        }, {key: 'my', description: 'MY ACTIVITY'}]
      }
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
    FeedContainer.getCommunityQuestionsForFeed(page_no, answererdLimit, '2', db.mysql.read).then((values) => {
      for (let i = 0; i < values.length; i++) {
        if (values[i]['matched_question'] == null) {
          if (typeof values[i]['question_id'] === 'undefined' || values[i]['question_id'] === null) {
            values[i]['image_url'] = null
          } else {
            values[i]['image_url'] = config.cdn_url + "q-thumbnail/" + values[i]['question_id'] + ".png"
          }
        }
        else {
          values[i]['image_url'] = config.cdn_url + "q-thumbnail/" + values[i]['matched_question'] + ".png"
        }

        if (typeof values[i]['profile_image'] === 'undefined' || values[i]['profile_image'] === '') {
          values[i]['profile_image'] = null
        }
        values[i]['type'] = "answered";
        if (typeof values[i]['student_username'] !== 'undefined' && values[i]['student_username'] !== null && values[i]['student_username'] !== '') {
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
      let responseData = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "ERROR"
        },
        "data": null,
        "error": error
      }
      res.status(responseData.meta.code).json(responseData);
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

        if (parseInt(params.is_like)) { //update if user likes the feed
          FeedContainer.getFeedByUserId(student_id, db).then(feed => {
            feed.like[params.resource_id] = [{entity_id: params.resource_id}]
            redisFeed.setFeedByUserId(student_id, JSON.stringify(feed), db.redis.write);
          }).catch(error => {
            //console.log(error)
          });

        } else {
          FeedContainer.getFeedByUserId(student_id, db).then(feed => {
            delete feed.like[params.resource_id]
            redisFeed.setFeedByUserId(student_id, JSON.stringify(feed), db.redis.write);
          }).catch(error => {
            //console.log(error)
          });
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

        if (parseInt(params.is_like)) { //only insert to redis if user likes the feed
          FeedContainer.getFeedByUserId(student_id, db).then(feed => {
            feed.like[params.resource_id] = [{entity_id: params.resource_id}]
            redisFeed.setFeedByUserId(student_id, JSON.stringify(feed), db.redis.write);
          }).catch(error => {
            //console.log(error)
          });
          if (resource_type === "ugc") {
            //get post details
            let query = {_id: resource_id}
            // //console.log(query)
            let result = await Post.find(query);
            // //console.log(result)
            if (result[0]['student_id'] !== student_id) {
              //console.log('send notification')
              let event = "feed_details"
              let title = req.user.student_username + " liked your post."
              let data = {id: resource_id, type: resource_type}
              let message = "Check now!!"
              Notification.sendNotification(result[0]['student_id'], event, title, message, null, data, null, db)
            }
            return res.send(result)
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
    /*
    if (type == "unanswered" || type == "matched") {
      //console.log('1')
      response = await Feed.getEntityDetails(type, student_id, student_class, id, db.mysql.read);
      if (response.length > 0) {
        if (typeof response[0]['question_image'] === 'undefined' || response[0]['question_image'] === null) {
          response[0]['image_url'] = null
        } else {
          response[0]['image_url'] = config.cdn_url + "q-images/" + response[0]['question_image']
        }
        response[0]['type'] = "unanswered";
        if (typeof response[0]['profile_image'] === 'undefined' || response[0]['profile_image'] === '') {
          response[0]['profile_image'] = null;
        }
        response[0]['asked_by'] = response[0]['student_username'];
        response[0]['entity_name'] = "question";
        // response[0]['vote_count'] = await Question.getUpvoteCount(id, db.mysql.read)
        // response[0]['vote_count'] = response[0]['vote_count'][0]['vote_count']
        delete response[0]['qid'];
        //console.log(response)
      }
    }
    */
    //Saayon code____________________________________________________________________________________________________
    if (type == 'matched') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);

      if (typeof response[0]['question_image'] === 'undefined' || response[0]['question_image'] === null) {
        response[0]['image_url'] = null
      } else {
        response[0]['image_url'] = config.cdn_url + "images/" + response[0]['question_image']
      }
      delete response[0]['question_image'];
      delete response[0]['matched_question'];
    } else if (type == 'unanswered') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      if (typeof response[0]['question_image'] === 'undefined' || response[0]['question_image'] === null) {
        response[0]['image_url'] = null
      } else {
        response[0]['image_url'] = config.cdn_url + "images/" + response[0]['question_image']
      }
      delete response[0]['question_image'];
    } else if (type == 'answered') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      // if (typeof response[0]['question_image'] === 'undefined' || response[0]['question_image'] === null) {
      //   response[0]['image_url'] = null
      // } else {
      //   response[0]['image_url'] = config.cdn_url + "q-images/" + response[0]['question_image']
      // }
      //delete response[0]['question_image'];
      if (response[0]['matched_question'] == null) {
        response[0]['image_url'] = config.cdn_url + "q-thumbnail/" + response[0]['question_id'] + ".png"
      }
      else {
        response[0]['image_url'] = config.cdn_url + "q-thumbnail/" + response[0]['matched_question'] + ".png"
      }
      delete response[0]['matched_question']
    } else if (type == 'viral_videos') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
    } else if (type == 'pdf') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      delete response[0]['correct_option'];
      delete response[0]['title'];
      delete response[0]['image_url'];
      delete response[0]['action'];
      delete response[0]['question_id'];
      delete response[0]['options'];
    } else if (type == 'youtube') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      delete response[0]['correct_option'];
      delete response[0]['title'];
      delete response[0]['options'];
      delete response[0]['blog_url'];
      delete response[0]['question_id'];
      delete response[0]['action'];

    } else if (type == 'url') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      delete response[0]['correct_option'];
      delete response[0]['title'];
      delete response[0]['options'];
      delete response[0]['blog_url'];
      delete response[0]['question_id'];
      delete response[0]['action'];
      response[0]['image_url'] = response[0]['profile_image'];
    } else if (type == 'polling') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      let isPolled = 0;
      let pollResults = await Feed.getPollResults(response[0]["id"], db.mysql.read);
      const index = pollResults.filter(obj => {
        if (obj.student_id === student_id) {
          return obj
        }
      });
      response[0]['user_response'] = null;

      if (index.length > 0) {
        isPolled = 1
        response[0]['user_response'] = index[0]['option_id'];
      }
      response[0]['is_polled'] = isPolled;
      if (response[0]['options'] !== '' || response[0]['options'] !== null) {
        let options_value = response[0]['options'].split(":");
        if (options_value.length > 0) {
          response[0]['options'] = options_value;
        }
        else if (options_value.length === 0) {
          response[0]['options'] = [];
        }
      } else {
        response[0]['options'] = [];
      }
      response[0]['total_polled_count'] = pollResults.length;
      response[0]['result'] = Utility.calculatePollResults(pollResults, response[0]['options']);

    } else if (type == 'news' || type == 'blog') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
    } else if (type == 'product_features') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      delete response[0]['correct_option'];
      delete response[0]['options'];
      delete response[0]['blog_url'];
      delete response[0]['question_id'];
      response[0]['button_text'] = response[0]['text'];
    } else if (type == 'contest_winners') {
      let sample = {};
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      //console.log(response);
      let cont = id.split("_");
      sample.type = "contest_winners"
      sample.id = cont[0];
      sample.id2 = id;
      sample.student_username = 'doubtnut'
      sample.text = "Contest winners for " + cont[1];
      sample.profile_image = `${config.staticCDN}images/logo.png`
      sample.created_at = response[0]['date'];
      sample.student_list = response;
      sample.action = 'daily_contest'
      sample.action_data = null;
      //console.log(sample);
      response = [sample];
    } else if (type == 'success-story') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      delete response[0]['correct_option'];
      delete response[0]['title'];
      delete response[0]['options'];
      delete response[0]['blog_url'];
      delete response[0]['question_id'];
      delete response[0]['action'];
    } else if (type == 'milestones') {
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      let d = Utility.createMilestoneText(response[0]['view_type'], response[0]['count'])
      response[0]["text"] = d[0];
      response[0].image_url = d[1];
    } else if (type == 'quiz_winners') {
      let sample = {};
      response = await Feed.getEntityDetailsNew(type, id, db.mysql.read);
      //console.log("*********************************************************************************************");
      //console.log(response);
      sample.type = "quiz_winners"
      sample.id = req.user.student_id
      sample.id2 = id;
      sample.student_username = 'doubtnut'
      sample.text = "QUiz winners for " + id;
      sample.profile_image = `${config.staticCDN}images/logo.png`
      sample.created_at = response[0]['date_q'];
      //console.log(response[0]['date_q']);
      sample.student_list = response;
      sample.action = 'quiz'
      sample.action_data = null;
      //console.log(sample);
      response = [sample];
    } else if (type = "ugc") {
      let query = {_id: id}
      // {
      //   "type": "ugc",
      //   "id": "5c0b5ff5094eaf2a294993d1",
      //   "post_type": "meme",
      //   "student_id": "705281",
      //   "text": "textsdsds",
      //   "image_url": "",
      //   "audio": "${config.staticCDN}UGC_Audio/e418e9b05a249ef9836d64cf6d686e53",
      //   "video": "",
      //   "student_username": "neilviv",
      //   "profile_image": "${config.staticCDN}images/upload_705281_1541017323.png",
      //   "created_at": "2018-12-08T11:38:53.631Z",
      //   "comments_count": 0,
      //   "like_count": 0,
      //   "is_like": 0,
      //   "top_comment": {}
      // }
      //console.log(query)
      response = await await Post.find(query);
      //console.log("response")
      //console.log(response)
      response = [Utility.generateUgcDataWithoutLikeComment(response[0])]
      //console.log(response)

    }
    //console.log("resssssssssssssssssssssssssssssss")
    //console.log(response)
    let is_like = await MysqlFeed.isUserLikeEntity(response[0]['type'], response[0]["id"], student_id, db.mysql.read);
    response[0].is_like = (is_like.length > 0) ? 1 : 0;
    response[0]['comments_count'] = await CommentContainer.getCommentCount(response[0]['type'], response[0]['id'], Comment, db)
    response[0].like_count = await FeedContainer.getLikeCount(response[0]['type'], response[0]["id"], db)
    response[0].like_count = response[0].like_count[0]['like_count']
    let resolvePromises = await CommentContainer.getTopComment(response[0]['type'], response[0]['id'], Comment, db)
    if (resolvePromises.length !== 0) {
      response[0]['top_comment'] = resolvePromises[0];
    } else {
      response[0]['top_comment'] = {}
    }

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

// async function getEntityLikes(req,res,next){
//   try {
//     db = req.app.get('db');
//     let id = req.body.id;
//     let type =req.body.type;
//     let student_id =req.user.student_id;
//     let student_avatar =req.user.img_url;
//     let student_username =req.user.student_username;
//     let created_at =req.user.created_at;
//     let data ={};
//     let response;

//     response = await MysqlFeed.entityLikes(id, type,db.mysql.read);
//     //data.id= student_id

//      let responseData = {
//         "meta": {
//           "code": 200,
//           "success": true,
//           "message": "SUCCESS!"
//         },
//         "data": response
//       }
//       res.status(responseData.meta.code).json(responseData);
//   }
//   catch (e) {
//     next(e)
//   }
// }

module.exports = {getFeed, updatePolls, submitResult, getEntityDetails, getFeedAnsweredQuestions};
