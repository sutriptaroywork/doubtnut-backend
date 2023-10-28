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
     db = req.app.get('db')
     config = req.app.get('config')
    let subjects  = await Formulas.getSubject(db.mysql.write)
    let cheatSheetElement = {
      name:"Cheatsheet",
      icon_path: config.staticCDN+"images/cheatsheet.webp",
    }
    subjects.push(cheatSheetElement)
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
    db = req.app.get('db')
    config = req.app.get('config')
    let subject_id = req.params['subjectId']
    let query = req.query['search']
    let superchapters = await Formulas.getSuperChapterBySubject(db.mysql.write,subject_id)
    let superChapterIdArray = _.keys(_.groupBy(superchapters,'id'))
    let chapters = await Formulas.getChaptersBySuperChapterIds(db.mysql.write,superChapterIdArray,subject_id)
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
    db = req.app.get('db')
    config = req.app.get('config')
    let chapter_id = req.params['chapterId']
    let query = req.query['search']
    let topics = await Formulas.getTopicsByChapterId(db.mysql.write,chapter_id)
    let topic_ids_array = _.keys(_.groupBy(topics,'id'))
    let formulas = await Formulas.getFormulasByTopics(db.mysql.write,topic_ids_array,chapter_id)
    let formulas_ids_array = _.keys(_.groupBy(formulas,'id'))
    let formula_constants = await Formulas.getFormulasConstantByFormulasIds(db.mysql.write,formulas_ids_array)
    let formula_legends = await Formulas.getFormulaslegendsByFormulasIds(db.mysql.write,formulas_ids_array)
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
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.user.student_id;
    let cheatsheets = await Formulas.getCheatsheets(db.mysql.write,student_id)
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


