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
const Localised = require('../../../modules/language')
const Notification = require('../../../modules/notifications')
const VideoView = require('../../../modules/videoView')
const QuestionMetaContainer = require('../../../modules/containers/questionsMeta')
const Constant = require('../../../modules/constants')
const QuestionContainer = require('../../../modules/containers/question')
const QuestionRedis = require('../../../modules/redis/question')
const ChapterContainer = require('../../../modules/containers/chapter')
const LanguageContainer = require('../../../modules/containers/language')
const QuestionSql = require('../../../modules/mysql/question')
const AppConfigurationContainer = require('../../../modules/containers/appConfig')
const uuidv4 = require('uuid/v4')

const VideoContainer = require('../../../modules/containers/videoView')

const fuzz = require("fuzzball")
let responseSchema = require('../../../responseModels/question/v3/question')
let QuestionHelper = require('../../helpers/question.helper')
const QuestionLog = require('../../../modules/mongo/questionAsk');
const Data = require('../../../data/data');
const moment = require('moment')

const fs = require('fs')
const bluebird = require('bluebird')
bluebird.promisifyAll(fs);


let db, elasticSearchInstance;


const _ = require('lodash');
let config, elasticSearchClient, blobService




async function getQuestionDetailsByTag(req, res, next) {
  db = req.app.get('db');
  let count = 100;
  let page = req.body.page;
  let tag_data = req.body.tag_data_obj;
  let tag_data_obj = eval("(" + tag_data + ")");
  // let questions_data = {};
  let str = "";
  let locale = req.user.locale
  let language = "english"
  let lang = await LanguageContainer.getByCode(locale, db)
  //console.log("language")
  //console.log(lang)
  if (lang.length > 0) {
    language = lang[0]['language']
  }
  try {
    let key1 = Object.keys(tag_data_obj)[0];
    if (key1 == 'packages') {
      str += key1 + "= '" + tag_data_obj[key1] + "'";
      Question.getTagPackageData(str, count, page, db.mysql.read).then(values => {
        let responseData = {
          "meta": {
            "code": 200,
            "message": "SUCCESS",
          },
          "data": values
        }
        res.status(responseData.meta.code).json(responseData);
      }).catch(err => {
        next(err)

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "message": "ERROR",
        //   },
        //   "data": null
        // }
        // res.status(responseData.meta.code).json(responseData);
      });
    } else {
      str += key1 + "= '" + tag_data_obj[key1] + "'";
      Question.getTagDataWithLanguage(str, language, count, page, db.mysql.read).then(values => {
        let responseData = {
          "meta": {
            "code": 200,
            "message": "SUCCESS",
          },
          "data": values
        }
        res.status(responseData.meta.code).json(responseData);

      }).catch(err => {
        //console.log(err)
        next(err)

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "message": "ERROR",
        //   },
        //   "data": null
        // }
        // res.status(responseData.meta.code).json(responseData);
      });

    }
  } catch (e) {
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 404,
    //     "message": "Something is wrong",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }
}


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
    promises.push(Question.addQuestion(insertedQuestion, db.mysql.write))
    promises.push(LanguageContainer.getList(db))
    promises.push(AppConfigurationContainer.getConfig(db))

    let resolvedPromises = await Promise.all(promises)
    promises = []
    let insertQuestionResult = resolvedPromises[0]
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

      master_iteration_mongo['ocr_type'] =ocr_data['ocr_origin'];

      // ocr = Utility.replaceSpecialSymbol2(ocr)
      filedToUpdate["ocr_done"] = 1
      filedToUpdate["ocr_text"] = ocr
      filedToUpdate["original_ocr_text"] = original_ocr
      filedToUpdate["locale"] = locale
      insertedQuestion["ocr_done"] = 1
      insertedQuestion["ocr_text"] = ocr
      insertedQuestion["original_ocr_text"] = original_ocr
      insertedQuestion["locale"] = locale
      promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
      // let isAbEligible = Utility.isEligibleForAbTesting(student_id);
      // if (isAbEligible) {
      //   promises.push(QuestionHelper.handleElasticSearchForHomoIter(ocr_data, elasticSearchInstance, config.elastic.REPO_INDEX_ITER_HOMO,0));
      // } else {
        promises.push(QuestionHelper.handleElasticSearch(ocr_data, elasticSearchInstance));
      // }
      master_iteration_mongo['elastic_index'] = Data.hetro_elastic_indexes[0];

      promises.push(QuestionRedis.setPreviousHistory(student_id,[{'question_id':qid,'ocr_text':ocr}], db.redis.write));
      // await QuestionRedis.setPreviousHistory(student_id,[{'question_id':qid,'ocr_text':ocr_text}], db.redis.write)
      languages_obj = Utility.getLanguageObject(languages_arrays);
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
          master_iteration_mongo['request_version'] = 'v3';
          master_iteration_mongo['question_image'] = fileName;
          master_iteration_mongo['user_locale'] = st_lang_code;
          master_iteration_mongo['ocr'] = ocr;

          let question_ask_log = new QuestionLog.QuestionLogModel(master_iteration_mongo);
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

                    let responseData = {
                      "data": {
                        "question_id": qid,
                        "ocr_text": filedToUpdate["ocr_text"],
                        "question_image": config.cdn_url + "images/" + filedToUpdate['question_image'],
                        "matched_questions": matches_array,
                        "matched_count": matches_array.length,
                        "is_subscribed": is_subscribed,
                        "notification": n_data,
                        "handwritten": handwritten
                      },
                      "error":false,
                      "schema":responseSchema
                    }
                    if (typeof filedToUpdate['question_image'] === 'undefined') {
                      responseData["data"]["question_image"] = null
                    }
                   //  let data = {
                   //   "action":"ASK_FROM_APP",
                   //   "data": insertedQuestion,
                   //   "uuid": uuidv4(),
                   //   "timestamp": Utility.getCurrentTimeInIST()
                   // }
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
                      "handwritten": handwritten

                    },
                    "error":false,
                    "schema":responseSchema
                  }
                  if (typeof filedToUpdate['question_image'] === 'undefined') {
                    responseData["data"]["question_image"] = null
                  }
                 //  let data = {
                 //   "action":"ASK_FROM_APP",
                 //   "data": insertedQuestion,
                 //   "uuid": uuidv4(),
                 //   "timestamp": Utility.getCurrentTimeInIST()
                 // }
                 // Utility.logEntry(sns,config.question_ask_sns, data)
                 next(responseData)
               })
               }).catch(error => {
               //  let data = {
               //   "action":"ASK_FROM_APP",
               //   "data": insertedQuestion,
               //   "uuid": uuidv4(),
               //   "timestamp": Utility.getCurrentTimeInIST()
               // }
               // Utility.logEntry(sns,config.question_ask_sns, data)
               next({message:error,error:true})
             });
             }).catch((error) => {
             //  let data = {
             //   "action":"ASK_FROM_APP",
             //   "data": insertedQuestion,
             //   "uuid": uuidv4(),
             //   "timestamp": Utility.getCurrentTimeInIST()
             // }
             // Utility.logEntry(sns,config.question_ask_sns, data)
             next({message:error,error:true})
           })
           } else {
           //  let data = {
           //   "action":"ASK_FROM_APP",
           //   "data": insertedQuestion,
           //   "uuid": uuidv4(),
           //   "timestamp": Utility.getCurrentTimeInIST()
           // }
           // Utility.logEntry(sns,config.question_ask_sns, data)
           next({message:"Error in search matches!",status:500,isPublic:true,error:true})
         }
       }).catch(error => {
       //  let data = {
       //   "action":"ASK_FROM_APP",
       //   "data": insertedQuestion,
       //   "uuid": uuidv4(),
       //   "timestamp": Utility.getCurrentTimeInIST()
       // }
       // Utility.logEntry(sns,config.question_ask_sns, data)
       next(error)
     })
     } else {
     //  let data = {
     //   "action":"ASK_FROM_APP",
     //   "data": insertedQuestion,
     //   "uuid": uuidv4(),
     //   "timestamp": Utility.getCurrentTimeInIST()
     // }
     // Utility.logEntry(sns,config.question_ask_sns, data)
     next({message:"Error in inserting question; Please check parameters",status:500,isPublic:true,error:true})
   }
 } catch (e) {
  console.log(e)
 //  let data = {
 //   "action":"ASK_FROM_APP",
 //   "data": insertedQuestion,
 //   "uuid": uuidv4(),
 //   "timestamp": Utility.getCurrentTimeInIST()
 // }
 // Utility.logEntry(sns,config.question_ask_sns, data)
 next(e)
}
}

