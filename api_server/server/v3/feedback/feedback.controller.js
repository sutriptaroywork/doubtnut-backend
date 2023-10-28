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
const QuestionContainer = require('../../../modules/containers/question');
const _ = require('lodash');


let db;


function addAnswerFeedback(req, res, next) {


  db = req.app.get('db');

  // res.send("ok");

  let question_id = req.body.question_id;
  let rating = req.body.rating;
  let feedback = req.body.feedback;
  let is_approved = req.body.is_approved;

  let answers = {};
  let answer_id;
  let expert_id;
  let experts = {};
  let answerdata = {}

  // //console.log("all params");  // working

  Feedback._getAnswerByQuestionId(question_id, db.mysql.read).then(function (values) {
    answers.answer_rating = rating;
    answers.answer_feedback = feedback;
    answers.is_approved = is_approved;
    answer_id = values[0].answer_id;
    expert_id = values[0].expert_id;
    answerdata =  values[0]

    //console.log("expert_id");

    //console.log(expert_id);


    //console.log("answers");
    //console.log(answers);


    Feedback._updateAnswerTable(answers, answer_id, db.mysql.write).then(function (values) {


      //console.log(expert_id);


      Feedback._getExpertById(expert_id, db.mysql.read).then(function (value) {


        //console.log("values");

        //console.log(value);

        experts = value;

        if (rating == 0) {


          // _negative_feedback_recieved(question_id,experts,database).then(function(values){


          //console.log("ratings");

          /*
            Activity Stream Entry
           */
          db.redis.read.publish("activitystream_service", JSON.stringify({
            "actor_id":req.user.student_id,
            "actor_type":"USER",
            "actor":{"student_username":req.user.student_username,"user_avatar":req.user.img_url},
            "verb":"FEEDBACK",
            "object":answerdata,
            "object_id":answer_id,
            "object_type":"VIDEO",
            "target_id":expert_id,
            "target_type":"USER",
            "target":"",
          }));
          // });

          let responseData = {
            "meta": {
              "code": 200,
              "message": "SUCCESS",
            },
            "data": "Finally Sent"
          }


          res.status(responseData.meta.code).json(responseData);


        } else {

          let responseData = {
            "meta": {
              "code": 403,
              "message": "",
            },
            "data": "Not updating the rating"
          }

          res.status(responseData.meta.code).json(responseData);

        }
        // return value;

      }).catch(function (error) {
        next(error)

        //console.log(error);
      });


    }).catch(function (error) {
      next(error)

      //console.log(error);
    });


  }).catch(function (error) {

    next(error)


    //console.log("error" + error);
  });


}