async function globalSearchResult(req,res,next){
  try{
    db = req.app.get('db')
    config = req.app.get('config')
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
    db = req.app.get('db')
    config = req.app.get('config')
    let search_type = req.params['type']
    let id = req.params['id']
    let response = []
    if (search_type === 'chapters') {
      response = await Formulas.getFormulasByChapterId(db.mysql.write,id)
    }else if(search_type === 'topics'){
      response = await Formulas.getFormulasByTopicId(db.mysql.write,id)
    }else{
      response = await Formulas.getFormulasById(db.mysql.write,id)
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

async function createCheatsheet(req,res,next){
  try{
      db = req.app.get('db')
      config = req.app.get('config')
      let student_id = req.user.student_id;
      let cheatsheet_name = req.body.cheatsheet_name
      let cheatsheet_insert = await Formulas.createCheatsheet(db.mysql.write,cheatsheet_name,student_id)
      let cheatsheet_id = cheatsheet_insert['insertId']
      let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS!"
          },
          "data":cheatsheet_id
        }
      res.status(responseData.meta.code).json(responseData); 
  }catch(e){

  }
}
async function customCheatSheetAdd(req,res,next){
    try{
      db = req.app.get('db')
      config = req.app.get('config')
      let student_id = req.user.student_id;
      let cheatsheet_name = req.body.cheatsheet_name
      let cheatsheet_id = req.body.cheatsheet_id
      let is_edit = req.body.is_edit
      //console.log(req.body.formulas_to_add)
      let formulas_to_add = req.body.formulas_to_add
      let grouped_formulas_add = _.groupBy(formulas_to_add,'search_type')
      let formulas = []
      let cheatsheetRawData =  await Formulas.getCheatsheetById(db.mysql.write,cheatsheet_id)
      if ( cheatsheetRawData.length == 0 || (cheatsheetRawData.length > 0 && !cheatsheetRawData[0].is_generic)) {
        if (is_edit != 1 && cheatsheet_id == 0) {
          let cheatsheet_insert = await Formulas.createCheatsheet(db.mysql.write,cheatsheet_name,student_id)
          cheatsheet_id = cheatsheet_insert['insertId']
        }

        if (grouped_formulas_add['chapters'] && grouped_formulas_add['chapters'].length > 0 ) {
          let chapters_to_add = grouped_formulas_add['chapters']
          let grouped_chapters_to_add = _.groupBy(chapters_to_add,'id')
          let chapter_ids_Array = _.keys(grouped_chapters_to_add)
          let chapter_formulas = await Formulas.getFormulasByChapterIds(db.mysql.read,chapter_ids_Array)
          let seq_added_chapter_formulas = _.map(chapter_formulas,chapter_formula =>{
            let data = {}
            data.formula_id = chapter_formula.id
            data.seq = grouped_chapters_to_add[chapter_formula.chapter_id][0].seq
            data.cheatsheet_id = cheatsheet_id
            return data
          })

          formulas.push(seq_added_chapter_formulas)

        }
        if (grouped_formulas_add['topics'] && grouped_formulas_add['topics'].length > 0 ) {
          let topics_to_add = grouped_formulas_add['topics']
          let grouped_topics_to_add = _.groupBy(topics_to_add,'id')
          let topic_ids_Array = _.keys(grouped_topics_to_add)
          let topic_formulas = await Formulas.getFormulasBytopicIds(db.mysql.read,topic_ids_Array)
          let seq_added_topic_formulas = _.map(topic_formulas,topic_formula =>{
            let data = {}
            data.formula_id = topic_formula.id
            data.seq = grouped_topics_to_add[topic_formula.topic_id][0].seq
            data.cheatsheet_id = cheatsheet_id
            return data
          })
          formulas.push(seq_added_topic_formulas)
        }

        if (grouped_formulas_add['formulas'] && grouped_formulas_add['formulas'].length > 0 ) {
          let formulas_to_add = grouped_formulas_add['formulas']
          let grouped_formulas_to_add = _.groupBy(formulas_to_add,'id')
          let formula_ids_Array = _.keys(grouped_formulas_to_add)
          let formula_formulas = await Formulas.getFormulasByIds(db.mysql.read,formula_ids_Array)
          let seq_added_formula_formulas = _.map(formula_formulas,formula_formula =>{
            let data = {}
            data.formula_id = formula_formula.id
            data.seq = grouped_formulas_to_add[formula_formula.id][0].seq
            data.cheatsheet_id = cheatsheet_id
            return data
          })
          formulas.push(seq_added_formula_formulas)
        }
        if (formulas.length) {
          let Insert_Formulas_in_CheatSheet = await Formulas.insertFormulasIntoCheatSheet(db.mysql.write,formulas[0])
        }
        let CheatSheetData = await Formulas.getCheatSheetFormulasById(db.mysql.write,cheatsheet_id)
        let responseData = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "SUCCESS!"
            },
            "data":CheatSheetData
          }
        res.status(responseData.meta.code).json(responseData);
      }else{
        let responseData = {
            "meta": {
              "code": 403,
              "success": false,
              "message": "Cant add In Admin Created Cheatsheets!"
            },
            "data":{}
          }
        res.status(responseData.meta.code).json(responseData);
      }
    }catch(e){
      next(e)
    }
}
async function getCheatSheetById(req,res,next){
  try{
    db = req.app.get('db')
    config = req.app.get('config')
    let cheatsheet_id = req.params.id
    let mappedFormulas = []
    let CheatSheetData = await Formulas.getCheatSheetFormulasById(db.mysql.write,cheatsheet_id)
    let formulas_ids_array = _.keys(_.groupBy(CheatSheetData,'formula_id'))
    if (formulas_ids_array.length > 0) {
      let formulas = await Formulas.getFormulasByIds(db.mysql.read,formulas_ids_array)
      let formula_constants = await Formulas.getFormulasConstantByFormulasIds(db.mysql.write,formulas_ids_array)
      let formula_legends = await Formulas.getFormulaslegendsByFormulasIds(db.mysql.write,formulas_ids_array)
      let formula_constants_grouped = _.groupBy(formula_constants,'formula_id')
      let formula_legends_grouped = _.groupBy(formula_legends,'formula_id')
      mappedFormulas = _.map(formulas,formula =>{
          formula.constants = formula_constants_grouped[formula.id]
          formula.legends = formula_legends_grouped[formula.id]
          return formula
      })

    }
    let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS!"
        },
        "data": mappedFormulas
      }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}
module.exports = {home,chapters,formulas,getCheatsheets,globalSearchResult,searchPageFormulas,getCheatSheetById,customCheatSheetAdd,createCheatsheet};