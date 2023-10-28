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
const mjpage = require('./mathjax-node-page').mjpage;

require('../../../modules/mongo/comment')
require('../../../modules/mongo/post')
const bluebird = require("bluebird");
const mongoose = require("mongoose");
bluebird.promisifyAll(mongoose);

const Comment = mongoose.model("Comment");
const Post = mongoose.model("Post");
let config, db

async function createHtml(req,res,next){
  try{
    let db = req.app.get('db');
    let question_id = req.params.questionId
    let config = req.app.get('config');
    var mjpageconfig = {
      format: ["AsciiMath"], // determines type of pre-processors to run
      output: 'html', // global override for output option; 'svg', 'html' or 'mml'
      tex: {}, // configuration options for tex pre-processor, cf. lib/tex.js
      ascii: {}, // configuration options for ascii pre-processor, cf. lib/ascii.js
      singleDollars: false, // allow single-dollar delimiter for inline TeX
      fragment: false, // return body.innerHTML instead of full document
      cssInline: true,  // determines whether inline css should be added
      jsdom: {}, // jsdom-related options
      displayMessages: false, // determines whether Message.Set() calls are logged
      displayErrors: false, // determines whether error messages are shown on the console
      undefinedCharError: true, // determines whether unknown characters are saved in the error array
      extensions: '', // a convenience option to add MathJax extensions
      fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
      MathJax: {

      } // options MathJax configuration, see https://docs.mathjax.org
    }

    var mjnodeconfig1 = {
      ex: 5, // ex-size in pixels
      width: 30, // width of math container (in ex) for linebreaking and tags
      // useFontCache: true, // use <defs> and <use> in svg output?
      // useGlobalCache: false, //  use common <defs> for all equations?
      // state: mjstate, // track global state
      linebreaks: true, // do linebreaking?
      equationNumbers: 'none', // or "AMS" or "all"
      math: '', // the math to typeset
      html: true, // generate HTML output?
      css: true, // generate CSS for HTML output?
      mml: false, // generate mml output?
      svg: false, // generate svg output?
      speakText: false, // add spoken annotations to output?
      // timeout: 10 * 1000, // 10 second timeout before restarting MathJax
    }
      let sql = "SELECT * FROM `questions` WHERE question_id = ?"
      let data = await db.mysql.read.query(sql,[question_id])
      //console.log(data)
      if (data.length > 0) {
        let question = data[0]
        let sql1 = "SELECT * FROM questions_mathjaxhtml WHERE question_id = ?"
        let data1 = await db.mysql.read.query(sql1,[question_id])
        let inputtext = ""
         if (_.includes(question.ocr_text, '<math')) {
            inputtext = question.question
          }else{
            inputtext = question.ocr_text
          }
        if (data1.length > 0) {
          mjpage(inputtext, mjpageconfig, mjnodeconfig1,async function(result){
            if (result == false) {
              let responseData = {
              "meta": {
                "code": 403,
                "success": false,
                "message": "OCR INVALID"
              },
              "data": {}
            }
            res.status(responseData.meta.code).json(responseData);
              //throw new Error('ocr_text is invalid');
            }
            let sql2 = "UPDATE questions_mathjaxhtml SET html = ? WHERE question_id = ?"
            let inserthtml = removefontface(result)
            //console.log(inserthtml)
            let update =  await db.mysql.write.query(sql2,[inserthtml,question_id])
            let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data": update
            }
            res.status(responseData.meta.code).json(responseData);
          })
        }else{
          mjpage(inputtext, mjpageconfig, mjnodeconfig1,async function(result){
            if (result == false) {
              let responseData = {
              "meta": {
                "code": 403,
                "success": false,
                "message": "OCR INVALID"
              },
              "data": {}
            }
              //throw new Error('ocr_text is invalid');
            }
            let insertData = {}
            insertData.question_id = question_id
            insertData.html = removefontface(result)
            let sql2 = "INSERT INTO questions_mathjaxhtml SET ?"
            let insert =  await db.mysql.write.query(sql2,[insertData])
            let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data": insert
            }
            res.status(responseData.meta.code).json(responseData);
          })
        }
      }else{
          throw Error('question does not exist');
      }
  }catch(e){
    next(e)
  }
}
    function removefontface(response){
      if (response == false) {
        return "false"
      }

      //console.log(response)
      let returnResponse = "CSSSPLITERROR";
      if(!_.includes(response,'@font-face')){
        return response
      }
      let fontfaceStart = ".MJXc-TeX-unknown-R {font-family: monospace; font-style: normal; font-weight: normal}"
      let fontfaceEnd = '</style><style type="text/css">'
      let responseSplit1 = _.split(response,fontfaceStart)
      let responseSplit2 = _.split(response,fontfaceEnd)
      //console.log(responseSplit2)
      if (responseSplit2.length == 2) {
         returnResponse = responseSplit1[0]+fontfaceEnd+responseSplit2[1]
      }
      return returnResponse
    }
module.exports = {createHtml};