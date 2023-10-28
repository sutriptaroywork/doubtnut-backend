"use strict"
const _ = require('lodash')
var mjAPI = require("mathjax-node");
const database = require('./database');
const fs = require('fs');

const con = {
  host: "latest-production.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "doubtnut",
  password: "Iamlegend123king",
  database: "classzoo1"
}
const mysql = new database(con);

mjAPI.config({
  displayMessages: false,    // determines whether Message.Set() calls are logged
  displayErrors:   true,     // determines whether error messages are shown on the console
  undefinedCharError: false, // determines whether "unknown characters" (i.e., no glyph in the configured fonts) are saved in the error array
  extensions: '',            // a convenience option to add MathJax extensions
  fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
  paths: {},                  // configures custom path variables (e.g., for third party extensions, cf. test/config-third-party-extensions.js)
  MathJax: { 

  }               // standard MathJax configuration options, see https://docs.mathjax.org for more detail.
});
var typeset = {
  ex: 5,                          // ex-size in pixels
  width: 30,                     // width of container (in ex) for linebreaking and tags
  useFontCache: true,             // use <defs> and <use> in svg output?
  useGlobalCache: false,          // use common <defs> for all equations?
  linebreaks: true,              // automatic linebreaking
  equationNumbers: "none",        // automatic equation numbering ("none", "AMS" or "all")
  cjkCharWidth: 13,               // width of CJK character

  math: "",                       // the math string to typeset
  format: "AsciiMath",                  // the input format (TeX, inline-TeX, AsciiMath, or MathML)
  xmlns: "mml",                   // the namespace to use for MathML

  html: true,                    // generate HTML output
  htmlNode: false,                // generate HTML output as jsdom node
  css: true,                     // generate CSS for HTML output
  mml: false,                     // generate MathML output
  mmlNode: false,                 // generate MathML output as jsdom node
  svg: false,                     // generate SVG output
  svgNode: false,                 // generate SVG output as jsdom node

  speakText: false,                // add textual alternative (for TeX/asciimath the input string, for MathML a dummy string)

  state: {},                      // an object to store information from multiple calls (e.g., <defs> if useGlobalCache, counter for equation numbering if equationNumbers ar )
  timeout: 10 * 1000,             // 10 second timeout before restarting MathJax
}



init(mysql)
async function init(mysql){
	let qID = 0
  try{
  	mjAPI.start();

  	console.log("init")
	//let sql = "SELECT * FROM `questions` where matched_question is null  and is_answered=1 AND question_id < 2000"
	let sql = "SELECT * FROM questions where question_id = 331"
  	let data = await mysql.query(sql)
    // console.log(data[i]['image_path'])
    for(let i=0;i<data.length;i++){
      let inputtext = ""
      let question = data[i]
      let question_id = question.question_id
      qID = question_id
  		if (_.includes(question.ocr_text, '<math')) {
  			inputtext = question.question
  		}else{
  			inputtext = question.ocr_text
  		}

     	 console.log(question_id)
      	typeset.math = inputtext
      	let response = await mjAPI.typeset(typeset)
      	let htmlhead = "<html><head><style>"
      	let htmlbody = "</style></head><body>"
      	let htmlfooter = "</body></html>"
      	let html = htmlhead + response.css + htmlbody + response.html + htmlfooter
       	let insertData = {}
      	insertData.question_id = question_id
	    insertData.html = html
	    console.log(response.html)
		//let sql2 = "INSERT INTO questions_mathjaxhtml SET ?"
	    //let insert =  await mysql.query(sql2,[insertData])
	    //console.log(insert)
  	}
    mysql.close()
    process.exit()
  }catch(e){
  		// let insertData = {}
    //   	insertData.question_id = qID
	   //  insertData.error = e
  		// let sql3 = "INSERT INTO questions_mathjaxhtml_error SET ?"
  		// let insert =  await mysql.query(sql2,[insertData])

    console.log(e)
    mysql.close()
    process.exit()
  }
}


async function asciitoMathJaxConverter(mathArray){
	let mathhtmlArray = []
	for(let i=0;i<mathArray.length;i++){
		typeset.math = inputtext
      	let response = await mjAPI.typeset(typeset)
      	mathhtmlArray.push(response)
	}
}

function asciimathjaxspliter(inputtext){
	let inlineascii = inputtext
	let splitedText = _.split(inlineascii,'`')
	let textArray = []
	let mathArray = []
	if (isOdd(splitedText.length)) {
    	for(let i=0;i<splitedText.length;i++){
    		if (isEven(i)) {
    			textArray.push(splitedText(i))
    		}else{
    			mathArray.push(splitedText(i))
    		}
    	}
    	return {textArray:textArray,mathArray:mathArray}
	}else{
		throw.error("Invalid Syntax")
		return;
	}

}
function isEven(n) {
   return n % 2 == 0;
}

function isOdd(n) {
   return Math.abs(n % 2) == 1;
}