async function filter(req, res, next) {
  db = req.app.get('db');
  let database = db.mysql.read;
  let parameters = eval("(" + req.body.params + ")");
  let course = parameters.course;
  let sclass = parameters.class;
  let chapter = parameters.chapter;
  let subtopic = parameters.subtopic;
  let exercise = parameters.exercise;
  let exam = parameters.exam;
  let study = parameters.study
  let year = parameters.year;
  let page_length = req.body.count;
  let page_no = req.body.page;
  let datas = [], questions_list = [];

  let locale_val = req.body.locale;
  if (locale_val == undefined) {
    locale_val = ""
  }

  let version = 'v3';

  if (course == "IIT") {
    if ((_.isNull(chapter) || chapter == '' || chapter == undefined) && (_.isNull(subtopic) || subtopic == '' || subtopic == undefined)) {
      /*Sending chapters as the filters */
      let promises = [];
      let params = {
        "classes": [], "chapters": [], "subtopics": [], "books": [],
        "courses": [course], "exams": [], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };
      promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, null, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

      Promise.all(promises).then((result) => {

        if (!_.isNull(result[0]) && result[0] !== undefined) {
          let chapters = result[0];
          let data1 = [];
          chapters.forEach(function (values) {
            data1.push(values.chapter);
          });
          datas.push({
            'title': 'Chapters',
            'name': 'chapter',
            'list': data1
          });
        }

        if (!_.isNull(result[1]) && result[1] !== undefined) {
          let questions = result[1];
          let data1 = [];
          for (let i = 0; i < questions.length; i++) {
            data1.push(questions[i]);
          }
          questions_list = data1;

        }

        let content = ""
        let heading = ""

        if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
          content = result[3][0].content
          heading = result[3][0].heading
        }

        let responseData = {

          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {
            "filters": datas,
            "questions_list": questions_list,
            "heading": heading,
            "content": content,
            "active_filters": {"course": course},
            "total_records": result[2][0]['total_records']
          }
        };
        res.status(responseData.meta.code).json(responseData);
      }).catch((err) => {
        next(err)

        // let responseData = {
        //
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
      });

    } else if ((!_.isNull(chapter && chapter != '')) && (_.isNull(subtopic) || subtopic == '' || subtopic == undefined)) {
      /*Sending subtopics as the filters */

      let promises = [];
      let params = {
        "classes": [], "chapters": [chapter], "subtopics": [], "books": [],
        "courses": [course], "exams": [], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };

      let chapter2 = chapter
      if(chapter2 != null && chapter2 != '')
      {
        chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, "")
        chapter2 = chapter2.replace(/\s+/g, " ");
      }
      console.log("chapter 2 ::: ",chapter2)

      let params2 = {
        "classes": [], "chapters": [chapter2], "subtopics": [], "books": [],
        "courses": [course], "exams": [], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };

      promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, null, db));
      promises.push(ChapterContainer.getDistSubtopicsLocalised(locale_val, version, course, chapter, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
      promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
      promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

      Promise.all(promises).then((result) => {

        if (!_.isNull(result[0]) && result[0] !== undefined) {
          let chapters = result[0];
          let data1 = [];
          chapters.forEach(function (values) {
            data1.push(values.chapter);
          });
          datas.push({
            'title': 'Chapters',
            'name': 'chapter',
            'list': data1
          });
        }

        if (!_.isNull(result[1]) && result[1] !== undefined) {
          let subtopics = result[1];
          let data1 = [];
          subtopics.forEach(function (values) {
            data1.push(values.subtopic);
          });
          datas.push({
            'title': 'Subtopics',
            'name': 'subtopic',
            'list': data1
          });
        }
        if (!_.isNull(result[2]) && result[2] !== undefined) {
          let questions = result[2];
          let data1 = [];
          for (let i = 0; i < questions.length; i++) {
            data1.push(questions[i]);
          }
          questions_list = data1;
        }

        let content = ""
        let heading = ""

        if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
          content = result[4][0].content
          heading = result[4][0].heading
        }

        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {
            "filters": datas,
            "questions_list": questions_list,
            "heading": heading,
            "content": content,
            "active_filters": {"course": course, "chapter": chapter}
            , "total_records": result[3][0]['total_records']
          }
        };
        res.status(responseData.meta.code).json(responseData);
      }).catch((err) => {
        next(err)

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
      });

    } else if ((!_.isNull(chapter) && (chapter != '')) && (!_.isNull(subtopic) && (subtopic != ''))) {
      /*Sending  all the filters */

      let promises = [];
      let params = {
        "classes": [], "chapters": [chapter], "subtopics": [subtopic], "books": [],
        "courses": [course], "exams": [], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };

      let chapter2 = chapter
      if(chapter2 != null && chapter2 != '')
      {
        chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, "")
        chapter2 = chapter2.replace(/\s+/g, " ");
      }
      console.log("chapter 2 ::: ",chapter2)

      let subtopic2 = subtopic
      if(subtopic2 != null && subtopic2 != '')
      {
        subtopic2 = subtopic2.replace(new RegExp('[/]', 'g'), '_')
        subtopic2 = subtopic2.replace(/[^a-zA-Z0-9 ]/g, "")
        subtopic2 = subtopic2.replace(/\s+/g, " ");
      }
      console.log("subtopic 2 ::: ",subtopic2)
      let params2 = {
        "classes": [], "chapters": [chapter2], "subtopics": [subtopic2], "books": [],
        "courses": [course], "exams": [], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };

      promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, null, db));
      promises.push(ChapterContainer.getDistSubtopicsLocalised(locale_val, version, course, chapter, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
      promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
      promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

      Promise.all(promises).then((result) => {
        if (!_.isNull(result[0]) && result[0] !== undefined) {
          let chapters = result[0];
          let data1 = [];
          chapters.forEach(function (values) {
            data1.push(values.chapter);
          });
          datas.push({
            'title': 'Chapters',
            'name': 'chapter',
            'list': data1
          });
        }

        if (!_.isNull(result[1]) && result[1] !== undefined) {
          let subtopics = result[1];
          let data1 = [];
          subtopics.forEach(function (values) {
            data1.push(values.subtopic);
          });
          datas.push({
            'title': 'Subtopics',
            'name': 'subtopic',
            'list': data1
          });
        }

        if (!_.isNull(result[2]) && result[2] !== undefined) {
          let questions = result[2];
          let data1 = [];
          for (let i = 0; i < questions.length; i++) {
            data1.push(questions[i]);
          }
          questions_list = data1;

        }

        let content = ""
        let heading = ""

        if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
          content = result[4][0].content
          heading = result[4][0].heading
        }

        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {
            "filters": datas,
            "questions_list": questions_list,
            "heading": heading,
            "content": content,
            "active_filters": {"course": course, "chapter": chapter, "subtopic": subtopic}
            , "total_records": result[3][0]['total_records']
          }
        };
        res.status(responseData.meta.code).json(responseData);
      }).catch((err) => {
        next(err)

        // let responseData = {
        //
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
      });
    }
  } else if (course == "NCERT") {
    if ((_.isNull(sclass) || sclass == '' || sclass == undefined) && (_.isNull(chapter) || chapter == '' || chapter == undefined) && (_.isNull(exercise) || exercise == '' || exercise == undefined)) {
      /* Sending class as the filters  */
      //console.log('ncert only');
      let promises = [];
      let params = {
        "classes": [], "chapters": [], "subtopics": [], "books": [],
        "courses": [course], "exams": [], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };
      promises.push(ChapterContainer.getDistClassesLocalised(locale_val, version, course, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

      Promise.all(promises).then((result) => {

        if (!_.isNull(result[0]) && result[0] !== undefined) {
          let classes = result[0];
          let data1 = [];
          classes.forEach(function (values) {
            data1.push(values.class);
          });
          datas.push({
            'title': 'Classes',
            'name': 'class',
            'list': data1
          });
        }

        if (!_.isNull(result[1]) && result[1] !== undefined) {
          let questions = result[1];
          let data1 = [];
          for (let i = 0; i < questions.length; i++) {
            data1.push(questions[i]);
          }
          questions_list = data1;

        }

        let content = ""
        let heading = ""

        if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
          content = result[3][0].content
          heading = result[3][0].heading
        }

        let responseData = {

          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {
            "filters": datas,
            "questions_list": questions_list,
            "heading": heading,
            "content": content,
            "active_filters": {"course": course},
            "total_records": result[2][0]['total_records']
          }
        };
        res.status(responseData.meta.code).json(responseData);
      }).catch((err) => {
        next(err)

        // let responseData = {
        //
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
      });


    } else if ((!_.isNull(sclass) && sclass != '') && (_.isNull(chapter) || chapter == '' || chapter == undefined) && (_.isNull(exercise) || exercise == '' || exercise == undefined)) {
      /* Sending chapter as the filters  */
      let promises = [];
      let params = {
        "classes": [sclass], "chapters": [], "subtopics": [], "books": [],
        "courses": [course], "exams": [], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };
      promises.push(ChapterContainer.getDistClassesLocalised(locale_val, version, course, db));
      promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, sclass, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

      Promise.all(promises).then((result) => {

        if (!_.isNull(result[0]) && result[0] !== undefined) {
          let classes = result[0];
          let data1 = [];
          classes.forEach(function (values) {
            data1.push(values.class);
          });
          datas.push({
            'title': 'Classes',
            'name': 'class',
            'list': data1
          });
        }

        if (!_.isNull(result[1]) && result[1] !== undefined) {
          let chapters = result[1];
          let data1 = [];
          chapters.forEach(function (values) {
            data1.push(values.chapter);
          });
          datas.push({
            'title': 'Chapters',
            'name': 'chapter',
            'list': data1
          });
        }

        if (!_.isNull(result[2]) && result[2] !== undefined) {
          let questions = result[2];
          let data1 = [];
          for (let i = 0; i < questions.length; i++) {
            data1.push(questions[i]);
          }
          questions_list = data1;

        }

        let content = ""
        let heading = ""

        if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
          content = result[4][0].content
          heading = result[4][0].heading
        }

        let responseData = {

          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {
            "filters": datas,
            "questions_list": questions_list,
            "heading": heading,
            "content": content,
            "active_filters": {"course": course, "class": sclass}
            , "total_records": result[3][0]['total_records']
          }
        };
        res.status(responseData.meta.code).json(responseData);
      }).catch((err) => {
        next(err)

        // let responseData = {
        //
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
      });


    } else if ((!_.isNull(sclass) && sclass != '') && (!_.isNull(chapter) && chapter != '') && (_.isNull(exercise) || exercise == '' || exercise == undefined)) {
      /* Sending exercises as the filter */
      let promises = [];
      let params = {
        "classes": [sclass], "chapters": [chapter], "subtopics": [], "books": [],
        "courses": [course], "exams": [], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };

      let chapter2 = chapter
      if(chapter2 != null && chapter2 != '')
      {
        chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, "")
        chapter2 = chapter2.replace(/\s+/g, " ");
      }
      console.log("chapter 2 ::: ",chapter2)

      let params2 = {
        "classes": [sclass], "chapters": [chapter2], "subtopics": [], "books": [],
        "courses": [course], "exams": [], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };

      promises.push(ChapterContainer.getDistClassesLocalised(locale_val, version, course, db));
      promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, sclass, db));
      promises.push(ChapterContainer.getDistExercisesLocalised(locale_val, version, course, sclass, chapter, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
      promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
      promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

      Promise.all(promises).then((result) => {
        if (!_.isNull(result[0]) && result[0] !== undefined) {
          let classes = result[0];
          let data1 = [];
          classes.forEach(function (values) {
            data1.push(values.class);
          });
          datas.push({
            'title': 'Classes',
            'name': 'class',
            'list': data1
          });
        }

        if (!_.isNull(result[1]) && result[1] !== undefined) {
          let chapters = result[1];
          let data1 = [];
          chapters.forEach(function (values) {
            data1.push(values.chapter);
          });
          datas.push({
            'title': 'Chapters',
            'name': 'chapter',
            'list': data1
          });
        }

        if (!_.isNull(result[2]) && result[2] !== undefined) {
          let exercises = result[2];
          let data1 = [];
          exercises.forEach(function (values) {
            data1.push(values.exercise);
          });
          datas.push({
            'title': 'Exercises',
            'name': 'exercise',
            'list': data1
          });
        }

        if (!_.isNull(result[3]) && result[3] !== undefined) {
          let questions = result[3];
          let data1 = [];
          for (let i = 0; i < questions.length; i++) {
            data1.push(questions[i]);
          }
          questions_list = data1;

        }

        let content = ""
        let heading = ""

        if (!_.isNull(result[5]) && result[5] !== undefined && result[5].length != 0) {
          content = result[5][0].content
          heading = result[5][0].heading
        }

        let responseData = {

          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {
            "filters": datas,
            "questions_list": questions_list,
            "heading": heading,
            "content": content,
            "active_filters": {"course": course, "class": sclass, "chapters": chapter}
            , "total_records": result[4][0]['total_records']
          }
        };
        res.status(responseData.meta.code).json(responseData);
      }).catch((err) => {
        next(err)

        // let responseData = {
        //
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
      });
    } else if ((!_.isNull(sclass) && sclass != '') && (!_.isNull(chapter) && chapter != '') && (!_.isNull(exercise) && exercise != '')) {
      /* Sending  as the filter */
      let promises = [];
      let params = {
        "classes": [sclass],
        "chapters": [chapter],
        "subtopics": [],
        "books": [],
        "courses": [course],
        "exams": [], "study": [],
        "levels": [],
        "page_no": page_no,
        "page_length": page_length,
        "exercise": exercise
      };

      let chapter2 = chapter
      if(chapter2 != null && chapter2 != '')
      {
        chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, "")
        chapter2 = chapter2.replace(/\s+/g, " ");
      }
      console.log("chapter 2 ::: ",chapter2)

      let params2 = {
        "classes": [sclass],
        "chapters": [chapter2],
        "subtopics": [],
        "books": [],
        "courses": [course],
        "exams": [], "study": [],
        "levels": [],
        "page_no": page_no,
        "page_length": page_length,
        "exercise": exercise
      };

      promises.push(ChapterContainer.getDistClassesLocalised(locale_val, version, course, db));
      promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, sclass, db));
      promises.push(ChapterContainer.getDistExercisesLocalised(locale_val, version, course, sclass, chapter, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
      promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
      promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

      Promise.all(promises).then((result) => {

        if (!_.isNull(result[0]) && result[0] !== undefined) {
          let classes = result[0];
          let data1 = [];
          classes.forEach(function (values) {
            data1.push(values.class);
          });
          datas.push({
            'title': 'Classes',
            'name': 'class',
            'list': data1
          });
        }

        if (!_.isNull(result[1]) && result[1] !== undefined) {
          let chapters = result[1];
          let data1 = [];
          chapters.forEach(function (values) {
            data1.push(values.chapter);
          });
          datas.push({
            'title': 'Chapters',
            'name': 'chapter',
            'list': data1
          });
        }

        if (!_.isNull(result[2]) && result[2] !== undefined) {
          let exercises = result[2];
          let data1 = [];
          exercises.forEach(function (values) {
            data1.push(values.exercise);
          });
          datas.push({
            'title': 'Exercises',
            'name': 'exercise',
            'list': data1
          });
        }

        if (!_.isNull(result[3]) && result[3] !== undefined) {
          let questions = result[3];
          let data1 = [];
          for (let i = 0; i < questions.length; i++) {
            data1.push(questions[i]);
          }
          questions_list = data1;

        }

        let content = ""
        let heading = ""

        if (!_.isNull(result[5]) && result[5] !== undefined && result[5].length != 0) {
          content = result[5][0].content
          heading = result[5][0].heading
        }

        let responseData = {

          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {
            "filters": datas,
            "questions_list": questions_list,
            "heading": heading,
            "content": content,
            "active_filters": {"course": course, "class": sclass, "chapters": chapter, "exercise": exercise},
            "total_records": result[4][0]['total_records']
          }
        };
        res.status(responseData.meta.code).json(responseData);
      }).catch((err) => {
        next(err)

        // let responseData = {
        //
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
      });
    }

  }

  if (exam != undefined && !_.isNull(exam) && exam != '') {
    if (_.isNull(year) || year == '' || year == undefined) {
      let promises = [];
      let params = {
        "classes": [], "chapters": [], "subtopics": [], "books": [],
        "courses": [], "exams": [exam], "study": [], "levels": [], "page_no": page_no, "page_length": page_length
      };

      promises.push(ChapterContainer.getDistYearsLocalised(version, exam, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

      Promise.all(promises).then((result) => {

        if (!_.isNull(result[0]) && result[0] !== undefined) {
          let years = result[0];
          let data1 = [];
          years.forEach(function (values) {
            data1.push(values.year);
          });
          datas.push({
            'title': 'Years',
            'name': 'year',
            'list': data1
          });
        }
        if (!_.isNull(result[1]) && result[1] !== undefined) {
          let questions = result[1];
          let data1 = [];
          for (let i = 0; i < questions.length; i++) {
            data1.push(questions[i]);
          }
          questions_list = data1;

        }

        let content = ""
        let heading = ""

        if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
          content = result[3][0].content
          heading = result[3][0].heading
        }

        let responseData = {

          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {
            "filters": datas,
            "questions_list": questions_list,
            "heading": heading,
            "content": content,
            "active_filters": {"exam": exam},
            "total_records": result[2][0]['total_records']
          }
        };
        res.status(responseData.meta.code).json(responseData);

      }).catch((err) => {
        next(err)

        // let responseData = {
        //
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
      });

    } else if (!_.isNull(year) && year != '') {
      let promises = [];
      let params = {
        "classes": [],
        "chapters": [],
        "subtopics": [],
        "books": [],
        "courses": [],
        "exams": [exam],
        "study": [],
        "levels": [],
        "page_no": page_no,
        "page_length": page_length,
        "year": year
      };

      promises.push(ChapterContainer.getDistYearsLocalised(version, exam, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
      promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

      Promise.all(promises).then((result) => {

        if (!_.isNull(result[0]) && result[0] !== undefined) {
          let years = result[0];
          let data1 = [];
          years.forEach(function (values) {
            data1.push(values.year);
          });
          datas.push({
            'title': 'Years',
            'name': 'year',
            'list': data1
          });
        }
        if (!_.isNull(result[1]) && result[1] !== undefined) {
          let questions = result[1];
          let data1 = [];
          for (let i = 0; i < questions.length; i++) {
            data1.push(questions[i]);
          }
          questions_list = data1;

        }

        let content = ""
        let heading = ""

        if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
          content = result[3][0].content
          heading = result[3][0].heading
        }

        let responseData = {

          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {
            "filters": datas,
            "questions_list": questions_list,
            "heading": heading,
            "content": content,
            "active_filters": {"exam": exam, "year": year},
            "total_records": result[2][0]['total_records']
          }
        };
        res.status(responseData.meta.code).json(responseData);

      }).catch((err) => {
        next(err)

        // let responseData = {
        //
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
      });

    }
  }


  if (study != undefined && !_.isNull(study) && study != '') {

    if (study == "RD SHARMA") {
      if ((_.isNull(sclass) && _.isNull(chapter)) || (sclass == '' && chapter == '') || (sclass == undefined) && (chapter == undefined)) {
        //console.log('RD normal');
        let promises = [];
        let params = {
          "classes": [], "chapters": [], "subtopics": [], "books": [],
          "courses": [], "exams": [], "study": [study], "levels": [], "page_no": page_no, "page_length": page_length
        };

        promises.push(ChapterContainer.getDistClassesForStudyMaterialLocalised(version, study, db));
        promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
        promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
        promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

        Promise.all(promises).then((result) => {

          if (!_.isNull(result[0]) && result[0] !== undefined) {
            let sclass = result[0];
            let data1 = [];
            sclass.forEach(function (values) {
              data1.push(values.class);
            });
            datas.push({
              'title': 'Classes',
              'name': 'sclass',
              'list': data1
            });
          }


          if (!_.isNull(result[1]) && result[1] !== undefined) {
            let questions = result[1];
            let data1 = [];
            for (let i = 0; i < questions.length; i++) {
              data1.push(questions[i]);
            }
            questions_list = data1;

          }

          let content = ""
          let heading = ""

          if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
            content = result[3][0].content
            heading = result[3][0].heading
          }

          let responseData = {

            "meta": {
              "code": 200,
              "success": true,
              "message": "Success"
            },
            "data": {
              "filters": datas,
              "questions_list": questions_list,
              "heading": heading,
              "content": content,
              "active_filters": {"study": study},
              "total_records": result[2][0]['total_records']
            }
          };
          res.status(responseData.meta.code).json(responseData);

        }).catch((err) => {
          next(err)

          // let responseData = {
          //
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": "Error"
          //   },
          //   "data": null,
          //   "error": err
          // };
          // res.status(responseData.meta.code).json(responseData);
        });


      } else if ((!_.isNull(sclass) && _.isNull(chapter)) || (sclass != '' && chapter == '') || (sclass != undefined) && (chapter == undefined)) {
        let promises = [];
        let params = {
          "classes": [sclass], "chapters": [], "subtopics": [], "books": [],
          "courses": [], "exams": [], "study": [study], "levels": [], "page_no": page_no, "page_length": page_length
        };

        promises.push(ChapterContainer.getDistClassesForStudyMaterialLocalised(version, study, db));
        promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, study, sclass, db));
        promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
        promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
        promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

        Promise.all(promises).then((result) => {

          if (!_.isNull(result[0]) && result[0] !== undefined) {
            let sclass = result[0];
            let data1 = [];
            sclass.forEach(function (values) {
              data1.push(values.class);
            });
            datas.push({
              'title': 'Classes',
              'name': 'sclass',
              'list': data1
            });
          }

          if (!_.isNull(result[1]) && result[1] !== undefined) {
            let chapter = result[1];
            let data2 = [];
            chapter.forEach(function (values) {
              data2.push(values.chapter);
            });
            datas.push({
              'title': 'Chapters',
              'name': 'chapter',
              'list': data2
            });
          }

          if (!_.isNull(result[2]) && result[2] !== undefined) {
            let questions = result[2];
            let data1 = [];
            for (let i = 0; i < questions.length; i++) {
              data1.push(questions[i]);
            }
            questions_list = data1;

          }

          let content = ""
          let heading = ""

          if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
            content = result[4][0].content
            heading = result[4][0].heading
          }

          let responseData = {

            "meta": {
              "code": 200,
              "success": true,
              "message": "Success"
            },
            "data": {
              "filters": datas,
              "questions_list": questions_list,
              "heading": heading,
              "content": content,
              "active_filters": {"study": study, "class": sclass},
              "total_records": result[3][0]['total_records']
            }
          };
          res.status(responseData.meta.code).json(responseData);

        }).catch((err) => {
          next(err)

          // let responseData = {
          //
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": "Error"
          //   },
          //   "data": null,
          //   "error": err
          // };
          // res.status(responseData.meta.code).json(responseData);
        });
      } else if ((!_.isNull(sclass) && !_.isNull(chapter)) || (sclass != '' && chapter != '') || (sclass != undefined) && (chapter != undefined)) {
        let promises = [];
        let params = {
          "classes": [sclass], "chapters": [chapter], "subtopics": [], "books": [],
          "courses": [], "exams": [], "study": [study], "levels": [], "page_no": page_no, "page_length": page_length
        };

        let chapter2 = chapter
        if(chapter2 != null && chapter2 != '')
        {
          chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, "")
          chapter2 = chapter2.replace(/\s+/g, " ");
        }
        console.log("chapter 2 ::: ",chapter2)

        let params2 = {
          "classes": [sclass], "chapters": [chapter2], "subtopics": [], "books": [],
          "courses": [], "exams": [], "study": [study], "levels": [], "page_no": page_no, "page_length": page_length
        };

        promises.push(ChapterContainer.getDistClassesForStudyMaterialLocalised(version, study, db));
        promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, study, sclass, db));
        promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
        promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
        promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

        Promise.all(promises).then((result) => {

          if (!_.isNull(result[0]) && result[0] !== undefined) {
            let sclass = result[0];
            let data1 = [];
            sclass.forEach(function (values) {
              data1.push(values.class);
            });
            datas.push({
              'title': 'Classes',
              'name': 'sclass',
              'list': data1
            });
          }

          if (!_.isNull(result[1]) && result[1] !== undefined) {
            let chapter = result[1];
            let data2 = [];
            chapter.forEach(function (values) {
              data2.push(values.chapter);
            });
            datas.push({
              'title': 'Chapters',
              'name': 'chapter',
              'list': data2
            });
          }

          if (!_.isNull(result[2]) && result[2] !== undefined) {
            let questions = result[2];
            let data1 = [];
            for (let i = 0; i < questions.length; i++) {
              data1.push(questions[i]);
            }
            questions_list = data1;

          }

          let content = ""
          let heading = ""

          if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
            content = result[4][0].content
            heading = result[4][0].heading
          }

          let responseData = {

            "meta": {
              "code": 200,
              "success": true,
              "message": "Success"
            },
            "data": {
              "filters": datas,
              "questions_list": questions_list,
              "heading": heading,
              "content": content,
              "active_filters": {"study": study, "class": sclass, "chapter": chapter},
              "total_records": result[3][0]['total_records']
            }
          };
          res.status(responseData.meta.code).json(responseData);

        }).catch((err) => {
          next(err)

          // let responseData = {
          //
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": "Error"
          //   },
          //   "data": null,
          //   "error": err
          // };
          // res.status(responseData.meta.code).json(responseData);
        });
      }
    } else {
      //Other study than RD Sharma
      if (_.isNull(chapter) || chapter == '' || chapter == undefined) {
        let promises = [];
        let params = {
          "classes": [], "chapters": [], "subtopics": [], "books": [],
          "courses": [], "exams": [], "study": [study], "levels": [], "page_no": page_no, "page_length": page_length
        };

        promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, study, null, db));
        promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
        promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
        promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

        Promise.all(promises).then((result) => {


          if (!_.isNull(result[0]) && result[0] !== undefined) {
            let chapter = result[0];
            let data2 = [];
            chapter.forEach(function (values) {
              data2.push(values.chapter);
            });
            datas.push({
              'title': 'Chapters',
              'name': 'chapter',
              'list': data2
            });
          }

          if (!_.isNull(result[1]) && result[1] !== undefined) {
            let questions = result[1];
            let data1 = [];
            for (let i = 0; i < questions.length; i++) {
              data1.push(questions[i]);
            }
            questions_list = data1;

          }

          let content = ""
          let heading = ""

          if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
            content = result[3][0].content
            heading = result[3][0].heading
          }

          let responseData = {

            "meta": {
              "code": 200,
              "success": true,
              "message": "Success"
            },
            "data": {
              "filters": datas,
              "questions_list": questions_list,
              "heading": heading,
              "content": content,
              "active_filters": {"study": study},
              "total_records": result[2][0]['total_records']
            }
          };
          res.status(responseData.meta.code).json(responseData);

        }).catch((err) => {
          next(err)

          // let responseData = {
          //
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": "Error"
          //   },
          //   "data": null,
          //   "error": err
          // };
          // res.status(responseData.meta.code).json(responseData);
        });
      } else if (!_.isNull(chapter) || chapter != '' || chapter != undefined) {
        let promises = [];
        let params = {
          "classes": [], "chapters": [chapter], "subtopics": [], "books": [],
          "courses": [], "exams": [], "study": [study], "levels": [], "page_no": page_no, "page_length": page_length
        };

        let chapter2 = chapter
        if(chapter2 != null && chapter2 != '')
        {
          chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, "")
          chapter2 = chapter2.replace(/\s+/g, " ");
        }
        console.log("chapter 2 ::: ",chapter2)

        let params2 = {
          "classes": [], "chapters": [chapter2], "subtopics": [], "books": [],
          "courses": [], "exams": [], "study": [study], "levels": [], "page_no": page_no, "page_length": page_length
        };

        promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, study, null, db));
        promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
        promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
        promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

        Promise.all(promises).then((result) => {


          if (!_.isNull(result[0]) && result[0] !== undefined) {
            let chapter = result[0];
            let data2 = [];
            chapter.forEach(function (values) {
              data2.push(values.chapter);
            });
            datas.push({
              'title': 'Chapters',
              'name': 'chapter',
              'list': data2
            });
          }

          if (!_.isNull(result[1]) && result[1] !== undefined) {
            let questions = result[1];
            let data1 = [];
            for (let i = 0; i < questions.length; i++) {
              data1.push(questions[i]);
            }
            questions_list = data1;
          }

          let content = ""
          let heading = ""

          if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
            content = result[3][0].content
            heading = result[3][0].heading
          }

          let responseData = {

            "meta": {
              "code": 200,
              "success": true,
              "message": "Success"
            },
            "data": {
              "filters": datas,
              "questions_list": questions_list,
              "heading": heading,
              "content": content,
              "active_filters": {"study": study, "chapter": chapter},
              "total_records": result[2][0]['total_records']
            }
          };
          res.status(responseData.meta.code).json(responseData);

        }).catch((err) => {
          next(err)

          // let responseData = {
          //
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": "Error"
          //   },
          //   "data": null,
          //   "error": err
          // };
          // res.status(responseData.meta.code).json(responseData);
        });
      }
    }
  }

}

