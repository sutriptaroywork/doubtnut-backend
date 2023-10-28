"use strict";
let db;
let _ = require('lodash');
const Home = require('../../../modules/home')
const Constants = require('../../../modules/constants')
const Course = require('../../../modules/course')
const Question = require('../../../modules/question')
const Utility = require('../../../modules/utility')
const LanguageContainer = require('../../../modules/containers/language')
const QuestionContainer = require('../../../modules/containers/question')

// function homePage(req, res, next) {
//   db = req.app.get('db');
//   let database = db.mysql.read;
//   let student_id = 98;
//   let datas = [];
//   let promises = [];
//   promises.push(Home.getNcertBrowseQuestions(database));
//   promises.push(Home.getRDsharmaBrowseQuestions(database));
//   promises.push(Home.getCengageBrowseQuestions(database));
//   promises.push(Home.getTenthBoardsBrowseQuestions(database));
//   promises.push(Home.getBoardsBrowseQuestions(database));
//   promises.push(Home.getJeeMainsQuestions(database));
//   promises.push(Home.getJeeAdvancedBrowseQuestions(database));
//   promises.push(Home.getMostWatchedQuestions(database));
//   Promise.all(promises).then(function (values) {
//
//
//     if (!_.isNull(values[0])) {
//       let questions = values[0];
//       let data1 = [];
//       questions.forEach((values) => {
//         let data = {};
//         data['question_id'] = values.question_id;
//         data['ocr_text'] = values.ocr_text;
//         data['question'] = values.question;
//         data['questions_meta'] = values;
//         data1.push(data);
//       });
//       datas.push({
//         'title': 'NCERT',
//         'slug': '/filter-view/ncert',
//         'filterType': {'package': 'NCERT'},
//         'description': 'Watch Free Video Solutions for all NCERT Questions',
//         'list': data1
//       });
//     }
//
//     if (!_.isNull(values[1])) {
//       let questions = values[1];
//       let data2 = [];
//       questions.forEach((values) => {
//         let data = {};
//         data['question_id'] = values.question_id;
//         data['ocr_text'] = values.ocr_text;
//         data['question'] = values.question;
//         data['questions_meta'] = values;
//         data2.push(data);
//       });
//       datas.push({
//         'title': 'RD SHARMA',
//         'slug': '/filter-view/rd-sharma',
//         'filterType': {'package': 'RD SHARMA'},
//         'description': 'Watch Free Video Solutions for all RD SHARMA questions',
//         'list': data2
//       });
//     }
//
//     if (!_.isNull(values[2])) {
//       let questions = values[2];
//       let data3 = [];
//       questions.forEach((values) => {
//         let data = {};
//         data['question_id'] = values.question_id;
//         data['ocr_text'] = values.ocr_text;
//         data['question'] = values.question;
//         data['questions_meta'] = values;
//         data3.push(data);
//       });
//       datas.push({
//         'title': 'CENGAGE MATHS',
//         'slug': '/filter-view/cengage',
//         'filterType': {'package': 'CENGAGE'},
//         'description': 'Watch Free Video Solutions for all questions from every module of CENGAGE Maths',
//         'list': data3
//       });
//     }
//
//
//     if (!_.isNull(values[3])) {
//       let questions = values[3];
//       let data4 = [];
//       questions.forEach((values) => {
//         let data = {};
//         data['question_id'] = values.question_id;
//         data['ocr_text'] = values.ocr_text;
//         data['question'] = values.question;
//         data['questions_meta'] = values;
//         data4.push(data);
//       });
//       datas.push({
//         'title': 'CBSE',
//         'slug': '/filter-view/x-boards',
//         'filterType': {'target_course': '10'},
//         'description': 'Watch Free Video Solutions for previous years X Boards Examination',
//         'list': data4
//       });
//     }
//
//     if (!_.isNull(values[4])) {
//       let questions = values[4];
//       let data5 = [];
//       questions.forEach((values) => {
//         let data = {};
//         data['question_id'] = values.question_id;
//         data['ocr_text'] = values.ocr_text;
//         data['question'] = values.question;
//         data['questions_meta'] = values;
//         data5.push(data);
//       });
//       datas.push({
//         'title': 'CBSE',
//         'slug': '/filter-view/xii-boards',
//         'filterType': {'target_course': '12'},
//         'description': 'Watch Free Video Solutions for previous years XII Boards Examination',
//         'list': data5
//       });
//     }
//
//
//     if (!_.isNull(values[5])) {
//       let questions = values[5];
//       let data6 = [];
//       questions.forEach((values) => {
//         let data = {};
//         data['question_id'] = values.question_id;
//         data['ocr_text'] = values.ocr_text;
//         data['question'] = values.question;
//         data['questions_meta'] = values;
//         data6.push(data);
//       });
//       datas.push({
//         'title': 'IIT JEE',
//         'slug': '/filter-view/iit-jee-mains',
//         'filterType': {'target_course': 'JEE MAINS'},
//         'description': 'Watch Free Video Solutions for Questions that will help you prepare for JEE Mains',
//         'list': data6
//       });
//     }
//
//     if (!_.isNull(values[6])) {
//       let questions = values[6];
//       let data7 = [];
//       questions.forEach((values) => {
//         let data = {};
//         data['question_id'] = values.question_id;
//         data['ocr_text'] = values.ocr_text;
//         data['question'] = values.question;
//         data['questions_meta'] = values;
//         data7.push(data);
//       });
//       datas.push({
//         'title': 'IIT JEE',
//         'slug': '/filter-view/iit-jee-advanced',
//         'filterType': {'target_course': 'JEE ADVANCE'},
//         'description': 'Watch Free Video Solutions for Questions that will help you prepare for JEE Advanced',
//         'list': data7
//       });
//     }
//
//     if (!_.isNull(values[7])) {
//       let questions = values[7];
//       let data8 = [];
//       questions.forEach((values) => {
//         let data = {};
//         data['question_id'] = values.question_id;
//         data['ocr_text'] = values.ocr_text;
//         data['question'] = values.question;
//         data['questions_meta'] = values;
//         data8.push(data);
//       });
//       datas.push({
//         'title': 'Trending Videos',
//         'slug': '/filter-view/most-watched',
//         'description': 'Most Watched Videos of Doubtnut',
//         'filterType': {'type': 'most-watched'},
//         'list': data8
//       });
//     }
//
//     let responseData = {
//       "meta": {
//         "code": 200,
//         "success": true,
//         "message": "SUCCESS",
//       },
//       "data": datas
//     }
//     res.status(responseData.meta.code).json(responseData);
//   }).catch((error) => {
//
//     let responseData = {
//       "meta": {
//         "code": 403,
//         "status": false,
//         "message": "ERROR",
//       },
//       "data": null
//     }
//     res.status(responseData.meta.code).json(responseData);
//   });
//
// }
//
//
// function getIntroVideoLink(req, res, next) {
//
//   let responseData = {
//     "meta": {
//       "code": 200,
//       "success": true,
//       "message": "SUCCESS",
//     },
//     "data": Constants.getIntro()
//   }
//   res.status(responseData.meta.code).json(responseData);
//
// }
//
//
// function getNcertClassChapters(req, res, next) {
//   db = req.app.get('db');
//   // let data ={};
//   let ncert = [];
//   let class_chapter_mapping = {};
//   let classes_array;
//   Course.getNcertClass(db.mysql.read).then((result) => {
//     //console.log("class_result");
//     //console.log(result);
//     classes_array = result;
//     let promises = [];
//     for (let i = 0; i < classes_array.length; i++) {
//       let class_index = classes_array[i]['class'];
//       promises.push(Course.getNcertClassChapters(class_index, db.mysql.read));
//     }
//     Promise.all(promises).then((values) => {
//       for (let i = 0; i < values.length; i++) {
//         let obj = {};
//         obj['title'] = classes_array[i]['class'];
//         obj['list'] = _.map(values[i], 'chapter');
//         ncert.push(obj);
//       }
//
//       // data['class_chapter_mapping'] = ncert;
//       let responseData = {
//         "meta": {
//           "code": 200,
//           "success": true,
//           "message": "SUCCESS",
//         },
//         "data": ncert
//       }
//       res.status(responseData.meta.code).json(responseData);
//     }).catch(error => {
//       let responseData = {
//         "meta": {
//           "code": 403,
//           "success": false,
//           "message": "ERROR",
//         },
//         "data": null
//       }
//       res.status(responseData.meta.code).json(responseData);
//     });
//   }).catch(err => {
//     let responseData = {
//       "meta": {
//         "code": 403,
//         "success": false,
//         "message": "ERROR",
//       },
//       "data": null
//     }
//     res.status(responseData.meta.code).json(responseData);
//   });
//
//
// }
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
   let users = await getRandomNumber()
   
   let responseData = {
     "meta": {
       "code": 200,
       "success": true,
       "message": "SUCCESS",
     },
     "data": [{"playlist_id":"VIRAL","list":resolvedPromises, "active_users": users}]
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

async function getRandomNumber(){
   return Math.floor(Math.random()*(10000-2000+1)+2000 );
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

   let resolvedPromises = await QuestionContainer.getViralVideoByForFeedLocalisationV4(version, limit,page, db)
   if(resolvedPromises.length > 0){
     for(let i = 0;i<resolvedPromises.length; i++){
        if(resolvedPromises[i]['matched_question'] == null){
          resolvedPromises[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + resolvedPromises[i]['question_id'] + ".png"
        }else{
          resolvedPromises[i]['question_thumbnail'] = config.blob_url + "q-thumbnail/" + resolvedPromises[i]['matched_question'] + ".png"
        }
        let likesViewRes = await QuestionContainer.getTotalViewsWeb(resolvedPromises[i].question_id, db)
				resolvedPromises[i]['tot_likes'] = Math.floor(likesViewRes[1][0].total_likes)
				resolvedPromises[i]['tot_count'] = Math.floor(likesViewRes[0][0].total_count)
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
module.exports = {feed, feedWeb}










