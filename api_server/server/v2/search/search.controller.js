"use strict";
const _ = require('lodash')
const moment = require('moment');
const fuzz = require('fuzzball');
const searchContainer = require('../../../modules/containers/search')
const LanguageContainer = require('../../../modules/containers/language');
const mysqlQuestionContainer = require('../../../modules/mysql/question');
const Utility = require('../../../modules/utility');
const helper = require('../../helpers/question.helper');
require('../../../modules/mongo/globalSearchLogs')
const bluebird = require("bluebird");
const mongoose = require("mongoose");
bluebird.promisifyAll(mongoose);
const GlobalSearchLog = mongoose.model("GlobalSearchLog");

async function search(req, res, next) {
  try {
    let text = req.params.text
    let db = req.app.get('db')
    let mongodatabase=db.mongo.write
    let tab = req.params.tab
    let config = req.app.get('config')
    let page = req.params.page, resolvedPromises
    let student_class = req.user.student_class
    let student_id = req.user.student_id
    let elasticSearchInstance = req.app.get('elasticSearchInstance');
    let limits = {"chapters": 10, "subtopic": 10, "concept": 10}
    let topicTabs = [{key: "all", description: "All"},{key : "videos",description: "Videos"}, {key: "chapters", description: "Chapters"}, {
      key: "subtopics",
      description: "Subtopics"
    }, {key: "microconcepts", description: "Concepts"}]
    let homepageTabs = [{key: "all", description: "All"}, {key: "chapters", description: "Chapters"}, {
      key: "subtopics",
      description: "Subtopics"
    }, {key: "microconcepts", description: "Microconcepts"}, {key: "pdf", description: "Pdf"}, {
      key: "playlist",
      description: "Playlist"
    }, {key: "quiz", description: "Quiz/Mock Test"}, {key: "contest", description: "Contests"}]
    let promises = []
    let data = {
      "topicPage": {
        "all": ["chapters", "subtopics", "microconcepts"],
        "chapters": {
          "tab": "chapters",
          "field": "chapter_display.completion",
          "ngramField": "chapter_display.edgengram"
        },
        "subtopics": {"tab": "subtopics", "field": "subtopic.completion", "ngramField": "subtopic.edgengram"},
        "microconcepts": {"tab": "microconcepts", "field": "mc_text.completion", "ngramField": "mc_text.edgengram"}
      },
      "home_page": {}
    }
    let isNgram = 1, isSuggest = 1
    if ((page === "homePage" && tab === "all")) {

    } else if ((page === "topicPage" && tab === "all")) {
      //console.log(isSuggest)
      //console.log(isNgram)

      for (let i = 0; i < data[page][tab].length; i++) {
        promises.push(elasticSearchInstance.findTopics(text, data[page][data[page][tab][i]], isSuggest, isNgram))
      }
      promises.push(elasticSearchInstance.findByOcr(text))
      resolvedPromises = await Promise.all(promises)
    } else {
      //invalid page
    }
    let results = generateData(page, tab, resolvedPromises, student_class)
    let mongoObj={"student_id":student_id,"student_class":student_class,"search_text":text,"size":results.size()}
    var global_search_log = new GlobalSearchLog(mongoObj);
    let result = await global_search_log.save()
    // mongodatabase.collection("global_search_log").insertOne(mongoObj, function(err, res){
    //   if(err){
    //     console.log("Error in Inserting data")
    //   }
    // })
    let response = {
      tabs: topicTabs,
      list: results,
      cdn_path: config.cdn_url + "images/"
    }
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Search"
      },
      "data": response
    }
    res.status(responseData.meta.code).json(responseData);
    //await db.redis.write.zaddAsync("keywords_logs", Math.floor(Date.now() / 1000), text)
  } catch (e) {
    next(e)
  }
}

async function getSuggestions(req, res, next) {
  try {
    let student_class = req.user.student_class
    let db = req.app.get('db')
    let topicTabs = [{key: "all", description: "All"}]
    if (student_class == 14) {
      student_class = _.shuffle([6, 7, 8, 9, 10, 11, 12])
      student_class = student_class[0]
    }
    let data = await searchContainer.getSugg(student_class, 10, 'english', db)
    data = data.filter(item => ((item.chapter !== "TIPS AND TRICKS") || (item.display !== null)))
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Search"
      },
      "data": {
        tabs: topicTabs,
        "text": "Trending Searches",
        "list": data
      }
    }
    return res.status(200).json(responseData)
  } catch (e) {
    //console.log(e)
  }

}

