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
let linkinstallsheet = workbook.addWorksheet('Link Installs' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let registrationsheet = workbook.addWorksheet('Registrations' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let channelsheet = workbook.addWorksheet('Channels' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let questionsheet = workbook.addWorksheet('Questions' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let questionntsheet = workbook.addWorksheet('Question NT' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let hwvhwvsheet = workbook.addWorksheet('HW,V, HWV' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let hwvhwvntsheet = workbook.addWorksheet('HW,V, HWV NT' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let imgqssheet = workbook.addWorksheet('ImgQues' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let imgqsntsheet = workbook.addWorksheet('ImgQues NT' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let imgqsbucksheet = workbook.addWorksheet('ImgQuesBuckets' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let videosheet = workbook.addWorksheet('Videos' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let videontsheet = workbook.addWorksheet('Videos NT' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let videotypesheet = workbook.addWorksheet('Video Type' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let parentidsheet = workbook.addWorksheet('Parent_id' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let parentidntsheet = workbook.addWorksheet('Parent_id NT' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let bucketvideosheet = workbook.addWorksheet('Bucket Videos' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let qsretentionsheet = workbook.addWorksheet('QuesRetention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let qsretentionstsheet = workbook.addWorksheet('QuesRetention (st table)' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let qsretentioncoresheet = workbook.addWorksheet('Question Retention Netcore' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let optinsheet = workbook.addWorksheet('OptIns' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let chatoptinsheet = workbook.addWorksheet('ChatOptins' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
// let optimgquesheet = workbook.addWorksheet('OptImgQues' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
// let alloptquesheet = workbook.addWorksheet('AllOptQues' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
// let optinretensheet = workbook.addWorksheet('OptinRetention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
// let videowaoptinsheet = workbook.addWorksheet('Videos by whatsapp optin' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let nontrackablesheet = workbook.addWorksheet('nOn trackable WHATSAPP ONLY (Total students)' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let textcohortsheet = workbook.addWorksheet('Text Cohort' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let parentidnewsheet = workbook.addWorksheet('Parent_id Bucket' + moment().subtract(1, 'd').format("YYYY-MM-DD"))

async function main (mysql){
	try{
		
		let promises = []
		
		promises.push(linkInstalls(mysql))
		promises.push(registration(mysql))
		promises.push(channel(mysql))
		promises.push(questions(mysql))
		promises.push(questionNt(mysql))
		promises.push(hwvhwv(mysql))
		promises.push(hwvhwvnt(mysql))
		promises.push(imgQs(mysql))
		promises.push(imgQsNt(mysql))
		promises.push(imgQsBuck(mysql))
		promises.push(video(mysql))
		promises.push(videoNt(mysql))
		promises.push(videoType(mysql))
		promises.push(parentId(mysql))
		promises.push(parentIdNt(mysql))
		promises.push(bucketVideo(mysql))
		promises.push(qsRetention(mysql))
		promises.push(qsRetentionSt(mysql))
		promises.push(qsRetentionNtcr(mysql))
		promises.push(optIns(mysql))
		promises.push(chatOptIns(mysql))
		// promises.push(optImgQues(mysql))
		// promises.push(allOptQues(mysql))
		// promises.push(optinRetention(mysql))
		// promises.push(videoWhatsappOptin(mysql))
		promises.push(nonTrackableWhatsapp(mysql))
		promises.push(textCohort(mysql))
		promises.push(parentIdNew(mysql))
		await Promise.all(promises)
		var tempFilePath = "Report" +"" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".xlsx"
	
		//console.log("tempFilePath:", tempFilePath)
		workbook.xlsx.writeFile(tempFilePath).then(async function(){

			await sendMail(sendgrid, "gaurang.sinha@doubtnut.com",tempFilePath, helper)
	       	await sendMail(sendgrid, "tanuj@doubtnut.com",tempFilePath, helper)
	      	await sendMail(sendgrid, "gunjan@doubtnut.com",tempFilePath, helper)
	     	await sendMail(sendgrid, "shalu@doubtnut.com",tempFilePath, helper)
	     	
	  
	     	
	     	console.log('Workbook created with all sheets')
			const files = ['templinkinstalls.xlsx','tempregistration.xlsx','tempchannel.xlsx','tempquestion.xlsx','temphwvhwv.xlsx','temphwvhwvnt.xlsx','tempimgqs.xlsx','tempimgqsnt.xlsx','tempimgqsbuck.xlsx','tempvideo.xlsx','tempvideotype.xlsx','tempparentid.xlsx','tempparentidnt.xlsx','tempquestionnt.xlsx','tempbucketvideo.xlsx','tempqsretention.xlsx','tempqsretentionst.xlsx','tempoptins.xlsx','tempqsretentioncore.xlsx','tempchatoptins.xlsx','tempvideont.xlsx','tempnontrackable.xlsx','temptextcohort.xlsx','tempparentidnew.xlsx',tempFilePath]
			
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
		mysql.connection.end();
	}catch(e){
		console.log(e)
	}
}

async function linkInstalls(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getLinkInstallData(mysql)
			//console.log(data)
			let  count_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_id=data[i]['count(id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		linkinstallsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		linkinstallsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./templinkinstalls.xlsx').then(function(){
       		console.log('linkinstallsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(linkinstallsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function registration(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getRegistrationData(mysql)
			//console.log(data)
			let  count_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_student_id =data[i]['count(student_id)']
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
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(registrationsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function channel(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getChannelData(mysql)
			//console.log(data)
			let fingerprints,count_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.fingerprints =data[i]['fingerprints']
				sample.count_student_id =data[i]['count(student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		channelsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		channelsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempchannel.xlsx').then(function(){
       		console.log('channelsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(channelsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function questions(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getQuestionsData(mysql)
			//console.log(data)
			let count_question_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_question_id =data[i]['count(question_id)']
				sample.count_distinct_student_id =data[i]['count(distinct student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		questionsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		questionsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempquestion.xlsx').then(function(){
       		console.log('questionsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(questionsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function questionNt(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getQuestionNtData(mysql)
			//console.log(data)
			let count_question_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_question_id =data[i]['count(question_id)']
				sample.count_distinct_student_id =data[i]['count(distinct student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		questionntsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		questionntsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempquestionnt.xlsx').then(function(){
       		console.log('questionntsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(questionntsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function hwvhwv(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getHwvhwvData(mysql)
			//console.log(data)
			let is_skipped,count_question_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.is_skipped =data[i]['is_skipped']
				sample.count_question_id =data[i]['count(question_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		hwvhwvsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		hwvhwvsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temphwvhwv.xlsx').then(function(){
       		console.log('hwvhwvsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(hwvhwvsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function hwvhwvnt(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getHwvhwvNtData(mysql)
			//console.log(data)
			let is_skipped,count_question_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.is_skipped =data[i]['is_skipped']
				sample.count_question_id =data[i]['count(question_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		hwvhwvntsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		hwvhwvntsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temphwvhwvnt.xlsx').then(function(){
       		console.log('hwvhwvntsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(hwvhwvntsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function imgQs(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getImgQsData(mysql)
			//console.log(data)
			let count_question_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_question_id =data[i]['count(question_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		imgqssheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		imgqssheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempimgqs.xlsx').then(function(){
       		console.log('imgqssheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(imgqssheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}
async function imgQsNt(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getImgQsNtData(mysql)
			//console.log(data)
			let count_question_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_question_id =data[i]['count(question_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		imgqsntsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		imgqsntsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempimgqsnt.xlsx').then(function(){
       		console.log('imgqsntsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(imgqsntsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function imgQsBuck(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getImgQsBuckData(mysql)
			//console.log(data)
			let count_q,count_a_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_q =data[i]['count_q']
				sample.count_a_student_id =data[i]['count(a.student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		imgqsbucksheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		imgqsbucksheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempimgqsbuck.xlsx').then(function(){
       		console.log('imgqsbucksheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(imgqsbucksheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function video(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getVideoData(mysql)
			//console.log(data)
			let count_view_id, count_distinct_student_id, sum_engage_time, sum_video_time
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_view_id=data[i]['count(view_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				sample.sum_engage_time =data[i]['sum(engage_time)']
				sample.sum_video_time =data[i]['sum(video_time)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		videosheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		videosheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvideo.xlsx').then(function(){
       		console.log('videosheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(videosheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function videoNt(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getVideoNtData(mysql)
			//console.log(data)
			let count_view_id, count_distinct_student_id, sum_engage_time, sum_video_time
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_view_id=data[i]['count(view_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				sample.sum_engage_time =data[i]['sum(engage_time)']
				sample.sum_video_time =data[i]['sum(video_time)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		videontsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		videontsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvideont.xlsx').then(function(){
       		console.log('videontsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(videontsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function videoType(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getVideoTypeData(mysql)
			//console.log(data)
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.type=data[i]['type']
				sample.count_view_id =data[i]['count(a.view_id)']
				
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		videotypesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		videotypesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvideotype.xlsx').then(function(){
       		console.log('videotypesheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(videotypesheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function parentId(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getParentIdData(mysql)
			//console.log(data)
			let count_distinct_parent_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_distinct_parent_id =data[i]['count(DISTINCT parent_id)']	
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		parentidsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		parentidsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempparentid.xlsx').then(function(){
       		console.log('parentidsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(parentidsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function parentIdNt(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getParentIdNtData(mysql)
			//console.log(data)
			let count_distinct_parent_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_distinct_parent_id =data[i]['count(DISTINCT parent_id)']	
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		parentidntsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		parentidntsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempparentidnt.xlsx').then(function(){
       		console.log('parentidntsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(parentidntsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function bucketVideo(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getBucketVideoData(mysql)
			//console.log(data)
			let count_v,count_a_student_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_v =data[i]['count_v']
				sample.count_a_student_id =data[i]['count(a.student_id)']	
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		bucketvideosheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		bucketvideosheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempbucketvideo.xlsx').then(function(){
       		console.log('bucketvideosheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(bucketvideosheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function qsRetention(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getQsRetentionData(mysql)
			//console.log(data)
			let join_dt, ask_date, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.join_dt =data[i]['join_dt']
				sample.ask_date =data[i]['ask_date']
				sample.day_num =data[i]['day_num']	
				sample.count_s =data[i]['count_s']	
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		qsretentionsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		qsretentionsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempqsretention.xlsx').then(function(){
       		console.log('qsretentionsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(qsretentionsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function qsRetentionSt(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getQsRetentionStData(mysql)
			//console.log(data)
			let join_dt, ask_date, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.join_dt =data[i]['join_dt']
				sample.ask_date =data[i]['ask_date']
				sample.day_num =data[i]['day_num']	
				sample.count_s =data[i]['count_s']	
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		qsretentionstsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		qsretentionstsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempqsretentionst.xlsx').then(function(){
       		console.log('qsretentionstsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(qsretentionstsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function qsRetentionNtcr(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getQsRetentionNcData(mysql)
			//console.log(data)
			let join_dt, ask_date, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.join_dt =data[i]['join_dt']
				sample.ask_date =data[i]['ask_date']
				sample.day_num =data[i]['day_num']	
				sample.count_s =data[i]['count_s']	
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		qsretentioncoresheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		qsretentioncoresheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempqsretentioncore.xlsx').then(function(){
       		console.log('qsretentioncoresheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(qsretentioncoresheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})
}

async function optIns(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getOptInsData(mysql)
			//console.log(data)
			let count_phone
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_phone =data[i]['count(phone)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		optinsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		optinsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempoptins.xlsx').then(function(){
       		console.log('optinsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(optinsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function chatOptIns(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getChatOptInsData(mysql)
			//console.log(data)
			let  count_b_student_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_b_student_id =data[i]['count(b.student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		chatoptinsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		chatoptinsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempchatoptins.xlsx').then(function(){
       		console.log('chatoptinsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(chatoptinsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function optImgQues(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getOptImgQuesData(mysql)
			//console.log(data)date(d.timestamp),count(d.question_id),count(DISTINCT d.student_id)
			let  count_question_id, count_distinct_student_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_question_id =data[i]['count(a.question_id)']
				sample.count_distinct_student_id = data[i]['count(DISTINCT a.student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		optimgquesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		optimgquesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempoptimgque.xlsx').then(function(){
       		console.log('optimgquesheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(optimgquesheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function allOptQues(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getAllOptQuesData(mysql)
			//console.log(data)date(d.timestamp),count(d.question_id),count(DISTINCT d.student_id)
			let count_question_id, count_distinct_student_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_question_id =data[i]['count(a.question_id)']
				sample.count_distinct_student_id = data[i]['count(DISTINCT a.student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		alloptquesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		alloptquesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempalloptque.xlsx').then(function(){
       		console.log('alloptquesheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(alloptquesheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function optinRetention(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getOptinRetentionData(mysql)
			//console.log(data)date(d.timestamp),count(d.question_id),count(DISTINCT d.student_id)
			let join_dt, count_d_question_id, count_distinct_student_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.join_dt =data[i]['join_dt']
				sample.count_d_question_id =data[i]['count(d.question_id)']
				sample.count_distinct_student_id = data[i]['count(DISTINCT d.student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		optinretensheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		optinretensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempoptinreten.xlsx').then(function(){
       		console.log('optinretensheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(optinretensheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function videoWhatsappOptin(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getVideoWhatsappOptinData(mysql)
			//console.log(data)date(d.timestamp),count(d.question_id),count(DISTINCT d.student_id)
			let  count_view_id, count_distinct_student_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_view_id =data[i]['count(a.view_id)']
				sample.count_distinct_student_id = data[i]['count(DISTINCT a.student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		videowaoptinsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		videowaoptinsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvideowaoptin.xlsx').then(function(){
       		console.log('videowaoptinsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(videowaoptinsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}


async function nonTrackableWhatsapp(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getNonTrackable(mysql)
			//console.log(data)date(d.timestamp),count(d.question_id),count(DISTINCT d.student_id)
			let date_timestamp, count_distinct_student_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.date_timestamp =data[i]['DATE(TIMESTAMP)']
				sample.count_distinct_student_id = data[i]['COUNT(DISTINCT student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	nontrackablesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		nontrackablesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnontrackable.xlsx').then(function(){
       		console.log('nontrackablesheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(nontrackablesheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function textCohort(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getTextCohort(mysql)
			
			let join_dt, view_dt, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.join_dt =data[i]['join_dt']
				sample.view_dt = data[i]['view_dt']
				sample.day_num = data[i]['day_num']
				sample.count_s = data[i]['count_s']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	textcohortsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		textcohortsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temptextcohort.xlsx').then(function(){
       		console.log('textcohortsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(textcohortsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

} 

async function parentIdNew(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getParentIdNew(mysql)
			
			let count_v, count_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_v = data[i]['count_v']
				sample.count_student_id = data[i]['count(a.student_id)']
				
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	parentidnewsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		parentidnewsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempparentidnew.xlsx').then(function(){
       		console.log('parentidnewsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(parentidnewsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}




function getLinkInstallData(mysql){
	let sql = "SELECT count(id)  FROM `branch_events_2020` WHERE name like 'INSTALL' and `latd_campaign` LIKE 'WHA_NCF' and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	//console.log(sql)
	return mysql.query(sql)
}

function getRegistrationData(mysql){
	let sql = "SELECT count(student_id) FROM `whatsapp_students` WHERE timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE"
	//console.log(sql)
	return mysql.query(sql)
}

function getChannelData(mysql){
	let sql = "SELECT fingerprints,count(student_id) FROM `whatsapp_students` WHERE timestamp>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE GROUP by fingerprints"
	//console.log(sql)
	return mysql.query(sql)
}

function getQuestionsData(mysql){
	let sql = "select count(question_id), count(distinct student_id) from questions WHERE student_id >100 and doubt like 'WHATSAPP' and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE"
	//console.log(sql)
	return mysql.query(sql)
}

function getQuestionNtData(mysql){
	let sql = "select count(question_id), count(distinct student_id) from questions WHERE student_id >100 and doubt like 'WHATSAPP_NT' and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<(CURRENT_DATE)"
	return mysql.query(sql)
}


function getHwvhwvData(mysql){
	let sql = "SELECT is_skipped,count(question_id),count(DISTINCT student_id) FROM `questions` where doubt like 'WHATSAPP' and timestamp>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE GROUP by is_skipped "
	//console.log(sql)
	return mysql.query(sql)
}

function getHwvhwvNtData(mysql){
	let sql = "SELECT is_skipped,count(question_id),count(DISTINCT student_id) FROM `questions` where doubt like 'WHATSAPP_NT' and timestamp>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE GROUP by is_skipped"
	return mysql.query(sql)
}

function getImgQsData(mysql){
	let sql = "SELECT count(question_id),count(DISTINCT student_id) FROM `questions` where doubt like 'WHATSAPP' and is_skipped<8 and (question_image is not NULL or question_image not like '') and timestamp>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE "
	//console.log(sql)
	return mysql.query(sql)
}

function getImgQsNtData(mysql){
	let sql ="SELECT count(question_id),count(DISTINCT student_id) FROM `questions` where doubt like 'WHATSAPP_NT' and is_skipped<8 and (question_image is not NULL or question_image not like '') and timestamp>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<(CURRENT_DATE)"
	return mysql.query(sql)
}

function getImgQsBuckData(mysql){
	let sql = "Select a.count_q, count(a.student_id) from (SELECT student_id, case when count(question_id)>5 then 'MT5' else count(question_id) end as count_q FROM `questions` where doubt like 'WHATSAPP' and is_skipped <8 and (question_image is not NULL or question_image not like '') and timestamp>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE group by student_id) as a group by a.count_q"
	//console.log(sql)
	return mysql.query(sql)
}

function getVideoData(mysql){
	let sql = "SELECT count(view_id),count(DISTINCT student_id),sum(engage_time),sum(video_time) FROM `video_view_stats` where source like 'wha' and created_at>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	//console.log(sql)
	return mysql.query(sql)
}

function getVideoNtData(mysql){
	let sql = "SELECT count(view_id),count(DISTINCT student_id),sum(engage_time),sum(video_time) FROM `video_view_stats` where source like 'wha_nt' and created_at>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	return mysql.query(sql)
}

function getVideoTypeData(mysql){
	let sql = "SELECT a.type,count(a.view_id) from (select view_id, student_id, parent_id, case when answer_video LIKE 'text' then 'text' else 'video' end as type FROM `video_view_stats` where source like 'wha' and created_at>DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) and created_at<CURRENT_DATE) as a group BY a.type"
	//console.log(sql)
	return mysql.query(sql)
}

function getParentIdData(mysql){
	let sql = "SELECT count(DISTINCT parent_id) FROM `video_view_stats` where source like 'wha' and created_at>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	//console.log(sql)
	return mysql.query(sql)
}

function getParentIdNtData(mysql){
	let sql ="SELECT count(DISTINCT parent_id) FROM `video_view_stats` where source like 'wha_nt' and created_at>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<(CURRENT_DATE)"
	return mysql.query(sql)
}

function getBucketVideoData(mysql){
	let sql = "Select a.count_v, count(a.student_id) from (SELECT student_id, case when count(view_id)>3 then 'MT3' else count(view_id) end as count_v FROM `video_view_stats` where source like 'wha' and created_at>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE group by student_id) as a group by a.count_v"
	//console.log(sql)
	return mysql.query(sql)
}

function getQsRetentionData(mysql){
	let sql = "Select d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select b.student_id, b.join_dt,c.ask_date, c.count_q from (Select date(timestamp) as join_dt, student_id from whatsapp_students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAL 40 DAY) and timestamp<CURRENT_DATE) as b left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where doubt like 'WHATSAPP' and question_image is not NULL and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 40 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.ask_date"
	//console.log(sql)
	return mysql.query(sql)
}

function getQsRetentionStData(mysql){
	let sql = "Select d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select b.student_id, b.join_dt,c.ask_date, c.count_q from (Select date(timestamp) as join_dt, student_id from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAL 31 DAY) and timestamp<CURRENT_DATE) as b left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where doubt like 'WHATSAPP' and question_image is not NULL and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 31 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.ask_date"
	//console.log(sql)
	return mysql.query(sql)
}

function getQsRetentionNcData(mysql){
	let sql ="Select d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select b.student_id, b.join_dt,c.ask_date, c.count_q from (Select date(timestamp) as join_dt, student_id from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAL 31 DAY) and timestamp<CURRENT_DATE) as b left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where doubt like 'WHATSAPP_NT' and question_image is not NULL and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 31 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.ask_date"
	return mysql.query(sql)
}

function getOptInsData(mysql){
	let sql = "SELECT count(phone) FROM `whatsapp_optins` where source in (1,2,3,4,10) and created_at>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	//console.log(sql)
	return mysql.query(sql)
}

function getChatOptInsData(mysql){
	let sql = "SELECT count(b.student_id) from (SELECT phone FROM `whatsapp_optins` WHERE source in (1,2,3,4,10)) as a left join (SELECT student_id,mobile from whatsapp_students where timestamp>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE) as b on a.phone=b.mobile and b.mobile is not NULL"
	//console.log(sql)
	return mysql.query(sql)
}


function getOptImgQuesData(mysql){
	let sql = "SELECT count(DISTINCT a.student_id),count(a.question_id) from (SELECT student_id,question_id FROM `questions` where doubt like 'WHATSAPP'  and is_skipped<8 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE and (question_image is not NULL or question_image not like '')) as a left join (SELECT c.student_id from (SELECT phone from `whatsapp_optins` where source in (1,2,3,4,10)) as b left join (SELECT student_id,mobile from `whatsapp_students` where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE) as c on b.phone=c.mobile where c.mobile is not NULL) as d on a.student_id=d.student_id where d.student_id is not null"
	//console.log(sql)
	return mysql.query(sql)
}

function getAllOptQuesData(mysql){
	let sql = "SELECT count(DISTINCT a.student_id),count(a.question_id) from (SELECT student_id,question_id FROM `questions` where doubt like 'WHATSAPP'  and is_skipped<8 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE and (question_image is not NULL or question_image not like '')) as a left join (SELECT c.student_id from (SELECT phone from `whatsapp_optins` where source in (1,2,3,4,10)) as b left join (SELECT student_id,mobile from `whatsapp_students`) as c on b.phone=c.mobile where c.mobile is not NULL) as d  on a.student_id=d.student_id where d.student_id is not null"
	//console.log(sql)
	return mysql.query(sql)
}

function getOptinRetentionData(mysql){
	let sql = "select join_dt,count(d.question_id),count(DISTINCT d.student_id) from questions as d left join (SELECT date(b.timestamp) as join_dt,b.student_id FROM `whatsapp_optins` as a left join students as b on a.phone=b.mobile where b.mobile is not NULL and a.source in (1,2,3,4,10)) as c on d.student_id=c.student_id where c.student_id is not NULL and d.doubt like 'WHA%' and date(d.timestamp)=join_dt+1 GROUP by date(d.timestamp) order by date(d.timestamp) desc"
	//console.log(sql)
	return mysql.query(sql)
}

function getVideoWhatsappOptinData(mysql){
	let sql = "SELECT count(DISTINCT a.student_id),count(a.view_id) from (SELECT student_id,view_id FROM `video_view_stats` where source like 'WHA' and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE) as a left join (SELECT c.student_id from (SELECT phone from `whatsapp_optins` where source in (1,2,3,4,10)) as b left join (SELECT student_id,mobile from `whatsapp_students`) as c on b.phone=c.mobile where c.mobile is not NULL) as d on a.student_id=d.student_id where d.student_id is not null"
	//console.log(sql)
	return mysql.query(sql)
}

function getNonTrackable(mysql){
	let sql ="SELECT DATE(TIMESTAMP),COUNT(DISTINCT student_id) FROM `students` WHERE fingerprints LIKE 'WA%' and is_web=2 AND DATE(TIMESTAMP)>'2019-10-03' GROUP BY DATE(TIMESTAMP)"
	return mysql.query(sql)
}

function getTextCohort(mysql){
	let sql ="Select d.join_dt, d.view_dt,d.view_dt-d.join_dt as day_num, count(d.student_id) as count_s from ( Select b.student_id, b.join_dt,c.view_dt, c.count_q from (Select date(timestamp) as join_dt, student_id from whatsapp_students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 31 DAY) and timestamp<CURRENT_DATE) as b left JOIN (SELECT student_id, date(created_at) as view_dt,count(question_id) as count_q from video_view_stats where source like 'WHA' AND answer_video LIKE 'text' and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 31 DAY) and created_at<CURRENT_DATE and student_id >100 group by student_id, date(created_at)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt,d.view_dt"
	return mysql.query(sql)
}

function getParentIdNew(mysql){
	let sql ="Select a.count_v, count(a.student_id) from ( SELECT student_id, case when count(DISTINCT parent_id)>5 then 'MT5' else count(DISTINCT parent_id) end as count_v FROM `video_view_stats` where source like 'wha' and created_at>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE group by student_id) as a group by a.count_v"
	return mysql.query(sql)
}

async function sendMail(sendgrid, toMail, tempFilePath, helper) {
return new Promise(async function (resolve, reject) {
  try{	

  let from_email = new helper.Email("vivek@doubtnut.com")
  let to_email = new helper.Email(toMail)
  let subject = "Whatsapp Report for " + moment().subtract(1, 'd').format("YYYY-MM-DD")
  let content = new helper.Content("text/plain", "Report for " +""+ moment().subtract(1, 'd').format("YYYY-MM-DD"))
  var attachment = new helper.Attachment()
  var file1 = fs.readFileSync(tempFilePath)
  var base64File1 = new Buffer(file1).toString('base64')
  attachment.setContent(base64File1)
  attachment.setType('text/xlsx')
  attachment.setFilename(tempFilePath)
  attachment.setDisposition('attachment')
  let mail = new helper.Mail(from_email, subject, to_email, content)
  mail.addAttachment(attachment)
  var sg = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
   body: mail.toJSON()
  })

  sendgrid.API(sg, function (error, response) {
    console.log(response.statusCode)
    console.log(response.body)
    console.log(response.headers)
    return resolve(mail)
  })
  }catch(e){
  console.log(e)
  reject(e)
 }
})
}