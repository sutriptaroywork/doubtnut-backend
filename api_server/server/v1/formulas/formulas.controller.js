"use strict";
let _ = require('lodash');
// const FeedContainer = require('../../../modules/containers/feed')

const FeedContainer = require('../../../modules/containers/feed')
const CommentContainer = require('../../../modules/containers/comment')
const MysqlFeed = require('../../../modules/mysql/feed')
const FeedQuiz = require('../../../modules/mysql/quiz')
const Feed = require('../../../modules/feed')
const redisFeed = require("../../../modules/redis/feed")
const Utility = require('../../../modules/utility')
const Notification = require('../../../modules/notifications')
const moment = require('moment');
const Formulas = require('../../../modules/mysql/formulas')
require('../../../modules/mongo/comment')
require('../../../modules/mongo/post')
const bluebird = require("bluebird");
const mongoose = require("mongoose");
bluebird.promisifyAll(mongoose);

const Comment = mongoose.model("Comment");
const Post = mongoose.model("Post");
let config, db

async function home(req,res,next){
  try{
    let db = req.app.get('db')
    let config = req.app.get('config')

    let subjects  = await Formulas.getSubject(db.mysql.read)
    let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data": subjects
            }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}

async function chapters(req,res,next){
  try{
    let db = req.app.get('db')
    let config = req.app.get('config')
    let subject_id = req.params['subjectId']
    let query = req.query['search']
    let superchapters = await Formulas.getSuperChapterBySubject(db.mysql.read,subject_id)
    let superChapterIdArray = _.keys(_.groupBy(superchapters,'id'))
    let chapters = await Formulas.getChaptersBySuperChapterIds(db.mysql.read,superChapterIdArray,subject_id)
    let chaptersGroupBySuperId =_.groupBy(chapters,'super_chapter_id')
    let  mappedSuperChapters = _.map(superchapters,superchapter =>{
      if (chaptersGroupBySuperId[superchapter.id] && chaptersGroupBySuperId[superchapter.id].length > 0) {
        superchapter.chapters = chaptersGroupBySuperId[superchapter.id]
      }
      return superchapter
    })
     if (query) {
      mappedSuperChapters = _.filter(mappedSuperChapters,superchapter =>{
        if (superchapter.name.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
          return 1
        }else{
           superchapter.chapters = _.filter(superchapter.chapters,chapter =>{
             if (chapter.name.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
                return 1
            }
           })
          if (superchapter.chapters.length > 0) {
            return 1
          }
        }
      })
     }
    let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data": mappedSuperChapters
            }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}
async function formulas(req,res,next){
  try{
    let db = req.app.get('db')
    let config = req.app.get('config')
    let chapter_id = req.params['chapterId']
    let query = req.query['search']
    let topics = await Formulas.getTopicsByChapterId(db.mysql.read,chapter_id)
    let topic_ids_array = _.keys(_.groupBy(topics,'id'))
    let formulas = await Formulas.getFormulasByTopics(db.mysql.read,topic_ids_array,chapter_id)
    let formulas_ids_array = _.keys(_.groupBy(formulas,'id'))
    let formula_constants = await Formulas.getFormulasConstantByFormulasIds(db.mysql.read,formulas_ids_array)
    let formula_legends = await Formulas.getFormulaslegendsByFormulasIds(db.mysql.read,formulas_ids_array)
    let formula_constants_grouped = _.groupBy(formula_constants,'formula_id')
    let formula_legends_grouped = _.groupBy(formula_legends,'formula_id')
    let mappedFormulas = _.map(formulas,formula =>{
        formula.constants = formula_constants_grouped[formula.id]
        formula.legends = formula_legends_grouped[formula.id]
        return formula
    })
    let formula_grouped = _.groupBy(mappedFormulas,'topic_id')
    let mappedtopics = _.map(topics,topic =>{
      topic.formulas = formula_grouped[topic.id]
      return topic
    })
    if (query) {
      mappedtopics = _.filter(mappedtopics,topic =>{
        if (topic.name.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
          return 1
        }else{
           topic.formulas = _.filter(topic.formulas,formula =>{
             if (formula.name.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
                return 1
            }
           })
          if (topic.formulas.length > 0) {
            return 1
          }
        }
      })
    }
    let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data": mappedtopics
            }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}
