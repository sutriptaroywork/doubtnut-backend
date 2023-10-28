/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-15 18:11:23
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-16 14:05:34
*/
"use strict";

const Utility = require('../../../modules/utility');
const Course_History = require('../../../modules/course_history');
const Question = require('../../../modules/question');
const Community = require('../../../modules/community');
// const Class = require('../../../modules/class');
// const Student = require('../../../modules/student');
const Notification = require('../../../modules/notifications');
const LanguageContainer = require('../../../modules/containers/language');
const Data = require('../../../data/data');
const ElasticSearch = require('../../../modules/elasticSearch');
const QuestionHelper = require('../../../server/helpers/question.helper');
const moment = require('moment')
const fs = require('fs')
const bluebird = require('bluebird')
bluebird.promisifyAll(fs);
let uploadDirectory = "/uploads/"
let db, elasticSearchInstance;
let blobUrl = "https://doubtnutvideobiz.blob.core.windows.net/q-images/"

const _ = require('lodash');
let config, elasticSearchClient, blobService
const vision = require('@google-cloud/vision');


async function getCommunityMeta(req, res, next) {
  try {
    db = req.app.get('db');
    let student_id = req.user.student_id;
    let promises = [];
    let class1 = req.user.student_class;
    let data = {};
    // let student_id = req.user.student_id;
    // Course_History.getStudentDetailsBySid(student_id, db.mysql.read).then((values) => {
    // let studentCourseClass = await Course_History.getStudentDetailsBySid(student_id, db.mysql.read)
    // if (studentCourseClass.length > 0) {
    //   class1 = studentCourseClass[0].class;
      // student_course = studentCourseClass[0].course;
      promises.push(Community.getCommunityChapters(class1, db.mysql.read));
      promises.push(Community.getCommunitySubtopics(class1, db.mysql.read));
      let resolvedPromises = await Promise.all(promises)
      if (resolvedPromises[0]) {
        data.chapter = resolvedPromises[0].map((chapter) => chapter.chapter)
      }
      if (resolvedPromises[1]) {
        data.subtopic = resolvedPromises[1].map((subtopic) => subtopic.subtopic);
      }
      //console.log(resolvedPromises);
      //console.log("hello");
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS",
        },
        "data": data
      }
      res.status(responseData.meta.code).json(responseData)
    // } else {
    //   let responseData = {
    //     "meta": {
    //       "code": 403,
    //       "success": false,
    //       "message": "No student history",
    //     },
    //     "data": null
    //   }
    //   res.status(responseData.meta.code).json(responseData)
    // }
  } catch (e) {
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "ERROR",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData)
  }
}

async function addQuestion(req, res, next) {
  try {
    let qid = req.body.question_id;
    let chapter = req.body.chapter;
    let subtopic = req.body.subtopic;
    let student_id = req.user.student_id;
    let sns = req.app.get('sns');
    const { communityQuestionSnsUrl } = Data;
    //console.log(qid);
    db = req.app.get('db');
    let promises = [];
    promises.push(Question.updateFlagCommunity(qid, db.mysql.write));
    promises.push(Community.addCommunityQuestionMeta(qid, chapter, subtopic, db.mysql.write));
    let resolvedPromises = await Promise.all(promises)
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS"
      },
      "data": null
    }
      /*
      Activity Stream Entry
      */
      //   db.redis.read.publish("activitystream_service", JSON.stringify({
      //   "actor_id":req.user.student_id,
      //   "actor_type":"USER",
      //   "actor":{"student_username":req.user.student_username,"user_avatar":req.user.img_url},
      //   "verb":"COMMUNITY",
      //   "object":"",
      //   "object_id":qid,
      //   "object_type":"QUESTION",
      //   "target_id":"",
      //   "target_type":"",
      //   "target":"",
      // }));

    res.status(responseData.meta.code).json(responseData)
    QuestionHelper.sendSnsMessage({
        type: 'community-question',
        sns,
        qid,
        UtilityModule: Utility,
        communityQuestionSnsUrl,
        config,
    });
    Notification.communityQuestionPosted(student_id,req.user.gcm_reg_id,qid,null,db)
  } catch (e) {
    //console.log(e)
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "ERROR",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData)
  }
}

function getCommunityQuestions(req, res, next) {

  db = req.app.get('db');
  let student_id = req.user.student_id;
  Course_History.getStudentDetailsBySid(student_id, db.mysql.read).then(function (values) {
    let class1 = values.class;
    Question.getQuestionsByCommunity(class1, db.mysql.read).then((values) => {
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS",
        },
        "data": values
      }
      res.status(responseData.meta.code).json(responseData)
    }).catch((error) => {
      next(error)

      // let responseData = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "ERROR",
      //   },
      //   "data": null,
      //   "error": error
      // }
      // res.status(responseData.meta.code).json(responseData)
    });

  });

}

