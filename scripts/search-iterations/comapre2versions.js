/**
 * @Author: Meghna Gupta
 * @Date:   2019-12-31
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
const LanguageContainer = require(__dirname+'/../../api_server/modules/containers/language');
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
const readMysql = new Database(config.read_mysql);
// const redisClientRead = redis.createClient(config.redis);
// const redisClientWrite = redisClientRead;
const db = {};
db.mysql = {};
// db.redis = {};
db.mysql.read = readMysql;
// db.redis.read = redisClientRead;
// db.redis.write = redisClientWrite;
const { Parser } = require('json2csv');
const fields = ['question_id'];
const JSONparser = new Parser({fields});


function getQuestionInfo(){
    // let sql = "SELECT question_id, ocr_text, locale, is_trial FROM questions WHERE ocr_done=1 ORDER BY question_id DESC LIMIT 10"
    let sql = "SELECT question_id, ocr_text, locale, is_trial, matched_question  FROM `questions` WHERE `allocated_to` IN ('10401','10402','10403') and matched_question is not null  and student_id>100 ORDER BY `questions`.`question_id`  DESC LIMIT 1000"
	return mysql.query(sql);
}

async function elasticSearchWrapperForv4v5(studentId, data) {
  try {
    // is_trial:1
    // locale:"en"
    // ocr_text:"the value of 'a' for which system of linear equations x+ay+z=1 ax+y+z=1 x+y+az=1 has no solutions\n"
    // question_id:78020355

      const ocr = data.ocr_text;
    //   const languages_arrays = await Promise.all([LanguageContainer.getList(db)]);
      const languages_obj = {
        hi: 'hindi',
        en: 'english',
        bn: 'bengali',
        gu: 'gujarati',
        kn: 'kannada',
        ml: 'malayalam',
        mr: 'marathi',
        ne: 'nepali',
        pa: 'punjabi',
        ta: 'Tamil',
        te: 'Telugu',
        ur: 'Urdu',
    };
      const st_lang_code = data.locale;
      let language = languages_obj[st_lang_code];
      if (typeof language === 'undefined') {
          language = 'english';
      }

      let matchesArray;

      /////////////// in case flagr is not working

      // const variantAttachment = await UtilityModule.getFlagrResponse(kinesisClient, studentId);
      let variantAttachment;
      if(studentId == 10) {
        variantAttachment = 
        {
            "apiUrl": "/api/vexp/search",
            "elasticIndexName": "question_bank_tokens_limit",
            "isReorderSuggestions": true,
            "isTextAnswered": true,
            "searchImplVersion": "v13",
            "suggestionCount": "20",
            "version": "v13"
          }
      } else {
        variantAttachment = {
            "apiUrl": "/api/vexp/search",
            "elasticIndexName": "question_bank_tokens_limit",
            "isReorderSuggestions": true,
            "isTextAnswered": true,
            "searchImplVersion": "v5.5",
            "suggestionCount": 20,
            "version": "v5.5"
          }
        }
      ////////////////////////////////////////

      if (!variantAttachment) {
        console.error(`Error occured while querying Flagr`);
        return null;
        // process.exit(1);
      } else {
        console.log('using service search');
        variantAttachment.ocrText = ocr;
        variantAttachment.ocrType = data.is_trial;
        data = await QuestionHelper.callSearchServiceForv3(variantAttachment, true);
        matchesArray = QuestionHelper.handleSearchServiceResponse(data);
      }
      const response = _.get(matchesArray, 'hits.hits', 'notFound');
      if (response == 'notFound') {
          console.error(`Error in mapping SS response`);
          return null;
        //   process.exit(1);
      }
      // let stringDiffResp;
      // if (variantAttachment && variantAttachment.isReorderSuggestions) {
      //     stringDiffResp = UtilityModule.stringDiffImplementWithKey(matchesArray.hits.hits, ocr, fuzz, 'ocr_text', language, true);
      // } else {
        let stringDiffResp = UtilityModule.stringDiffImplementWithKey(matchesArray.hits.hits, ocr, fuzz, 'ocr_text', language, true);
      // }
      // const version = (variantAttachment && variantAttachment.searchImplVersion) ? variantAttachment.searchImplVersion : 'v0';
    //   const searchedOcr = (matchesArray && matchesArray.query_ocr_text) ? matchesArray.query_ocr_text : ocr;
      return stringDiffResp[1];
  } catch (err) {
      console.error(`Error occured while using elastic search wrapper in script: ${err}`);
      process.exit(1);
  }
}

function sendTheMail(sendgrid, toMail, csvName, helper) {
  let from_email = new helper.Email("meghna.gupta@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Questions with options";
  let content = new helper.Content("text/plain", "Questions with options");
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
  const csvName = 'QuestionsWithOptions.csv';

  fs.writeFile(csvName, csv, 'utf8', function (err) {
    if (err) {
      console.error('Some error occured - file either not saved or corrupted file saved.');
      process.exit(1);
    } else {
      console.log('question (with options) csv saved!');
      sendTheMail(sendgrid, "meghna.gupta@doubtnut.com", csvName, helper)
    }
  })
}
async function main() {
    try {
      let csvData = [];
      let questionInfo = await getQuestionInfo();
      
      for(let i=0; i<=questionInfo.length;i++){
        const question = questionInfo[i];
        if(question){
          const resp13 = await elasticSearchWrapperForv4v5(10, question);
          const resp55 = await elasticSearchWrapperForv4v5(11, question);
          if(resp13 && resp55 && resp13[0] && resp55[0] && resp13[0] != resp55[0] && resp13[0] == question.matched_question) {

            const data = {};
            data.question_id = question.question_id;
            // data.ocr = question.ocr_text;
            // data.ocrV5 = ocrV5;
            console.log(data);
            csvData.push(data);
          }
        }
      }

      await createCsv(csvData);
    } catch (error) {
        console.error(`Error occured while running script: ${error}`);
    }
}

main()