async function getCheatsheets(req,res,next){
  try{
    let db = req.app.get('db')
    let config = req.app.get('config')
    let cheatsheets = await Formulas.getCheatsheets(db.mysql.read)
    let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data": cheatsheets
            }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}

async function createCheatsheet(req,res,next){
  try{
    let db = req.app.get('db')
    let config = req.app.get('config')
    let cheatsheet_name = req.body.name
    let createCheatsheet = await Formulas.insertCheatsheet
    // let responseData = {
    //           "meta": {
    //             "code": 200,
    //             "success": true,
    //             "message": "SUCCESS!"
    //           },
    //           "data": mappedtopics
    //         }
    // res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}

async function addformulas(req,res,next){
  try{
    let db = req.app.get('db')
    let config = req.app.get('config')
    let chapter_id = req.params['chapterId']
    let query = req.query['search']
    let topics = await Formulas.getTopicsByChapterId(db.mysql.read,chapter_id)
    let topic_ids_array = _.keys(_.groupBy(topics,'id'))
    let formulas = await Formulas.getFormulasByTopics(db.mysql.read,topic_ids_array,chapter_id)
    let formulas_ids_array = _.keys(_.groupBy(formulas,'id'))
    let formula_constants = await Formulas.getFormulasConstantByFormulasIds(db.mysql.read,formulas_ids_array)
    let formula_legends = await Formulas.getFormulaslegendsByFormulasIds(db.mysql.read,formulas_ids_array)
    let formula_constants_grouped = _.groupBy(formula_constants,'formula_id')
    let formula_legends_grouped = _.groupBy(formula_legends,'formula_id')
    let mappedFormulas = _.map(formulas,formula =>{
        formula.constants = formula_constants_grouped[formula.id]
        formula.legends = formula_legends_grouped[formula.id]
        return formula
    })
    let formula_grouped = _.groupBy(mappedFormulas,'topic_id')
    let mappedtopics = _.map(topics,topic =>{
      topic.formulas = formula_grouped[topic.id]
      return topic
    })
    if (query) {
      mappedtopics = _.filter(mappedtopics,topic =>{
        if (topic.name.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
          return 1
        }else{
           topic.formulas = _.filter(topic.formulas,formula =>{
             if (formula.name.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
                return 1
            }
           })
          if (topic.formulas.length > 0) {
            return 1
          }
        }
      })
    }
    let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data": mappedtopics
            }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}

async function globalSearchResult(req,res,next){
  try{
    let db = req.app.get('db')
    let config = req.app.get('config')
    let query = req.params.name
    let formulas=[]
     formulas[0]={}
     formulas[1]={}
     formulas[2]={}

    let formula =  Formulas.getGlobalSearchResultFormula(db.mysql.read,query)
    let topic =  Formulas.getGlobalSearchResultTopic(db.mysql.read,query)
    let chapter =  Formulas.getGlobalSearchResultChapter(db.mysql.read,query)
    formulas[0].formulas = await formula
    formulas[0].search_type = "formulas"
    formulas[1].topics = await topic
    formulas[1].search_type = "topics"
    formulas[2].chapters = await chapter
    formulas[2].search_type = "chapters"

    let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data": formulas
            }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}

async function searchPageFormulas(req,res,next){
try{
    let db = req.app.get('db')
    let config = req.app.get('config')
    let search_type = req.params['type']
    let id = req.params['id']
    let response = []
    if (search_type === 'chapters') {
      response = await Formulas.getFormulasByChapterId(db.mysql.read,id)
    }else if(search_type === 'topics'){
      response = await Formulas.getFormulasByTopicId(db.mysql.read,id)

    }else{
      response = await Formulas.getFormulasById(db.mysql.read,id)
    }

    let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data": response
            }
    res.status(responseData.meta.code).json(responseData);

}catch(e){
  next(e)
}
}

module.exports = {home,chapters,formulas,getCheatsheets,createCheatsheet,addformulas,globalSearchResult,searchPageFormulas};