function getChapters(req, res, next) {
  db = req.app.get('db');
  let database = db.mysql.read;
  Question.getDistChapters('IIT', null, database).then((result) => {

    let chapters = [];
    result.forEach(value => {
      chapters.push(value.chapter);
    });
    let responseData = {

      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": chapters
    };
    res.status(responseData.meta.code).json(responseData);
  }).catch((err) => {
    next(err)

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error"
    //   },
    //   "data": null,
    //   "error": err
    // };
    // res.status(responseData.meta.code).json(responseData);
  });

}


function askExpert(req, res, next) {
  db = req.app.get('db');
  let question_id = req.body.question_id;
  let student_id = req.user.student_id;

  Student.isSubscribed(student_id, db.mysql.read).then((response) => {
    if (response.length > 0) {
      Question.updateQuestionCredit(question_id, db.mysql.write).then((result) => {
        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": "Updated"
        };
        res.status(responseData.meta.code).json(responseData);
        Notification.askExpert(student_id, req.user.gcm_reg_id, question_id, null, db)
      }).catch((error) => {
        next(error)

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //   "data": null,
        //   "error": error
        // };
        // res.status(responseData.meta.code).json(responseData);
      });
    } else {
      let responseData = {

        "meta": {
          "code": 403,
          "success": false,
          "message": "Failure"
        },
        "data": "You are not Subscribed."
      };
      res.status(responseData.meta.code).json(responseData);

    }
  }).catch((err) => {
    next(err)

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error"
    //   },
    //   "data": null,
    //   "error": err
    // };
    // res.status(responseData.meta.code).json(responseData);
  });
}

