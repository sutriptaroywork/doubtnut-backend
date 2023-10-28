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
const Student = require('../../../modules/student');
const Notification = require('../../../modules/notifications')
const Constant = require('../../../modules/constants')
const QuestionContainer = require('../../../modules/containers/question')
const QuestionRedis= require('../../../modules/redis/question')
const ChapterContainer = require('../../../modules/containers/chapter')
const LanguageContainer = require('../../../modules/containers/language')
const QuestionSql = require('../../../modules/mysql/question')
const AnswerContainer = require('../../../modules/containers/answer')
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback')
const AppConfiguration = require('../../../modules/mysql/appConfig')
const AppConfigurationContainer = require('../../../modules/containers/appConfig')
const QuestionMetaContainer = require('../../../modules/containers/questionsMeta')
const fuzz = require("fuzzball")
let responseSchema = require('../../../responseModels/question/v7/question')
const QuestionLog = require('../../../modules/mongo/questionAsk');
const Data = require('../../../data/data');

let QuestionHelper = require('../../helpers/question.helper')

const moment = require('moment')
const uuidv4 = require('uuid/v4')


const fs = require('fs')
const bluebird = require('bluebird')
bluebird.promisifyAll(fs);


let db, elasticSearchInstance, admin


const _ = require('lodash');
let config, elasticSearchClient, blobService