async function upvoteQuestions(req, res, next) {
  try {
    let sid = req.user.student_id;
    let student_ask_id;
    let qid = req.body.question_id;
    db = req.app.get('db');
    let resolvedPromises = await Community.getCommuniytAskId(qid, sid, db.mysql.read)
    if (resolvedPromises.length > 0) {
      if (resolvedPromises[0].student_id != sid) {
        student_ask_id = resolvedPromises[0].student_id;
        resolvedPromises = await Community.upvoteQuestions(qid, sid, db.mysql.write)
        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS",
          },
          "data": null
        }
        res.status(responseData.meta.code).json(responseData)
        Notification.communityUpvoteQuestion(student_ask_id, qid, null, db)
        Notification.communityQuestionVoted(sid,req.user.gcm_reg_id, qid, null, db)
      } else {
        let responseData = {
          "meta": {
            "code": 403,
            "success": false,
            "message": "ERROR - CANNOT UPVOTE YOUR OWN QUESTION",
          },
          "data": null
        }
        res.status(responseData.meta.code).json(responseData)
      }
    } else {
      let responseData = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "Invalid qid or sid",
        },
        "data": null
      }
      res.status(responseData.meta.code).json(responseData)
    }
  } catch (e) {
    //console.log(e)
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block",
    //   },
    //   "data": null
    // }
    // res.status(responseData.meta.code).json(responseData)
  }
}

function getTopVotedQuestions(req, res, next) {

  db = req.app.get('db');
  let student_id = req.user.student_id;
  Course_History.getStudentDetailsBySid(student_id, db.mysql.read).then(function (values) {
    let class1 = values.class;
    let promises = [];
    promises.push(Community.getTopVotedQuestions(class1, db.mysql.read));
    promises.push(Community.getRecentQuestions(class1, db.mysql.read));
    Promise.all(promises).then((values) => {
      let data = [];
      data.push(values[0]);
      data.push(values[1]);
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": data
      }
      res.status(responseData.meta.code).json(responseData)

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
      // res.status(responseData.meta.code).json(responseData)
    });
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
    // res.status(responseData.meta.code).json(responseData)
  });
}

