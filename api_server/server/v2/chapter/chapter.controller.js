"use strict";
const Chapter = require('../../../modules/chapter')
const ChapterContainer = require('../../../modules/containers/chapter')
const LanguageContainer = require('../../../modules/containers/language')
const AppConstants = require('../../../modules/appConstants')
const _ = require('lodash');
let db, config;

function chapterList(req, res, next) {
  db = req.app.get('db');
  let student_class = req.params.student_class;
  let student_course = req.params.student_course;
  let promise = []
  promise.push(AppConstants.getCdnPath(db.mysql.read))
  if (student_class == "11" && student_course == "IIT") {
    //send 12 class chapters
    promise.push(Chapter.getList(db.mysql.read, "11", "IIT"))
    promise.push(Chapter.getList(db.mysql.read, "12", "IIT"))

  } else if (student_class == "12" && student_course == "IIT") {
    //send 11 class chapters
    promise.push(Chapter.getList(db.mysql.read, "12", "IIT"))
    promise.push(Chapter.getList(db.mysql.read, "11", "IIT"))
  } else {
    promise.push(Chapter.getList(db.mysql.read, student_class, student_course))
  }
  Promise.all(promise)
    .then(function (values) {
      //console.log('values')
      //console.log(values)
      let data = {}
      data.cdn_path = values[0][0]['value'] + '/images/'
      if (values[2].length > 0) {
        values[1] = values[1].concat(values[2])
      }
      data.chapter_list = values[1]
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS",
        },
        "data": data
      }
      res.status(responseData.meta.code).json(responseData)
    }).catch(function (error) {
    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong",
    //   },
    //   "data": null,
    //   "error": error
    // }
    // res.status(responseData.meta.code).json(responseData)
    next(error)
  });
}

async function chapterListWithClass(req, res, next) {
  try {
    db = req.app.get('db');
    config = req.app.get('config');
    let student_class = req.params.student_class;
    let student_course = req.params.student_course;
    let promise = [], language = "english"
    //get language string
    let lang = await LanguageContainer.getByCode(req.user.locale, db)
    //console.log("language")
    //console.log(lang)
    if (lang.length > 0) {
      language = lang[0]['language']
    }

    if (student_class == "11" && student_course == "IIT") {
      //send 12 class chapters
      promise.push(ChapterContainer.getListWithClass("11", "IIT", language, db))
      promise.push(ChapterContainer.getListWithClass("12", "IIT", language, db))

    } else if (student_class == "12" && student_course == "IIT") {
      //send 11 class chapters
      promise.push(ChapterContainer.getListWithClass("12", "IIT", language, db))
      promise.push(ChapterContainer.getListWithClass("11", "IIT", language, db))
    } else {
      promise.push(ChapterContainer.getListWithClass(student_class, student_course,language,db))
    }
    Promise.all(promise)
      .then(function (values) {
        //console.log("values")
        //console.log(values)
        let data = {}
        data.cdn_path = config.cdn_url + 'images/'
        if (typeof values[1] !== 'undefined' && values[1].length > 0) {
          values[0] = values[0].concat(values[1])
        }
        data.chapter_list = values[0]
        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS",
          },
          "data": data
        }
        res.status(responseData.meta.code).json(responseData)
      }).catch(function (error) {
      //console.log(error)
      // let responseData = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "Something is wrong",
      //   },
      //   "data": null,
      //   "error": error
      // }
      // res.status(responseData.meta.code).json(responseData)
      next(error)

    });


  } catch (e) {
    //console.log(e)
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }

}

async function chapterDetails(req, res, next) {
  try {
    db = req.app.get('db');
    let config = req.app.get('config');
    let student_class = req.params.student_class;
    let student_course = req.params.student_course;
    let student_chapter = req.params.student_chapter;
    let language = "english"
    let lang = await LanguageContainer.getByCode(req.user.locale, db)
    if (lang.length > 0) {
      language = lang[0]['language']
    }
    let promise = []
    promise.push(ChapterContainer.getDetails(student_class, student_course, student_chapter, language, db))
    promise.push(ChapterContainer.getChapterStats(student_class, student_course, student_chapter, language, db))
    Promise.all(promise)
      .then(function (values) {
        // //console.log('values')
        // //console.log(values)
        let data = {}
        data['subtopics'] = []
        data['stats'] = {}
        if (values[1].length > 0) {
          data['stats'] = values[1][0]
        }
        let groupedData = _.groupBy(values[0], "subtopic")
        // //console.log(_.groupBy(values[0], "subtopic"))
        for (let i in groupedData) {
          let r = {}
          r['microconcepts'] = groupedData[i]
          r['subtopic'] = i
          data['subtopics'].push(r)
        }
        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS",
          },
          "data": data
        }
        res.status(responseData.meta.code).json(responseData)
      }).catch(function (error) {
      //console.log(error)
      // let responseData = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "Something is wrong",
      //   },
      //   "data": null,
      //   "error": error
      // }
      // res.status(responseData.meta.code).json(responseData);
      next(error)

    })
  } catch (e) {
    //console.log(e)
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }

}

async function subtopicDetails (req,res,next){
  try{
    db = req.app.get('db');
    let config = req.app.get('config');
    let student_class = req.params.student_class;
    let student_course = req.params.student_course;
    let student_chapter = req.params.student_chapter;
    let student_subtopic = req.params.subtopic;
    let language = "english"
    let lang = await LanguageContainer.getByCode(req.user.locale, db)
    if (lang.length > 0) {
      language = lang[0]['language']
    }
    let subtopicDetails = await ChapterContainer.getSubtopicDetails(student_class, student_course, student_chapter,student_subtopic, language, db)
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Subtopic details",
      },
      "data": subtopicDetails
    }
    res.status(responseData.meta.code).json(responseData);  }
    catch(e){
    next(e)
  }
}


module.exports = {chapterList, chapterListWithClass, chapterDetails,subtopicDetails};

