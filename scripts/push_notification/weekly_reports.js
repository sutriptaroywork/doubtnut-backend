"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('./database')
var sendgrid = require("sendgrid")(config.send_grid_key)
var helper = require('sendgrid').mail
const moment = require('moment')
const fs = require('fs')
const _ = require('lodash')
var tempfile =require('tempfile')
const mysql = new database(config.mysql_analytics)
main(mysql)
var excel = require('exceljs')
var workbook = new excel.Workbook()
let registrationsheet=workbook.addWorksheet('Registrations' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
let newstuaskqsheet=workbook.addWorksheet('New students who asked question' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
let newstuwatchvidsheet =workbook.addWorksheet('New students who watched video' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
let stuaskqssheet =workbook.addWorksheet('Students who asked question' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
let stuwatvidsheet =workbook.addWorksheet('Students who watched videos' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
//let disparidsheet =workbook.addWorksheet('Distinct Parent Id' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
let qswoneweightsheet =workbook.addWorksheet('Question (W1-W8)' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
let videowoneweightsheet =workbook.addWorksheet('Video (W1-W8)' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
let qsclasswisesheet =workbook.addWorksheet('Question classwise' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
let vidclswisesheet =workbook.addWorksheet('Video classwise' + moment().subtract(7, 'd').format("YYYY-MM-DD"))
async function main (mysql){
	try{
		let promises = []
		promises.push(registration(mysql))
		promises.push(newstuaskqs(mysql))
		promises.push(newstuwatchvid(mysql))
		promises.push(stuaskqs(mysql))
		promises.push(stuwatvid(mysql))
		//promises.push(disparentid(mysql))
		promises.push(qswoneweight(mysql))
		promises.push(vidwoneweight(mysql))
		promises.push(qsclwise(mysql))
		promises.push(vidclwise(mysql))

		await Promise.all(promises)
		var tempFilePath = "Weekly report" +"" + moment().subtract(7, 'd').format("YYYY-MM-DD") + ".xlsx"
		workbook.xlsx.writeFile(tempFilePath).then(async function(){

			await sendMail(sendgrid, "vivek@doubtnut.com", tempFilePath,helper)
			await sendMail(sendgrid, "akanksha@doubtnut.com", tempFilePath,helper)
			await sendMail(sendgrid, "gunjan@doubtnut.com",tempFilePath, helper)
			await sendMail(sendgrid, "shalu@doubtnut.com",tempFilePath, helper)
		
			console.log('Workbook created with all sheets')
			const files = ['tempregistration.xlsx','tempnewstuaskq.xlsx','tempnewstuwatcvid.xlsx','tempstuaskqs.xlsx','tempstuwatvid.xlsx','tempqswoneweight.xlsx','tempvidoneweight.xlsx','tempqsclwise.xlsx','tempvidclwise.xlsx',tempFilePath]
			files.forEach(function(filePath) {
	    	fs.access(filePath, error => {
		        if (!error) {
		            fs.unlinkSync(filePath,function(error){
		                console.log(error);
		            })
		        } else {
		            console.log(error);
		        }
    		})
    		})
		})
		
    
	}catch(e){
		console.log(e)
	}
}

async function registration(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getData(mysql)
			//console.log(data)
			let count_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_student_id = data[i]['count(student_id)']
				sample ={}
				sample.count_student_id =count_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		registrationsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		registrationsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempregistration.xlsx').then(function(){
       		console.log('registrationsheet is written')
       			 	

     	})
     	resolve(registrationsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function newstuaskqs(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getQuestion(mysql)
			//console.log(data)
			let count_question_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_question_id =data[i]['count(a.question_id)']
				count_distinct_student_id = data[i]['count(DISTINCT (a.student_id))']
				sample ={}
				sample.count_question_id=count_question_id
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		newstuaskqsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		newstuaskqsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnewstuaskq.xlsx').then(function(){
       		console.log('newstuaskqsheet is written')
       			 	

     	})
     	resolve(newstuaskqsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function newstuwatchvid(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getVidWatch(mysql)
			//console.log(data)
			let count_view_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_view_id =data[i]['count(a.view_id)']
				count_distinct_student_id = data[i]['count(DISTINCT (a.student_id))']
				sample ={}
				sample.count_view_id=count_view_id
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		newstuwatchvidsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		newstuwatchvidsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnewstuwatcvid.xlsx').then(function(){
       		console.log('newstuwatchvidsheet is written')
       			 	

     	})
     	resolve(newstuwatchvidsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function stuaskqs(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getStuAskQs(mysql)
			//console.log(data)
			let count_question_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_question_id =data[i]['count(question_id)']
				count_distinct_student_id = data[i]['count(DISTINCT student_id)']
				sample ={}
				sample.count_question_id=count_question_id
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		stuaskqssheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		stuaskqssheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempstuaskqs.xlsx').then(function(){
       		console.log('stuaskqssheet is written')
       			 	

     	})
     	resolve(stuaskqssheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function stuwatvid(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getStuWatVid(mysql)
			//console.log(data)
			let count_view_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_view_id =data[i]['count(view_id)']
				count_distinct_student_id = data[i]['count(DISTINCT student_id)']
				sample ={}
				sample.count_view_id=count_view_id
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		stuwatvidsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		stuwatvidsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempstuwatvid.xlsx').then(function(){
       		console.log('stuwatvidsheet is written')
       			 	

     	})
     	resolve(stuwatvidsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function disparentid(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getDisParId(mysql)
			//console.log(data)
			let parent_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				parent_id =data[i]['count(DISTINCT parent_id)']
				sample ={}
				sample.parent_id=parent_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		disparidsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		disparidsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempdisparid.xlsx').then(function(){
       		console.log('disparidsheet is written')
       			 	

     	})
     	resolve(stuwatvidsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function qswoneweight(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getQsWoneWeight(mysql)
			//console.log(data)
			let join_yr,ask_yr,join_week,ask_week,week_num,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_yr =data[i]['join_yr']
				ask_yr =data[i]['ask_yr']
				join_week =data[i]['join_week']
				ask_week =data[i]['ask_week']
				week_num =data[i]['week_num']
				count_distinct_student_id =data[i]['count(d.student_id)']
				sample ={}
				sample.join_yr=join_yr
				sample.ask_yr =ask_yr
				sample.join_week =join_week
				sample.ask_week =ask_week
				sample.week_num =week_num
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		qswoneweightsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		qswoneweightsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempqswoneweight.xlsx').then(function(){
       		console.log('qswoneweightsheet is written')
       			 	

     	})
     	resolve(stuwatvidsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function vidwoneweight(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getVidWoneWeight(mysql)
			//console.log(data)
			let join_yr,ask_yr,join_week,ask_week,week_num,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_yr =data[i]['join_yr']
				ask_yr =data[i]['ask_yr']
				join_week =data[i]['join_week']
				ask_week =data[i]['ask_week']
				week_num =data[i]['week_num']
				count_distinct_student_id =data[i]['count(d.student_id)']
				sample ={}
				sample.join_yr=join_yr
				sample.ask_yr =ask_yr
				sample.join_week =join_week
				sample.ask_week =ask_week
				sample.week_num =week_num
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		videowoneweightsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		videowoneweightsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvidoneweight.xlsx').then(function(){
       		console.log('videowoneweightsheet is written')
       			 	

     	})
     	resolve(stuwatvidsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function qsclwise(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getQsClWise(mysql)
			//console.log(data)
			let join_dt,ask_date,student_class,day_num,count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				student_class =data[i]['student_class']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.join_dt=join_dt
				sample.ask_date =ask_date
				sample.student_class =student_class
				sample.day_num =day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		qsclasswisesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		qsclasswisesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempqsclwise.xlsx').then(function(){
       		console.log('qsclasswisesheet is written')
       			 	

     	})
     	resolve(stuwatvidsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function vidclwise(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getVidClWise(mysql)
			//console.log(data)
			let join_dt,ask_date,student_class,day_num,count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				student_class =data[i]['student_class']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.join_dt=join_dt
				sample.ask_date =ask_date
				sample.student_class =student_class
				sample.day_num =day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		vidclswisesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		vidclswisesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvidclwise.xlsx').then(function(){
       		console.log('vidclswisesheet is written')
       			 	

     	})
     	resolve(stuwatvidsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

function getData(mysql){
	let sql = "SELECT count(student_id) FROM `students` WHERE is_web<>1 and (udid not like '' or udid is not NULL) and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 8 DAY) and timestamp<DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)"
	//console.log(sql)
	return mysql.query(sql)
}

function getQuestion(mysql){
	let sql = "SELECT count(DISTINCT (a.student_id)),count(a.question_id) from (SELECT question_id,student_id FROM `questions` where doubt not like 'WEB' and doubt not like 'WHATSAPP' and timestamp>=DATE_SUB(CURRENT_DATE,INTERVAl 8 DAY) and timestamp<DATE_SUB(CURRENT_DATE,INTERVAl 1 DAY)) as a left join (SELECT student_id from students where timestamp>=DATE_SUB(CURRENT_DATE,INTERVAl 8 DAY) and timestamp<DATE_SUB(CURRENT_DATE,INTERVAl 1 DAY) and is_web<>1) as b on a.student_id=b.student_id where b.student_id is not NULL"
	//console.log(sql)
	return mysql.query(sql)
}

function getVidWatch(mysql){
	let sql = "SELECT count(DISTINCT (a.student_id)),count(a.view_id) from (SELECT view_id,student_id FROM `video_view_stats` where (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK')) and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 8 DAY) and created_at<DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)) as a left join (SELECT student_id from students where is_web<>1 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 8 DAY) and timestamp<DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)) as b on a.student_id=b.student_id where b.student_id is not NULL"
	//console.log(sql)
	return mysql.query(sql)
}

function getStuAskQs(mysql){
	let sql = "select count(question_id),count(DISTINCT student_id) from questions WHERE student_id >100 and doubt not like 'WEB' and doubt not like 'WHATSAPP' and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 8 DAY) and timestamp<DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)"
	//console.log(sql)
	return mysql.query(sql)
}

function getStuWatVid(mysql){
	let sql = "select count(DISTINCT student_id),count(view_id) from video_view_stats WHERE (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK')) and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 8 DAY) and created_at<DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)"
	//console.log(sql)
	return mysql.query(sql)
}

function getDisParId(mysql){
	let sql ="select count(DISTINCT parent_id) from (select year(created_at) as watchyear, week(created_at) as watchweek, parent_id,student_id from `view_download_stats_new` where week(created_at)=(week(CURRENT_DATE)-1) and year(created_at)=2019 UNION select year(created_at) as watchyear, week(created_at) as watchweek, parent_id,student_id from `video_view_stats` where source like 'android' and week(created_at)=(week(CURRENT_DATE)-1) and year(created_at)=2019) as a"

	return mysql.query(sql)
}

function getQsWoneWeight(mysql){
	let sql ="SELECT d.join_yr,d.ask_yr,d.join_week,d.ask_week,d.ask_week-d.join_week as week_num,count(d.student_id) from(Select b.student_id, b.join_yr,c.ask_yr,b.join_week,c.ask_week, c.count_q from (Select year(timestamp) as join_yr,week(timestamp) as join_week, student_id from students where student_id>100 and timestamp>=date_sub(CURRENT_DATE, INTERVAl 70 DAY) and timestamp<=CURRENT_DATE) as b left JOIN (SELECT student_id, year(timestamp) as ask_yr,week(timestamp) as ask_week, count(question_id) as count_q from questions where doubt not like 'WEB' and doubt not like 'WHATSAPP' and timestamp>=date_sub(CURRENT_DATE, INTERVAl 10 DAY) and timestamp<=CURRENT_DATE and student_id >100 group by student_id, year(timestamp),week(timestamp)) as c on b.student_id = c.student_id) as d WHERE d.student_id is not NULL GROUP by d.join_yr,d.ask_yr,d.join_week,d.ask_week"

	return mysql.query(sql)
}

function getVidWoneWeight(mysql){
	let sql="SELECT d.join_yr,d.ask_yr,d.join_week,d.ask_week,d.ask_week-d.join_week as week_num,count(d.student_id) from (Select b.student_id, b.join_yr,c.ask_yr,b.join_week,c.ask_week, c.count_q from (Select year(timestamp) as join_yr,week(timestamp) as join_week, student_id from students where student_id>100 and timestamp>=date_sub(CURRENT_DATE, INTERVAl 70 DAY) and timestamp<=CURRENT_DATE) as b left JOIN (SELECT student_id, year(created_at) as ask_yr,week(created_at) as ask_week, count(view_id) as count_q from video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAl 10 DAY) and created_at<=CURRENT_DATE and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK')) group by student_id, year(created_at),week(created_at)) as c on b.student_id = c.student_id) as d WHERE d.student_id is not NULL GROUP by d.join_yr,d.ask_yr,d.join_week,d.ask_week"

	return mysql.query(sql)
}

function getQsClWise(mysql){
	let sql="Select d.join_dt, d.ask_date,d.student_class, d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from (Select b.student_id, b.student_class,b.join_dt,c.ask_date, c.count_q from (Select week(timestamp) as join_dt, student_class,student_id,udid from students where student_id>100 and timestamp>=date_sub(CURRENT_DATE, INTERVAl 20 DAY) and timestamp<=CURRENT_DATE) as b left JOIN (SELECT student_id, week(timestamp) as ask_date, count(question_id) as count_q from questions where doubt not like 'WEB' and doubt not like 'WHATSAPP' and timestamp>=date_sub(CURRENT_DATE, INTERVAl 20 DAY) and timestamp<=CURRENT_DATE and student_id >100 group by student_id, week(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not NULL GROUP by d.join_dt, d.ask_date,d.student_class"

	return mysql.query(sql)
}

function getVidClWise(mysql){
	let sql="Select d.join_dt, d.ask_date,d.student_class, d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from(Select b.student_id, b.student_class,b.join_dt,c.ask_date, c.count_q from (Select week(timestamp) as join_dt, student_class,student_id,udid from students where student_id>100 and timestamp>=date_sub(CURRENT_DATE, INTERVAl 20 DAY) and timestamp<=CURRENT_DATE) as b left JOIN (SELECT student_id, week(created_at) as ask_date, count(view_id) as count_q from video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAl 20 DAY) and created_at<=CURRENT_DATE and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK')) group by student_id, week(created_at)) as c on b.student_id = c.student_id) as d where d.student_id is not NULL GROUP by d.join_dt, d.ask_date,d.student_class"

	return mysql.query(sql)
}

async function sendMail(sendgrid, toMail, tempFilePath, helper) {
return new Promise(async function (resolve, reject) {
  try{	

  let from_email = new helper.Email("vivek@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Weekly Report for " + moment().subtract(7, 'd').format("YYYY-MM-DD");
  let content = new helper.Content("text/plain", "Report for " +""+ moment().subtract(7, 'd').format("YYYY-MM-DD"));
  var attachment = new helper.Attachment();
  var file1 = fs.readFileSync(tempFilePath);
  var base64File1 = new Buffer(file1).toString('base64');
  attachment.setContent(base64File1);
  attachment.setType('text/xlsx');
  attachment.setFilename(tempFilePath);
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
    return resolve(mail)
  })
  }catch(e){
  console.log(e)
  reject(e)
 }
})
}
