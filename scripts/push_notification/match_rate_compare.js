"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
var sendgrid = require("sendgrid")(config.send_grid_key)
var helper = require('sendgrid').mail
const moment = require('moment')
const mysql = new database(config.mysql_analytics)
main(mysql)

async function main (mysql){
  try{

    let questionAskData=await qask(mysql)
    // console.log(questionAskData)
    let questionAskObj =[]
    questionAskObj.hour_timestamp = questionAskData[0]['hour(timestamp)']
    questionAskObj.count_question_id = questionAskData[0]['count(question_id)']
    questionAskObj.CURRENT_DATE = questionAskData[0]['CURRENT_DATE ']
    // console.log(questionAskObj)
    let videoWatchData = await vwatch(mysql)
    // console.log(videoWatchData)
    let videoWatchObj =[]
    videoWatchObj.hour_created_at = videoWatchData[0]['hour(created_at)']
    videoWatchObj.count_distinct_parent_id = videoWatchData[0]['count(DISTINCT parent_id)']
    videoWatchObj.CURRENT_DATE = videoWatchData[0]['CURRENT_DATE ']
    //console.log(videoWatchObj)
    let qsAskCountQid = questionAskData[0]['count(question_id)']
    let vidWatchCountPaId = videoWatchData[0]['count(DISTINCT parent_id)']
    let matchRate = (vidWatchCountPaId/qsAskCountQid) * 100
    //console.log(matchRate)
    let totalNullEntriesData = await totnullentries(mysql)
    //console.log(totalNullEntriesData)
    let totalNullEntriesObj =[]
    totalNullEntriesObj.hour_timestamp = totalNullEntriesData[0]['hour(timestamp)']
    totalNullEntriesObj.count_question_id = totalNullEntriesData[0]['count(question_id)']
    totalNullEntriesObj.CURRENT_DATE = totalNullEntriesData[0]['CURRENT_DATE ']
    //console.log(totalNullEntriesObj)
    let report = []
    report.question_ask = questionAskObj
    report.video_watch = videoWatchObj
    report.match_rate = matchRate
    report.totalnullentries = totalNullEntriesObj
    //console.log(report)
    await sendMail(sendgrid, "vivek@doubtnut.com",report,helper)
    // await sendMail(sendgrid, "akanksha@doubtnut.com",report,helper)
    // await sendMail(sendgrid, "anmol@doubtnut.com",report,helper)
    // await sendMail(sendgrid, "vamshi@doubtnut.com",report,helper)
  }catch(e){
    console.log(e)
  }
}

async function qask(mysql){
  return new Promise (async function(resolve,reject){
    try{


      let data = await getQsAskData(mysql)
      //console.log(data)

      resolve(data)

    }catch(e){
      console.log(e)
      reject(e)
    }
  })

}

async function vwatch(mysql){
  return new Promise (async function(resolve,reject){
    try{


      let data = await getVidWatchData(mysql)
      //console.log(data)

      resolve(data)

    }catch(e){
      console.log(e)
      reject(e)
    }
  })

}

async function totnullentries(mysql){
  return new Promise (async function(resolve,reject){
    try{


      let data = await getTotNullEntriesData(mysql)
      //console.log(data)

      resolve(data)

    }catch(e){
      console.log(e)
      reject(e)
    }
  })

}

function getQsAskData(mysql){
  let sql ="select hour(timestamp),count(question_id),CURRENT_DATE from `questions` where doubt not like 'WHA%' and student_id <> '2454417' and date(timestamp) = CURRENT_DATE and hour(timestamp) = (hour(CURRENT_TIMESTAMP) - 1) GROUP by hour(timestamp)"
  //console.log(sql)
  return mysql.query(sql)
}

function getVidWatchData(mysql){
  let sql ="SELECT hour(created_at),count(DISTINCT parent_id),CURRENT_DATE FROM `video_view_stats` where source not like 'WHA%' and student_id <> '2454417' and date(created_at)>=CURRENT_DATE and hour(created_at) = (hour(CURRENT_TIMESTAMP) - 1)  GROUP by hour(created_at)"
  //console.log(sql)
  return mysql.query(sql)
}