async function getPrefixSearch(req, res, next) {

  try {
    db = req.app.get('db');
    let ocr_text = req.params.ocr_text;
    // elasticSearchInstance = req.app.get('elasticSearchInstance');
    elasticSearchInstance = req.app.get('webElasticSearchInstance');
    // let results = await elasticSearchInstance.findByOcr(ocr_text);
    let ocr_data = {ocr:ocr_text,ocr_type:0,handwritten:0,locale:"en"}
    let results = await QuestionHelper.handleElasticSearchNew(ocr_data,elasticSearchInstance,"588226",1)
    // results.hits.hits.forEach(async function(element, index) {
    //   var qDtails = await QuestionSql.getQuestionByIdLocalised(element._id, db.mysql.read)
    //   if(qDtails.length == 0)
    //   {
    //     results.hits.hits.splice(index, 1)
    //   }
    // });
    let new_res = [];
    for (var i = 0; i < results.hits.hits.length; i++) {
      var qDtails = await QuestionSql.getQuestionByIdLocalised(results.hits.hits[i]['_id'], db.mysql.read)
      // if(qDtails.length == 0)
      // {
      //   results.hits.hits.splice(i, 1)
      // }
      // else
      // {
      //   results.hits.hits[i]['url'] = qDtails[0]['url_text']
      // }
      if (qDtails.length != 0) {
        results.hits.hits[i]['url'] = qDtails[0]['url_text']
        results.hits.hits[i]['_source']['ocr_text'] = qDtails[0]['ocr_text']
        new_res.push(results.hits.hits[i])
      }
    }

    let responseData = {

      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": new_res
    };
    res.status(responseData.meta.code).json(responseData);
  } catch (e) {
    next(e)

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error"
    //   },
    //   "data": null,
    //   "error": e
    // };
    // res.status(responseData.meta.code).json(responseData);
  }
}

