"use strict";
const Question = require('../../../modules/question')
const Student = require('../../../modules/student')
const Playlist = require('../../../modules/playlist')
const PlaylistContainer = require('../../../modules/containers/playlist')
const LanguageContainer = require('../../../modules/containers/language')
const Token = require('../../../modules/tokenAuth')
const _ = require('lodash');
// const validator = require('validator')
// const request = require("request")
let db, config, client

const ChapterContainer = require('../../../modules/containers/chapter')








async function getNcertChapterList(req, res, next) {
  db = req.app.get('db')
  let class1 = req.params.class
  let language = "english"
  let lang = await LanguageContainer.getByCode(req.user.locale,db)
  //console.log("language")
  //console.log(lang)
  if(lang.length > 0) {
    language = lang[0]['language']
  }
  if(class1 == "14"){
    class1 = "10"
  }
  Playlist.getNcertChapterListWithLanguage(class1,language, db.mysql.read)
    .then(result => {
      let responseData1 = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": result
      }
      res.status(responseData1.meta.code).json(responseData1)
    }).catch(error => {
    next(error)

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error in fetching ncert classes"
    //   },
    //   "error": error
    // }
    // res.status(responseData1.meta.code).json(responseData1)
  })
}


async function getNcertChapterListWeb(req, res, next) {
  db = req.app.get('db')
  let sclass = req.params.class
  let language = "english"
  let promises = [];
  // let lang = await LanguageContainer.getByCode(req.user.locale,db)
  // //console.log("language")
  // //console.log(lang)
  // if(lang.length > 0) {
  //   language = lang[0]['language']
  // }
  // Playlist.getNcertChapterList(class1, db.mysql.read)
  let course = "NCERT";
  promises.push(ChapterContainer.getDistinctChapterLocalised('', 'v3', course, sclass, db))
  Promise.all(promises)
    .then(result => {
      let responseData1 = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": result[0]
      }
      res.status(responseData1.meta.code).json(responseData1)
    }).catch(error => {
    next(error)

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error in fetching ncert classes"
    //   },
    //   "error": error
    // }
    // res.status(responseData1.meta.code).json(responseData1)
  })
}




module.exports = {
  getNcertChapterList, getNcertChapterListWeb
}
