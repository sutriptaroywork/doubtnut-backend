"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
// var sendgrid = require("sendgrid")(config.send_grid_key)
var sendgrid = require("sendgrid")('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')
var helper = require('sendgrid').mail
const moment = require('moment')
const mysql = new database(config.mysql_analytics)
main(mysql)



async function main(){

    let res= await  singleQueryResponse(mysql);
    console.log("response ----- ");
    console.log(res);
    console.log("type of res");
    console.log(typeof res);
    let match_rate = res[0]['match_rate'];
    let q_count = res[0]['question_asked'];
    let m_count = res[0]['matched_questions'];
    let hours = res[0]['hours'];
    
   

    let report = `<!DOCTYPE html>
    <html>
    <head>
    <style>
    table {
      font-family: arial, sans-serif;
      border-collapse: collapse;
      width: 100%;
    }
    
    td, th {
      border: 1px solid #dddddd;
      text-align: left;
      padding: 8px;
    }
    
    tr:nth-child(even) {
      background-color: #dddddd;
    }
    </style>
    </head>
    <body>
    
    <h2>Question Ask Match Summary</h2>
    
    <table>
      <tr>
        <th>Hours</th>
        <th>Questions Asked</th>
        <th>Questions Matched</th>
        <th>Match Rate</th>
       
      </tr>
      <tr>
        <td>${hours}</td>
        <td>${q_count}</td>
        <td>${m_count}</td>
        <td>${match_rate}</td>
      </tr>
      </tr>
    </table>
    
    </body>
    </html>`

    await sendMail(sendgrid,"akshat@doubtnut.com",report,helper)
    await sendMail(sendgrid,"vivek@doubtnut.com",report,helper)
    await sendMail(sendgrid,"aditya@doubtnut.com",report,helper)
    await sendMail(sendgrid,"akanksha@doubtnut.com",report,helper)
    await sendMail(sendgrid,"shalu@doubtnut.com",report,helper)
    console.log("ok")


}


function singleQueryResponse(mysql){
    let sql = "SELECT hour(timestamp) as hours,count(question_id) as question_asked,sum(matched_app_questions) as matched_questions,(sum(matched_app_questions)/count(question_id))*100  as match_rate FROM `questions` where date(timestamp)=CURRENT_DATE and hour(timestamp)=(hour(CURRENT_TIMESTAMP) - 1)and doubt not like 'web' and doubt not like 'whatsapp' and student_id>100";
    console.log(sql);
    return mysql.query(sql)
}

function sendMail(sendgrid, toMail, report, helper){
  
  let from_email = new helper.Email("autobot@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Match Rate for " + moment().subtract(0, 'd').format("YYYY-MM-DD")+"-";
  let content = new helper.Content("text/html", report )
  let mail = new helper.Mail(from_email, subject, to_email, content);
  //mail.addAttachment(attachment);
  var sg = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });

  sendgrid.API(sg, function (error, response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
    // return resolve(mail)
  })
}



function getQsAskData(mysql){
	let sql="select hour(timestamp) as hour,count(question_id) as questions_asked ,CURRENT_DATE as today from `questions` where doubt not like 'WHA%'" +
		" and student_id <> '2454417' and date(timestamp) = CURRENT_DATE and hour(timestamp) = (hour(CURRENT_TIMESTAMP)" +
    	" - 1)"
    // let sql= "select * from app_constants"
	console.log(sql)
	return mysql.query(sql)
}

function getQsAskPrevious(mysql){
	// let sql="select hour(timestamp),count(question_id),DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY),class from `questions` where doubt not like 'WHA%' and student_id <> '2454417' and date(timestamp) = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) and hour(timestamp) = (hour(CURRENT_TIMESTAMP) - 1) GROUP by class"
	let sql="select hour(timestamp),count(question_id),DATE('2018-10-31') as date ,class from `questions` where doubt not like 'WHA%' and student_id <> '2454417' and date(timestamp) ='2018-10-31' and hour(timestamp) = (hour(CURRENT_TIMESTAMP) - 1) and class <>'' and class is not null GROUP by class"
	return mysql.query(sql)
}

function getMatchQuestionFromVideoViews(){
    // let sql = "select count(view_id) from video_view_stats where question_id in (select question_id from `questions` where doubt not like 'WHA%' and student_id <> '2454417' and date(timestamp) = CURRENT_DATE and hour(timestamp) = (hour(CURRENT_TIMESTAMP) - 1)) and parent_id is not null "
    let sql = "SELECT count(question_id) as match_count FROM `video_view_stats` WHERE parent_id <> 0 and date(updated_at)=CURRENT_DATE and hour(updated_at)=(hour(CURRENT_TIMESTAMP) - 1) and student_id <> 2454417 and view_from ='SRP' and source='android'";
    console.log(sql);
    return mysql.query(sql)
}

// let sql = "SELECT hour(timestamp) as hours,count(question_id) as question_asked,sum(matched_app_questions) as matched_questions,(sum(matched_app_questions)/count(question_id))*100  as match_rate FROM `questions` where date(timestamp)=CURRENT_DATE and hour(timestamp)=(hour(CURRENT_TIMESTAMP) - 1)and doubt not like 'web' and doubt not like 'whatsapp' and student_id>100"

