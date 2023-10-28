"use strict";
let db;
let _ = require('lodash');
const Home = require('../../../modules/home')
const Constants = require('../../../modules/constants')
const Course = require('../../../modules/course')
const Question = require('../../../modules/question')
const Utility = require('../../../modules/utility')
const LanguageContainer = require('../../../modules/containers/language')
const HomeContainer = require('../../../modules/containers/homeget')
const QuestionContainer = require('../../../modules/containers/question')
const blogContainer = require('../../../modules/containers/blog')

function homePage(req, res, next) {
  db = req.app.get('db');
  let database = db.mysql.read;
  let student_id = 98;
  let datas = [];
  let promises = [];

  let locale_val = req.params.locale;
  if(locale_val == undefined)
  {
    locale_val = ""
  }

  let version = 'v3';  

  promises.push(HomeContainer.getNcertBrowseQuestionsLocalisation(locale_val, version, db));
  promises.push(HomeContainer.getRDsharmaBrowseQuestionsLocalisation(locale_val, version, db));
  promises.push(HomeContainer.getCbseQuestionsLocalisation(version, db));
  promises.push(HomeContainer.getCengageBrowseQuestionsLocalisation(locale_val, version, db));
  promises.push(HomeContainer.getTenthBoardsBrowseQuestionsLocalisation(locale_val, version, db));
  promises.push(HomeContainer.getBoardsBrowseQuestionsLocalisation(locale_val, version, db));
  promises.push(HomeContainer.getJeeMainsQuestionsLocalisation(locale_val, version, db));
  promises.push(HomeContainer.getJeeAdvancedBrowseQuestionsLocalisation(locale_val, version, db));
  promises.push(blogContainer.getBlogItems(1, '', db))
  promises.push(HomeContainer.getPhysicsQuestionsLocalisation(locale_val, version, db))
  promises.push(HomeContainer.getChemistryQuestionsLocalisation(locale_val, version, db))
  promises.push(HomeContainer.getBiologyQuestionsLocalisation(locale_val, version, db))
  Promise.all(promises).then(function (values) {

    if (!_.isNull(values[0])) {
      let questions = values[0];
      let data1 = [];
      questions.forEach((values) => {
        data1.push(values);
      });
      datas.push({
        'title': 'NCERT',
        'slug': '/filter-view/ncert',
        'filterType': {'package': 'NCERT'},
        'description': 'Watch Free Video Solutions for all NCERT Questions',
        'list': data1
      });
    }

    if (!_.isNull(values[1])) {
      let questions = values[1];
      let data2 = [];
      questions.forEach((values) => {
        data2.push(values);
      });
      datas.push({
        'title': 'RD SHARMA',
        'slug': '/filter-view/rd-sharma',
        'filterType': {'package': 'RD SHARMA'},
        'description': 'Watch Free Video Solutions for all RD SHARMA questions',
        'list': data2
      });
    }

    if (!_.isNull(values[2])) {
      let questions = values[2];
      let data3 = [];
      questions.forEach((values) => {
        data3.push(values);
      });
      datas.push({
        'title': 'CBSE MATHS',
        'slug': '/filter-view/cbse',
        'filterType': {'package': 'CBSE'},
        'description': 'Get here CBSE Class 10 and Class 12 Boards related news which also includes CBSE Marking Scheme, CBSE Sample Papers, CBSE Study Materials and CBSE Syllabus etc which will be helpful for all the students who are preparing for CBSE Boards examinations. Click on view all to get more details :',
        'list': data3
      });
    }

    if (!_.isNull(values[3])) {
      let questions = values[3];
      let data3 = [];
      questions.forEach((values) => {
        data3.push(values);
      });
      datas.push({
        'title': 'CENGAGE MATHS',
        'slug': '/filter-view/cengage',
        'filterType': {'package': 'CENGAGE'},
        'description': 'Watch Free Video Solutions for all questions from every module of CENGAGE Maths',
        'list': data3
      });
    }


    if (!_.isNull(values[4])) {
      let questions = values[4];
      let data4 = [];
      questions.forEach((values) => {
        data4.push(values);
      });
      datas.push({
        'title': 'CBSE',
        'slug': '/filter-view/x-boards',
        'filterType': {'target_course': '10'},
        'description': 'Watch Free Video Solutions for previous years X Boards Examination',
        'list': data4
      });
    }

    if (!_.isNull(values[5])) {
      let questions = values[5];
      let data5 = [];
      questions.forEach((values) => {
        data5.push(values);
      });
      datas.push({
        'title': 'CBSE',
        'slug': '/filter-view/xii-boards',
        'filterType': {'target_course': '12'},
        'description': 'Watch Free Video Solutions for previous years XII Boards Examination',
        'list': data5
      });
    }


    if (!_.isNull(values[6])) {
      let questions = values[6];
      let data6 = [];
      questions.forEach((values) => {
        data6.push(values);
      });
      datas.push({
        'title': 'IIT JEE',
        'slug': '/filter-view/iit-jee-mains',
        'filterType': {'target_course': 'JEE MAINS'},
        'description': 'Watch Free Video Solutions for Questions that will help you prepare for JEE Mains',
        'list': data6
      });
    }

    if (!_.isNull(values[7])) {
      let questions = values[7];
      let data7 = [];
      questions.forEach((values) => {
        data7.push(values);
      });
      datas.push({
        'title': 'IIT JEE',
        'slug': '/filter-view/iit-jee-advanced',
        'filterType': {'target_course': 'JEE ADVANCE'},
        'description': 'Watch Free Video Solutions for Questions that will help you prepare for JEE Advanced',
        'list': data7
      });
    }

    if (!_.isNull(values[8])) {
      let questions = values[8];
      let data8 = [];
      questions.forEach((values) => {
        data8.push(values);
      });
      datas.push({
        'title': 'Latest from Blog',
        'list': data8
      });
    }

    if (!_.isNull(values[9])) {
      let questions = values[9];
      let data9 = [];
      questions.forEach((values) => {
        data9.push(values);
      });
      datas.push({
        'title': 'Physics',
        'list': data9
      });
    }

    if (!_.isNull(values[10])) {
      let questions = values[10];
      let data10 = [];
      questions.forEach((values) => {
        data10.push(values);
      });
      datas.push({
        'title': 'Chemistry',
        'list': data10
      });
    }

    if (!_.isNull(values[11])) {
      let questions = values[11];
      let data11 = [];
      questions.forEach((values) => {
        data11.push(values);
      });
      datas.push({
        'title': 'Biology',
        'list': data11
      });
    }

    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS",
      },
      "data": datas
    }
    res.status(responseData.meta.code).json(responseData);
  }).catch((error) => {

    let responseData = {
      "meta": {
        "code": 403,
        "status": false,
        "message": "ERROR",
      },
      "data": null
    }
    res.status(responseData.meta.code).json(responseData);
  });

}