async function ask(req, res, next) {
  let insertedQuestion = {}
  let sns = req.app.get('sns')
  const sqs = req.app.get('sqs');
  const { questionInitSnsUrl, userQuestionSnsUrl } = Data;

  config = req.app.get('config')
  try {
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
    let question_image = req.body.question_image

    // let ocr_types_array = ['question_text', 'img_mathpix', 'img_google_vision', 'img_gv_translate', 'null_ocr'];
    let master_iteration_mongo = {};
    let isAbEligible = Utility.isEligibleForAbTesting(student_id);

    // -------- mongo data insertion ------ //
    master_iteration_mongo['student_id'] = student_id;
    master_iteration_mongo['isAbEligible'] = (isAbEligible) ? 1 : 0;

    let matches_array, languages_arrays, languages_obj,ocr_text
    var handwritten = 0;

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

    promises.push(Question.addQuestion(insertedQuestion, db.mysql.write))
    promises.push(LanguageContainer.getList(db))
    promises.push(AppConfigurationContainer.getConfig(db))
    promises.push(AppConfigurationContainer.getWhatsappData(db,student_class))

    let resolvedPromises = await Promise.all(promises)
    promises = []
    let insertQuestionResult = resolvedPromises[0]
    let feedback={}
    feedback.feedback_text='Happy with the Solutions'
    feedback.bg_color=_.sample(color)
    feedback.is_show=1

    let whatsappData=resolvedPromises[3]
    whatsappData[0].key_value=JSON.parse(whatsappData[0].key_value)
    whatsappData[0].image_url=whatsappData[0]['key_value']['image_url']
    whatsappData[0].description=whatsappData[0]['key_value']['description']
    whatsappData[0].button_text=whatsappData[0]['key_value']['button_text']
    whatsappData[0].button_bg_color=whatsappData[0]['key_value']['button_bg_color']
    whatsappData[0].action_activity=whatsappData[0]['key_value']['action_activity']
    whatsappData[0].action_data=whatsappData[0]['key_value']['action_data']
    whatsappData[0].resource_type='card'
    delete whatsappData[0].key_value

    languages_arrays = resolvedPromises[1]
    let isStringDiffActive = resolvedPromises[2]['apply_string_diff']
    let isAbTestingActive = resolvedPromises[2]['ab_testing_question_ask']
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

    insertedQuestion["question_id"] = qid
    let ocr,fileName=null,ocr_data,original_ocr;

    if (qid) {

      // -------- mongo data insertion ------ //
      master_iteration_mongo['qid'] = qid;
       //check for image
      if ((typeof question_text === 'undefined' || question_text.length === 0) && (typeof question_image !== 'undefined' && question_image.length > 0)) {

        let extension = ".png", content_type
        if (question_image.indexOf("png") !== -1) {
          extension = ".png"
          content_type = "image/png"
        }
        else if (question_image.indexOf("jpg") !== -1 || question_image.indexOf("jpeg") !== -1) {
          extension = ".jpg"
          content_type = "image/jpg"
        }
        // ////console.log(question_image);
        question_image = question_image.replace(/^data:([A-Za-z-+/]+);base64,/, "");

        fileName = "upload_" + qid + "_" + moment().unix() + extension;
        let buf = new Buffer(question_image, 'base64');
        promises.push(fs.writeFileAsync(publicPath + "/uploads/" + fileName, question_image, 'base64'))
        promises.push(Utility.uploadImageToBlob(blobService, fileName, buf))
        promises.push(Utility.uploadTos3(s3, config.aws_bucket, fileName, buf, content_type))
        await Promise.all(promises)
        promises = []
        //TODO: add redis pub event to upload image to blob
        filedToUpdate['question_image'] = fileName
        insertedQuestion['question_image'] = fileName
        let host = req.protocol + "://" + req.headers.host
        ocr_data = await QuestionHelper.handleOcr(student_id, isAbTestingActive,question_image,host,locale,handwritten,fileName,translate2, config)
        ocr = ocr_data['ocr']
        original_ocr = ocr_data['original_ocr']
        // ocr_type = ocr_data['ocr_type']
        handwritten = ocr_data['handwritten']
        locale = ocr_data['locale']
        ocr_text = ocr
        Utility.deleteImage(publicPath + "/uploads/" + fileName,fs)

      } else if (typeof question_text !== 'undefined' && question_text.length > 0) {
        //question text
        if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
          let transLateApiResp = await Utility.translateApi2(question_text, translate2)
          if (transLateApiResp.length > 0 && transLateApiResp[1]['data'] !== undefined && transLateApiResp[1]['data']['translations'] !== undefined && transLateApiResp[1]['data']['translations'][0]['translatedText'] !== undefined) {
            question_text = transLateApiResp[1]['data']['translations'][0]['translatedText']
          }
        }
        ocr = question_text
        original_ocr = ocr
        ocr_data = {ocr:question_text,ocr_type:0,handwritten:handwritten,locale:locale,ocr_origin:'question_text'}
      }
      master_iteration_mongo['ocr_type'] = ocr_data['ocr_origin'];

      // ocr = Utility.replaceSpecialSymbol2(ocr)
      filedToUpdate["ocr_done"] = 1
      filedToUpdate["ocr_text"] = ocr
      filedToUpdate["original_ocr_text"] = original_ocr
      filedToUpdate["locale"] = locale
      insertedQuestion["ocr_done"] = 1
      insertedQuestion["ocr_text"] = ocr
      insertedQuestion["original_ocr_text"] = original_ocr
      insertedQuestion["locale"] = locale
      promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write));
      // let isAbEligible = Utility.isEligibleForAbTesting(student_id);
      // if (isAbEligible) {
      //   promises.push(QuestionHelper.handleElasticSearchForHomoIter(ocr_data, elasticSearchInstance, config.elastic.REPO_INDEX_ITER_HOMO,0));
      // }else{
        promises.push(QuestionHelper.handleElasticSearch(ocr_data, elasticSearchInstance));
      // -------- mongo data insertion ------ //
      master_iteration_mongo['elastic_index'] = Data.hetro_elastic_indexes[0];
      // }
      promises.push(QuestionRedis.setPreviousHistory(student_id,[{'question_id':qid,'ocr_text':ocr}], db.redis.write));
      // await QuestionRedis.setPreviousHistory(student_id,[{'question_id':qid,'ocr_text':ocr_text}], db.redis.write)
      languages_obj = Utility.getLanguageObject(languages_arrays);
      console.log(ocr_data)
      Promise.all(promises).then(values => {

        if (values[1]) {

          let promises1 = [];

          st_lang_code = req.user.locale;

          let language = languages_obj[st_lang_code];
          if (typeof language === 'undefined') {
            language = 'english'
          }
          matches_array = values[1]['hits']['hits'];
          // -------- mongo data insertion ------ //
          master_iteration_mongo['qid_matches_array'] = matches_array;
//notification start -----------------------------------------------  on check of asked first question   -----------------------  //
          ////console.log("isStringDiffActive")
          ////console.log(isStringDiffActive)
          if(locale === 'en'){
            ////console.log("stringdifffffffff")
            matches_array = Utility.stringDiffImplement(matches_array,ocr_text,fuzz)
            if(matches_array.length > 0){
              ocr_data['string_diff'] = matches_array[0]['partial_score']
              //set info in redis
              //   await QuestionRedis.setQuestionAskMeta(qid,ocr_data,db.redis.write)
            }
          }


          // -------- mongo data insertion ------ //
          master_iteration_mongo['meta_index'] = Data.currentQuestionAskMetaIndex;
          master_iteration_mongo['iteration_name'] = Data.current_ask_question_iteration;
          master_iteration_mongo['request_version'] = 'v7';
          master_iteration_mongo['question_image'] = fileName;
          master_iteration_mongo['user_locale'] = st_lang_code;
          master_iteration_mongo['ocr'] = ocr;
          let question_ask_log = new QuestionLog.QuestionLogModel( master_iteration_mongo);
          // let result = await question_ask_log.save();
          // question_ask_log.save().then(() => {

          // }).catch(() => {

          // });

            if (language !== 'english') {
              for (let i = 0; i < matches_array.length; i++) {
                promises1.push(QuestionContainer.getLocalisedQuestion(matches_array[i]['_id'], language, db));
              }
            }
            Promise.all(promises1).then(async (results) => {
              for (let i = 0; i < results.length; i++) {
                if ((typeof results[i] !== "undefined") && results[i].length > 0) {
                  values[1]['hits']['hits'][i]._source.ocr_text = results[i][0][language]
                }
              }




              let promises3 = [], is_subscribed = 0;
              for (let i = 0; i < matches_array.length; i++) {
                promises3.push(QuestionMetaContainer.getQuestionMeta(matches_array[i]['_id'], db));
              }
              promises3.push(Student.isSubscribed(student_id, db.mysql.read))
              let matchesQuestionArray = _.keys(_.groupBy(matches_array,'_id'))
              let matchedQuestionsHtml
              let groupedMatchedQuestionHtml
              if(language == 'english' && matchesQuestionArray.length > 0){
                matchedQuestionsHtml = await QuestionSql.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read)
                groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id')
              }
              Promise.all(promises3).then(async values => {
                for (let i = 0; i < values.length; i++) {
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
                      promisestemp.push(AnswerContainer.getByQuestionId(values[i][0].question_id, db))
                      let result1 =await Promise.all(promisestemp)
                      promisestemp=[]
                      promisestemp.push(AnswerContainer.getLikeDislikeStats(result1[0][0][0].total_count,values[i][0].question_id,db))
                      promisestemp.push(AnswerContainer.getWhatsappShareStats(result1[0][0][0].total_count,values[i][0].question_id,db))
                      // console.log("result1[1]")
                      // console.log(result1[1])
                      // console.log(values[i][0].question_id)
                      result1[1] = (result1[1].length > 0) ? result1[1] : [[{'answer_id':0,'duration':null}]]
                      promisestemp.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, result1[1][0]['answer_id'], db))
                      let result2=await Promise.all(promisestemp)
                      matches_array[i]['_source'].bg_color=_.sample(color)
                      matches_array[i]['resource_type']='video'
                      //matches_array[i]['_source'].duration=result1[1][0]['duration']
                      if(result1[1][0]['duration']==='NULL' || result1[1][0]['duration']===null)
                      {
                        matches_array[i]['_source'].duration=0
                      }else{
                        matches_array[i]['_source'].duration=result1[1][0]['duration']
                      }
                      matches_array[i]['_source'].share=result2[1][0]
                      matches_array[i]['_source'].likes=result2[0][0]
                      matches_array[i]['_source'].isLiked=false
                      matches_array[i]['_source'].share_message="Waah! à¤•à¥à¤¯à¤¾ à¤¬à¥à¤¿à¤¯à¤¾ à¤¤à¤°à¥€à¤•à¥‡ à¤¸à¥‡ à¤‡à¤¸ question ko Doubtnut App à¤¨à¥‡ à¤¸à¤®à¤à¤¾à¤¯à¤¾ hai :D Khud dekho...maan jaaoge"

                      if (result2[2].length > 0 && result2[2][0]["rating"] > 3) {
                          matches_array[i]['_source'].isLiked = true
                      }
                      matches_array[i]['class'] = values[i][0]['class'];
                      matches_array[i]['chapter'] = values[i][0]['chapter'];
                      matches_array[i]['difficulty_level'] = values[i][0]['level'];
                    } else {
                      matches_array[i]['resource_type']='video'
                      matches_array[i]['class'] = null;
                      matches_array[i]['chapter'] = null;
                      matches_array[i]['difficulty_level'] = null;
                      matches_array[i]['_source'].bg_color=_.sample(color)
                      matches_array[i]['_source'].duration="0"

                    matches_array[i]['_source'].share=0
                    matches_array[i]['_source'].likes=0
                    matches_array[i]['_source'].isLiked=false
                    matches_array[i]['_source'].share_message="Waah! à¤•à¥à¤¯à¤¾ à¤¬à¥à¤¿à¤¯à¤¾ à¤¤à¤°à¥€à¤•à¥‡ à¤¸à¥‡ à¤‡à¤¸ question ko Doubtnut App à¤¨à¥‡ à¤¸à¤®à¤à¤¾à¤¯à¤¾ hai :D Khud dekho...maan jaaoge"
                    }
                    if (st_lang_code !== "en") {
                      matches_array[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + st_lang_code + "_" + matches_array[i]['_id'] + ".png"
                    } else {
                      matches_array[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + matches_array[i]['_id'] + ".png"
                    }
                  }
                }
                if(whatsappData.length>0 && matches_array.length>0){
                  matches_array.splice(6,0,whatsappData[0])
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

                  let responseData = {
                    "data": {
                      "question_id": qid,
                      "ocr_text": filedToUpdate["ocr_text"],
                      "question_image": config.cdn_url + "images/" + filedToUpdate['question_image'],
                      "matched_questions": matches_array,
                      "matched_count": matches_array.length,
                      "is_subscribed": is_subscribed,
                      "notification": n_data,
                      "handwritten": handwritten,
                      "feedback":feedback
                    },
                    "error":false,
                    "schema":responseSchema
                  }
                  if (typeof filedToUpdate['question_image'] === 'undefined') {
                    responseData["data"]["question_image"] = null
                  }
                  // res.status(responseData.meta.code).json(responseData);
                  // let data = {
                  //    "action":"ASK_FROM_APP",
                  //    "data": insertedQuestion,
                  //    "uuid": uuidv4(),
                  //    "timestamp": Utility.getCurrentTimeInIST()
                  //  }
                  // Utility.logEntry(sns,config.question_ask_sns, data)
                  next(responseData)
                }).catch(error => {
                  let responseData = {
                    "data": {
                      "question_id": qid,
                      "question_image": config.cdn_url + "images/" + filedToUpdate['question_image'],
                      "ocr_text": filedToUpdate["ocr_text"],
                      "matched_questions": matches_array,
                      "matched_count": matches_array.length,
                      "is_subscribed": is_subscribed,
                      "notification": n_data,
                      "handwritten": handwritten,
                      "feedback":feedback
                    },
                    "error":false,
                    "schema":responseSchema
                  }
                  if (typeof filedToUpdate['question_image'] === 'undefined') {
                    responseData["data"]["question_image"] = null
                  }
                  //  let data = {
                  //    "action":"ASK_FROM_APP",
                  //    "data": insertedQuestion,
                  //    "uuid": uuidv4(),
                  //    "timestamp": Utility.getCurrentTimeInIST()
                  //  }
                  // Utility.logEntry(sns,config.question_ask_sns, data)
                  next(responseData)
                  // next({message:"Invalid language code",error:true})
                })
              }).catch(error => {
                // let data = {
                //    "action":"ASK_FROM_APP",
                //    "data": insertedQuestion,
                //    "uuid": uuidv4(),
                //    "timestamp": Utility.getCurrentTimeInIST()
                //  }
                // Utility.logEntry(sns,config.question_ask_sns, data)
                next({message:error,error:true})
              });
            }).catch((error) => {
              // let data = {
              //    "action":"ASK_FROM_APP",
              //    "data": insertedQuestion,
              //    "uuid": uuidv4(),
              //    "timestamp": Utility.getCurrentTimeInIST()
              //  }
              // Utility.logEntry(sns,config.question_ask_sns, data)
              next({message:error,error:true})
            })

        } else {
          // let data = {
          //    "action":"ASK_FROM_APP",
          //    "data": insertedQuestion,
          //    "uuid": uuidv4(),
          //    "timestamp": Utility.getCurrentTimeInIST()
          //  }
          // Utility.logEntry(sns,config.question_ask_sns, data)
          next({message:"Error in search matches!",status:500,isPublic:true,error:true})
        }
      }).catch(error => {
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
      // let data = {
      //    "action":"ASK_FROM_APP",
      //    "data": insertedQuestion,
      //    "uuid": uuidv4(),
      //    "timestamp": Utility.getCurrentTimeInIST()
      //  }
      // Utility.logEntry(sns,config.question_ask_sns, data)
      next({message:"Error in inserting question; Please check parameters",status:500,isPublic:true,error:true})
    }
  } catch (e) {
    // let data = {
    //    "action":"ASK_FROM_APP",
    //    "data": insertedQuestion,
    //    "uuid": uuidv4(),
    //    "timestamp": Utility.getCurrentTimeInIST()
    //  }
    // Utility.logEntry(sns,config.question_ask_sns, data)
    console.log(e)
    next(e)
  }
}

module.exports = {
  ask
};
