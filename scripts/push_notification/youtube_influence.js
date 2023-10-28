"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('./database')
var sendgrid = require("sendgrid")(config.send_grid_key);
var helper = require('sendgrid').mail
const moment = require('moment')
const fs = require('fs')
const _ = require('lodash')
var tempfile =require('tempfile')
const mysql = new database(config.mysql_analytics);
main(mysql)
var excel = require('exceljs')
var workbook = new excel.Workbook()
let installsheet=workbook.addWorksheet('Installs' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let qsretsheet=workbook.addWorksheet('Question Asking Overall Retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let vidwatretsheet=workbook.addWorksheet('Video Watching Overall Retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let totalviewsheet=workbook.addWorksheet('Total Views Camp Wise' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let distsrpidsheet=workbook.addWorksheet('Distinct SRP ID Camp Wise' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let totqsaskedsheet=workbook.addWorksheet('Total Questions Asked Camp Wise' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let notonefourdistsrpsheet=workbook.addWorksheet('<>14 Distinct SRP Camp Wise' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let notonefourqsaskedsheet=workbook.addWorksheet('<>14 Questions Asked Camp Wise' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let notonefourvidviewscampwisesheet=workbook.addWorksheet('<>14 Video Views Camp wise' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let notonefourretentionsheet=workbook.addWorksheet('Question Asking <>14 retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let vidnotonefourretentionsheet=workbook.addWorksheet('Video Watching <>14 retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let campwisevidviewsheet=workbook.addWorksheet('Campaign Wise Video Views Retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let campwiseqsasksheet=workbook.addWorksheet('Campaign Wise Question Retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))

async function main (mysql){
	try{
		let promises = []
		promises.push(installs(mysql))
		promises.push(questionAskedRetention(mysql))
		promises.push(videoWatchingOverallRetention(mysql))
		promises.push(totalViews(mysql))
		promises.push(distinctSrpId(mysql))
		promises.push(totQsAsked(mysql))
		promises.push(notOneFourDistSrp(mysql))
		promises.push(notOneFourQsAsked(mysql))
		promises.push(notOneFourVidViewCampWise(mysql))
		promises.push(notOneFourRetention(mysql))
		promises.push(notOneFourVidWatRetention(mysql))
		promises.push(campWiseVidView(mysql))
		promises.push(campWiseQsAsk(mysql))

		await Promise.all(promises)
		var tempFilePath = "Youtube Influence Report" +"" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".xlsx"
		workbook.xlsx.writeFile(tempFilePath).then(async function(){

			 await sendMail(sendgrid, "vivek@doubtnut.com", tempFilePath,helper)
			 await sendMail(sendgrid, "akanksha@doubtnut.com", tempFilePath,helper)
			 await sendMail(sendgrid, "gunjan@doubtnut.com",tempFilePath, helper)
			
		
			console.log('Workbook created with all sheets')
			const files = ['tempinstalls.xlsx','tempnotonefourasked.xlsx','tempqsasretention.xlsx','tempvidwatretention.xlsx','temptotview.xlsx','tempdistsrp.xlsx','temptotqsask.xlsx','tempnotonefourdistsrp.xlsx','tempnotonefourvidviewscampwise.xlsx','tempnotonefourretention.xlsx','tempvidnotonefourretention.xlsx','tempcampwisevidview.xlsx','tempcampwiseqsask.xlsx',tempFilePath]
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

async function installs(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getInstalls(mysql)
			//console.log(data)
			let join_dt, latd_campaign, student_class, count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt= data[i]['join_dt']
				latd_campaign =data[i]['latd_campaign']
				student_class =data[i]['student_class']
				count_distinct_student_id =data[i]['count(d.student_id)']
				sample ={}
				sample.join_dt =join_dt
				sample.latd_campaign =latd_campaign
				sample.student_class =student_class
				sample.count_distinct_student_id = count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		installsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		installsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempinstalls.xlsx').then(function(){
       		console.log('installsheet is written')
       			 	

     	})
     	resolve(installsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}


async function questionAskedRetention(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getQsAskedRetention(mysql)
			//console.log(data)
			let join_dt, ask_date, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt= data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.join_dt =join_dt
				sample.ask_date =ask_date
				sample.day_num =day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		qsretsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		qsretsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempqsasretention.xlsx').then(function(){
       		console.log('qsretsheet is written')
       			 	

     	})
     	resolve(qsretsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function videoWatchingOverallRetention(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getVidWatRetention(mysql)
			//console.log(data)
			let join_dt, view_date, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt= data[i]['join_dt']
				view_date =data[i]['view_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.join_dt =join_dt
				sample.view_date =view_date
				sample.day_num =day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		vidwatretsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		vidwatretsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvidwatretention.xlsx').then(function(){
       		console.log('vidwatretsheet is written')
       			 	

     	})
     	resolve(vidwatretsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function totalViews(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getTotViews(mysql)
			//console.log(data)
			let watch_dt, latd_campaign, count_distinct_view_id, count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				watch_dt= data[i]['watch_dt']
				latd_campaign =data[i]['latd_campaign']
				count_distinct_view_id=data[i]['count(d.view_id)']
				count_distinct_student_id =data[i]['count( distinct d.student_id)']
				sample ={}
				sample.watch_dt =watch_dt
				sample.latd_campaign =latd_campaign
				sample.count_distinct_view_id =count_distinct_view_id
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		totalviewsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		totalviewsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temptotview.xlsx').then(function(){
       		console.log('totalviewsheet is written')
       			 	

     	})
     	resolve(totalviewsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function distinctSrpId(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getDistSrpId(mysql)
			//console.log(data)
			let watch_dt, latd_campaign, count_distinct_parent_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				watch_dt= data[i]['watch_dt']
				latd_campaign =data[i]['latd_campaign']
				count_distinct_parent_id=data[i]['count(distinct d.parent_id)']
				sample ={}
				sample.watch_dt =watch_dt
				sample.latd_campaign =latd_campaign
				sample.count_distinct_parent_id =count_distinct_parent_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		distsrpidsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		distsrpidsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempdistsrp.xlsx').then(function(){
       		console.log('distsrpidsheet is written')
       			 	

     	})
     	resolve(distsrpidsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function totQsAsked(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getTotQsAsked(mysql)
			//console.log(data)
			let ask_dt, latd_campaign, count_distinct_question_id, count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				ask_dt= data[i]['ask_dt']
				latd_campaign =data[i]['latd_campaign']
				count_distinct_question_id=data[i]['count(d.question_id)']
				count_distinct_student_id =data[i]['count( distinct d.student_id)']
				sample ={}
				sample.ask_dt =ask_dt
				sample.latd_campaign =latd_campaign
				sample.count_distinct_question_id =count_distinct_question_id
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		totqsaskedsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		totqsaskedsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temptotqsask.xlsx').then(function(){
       		console.log('totqsaskedsheet is written')
       			 	

     	})
     	resolve(totqsaskedsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function notOneFourDistSrp(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getNotOneFourDistSrp(mysql)
			//console.log(data)
			let watch_dt, latd_campaign, count_distinct_parent_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				watch_dt= data[i]['watch_dt']
				latd_campaign =data[i]['latd_campaign']
				count_distinct_parent_id=data[i]['count(distinct d.parent_id)']
				sample ={}
				sample.watch_dt =watch_dt
				sample.latd_campaign =latd_campaign
				sample.count_distinct_parent_id =count_distinct_parent_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		notonefourdistsrpsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		notonefourdistsrpsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnotonefourdistsrp.xlsx').then(function(){
       		console.log('notonefourdistsrpsheet is written')
       			 	

     	})
     	resolve(notonefourdistsrpsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function notOneFourQsAsked(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getNotOneFourQsAsked(mysql)
			//console.log(data)
			let ask_dt, latd_campaign, count_distinct_question_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				ask_dt= data[i]['ask_dt']
				latd_campaign =data[i]['latd_campaign']
				count_distinct_question_id=data[i]['count(d.question_id)']
				sample ={}
				sample.ask_dt =ask_dt
				sample.latd_campaign =latd_campaign
				sample.count_distinct_question_id =count_distinct_question_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		notonefourqsaskedsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		notonefourqsaskedsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnotonefourasked.xlsx').then(function(){
       		console.log('notonefourqsaskedsheet is written')
       			 	

     	})
     	resolve(notonefourdistsrpsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function notOneFourVidViewCampWise(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getNotOneFourVidViewCampWise(mysql)
			//console.log(data)
			let watch_dt, latd_campaign, count_distinct_view_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				watch_dt= data[i]['watch_dt']
				latd_campaign =data[i]['latd_campaign']
				count_distinct_view_id=data[i]['count(d.view_id)']
				sample ={}
				sample.watch_dt =watch_dt
				sample.latd_campaign =latd_campaign
				sample.count_distinct_view_id =count_distinct_view_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		notonefourvidviewscampwisesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		notonefourvidviewscampwisesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnotonefourvidviewscampwise.xlsx').then(function(){
       		console.log('notonefourvidviewscampwisesheet is written')
       			 	

     	})
     	resolve(notonefourdistsrpsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function notOneFourRetention(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getNotOneFourRetention(mysql)
			//console.log(data)
			let join_dt, ask_date, day_num, count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt= data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_distinct_student_id =data[i]['count_s']
				sample ={}
				sample.join_dt =join_dt
				sample.ask_date =ask_date
				sample.day_num =day_num
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		notonefourretentionsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		notonefourretentionsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnotonefourretention.xlsx').then(function(){
       		console.log('notonefourretentionsheet is written')
       			 	

     	})
     	resolve(notonefourretentionsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function notOneFourVidWatRetention(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getNotOneFourVidWatRetention(mysql)
			//console.log(data)
			let join_dt, view_date, day_num, count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt= data[i]['join_dt']
				view_date =data[i]['view_date']
				day_num =data[i]['day_num']
				count_distinct_student_id =data[i]['count_s']
				sample ={}
				sample.join_dt =join_dt
				sample.view_date =view_date
				sample.day_num =day_num
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		vidnotonefourretentionsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		vidnotonefourretentionsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvidnotonefourretention.xlsx').then(function(){
       		console.log('vidnotonefourretentionsheet is written')
       			 	

     	})
     	resolve(vidnotonefourretentionsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function campWiseVidView(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getCampWiseVidView(mysql)
			//console.log(data)
			let latd_campaign,join_dt, view_date, day_num, count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				latd_campaign =data[i]['latd_campaign']
				join_dt= data[i]['join_dt']
				view_date =data[i]['view_date']
				day_num =data[i]['day_num']
				count_distinct_student_id =data[i]['count_s']
				sample ={}
				sample.latd_campaign=latd_campaign
				sample.join_dt =join_dt
				sample.view_date =view_date
				sample.day_num =day_num
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		campwisevidviewsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		campwisevidviewsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcampwisevidview.xlsx').then(function(){
       		console.log('campwisevidviewsheet is written')
       			 	

     	})
     	resolve(campwisevidviewsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function campWiseQsAsk(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getCampWiseQsAsk(mysql)
			//console.log(data)
			let latd_campaign,join_dt, ask_date, day_num, count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				latd_campaign =data[i]['latd_campaign']
				join_dt= data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_distinct_student_id =data[i]['count_s']
				sample ={}
				sample.latd_campaign=latd_campaign
				sample.join_dt =join_dt
				sample.ask_date =ask_date
				sample.day_num =day_num
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		campwiseqsasksheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		campwiseqsasksheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcampwiseqsask.xlsx').then(function(){
       		console.log('campwiseqsasksheet is written')
       			 	

     	})
     	resolve(campwiseqsasksheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

function getInstalls(mysql){
	let sql = "select d.join_dt,d.latd_campaign,d.student_class,count(d.student_id) from (Select a.latd_campaign, b.student_class,b.student_id, b.join_dt from ( SELECT referred_udid,latd_campaign FROM `branch_events` WHERE `name` LIKE 'INSTALL' and latd_campaign like 'YTA_INF_%' and date(created_at)= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)) as a left join (Select date(timestamp) as join_dt, student_id,student_class,udid from students where is_web=0 and date(timestamp) = DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)) as b on a.referred_udid=b.udid) as d group by d.latd_campaign,d.student_class,d.join_dt order by join_dt ASC"
	//console.log(sql)
	return mysql.query(sql)
}

function getQsAskedRetention(mysql){
	let sql = "Select d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select a.*, b.student_id, b.join_dt,c.ask_date, c.count_q from ( SELECT referred_udid FROM `branch_events` WHERE `name` LIKE 'INSTALL' and created_at < CURRENT_DATE and latd_campaign like 'YTA_INF_%') as a left join (Select date(timestamp) as join_dt, student_id,udid from students where is_web=0 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.ask_date"
	//console.log(sql)
	return mysql.query(sql)
}

function getVidWatRetention(mysql){
	let sql = "Select d.join_dt, d.view_date,d.view_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select a.*, b.student_id, b.join_dt,c.view_date, c.count_q from ( SELECT referred_udid,latd_campaign FROM `branch_events` WHERE `name` LIKE 'INSTALL' and created_at < CURRENT_DATE and latd_campaign like 'YTA_INF_%' and latd_campaign not like 'YTA_INF_0001') as a left join (Select date(timestamp) as join_dt, student_id,udid from students where is_web=0 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(created_at) as view_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at<CURRENT_DATE and student_id >100 group by student_id, date(created_at)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.view_date"
	//console.log(sql)
	return mysql.query(sql)
}

function getTotViews(mysql){
	let sql = "Select watch_dt, d.latd_campaign, count(d.view_id),count( distinct d.student_id) from (Select date(v.created_at) as watch_dt, c.latd_campaign, v.view_id, v.student_id from (SELECT a.latd_campaign, b.student_id FROM `branch_events` as a left JOIN `students` as b on a.referred_udid=b.udid where `name` LIKE 'INSTALL' and a.latd_campaign like 'YTA_INF_%' and a.latd_campaign not like 'YTA_INF_0001') as c left join `video_view_stats` as v on c.student_id=v.student_id WHERE date(v.created_at) = DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)) as d group by watch_dt, d.latd_campaign"
	//console.log(sql)
	return mysql.query(sql)
}

function getDistSrpId(mysql){
	let sql = "Select watch_dt, d.latd_campaign, count(distinct d.parent_id) from (Select date(v.created_at) as watch_dt, c.latd_campaign, v.parent_id from (SELECT a.latd_campaign, b.student_id FROM `branch_events` as a left JOIN `students` as b on a.referred_udid=b.udid where `name` LIKE 'INSTALL' and a.latd_campaign like 'YTA_INF_%' and a.latd_campaign not like 'YTA_INF_0001') as c left join `video_view_stats` as v on c.student_id=v.student_id WHERE date(v.created_at) = DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and view_from like 'SRP') as d group by watch_dt, d.latd_campaign"
	//console.log(sql)
	return mysql.query(sql)
}

function getTotQsAsked(mysql){
	let sql = "Select ask_dt, d.latd_campaign, count(d.question_id), count( distinct d.student_id) from (Select date(v.timestamp) as ask_dt, c.latd_campaign, v.question_id, v.student_id from (SELECT a.latd_campaign, b.student_id FROM `branch_events` as a left JOIN `students` as b on a.referred_udid=b.udid where `name` LIKE 'INSTALL' and a.latd_campaign like 'YTA_INF_%' and a.latd_campaign not like 'YTA_INF_0001') as c left join `questions` as v on c.student_id=v.student_id WHERE date(v.timestamp) = DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)) as d group by ask_dt, d.latd_campaign"
	//console.log(sql)
	return mysql.query(sql)
}

function getNotOneFourDistSrp(mysql){
	let sql = "Select watch_dt, d.latd_campaign, count(distinct d.parent_id) from (Select date(v.created_at) as watch_dt, c.latd_campaign, v.parent_id from (SELECT a.latd_campaign, b.student_id FROM `branch_events` as a left JOIN `students` as b on a.referred_udid=b.udid where `name` LIKE 'INSTALL' and a.latd_campaign like 'YTA_INF_%' and a.latd_campaign not like 'YTA_INF_0001' and b.student_class<>14) as c left join `video_view_stats` as v on c.student_id=v.student_id WHERE date(v.created_at) = DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and view_from like 'SRP') as d group by watch_dt, d.latd_campaign"
	//console.log(sql)
	return mysql.query(sql)
}

function getNotOneFourQsAsked(mysql){
	let sql = "Select ask_dt, d.latd_campaign, count(d.question_id) from (Select date(v.timestamp) as ask_dt, c.latd_campaign, v.question_id from (SELECT a.latd_campaign, b.student_id FROM `branch_events` as a left JOIN `students` as b on a.referred_udid=b.udid where `name` LIKE 'INSTALL' and a.latd_campaign like 'YTA_INF_%' and a.latd_campaign not like 'YTA_INF_0001' and b.student_class<>14) as c left join `questions` as v on c.student_id=v.student_id WHERE date(v.timestamp) = DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)) as d group by ask_dt, d.latd_campaign"
	//console.log(sql)
	return mysql.query(sql)
}

function getNotOneFourVidViewCampWise(mysql){
	let sql = "Select watch_dt, d.latd_campaign, count(d.view_id) from (Select date(v.created_at) as watch_dt, c.latd_campaign, v.view_id from (SELECT a.latd_campaign, b.student_id FROM `branch_events` as a left JOIN `students` as b on a.referred_udid=b.udid where `name` LIKE 'INSTALL' and a.latd_campaign like 'YTA_INF_%' and a.latd_campaign not like 'YTA_INF_0001' and b.student_class<>14) as c left join `video_view_stats` as v on c.student_id=v.student_id WHERE date(v.created_at) = DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY)) as d group by watch_dt, d.latd_campaign"
	//console.log(sql)
	return mysql.query(sql)
}

function getNotOneFourRetention(mysql){
	let sql = "Select d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select a.*, b.student_id, b.join_dt,c.ask_date, c.count_q from ( SELECT referred_udid FROM `branch_events` WHERE `name` LIKE 'INSTALL' and created_at < CURRENT_DATE and latd_campaign like 'YTA_INF_%') as a left join (Select date(timestamp) as join_dt, student_id,udid from students where is_web=0 and student_class<>14 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.ask_date"
	//console.log(sql)
	return mysql.query(sql)
}

function getNotOneFourVidWatRetention(mysql){
	let sql = "Select d.join_dt, d.view_date,d.view_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select a.*, b.student_id, b.join_dt,c.view_date, c.count_q from ( SELECT referred_udid,latd_campaign FROM `branch_events` WHERE `name` LIKE 'INSTALL' and created_at < CURRENT_DATE and latd_campaign like 'YTA_INF_%' and latd_campaign not like 'YTA_INF_0001') as a left join (Select date(timestamp) as join_dt, student_id,udid from students where student_class<>14 and is_web=0 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(created_at) as view_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at<CURRENT_DATE and student_id >100 group by student_id, date(created_at)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.view_date"
	//console.log(sql)
	return mysql.query(sql)
}

function getCampWiseVidView(mysql){
	let sql = "Select d.latd_campaign,d.join_dt, d.view_date,d.view_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select a.*, b.student_id, b.join_dt,c.view_date, c.count_q from ( SELECT referred_udid,latd_campaign FROM `branch_events` WHERE `name` LIKE 'INSTALL' and created_at < CURRENT_DATE and latd_campaign like 'YTA_INF_%') as a left join (Select date(timestamp) as join_dt, student_id,udid from students where is_web=0 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(created_at) as view_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at<CURRENT_DATE and student_id >100 group by student_id, date(created_at)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.latd_campaign,d.join_dt, d.view_date"
	//console.log(sql)
	return mysql.query(sql)
}

function getCampWiseQsAsk(mysql){
	let sql = "Select d.latd_campaign,d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select a.*, b.student_id, b.join_dt,c.ask_date, c.count_q from ( SELECT referred_udid,latd_campaign FROM `branch_events` WHERE `name` LIKE 'INSTALL' and created_at < CURRENT_DATE and latd_campaign like 'YTA_INF_%') as a left join (Select date(timestamp) as join_dt, student_id,udid from students where is_web=0 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.latd_campaign,d.join_dt, d.ask_date"
	//console.log(sql)
	return mysql.query(sql)
}

async function sendMail(sendgrid, toMail, tempFilePath, helper) {
return new Promise(async function (resolve, reject) {
  try{	

  let from_email = new helper.Email("vivek@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Youtube Influence Report" + moment().subtract(1, 'd').format("YYYY-MM-DD");
  let content = new helper.Content("text/plain", "Report for " +""+ moment().subtract(1, 'd').format("YYYY-MM-DD"));
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

