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
		let questionAskObj, qsObj=[]
		for(let i =0; i< questionAskData.length; i++){
		questionAskObj={}
		questionAskObj.class = questionAskData[i]['class']
		questionAskObj.hour_timestamp = questionAskData[i]['hour(timestamp)']
		questionAskObj.count_question_id = questionAskData[i]['count(question_id)']
		questionAskObj.CURRENT_DATE = questionAskData[i]['CURRENT_DATE']
		qsObj.push(questionAskObj)
		}
		 //console.log(qsObj)
		let questionAskPrevious =await qaskPrevious(mysql)
		let questionAskPreviousObj, qsPrevObj=[]
		for(let i =0; i< questionAskPrevious.length; i++){
		questionAskPreviousObj={}
		questionAskPreviousObj.class = questionAskPrevious[i]['class']
		questionAskPreviousObj.hour_timestamp = questionAskPrevious[i]['hour(timestamp)']
		questionAskPreviousObj.count_question_id = questionAskPrevious[i]['count(question_id)']
		questionAskPreviousObj.PREVIOUS_DATE = questionAskPrevious[i]['date']
		qsPrevObj.push(questionAskPreviousObj)
		}
		//console.log(qsPrevObj)
		let videoWatchData = await vwatch(mysql)
		// console.log(videoWatchData)
		let videoWatchObj, vidObj =[]
		for(let i=0; i<videoWatchData.length; i++){
		videoWatchObj ={}
		videoWatchObj.class = videoWatchData[i]['student_class']
		videoWatchObj.hour_created_at = videoWatchData[i]['hour(a.created_at)']
		videoWatchObj.count_distinct_parent_id = videoWatchData[i]['count(DISTINCT parent_id)']
		videoWatchObj.CURRENT_DATE = videoWatchData[i]['CURRENT_DATE']
		vidObj.push(videoWatchObj)
		}
		
		//console.log(vidObj)
		let sum_count_q_id=0
		 for(let i =0; i< questionAskData.length; i++){
		 	
		 	sum_count_q_id = sum_count_q_id + questionAskData[i]['count(question_id)']

		 }
		 
		 //console.log(sum_count_q_id)
		let sum_count_p_id=0
		for(let i =0; i< videoWatchData.length; i++){
			for(let j =0; j< questionAskData.length; j++){
		 	
				if(questionAskData[j]['class'] == videoWatchData[i]['student_class']){
			 	
			 	sum_count_p_id = sum_count_p_id + videoWatchData[i]['count(DISTINCT parent_id)']
			  }
			}
		 }
		 
		 //console.log(sum_count_p_id)

		let overall_match = (sum_count_p_id)/(sum_count_q_id)*100
		 //console.log(overall_match)
		let videoWatchPrevious = await vwatchPrevious(mysql)
		let videoWatchPreviousObj, vidPreviousObj =[]
		for(let i=0; i<videoWatchPrevious.length; i++){
		videoWatchPreviousObj={}
		videoWatchPreviousObj.class = videoWatchPrevious[i]['student_class']
		videoWatchPreviousObj.hour_created_at = videoWatchPrevious[i]['hour(a.created_at)']
		videoWatchPreviousObj.count_distinct_parent_id = videoWatchPrevious[i]['count(DISTINCT parent_id)']
		videoWatchPreviousObj.PREVIOUS_DATE = videoWatchPrevious[i]['date']
		vidPreviousObj.push(videoWatchPreviousObj)
		}
		//console.log(vidPreviousObj)
		let totalNullEntriesData = await totnullentries(mysql)
		//console.log(totalNullEntriesData)
		let totalNullEntriesObj =[]
		totalNullEntriesObj.hour_timestamp = totalNullEntriesData[0]['hour(timestamp)']
		totalNullEntriesObj.count_question_id = totalNullEntriesData[0]['count(question_id)']
		totalNullEntriesObj.CURRENT_DATE = totalNullEntriesData[0]['CURRENT_DATE ']
		//console.log(totalNullEntriesObj)
		let report = []
		report.question_ask = qsObj
		report.question_prev = qsPrevObj
		report.video_watch = vidObj
		report.video_prev = vidPreviousObj
		report.totalnullentries = totalNullEntriesObj
		report.overall = overall_match
		report.totQ = sum_count_q_id
		//console.log(report)
		
		 await sendMail(sendgrid, "vivek@doubtnut.com",report,helper)
		 await sendMail(sendgrid, "akanksha@doubtnut.com",report,helper)
		 await sendMail(sendgrid, "anmol@doubtnut.com",report,helper)
		 await sendMail(sendgrid, "vamshi@doubtnut.com",report,helper)
		 // await sendMail(sendgrid, "tanushree@doubtnut.com",report,helper)
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

