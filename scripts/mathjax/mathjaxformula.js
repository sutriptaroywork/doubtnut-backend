"use strict";
//const MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017";

const database = require('./database');

const con = {
  host: "35.154.38.157",
  user: "doubtnut",
  password: "Iamlegend123king",
  database: "classzoo1"
}

const vision = require('@google-cloud/vision');

const mysql = new database(con);
const cdn_url = "https://d10lpgp6xz60nq.cloudfront.net/formulas/"
const _ = require('lodash')
const request = require('request')

const mjpage = require('./mathjax-node-page').mjpage;
var mjpageconfig = {
    format: ["TeX"], // determines type of pre-processors to run
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
  init(mysql)
async function init(mysql){
  console.log("init")
	//let sql = "SELECT * FROM `questions` where matched_question is null  and is_answered=1"
	let sql = "SELECT * FROM formula_formulas"
  let data = await mysql.query(sql)
        let a = _.clone(data)
        console.log(a);

       // wrapper(a,mjpageconfig,mjnodeconfig1)
}



    function wrapper(arr,mjpageconfig,mjnodeconfig1){
      console.log(arr.length)
      if (arr.length == 0) {
            mysql.close()
            process.exit()
      }
      let formula = arr[0]
      //console.log(question)
      let formula_id = formula.id
      console.log("Processing " + formula_id)
      let inputtext = ""
      let formulatext = formula.formula_text
      //let formulasplit = _.split(formulatext,'/assets/')
      //let formulaonlytext = _.split(formulasplit[1],'.svg"')
      //let formulaImage = formulaonlytext[0]
      //let formulaImageCdnUrl = cdn_url+formulaImage+'.png'
      let formulasplit = _.split(formulatext,'alt="')
      let formulaonlytext = _.split(formulasplit[1],'"')
      inputtext = '\\('+formulaonlytext[0]+'\\)'


         // visionApi(formulaImageCdnUrl).then(function(response){
         //   console.log("ss")
         //   console.log(response[0]['textAnnotations'][0]['description'])

         // })
        // mathpixOcr(formulaImageCdnUrl).then(function(response){
           //console.log('ss')
           //console.log(response)
         //})
      //let latex = await mathpixOcr(formulaImageCdnUrl)
     // console.log(visionApiResp)
      //console.log(formulaImageCdnUrl)
      //mathpixOcrForService(formulaonlytext[0]).then( response =>{
        //console.log(response)
      //})
      mjpage(inputtext, mjpageconfig, mjnodeconfig1, response => {
          if (response == false) {
            console.log("ERROR FOUND INSERTING 'FALSE' IN HTML")
          }
          arr.splice(0,1)
          //console.log(arr)
          let insertData = {}
          insertData.formula_id = formula_id
          insertData.html = removefontface(response)
          // let sql2 = "INSERT INTO questions_mathjaxhtml SET ?"
          // let insert =  mysql.query(sql2,[insertData]).then( (res)=> {
          //   console.log("Inserted")
          //   return wrapper(arr,mjpageconfig,mjnodeconfig1)
          // })
          //console.log(insertData.html)
          // return wrapper(arr,mjpageconfig,mjnodeconfig1)
          let sql3 = "Select * From formulas WHERE id = ? "
          mysql.query(sql3,[formula_id]).then((data)=> {
            if (data.length > 0) {
              console.log("Found "+formula_id)
              console.log("updating")
              let sql2 = "UPDATE formulas SET html = ?,ocr = ? WHERE id = ?"
              let insert =  mysql.query(sql2,[insertData.html,inputtext,insertData.formula_id]).then( (res)=> {
                console.log("Updated")

                return wrapper(arr,mjpageconfig,mjnodeconfig1)
              })
            }else{
              // console.log("Not Found " + formula_id)
              // console.log("INSERTING")
              // let sql2 = "INSERT INTO formulas SET ?"
              // let insert =  mysql.query(sql2,[insertData]).then( (res)=> {
              //   console.log("Inserted")
              //   return wrapper(arr,mjpageconfig,mjnodeconfig1)
              // })
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
function visionApi(url) {
    console.log(url)
    let client = new vision.ImageAnnotatorClient();
    return client.documentTextDetection(url)
  }
  function mathpixOcr(fileName) {
    // let url = host + "/static/uploadsloads/" + fileName
    console.log(fileName)
    let url = fileName
    console.log("check file address");
    console.log(url)
    let options = {
      method: 'POST',
      uri: 'https://api.mathpix.com/v3/latex',
      body: {
        'url': url,
        'formats': ['asciimath'],
        'skip_recrop':true
      },
      json: true,
      headers: {
        "app_id": "aditya_doubtnut_com",
        "app_key": "500f7f41d6ef6141251a",
        "Content-Type": "application/json"
      }
    }
    return new Promise(function (resolve, reject) {
      // Do async job
      request(options, function (err, resp, body) {
        if (err) {
          reject(err)
        } else {
          console.log(body)
          resolve(body)
        }
      })
    })
  }
