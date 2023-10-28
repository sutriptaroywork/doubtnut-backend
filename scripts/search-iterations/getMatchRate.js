/**
 * @Author: Meghna Gupta
 * @Date:   2020-01-02
 * @Email:  meghna.gupta@doubtnut.com
 * @Last modified by: Meghna Gupta
 * @Last modified date: 2020-01-02
 */

"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const Database = require(__dirname+'/../../api_server/config/database');
const sendgrid = require("sendgrid")(config.send_grid_key);
const helper = require('sendgrid').mail;
const mysql = new Database(config.mysql_analytics);
const redis = require('redis');
const UtilityModule = require(__dirname+'/../../api_server/modules/utility');
const QuestionHelper = require(__dirname+'/../../api_server/server/helpers/question.helper')
const fs = require("fs");
const fuzz = require('fuzzball');
const _ = require('lodash')
// const { Kinesis } = require('aws-sdk');
// const kinesisClient = new Kinesis({
//   accessKeyId: config.aws_access_id,
//   secretAccessKey: config.aws_secret,
//   region: config.aws_region,
// });
const readMysql = new Database(config.mysql_analytics);
const redisClientRead = redis.createClient(config.redis);
const redisClientWrite = redisClientRead;
const db = {};
db.mysql = {};
db.redis = {};
db.mysql.read = readMysql;
db.redis.read = redisClientRead;
db.redis.write = redisClientWrite;
const { Parser } = require('json2csv');
// const fields = ['question_id', 'top_match', 'matches_v41', 'matches_v51','match_index_v51'];
const fields = ['question_id', 'top_match', 'top3_match', 'top20_match']
const JSONparser = new Parser({fields});
let errorCount = 0;

function getQuestionInfo(){
    let sql ="SELECT question_id, ocr_text, locale, matched_question, is_trial FROM `questions` WHERE `allocated_to` IN ('10401', '10402', '10403') and matched_question is not null  and student_id>100 AND DATE(timestamp) < DATE(NOW()) ORDER BY `questions`.`student_id` DESC LIMIT 10000";
	return mysql.query(sql);
}

async function elasticSearchWrapperForv51(data) {
  try {
      const ocr = data.ocr_text;
      const languages_obj = {
        bn:"bengali",
        en:"english",
        gu:"gujarati",
        hi:"hindi",
        kn:"kannada",
        ml:"malayalam",
        mr:"marathi",
        ne:"nepali",
        pa:"punjabi",
        ta:"Tamil",
        te:"Telugu",
        ur:"Urdu"
      }
      const st_lang_code = data.locale;
      let language = languages_obj[st_lang_code];
      if (typeof language === 'undefined') {
          language = 'english';
      }

      let matchesArray;

      /////////////// in case flagr is not working

    let variantAttachment = {
      "apiUrl": "/api/vexp/search",
      "isTextAnswered": true,
      "searchImplVersion": "v5.6",
      "suggestionCount": 40
    }
      ////////////////////////////////////////

      if (!variantAttachment) {
        console.error(`Error occured while querying Flagr`);
        process.exit(1);
      } else {
        console.log('using service search');
        variantAttachment.ocrText = ocr;
        variantAttachment.ocrType = data.is_trial;
        let result;
        matchesArray = await QuestionHelper.callSearchServiceForv3(variantAttachment);
        // matchesArray = QuestionHelper.handleSearchServiceResponse(result);
      }
      const response = _.get(matchesArray, 'hits.hits', 'notFound');
      if (response == 'notFound') {
          console.error(`Error in mapping SS response`);
          errorCount++;
          return;
      }
      let stringDiffResp;
      if (variantAttachment && variantAttachment.isReorderSuggestions) {
          stringDiffResp = UtilityModule.stringDiffImplementWithKey(matchesArray.hits.hits, ocr, fuzz, 'ocr_text', language, true);
      } else {
          stringDiffResp = UtilityModule.stringDiffImplementWithKey(matchesArray.hits.hits, ocr, fuzz, 'ocr_text', language, false);
      }
      // const version = (variantAttachment && variantAttachment.searchImplVersion) ? variantAttachment.searchImplVersion : 'v0';
    //   const searchedOcr = (matchesArray && matchesArray.query_ocr_text) ? matchesArray.query_ocr_text : ocr;
      return stringDiffResp[0];
  } catch (err) {
      console.error(`Error occured while using elastic search wrapper in script: ${err}`);
      errorCount++;
      return;
  }
}

