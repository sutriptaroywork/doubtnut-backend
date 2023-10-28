"use strict";
let db;
let _ = require('lodash');
const Home = require('../../../modules/home')
const HomeContainer = require('../../../modules/containers/homeget')
const Constants = require('../../../modules/constants')
const Course = require('../../../modules/course')
const Question = require('../../../modules/question')
const Utility = require('../../../modules/utility')
const QuestionContainer = require('../../../modules/containers/question')


function homePage(req, res, next) {
  db = req.app.get('db');
  let database = db.mysql.read;
  let student_id = 98;
  let datas = [];
  let promises = [];
  promises.push(HomeContainer.getNcertBrowseQuestions(db));
  promises.push(HomeContainer.getRDsharmaBrowseQuestions(db));
  promises.push(HomeContainer.getCbseQuestions(db));
  promises.push(HomeContainer.getCengageBrowseQuestions(db));
  promises.push(HomeContainer.getTenthBoardsBrowseQuestions(db));
  promises.push(HomeContainer.getBoardsBrowseQuestions(db));
  promises.push(HomeContainer.getJeeMainsQuestions(db));
  promises.push(HomeContainer.getJeeAdvancedBrowseQuestions(db));
  promises.push(HomeContainer.getMostWatchedQuestions(db));
  Promise.all(promises).then(function (values) {


    if (!_.isNull(values[0])) {
      let questions = values[0];
      let data1 = [];
      questions.forEach((values) => {
        let data = {};
        data['question_id'] = values.question_id;
        data['ocr_text'] = values.ocr_text;
        data['question'] = values.question;
        data['questions_meta'] = values;
        data1.push(data);
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
        let data = {};
        data['question_id'] = values.question_id;
        data['ocr_text'] = values.ocr_text;
        data['question'] = values.question;
        data['questions_meta'] = values;
        data2.push(data);
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
        let data = {};
        data['question_id'] = values.question_id;
        data['ocr_text'] = values.ocr_text;
        data['question'] = values.question;
        data['class_id'] = values.class_id;
        data['chapter_id'] = values.chapter_id;
        data['questions_meta'] = values;
        data3.push(data);
      });
      datas.push({
        'title': 'CBSE MATHS',
        'slug': '/filter-view/cbse',
        'filterType': {'package': 'CBSE'},
        'description': 'Get here CBSE Class 10 and Class 12 Boards related news',
        'list': data3
      });
    }

    if (!_.isNull(values[3])) {
      let questions = values[3];
      let data4 = [];
      questions.forEach((values) => {
        let data = {};
        data['question_id'] = values.question_id;
        data['ocr_text'] = values.ocr_text;
        data['question'] = values.question;
        data['questions_meta'] = values;
        data4.push(data);
      });
      datas.push({
        'title': 'CENGAGE MATHS',
        'slug': '/filter-view/cengage',
        'filterType': {'package': 'CENGAGE'},
        'description': 'Watch Free Video Solutions for all questions from every module of CENGAGE Maths',
        'list': data4
      });
    }


    if (!_.isNull(values[4])) {
      let questions = values[4];
      let data5 = [];
      questions.forEach((values) => {
        let data = {};
        data['question_id'] = values.question_id;
        data['ocr_text'] = values.ocr_text;
        data['question'] = values.question;
        data['questions_meta'] = values;
        data5.push(data);
      });
      datas.push({
        'title': 'CBSE',
        'slug': '/filter-view/x-boards',
        'filterType': {'target_course': '10'},
        'description': 'Watch Free Video Solutions for previous years X Boards Examination',
        'list': data5
      });
    }

    if (!_.isNull(values[5])) {
      let questions = values[5];
      let data6 = [];
      questions.forEach((values) => {
        let data = {};
        data['question_id'] = values.question_id;
        data['ocr_text'] = values.ocr_text;
        data['question'] = values.question;
        data['questions_meta'] = values;
        data6.push(data);
      });
      datas.push({
        'title': 'CBSE',
        'slug': '/filter-view/xii-boards',
        'filterType': {'target_course': '12'},
        'description': 'Watch Free Video Solutions for previous years XII Boards Examination',
        'list': data6
      });
    }


    if (!_.isNull(values[6])) {
      let questions = values[6];
      let data7 = [];
      questions.forEach((values) => {
        let data = {};
        data['question_id'] = values.question_id;
        data['ocr_text'] = values.ocr_text;
        data['question'] = values.question;
        data['questions_meta'] = values;
        data7.push(data);
      });
      datas.push({
        'title': 'IIT JEE',
        'slug': '/filter-view/iit-jee-mains',
        'filterType': {'target_course': 'JEE MAINS'},
        'description': 'Watch Free Video Solutions for Questions that will help you prepare for JEE Mains',
        'list': data7
      });
    }

    if (!_.isNull(values[7])) {
      let questions = values[7];
      let data8 = [];
      questions.forEach((values) => {
        let data = {};
        data['question_id'] = values.question_id;
        data['ocr_text'] = values.ocr_text;
        data['question'] = values.question;
        data['questions_meta'] = values;
        data8.push(data);
      });
      datas.push({
        'title': 'IIT JEE',
        'slug': '/filter-view/iit-jee-advanced',
        'filterType': {'target_course': 'JEE ADVANCE'},
        'description': 'Watch Free Video Solutions for Questions that will help you prepare for JEE Advanced',
        'list': data8
      });
    }

    if (!_.isNull(values[8])) {
      let questions = values[8];
      let data9 = [];
      questions.forEach((values) => {
        let data = {};
        data['question_id'] = values.question_id;
        data['ocr_text'] = values.ocr_text;
        data['question'] = values.question;
        data['questions_meta'] = values;
        data9.push(data);
      });
      datas.push({
        'title': 'Trending Videos',
        'slug': '/filter-view/most-watched',
        'description': 'Most Watched Videos of Doubtnut',
        'filterType': {'type': 'most-watched'},
        'list': data9
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
    //console.log(error)
    next(error)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "status": false,
    //     "message": "ERROR",
    //   },
    //   "data": null
    // }
    // res.status(responseData.meta.code).json(responseData);
  });

}


function getIntroVideoLink(req, res, next) {

  let responseData = {
    "meta": {
      "code": 200,
      "success": true,
      "message": "SUCCESS",
    },
    "data": Constants.getIntro()
  }
  res.status(responseData.meta.code).json(responseData);

}


function getNcertClassChapters(req, res, next) {
  db = req.app.get('db');
  // let data ={};
  let ncert = [];
  let class_chapter_mapping = {};
  let classes_array;
  Course.getNcertClass(db.mysql.read).then((result) => {
    //console.log("class_result");
    //console.log(result);
    classes_array = result;
    let promises = [];
    for (let i = 0; i < classes_array.length; i++) {
      let class_index = classes_array[i]['class'];
      promises.push(Course.getNcertClassChapters(class_index, db.mysql.read));
    }
    Promise.all(promises).then((values) => {
      for (let i = 0; i < values.length; i++) {
        let obj = {};
        obj['title'] = classes_array[i]['class'];
        obj['list'] = _.map(values[i], 'chapter');
        ncert.push(obj);
      }

      // data['class_chapter_mapping'] = ncert;
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS",
        },
        "data": ncert
      }
      res.status(responseData.meta.code).json(responseData);
    }).catch(error => {
      let responseData = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "ERROR",
        },
        "data": null
      }
      res.status(responseData.meta.code).json(responseData);
    });
  }).catch(err => {
    next(err)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "ERROR",
    //   },
    //   "data": null
    // }
    // res.status(responseData.meta.code).json(responseData);
  });


}
async function feed(req,res,next){
  db = req.app.get('db')
  let config = req.app.get('config')
  let page = req.params.page
  let limit = 5
  // let promises = []
  //base + (actual views * 10)
 try{

   let resolvedPromises = await QuestionContainer.getViralVideoByForFeed(limit,page, db)
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
       resolvedPromises[i]['total_views'] = Utility.getViews(resolvedPromises[i]['total_views'])
       delete resolvedPromises[i]['old_views']
       delete resolvedPromises[i]['new_views']
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

module.exports = {homePage, getIntroVideoLink, getNcertClassChapters,feed}