async function getChaptersByQid(req, res, next) {

  try {
    db = req.app.get('db');
    let qid = req.params.qid;
    let promises = [], datas = [], container = []
    let student_id;

    let locale_val = req.params.locale;
    if (locale_val == undefined) {
      locale_val = ""
    }

    let version = "v3"

    promises.push(QuestionContainer.getByQuestionIdLocalised(locale_val, version, qid, db))

    let quesres = await Promise.all(promises);

    let question = quesres[0]

    //console.log(question[0]);

    if (question == "Invalid question id") {
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "Success"
        },
        "data": "Invalid question id",
      };
      res.status(responseData.meta.code).json(responseData);
    } else {
      // datas['question_details'] = question
      if (question[0]['packages'] != null) {
        let packages = question[0]['packages'].split(",");
        // let packages = question[0]['packages'];
        // packages.push("NCERT");

        let sclass = question[0]['class'];

        let new_promises = [];

        for (let i = 0; i < packages.length; i++) {
          if (packages[i] == "NCERT") {
            new_promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, "NCERT", sclass, db));
          } else if (packages[i] == "IIT JEE PREVIOUS YEAR") {
            new_promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, "IIT", null, db));//here parameter corrected
          }

          // else if (packages[i] == "BANSAL") {
          //   new_promises.push(ChapterContainer.getDistChaptersForStudyMaterial("BANSAL", null, db));
          // }
          else if (packages[i] == "XII BOARDS PREVIOUS YEAR") {
            new_promises.push(ChapterContainer.getDistYearsLocalised(version, "XII Boards", db));
          } else if (packages[i] == "X BOARDS") {
            new_promises.push(ChapterContainer.getDistYearsLocalised(version, "X Boards", db));
          } else if (packages[i] == "JEE ADVANCED PREVIOUS YEAR") {
            new_promises.push(ChapterContainer.getDistYearsLocalised(version, "Jee Advanced", db));
          } else if (packages[i] == "JEE MAINS PREVIOUS YEAR") {
            new_promises.push(ChapterContainer.getDistYearsLocalised(version, "Jee Mains", db));
          } else if (packages[i] == "RD SHARMA") {
            new_promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, "RD SHARMA", sclass, db));
          } else if (packages[i] == "CENGAGE") {
            new_promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, "CENGAGE", null, db))
          } else {
            new_promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, "NCERT", sclass, db));
          }
        }

        new_promises.push(QuestionContainer.getMicroconceptsBySubtopicsLocalised(locale_val, version, sclass, question[0]['chapter'], db));

        let resultNew = await Promise.all(new_promises);

        for (let i = 0; i < packages.length; i++) {
          if (packages[i] == "NCERT") {
            resultNew[0].forEach(function (item) {
              container.push(item['chapter']);
            });
            datas.push({"package": "NCERT", "type": "chapter", "data": container});
          } else if (packages[i] == "IIT JEE PREVIOUS YEAR") {
            resultNew[0].forEach(function (item) {
              container.push(item['chapter']);
            });
            datas.push({"package": "IIT JEE PREVIOUS YEAR", "type": "chapter", "data": container});
          } else if (packages[i] == "BANSAL") {
            resultNew[0].forEach(function (item) {
              container.push(item['chapter']);
            });
            datas.push({"package": "BANSAL", "type": "chapter", data: container});
          } else if (packages[i] == "XII BOARDS PREVIOUS YEAR") {
            resultNew[0].forEach(function (item) {
              container.push(item['year']);
            });
            datas.push({"package": "XII BOARDS PREVIOUS YEAR", "type": "year", data: container});
          } else if (packages[i] == "X BOARDS") {
            resultNew[0].forEach(function (item) {
              container.push(item['year']);
            });
            datas.push({"package": "X BOARDS", "type": "year", data: container});
          } else if (packages[i] == "JEE ADVANCED PREVIOUS YEAR") {
            resultNew[0].forEach(function (item) {
              container.push(item['year']);
            });
            datas.push({"package": "JEE ADVANCED PREVIOUS YEAR", "type": "year", data: container});
          } else if (packages[i] == "JEE MAINS PREVIOUS YEAR") {
            resultNew[0].forEach(function (item) {
              container.push(item['year']);
            });
            datas.push({"package": "JEE MAINS PREVIOUS YEAR", "type": "year", data: container});
          } else if (packages[i] == "RD SHARMA") {
            resultNew[0].forEach(function (item) {
              container.push(item['chapter']);
            });
            datas.push({"package": "RD SHARMA", "type": "chapter", data: container});
          } else if (packages[i] == "CENGAGE") {
            resultNew[0].forEach(function (item) {
              container.push(item['chapter']);
            });
            datas.push({"package": "CENGAGE", "type": "chapter", data: container});
          } else {
            resultNew[0].forEach(function (item) {
              container.push(item['chapter']);
            });
            datas.push({"package": packages[i], "type": "chapter", "data": container});
          }
          container = []
        }

        datas.push({"type": "microconcept", "data": []});

        for (let i = 0; i < resultNew[1].length; i++) {
          let available_flag = false;
          datas[packages.length]['data'].forEach(function (item) {
            if (item['subtopic'] == resultNew[1][i]['subtopic']) {
              item['data'].push(resultNew[1][i]);
              available_flag = true;
            }
          });
          if (!available_flag) {
            datas[packages.length]['data'].push({"subtopic": resultNew[1][i]['subtopic'], "data": [resultNew[1][i]]});
          }
        }
        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": datas,
        };
        res.status(responseData.meta.code).json(responseData);
      } else {
        datas = [{
          "package": null,
          "type": "chapter",
          "data": []
        }, {
          "type": "microconcept",
          "data": []
        }]

        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": datas,
        };
        res.status(responseData.meta.code).json(responseData);
      }
    }
  } catch (e) {
    // //console.log(e)
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error",
    //     "error": e
    //   },
    //   "data": null,
    //
    // };
    // res.status(responseData.meta.code).json(responseData);
  }

}

