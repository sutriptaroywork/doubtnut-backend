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
    let position=5
    //From here we can set limits
    let unanswererdLimit = 1, engagementLimit = 2, matchedQuestionLimit = 1, answeredLimit = 1, productFeatureLimit = 1,
      viralVideosLimit = 3,ugcContentLimit = 6;
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
    // //console.log("filter")
    // //console.log(filter)
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
        // //console.log("my filter")
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
      case "ugc":
        if (ugc != null) {
          promises.push(FeedContainer.getUgcContentAfterId(ugc,student_class, page_no, ugcContentLimit, db))
        }else{
          promises.push(promises.push(FeedContainer.getUgcContent(student_class, page_no, ugcContentLimit, db)))
        }
        break;
      case "education":
        promises.push(FeedContainer.getExtraFilterEngagement('education', student_class,dn_logo, page_no, 10,db))
        break;
      case "funny":
        promises.push(FeedContainer.getExtraFilterEngagement('funny',student_class,dn_logo, page_no, 10,db))
        break;
      case "popular":
        promises.push(FeedContainer.getExtraFilterEngagement('popular',student_class,dn_logo, page_no, 10,db))
        break;
      case "entertainment":
        promises.push(FeedContainer.getExtraFilterEngagement('entertainment',student_class,dn_logo, page_no, 10,db))
        break;
      default:
        promises.push(FeedContainer.getEngagementQuestions(dn_logo, student_class, engagementLimit, productFeatureLimit, viralVideosLimit, page_no, db));
        if (matched != null && unanswered != null && answered != null && ugc != null) {
          promises.push(FeedContainer.getUgcContentAfterId(ugc,student_class, page_no, ugcContentLimit, db))
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
    if(page_no==="1"){
      promises.push(FeedContainer.getAppBanners(student_class, db))
    }
    let result = await Promise.all(promises)
    // //console.log("result")
    // //console.log(result)
    let values = [];
    let lastMatchedId;
    let lastCommunityId;
    let lastAnsweredId;
    let lastUgcId;

    //MY FILTER___________________________________________________________________________________________________
    if (filter == 'my') {
      // //console.log('reached in my filter')
      //My MATCHED
      if (result[0].length !== 0) {
        values = result[0];
        lastMatchedId = values[values.length - 1]['id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateMatchedData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          value =  Utility.changeUsernameNAvatar(student_class,value)
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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }
    //UGC
    if (filter == null) {
      if ((result[1].length !== 0)) {
        // //console.log("UGC")
        // //console.log(result[1])
        values = result[1];
        lastUgcId = values[values.length - 1]['_id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateUgcData(values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

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
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }


    if (filter == null) {
      //contest winners
      if (result[5].length > 0) {
        values = result[5];
        data = await Utility.generateContestTypes(data, config.cdn_url, values, page_no, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
        // data =  await Utility.getImage(data,FeedContainer,db)
        data =  Utility.changeUsernameNAvatar(student_class,data)
      }
      //quiz winners
      if (result[6].length > 0) {
        values = result[6];
        let value = await Utility.generateQuizWinners(config.cdn_url, values, page_no, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
        // value =  await Utility.getImage(value,FeedContainer,db)
        value =  Utility.changeUsernameNAvatar(student_class,value)

        data.push(value);
      }
      //quiz/milestone
      // if (result[7].length !== 0) {
      //   if (j === "quiz") {
      //     values = result[7][0];
      //     values = await Utility.generateQuizData(config.cdn_url, values, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
      //     values =  await Utility.getImage(values,FeedContainer,db)
      //
      //     data.push(values);
      //   } else if (j === "milestone") {
      //     values = result[7][0];
      //     values = await Utility.generateMilestone(config.cdn_url, values, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
      //     values =  await Utility.getImage(values,FeedContainer,db)
      //     data.push(values)
      //   }
      // }

      //rating/invite
      if (selectArray[0] === "invite") {
        let values = await Utility.generateInvite(config.cdn_url, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
        // values =  await Utility.getImage(values,FeedContainer,db)
        values =  Utility.changeUsernameNAvatar(student_class,values)

        data.push(values)
      } else {
        let values = await Utility.generateRateUs(config.cdn_url, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
        // values =  await Utility.getImage(values,FeedContainer,db)
        values =  Utility.changeUsernameNAvatar(student_class,values)

        data.push(values)
      }

    } else if (filter === "pdf") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    } else if (filter === "youtube") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    } else if (filter === "news") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }else if(filter === "ugc"){
      if ((result[0].length !== 0)) {
        // //console.log("UGC")
        // //console.log(result[0])
        values = result[0];
        lastUgcId = values[values.length - 1]['_id'];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateUgcData(values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)
          data.push(value);
        }
      }
    }else if (filter === "education") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }else if (filter === "funny") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }else if (filter === "popular") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }else if (filter === "entertainment") {
      if ((result[0].length !== 0)) {
        values = result[0];
        for (let i = 0; i < values.length; i++) {
          let value = await Utility.generateEngagementData(config.cdn_url, values[i], student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, Feed, db)
          // value =  await Utility.getImage(value,FeedContainer,db)
          value =  Utility.changeUsernameNAvatar(student_class,value)

          value['id'] = value['id'].toString()
          data.push(value);
        }
      }
    }



    if(filter === "my" || filter === "pdf"){
      // //console.log("testsetsetsetset1")
      data.sort(function(a, b){
        var keyA = new Date(a.created_at),
          keyB = new Date(b.created_at);
        // Compare the 2 dates
        if(keyA < keyB) return 1;
        if(keyA > keyB) return -1;
        return 0;
      });
      // //console.log(data)
    } else if (filter === "unanswered") {

    }else {
      data = Utility.shuffle(data)
    }
    if (page_no == 1) {
      // let s = await FeedContainer.isShowPinnedPost(student_id, filter, db)
      // if (s.length > 0) {
      if(typeof filter === 'undefined'){
        filter = "all"
      }
        let pinnedPost
        if(student_class=='11' || student_class=='12'){
          pinnedPost=[{id: 320,type: 'all',post_type:'viral_videos',title: 'Physics Chemistry Solutions live now!!',student_id: 98,is_active: 1,image_url: `${config.staticCDN}images/new_pcm_launch_16x9.webp`,class: student_class,question_id: 24383621,audio_url: null,app_version: '0.0.0',student_username: 'Doubtnut',profile_image: `${config.staticCDN}intro-video/logo_for_forum_student.png`} ]
        }
        else{
          pinnedPost = await FeedContainer.getPinnedPost(student_class, filter, db)
        }
      console.log("pinnedPost")
      console.log(pinnedPost)

        if (pinnedPost.length > 0) {
          let sample = {}
          sample.id = pinnedPost[0]['id']+"_pinned"
          sample.type = pinnedPost[0]['post_type']
          if(pinnedPost[0]['post_type'] === "viral_videos"){
            sample.question_id = pinnedPost[0]['question_id']
          }
          sample.text = pinnedPost[0]['title']
          sample.student_id = pinnedPost[0]['student_id']
          sample.created_at = pinnedPost[0]['created_at']
          sample.image_url = pinnedPost[0]['image_url']
          if(pinnedPost[0]['audio_url'] !== null){
            sample.audio = pinnedPost[0]['audio_url']
          }
          sample.profile_image = pinnedPost[0]['profile_image']

          if(pinnedPost[0]['post_type'] === "ugc"){ 
            sample.post_type = "JustAThought"
            sample.profile_image = `${config.staticCDN}images/logo.png`

          }
          if(pinnedPost[0]['post_type'] === "youtube"){
            sample.youtube_id = pinnedPost[0]['youtube_id']

          }
          sample.student_username = pinnedPost[0]['student_username']
          sample = await Utility.generateCommentLikeData(sample, student_id, Comment, CommentContainer, FeedContainer, MysqlFeed, db)
          data.unshift(sample)
        }
      // }
    }
    let filtersToSend = Utility.generateFilters(req)
    //Adding banner to particular positions
    // //console.log(data.length);
    if(page_no==='1')
    {
      for(let i=0;i<result[result.length-1].length;i++){
        if (!_.isNull(result[result.length-1][i]['action_data'])) {
          result[result.length-1][i]['action_data'] = JSON.parse(result[result.length-1][i]['action_data'])
        }
      }
      data.splice(position,0,{"type":"banner","list":result[result.length-1]})
    }
    // //console.log(data.length);
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!"
      },
      "data": {
        entities:  data,
        next_cursor: {
          "matched": lastMatchedId,
          "unanswered": lastCommunityId,
          "answered": lastAnsweredId,
          "ugc": lastUgcId
        },
        //filter
        filters: filtersToSend
      }
    }
    res.status(responseData.meta.code).json(responseData);
  }
  catch (e) {
    // //console.log(e);
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
module.exports = {getFeed};