function getTotNullEntriesData(mysql){
  let sql ="select hour(timestamp),count(question_id),CURRENT_DATE from `questions` where doubt not like 'WHA%' and student_id <> '2454417' and question_image is NULL and (ocr_text like '' or ocr_text is NULL) and date(timestamp)>=CURRENT_DATE and hour(timestamp) = (hour(CURRENT_TIMESTAMP) - 1) GROUP by hour(timestamp)"
  //console.log(sql)
  return mysql.query(sql)
}

async function sendMail(sendgrid, toMail, report, helper) {
  return new Promise(async function (resolve, reject) {
    try {
      //	console.log("<<<<>>>>>")
      //	console.log(report.question_ask.hour_timestamp)
      let content_html = "<!DOCTYPE html>" +
        "<html>" +
        "<head>" +
        "<style>" +
        "table {" +
        "width:100%;" +
        "}" +
        "table, th, td {" +
        "border: 1px solid black;" +
        "border-collapse: collapse;" +
        "}" +
        "th, td {" +
        "padding: 15px;" +
        "text-align: left;" +
        "}" +
        "table#t01 tr:nth-child(even) {" +
        "background-color: #eee;" +
        "}" +
        "table#t01 tr:nth-child(odd) {" +
        "background-color: #fff;" +
        "}" +
        "table#t01 th {" +
        "background-color: black;" +
        "color: white;" +
        "}" +
        "</style>" +
        "</head>" +
        "<body>" +
        "<h2>Report</h2>" +
        "<table>" +
        "<p>QUESTION ASK:</p>" +
        "<tr>" +
        "<th>Hour Timestamp</th>" +
        "<th>Count Question Id</th>" +
        "<th>CURRENT_DATE</th>" +
        "</tr>" +
        "<tr>" +
        "<td>" + report.question_ask.hour_timestamp + "</td>" +
        "<td>" + report.question_ask.count_question_id + "</td>" +
        "<td>" + report.question_ask.CURRENT_DATE + "</td>" +
        "</tr>" +
        "</table>" +
        "<br>" +
        "<table>" +
        "<p>VIDEO WATCH:</p>" +
        "<tr>" +
        "<th>Hour Created At</th>" +
        "<th>Count Distinct Parent Id</th>" +
        "<th>CURRENT_DATE</th>" +
        "</tr>" +
        "<tr>" +
        "<td>" + report.video_watch.hour_created_at + "</td>" +
        "<td>" + report.video_watch.count_distinct_parent_id + "</td>" +
        "<td>" + report.video_watch.CURRENT_DATE + "</td>" +
        "</tr>" +
        "</table>" +
        "<br>" +
        "<p>Match Rate: " + report.match_rate + "</p>" +
        "<br>" +
        "<table>" +
        "<p>TOTAL NULL ENTRIES:</p>" +
        "<tr>" +
        "<th>Hour Timestamp</th>" +
        "<th>Count Question Id</th>" +
        "<th>CURRENT_DATE</th>" +
        "</tr>" +
        "<tr>" +
        "<td>" + report.totalnullentries.hour_timestamp + "</td>" +
        "<td>" + report.totalnullentries.count_question_id + "</td>" +
        "<td>" + report.totalnullentries.CURRENT_DATE + "</td>" +
        "</tr>" +
        "</table>" +
        "</body>" +
        "</html>"

      let from_email = new helper.Email("vivek@doubtnut.com");
      let to_email = new helper.Email(toMail);
      let subject = "Match Rate(" + report.match_rate + ") for " + moment().subtract(0, 'd').format("YYYY-MM-DD") + "_hour(" + report.video_watch.hour_created_at + ")";
      let content = new helper.Content("text/html", content_html)
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
        return resolve(mail)
      })
    } catch (e) {
      console.log(e)
      reject(e)
    }
  })
}