async function getMostWatchedUsers(req, res, next) {
  try {
    db = req.app.get('db');
    let promises = [], datas = []
    let student_id = req.user.student_id;

    promises.push(Question.getMostWatchedVideoCountBySid(student_id, db.mysql.read));
    promises.push(Question.getTodayMostWatchedStudents(db.mysql.read));
    promises.push(Question.getLastdayWinners(db.mysql.read));
    promises.push(Question.getContestDetails(db.mysql.read));

    let result = await Promise.all(promises);
    let user = {};

    if (req.user['student_fname'] === '' || req.user['student_fname'] == 'undefined')
      user['student_fname'] = null
    else
      user['student_fname'] = req.user['student_fname']

    user['student_username'] = req.user['student_username']


    if (req.user['img_url'] === '' || req.user['img_url'] == 'undefined')
      user['profile_image'] = null
    else
      user['profile_image'] = req.user['img_url']

    user['student_id'] = student_id


    if (result[0].length == 0) {
      user['video_count'] = 0
      user['total_engagement_time'] = 0
    } else {
      user['video_count'] = result[0][0]['video_count']
      user['total_engagement_time'] = result[0][0]['total_engagement_time']
    }

    let contest = result[3];
    let contest_details = {};
    contest_details.winners = "";
    contest_details.prize_money = "";
    contest_details.rules = [];
    //console.log(contest)
    for (let i = 0; i < contest.length; i++) {
      if (contest[i]['entity_type'] == "winners") {
        contest_details['winners'] = contest[i]['description']
      } else if (contest[i]['entity_type'] == "prize_money") {
        contest_details['prize_money'] = contest[i]['description']
      } else if (contest[i]['entity_type'] == "rules") {
        contest_details['rules'].push(contest[i]['description'])
      }
    }

    let responseData = {

      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": {
        "user_details": user,
        "today_users": result[1],
        "last_day_users": result[2],
        "contest_details": contest_details
      }

    };
    res.status(responseData.meta.code).json(responseData);


  } catch (e) {
    //console.log(e)
    next(e)

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block"
    //   },
    //   "data": null,
    //
    // };
    // res.status(responseData.meta.code).json(responseData);
  }

}

async function jeeMains2019(req, res, next) {

  db = req.app.get('db');
  let database = db;
  let promises = [], datas = "";

  try {

    let date_val = req.body.date;
    let shift = req.body.shift;
    let page = req.body.page;
    var flag = 0;
    let version = "v3"

    promises.push(ChapterContainer.getDistYearsLocalised(version, req.body.exam, database));
    promises.push(QuestionContainer.getDistinctDateNew(database));

    if (date_val != undefined && !_.isNull(date_val) && date_val != '') {
      promises.push(QuestionContainer.getDistinctShiftNew(date_val, database));
      flag = 2;
      if (shift != undefined && !_.isNull(shift) && shift != '') {
        promises.push(QuestionContainer.getJM2019QuestionsNew(date_val, shift, page, database));
        promises.push(QuestionContainer.getJM2019QuestionsTotalCountNew(date_val, shift, database));
      } else {
        promises.push(QuestionContainer.getJM2019QuestionsNew(date_val, "", page, database));
        promises.push(QuestionContainer.getJM2019QuestionsTotalCountNew(date_val, "", database));
      }
    } else {
      promises.push(QuestionContainer.getJM2019QuestionsNew("", "", page, database));
      promises.push(QuestionContainer.getJM2019QuestionsTotalCountNew("", "", database));
      flag = 1;
    }

    let result = await Promise.all(promises);

    if (flag == 1) {
      datas = {
        "year_list": result[0],
        "date_list": result[1],
        "question_list": result[2],
        "total_count": result[3][0]['total_records']
      }
    } else if (flag == 2) {
      datas = {
        "year_list": result[0],
        "date_list": result[1],
        "shift_list": result[2],
        "question_list": result[3],
        "total_count": result[4][0]['total_records']
      }
    }

    let responseData = {

      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": datas

    };
    res.status(responseData.meta.code).json(responseData);
  } catch (e) {
    //console.log(e)
    let responseData = {

      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,

    };
    res.status(responseData.meta.code).json(responseData);
  }
}

async function jeeMains2019Answers(req, res, next) {

  db = req.app.get('db');
  let database = db;
  let promises = [], datas = "";

  try {
    let date_val = req.body.date;
    let shift = req.body.shift;
    let page = req.body.page;
    var flag = 0;
    let version = "v3";

    promises.push(ChapterContainer.getDistYearsLocalised(version, req.body.exam, database));
    promises.push(QuestionContainer.getDistinctDateAnswerNew(database));

    if (date_val != undefined && !_.isNull(date_val) && date_val != '') {
      promises.push(QuestionContainer.getDistinctShiftAnswerNew(date_val, database));
      flag = 2;
      if (shift != undefined && !_.isNull(shift) && shift != '') {
        promises.push(QuestionContainer.getJM2019QuestionsAnswerNew(date_val, shift, page, database));
        promises.push(QuestionContainer.getJM2019QuestionsTotalCountAnswerNew(date_val, shift, database));
      } else {
        promises.push(QuestionContainer.getJM2019QuestionsAnswerNew(date_val, "", page, database));
        promises.push(QuestionContainer.getJM2019QuestionsTotalCountAnswerNew(date_val, "", database));
      }
    } else {
      promises.push(QuestionContainer.getJM2019QuestionsAnswerNew("", "", page, database));
      promises.push(QuestionContainer.getJM2019QuestionsTotalCountAnswerNew("", "", database));
      flag = 1;
    }

    let result = await Promise.all(promises);

    if (flag == 1) {
      datas = {
        "year_list": result[0],
        "date_list": result[1],
        "question_list": result[2],
        "total_count": result[3][0]['total_records']
      }
    } else if (flag == 2) {
      datas = {
        "year_list": result[0],
        "date_list": result[1],
        "shift_list": result[2],
        "question_list": result[3],
        "total_count": result[4][0]['total_records']
      }
    }

    let responseData = {

      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": datas

    };
    res.status(responseData.meta.code).json(responseData);
  } catch (e) {
    //console.log(e)
    let responseData = {

      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,

    };
    res.status(responseData.meta.code).json(responseData);
  }

}