async function addVideoFeedback(req, res, next) {


  try {
    db = req.app.get('db');
    let admin = req.app.get('fcm');
    let feedbackAction;
    // res.send("ok");
    let question_id = req.body.question_id;
    let answerData=await AnswerContainer.getByQuestionId(question_id, db)
    ////console.log(answerData[0]['answer_video'])
    let rating = req.body.rating;
    let feedback = req.body.feedback;
    let view_time = req.body.view_time;
    let answer_id = answerData[0]['answer_id'];
    let answer_video = answerData[0]['answer_video'];
    let page= req.body.page
    ////console.log(req.body.page)
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
    await RedisUserAnswerFeedback.deleteAnswerFeedBackByStudent(video_feedback.student_id, video_feedback.answer_id, db.redis.write)
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


function addAnswerFeedbackForMatchedQuestion(req, res, next) {


  db = req.app.get('db');

  // res.send("ok");

  let parent_question_id = req.body.p_id;
  let rating = req.body.rating;
  let feedback = req.body.feedback;

  let answer_id = req.body.answer_id;
  let question_id = req.body.question_id;
  let student_id = req.body.student_id;
  let is_trial;

  let question_feedback;
  let answer_feedback = {};


  if (rating == 1) {


  } else {

    // Feedback._getQuestionById(question_id, db.mysql.read).then(function (values) {
      QuestionContainer.getByQuestionId(question_id, db).then(function (values) {
      question_feedback = values[0];

      //console.log(values);

      question_feedback.parent_id = parent_question_id;
      question_feedback.student_id = student_id;
      question_feedback.matched_question = question_id;
      question_feedback.question_credit = 0;
      question_feedback.is_answered = 1;


      // //console.log(question_feedback);

      is_trial = 0;

      Feedback._getActiveSubscriptionByStudentIdSecond(student_id, db.mysql.read).then(function (values) {

        //console.log("hello");
        //console.log(values);

        if (values[0].scheme_id == "NEW REGISTER") {

          is_trial = 1;

          //console.log(is_trial);


        } else {

          is_trial = 0;

          //console.log(is_trial);


        }

        question_feedback.is_trial = is_trial;

        //console.log("you are here");

        Feedback._addMatchedQuestion(question_feedback, db.mysql.write).then(function (values) {
          //console.log("hel");
          //console.log(values);

          let newQid = values;


          Feedback._getAnswerById(answer_id, db.mysql.read).then(function (values) {


            answer_feedback.question_id = newQid;
            answer_feedback.is_approved = 0;
            answer_feedback.answer_rating = 0;
            answer_feedback.answer_feedback = feedback;
            answer_feedback.expert_id = values[0].expert_id;
            answer_feedback.answer_video = values[0].answer_video;

            Feedback._addNewAnswerForNegativeFeedbackMatchedQuestion(answer_feedback).then(function (values) {

              let result = values;

              //console.log(result);

            }).catch(function (error) {
              next(error)

              //console.log(error);
            });
          }).catch(function (error) {
            next(error)

            //console.log(error);
          });
        }).catch(function (error) {
          next(error)

          //console.log(error);
        });
      }).catch(function (error) {
        next(error)

        //console.log(error);
      });
    }).catch(function (error) {
      next(error)

      //console.log(error);
    });
  }
}

async function getActiveFeedbacks(req, res, next) {
  db = req.app.get('db')
  let promises = []
  let student_id = req.user.student_id
  let responseData = []
  promises.push(Campaign.checkNps(student_id, db.mysql.read))
  promises.push(Feedback.getActiveFeedback(db.mysql.read))
  try {
    let resolvedPromises = await Promise.all(promises)
    //console.log("resolvedPromises")
    //console.log(resolvedPromises)
    if (resolvedPromises[0].length > 0) {
      let campaignResponse = await Campaign.getCampaignQuestion(resolvedPromises[0][0]['id'], db.mysql.read)
      if (campaignResponse.length > 0) {
        let npsData = {}
          npsData.type = "nps"
        npsData.title = campaignResponse[0]['question']
        npsData.question = campaignResponse[0]['question']
        npsData.id = resolvedPromises[0][0]['id']
        npsData.count = 0
        npsData.options = ''
        npsData.submit = "Submit"
        responseData.push(npsData)
      }
    }
    if (resolvedPromises[1].length > 0) {
      for (let i = 0; i < resolvedPromises[1].length; i++) {
        if (resolvedPromises[1][i]["feedback_type"] === "no_matches") {
          let noMatchData = {};
          noMatchData["type"] = "no_matches";
          noMatchData["title"] = resolvedPromises[1][i]["heading"];
          noMatchData["id"] = resolvedPromises[1][i]["id"];
          noMatchData["question"] = resolvedPromises[1][i]["question"];
          noMatchData["options"] = resolvedPromises[1][i]["options"];
          noMatchData["submit"] = resolvedPromises[1][i]["submit_text"];
          noMatchData["count"] = 1;
          responseData.push(noMatchData)
        }
        if (resolvedPromises[1][i]["feedback_type"] === "no_watch" && resolvedPromises[1][i]["feedback_resource"] === "matches") {
          let checkResponse = await Feedback.checkResponseGiven(student_id, db.mysql.read, 2)
          if (checkResponse.length == 0) {
            let noWatchMatches = {};
            noWatchMatches["type"] = "asked_but_not_watched";
            noWatchMatches["title"] = resolvedPromises[1][i]["heading"];
            noWatchMatches["id"] = resolvedPromises[1][i]["id"];
            noWatchMatches["question"] = resolvedPromises[1][i]["question"];
            noWatchMatches["options"] = resolvedPromises[1][i]["options"];
            noWatchMatches["submit"] = resolvedPromises[1][i]["submit_text"];
            noWatchMatches["count"] = 1;
            responseData.push(noWatchMatches)
          }
        }
      }
    }
    let response = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS",
      },
      "data": responseData,
      "error": null
    }
    res.status(response.meta.code).json(response)

  } catch (e) {
    //console.log(e)
    next(e)

    // let responseq = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseq.meta.code).json(responseq)
  }
}

async function submitFeedback(req, res, next) {
  db = req.app.get('db')
  let student_id = req.user.student_id
  let type = req.body.type
  try {
    if (type === "nps") {
      if ((typeof req.body.campaign_id !== 'undefined') && (!_.isNull(req.body.campaign_id)) && (!_.isNull(req.body.rating))) {
        let campaign_id = req.body.campaign_id
        let rating = req.body.rating
        let res1 = await Campaign.updateCampaignRating(campaign_id, student_id, rating, db.mysql.write)
        if (res1) {
          let response = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "SUCCESS",
            },
            "data": null,
            "error": null
          }
          res.status(response.meta.code).json(response)
        } else {
          let response = {
            "meta": {
              "code": 403,
              "success": false,
              "message": "error in updating",
            },
            "data": null,
            "error": null
          }
          res.status(response.meta.code).json(response)
        }
      } else {
        let response = {
          "meta": {
            "code": 403,
            "success": false,
            "message": "Invalid campaign id or rating",
          },
          "data": null,
          "error": null
        }
        res.status(response.meta.code).json(response)
      }
    } else {
      if (!_.isNull(req.body.feedback_id) && !_.isNull(req.body.options)) {
        let feedback_id = req.body.campaign_id
        let options = req.body.options
        let question_id = req.body.question_id
        let res2 = await Feedback.submitFeedback(student_id, feedback_id, options, question_id, db.mysql.write)
        if (res2) {
          let response = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "SUCCESS",
            },
            "data": null,
            "error": null
          }
          res.status(response.meta.code).json(response)
        } else {
          let response = {
            "meta": {
              "code": 403,
              "success": false,
              "message": "error in updating",
            },
            "data": null,
            "error": null
          }
          res.status(response.meta.code).json(response)
        }
      } else {
        let response = {
          "meta": {
            "code": 403,
            "success": false,
            "message": "Invalid feedback id or options",
          },
          "data": null,
          "error": null
        }
        res.status(response.meta.code).json(response)
      }
    }
  } catch (error) {
    next(error)

  }
}

module.exports = {
  addAnswerFeedback,
  addVideoFeedback,
  addAnswerFeedbackForMatchedQuestion,
  getActiveFeedbacks,
  submitFeedback
}