async function elasticSearchWrapperForv41(data) {
  try {
      const ocr = data.ocr_text;
      const languages_obj = {
        bn:"bengali",
        en:"english",
        gu:"gujarati",
        hi:"hindi",
        kn:"kannada",
        ml:"malayalam",
        mr:"marathi",
        ne:"nepali",
        pa:"punjabi",
        ta:"Tamil",
        te:"Telugu",
        ur:"Urdu"
      }
      const st_lang_code = data.locale;
      let language = languages_obj[st_lang_code];
      if (typeof language === 'undefined') {
          language = 'english';
      }

      let matchesArray;

      /////////////// in case flagr is not working

    let variantAttachment = 
    {
        "apiUrl": "/api/vexp/search",
        "elasticIndexName": "question_bank_tokens_limit",
        "isReorderSuggestions": true,
        "isTextAnswered": true,
        "searchImplVersion": "v5.5",
        "stockPhrases": [
          "Work done",
          "Prove that",
          "State and prove",
          "State and explain",
          "Write a short note",
          "Find the solution of",
          "Sum of the series",
          "Briefly explain the following",
          "Try Yourself",
          "Choose the correct option",
          "The value of",
          "Find the value of",
          "equal to"
        ],
        "stockWords": [
          "find",
          "evaluate",
          "Example",
          "Hint"
        ],
        "suggestionCount": 20,
        "version": "v5.5"
      }

      ////////////////////////////////////////

      if (!variantAttachment) {
        console.error(`Error occured while querying Flagr`);
        process.exit(1);
      } else {
        console.log('using service search');
        variantAttachment.ocrText = ocr;
        variantAttachment.ocrType = data.is_trial;
        let result;
        result = await QuestionHelper.callSearchServiceForv3(variantAttachment);
        matchesArray = QuestionHelper.handleSearchServiceResponse(result);
      }
      const response = _.get(matchesArray, 'hits.hits', 'notFound');
      if (response == 'notFound') {
          console.error(`Error in mapping SS response`);
          process.exit(1);
      }
      return response;
  } catch (err) {
      console.error(`Error occured while using elastic search wrapper in script: ${err}`);
      process.exit(1);
  }
}

function sendTheMail(sendgrid, toMail, csvName, helper) {
  let from_email = new helper.Email("meghna.gupta@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Version comparison v51 vs v41";
  let content = new helper.Content("text/plain", "Version comparison v51 vs v41");
  var attachment = new helper.Attachment();
  var file = fs.readFileSync(csvName);
  var base64File = new Buffer(file).toString('base64');
  attachment.setContent(base64File);
  attachment.setType('text/csv');
  attachment.setFilename(csvName);
  attachment.setDisposition('attachment');
  let mail = new helper.Mail(from_email, subject, to_email, content);
  mail.addAttachment(attachment);
  var sg = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });  
  sendgrid.API(sg, function (error, response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
    process.exit(0);
  })
}

function createCsv(data) {
  const csv = JSONparser.parse(data);
  const csvName = 'QuestionMatchStatsForSSVersion.csv';

  fs.writeFile(csvName, csv, 'utf8', function (err) {
    if (err) {
      console.error('Some error occured - file either not saved or corrupted file saved.');
      process.exit(1);
    } else {
      console.log('question csv saved!');
      sendTheMail(sendgrid, "meghna.gupta@doubtnut.com", csvName, helper)
    }
  })
}

// async function main() {
//   try {
//     let csvData = [];
//     let questionInfo = await getQuestionInfo();
//     for(let i=0; i<=questionInfo.length;i++){
//       console.log(i)
//       const question = questionInfo[i];
//       if(question){
//         const ocrV41 = await elasticSearchWrapperForv41(question);
//         const ocrV51 = await elasticSearchWrapperForv51(question);
//         if(ocrV41 && Array.isArray(ocrV41) && ocrV51 && Array.isArray(ocrV51) && ocrV41.length == 20 && ocrV51.length == 20) {
//           const data = {};
//           data.question_id = question.question_id;
//           data.top_match = question.matched_question;
//           data.match_index_v51 = -1;
//           // creating array here
//           let arrV41 = [];
//           let arrV51 = [];
//           for(let k=0; k<20; k++) {
//             arrV41.push(ocrV41[k]._id);
//             arrV51.push(ocrV51[k]._id);
//             const ques = ocrV51[k]._id;
//             if(ques == question.matched_question) {
//               data.match_index_v51 = k+1;
//               continue;
//             }
//           }
//           /////////
//           data.matches_v41 = arrV41;
//           data.matches_v51 = arrV51;
//           csvData.push(data);
//         }
//       }
//     }
   
//     await createCsv(csvData);
//   } catch (error) {
//       console.error(`Error occured while running script: ${error}`);
//   }
// }

async function main() {
    try {
      let csvData = [];
      let questionInfo = await getQuestionInfo();
      const questionCount = questionInfo.length;
        let topCount = 0;
        let top3Count = 0;
        let top20Count = 0;
      for(let i=0; i<questionCount;i++){
        console.log(i)
        const question = questionInfo[i];
        if(question){
          const ocrV8 = await elasticSearchWrapperForv51(question);
          if(ocrV8 && Array.isArray(ocrV8)) {
            const data = {};
            data.question_id = question.question_id;
            for(let j=0; j<ocrV8.length; j++) {
              const ques = ocrV8[j]._id;
                if(j==0 && ques==question.matched_question) {
                    data.top_match = true;
                    topCount++;
                    top3Count++;
                    top20Count++;
                    continue;
                } else if(j>0 && j<=3 && ques==question.matched_question) {
                    data.top3_match = true;
                    top3Count++;
                    top20Count++;
                    continue;
                } else if(j>3 && j<=20 && ques==question.matched_question) {
                    data.top20_match = true;
                    top20Count++;
                    continue;
                }
            }
            
            
            csvData.push(data);
          }
        }
      }
      console.log('questionCount: ', questionCount);
      console.log('topcount: ', topCount);
      console.log('top3count: ', top3Count);
      console.log('top20count: ', top20Count);
      console.log('error count: ', errorCount);
      await createCsv(csvData);
    } catch (error) {
        console.error(`Error occured while running script: ${error}`);
    }
}

main()