/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-11 13:36:09
*/
"use strict";

const Question = require('../../../modules/question');
// const Answer = require('../../../modules/answer');
const Utility = require('../../../modules/utility');
// const ElasticSearch = require('../../../modules/elasticSearch');
const Student = require('../../../modules/student');
// const Language = require('../../../modules/language')
// const Home = require('../../../modules/home')
const Localised = require('../../../modules/language')
// const Class = require('../../../modules/class')
const Notification = require('../../../modules/notifications')
// const VideoView = require('../../../modules/videoView')
const Constant = require('../../../modules/constants')
const QuestionContainer = require('../../../modules/containers/question')
const QuestionRedis= require('../../../modules/redis/question')
// const AnswerContainer = require('../../../modules/containers/answer')
// const ChapterContainer = require('../../../modules/containers/chapter')
// const LanguageContainer = require('../../../modules/containers/language')
const QuestionSql = require('../../../modules/mysql/question')
// const FeedbackContainer = require('../../../modules/containers/feedback')
let Question_Container = require('../../helpers/question.helper')
const moment = require('moment')
const staticData = require('../../../data/data')
const fuzz = require("fuzzball")
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback')
const AppConfigurationContainer = require('../../../modules/containers/appConfig')
let responseSchema = require('../../../responseModels/question/v8/question')

const fs = require('fs')
const bluebird = require('bluebird')
bluebird.promisifyAll(fs);



let db, elasticSearchInstance


const _ = require('lodash');
let config, elasticSearchClient, blobService


