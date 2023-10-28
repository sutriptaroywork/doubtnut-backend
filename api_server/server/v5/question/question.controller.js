/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-11 13:36:09
*/
"use strict";

const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
const Utility = require('../../../modules/utility');
const ElasticSearch = require('../../../modules/elasticSearch');
const Student = require('../../../modules/student');
const Language = require('../../../modules/language')
const Home = require('../../../modules/home')
const Localised = require('../../../modules/language')
const Class = require('../../../modules/class')
const Notification = require('../../../modules/notifications')
const VideoView = require('../../../modules/videoView')
const Constant = require('../../../modules/constants')
const QuestionContainer = require('../../../modules/containers/question')
const QuestionRedis= require('../../../modules/redis/question')
const AnswerContainer = require('../../../modules/containers/answer')
const ChapterContainer = require('../../../modules/containers/chapter')
const LanguageContainer = require('../../../modules/containers/language')
const QuestionSql = require('../../../modules/mysql/question')
const FeedbackContainer = require('../../../modules/containers/feedback')
let QuestionHelper = require('../../helpers/question.helper')
const Data = require('../../../data/data');

const uuidv4 = require('uuid/v4')
const moment = require('moment')

const fs = require('fs')
const bluebird = require('bluebird')
bluebird.promisifyAll(fs);



let db, elasticSearchInstance;


const _ = require('lodash');
let config, elasticSearchClient, blobService