async function microConcept(req, res, next) {
  try {
    db = req.app.get('db');
    let promises = [], datas = {};

    let class_id = req.body.class_id;
    let course = req.body.course;
    let chapter = req.body.chapter;
    let subtopic = req.body.subtopic;
    let page = req.body.page;

    let chapter2 = chapter
    if(chapter2 != null && chapter2 != '' && chapter2 != undefined)
    {
      chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, "")
      chapter2 = chapter2.replace(/\s+/g, " ");chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, "")
    }
    console.log("chapter 2 ::: ",chapter2)

    let subtopic2 = subtopic
    if(subtopic2 != null && subtopic2 != '' && subtopic2 != undefined)
    {
      subtopic2 = subtopic2.replace(new RegExp('[/]', 'g'), '_')
      subtopic2 = subtopic2.replace(/[^a-zA-Z0-9 ]/g, "")
      subtopic2 = subtopic2.replace(/\s+/g, " ");
    }
    console.log("subtopic 2 ::: ",subtopic2)

    promises.push(QuestionContainer.distMicroClasses(db));
    promises.push(QuestionContainer.microQuestionsV3(class_id, course, chapter2, subtopic2, page, db));
    promises.push(QuestionContainer.microQuestionsCountV3(class_id, course, chapter2, subtopic2, db));

    let flag = 0;
    if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
      flag++;
      promises.push(QuestionContainer.distMicroCourses(class_id, db));
      if (course != undefined && !_.isNull(course) && course != '') {
        flag++;
        promises.push(QuestionContainer.distMicroChapters(class_id, course, db));
        if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
          flag++;
          promises.push(QuestionContainer.distMicroSubtopics(class_id, course, chapter, db));
        }
      }
    }

    let result = await Promise.all(promises);

    if (flag == 0) {
      datas = {'class_list': result[0], 'question_list': result[1], 'total_count': result[2][0]['total_records']}
    }
    if (flag == 1) {
      datas = {
        'class_list': result[0],
        'course_list': result[3],
        'question_list': result[1],
        'total_count': result[2][0]['total_records']
      }
    } else if (flag == 2) {
      datas = {
        'class_list': result[0],
        'course_list': result[3],
        'chapter_list': result[4],
        'question_list': result[1],
        'total_count': result[2][0]['total_records']
      }
    } else if (flag == 3) {
      datas = {
        'class_list': result[0],
        'course_list': result[3],
        'chapter_list': result[4],
        'subtopic_list': result[5],
        'question_list': result[1],
        'total_count': result[2][0]['total_records']
      }
    }

    let responseData = {

      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": datas

    };
    res.status(responseData.meta.code).json(responseData);
  } catch (e) {
    //console.log(e)
    let responseData = {

      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,

    };
    res.status(responseData.meta.code).json(responseData);
  }
}