async function getCustomMatches(req, res, next) {
  try {
      const {
        questionId, locale, ocrType, elasticHostName, elasticIndexName, searchFieldName, videoLanguage, packageLanguage, subjectFilters, requestType, displayOcrText,
      } = req.body;
      let { ocrText } = req.body;
      const db = req.app.get('db');
      const elasticSearchInstance = req.app.get('elasticSearchInstance');
      const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
      const kinesisClient = req.app.get('kinesis');
      const iterations = await Utility.getIterations();
      const iter = JSON.parse(iterations);
      let baseVariantAttachment = {};
      for (let i = 0; i < iter.length; i++) {
          if (iter[i].key === 'default') {
              baseVariantAttachment = iter[i].attachment;
              break;
          }
      }
      ocrText = Utility.getOcrTextWithoutHtmlTags(ocrText);
      const stockWordList = [];
      const languagesArrays = await LanguageContainer.getList(db);
      const languagesObj = Utility.getLanguageObject(languagesArrays);
      const stLangCode = locale;
      const config = req.app.get('config');
      let language = languagesObj[stLangCode];
      if (typeof language === 'undefined') {
          language = 'english';
      }
      if (videoLanguage) {
        baseVariantAttachment.userLanguages = [videoLanguage];
      }
      if (packageLanguage) {
        baseVariantAttachment.packageLanguage = packageLanguage;
      }
      if (subjectFilters) {
        baseVariantAttachment.subjectFilters = subjectFilters;
      }
      let overrideStaging;
      let isStaging = true;
      if (requestType === 'duplicate_tagging') {
        overrideStaging = true;
        isStaging = false;
      }
      const result = await helper.handleElasticSearchWrapper({
          ocr: ocrText,
          elasticSearchInstance,
          elasticSearchTestInstance,
          kinesisClient,
          elasticIndex: elasticIndexName,
          elasticHostName,
          searchFieldName,
          stockWordList,
          useStringDiff: true,
          language,
          fuzz,
          UtilityModule: Utility,
          studentId: '0',
          ocrType,
          variantAttachment: baseVariantAttachment,
          isStaging,
          useComposerApi: true,
          overrideStaging,
          next,
      },config);
      const { stringDiffResp, info } = result;
      
      const values = {};
      values.query_ocr_text = info.query_ocr_text;
      if (_.get(stringDiffResp, '[0]', null) && stringDiffResp[0].length) {
        const qids = stringDiffResp[0].map((item) => (item._id));
        const studentIds = await mysqlQuestionContainer.getStudentIdFromQuestions(db.mysql.read, qids);
        const validStudentIds = studentIds.filter(item => ![-55, -159].includes(item.student_id))
        const validQuestionIds = validStudentIds.map((item) => String(item.question_id));
        values.matches = stringDiffResp[0].filter(item => validQuestionIds.includes(item._id));
        if (requestType === 'duplicate_tagging') {
          values.matches = await helper.replaceValidOcrTextsInMatches(db, values.matches);
        }
      } else {
        values.matches = [];
      }
      values.question_id = questionId;
      values.display_ocr_text = displayOcrText || ocrText;
      if (values.matches.length > 0 && requestType === 'duplicate_tagging') {
        db.mongo.write.collection('duplicate_tagging_panel_allocation').insertOne({
          question_id: questionId,
          expert_id: req.headers.expert_id,
          created_at: moment().format(),
        });
      }
      const responseData = {
          meta: {
              code: 200,
              success: true,
          },
          data: values,
      };
      return res.status(200).json(responseData);
  } catch (e) {
      next(e);
  }
}

function generateData(page, tab, data, student_class) {

  if (page === "topicPage") {
    //check tabs
    if (tab === "all") {
      // console.log("testest")
      // console.log(data[data.length - 1]['hits']['hits'])
      // 0 -> chapters
      // 1 -> subtopics
      //2 -> microconcepts
      // {
      //   "_index": "doubtnut_topics",
      //   "_type": "subtopics",
      //   "_id": "AWntZi7Z4md2_-DZzlXH",
      //   "_score": 4.313577,
      //   "_source": {
      //   "subtopic": "OPERATIONS ON SETS",
      //     "chapter": "SETS",
      //     "class": 11,
      //     "course": "NCERT",
      //     "type": "subtopics",
      //     "display": "OPERATIONS ON SETS | SETS | Class 11"
      // }
      // }
      var videoArr = []
      if(typeof data[data.length - 1]['hits'] !== 'undefined' && data[data.length - 1]['hits']['hits'].length > 0){
        console.log("1")
        console.log(data[data.length - 1]['hits']['hits'])
        for(let i=0;i<data[data.length - 1]['hits']['hits'].length;i++){
          let o = {}
          o["_index"] = data[data.length - 1]['hits']['hits'][i]["_index"]
          o["_type"] = data[data.length - 1]['hits']['hits'][i]["_type"]
          o["_id"] = data[data.length - 1]['hits']['hits'][i]["_id"]
          o["_score"] = data[data.length - 1]['hits']['hits'][i]["_score"]
          o["_source"] = {}
          o["_source"]['question_id'] = data[data.length - 1]['hits']['hits'][i]["_source"]["question_id"]
          o["_source"]['type'] = "videos"
          o["_source"]['display'] = data[data.length - 1]['hits']['hits'][i]["_source"]["ocr_text"]
          o["_source"]['page'] = 'SEARCH_SRP'
          videoArr.push(o)
        }
      }
      console.log("videoArr")
      console.log(videoArr)
      let chapter_array = [...data[0]['suggest']['chapters'][0]['options'], ...data[0]['hits']['hits']]
      let subtopic_array = [...data[1]['suggest']['subtopics'][0]['options'], ...data[1]['hits']['hits']]
      let concept_array = [...data[2]['suggest']['microconcepts'][0]['options'], ...data[2]['hits']['hits']]
      // let video_array = [...data[3]['suggest']['microconcepts'][0]['options'], ...data[2]['hits']['hits']]
      let list = [...chapter_array, ...subtopic_array, ...concept_array, ...videoArr]
      list = _(list).uniqBy('_id')
      return list
    } else if (tab === "chapters") {

    } else if (tab === "subtopics") {

    } else if (tab === "concepts") {

    }
  } else if (page === "homePage") {

  }

  function getSugg(student_class, limit, language, mysql) {
    let sql = "select *,'NCERT' as course from (select a.question_id,case when c." + language + " is null then b.ocr_text" +
      " else c." + language + " end as ocr_text,b.question,b.matched_question from ((select question_id from" +
      " trending_videos where date(created_at) >= DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND class = '" + student_class + "') as a left join (select question_id,ocr_text,question,matched_question from questions) as b on a.question_id = b.question_id left join (select question_id," + language + " from questions_localized ) as c on a.question_id = c.question_id)) as z left join questions_meta on questions_meta.question_id=z.question_id limit " + limit;
    return mysql.query(sql)
  }
}

module.exports = {search, getSuggestions, getCustomMatches}