async function ask(req, res, next) {

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
    let topictab = staticData.topic_tab

    let matches_array, languages_arrays, languages_obj, handwritten = 0, question_image = null,ocr_text;

    let st_lang_code, qid, insertedQuestion = {}, filedToUpdate = {}, promises = []

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
    let color = staticData.colors
    let feedback={}
    feedback.feedback_text='Happy with the Solutions'
    feedback.bg_color=_.sample(color)
    feedback.is_show=1
    let ocr, ocr_type, ocr_data;

    promises.push(Question.addQuestion(insertedQuestion, db.mysql.write))
    promises.push(Localised.getList(db.mysql.read))
    promises.push(AppConfigurationContainer.getWhatsappData(db, student_class))

    let resolvedPromises = await Promise.all(promises)
    promises = []
    let insertQuestionResult = resolvedPromises[0]
    languages_arrays = resolvedPromises[1]
    let is_subscribed = 0
    qid = insertQuestionResult['insertId']
    let whatsAppData = resolvedPromises[2]
    whatsAppData[0].key_value = JSON.parse(whatsAppData[0].key_value)
    let whatsAppJson = {}
    whatsAppJson.image_url = whatsAppData[0]['key_value']['image_url']
    whatsAppJson.description = whatsAppData[0]['key_value']['description']
    whatsAppJson.button_text = whatsAppData[0]['key_value']['button_text']
    whatsAppJson.button_bg_color = whatsAppData[0]['key_value']['button_bg_color']
    whatsAppJson.action_activity = whatsAppData[0]['key_value']['action_activity']
    whatsAppJson.action_data = whatsAppData[0]['key_value']['action_data']
    whatsAppJson.resource_type = 'card'
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


        let host = req.protocol + "://" + req.headers.host
        let transLateApiResp, latex, ocr, locale, latexToAscii, text;
        ocr_data = await Question_Container.handleOcr(student_id, 1, resourceImageData.toString('base64'), host, locale, handwritten, fileName, translate2, config)
        ocr = ocr_data['ocr']
        handwritten = ocr_data['handwritten']
        locale = ocr_data['locale']
        ocr_text = ocr
        Utility.deleteImage(publicPath + "/uploads/" + fileName, fs)
        //
        // let visionApiResp = await Utility.httpVisionApi(resourceImageData.toString('base64'))
        // visionApiResp = visionApiResp['responses']
        //
        // //detect handwritten
        // // if (visionApiResp[0]['webDetection'] !== null && visionApiResp[0]['webDetection']['bestGuessLabels'] !== null && visionApiResp[0]['webDetection']['bestGuessLabels'][0]['label'] === "handwriting") {
        // //   handwritten = 1
        // // }
        // if (typeof visionApiResp[0]['fullTextAnnotation'] !== 'undefined' && visionApiResp[0]['fullTextAnnotation'] !== null) {
        //   text = visionApiResp[0]['textAnnotations'][0]['description']
        //   locale = visionApiResp[0]['textAnnotations'][0]['locale']
        // } else {
        //   text = ""
        // }
        // // let data = [locale, text]
        // if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
        //   if (text !== "") {
        //     //console.log('3.5')
        //     //console.log(text)
        //     transLateApiResp = await Utility.translateApi2(text,translate2)
        //     //console.log('3.7')
        //     //console.log("pretext")
        //     //console.log(transLateApiResp)
        //     if(transLateApiResp.length > 0 && transLateApiResp[1]['data'] !== undefined  && transLateApiResp[1]['data']['translations'] !== undefined &&  transLateApiResp[1]['data']['translations'][0]['translatedText'] !== undefined ){
        //       text = transLateApiResp[1]['data']['translations'][0]['translatedText']
        //     }
        //   }
        // }
        // if (text.length <= 85) {
        //   latex = await Utility.mathpixOcr(host, fileName, config);
        //   // //console.log("latex")
        //   // //console.log(latex)
        //   latex = latex.latex
        //   if (typeof latex !== 'undefined' && latex.length > 0) {
        //     latexToAscii = await Utility.latexToAscii(latex);
        //     // //console.log("latexToAscii")
        //     // //console.log(latexToAscii)
        //     latex = latexToAscii
        //   } else {
        //     latex = ""
        //   }
        //   if (text.length < 2 * latex.length) {
        //     ocr = latex;
        //   } else {
        //     ocr = latex + " " + text;
        //   }
        // } else {
        //   ocr = text;
        // }
        //
        // ocr = Utility.replaceSpecialSymbol(ocr)
        filedToUpdate["ocr_done"] = 1
        filedToUpdate["ocr_text"] = ocr
        filedToUpdate["original_ocr_text"] = ocr
        filedToUpdate["locale"] = locale
        ocr_text=ocr


        promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
        promises.push(Question_Container.handleElasticSearchNew(ocr_data, elasticSearchInstance, student_id));
        promises.push(QuestionRedis.setPreviousHistory(student_id, [{
          'question_id': qid,
          'ocr_text': ocr
        }], db.redis.write));
        promises.push(Student.isSubscribed(student_id, db.mysql.read))

      } else if (typeof question_text !== 'undefined' && question_text.length > 0) {
        //question text

        if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
          let transLateApiResp = await Utility.translateApi(question_text)
          if (transLateApiResp.length > 0) {
            question_text = transLateApiResp.text
          }
        }
        // question_text = Utility.replaceSpecialSymbol(question_text)
        filedToUpdate["ocr_done"] = 1
        filedToUpdate["ocr_text"] = question_text
        filedToUpdate["original_ocr_text"] = question_text
        filedToUpdate["locale"] = locale
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
      languages_obj = Utility.getLanguageObject(languages_arrays);
      let resolvedPromise2 = await Promise.all(promises)
      if (!resolvedPromise2[1]) {
        return next({message: "Error in search matches!", status: 500, isPublic: true, error: true})
      }
      if ((resolvedPromise2[3].length === 1) && (resolvedPromise2[3][0]['student_id'] == student_id)) {
        is_subscribed = 1
      }
      st_lang_code = req.user.locale;
      let language = languages_obj[st_lang_code];
      if (typeof language === 'undefined') {
        language = 'english'
      }

      let stringDiffResp = Utility.stringDiffImplementWithKey(resolvedPromise2[1]['hits']['hits'], ocr, fuzz, 'ocr_text', language, false)
      matches_array = stringDiffResp[0]
      let matchesQuestionArray = stringDiffResp[1]
      let groupedQid = stringDiffResp[2]
      matches_array = (student_id % 2 == 0) ? matches_array.slice(0, 20) : matches_array;

      if (language !== 'english') {
        matches_array = await QuestionContainer.getLocalisedQuestionMulti(matches_array, language, db)
      }
      Notification.questionCountNotifications(student_id, req.user.gcm_reg_id, config, admin, db);

      let matchedQuestionsHtml
      let groupedMatchedQuestionHtml
      if (language === 'english' && matchesQuestionArray.length > 0) {
        matchedQuestionsHtml = await QuestionSql.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read)
        groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id')
      }
      let groupedMeta = []
      if(groupedQid.length > 0){
        //get meta info from elasticSearch
        let meta = await elasticSearchInstance.getMeta(groupedQid)
        // console.log("meta")
        // console.log(meta)
        groupedMeta  = _.groupBy(meta.docs,'_id')
      }

      // console.log(groupedMeta)
      matches_array = await QuestionContainer.getQuestionStats(matches_array, config, color, language, st_lang_code, groupedMatchedQuestionHtml,groupedMeta, db)
      matches_array = await UserAnswerFeedbackContainer.getAnswerFeedBackByStudentMulti(matches_array, student_id, db)

      if (whatsAppData.length > 0 && matches_array.length > 0) {
        matches_array.splice(6, 0, whatsAppJson)
      }
      let n_data = []
      // let d1 = moment(req.user.timestamp).format("YYYY:MM:DD")
      // let d2 = moment(new Date()).format("YYYY:MM:DD")
      let d1 = moment(req.user.timestamp)
      let d2 = moment(new Date())
      let difference = d2.diff(d1, 'days')
      Notification.checkUserActiveNotification('ask_no_watch', db.mysql.read).then(notification => {
        if (notification.length > 0 && difference > 4) {
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

        let responseData = {
          "data": {
            "question_id": qid,
            "tab": topictab,
            "ocr_text": filedToUpdate["ocr_text"],
            "question_image": config.cdn_url + "images/" + filedToUpdate['question_image'],
            "matched_questions": matches_array,
            "matched_count": matches_array.length,
            "is_subscribed": is_subscribed,
            "notification": n_data,
            "handwritten": handwritten,
            "feedback": feedback
          },
          "error": false,
          "schema": responseSchema
        }
        if (typeof filedToUpdate['question_image'] === 'undefined') {
          responseData["data"]["question_image"] = null
        }
        next(responseData)
      }).catch(error => {
        let responseData = {
          "data": {
            "question_id": qid,
            "tab": topictab,
            "question_image": config.cdn_url + "images/" + filedToUpdate['question_image'],
            "ocr_text": filedToUpdate["ocr_text"],
            "matched_questions": matches_array,
            "matched_count": matches_array.length,
            "is_subscribed": is_subscribed,
            "notification": n_data,
            "handwritten": handwritten,
            "feedback": feedback
          },
          "error": false,
          "schema": responseSchema
        }
        if (typeof filedToUpdate['question_image'] === 'undefined') {
          responseData["data"]["question_image"] = null
        }
        next(responseData)
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
    }
  } catch (e) {
    next(e)

  }

}


module.exports = {
  ask
};