async function askCommunity(req, res, next) {

  try {
    config = req.app.get('config')
    elasticSearchClient = req.app.get('client')
    blobService = req.app.get('blobService')
    let publicPath = req.app.get('publicPath')
    db = req.app.get('db')
    elasticSearchInstance = new ElasticSearch(elasticSearchClient, config)

    let question_text = req.body.question_text
    let student_id = req.user.student_id
    let locale = req.body.locale
    let subject = req.body.subject
    let chapter = req.body.chapter
    let ques = req.body.question
    let student_class = req.body.class
    let question_image = req.body.question_image

    let ocr, qid, insertedQuestion = {}, filedToUpdate = {}, promises = []
    student_id = (student_id) ? parseInt(student_id) : 0;
    locale = ((locale) && (locale !== "")) ? locale : 'en';
    insertedQuestion["student_id"] = student_id
    insertedQuestion["class"] = student_class
    insertedQuestion["subject"] = subject
    insertedQuestion["book"] = subject
    insertedQuestion["chapter"] = chapter
    insertedQuestion["question"] = ques
    insertedQuestion["doubt"] = ques
    insertedQuestion["locale"] = locale
    insertedQuestion["is_community"] = 1;


    // //console.log(insertedQuestion)
    let insertQuestionResult = await Question.addQuestion(insertedQuestion, db.mysql.write)
    // //console.log(insertQuestionResult)
    qid = insertQuestionResult['insertId']
    if (qid) {
      //check for image
      if ((typeof question_text === 'undefined' || question_text.length === 0) && (typeof question_image !== 'undefined' && question_image.length > 0)) {
        //   // res.end("image")
        let extension
        if (question_image.indexOf("png") !== -1) extension = ".png"
        else if (question_image.indexOf("jpg") !== -1 || question_image.indexOf("jpeg") !== -1)
          extension = ".jpg"
        question_image = question_image.replace(/^data:([A-Za-z-+/]+);base64,/, "");
        const fileName = "upload_" + moment().unix() + extension;
        await fs.writeFileAsync(publicPath + "/uploads/" + fileName, question_image, 'base64')
        // //console.log(fileSaveResult)
        //TODO: add redis pub event to upload image to blob
        filedToUpdate['question_image'] = fileName


        //   //console.log("question_image")
        //   //console.log(question_image)
        //let buf = new Buffer(question_image, 'base64');
        //
        // let is_uploaded = await Utility.uploadImageToBlob(blobService, fileName, buf) // upload file
        //   //console.log(blobUrl + fileName)
        //   // //console.log(is_uploaded)
        //   //console.log(qid)
        //   res.end(qid.toString())

        // } else if (question_text) {
        //   res.send("text")
        //
        let host = req.protocol + "://" + req.headers.host

        let transLateApiResp, latex, ocr, locale, latexToAscii
        let visionApiResp = await Utility.visionApi(publicPath + "/uploads/" + fileName)
        if (visionApiResp[0]['fullTextAnnotation']) {
          let text = visionApiResp[0]['textAnnotations'][0]['description']
          locale = visionApiResp[0]['textAnnotations'][0]['locale']
          // let data = [locale, text]
          if (locale !== "en") {
            if (text !== "") {
              //console.log('3.5')
              transLateApiResp = await Utility.translateApi(text)
              //console.log('3.7')
              //console.log("pretext")
              if (transLateApiResp.length > 0) {
                text = transLateApiResp.text
              }
            }
          }
          //console.log("text")
          if (text.length <= 85) {
            latex = await Utility.mathpixOcr(host, fileName, config);
            latex = latex.latex
            if (latex.length > 0) {
              latexToAscii = await Utility.latexToAscii(latex);
              //console.log("latexToAscii")
              //console.log(latexToAscii)
              latex = latexToAscii
            } else {
              latex = ""
            }
            if (text.length < 2 * latex.length) {
              ocr = latex;
            } else {
              ocr = latex + " " + text;
            }
          } else {
            ocr = text;
          }
        } else {
          ocr = ""
          locale = ""
        }
        ocr = ocr.replace("& dd; ", "d");
        ocr = ocr.replace("& compfn; ", "@");
        ocr = ocr.replace("\n", "");
        ocr = ocr.replace("\r", "");
        ocr = ocr.replace('"', "");
        ocr = ocr.replace("α", "alpha");
        ocr = ocr.replace("β", "beta");
        ocr = ocr.replace("π", "pi");
        ocr = ocr.replace("θ", "theta");
        ocr = ocr.replace("°", "^@");
        ocr = ocr.replace("γ", "gamma");
        ocr = ocr.replace("δ", "delta");
        ocr = ocr.replace("Δ", "Delta");
        ocr = ocr.replace("φ", "phi");
        ocr = ocr.replace("ω", "omega");
        ocr = ocr.replace("Ω", "Omega");
        ocr = ocr.replace("λ", "lambda");
        ocr = ocr.replace("μ", "mu");
        ocr = ocr.replace("Σ", "sum");
        ocr = ocr.replace("Π", "prod");
        ocr = ocr.replace("→", "vec");
        ocr = ocr.replace("∞", "oo");
        ocr = ocr.replace("√", "sqrt");
        ocr = ocr.replace("& sol;", "/");
        ocr = ocr.replace("& compfn;", "@");
        filedToUpdate["ocr_done"] = 1
        filedToUpdate["ocr_text"] = ocr
        filedToUpdate["locale"] = locale

        promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
        // promises.push(elasticSearchInstance.findByOcr(ocr));
        // //console.log(updateRes)
        // res.send(filedToUpdate)
        // .then(visionApiResp => {
        //   //console.log(visionApiResp)
        //   res.send("test")
        // });
        // Utility.httpVision(question_image).then(visionApiResp => {
        //     //console.log("visionApiResp")
        //     //console.log(visionApiResp)
        //     res.send(visionApiResp)
        //   }).catch(err => {
        //     //console.log("error")
        //   //console.log(err)
        // });
        // const visionApiResp = await Utility.visionApi(blobUrl+fileName);
      } else if (typeof question_text !== 'undefined' && question_text.length > 0) {
        //question text
        if (locale !== "en") {
          let transLateApiResp = await Utility.translateApi(text)
          if (transLateApiResp.length > 0) {
            question_text = transLateApiResp.text
          }
        }
        filedToUpdate["ocr_done"] = 1
        filedToUpdate["ocr_text"] = question_text
        filedToUpdate["locale"] = locale
        promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
        // promises.push(elasticSearchInstance.findByOcr(question_text));
      }
      Promise.all(promises).then(values => {
        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS!"
          },
          "data": null
        }
        res.status(responseData.meta.code).json(responseData);
      }).catch(error => {
        next(error)

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error in updating or searching matches"
        //   },
        //   "data": null,
        //   "error": error
        // }
        // res.status(responseData.meta.code).json(responseData);
      })
      //TODO : upload to blob  and send notification from redis pub sub
    } else {
      //no qid ,problem in insertion
      //throw error
      let responseData = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "Error in inserting question;Please check parameters"
        },
        "data": null,
        "error": null
      }
      res.status(responseData.meta.code).json(responseData);
    }
  } catch (e) {
    //console.log("err")
    //console.log(e)
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }
}