async function ask(req, res, next) {
  let insertedQuestion = {}
  let sns = req.app.get('sns')
  const sqs = req.app.get('sqs');
  const { questionInitSnsUrl, userQuestionSnsUrl } = Data;
  config = req.app.get('config')
  try {
    config = req.app.get('config')
    let translate2 = req.app.get('translate2')
    elasticSearchClient = req.app.get('client')
    blobService = req.app.get('blobService')
    let publicPath = req.app.get('publicPath')
    db = req.app.get('db')
    let s3 = req.app.get('s3')
    elasticSearchInstance = req.app.get('elasticSearchInstance');
    let question_text = req.body.question_text
    let student_id = req.user.student_id
    let locale = req.body.locale
    let subject = req.body.subject
    subject="MATHS"
    let chapter = req.body.chapter
    let ques = req.body.question
    let student_class = req.body.class

    let matches_array, languages_arrays, languages_obj, handwritten = 0, question_image = null;

    let st_lang_code, qid, filedToUpdate = {}, promises = []

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
    let color=['#DBF2D9','#D9EEF2','#F2DDD9','#F2EED9','#D9DFF2','#EBD9F2']
    let feedback={}
    feedback.feedback_text='Happy with the Solutions'
    feedback.bg_color=_.sample(color)
    feedback.is_show=1

    promises.push(Question.addQuestion(insertedQuestion, db.mysql.write))
    promises.push(Localised.getList(db.mysql.read))
    let resolvedPromises = await Promise.all(promises)
    promises = []
    let insertQuestionResult = resolvedPromises[0]
    languages_arrays = resolvedPromises[1]
    qid = insertQuestionResult['insertId']

    const uuid = uuidv4();
    QuestionHelper.sendSnsMessage({
        type: 'question-init',
        sns,
        uuid,
        qid,
        studentId: student_id,
        studentClass: student_class,
        subject,
        chapter,
        version: insertedQuestion.question,
        ques,
        locale,
        UtilityModule: Utility,
        questionInitSnsUrl,
        config,
    });
    insertedQuestion["question_id"] = insertQuestionResult['insertId']
    if (qid) {

      //check for image
      if ((typeof question_text === 'undefined' || question_text.length === 0) && (!_.isEmpty(req.files) && req.files['question_image'].length > 0)) {
        question_image = req.files['question_image'][0];

        const fileName = question_image['filename']
        const filePath = question_image['path']

        let resourceImageData = await fs.readFileSync(question_image.path)

        promises.push(Utility.uploadTos3(s3, config.aws_bucket, question_image.filename, resourceImageData, question_image.mimetype))
        await Promise.all(promises)
        promises = []

        filedToUpdate['question_image'] = fileName
        insertedQuestion['question_image'] = fileName

        let host = req.protocol + "://" + req.headers.host
        let transLateApiResp, latex, ocr, locale, latexToAscii, text,ocr_text;

        let visionApiResp = await Utility.httpVisionApi(resourceImageData.toString('base64'))
        visionApiResp = visionApiResp['responses']

        //detect handwritten
        // if (visionApiResp[0]['webDetection'] !== null && visionApiResp[0]['webDetection']['bestGuessLabels'] !== null && visionApiResp[0]['webDetection']['bestGuessLabels'][0]['label'] === "handwriting") {
        //   handwritten = 1
        // }
        if (typeof visionApiResp[0]['fullTextAnnotation'] !== 'undefined' && visionApiResp[0]['fullTextAnnotation'] !== null) {
          text = visionApiResp[0]['textAnnotations'][0]['description']
          locale = visionApiResp[0]['textAnnotations'][0]['locale']
        } else {
          text = ""
        }
        // let data = [locale, text]
        if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
          if (text !== "") {
            //console.log('3.5')
            //console.log(text)
            transLateApiResp = await Utility.translateApi2(text,translate2)
            //console.log('3.7')
            //console.log("pretext")
            //console.log(transLateApiResp)
            if(transLateApiResp.length > 0 && transLateApiResp[1]['data'] !== undefined  && transLateApiResp[1]['data']['translations'] !== undefined &&  transLateApiResp[1]['data']['translations'][0]['translatedText'] !== undefined ){
              text = transLateApiResp[1]['data']['translations'][0]['translatedText']
            }
          }
        }
        if (text.length <= 85) {
          latex = await Utility.mathpixOcr(host, fileName, config);
          // //console.log("latex")
          // //console.log(latex)
          latex = latex.latex
          if (typeof latex !== 'undefined' && latex.length > 0) {
            latexToAscii = await Utility.latexToAscii(latex);
            // //console.log("latexToAscii")
            // //console.log(latexToAscii)
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

        ocr = Utility.replaceSpecialSymbol(ocr)
        filedToUpdate["ocr_done"] = 1
        filedToUpdate["ocr_text"] = ocr
        filedToUpdate["original_ocr_text"] = ocr
        filedToUpdate["locale"] = locale
        insertedQuestion["ocr_done"] = 1
        insertedQuestion["ocr_text"] = ocr
        insertedQuestion["original_ocr_text"] = ocr
        insertedQuestion["locale"] = locale

        promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
        promises.push(elasticSearchInstance.findByOcr(ocr));
        ocr_text=ocr

      } else if (typeof question_text !== 'undefined' && question_text.length > 0) {
        //question text

        if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
          let transLateApiResp = await Utility.translateApi(question_text)
          if (transLateApiResp.length > 0) {
            question_text = transLateApiResp.text
          }
        }
        question_text = Utility.replaceSpecialSymbol(question_text)
        filedToUpdate["ocr_done"] = 1
        filedToUpdate["ocr_text"] = question_text
        filedToUpdate["original_ocr_text"] = question_text
        filedToUpdate["locale"] = locale
        insertedQuestion["ocr_done"] = 1
        insertedQuestion["ocr_text"] = question_text
        insertedQuestion["original_ocr_text"] = question_text
        insertedQuestion["locale"] = locale
        promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
        promises.push(elasticSearchInstance.findByOcr(question_text));
        ocr_text=question_text
      }else{
        let responseData = {
          "meta": {
            "code": 403,
            "success": false,
            "message": "No question image or text!"
          },
          "data": null,
          "error": null
        }
        return res.status(responseData.meta.code).json(responseData);
      }
      // languages_arrays = await Localised.getList(db.mysql.read);
      await QuestionRedis.setPreviousHistory(student_id,[{'question_id':qid,'ocr_text':ocr_text}], db.redis.write)
      languages_obj = Utility.getLanguageObject(languages_arrays);
      Promise.all(promises).then(values => {
        // if (strpos($responseArray['latex'], 'begin{array}') === false) {
        //   $body = str_replace(" ", "", $body);
        // }
        if (values[1]) {

          let promises1 = [];
          // Student.getStudentLocale(student_id, db.mysql.read).then((studentResponse) => {
          // //console.log("studentResponse")
          // //console.log(studentResponse)
          st_lang_code = req.user.locale;
          //console.log('st_lang_code');

          // //console.log(st_lang_code);
          let language = languages_obj[st_lang_code];
          // //console.log("language");
          // //console.log(language)
          if (typeof language === 'undefined') {
            language = 'english'
          }
          //console.log(language)
          //console.log(values)
          // return res.send(language)
            if (language !== 'english') {
              for (let i = 0; i < values[1]['hits']['hits'].length; i++) {
                //console.log(values[1]['hits']['hits'][i]['_id'])
                promises1.push(Localised.changeLanguage(values[1]['hits']['hits'][i]['_id'], language, db.mysql.read));
              }
            }
            Promise.all(promises1).then(async (results) => {
              // return res.send(results)
              for (let i = 0; i < results.length; i++) {
                if ((typeof results[i] !== "undefined") && results[i].length > 0) {
                  values[1]['hits']['hits'][i]._source.ocr_text = results[i][0][language]
                }
              }
              matches_array = values[1]['hits']['hits'];
//notification start -----------------------------------------------  on check of asked first question   -----------------------  //

              // Notification.questionCountNotifications(student_id, req.user.gcm_reg_id, config, admin, db);
              // db.redis.read.publish("notification_service",JSON.stringify({type:"question_ask",student_id:student_id,gcm_id:req.user.gcm_reg_id}))


              let promises3 = [], is_subscribed = 0;
              for (let i = 0; i < matches_array.length; i++) {
                promises3.push(VideoView.getVideoWatchMeta(matches_array[i]['_id'], db.mysql.read));
              }
              promises3.push(Student.isSubscribed(student_id, db.mysql.read))
              let matchesQuestionArray = _.keys(_.groupBy(matches_array, '_id'))

              // //console.log("matchesQuestionArray")
              // //console.log(matchesQuestionArray)
              let matchedQuestionsHtml
              let groupedMatchedQuestionHtml
              if (language == 'english' && matchesQuestionArray.length > 0) {
                matchedQuestionsHtml = await QuestionSql.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read)
                // //console.log("matchedQuestionsHtml")
                // //console.log(matchedQuestionsHtml)
                groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id')
              }
              //console.log(groupedMatchedQuestionHtml)
              Promise.all(promises3).then(values => {
                ////console.log(values);
                for (let i = 0; i < values.length; i++) {
                  //console.log('check me')
                  // //console.log(matches_array[1]['_id'])
                  // //console.log(values[1][0]['class'])
                  if (i == (values.length - 1)) {
                    if ((values[i].length == 1) && values[i][0]['student_id'] == student_id) {
                      is_subscribed = 1
                    }
                  } else {
                    if (language == 'english' && groupedMatchedQuestionHtml[matches_array[i]['_id']] && groupedMatchedQuestionHtml[matches_array[i]['_id']].length > 0) {
                      matches_array[i]['html'] = groupedMatchedQuestionHtml[matches_array[i]['_id']][0]['html']
                    }
                    if (values[i].length > 0) {
                      let promisestemp=[]
                      promisestemp.push(QuestionContainer.getTotalViewsWeb(values[i][0].question_id, db))
                      Promise.all(promisestemp).then(async result1 =>{
                        // //console.log(result1[0][0][0].total_count)
                        // //console.log(result1[1][0])
                        let likes=await AnswerContainer.getLikeDislikeStats(result1[0][0][0].total_count,values[i][0].question_id,db)
                        let share=await AnswerContainer.getWhatsappShareStats(result1[0][0][0].total_count,values[i][0].question_id,db)
                        matches_array[i]['share']=share[0]
                        matches_array[i]['likes']=likes[0]
                      }).catch(error =>{
                        next(error)
                      })
                      matches_array[i]['class'] = values[i][0]['class'];
                      matches_array[i]['chapter'] = values[i][0]['chapter'];
                      matches_array[i]['difficulty_level'] = values[i][0]['level'];
                    } else {
                      matches_array[i]['class'] = null;
                      matches_array[i]['chapter'] = null;
                      matches_array[i]['difficulty_level'] = null;
                    }
                    if (st_lang_code !== "en") {
                      matches_array[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + st_lang_code + "_" + matches_array[i]['_id'] + ".png"
                    } else {
                      matches_array[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + matches_array[i]['_id'] + ".png"
                    }
                  }
                }
                let n_data = []
                let d1= moment(req.user.timestamp).format("YYYY:MM:DD")
                let d2= moment(new Date()).format("YYYY:MM:DD")

                QuestionHelper.sendSnsMessage({
                    type: 'user-questions',
                    sns,
                    uuid,
                    qid,
                    studentId: student_id,
                    studentClass: student_class,
                    subject,
                    chapter,
                    version: insertedQuestion.question,
                    ques,
                    locale,
                    questionImage: filedToUpdate.question_image,
                    ocrText: filedToUpdate.ocr_text,
                    ocrDone: filedToUpdate.ocr_done,
                    originalOcrText: filedToUpdate.original_ocr_text,
                    wrongImage: 0,
                    isTrial: 0,
                    difficulty: null,
                    UtilityModule: Utility,
                    userQuestionSnsUrl,
                    config,
                });

                Notification.checkUserActiveNotification('ask_no_watch', db.mysql.read).then(notification => {
                  if (notification.length > 0 && (d1!==d2)) {
                    let intro_video_id = Constant.cropToEquation()
                    let notification_data1 = {
                      "event": "camera_guide",
                      "title": notification[0]['title'],
                      "message": notification[0]['message'],
                      "image": notification[0]['image_url'],
                      "data": JSON.stringify({
                        "qid": intro_video_id,
                        "page": "NOTIFICATION",
                        "resource_type":"video"
                      })
                    }
                    n_data.push(notification_data1)
                  }
                  /*
                    Activity Stream Entry
                   */
                  db.redis.read.publish("activitystream_service", JSON.stringify({
                    "actor_id": req.user.student_id,
                    "actor_type": "USER",
                    "actor": {"student_username": req.user.student_username, "user_avatar": req.user.student_avatar},
                    "verb": "ASKED",
                    "object": "",
                    "object_id": qid,
                    "object_type": "QUESTION",
                    "target_id": "",
                    "target_type": "",
                    "target": "",
                  }));
                  db.redis.read.publish("clevertap_profile_service", JSON.stringify({
                    "type":"latest_question",
                    "question_id":qid,
                    "student_id" : req.user.student_id
                  }));
                  // //console.log(error)
                  let responseData = {
                    "meta": {
                      "code": 200,
                      "success": true,
                      "message": "SUCCESS!"
                    },
                    "data": {
                      "question_id": qid,
                      "ocr_text": filedToUpdate["ocr_text"],
                      // "question_image": config.blob_url + "q-images/" + filedToUpdate['question_image'],
                      "question_image": config.blob_url + "images/" + filedToUpdate['question_image'],
                      "matched_questions": matches_array,
                      "matched_count": matches_array.length,
                      "is_subscribed": is_subscribed,
                      "notification": n_data,
                      "handwritten": handwritten,
                      "feedback":feedback
                    }
                  }
                  if (typeof filedToUpdate['question_image'] === 'undefined') {
                    responseData["data"]["question_image"] = null
                  }
                  res.status(responseData.meta.code).json(responseData);
                  // let data = {
                  //    "action":"ASK_FROM_APP",
                  //    "data": insertedQuestion,
                  //    "uuid": uuidv4(),
                  //    "timestamp": Utility.getCurrentTimeInIST()
                  //  }
                  // Utility.logEntry(sns,config.question_ask_sns, data)
                }).catch(error => {
                  //console.log(error)
                  let responseData = {
                    "meta": {
                      "code": 200,
                      "success": true,
                      "message": "SUCCESS!"
                    },
                    "data": {
                      "question_id": qid,
                      // "question_image": config.blob_url + "q-images/" + filedToUpdate['question_image'],
                      "question_image": config.blob_url + "images/" + filedToUpdate['question_image'],
                      "matched_questions": matches_array,
                      "matched_count": matches_array.length,
                      "is_subscribed": is_subscribed,
                      "notification": n_data,
                      "handwritten": handwritten,
                      "feedback":feedback

                    }
                  }
                  if (typeof filedToUpdate['question_image'] === 'undefined') {
                    responseData["data"]["question_image"] = null
                  }
                  res.status(responseData.meta.code).json(responseData);
                  // let data = {
                  //    "action":"ASK_FROM_APP",
                  //    "data": insertedQuestion,
                  //    "uuid": uuidv4(),
                  //    "timestamp": Utility.getCurrentTimeInIST()
                  //  }
                  // Utility.logEntry(sns,config.question_ask_sns, data)
                })
              }).catch(error => {
                //console.log(error);
                // let data = {
                //    "action":"ASK_FROM_APP",
                //    "data": insertedQuestion,
                //    "uuid": uuidv4(),
                //    "timestamp": Utility.getCurrentTimeInIST()
                //  }
                // Utility.logEntry(sns,config.question_ask_sns, data)
                next(error)

              });
            }).catch((error) => {
              //console.log(error)
              // let data = {
              //    "action":"ASK_FROM_APP",
              //    "data": insertedQuestion,
              //    "uuid": uuidv4(),
              //    "timestamp": Utility.getCurrentTimeInIST()
              //  }
              // Utility.logEntry(sns,config.question_ask_sns, data)
              next(error)
            });

        } else {
          let responseData = {
            "meta": {
              "code": 403,
              "success": false,
              "message": "Error in search matches!"
            },
            "data": null,
            "error": null
          }
          res.status(responseData.meta.code).json(responseData);
          // let data = {
          //    "action":"ASK_FROM_APP",
          //    "data": insertedQuestion,
          //    "uuid": uuidv4(),
          //    "timestamp": Utility.getCurrentTimeInIST()
          //  }
          // Utility.logEntry(sns,config.question_ask_sns, data)
        }
      }).catch(error => {
        //console.log(error);
        // let data = {
        //    "action":"ASK_FROM_APP",
        //    "data": insertedQuestion,
        //    "uuid": uuidv4(),
        //    "timestamp": Utility.getCurrentTimeInIST()
        //  }
        // Utility.logEntry(sns,config.question_ask_sns, data)
        next(error)

      })
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
      // let data = {
      //    "action":"ASK_FROM_APP",
      //    "data": insertedQuestion,
      //    "uuid": uuidv4(),
      //    "timestamp": Utility.getCurrentTimeInIST()
      //  }
      // Utility.logEntry(sns,config.question_ask_sns, data)
    }
  } catch (e) {
    // let data = {
    //    "action":"ASK_FROM_APP",
    //    "data": insertedQuestion,
    //    "uuid": uuidv4(),
    //    "timestamp": Utility.getCurrentTimeInIST()
    //  }
    // Utility.logEntry(sns,config.question_ask_sns, data)
    next(e)

  }

}


module.exports = {
  ask
};
