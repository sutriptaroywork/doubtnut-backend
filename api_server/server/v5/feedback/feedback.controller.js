/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-16 14:05:32
*/
"use strict";

const Feedback = require('../../../modules/feedback');
const Campaign = require('../../../modules/campaign');
const Student = require('../../../modules/student');
const Utility = require('../../../modules/utility');
const Notification = require('../../../modules/notifications');
const RedisUserAnswerFeedback = require('../../../modules/redis/userAnswerFeedback');
const RedisTotalLikes = require('../../../modules/redis/answer');
const AnswerContainer = require('../../../modules/containers/answer')
const _ = require('lodash');
let db;



async function addVideoFeedback(req, res, next) {


  try {
    db = req.app.get('db');
    let admin = req.app.get('fcm');
    let feedbackAction;
    let question_id = req.body.question_id;
    let answerData=await AnswerContainer.getByQuestionIdWithTextSolution(question_id, db)
   
    let rating = req.body.rating;
    let feedback = req.body.feedback;
    let view_time = req.body.view_time;
    let answer_id = answerData[0]['answer_id'];
    let answer_video = answerData[0]['answer_video'];
    let page= req.body.page
    if(answerData[0]['is_answered']==0 && answerData[0]['is_text_answered']==1){
      answer_id=answerData[0]['text_solution_id']
      answer_video='text'
    }
    let student_id = req.user.student_id;
    let video_feedback = {};
    video_feedback.answer_id = answer_id;
    video_feedback.question_id = question_id;
    video_feedback.student_id = student_id;
    video_feedback.rating = rating;
    video_feedback.feedback = feedback;
    video_feedback.view_time = 0;
    video_feedback.answer_video = answer_video;
    video_feedback.page=page
    feedback = await Feedback.getMaxVideoFeedback(student_id, question_id, answer_video, db.mysql.read);

    if (typeof feedback !== undefined && feedback.length > 0) {
      video_feedback.rating_id = feedback[0]['rating_id'];
      if (rating == 3) {
        //console.log("testsetsetset")
        video_feedback.is_active = 0
      } else {
        video_feedback.is_active = 1;
      }
      feedbackAction = await Feedback._updateVideoFeedback(video_feedback, db.mysql.write);
    }
    else {
      video_feedback.is_active = 1;
      feedbackAction = await Feedback._insertVideoFeedback(video_feedback, db.mysql.write);
      //  is active 1 insert in this query
    }
    //delete user_answer_feedback from redis because value is changed
    await RedisUserAnswerFeedback.deleteAnswerFeedBackByStudentNew(video_feedback.student_id, video_feedback.answer_id,video_feedback.answer_video, db.redis.write)
    //delete total like from redis because value is changed
    await RedisTotalLikes.deleteTotLikes(video_feedback.question_id, db.redis.write)

    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS"
      },
      "data": null
    }

    res.status(responseData.meta.code).json(responseData);
    // //console.log(feedbackAction);
    if (typeof feedbackAction !== undefined) {
      Notification.addVideoFeedbackNotification(rating, student_id, req.user.gcm_reg_id, admin, db)
    }
  }
  catch (e) {
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 404,
    //     "success": false,
    //     "message": "ERROR"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }
}


async function likedVideos(req, res, next) {


  try {
    db = req.app.get('db');

    let likedVideos = await Feedback.likedVideos(student_id, question_id, answer_video, db.mysql.read);

    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS"
      },
      "data": likedVideos
    }

    res.status(responseData.meta.code).json(responseData);
    // //console.log(feedbackAction);
  }
  catch (e) {
    next(e)

  }
}

module.exports = {
  addVideoFeedback
}