async function askWeb(req, res, next) {

  try {
    config = req.app.get('config')
    let sns = req.app.get('sns')
    let translate2 = req.app.get('translate2')
    elasticSearchClient = req.app.get('client')
    blobService = req.app.get('blobService')
    let publicPath = req.app.get('publicPath')
    db = req.app.get('db')
    let s3 = req.app.get('s3')
    let indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION
    const kinesisClient = req.app.get('kinesis');
    elasticSearchInstance = req.app.get('elasticSearchInstance');
    const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
    // elasticSearchInstance = new ElasticSearch(elasticSearchClient, config)
    let question_text = req.body.question_text
    let udid = req.body.student_id

    let stu_id = await VideoContainer.getStudentId(udid, db);
    if (stu_id.length == 0) {
      stu_id = await VideoView.setStudentId(udid, db.mysql.write);
      stu_id = stu_id.insertId
    } else {
      stu_id = stu_id[0].student_id
    }
    let student_id = stu_id

    let locale = req.body.locale
    let subject = req.body.subject
    let chapter = req.body.chapter
    let ques = req.body.question
    let student_class = req.body.class
    let question_image = req.body.question_image
    const { questionInitSnsUrl, userQuestionSnsUrl } = Data;
    let matches_array, languages_arrays, languages_obj,handwritten=0;

    let st_lang_code, qid, insertedQuestion = {}, filedToUpdate = {}, promises = []
    student_id = (student_id) ? parseInt(student_id) : 0;
    locale = ((locale) && (locale !== "")) ? locale : 'en';
    insertedQuestion["student_id"] = student_id
    insertedQuestion["class"] = student_class
    insertedQuestion["subject"] = subject
    insertedQuestion["book"] = subject
    insertedQuestion["chapter"] = chapter
    insertedQuestion["question"] = ques
    insertedQuestion["doubt"] = "WEB"
    insertedQuestion["locale"] = locale
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
        ques: insertedQuestion.doubt,
        locale,
        UtilityModule: Utility,
        questionInitSnsUrl,
    });
    let ocr,ocr_type,ocr_data;

    if (qid) {
      const variantAttachment = await Utility.getFlagrResponse(kinesisClient, student_id);
      //check for image
      if ((typeof question_text === 'undefined' || question_text.length === 0) && (typeof question_image !== 'undefined' && question_image.length > 0)) {

        let extension = ".png", content_type
        if (question_image.indexOf("png") !== -1) {
          extension = ".png"
          content_type = "image/png"
        } else if (question_image.indexOf("jpg") !== -1 || question_image.indexOf("jpeg") !== -1) {
          extension = ".jpg"
          content_type = "image/jpg"
        }
        question_image = question_image.replace(/^data:([A-Za-z-+/]+);base64,/, "");
        const fileName = "upload_" + qid + "_" + moment().unix() + extension;
        let buf = new Buffer(question_image, 'base64');
        promises.push(fs.writeFileAsync(publicPath + "/uploads/" + fileName, question_image, 'base64'))
        // promises.push(Utility.uploadImageToBlob(blobService, fileName, buf))
        promises.push(Utility.uploadTos3(s3, config.aws_bucket, fileName, buf, content_type))
        await Promise.all(promises)
        promises = []
        filedToUpdate['question_image'] = fileName

        let host = req.protocol + "://" + req.headers.host
        ocr_data = await QuestionHelper.handleOcrGlobal({ image:question_image, host, fileName, translate2, config, next })
        // ocr_data = await QuestionHelper.handleOcr(student_id, 1,question_image,host,locale,handwritten,fileName,translate2, config)
        ocr = ocr_data['ocr']
        ocr_type = ocr_data['ocr_type']
        handwritten = ocr_data['handwritten']
        locale = ocr_data['locale']

        // ocr = Utility.replaceSpecialSymbol2(ocr)
        filedToUpdate["ocr_done"] = 1
        filedToUpdate["ocr_text"] = ocr
        filedToUpdate["original_ocr_text"] = ocr
        filedToUpdate["locale"] = locale
        filedToUpdate.is_trial = ocr_data.ocr_type;
        // promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
        st_lang_code = ocr_data.locale
        languages_obj = Utility.getLanguageObject(languages_arrays);
        let language = languages_obj[st_lang_code];
        if (typeof language === 'undefined') {
          language = 'english'
        }
        const stockWordList = await QuestionContainer.getStockWordList(db);

        promises.push(QuestionHelper.handleElasticSearchWrapper({
            ocr: ocr_data.ocr, elasticSearchInstance, elasticSearchTestInstance, kinesisClient, elasticIndex: indexName, stockWordList, useStringDiff: true, language, fuzz, UtilityModule: Utility, studentId: student_id, ocrType: ocr_data.ocr_type, variantAttachment, next,
        }, config))
        // promises.push(QuestionHelper.handleElasticSearchGlobal({ ocr: ocr_data['ocr'], elasticSearchInstance, elasticIndex: indexName }))
        promises.push(fs.unlinkAsync(publicPath + "/uploads/" + fileName));

      } else if (typeof question_text !== 'undefined' && question_text.length > 0) {
        //question text
        if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
          let transLateApiResp = await Utility.translateApi2(question_text, translate2)
          if (transLateApiResp.length > 0 && transLateApiResp[1]['data'] !== undefined && transLateApiResp[1]['data']['translations'] !== undefined && transLateApiResp[1]['data']['translations'][0]['translatedText'] !== undefined) {
            question_text = transLateApiResp[1]['data']['translations'][0]['translatedText']
            ocr = question_text
          }
        }
        ocr = question_text
        ocr_data = {ocr: question_text, ocr_type: 1, handwritten: handwritten, locale: locale, ocr_origin:'question_text'}
        filedToUpdate["ocr_done"] = 1
        filedToUpdate["ocr_text"] = question_text
        filedToUpdate["original_ocr_text"] = question_text
        filedToUpdate["locale"] = locale
        filedToUpdate.is_trial = 1;
        // promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
        st_lang_code = ocr_data['locale'];
        languages_obj = Utility.getLanguageObject(languages_arrays);
        let language = languages_obj[st_lang_code];
        if (typeof language === 'undefined') {
          language = 'english'
        }
        const stockWordList = await QuestionContainer.getStockWordList(db);

        promises.push(QuestionHelper.handleElasticSearchWrapper({
            ocr: ocr_data.ocr, elasticSearchInstance, elasticSearchTestInstance, kinesisClient, elasticIndex: indexName, stockWordList, useStringDiff: true, language, fuzz, UtilityModule: Utility, student_id, ocrType: 0, variantAttachment, next,
        }, config))
        // promises.push(QuestionHelper.handleElasticSearchGlobal({ ocr: ocr_data['ocr'], elasticSearchInstance, elasticIndex: indexName }))
      }
      // languages_arrays = await Localised.getList(db.mysql.read);
      Promise.all(promises).then(async values => {
        if (values[0]) {

          let promises1 = [];
          const {
              stringDiffResp,
              info,
          } = values[0];
          filedToUpdate.original_ocr_text = info.query_ocr_text;
          filedToUpdate.question = info.version;
          filedToUpdate.wrong_image = info.isIntegral;
          filedToUpdate.subject = stringDiffResp[3];
          await Question.updateQuestion(filedToUpdate, qid, db.mysql.write);
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
              ques: insertedQuestion.doubt,
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
          });
          matches_array = stringDiffResp[0];
          let matches = [];
          for (let z = 0; z < matches_array.length; z++) {
            var qDtails = await QuestionSql.getQuestionByIdLocalised(matches_array[z]["_id"], db.mysql.read)
            if (qDtails.length != 0) {
              matches_array[z]["url_text"] = qDtails[0]['url_text']
              matches_array[z]["_source"]["ocr_text"] = qDtails[0]['ocr_text']
                  // values[1]['hits']['hits'][z]
                }
              }
              let promises3 = [], is_subscribed = 0;
              for (let i = 0; i < matches_array.length; i++) {
                promises3.push(QuestionMetaContainer.getQuestionMeta(matches_array[i]['_id'], db));
              }
              Promise.all(promises3).then(values => {
                // //console.log(values);
                for (let i = 0; i < values.length; i++) {
                  if (values[i].length > 0) {
                    matches_array[i]['class'] = values[i][0]['class'];
                    matches_array[i]['chapter'] = values[i][0]['chapter'];
                    matches_array[i]['difficulty_level'] = values[i][0]['level'];
                  } else {
                    matches_array[i]['class'] = null;
                    matches_array[i]['chapter'] = null;
                    matches_array[i]['difficulty_level'] = null;
                  }
                  if (st_lang_code !== "en") {
                    matches_array[i]['question_thumbnail'] = config.staticCDN + "q-thumbnail/" + st_lang_code + "_" + matches_array[i]['_id'] + ".png"
                  } else {
                    matches_array[i]['question_thumbnail'] = config.staticCDN + "q-thumbnail/" + matches_array[i]['_id'] + ".png"
                  }
                  // }
                }

                let responseData = {
                  "meta": {
                    "code": 200,
                    "success": true,
                    "message": "SUCCESS!"
                  },
                  "data": {
                    "question_id": qid,
                    // "question_image": config.cdn_url + "q-images/" + filedToUpdate['question_image'],
                    "question_image": config.cdn_url + "images/" + filedToUpdate['question_image'],
                    "matched_questions": matches_array,
                    "matched_count": matches_array.length,
                    // "is_subscribed": is_subscribed,
                    // "notification": n_data

                  }
                }
                if (typeof filedToUpdate['question_image'] === 'undefined') {
                  responseData["data"]["question_image"] = null
                }
                res.status(responseData.meta.code).json(responseData);
              }).catch(error => {
                //console.log(error);
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
            }
          }).catch(error => {
            next(error)
          })
        } else {
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
        console.log(e)
        next(e)
      }

    }

    async function updatePrefixSearch(req, res, next) {
      let ques_obj
      let sns = req.app.get('sns')
      config = req.app.get('config')
      try {

        db = req.app.get('db');
        let ocr_text = req.body.ocr_text;
        let qid = req.body.qid;
        let promises = [];
    //Update questions table
    promises.push(Question.getByQuestionId(qid, db.mysql.read));
    promises.push(Answer.getByAnswerId(qid, db.mysql.read));
    promises.push(Question.getFromQuestionsMetaByQuestionId(qid, db.mysql.read));

    let result = await Promise.all(promises);

    let question = result[0];
    let answer = result[1];
    let question_meta = result[2];

    let ques_obj =
    {
      student_id: req.user.student_id,
      class: question[0]['class'],
      subject: question[0]['subject'],
      book: question[0]['book'],
      chapter: question[0]['chapter'],
      question: question[0]['question'],
      doubt: question[0]['doubt'],
      is_allocated: question[0]['is_allocated'],
      allocated_to: 10000,
      allocation_time: question[0]['allocation_time'],
      is_answered: question[0]['is_answered'],
      is_text_answered: 1,
      ocr_done: question[0]['ocr_done'],
      ocr_text: question[0]['ocr_text'],
      original_ocr_text: ocr_text,
      matched_question: qid,
      question_credit: 1,
      is_trial: question[0]['is_trial'],
      is_skipped: question[0]['is_skipped'],
      parent_id: question[0]['parent_id'],
      incorrect_ocr: question[0]['incorrect_ocr'],
      skip_question: question[0]['skip_question'],
      locale: question[0]['locale'],
      difficulty: question[0]['difficulty'],
      is_community: 0
    };

    let ans_obj =
    {
      expert_id: 10000,
      answer_video: answer[0]['answer_video'],
      is_approved: answer[0]['is_approved'],
      answer_rating: answer[0]['answer_rating'],
      answer_feedback: answer[0]['answer_feedback'],
      youtube_id: answer[0]['youtube_id'],
      duration: answer[0]['duration'],
      isDuplicate: answer[0]['isDuplicate'],
      review_expert_id: answer[0]['review_expert_id'],
      is_reviewed: answer[0]['is_reviewed'],
      is_positive_review: answer[0]['is_positive_review'],
      vdo_cipher_id: answer[0]['vdo_cipher_id'],
      is_vdo_ready: answer[0]['is_vdo_ready']
    };


    let quesmeta_obj =
    {

      intern_id: 10004,
      assigned_to: '10004',
      class: question_meta[0]['class'],
      chapter: question_meta[0]['chapter'],
      subtopic: question_meta[0]['subtopic'],
      microconcept: question_meta[0]['microconcept'],
      level: question_meta[0]['level'],
      target_course: question_meta[0]['target_course'],
      package: question_meta[0]['package'],
      type: question_meta[0]['type'],
      q_options: question_meta[0]['q_options'],
      q_answer: question_meta[0]['q_answer'],
      diagram_type: question_meta[0]['diagram_type'],
      concept_type: question_meta[0]['concept_type'],
      chapter_type: question_meta[0]['chapter_type'],
      we_type: question_meta[0]['we_type'],
      ei_type: question_meta[0]['ei_type'],
      aptitude_type: question_meta[0]['aptitude_type'],
      pfs_type: question_meta[0]['pfs_type'],
      symbol_type: question_meta[0]['symbol_type'],
      doubtnut_recommended: question_meta[0]['doubtnut_recommended'],
      secondary_class: question_meta[0]['secondary_class'],
      secondary_chapter: question_meta[0]['secondary_chapter'],
      secondary_subtopic: question_meta[0]['secondary_subtopic'],
      secondary_microconcept: question_meta[0]['secondary_microconcept'],
      video_quality: question_meta[0]['video_quality'],
      audio_quality: question_meta[0]['audio_quality'],
      language: question_meta[0]['language'],
      ocr_quality: question_meta[0]['ocr_quality'],
      is_skipped: question_meta[0]['is_skipped']
    };

    //console.log(question_meta);

    let quesResult = await Question.addQuestion(ques_obj, db.mysql.write);

    if (quesResult != undefined || quesResult != '') {
      ans_obj['question_id'] = quesResult['insertId'];
      quesmeta_obj['question_id'] = quesResult['insertId'];
      ques_obj["question_id"] = quesResult['insertId'];
      promises = [];
      result = [];
      promises.push(Answer.addSearchedAnswer(ans_obj, db.mysql.write));
      promises.push(Question.addSearchQuestionMeta(quesmeta_obj, db.mysql.write));

      result = await Promise.all(promises);
      let ansResult = result[0];
      let quesmetaResult = result[1];
      //console.log(quesmetaResult)

      if (ansResult && quesmetaResult) {
        let responseData =
        {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
          },
          "data": {"question": question[0], "answer": answer[0]},

        };
        res.status(responseData.meta.code).json(responseData);
        console.log(ques_obj)
        let data = {
         "action":"ASK_FROM_APP",
         "data": ques_obj,
         "uuid": uuidv4(),
         "timestamp": Utility.getCurrentTimeInIST()
       }
       Utility.logEntry(sns,config.question_ask_sns, data)
     }
   }

 } catch (e) {
  console.log(ques_obj)
    // let data = {
    //    "action":"ASK_FROM_APP",
    //    "data": ques_obj,
    //    "uuid": uuidv4(),
    //    "timestamp": Utility.getCurrentTimeInIST()
    //  }
    // Utility.logEntry(sns,config.question_ask_sns, data)
    next(e)

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error"
    //   },
    //   "data": null,
    //   "error": e
    // };
    // res.status(responseData.meta.code).json(responseData);
  }
}


module.exports = {
  ask,
  getQuestionDetailsByTag,
  filter,
  getChapters,
  askExpert,
  getPrefixSearch,
  updatePrefixSearch,
  getChaptersByQid,
  getMostWatchedUsers,
  jeeMains2019,
  jeeMains2019Answers,
  microConcept,
  askWeb
};