async function qaskPrevious(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getQsAskPrevious(mysql)
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

async function vwatchPrevious(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getVidWatchPreviousData(mysql)
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
	let sql="select hour(timestamp),count(question_id),CURRENT_DATE,class from `questions` where doubt not like 'WHA%'" +
		" and student_id <> '2454417' and date(timestamp) = CURRENT_DATE and hour(timestamp) = (hour(CURRENT_TIMESTAMP)" +
		" - 1) and class <>'' and class is not null and (student_id % 2) = 0 GROUP by class"
	//console.log(sql)
	return mysql.query(sql)
}

function getQsAskPrevious(mysql){
	// let sql="select hour(timestamp),count(question_id),DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY),class from `questions` where doubt not like 'WHA%' and student_id <> '2454417' and date(timestamp) = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) and hour(timestamp) = (hour(CURRENT_TIMESTAMP) - 1) GROUP by class"
	let sql="select hour(timestamp),count(question_id),DATE('2018-10-31') as date ,class from `questions` where doubt not like 'WHA%' and student_id <> '2454417' and date(timestamp) ='2018-10-31' and hour(timestamp) = (hour(CURRENT_TIMESTAMP) - 1) and class <>'' and class is not null GROUP by class"
	return mysql.query(sql)
}

function getVidWatchData(mysql){
	let sql ="select hour(a.created_at), count(DISTINCT parent_id), CURRENT_DATE,b.student_class from (SELECT * FROM" +
		" `video_view_stats` where source not like 'WHA%' and student_id <> '2454417' and date(created_at)>=CURRENT_DATE" +
		" and hour(created_at) = (hour(CURRENT_TIMESTAMP) - 1)) as a left join (select student_class,student_id from" +
		" students where (student_id % 2) = 0 ) as b on a.student_id=b.student_id where b.student_class <> '' and b.student_class is" +
		" not null group by b.student_class"
	//console.log(sql)
	return mysql.query(sql)
}

function getVidWatchPreviousData(mysql){
	// let sql ="select hour(a.created_at), count(DISTINCT parent_id), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY),b.student_class from (SELECT * FROM `video_view_stats` where source not like 'WHA%' and student_id <> '2454417' and date(created_at)=DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) and hour(created_at) = (hour(CURRENT_TIMESTAMP) - 1)) as a left join (select student_class,student_id from students) as b on a.student_id=b.student_id group by b.student_class"
	let sql ="select hour(a.created_at), count(DISTINCT parent_id), DATE('2018-10-31') as date,b.student_class from (SELECT * FROM `video_view_stats` where source not like 'WHA%' and student_id <> '2454417' and date(created_at) ='2018-10-31' and hour(created_at) = (hour(CURRENT_TIMESTAMP) - 1)) as a left join (select student_class,student_id from students) as b on a.student_id=b.student_id where b.student_class <> '' and b.student_class is not null group by b.student_class"
	return mysql.query(sql)
}

function getTotNullEntriesData(mysql){
	let sql ="select hour(timestamp),count(question_id),CURRENT_DATE from `questions` where doubt not like 'WHA%' and student_id <> '2454417' and question_image is NULL and (ocr_text like '' or ocr_text is NULL) and date(timestamp)>=CURRENT_DATE and hour(timestamp) = (hour(CURRENT_TIMESTAMP) - 1) GROUP by hour(timestamp)"
	//console.log(sql)
	return mysql.query(sql)
}

async function sendMail(sendgrid, toMail, report, helper) {
return new Promise(async function (resolve, reject) {
  try{
  	let content_html ="<!DOCTYPE html>"+
"<html>"+
"<head>"+
"<style>"+
"table {"+
  "width:100%;"+
"}"+
"table, th, td {"+
  "border: 1px solid black;"+
  "border-collapse: collapse;"+
"}"+
"th, td {"+
  "padding: 15px;"+
  "text-align: left;"+
"}"+
"table#t01 tr:nth-child(even) {"+
  "background-color: #eee;"+
"}"+
"table#t01 tr:nth-child(odd) {"+
 "background-color: #fff;"+
"}"+
"table#t01 th {"+
  "background-color: black;"+
  "color: white;"+
"}"+
  "</style>"+
"</head>"+
"<body>"+
"<h2>Report</h2>"+
"<table>"+
"<h3>QUESTION ASK:</h3>"+
"<tr>"+
    "<th>Class</th>"+
    "<th>Hour Timestamp</th>"+
    "<th>"+report.question_ask[0].CURRENT_DATE+"</th>"+
    "<th>"+report.question_prev[0].PREVIOUS_DATE+"</th>"+
  "</tr>";

for(let i=0;i<report.question_ask.length;i++){
	// for(let j=0;j<report.question_prev.length;j++){
	// 	if(report.question_ask[i].class == report.question_prev[j].class && report.question_ask[i].hour_timestamp == report.question_prev[j].hour_timestamp ){
			var qshtml = 
			  "<tr>"+
			    "<td>"+report.question_ask[i].class+"</td>"+
			    "<td>"+report.question_ask[i].hour_timestamp+"</td>"+
			    "<td>"+report.question_ask[i].count_question_id+"</td>"+
			    "<td>"+report.question_prev[i].count_question_id+"</td>"+

			  "</tr>";
				content_html = content_html + qshtml;
  // }

		// }

	
}
content_html = content_html + "</table>"+
"<br>"+
"<table>"+
"<h3>VIDEO WATCH:</h3>"+
  "<tr>"+
  	"<th>Class</th>"+
    "<th>Hour Created At</th>"+
    "<th>"+report.video_watch[0].CURRENT_DATE+"</th>"+
    "<th>"+report.video_prev[0].PREVIOUS_DATE+"</th>"+
  "</tr>";
  for(let i=0;i<report.video_watch.length;i++){
	// for(let j=0;j<report.video_prev.length;j++){
	// 	if(report.video_watch[i].class == report.video_prev[j].class && report.video_watch[i].hour_created_at == report.video_prev[j].hour_created_at ){
			var vidhtml = 
			  "<tr>"+
			    "<td>"+report.video_watch[i].class+"</td>"+
			    "<td>"+report.video_watch[i].hour_created_at+"</td>"+
			    "<td>"+report.video_watch[i].count_distinct_parent_id+"</td>"+
			    "<td>"+report.video_prev[i].count_distinct_parent_id+"</td>"+

			  "</tr>";
				content_html = content_html + vidhtml;
  // }

		// }

	
}
content_html = content_html + "</table>"+
"<br>"+
"<h3>Match Rate:</h3>"+
 "<tr>"+
  	"<th>Class</th>"+
    "<th>"+report.video_watch[0].CURRENT_DATE+"</th>"+
    "<th>"+report.video_prev[0].PREVIOUS_DATE+"</th>"+
  "</tr>";
  for(let i=0;i<report.video_watch.length;i++){
	for(let k=0;k<report.question_ask.length;k++){
		if(report.question_ask[k].class == report.video_watch[i].class &&  report.video_watch[i].hour_created_at == report.question_ask[k].hour_timestamp ){
			var matchratehtml = 
			  "<tr>"+
			    "<td>"+report.video_watch[i].class+"</td>"+
			    "<td>"+(report.video_watch[i].count_distinct_parent_id)/(report.question_ask[k].count_question_id)*100+"</td>"+
			    "<td>"+(report.video_prev[i].count_distinct_parent_id)/(report.question_prev[k].count_question_id)*100+"</td>"+

			  "</tr>";
				content_html = content_html + matchratehtml;
			}
  		 }
}
content_html = content_html + "</table>"+
"<br>"+
"<table>"+
"<h3>TOTAL NULL ENTRIES:</h3>"+
  "<tr>"+
    "<th>Hour Timestamp</th>"+
    "<th>Count Question Id</th>"+
    "<th>CURRENT_DATE</th>"+
  "</tr>"+
  "<tr>"+
    "<td>"+report.totalnullentries.hour_timestamp+"</td>"+
    "<td>"+report.totalnullentries.count_question_id+"</td>"+
    "<td>"+report.totalnullentries.CURRENT_DATE+"</td>"+
  "</tr>"+
"</table>"+
"</body>"+
"</html>"
  	
  let from_email = new helper.Email("vivek@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Match Rate ("+report.overall+") for " + moment().subtract(0, 'd').format("YYYY-MM-DD")+ " total Q("+report.totQ+")_null_"+report.totalnullentries.count_question_id+"_hour("+report.totalnullentries.hour_timestamp+")";
  let content = new helper.Content("text/html", content_html )
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
  }catch(e){
  console.log(e)
  reject(e)
 }
})
}