/**
 * @Author: Meghna Gupta
 * @Date:   2020-01-05
 * @Email:  meghna.gupta@doubtnut.com
 * @Last modified by: Meghna Gupta
 * @Last modified date: 2020-01-05
 */

"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const Database = require(__dirname+'/../../api_server/config/database');
const sendgrid = require("sendgrid")(config.send_grid_key);
const helper = require('sendgrid').mail;
const mysql = new Database(config.mysql_analytics);
const fs = require("fs");
const { Parser } = require('json2csv');
const fields = ['Version', 'Match_Rate', 'Questions_Asked'];
const JSONparser = new Parser({fields});

function getMatchRate() {
  let sql = "SELECT q,count(a.question_id),(sum(a.matched_app_questions*100)/count(a.question_id)) as match_rate from (SELECT question as q,question_id ,matched_app_questions FROM `questions` where timestamp>=CURRENT_DATE and hour(timestamp)=(hour(CURRENT_TIMESTAMP)-1) and doubt not like 'web' and doubt not like 'whatsapp' and student_id>100) as a GROUP by q having count(a.question_id)>20 order by count(a.question_id) desc";
  return mysql.query(sql);
}

function getDate() {
  var utc = Date.now();
  let date_ob = new Date(utc + 19800000);
  console.log('date obj: ', date_ob);
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let prevHour = hours - 1;
  let subject = '';
  if(hours === 0) {
    date_ob.setDate(date_ob.getDate() - 1);
    date = ("0" + date_ob.getDate()).slice(-2);
    month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    year = date_ob.getFullYear();
    prevHour = 23;
  } 
  subject = `${year}-${month}-${date} Hour: ${prevHour} to ${hours}`;
  return subject;
}

function sendTheMail(sendgrid, toMail, csvName, helper) {
  let from_email = new helper.Email("autobot@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Hourly Match Rate - Version wise";
  let content = new helper.Content("text/plain", "PFA");
  var attachment = new helper.Attachment();
  var file = fs.readFileSync(csvName);
  var base64File = new Buffer(file).toString('base64');
  attachment.setContent(base64File);
  attachment.setType('text/csv');
  attachment.setFilename(csvName);
  attachment.setDisposition('attachment');
  let mail = new helper.Mail(from_email, subject, to_email, content);
  mail.addAttachment(attachment);
  var sg = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  }); 
  sendgrid.API(sg, function (error, response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
    fs.unlinkSync(`./${csvName}`);
    process.exit(0);
  })
}

function createCsv(data) {
  const csv = JSONparser.parse(data);
  const csvName = getDate() + '.csv';

  fs.writeFile(csvName, csv, 'utf8', function (err) {
    if (err) {
      console.error('Some error occured - file either not saved or corrupted file saved.');
      process.exit(1);
    } else {
      console.log('match rate csv saved!');
      sendTheMail(sendgrid, "tech-alerts@doubtnut.com", csvName, helper)
      // sendTheMail(sendgrid, "meghna.gupta@doubtnut.com", csvName, helper)
    }
  })
}

async function main() {
    try {
      let csvData = [];
      let data;
      let hourlyData = await getMatchRate();
      hourlyData.forEach( (row) => {
        data = {};
        data.Version = row.q;
        data.Match_Rate = row.match_rate;
        data.Questions_Asked = row['count(a.question_id)'];

        csvData.push(data);
      });
       await createCsv(csvData);
    } catch (error) {
        console.error(`Error occured while running hourly match rate script: ${error}`);
    }
}

main();