async function feed(req,res,next){
  db = req.app.get('db')
  let config = req.app.get('config')
  let page = req.params.page
  let limit = 5
  let locale = req.user.locale
  let language = "english"
  let student_class = req.user.student_class;

  let lang = await LanguageContainer.getByCode(locale,db)
  //console.log("language")
  //console.log(lang)
  if(lang.length > 0) {
    language = lang[0]['language']
  }
 try{

   // let resolvedPromises = await Question.getViralVideoByForFeedWithLanguage(limit,page,language, db.mysql.read)
   let resolvedPromises = await Question.getViralVideoFromEngagementPanel(student_class,limit,page,language, db.mysql.read)
   //console.log(resolvedPromises)
   if(resolvedPromises.length > 0){
     for(let i = 0;i<resolvedPromises.length; i++){
       if(resolvedPromises[i]['matched_question'] == null){
         resolvedPromises[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + resolvedPromises[i]['question_id'] + ".png"
       }else{
         resolvedPromises[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + resolvedPromises[i]['matched_question'] + ".png"
       }
       // resolvedPromises[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/"+resolvedPromises[i]['question_id']+".png"
       // resolvedPromises[i] = Utility.addThumbnail(resolvedPromises[i],config)
     }
   }
   let responseData = {
     "meta": {
       "code": 200,
       "success": true,
       "message": "SUCCESS",
     },
     "data": [{"playlist_id":"VIRAL","list":resolvedPromises}]
   }
   res.status(responseData.meta.code).json(responseData);
 }catch(e){
    //console.log(e)
   next(e)

   // let responseData = {
   //   "meta": {
   //     "code": 403,
   //     "success": false,
   //     "message": "No viral video",
   //   },
   //   "data": null,
   //   error:e
   // }
   // res.status(responseData.meta.code).json(responseData);

 }

}

async function feedWeb(req,res,next){
  db = req.app.get('db')
  let config = req.app.get('config')
  let page = req.params.page
  let limit = 5

  let version = 'v3';
  // let promises = []
  //base + (actual views * 10)
 try{

   let resolvedPromises = await QuestionContainer.getViralVideoByForFeedLocalisation(version, limit,page, db)
   if(resolvedPromises.length > 0){
     for(let i = 0;i<resolvedPromises.length; i++){
       if(resolvedPromises[i]['matched_question'] == null){
         resolvedPromises[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + resolvedPromises[i]['question_id'] + ".png"
       }else{
         resolvedPromises[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + resolvedPromises[i]['matched_question'] + ".png"
       }
       // resolvedPromises[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/"+resolvedPromises[i]['question_id']+".png"
       // resolvedPromises[i] = Utility.addThumbnail(resolvedPromises[i],config)
      //  resolvedPromises[i]['total_views'] = Utility.getViews(resolvedPromises[i]['total_views'])
      //  delete resolvedPromises[i]['old_views']
      //  delete resolvedPromises[i]['new_views']
     }
   }
   let responseData = {
     "meta": {
       "code": 200,
       "success": true,
       "message": "SUCCESS",
     },
     "data": {"playlist_id":"VIRAL","list":resolvedPromises}
   }
   res.status(responseData.meta.code).json(responseData);
 }catch(e){
    //console.log(e)
   next(e)

   // let responseData = {
   //   "meta": {
   //     "code": 403,
   //     "success": false,
   //     "message": "No viral video",
   //   },
   //   "data": null,
   //   error:e
   // }
   // res.status(responseData.meta.code).json(responseData);

 }
}

// module.exports = {homePage, getIntroVideoLink, getNcertClassChapters,feed}
module.exports = {homePage, feed, feedWeb}
