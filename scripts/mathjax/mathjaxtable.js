/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-22 16:57:19
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-22 17:53:23
*/

"use strict";
//const MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017";
const dbName = "doubtnut";
const _ = require('lodash')
const bluebird = require("bluebird");
const mjpage = require('./mathjax-node-page').mjpage;

// bluebird.promisifyAll(mjpage);

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
    fontURL: '', // for webfont urls in the CSS for HTML output
    MathJax: {
    } // options MathJax configuration, see https://docs.mathjax.org
}

var mjnodeconfig1 = {
  ex: 5, // ex-size in pixels
  width: 50, // width of math container (in ex) for linebreaking and tags
  // useFontCache: false, // use <defs> and <use> in svg output?
   //useGlobalCache: true, //  use common <defs> for all equations?
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
var mjnodeconfig2 = {
  ex: 6, // ex-size in pixels
  width: 50, // width of math container (in ex) for linebreaking and tags
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
var mjnodeconfig3 = {
  ex: 6, // ex-size in pixels
  width: 70, // width of math container (in ex) for linebreaking and tags
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

const database = require('./database');

const con = {

  host: "latest-production.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",

  user: "doubtnut",

  password: "Iamlegend123king",

  database: "classzoo1"

}

const mysql = new database(con);
// MongoClient.connect(url, {useNewUrlParser: true}, async function (err, client) {
//   if (err) {
//     throw err;
//   }
//   else {
//     const mongo = client.db(dbName);

//   }
// })

  init(mysql)
async function init(mysql){
  console.log("init")
	let sql = "SELECT * FROM `questions` where matched_question is null  and is_answered=1"
	//let sql = "SELECT * FROM questions where question_id = 65791"
  let data = await mysql.query(sql)
        let a = _.clone(data)
        wrapper(a,mjpageconfig,mjnodeconfig1)
    // console.log(data[i]['image_path'])
    // for(let i=0;i<data.length;i++){
   //    let inputtext = ""
   //    let question = data[i]
   //    let question_id = question.question_id
  	// 	if (_.includes(question.ocr_text, '<math')) {
  	// 		inputtext = question.question
  	// 	}else{
  	// 		inputtext = question.ocr_text
  	// 	}
   //    console.log(question_id)
   //    // let response = await mathjaxwrapper(inputtext, mjpageconfig, mjnodeconfig1);
   //     // await Promise.resolve(mathjaxpromise(inputtext, mjpageconfig, mjnodeconfig1))
   //    // let result = await mathjaxpromise(inputtext, mjpageconfig, mjnodeconfig1);
   //    console.log(i)
   //    let insertData = {}
   //    insertData.question_id = question_id
   //    insertData.html = response
   //    //console.log(insertData.question_id)
      // let sql2 = "INSERT INTO questions_mathjaxhtml SET ?"
      // let insert =  await mysql.query(sql2,[insertData])
  	// }
   //            mysql.close()
   //          process.exit()
}

  //  function mathjaxpromise(inputtext, mjpageconfig, mjnodeconfig1){
  //   return new Promise(function(resolve, reject) {
  //     mjpage(inputtext, mjpageconfig, mjnodeconfig1,function(result){
  //         console.log("result")
  //         resolve(result)
  //       })
  //   })
  // }
    // function mathjax(inputtext, mjpageconfig, mjnodeconfig1) {
    //    return new Promise((resolve,reject) => {
    //      mjpage(inputtext, mjpageconfig, mjnodeconfig1, response => {
    //       console.log(response)
    //   });
    // }

    // function mathjax(inputtext, mjpageconfig, mjnodeconfig1,cb) {
    //      mjpage(inputtext, mjpageconfig, mjnodeconfig1, response => {
    //       console.log(response)
    //       cb(response)
    //   });
    // }

    function wrapper(arr,mjpageconfig,mjnodeconfig1){
      console.log(arr.length)
      if (arr.length == 0) {
            mysql.close()
            process.exit()
      }
      let question = arr[0]
      //console.log(question)
      let question_id = question.question_id
      console.log("Processing " + question_id)
      let inputtext = ""
      if (_.includes(question.ocr_text, '<math')) {
         inputtext = question.question
      }else{
         inputtext = question.ocr_text
      }
      mjpage(inputtext, mjpageconfig, mjnodeconfig1, response => {
          if (response == false) {
            console.log("ERROR FOUND INSERTING 'FALSE' IN HTML")
          }
          arr.splice(0,1)
          //console.log(arr)
          let insertData = {}
          insertData.question_id = question_id
          insertData.html = removefontface(response)
          // let sql2 = "INSERT INTO questions_mathjaxhtml SET ?"
          // let insert =  mysql.query(sql2,[insertData]).then( (res)=> {
          //   console.log("Inserted")
          //   return wrapper(arr,mjpageconfig,mjnodeconfig1)
          // })
          //console.log(insertData.html)
          // return wrapper(arr,mjpageconfig,mjnodeconfig1)
          let sql3 = "Select * From questions_mathjaxhtml WHERE question_id = ? "
          mysql.query(sql3,[question_id]).then((data)=> {
            if (data.length > 0) {
              console.log("Found "+question_id)
              console.log("updating")
              let sql2 = "UPDATE questions_mathjaxhtml SET html = ? WHERE question_id = ?"
              let insert =  mysql.query(sql2,[insertData.html,insertData.question_id]).then( (res)=> {
                console.log("Updated")

                return wrapper(arr,mjpageconfig,mjnodeconfig1)
              })
            }else{
              console.log("Not Found " + question_id)
              console.log("INSERTING")
              let sql2 = "INSERT INTO questions_mathjaxhtml SET ?"
              let insert =  mysql.query(sql2,[insertData]).then( (res)=> {
                console.log("Inserted")
                return wrapper(arr,mjpageconfig,mjnodeconfig1)
              })
            }
          })

      });

    }


    function removefontface(response){
      if (response == false) {
        return "false"
      }
      let returnResponse = "CSSSPLITERROR";
      if(!_.includes(response,'@font-face')){
        return response
      }
      let fontfaceStart = ".MJXc-TeX-unknown-R {font-family: monospace; font-style: normal; font-weight: normal}"
      let fontfaceEnd = "@font-face {font-family: MJXc-TeX-vec-Bw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/fonts/HTML-CSS/TeX/eot/MathJax_Vector-Bold.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/fonts/HTML-CSS/TeX/woff/MathJax_Vector-Bold.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/fonts/HTML-CSS/TeX/otf/MathJax_Vector-Bold.otf') format('opentype')}"
      let responseSplit1 = _.split(response,fontfaceStart)
      let responseSplit2 = _.split(response,fontfaceEnd)
      if (responseSplit2.length == 2) {
         returnResponse = responseSplit1[0]+responseSplit2[1]
      }
      return returnResponse
    }
    // function mathjaxwrapper(inputtext, mjpageconfig, mjnodeconfig1) {
    //    return mathjax(inputtext, mjpageconfig, mjnodeconfig1); // await is actually optional here                                // you'd return a Promise either way.
    // }