async function getUnansweredQuestions(req, res, next) {
  config = req.app.get('config');
  db = req.app.get('db');
  let student_id = req.user.student_id;
  let page_no = req.params.page;
  let limit = 10
  // let class1;
  try {
    // let student = await Class.getStudentClass(student_id, db.mysql.read)
    // if (student.length > 0) {
    //   class1 = student[0].class
    // } else {
    //   class1 = req.user.student_class
    // }
    Question.getCommunityQuestions(student_id, page_no, limit, 1, db.mysql.read).then((values) => {
      for (let i = 0; i < values.length; i++) {
        if (typeof values[i]['question_image'] === 'undefined' || values[i]['question_image'] === null) {
          values[i]['image_url'] = null
        } else {
          values[i]['image_url'] = config.blob_url + "q-images/" + values[i]['question_image']
        }
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

async function getAnsweredQuestions(req, res, next) {
  db = req.app.get('db');
  config = req.app.get('config');
  let student_id = req.user.student_id;
  let page_no = req.params.page;
  let limit = 10
  let class1;
  try {
    // let student = await Class.getStudentClass(student_id, db.mysql.read)
    // if (student.length > 0) {
    //   class1 = student[0].class
    // } else {
    //   class1 = req.user.student_class
    // }
    Question.getCommunityQuestions(student_id, page_no, limit, 0, db.mysql.read).then((values) => {
      for (let i = 0; i < values.length; i++) {
        if (values[i]['matched_question'] == null) {
          if (typeof values[i]['question_id'] === 'undefined' || values[i]['question_id'] === null) {
            values[i]['image_url'] = null
          } else {
            values[i]['image_url'] = config.blob_url + "q-thumbnail/" + values[i]['question_id'] + ".png"
          }
        }else{
          values[i]['image_url'] = config.blob_url + "q-thumbnail/" + values[i]['matched_question'] + ".png"
        }
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

function getStats(req, res, next) {
  db = req.app.get('db');
  config = req.app.get('config');
  let student_id = req.user.student_id;
  let page = req.params.page;
  let limit = 10;
  Question.getStatsQuestions(student_id, page, limit, db.mysql.read).then((values) => {
    //console.log(values)
    for (let i = 0; i < values.length; i++) {
      if (values[i]['is_answered'] == 0) {
        if (values[i]['question_image'] == null) {
          values[i]['image_url'] = null
        } else {
          values[i]['image_url'] = config.blob_url + "q-images/" + values[i]['question_image']
        }
      } else {
        values[i]['image_url'] = config.blob_url + "q-thumbnail/" + values[i]['question_id'] + ".png"
      }
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
}

async function getCommunitySingleQuestion(req, res, next) {

  db = req.app.get('db');
  config = req.app.get('config');
  let question_id = req.params.question_id;
  let student_id = req.user.student_id;
  let language = "english"
  let lang = await LanguageContainer.getByCode(req.user.locale,db)
  //console.log("language")
  //console.log(lang)
  if(lang.length > 0) {
    language = lang[0]['language']
  }
  if (typeof question_id !== 'undefined' && !_.isNull(question_id)) {
    Question.getCommunityQuestionByQidWithLanguage(question_id, student_id, language,db.mysql.read).then(result => {
      //console.log(result)
      if(result[0]['is_answered']){
        if (result[0]['matched_question'] == null) {
          result[0]['image_url'] = config.blob_url + "q-thumbnail/" + result[0]['question_id'] + ".png"
        }else{
          result[0]['image_url'] = config.blob_url + "q-thumbnail/" + result[0]['matched_question'] + ".png"
        }
      }else if (result[0]['question_image'] == null) {
        result[0]['image_url'] = null
      } else {
        result[0]['image_url'] = config.blob_url + "q-images/" + result[0]['question_image']
      }

      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS!"
        },
        "data": result[0]
      }
      res.status(responseData.meta.code).json(responseData);
    }).catch(error => {
      next(error)

      // let responseData = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "Something in wrong"
      //   },
      //   "data": null,
      //   "error": error
      // }
      // res.status(responseData.meta.code).json(responseData);
    })
  } else {
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Invalid question id"
      },
      "data": null,
      "error": null
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

module.exports = {
  addQuestion,
  getCommunityMeta,
  getCommunityQuestions,
  upvoteQuestions,
  getTopVotedQuestions,
  askCommunity,
  getUnansweredQuestions,
  getAnsweredQuestions,
  getStats,
  getCommunitySingleQuestion
};
