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
let onboardsheet = workbook.addWorksheet('Total Students in student_onboard table' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let registrationsheet = workbook.addWorksheet('Total Registrations' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let totbranchuniqsheet = workbook.addWorksheet('Total branch unique installs' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let branchinstallsheet = workbook.addWorksheet('Total Branch Installs' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let branchpaidsheet = workbook.addWorksheet('Branch Paid Installs' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let allreinstallsheet = workbook.addWorksheet('Total Reinstalls ' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let loginusersheet = workbook.addWorksheet('Login Users ' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let newstudentquestionsheet = workbook.addWorksheet('No. of new students who asked questions' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let newstudentvideosheet = workbook.addWorksheet('No. of new students who watch videos' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let newstudentvideomatchsheet = workbook.addWorksheet('No. of new students who watched videos from match page' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let totalstudentsquestionsheet =workbook.addWorksheet('Total students who ask questions' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let typedquestionsheet = workbook.addWorksheet('Number of typed questions asked' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let videoviewsheet = workbook.addWorksheet('Number of video views' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let videomorethanzerosheet =workbook.addWorksheet('Number of video views>0' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let contestvidviewsheet = workbook.addWorksheet('Contest video views' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let stuvidmatsheet =workbook.addWorksheet('Students who watch videos from match page' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let campinstallsheet =workbook.addWorksheet('Campaign installs' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let viewpagesheet =workbook.addWorksheet('View_from pages' + moment().subtract(1, 'd').format("YYYY-MM-DD"))

let classdivsheet =workbook.addWorksheet('Class division' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let langsplitsheet =workbook.addWorksheet('Language split' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let organicsplitsheet =workbook.addWorksheet('Organic split' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let marchrateremainingsheet =workbook.addWorksheet('Match Rate remaining'+ moment().subtract(1, 'd').format("YYYY-MM-DD"))
let adwordsfbsheet =workbook.addWorksheet('Adwords and facebook installs' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let mocktestclasssplitsheet =workbook.addWorksheet('Mock Test Class Split' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let quizmocksheet =workbook.addWorksheet('Quiz and mock test' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let matchedvideoslangsplitsheet =workbook.addWorksheet('Matched videos asked Language Split'+ moment().subtract(1, 'd').format("YYYY-MM-DD"))
let qsaskstulangsplitsheet =workbook.addWorksheet('Questions Asked Students Language Split' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let refsentidsheet=workbook.addWorksheet('Referrals & sent id' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let campaignvidviewsheet=workbook.addWorksheet('Campaign video view retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let campaignclasplitsheet=workbook.addWorksheet('Campaignwise class split' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let qsd1sevensheet=workbook.addWorksheet('Question(D1-7)' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let videodonetosevensheet=workbook.addWorksheet('Video(D1-7)' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let campqidsheet=workbook.addWorksheet('Campaign question D1' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let campviddonesheet=workbook.addWorksheet('Campaign video D1' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let qsdonenotonefoursheet=workbook.addWorksheet('Question D1 <>14' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let vidonenotonefoursheet=workbook.addWorksheet('Video D1 <>14' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let matchpagedonesheet=workbook.addWorksheet('Match page D1' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let camponefourdonevidretensheet = workbook.addWorksheet('Campaign <>14 D1 video view retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let camponefourdoneqsaskretensheet = workbook.addWorksheet('Campaign <>14 D1 question ask retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let classquestiondonesheet = workbook.addWorksheet('Classwise question D1' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let classvideodonesheet = workbook.addWorksheet('Classwise video D1' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
// let webquestionretensheet = workbook.addWorksheet('Web question retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
// let webvideoretensheet = workbook.addWorksheet('Web video retention' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let webtoappinstallsheet = workbook.addWorksheet('Web to app install' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let totregnewusersheet = workbook.addWorksheet('Total Registrations ( New users)' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let channelwiseregsheet =workbook.addWorksheet('Channel wise registration' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let questiontotusersheet =workbook.addWorksheet('Question (Total users)' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let questionwithimagesheet =workbook.addWorksheet('Question with image' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let questionverticalimagesheet =workbook.addWorksheet('Questions with vertical image' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let videoswatchsheet = workbook.addWorksheet('Videos watched' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let distparentidsheet =workbook.addWorksheet('Dsitinct parent_id' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let doneretensheet = workbook.addWorksheet('D1 Retention (question ask with image to question ask with image)' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let vidviewsubeletwesheet = workbook.addWorksheet('Video views by subject 11-12' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let vidviewsubninetensheet = workbook.addWorksheet('Video views by subject 9-10' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let subwisematrateeletwesheet = workbook.addWorksheet('Subjectwise match rate 11-12' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let subwisematrateninetensheet = workbook.addWorksheet('Subjectwise match rate 9-10' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let questionasksubeletwesheet = workbook.addWorksheet('Questions asked by subject 11-12' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let questionasksubninetensheet = workbook.addWorksheet('Questions asked by subject 9-10' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
let texttypevidtypesheet = workbook.addWorksheet('Text type and Video Type' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
async function main (mysql){
	try{
		
		let promises = []
		
		promises.push(onboard(mysql))
		promises.push(getRegistrations(mysql))
		promises.push(getTotBranchUniqInstall(mysql))
		promises.push(getBranchInstall(mysql))
		promises.push(getBranchPaid(mysql))
		promises.push(getTotalReinstall(mysql))
		promises.push(getLoginUsers(mysql))
		promises.push(getQuestion(mysql))
		promises.push(getVideo(mysql))
		promises.push(getVideoMatch(mysql))
		promises.push(getStuTotalQuestion(mysql))
		promises.push(getTypedQuestion(mysql))
		promises.push(getVideoView(mysql))
		promises.push(getVideoViewMore(mysql))
		promises.push(getConVidView(mysql))
		promises.push(getStuVidMat(mysql))
		promises.push(getCamInstall(mysql))
		promises.push(getViewPages(mysql))
		promises.push(getClassDiv(mysql))
		promises.push(getLangSplit(mysql))
		promises.push(getOrganicSplit(mysql))
		promises.push(getMarchRateRemaining(mysql))
		promises.push(getAdwordsFb(mysql))
		promises.push(getMockClassSplit(mysql))
		promises.push(getQuizMock(mysql))
		promises.push(getMatchAskLangSplit(mysql))
		promises.push(getQsAskLangSplit(mysql))
		promises.push(getRefAndSentId(mysql))
		promises.push(getCampVidViewRet(mysql))
		//promises.push(getCampQsAskReten(mysql))
		promises.push(getCampClassSplit(mysql))
		promises.push(getQuestionDoneToSeven(mysql))
		promises.push(getVideoOneToSeven(mysql))
		promises.push(getCampaignQid(mysql))
		promises.push(getCampaignVidDone(mysql))
		promises.push(getQuestionDoneNotOneFour(mysql))
		promises.push(getVidDOneNotOneFour(mysql))
		promises.push(getMatchPageDone(mysql))
		promises.push(getCampOneFourVid(mysql))
		promises.push(getCampOneFourQsAskRet(mysql))
		promises.push(getClassWiseQsDone(mysql))
		promises.push(getClassVidDone(mysql))
		// promises.push(getWebQuestionReten(mysql))
		// promises.push(getWebVideoReten(mysql))
		promises.push(getWebToAppInstalls(mysql))
		promises.push(getTotRegNewUsers(mysql))
		promises.push(getChannelWiseReg(mysql))
		promises.push(getQuestionTotUsers(mysql))
		promises.push(getQsWithImage(mysql))
		promises.push(getQsVerticalImage(mysql))
		promises.push(getVideosWatch(mysql))
		promises.push(getDistinctParentId(mysql))
		promises.push(getDoneRet(mysql))
		promises.push(getVidViewsSubEleTwe(mysql))
		promises.push(getVidViewsSubNineTen(mysql))
		promises.push(getSubWiseMatchRateEleTwe(mysql))
		promises.push(getSubWiseMatchRateNineTen(mysql))
		promises.push(getQsAskSubEleTwe(mysql))
		promises.push(getQsAskSubNineTen(mysql))
		promises.push(getTextTypeVidType(mysql))
		await Promise.all(promises)
		var tempFilePath = "Report" +"" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".xlsx"
	
		//console.log("tempFilePath:", tempFilePath)
		workbook.xlsx.writeFile(tempFilePath).then(async function(){

			await sendMail(sendgrid, "vivek@doubtnut.com", tempFilePath,helper)
	     	// await sendMail(sendgrid, "gagan@doubtnut.com",tempFilePath, helper)
	     	// await sendMail(sendgrid, "uday@doubtnut.com", tempFilePath, helper)
	     	await sendMail(sendgrid, "aditya@doubtnut.com",tempFilePath, helper)
	     	await sendMail(sendgrid, "tanushree@doubtnut.com",tempFilePath, helper)
	     	await sendMail(sendgrid, "akanksha@doubtnut.com",tempFilePath, helper)
	     	await sendMail(sendgrid, "gunjan@doubtnut.com",tempFilePath, helper)
	     	await sendMail(sendgrid, "shobhit.gaur@doubtnut.com",tempFilePath, helper)
	     	await sendMail(sendgrid, "shalu@doubtnut.com",tempFilePath, helper)
	     	await sendMail(sendgrid, "shivangi.bathla@doubtnut.com",tempFilePath, helper)
	     	
	     	     	
			console.log('Workbook created with all sheets')
			const files = ['temponboard.xlsx','tempregistration.xlsx','tempbranchinstall.xlsx','tempbranchpaid.xlsx','temptotalreinstall.xlsx','temploginuser.xlsx','tempnewstudentquestion.xlsx','tempnewstudentvideo.xlsx','tempnewstudentvideomatch.xlsx','temptotalstudentsquestion.xlsx','temptypedquestion.xlsx','tempvideoview.xlsx','tempvideomorethanzero.xlsx','tempcontestvidview.xlsx','tempstuvidmat.xlsx','tempcaminstall.xlsx','tempviewpage.xlsx','tempclassdiv.xlsx','templangsplit.xlsx','temporganicsplit.xlsx','tempmarchrateremaining.xlsx','tempadwordsfb.xlsx','tempmocktestclass.xlsx','tempquizmock.xlsx','tempmatchedvidlangsplit.xlsx','tempqsaskstulangsplit.xlsx','temprefsentid.xlsx','tempcampaignvidview.xlsx','tempcampaignclasplit.xlsx','tempqsd1seven.xlsx','tempvideodonetoseven.xlsx','tempcampqid.xlsx','tempqsdonenotonefour.xlsx','tempcampviddone.xlsx','tempvidonenotonefour.xlsx','tempmatchpagedone.xlsx','tempcamponefourdoneqsaskreten.xlsx','tempcamponefoureten.xlsx','temptotbranchuniq.xlsx','tempclassqsdone.xlsx','tempclassvidone.xlsx','tempwebtoappinstall.xlsx','temptotregnewuser.xlsx','tempchannelwisereg.xlsx','tempquestiontotuser.xlsx','tempquestionwithimage.xlsx','tempquestionverticalimage.xlsx','tempvideoswatch.xlsx','tempdistparentid.xlsx','tempdoneretensheet.xlsx','tempvidviewsubeletwesheet.xlsx','tempvidviewsubninetensheet.xlsx','tempsubwisematrateeletwesheet.xlsx','tempsubwisematrateninetensheet.xlsx','tempquestionasksubeletwesheet.xlsx','tempquestionasksubninetensheet.xlsx','temptexttypevidtypesheet.xlsx',tempFilePath]
			
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
		mysql.connection.end()
    
	}catch(e){
		console.log(e)
	}
}

async function onboard(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getData(mysql)
			//console.log(data)
			let  count_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				
				count_id =data[i]['count(id)']
				sample ={}
				sample.count_id =count_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		onboardsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		onboardsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temponboard.xlsx').then(function(){
       		console.log('onboardsheet is written')
       			 	// resolve('temponboard.xlsx')

     	})
     	resolve(onboardsheet)

		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function getRegistrations(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getReg(mysql)
			//console.log(data)
			let count_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_student_id =data[i]['count(student_id)']
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
       			//resolve('tempregistration.xlsx')
     	})
	 		resolve(registrationsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function getTotBranchUniqInstall(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getBranchUniq(mysql)
			//console.log(data)
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_distinct_referred_udid =data[i]['count(Distinct referred_udid)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		totbranchuniqsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		totbranchuniqsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temptotbranchuniq.xlsx').then(function(){
       		console.log('totbranchuniqsheet is written')
       		
     	})
	 	resolve(totbranchuniqsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function getBranchInstall(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getBranch(mysql)
			//console.log(data)
			let  count_referred_udid
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_referred_udid =data[i]['count(referred_udid)']
				sample ={}
				sample.count_referred_udid =count_referred_udid
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		branchinstallsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		branchinstallsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempbranchinstall.xlsx').then(function(){
       		console.log('branchinstallsheet is written')
       		// resolve('tempbranchinstall.xlsx')
     	})
	 	resolve(branchinstallsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function getBranchPaid(mysql){
	return new Promise (async function(resolve,reject){
		try{
				
			let data = await getPaid(mysql)
			//console.log(data)
			let count_referred_udid
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				
				count_referred_udid =data[i]['count(referred_udid)']
				sample ={}
				sample.count_referred_udid =count_referred_udid
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		 branchpaidsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		 branchpaidsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempbranchpaid.xlsx').then(function(){
       		console.log('branchpaidsheet is written')
       		// resolve('tempbranchpaid.xlsx')
     	})
	 	resolve(branchpaidsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function getTotalReinstall(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getReinstalls(mysql)
			//console.log(data)
			let count_referred_udid
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_referred_udid =data[i]['count(referred_udid)']
				sample ={}
				sample.count_referred_udid =count_referred_udid
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		allreinstallsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		allreinstallsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temptotalreinstall.xlsx').then(function(){
       		console.log('allreinstallsheet is written')
       			// resolve('temptotalreinstall.xlsx')
     	})
	 resolve(allreinstallsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function getLoginUsers(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			
			let data = await getLogin(mysql)
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
		loginusersheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		loginusersheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temploginuser.xlsx').then(function(){
       		console.log('loginusersheet is written')
       		// resolve('temploginuser.xlsx')
     	})
	 	resolve(loginusersheet)
		}catch(e){
		console.log(e)
		reject(e)
		}	
	})

}

async function getQuestion(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getQs(mysql)
			//console.log(data)
			let count_distinct_a_student_id, count_a_question_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_distinct_a_student_id =data[i]['count(DISTINCT (a.student_id))']
				count_a_question_id =data[i]['count(a.question_id)']
				sample ={}
				sample.count_distinct_a_student_id= count_distinct_a_student_id
				sample.count_a_question_id =count_a_question_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		newstudentquestionsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		newstudentquestionsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnewstudentquestion.xlsx').then(function(){
       		console.log('newstudentquestionsheet is written')
       		// resolve('tempnewstudentquestion.xlsx')
     	})
	 	resolve(newstudentquestionsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getVideo(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getVid(mysql)
			//console.log(data)
			let   count_distinct_a_student_id, count_a_view_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				
				count_distinct_a_student_id =data[i]['count(DISTINCT (a.student_id))']
				count_a_view_id =data[i]['count(a.view_id)']
				sample ={}
				sample.count_distinct_a_student_id =count_distinct_a_student_id
				sample.count_a_view_id=count_a_view_id
				jsonData.push(sample)
			}
		//console.log(jsonData)
		newstudentvideosheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		newstudentvideosheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnewstudentvideo.xlsx').then(function(){
       		console.log('newstudentvideosheet is written')
       		// resolve('tempnewstudentvideo.xlsx')
     	})
	 	resolve(newstudentvideosheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getVideoMatch(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getVidMatch(mysql)
			//console.log(data)
			let  count_distinct_a_student_id, count_view_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_distinct_a_student_id =data[i]['count(DISTINCT (a.student_id))']
				count_view_id=data[i]['count(a.view_id)']
				sample ={}
				sample.count_distinct_a_student_id =count_distinct_a_student_id
				sample.count_view_id =count_view_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		newstudentvideomatchsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		newstudentvideomatchsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempnewstudentvideomatch.xlsx').then(function(){
       		console.log('newstudentvideomatchsheet is written')
       		//resolve('tempnewstudentvideomatch.xlsx')
     	})
	 	resolve(newstudentvideomatchsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getStuTotalQuestion(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getStuTotQs(mysql)
			//console.log(data)
			let  count_distinct_student_id, count_question_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				
				count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				count_question_id =data[i]['count(question_id)']
				sample ={}
				sample.count_distinct_student_id =count_distinct_student_id
				sample.count_question_id =count_question_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		totalstudentsquestionsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		totalstudentsquestionsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temptotalstudentsquestion.xlsx').then(function(){
       		console.log('totalstudentsquestionsheet is written')
       		// resolve('temptotalstudentsquestion.xlsx')
     	})
	 	resolve(totalstudentsquestionsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getTypedQuestion(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getTypeQs(mysql)
			//console.log(data)
			let count_distinct_student_id, count_question_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				
				count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				count_question_id =data[i]['count(question_id)']
				sample ={}
				sample.count_distinct_student_id =count_distinct_student_id
				sample.count_question_id =count_question_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		typedquestionsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		typedquestionsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temptypedquestion.xlsx').then(function(){
       		console.log('typedquestionsheet is written')
       		// resolve('temptypedquestion.xlsx')
     	})
	 	resolve(typedquestionsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}


async function getVideoView(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getVidView(mysql)
			//console.log(data)

			let  count_distinct_student_id, count_view_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				
				count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				count_view_id =data[i]['count(view_id)']
				sample ={}
				sample.count_distinct_student_id=count_distinct_student_id
				sample.count_view_id =count_view_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		videoviewsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       		videoviewsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvideoview.xlsx').then(function(){
       		console.log('videoviewsheet is written')
       		// resolve('tempvideoview.xlsx')
     	})
	 	resolve(videoviewsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getVideoViewMore(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await getMoreVid(mysql)
			//console.log(data)
			let count_distinct_student_id ,count_view_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				
				count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				count_view_id =data[i]['count(view_id)']
				sample ={}
				sample.count_distinct_student_id =count_distinct_student_id
				sample.count_view_id =count_view_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    videomorethanzerosheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       	videomorethanzerosheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvideomorethanzero.xlsx').then(function(){
       		console.log('videomorethanzerosheet is written')
       		// resolve('tempvideomorethanzero.xlsx')
     	})
	 	resolve(videomorethanzerosheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getConVidView(mysql){
	return new Promise (async function(resolve,reject){
		try{
			let data = await conVidView(mysql)
			let sum_view_cnt
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sum_view_cnt =data[i]['sum(view_cnt)']
				sample ={}
				sample.sum_view_cnt =sum_view_cnt
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    contestvidviewsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       	contestvidviewsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcontestvidview.xlsx').then(function(){
       		console.log('contestvidviewsheet is written')
       		// resolve('tempcontestvidview.xlsx')
     	})
			resolve( contestvidviewsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getStuVidMat(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await stuVidMat(mysql)
			//console.log(data)

			let  count_distinct_student_id, count_distinct_parent_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				
				count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				count_distinct_parent_id =data[i]['count(distinct parent_id)']
				sample ={}
				
				sample.count_distinct_student_id=count_distinct_student_id
				sample.count_distinct_parent_id =count_distinct_parent_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    stuvidmatsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       	stuvidmatsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempstuvidmat.xlsx').then(function(){
       		console.log('stuvidmatsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(stuvidmatsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

} 

async function getCamInstall(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await camInstall(mysql)
			//console.log(data)

			let latd_campaign,count_referred_udid
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){

				latd_campaign =data[i]['latd_campaign']
				count_referred_udid =data[i]['count(referred_udid)']
				sample ={}
				sample.latd_campaign=latd_campaign
				sample.count_referred_udid=count_referred_udid
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    campinstallsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       	campinstallsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcaminstall.xlsx').then(function(){
       		console.log('campinstallsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(campinstallsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

} 
 
async function getViewPages(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await viewPage(mysql)
			//console.log(data)

			let view_from, count_view_id, count_distinct_student_id, sum_vtime,sum_etime 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){

				view_from =data[i]['view_from']
				count_view_id =data[i]['count(view_id)']
				count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				sum_vtime =data[i]['sum(video_time)']
				sum_etime =data[i]['sum(engage_time)']
				sample ={}
				sample.view_from=view_from
				sample.count_view_id=count_view_id
				sample.count_distinct_student_id=count_distinct_student_id
				sample.sum_vtime=sum_vtime
				sample.sum_etime=sum_etime
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    viewpagesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       	viewpagesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempviewpage.xlsx').then(function(){
       		console.log('viewpagesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(viewpagesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getClassDiv(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await classDiv(mysql)
			//console.log(data)

			let student_class,count_student_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){

				
				student_class =data[i]['student_class']
				count_student_id =data[i]['COUNT(student_id)']
				sample ={}
				sample.student_class=student_class
				sample.count_student_id=count_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    classdivsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       classdivsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempclassdiv.xlsx').then(function(){
       		console.log('classdivsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(classdivsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getLangSplit(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await langSplit(mysql)
			//console.log(data)

			let locale,count_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){

				locale =data[i]['locale']
				count_student_id =data[i]['count(student_id)']
				sample ={}
				sample.locale=locale
				sample.count_student_id=count_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData) locale,count(student_id)
	    langsplitsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       langsplitsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./templangsplit.xlsx').then(function(){
       		console.log('langsplitsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(langsplitsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
	
}
	
async function getOrganicSplit(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await organicSplit(mysql)
			//console.log(data)

			let org_campaign, count_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){

				org_campaign =data[i]['org_campaign']
				count_id =data[i]['count(id)']
				sample ={}
				sample.org_campaign=org_campaign
				sample.count_id=count_id 
				jsonData.push(sample)
				
			}
		//console.log(jsonData) 
	    organicsplitsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       organicsplitsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temporganicsplit.xlsx').then(function(){
       		console.log('organicsplitsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(organicsplitsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
	
}

async function getMarchRateRemaining(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await marchRateRemaining(mysql)
			//console.log(data)

			let count_view_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){

				count_view_id=data[i]['count(view_id)']
				sample ={}
				sample.count_view_id=count_view_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    marchrateremainingsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       marchrateremainingsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempmarchrateremaining.xlsx').then(function(){
       		console.log('marchrateremainingsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(marchrateremainingsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getAdwordsFb(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await adwordsAndFb(mysql)
			//console.log(data)

			let advertising_partner_name,count_referred_udid
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				advertising_partner_name =data[i]['advertising_partner_name']
				count_referred_udid=data[i]['count(referred_udid)']
				sample ={}
				sample.advertising_partner_name =advertising_partner_name
				sample.count_referred_udid=count_referred_udid
				jsonData.push(sample)
				
			}
		//console.log(jsonData) 
	    adwordsfbsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       adwordsfbsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempadwordsfb.xlsx').then(function(){
       		console.log('adwordsfbsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(adwordsfbsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getMockClassSplit(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await mockTestClassSplit(mysql)
			//console.log(data)

			let student_class,count_distinct_student_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				student_class =data[i]['student_class']
				count_distinct_student_id=data[i]['count(distinct student_id)']
				sample ={}
				sample.student_class =student_class
				sample.count_distinct_student_id =count_distinct_student_id 
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    mocktestclasssplitsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       mocktestclasssplitsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempmocktestclass.xlsx').then(function(){
       		console.log('mocktestclasssplitsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(mocktestclasssplitsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getQuizMock(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await quizMock(mysql)
			//console.log(data)

			let  app_module, count_test_id,count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				app_module =data[i]['app_module']
				count_test_id = data[i]['count(c.test_id)']
				count_distinct_student_id=data[i]['count(DISTINCT c.student_id)']
				sample ={}
				sample.app_module =app_module
				sample.count_test_id =count_test_id
				sample.count_distinct_student_id =count_distinct_student_id 
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    quizmocksheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
        quizmocksheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempquizmock.xlsx').then(function(){
       		console.log('quizmocksheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(quizmocksheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getMatchAskLangSplit(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await matchLangSplit(mysql)
			//console.log(data)

			let locale,count_distinct_parent_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				locale =data[i]['locale']
				count_distinct_parent_id=data[i]['count(DISTINCT a.parent_id)']
				sample ={}
				sample.locale =locale
				sample.count_distinct_parent_id =count_distinct_parent_id 
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    matchedvideoslangsplitsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
        matchedvideoslangsplitsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempmatchedvidlangsplit.xlsx').then(function(){
       		console.log('matchedvideoslangsplitsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(matchedvideoslangsplitsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getQsAskLangSplit(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await qsAskLangSplit(mysql)
			//console.log(data)

			let locale,count_question_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				locale =data[i]['locale']
				count_question_id=data[i]['count(a.question_id)']
				sample ={}
				sample.locale =locale
				sample.count_question_id =count_question_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	    qsaskstulangsplitsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
        qsaskstulangsplitsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempqsaskstulangsplit.xlsx').then(function(){
       		console.log('qsaskstulangsplitsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(qsaskstulangsplitsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getRefAndSentId(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await refSentId(mysql)
			//console.log(data)

			let count_received_id,count_distinct_sent_id 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				count_received_id =data[i]['count(received_id)']
				count_distinct_sent_id=data[i]['count(DISTINCT sent_id)']
				sample ={}
				sample.count_received_id =count_received_id
				sample.count_distinct_sent_id =count_distinct_sent_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	   refsentidsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
        refsentidsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temprefsentid.xlsx').then(function(){
       		console.log('refsentidsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(refsentidsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getCampVidViewRet(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await campVidviewRet(mysql)
			//console.log(data)
			let advertising_partner_name,latd_campaign,join_dt,ask_date,day_num,count_s 
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				advertising_partner_name =data[i]['advertising_partner_name']
				latd_campaign =data[i]['latd_campaign']
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.advertising_partner_name =advertising_partner_name
				sample.latd_campaign =latd_campaign
				sample.join_dt =join_dt
				sample.ask_date =ask_date
				sample.day_num =day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	  campaignvidviewsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       campaignvidviewsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcampaignvidview.xlsx').then(function(){
       		console.log('campaignvidviewsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(campaignvidviewsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}



async function getCampClassSplit(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await campClassSplit(mysql)
			//console.log(data)
			let join_dt,latd_campaign,advertising_partner_name,student_class,count_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
				latd_campaign =data[i]['latd_campaign']
				advertising_partner_name =data[i]['advertising_partner_name']
				student_class =data[i]['student_class']
				count_student_id =data[i]['count(d.student_id)']
				sample ={}
				sample.join_dt =join_dt
				sample.latd_campaign =latd_campaign
				sample.advertising_partner_name =advertising_partner_name
				sample.student_class =student_class
				sample.count_student_id =count_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	 campaignclasplitsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       campaignclasplitsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcampaignclasplit.xlsx').then(function(){
       		console.log('campaignclasplitsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(campaignclasplitsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getQuestionDoneToSeven(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await qsDoneToSeven(mysql)
			//console.log(data) 
			let join_dt,ask_date,day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
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
	 qsd1sevensheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       qsd1sevensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempqsd1seven.xlsx').then(function(){
       		console.log('qsd1sevensheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(qsd1sevensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getVideoOneToSeven(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await vidToSeven(mysql)
			//console.log(data) 
			let join_dt,view_date,day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
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
	 videodonetosevensheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       videodonetosevensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvideodonetoseven.xlsx').then(function(){
       		console.log('videodonetosevensheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(videodonetosevensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}
async function getCampaignQid(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await campQsDone(mysql)
			//console.log(data) 
			let advertising_partner_name,join_dt,ask_date,day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				advertising_partner_name =data[i]['advertising_partner_name']
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.advertising_partner_name=advertising_partner_name
				sample.join_dt =join_dt
				sample.ask_date =ask_date
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	 campqidsheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
       campqidsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcampqid.xlsx').then(function(){
       		console.log('campqidsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(campqidsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}
async function getCampaignVidDone(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await campVidDone(mysql)
			//console.log(data) 
			let advertising_partner_name,join_dt,view_date,day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				advertising_partner_name =data[i]['advertising_partner_name']
				join_dt =data[i]['join_dt']
				view_date =data[i]['view_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.advertising_partner_name=advertising_partner_name
				sample.join_dt =join_dt
				sample.view_date =view_date
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	campviddonesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
      campviddonesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcampviddone.xlsx').then(function(){
       		console.log('campviddonesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(campviddonesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getQuestionDoneNotOneFour(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await qsDoneNotOneFour(mysql)
			//console.log(data) 
			let join_dt,ask_date,day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.join_dt=join_dt
				sample.ask_date =ask_date
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	qsdonenotonefoursheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
     qsdonenotonefoursheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempqsdonenotonefour.xlsx').then(function(){
       		console.log('qsdonenotonefoursheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(qsdonenotonefoursheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getVidDOneNotOneFour(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await vidDoneNotOneFour(mysql)
			//console.log(data) 
			let join_dt,view_date,day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
				view_date =data[i]['view_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.join_dt=join_dt
				sample.view_date =view_date
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	vidonenotonefoursheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
    vidonenotonefoursheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvidonenotonefour.xlsx').then(function(){
       		console.log('vidonenotonefoursheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(vidonenotonefoursheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getMatchPageDone(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await matPageDone(mysql)
			//console.log(data)  
			let join_dt,ask_date,day_num, count_distinct_student_id
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_dt']
				day_num =data[i]['d.ask_dt-d.join_dt']
				count_distinct_student_id =data[i]['count(DISTINCT d.student_id)']
				sample ={}
				sample.join_dt=join_dt
				sample.ask_date =ask_date
				sample.day_num=day_num
				sample.count_distinct_student_id =count_distinct_student_id
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	matchpagedonesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
    matchpagedonesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempmatchpagedone.xlsx').then(function(){
       		console.log('matchpagedonesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(matchpagedonesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}

async function getCampOneFourVid(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await camOneFourRet(mysql)
			//console.log(data)  
			let  advertising_partner_name,latd_campaign,join_dt, ask_date, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				advertising_partner_name =data[i]['advertising_partner_name']
				latd_campaign =data[i]['latd_campaign']
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.advertising_partner_name=advertising_partner_name
				sample.latd_campaign=latd_campaign
				sample.join_dt=join_dt
				sample.ask_date =ask_date
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	camponefourdonevidretensheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
    camponefourdonevidretensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcamponefoureten.xlsx').then(function(){
       		console.log('camponefourdonevidretensheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(camponefourdonevidretensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}
async function getCampOneFourQsAskRet(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await camOneFourQsAskRet(mysql)
			//console.log(data)  
			let  advertising_partner_name,latd_campaign,join_dt, ask_date, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				advertising_partner_name =data[i]['advertising_partner_name']
				latd_campaign =data[i]['latd_campaign']
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.advertising_partner_name=advertising_partner_name
				sample.latd_campaign=latd_campaign
				sample.join_dt=join_dt
				sample.ask_date =ask_date
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	camponefourdoneqsaskretensheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
   camponefourdoneqsaskretensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempcamponefourdoneqsaskreten.xlsx').then(function(){
       		console.log('camponefourdoneqsaskretensheet is written')
     	})
	 	resolve(camponefourdoneqsaskretensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getClassWiseQsDone(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await classWiseQsDone(mysql)
			//console.log(data)  
			let  join_dt, ask_date,student_class, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				student_class=data[i]['student_class']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.join_dt=join_dt
				sample.ask_date=ask_date
				sample.student_class=student_class
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	classquestiondonesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
    classquestiondonesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempclassqsdone.xlsx').then(function(){
       		console.log('classquestiondonesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(classquestiondonesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}
async function getClassVidDone(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await classVidDone(mysql)
			//console.log(data)  
			let  join_dt, ask_date,student_class, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				student_class=data[i]['student_class']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.join_dt=join_dt
				sample.ask_date=ask_date
				sample.student_class=student_class
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	classvideodonesheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
    classvideodonesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempclassvidone.xlsx').then(function(){
       		console.log('classvideodonesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(classvideodonesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})

}
async function getWebQuestionReten(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await webQuesReten(mysql)
			//console.log(data)  
			let  advertising_partner_name,latd_campaign,join_dt, ask_date, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				advertising_partner_name =data[i]['advertising_partner_name']
				latd_campaign =data[i]['latd_campaign']
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.advertising_partner_name=advertising_partner_name
				sample.latd_campaign=latd_campaign
				sample.join_dt=join_dt
				sample.ask_date =ask_date
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	webquestionretensheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
    webquestionretensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempwebquestionreten.xlsx').then(function(){
       		console.log('webquestionretensheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(webquestionretensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getWebVideoReten(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await webVideoReten(mysql)
			//console.log(data)  
			let  advertising_partner_name,latd_campaign,join_dt, ask_date, day_num, count_s
			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				advertising_partner_name =data[i]['advertising_partner_name']
				latd_campaign =data[i]['latd_campaign']
				join_dt =data[i]['join_dt']
				ask_date =data[i]['ask_date']
				day_num =data[i]['day_num']
				count_s =data[i]['count_s']
				sample ={}
				sample.advertising_partner_name=advertising_partner_name
				sample.latd_campaign=latd_campaign
				sample.join_dt=join_dt
				sample.ask_date =ask_date
				sample.day_num=day_num
				sample.count_s =count_s
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
	webvideoretensheet.addRow().values =_.keys(jsonData[0])
      	_.forEach(jsonData,function(item){
       		var valueArray =[]
       		valueArray = _.values(item)
    webvideoretensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempwebvideoreten.xlsx').then(function(){
       		console.log('webvideoretensheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(webvideoretensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getWebToAppInstalls(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await webToAppInstall(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_referred_udid=data[i]['count(referred_udid)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		 webtoappinstallsheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	     webtoappinstallsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempwebtoappinstall.xlsx').then(function(){
       		console.log('webtoappinstallsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(webtoappinstallsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getTotRegNewUsers(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await totRegNewUsers(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_student_id=data[i]['count(student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		 totregnewusersheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	    totregnewusersheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temptotregnewuser.xlsx').then(function(){
       		console.log('totregnewusersheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(totregnewusersheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getChannelWiseReg(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await channelWiseReg(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.fingerprints=data[i]['fingerprints']
				sample.count_student_id =data[i]['count(student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		 channelwiseregsheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	    channelwiseregsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempchannelwisereg.xlsx').then(function(){
       		console.log('channelwiseregsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(channelwiseregsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getQuestionTotUsers(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await questionTotUsers(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_question_id=data[i]['count(question_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		 questiontotusersheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	    questiontotusersheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempquestiontotuser.xlsx').then(function(){
       		console.log('questiontotusersheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(questiontotusersheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getQsWithImage(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await questionImage(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_question_id=data[i]['count(question_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		questionwithimagesheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	    questionwithimagesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempquestionwithimage.xlsx').then(function(){
       		console.log('questionwithimagesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(questionwithimagesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getQsVerticalImage(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await questionVerImg(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.date_timestamp =data[i]['date(timestamp)']
				sample.count_question_id=data[i]['count(question_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		questionverticalimagesheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	    questionverticalimagesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempquestionverticalimage.xlsx').then(function(){
       		console.log('questionverticalimagesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(questionverticalimagesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getVideosWatch(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await videosWatched(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_view_id=data[i]['count(view_id)']
				sample.count_distinct_student_id =data[i]['count(DISTINCT student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		videoswatchsheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	   videoswatchsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvideoswatch.xlsx').then(function(){
       		console.log('videoswatchsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(videoswatchsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getDistinctParentId(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await disParentId(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.count_distinct_student_id =data[i]['count(DISTINCT parent_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		distparentidsheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	  distparentidsheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempdistparentid.xlsx').then(function(){
       		console.log('distparentidsheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(distparentidsheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}
async function getDoneRet(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await dOneReten(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.join_date =data[i]['join_dt']
				sample.ask_date =data[i]['ask_date']
				sample.day_num =data[i]['day_num']
				sample.count_s =data[i]['count_s']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		doneretensheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	  doneretensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempdoneretensheet.xlsx').then(function(){
       		console.log('doneretensheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(doneretensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
} 

async function getVidViewsSubEleTwe(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await vidViewSubEleTwe(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.subject =data[i]['subject']
				sample.count_view_id =data[i]['count(a.view_id)']
				sample.count_distinct_student_id =data[i]['COUNT(DISTINCT a.student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		vidviewsubeletwesheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	  vidviewsubeletwesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvidviewsubeletwesheet.xlsx').then(function(){
       		console.log('vidviewsubeletwesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(vidviewsubeletwesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getVidViewsSubNineTen(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await vidViewSubNineTen(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.subject =data[i]['subject']
				sample.count_view_id =data[i]['count(a.view_id)']
				sample.count_distinct_student_id =data[i]['COUNT(DISTINCT a.student_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		vidviewsubninetensheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	  vidviewsubninetensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempvidviewsubninetensheet.xlsx').then(function(){
       		console.log('vidviewsubninetensheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(vidviewsubninetensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
} 

async function getSubWiseMatchRateEleTwe(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await subWiseMatchRateEleTwe(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.subject =data[i]['subject']
				sample.count_distinct_question_id =data[i]['count(DISTINCT a.question_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		subwisematrateeletwesheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	  subwisematrateeletwesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempsubwisematrateeletwesheet.xlsx').then(function(){
       		console.log('subwisematrateeletwesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(subwisematrateeletwesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getSubWiseMatchRateNineTen(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await subWiseMatchRateNineTen(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.subject =data[i]['subject']
				sample.count_distinct_question_id =data[i]['count(DISTINCT a.question_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		subwisematrateninetensheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	  subwisematrateninetensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempsubwisematrateninetensheet.xlsx').then(function(){
       		console.log('subwisematrateninetensheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(subwisematrateninetensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getQsAskSubEleTwe(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await qsAskSubEleTwe(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.subject =data[i]['subject']
				sample.count_question_id =data[i]['count(question_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		questionasksubeletwesheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	 questionasksubeletwesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempquestionasksubeletwesheet.xlsx').then(function(){
       		console.log('questionasksubeletwesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(questionasksubeletwesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getQsAskSubNineTen(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await qsAskSubNineTen(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.subject =data[i]['subject']
				sample.count_question_id =data[i]['count(question_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		questionasksubninetensheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	questionasksubninetensheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./tempquestionasksubninetensheet.xlsx').then(function(){
       		console.log('questionasksubninetensheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(questionasksubninetensheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

async function getTextTypeVidType(mysql){
	return new Promise (async function(resolve,reject){
		try{
			
			let data = await textTypeVidType(mysql)
			//console.log(data)  

			let jsonData =[], sample 
			for(let i=0; i < data.length; i++){
				sample ={}
				sample.type =data[i]['type']
				sample.count_view_id =data[i]['count(a.view_id)']
				jsonData.push(sample)
				
			}
		//console.log(jsonData)
		texttypevidtypesheet.addRow().values =_.keys(jsonData[0])
	      	_.forEach(jsonData,function(item){
	       		var valueArray =[]
	       		valueArray = _.values(item)
	texttypevidtypesheet.addRow().values =valueArray
      	})
		workbook.xlsx.writeFile('./temptexttypevidtypesheet.xlsx').then(function(){
       		console.log('texttypevidtypesheet is written')
       		// resolve('tempnullgcm.xlsx')
     	})
	 	resolve(texttypevidtypesheet)
		}catch(e){
		console.log(e)
		reject(e)
		}
	})
}

function getData(mysql){
	let sql = "SELECT count(id) FROM `student_onboard` WHERE created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	//console.log(sql)
	return mysql.query(sql)
}

function getReg(mysql){
	let sql ="SELECT count(student_id) FROM `students` WHERE is_web<>1 and (udid not like '' or udid is not NULL) and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE"
	//console.log(sql)
	return mysql.query(sql)
}

function getBranchUniq(mysql){
	let sql ="SELECT count(Distinct referred_udid) FROM `branch_events_2020` WHERE name like 'INSTALL' and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at< (CURRENT_DATE)"
	//console.log(sql)
	return mysql.query(sql)
}

function getBranch(mysql){
	let sql ="SELECT count(referred_udid) FROM `branch_events_2020` WHERE name like 'INSTALL' and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE "
	return mysql.query(sql)
}

function getPaid(mysql){
	let sql ="SELECT count(referred_udid) FROM `branch_events_2020` WHERE name like 'INSTALL' AND advertising_partner_name in ('Google Adwords','FACEBOOK','TikTok Ads') and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	return mysql.query(sql)
}

function getReinstalls(mysql){
	let sql ="SELECT count(referred_udid) FROM `branch_events_2020` WHERE name like 'REINSTALL' and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	return mysql.query(sql)
}

function getLogin(mysql){
	let sql ="SELECT count(student_id) from `students` where mobile is not NULL AND is_web<>1 and (udid not like '' or udid is not NULL) and timestamp>= DATE_SUB(CURRENT_DATE,INTERVAl 1 DAY) and timestamp<CURRENT_DATE"
	return mysql.query(sql)
}

function getQs(mysql){
	let sql ="SELECT count(DISTINCT (a.student_id)),count(a.question_id) from (SELECT question_id,student_id FROM `questions` where doubt not like 'WEB' and doubt not like 'WHATSAPP' and doubt NOT LIKE 'WHATSAPP_NT' and timestamp>=DATE_SUB(CURRENT_DATE,INTERVAl 1 DAY) and timestamp<CURRENT_DATE) as a left join (SELECT student_id from students where timestamp>=DATE_SUB(CURRENT_DATE,INTERVAl 1 DAY) and timestamp<CURRENT_DATE and is_web<>1) as b on a.student_id=b.student_id where b.student_id is not NULL"
	return mysql.query(sql)
}

function getVid(mysql){
	let sql ="SELECT count(DISTINCT (a.student_id)),count(a.view_id) from (SELECT view_id,student_id FROM `video_view_stats` where (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' AND view_from like 'DEEPLINK')) and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<(current_date)) as a left join (SELECT student_id from students where is_web<>1 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE) as b on a.student_id=b.student_id where b.student_id is not NULL"
	//console.log(sql)
	return mysql.query(sql)
}

function getVidMatch(mysql){
	let sql ="SELECT count(DISTINCT (a.student_id)),count(a.view_id) from (SELECT view_id,student_id FROM `video_view_stats` where (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from LIKE 'DEEPLINK')) and parent_id<>0 and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE) as a left join (SELECT student_id from students where is_web<>1 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE) as b on a.student_id=b.student_id where b.student_id is not NULL"
	return mysql.query(sql)
}

function getStuTotQs(mysql){
	let sql ="select count(question_id),count(DISTINCT student_id) from questions WHERE student_id >100 and doubt not like 'WEB' and doubt not like 'WHATSAPP' AND doubt NOT LIKE 'WHATSAPP_NT' and timestamp >=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE"
	return mysql.query(sql)
}

function getTypeQs(mysql){
	let sql ="select count(DISTINCT student_id),count(question_id) from questions WHERE (question_image is NULL or question_image like '') and student_id>100 and doubt not like 'WEB' and doubt not like 'WHATSAPP' AND doubt NOT LIKE 'WHATSAPP_NT' and timestamp>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE"
	return mysql.query(sql)
}

function getVidView(mysql){
	let sql ="select count(DISTINCT student_id),count(view_id) from video_view_stats WHERE (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') OR (source like 'WHA_NT' and view_from like 'DEEPLINK')) and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<(CURRENT_DATE)"
	return mysql.query(sql)
}

function getMoreVid(mysql){
	let sql ="select count(DISTINCT student_id),count(view_id) from video_view_stats WHERE video_time>0 and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') OR (source like 'WHA_NT' and view_from like 'DEEPLINK')) and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<(CURRENT_DATE)"
	return mysql.query(sql)
}

function conVidView(mysql){
	let sql ="select sum(view_cnt) from ( select student_id, count(view_id) as view_cnt from video_view_stats WHERE source='android' and engage_time>30 and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE group by student_id having count(view_id)>150) as a"
	return mysql.query(sql)
}

function stuVidMat(mysql){
	let sql ="select count(DISTINCT student_id),count(distinct parent_id) from video_view_stats WHERE source like 'android' and parent_id<>0 and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	return mysql.query(sql)
}

function camInstall(mysql){
	let sql ="SELECT latd_campaign,count(referred_udid) FROM `branch_events_2020` WHERE name like 'INSTALL' and advertising_partner_name in ('Google Adwords','FACEBOOK','TikTok Ads') and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at < CURRENT_DATE group by latd_campaign"

	return mysql.query(sql)
}

function viewPage(mysql){
	let sql ="SELECT view_from,count(view_id),count(DISTINCT student_id),sum(video_time),sum(engage_time) FROM `video_view_stats` where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' AND view_from like 'DEEPLINK')) and view_from is not NULL GROUP by view_from"
	return mysql.query(sql)
}

function classDiv(mysql){
	let sql ="SELECT student_class,COUNT(student_id) FROM `students` WHERE student_class<>20 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp < CURRENT_DATE and is_web<>1 and (udid not like '' or udid is not NULL) GROUP by student_class"
	return mysql.query(sql)
}

function langSplit(mysql){
	let sql ="SELECT locale,count(student_id) FROM `students` WHERE  timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE and is_web<>1 and (udid not like '' or udid is not NULL) and student_class<>20 GROUP by locale"
	return mysql.query(sql)
}

function organicSplit(mysql){
	let sql ="Select a.org_campaign, count(id) from (SELECT id, left(latd_campaign,3) as org_campaign FROM `branch_events_2020` where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE and name like 'INSTALL' and advertising_partner_name like '0') as a group by a.org_campaign"
	return mysql.query(sql)
}

function marchRateRemaining(mysql){
	let sql ="SELECT count(view_id) FROM `video_view_stats` WHERE created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at < CURRENT_DATE and view_from LIKE 'suggestions'"
	return mysql.query(sql)
}
function adwordsAndFb(mysql){
	let sql ="SELECT advertising_partner_name,count(referred_udid) FROM `branch_events_2020` WHERE name like 'INSTALL' AND advertising_partner_name in ('Google Adwords','FACEBOOK','TikTok Ads') and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE GROUP by advertising_partner_name"
	return mysql.query(sql)
}
function mockTestClassSplit(mysql){
	let sql ="select student_class, count(distinct student_id) from (select c.student_id,d.student_class from (select a.student_id from `testseries_student_subscriptions` as a left join  `testseries` as b on a.test_id=b.test_id where b.app_module like 'test%' and a.status like 'com%' and date(a.registered_at)>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and date(a.registered_at)< CURRENT_DATE ) as c LEFT join `students` as d on c.student_id=d.student_id where d.student_class in ('11','12')) as f group by f.student_class"
	return mysql.query(sql)
}
function quizMock(mysql){
	let sql ="SELECT c.app_module, count(c.test_id),count(DISTINCT c.student_id) from (SELECT a.id,a.test_id,a.student_id,b.app_module,a.registered_at FROM `testseries_student_subscriptions` as a left join testseries as b on a.test_id=b.test_id where a.status like 'com%' and date(a.registered_at)>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and date(a.registered_at)< CURRENT_DATE) as c GROUP by c.app_module"
	return mysql.query(sql)
}
function matchLangSplit(mysql){
	let sql ="SELECT b.locale, count(DISTINCT a.parent_id) from (select parent_id,student_id from `video_view_stats` where source like 'android'  and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at< CURRENT_DATE) as a left join (SELECT locale,student_id from `students` where locale in ('en','hi') and student_id>100) as b on a.student_id=b.student_id where b.student_id is not NULL group by b.locale"
	return mysql.query(sql)
}
function qsAskLangSplit(mysql){
	let sql ="SELECT b.locale, count(a.question_id) from (select question_id,student_id from `questions` where doubt not like 'WEB' and doubt not like 'WHATSAPP' AND doubt NOT LIKE 'WHATSAPP_NT' and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp< CURRENT_DATE) as a left join (SELECT student_id,locale from `students` where locale in ('en','hi') and student_id>100) as b on a.student_id=b.student_id where b.student_id is not NULL group by b.locale "
	return mysql.query(sql)
}
function refSentId(mysql){
	let sql ="SELECT count(received_id),count(DISTINCT sent_id) FROM `students_invites` where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE"
	return mysql.query(sql)
}
function campVidviewRet(mysql){
	let sql="select d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date, (d.ask_date-d.join_dt) as day_num,count(d.student_id) as count_s from (Select a.advertising_partner_name,a.latd_campaign, b.student_id, b.join_dt,c.ask_date, c.count_q from ( SELECT referred_udid,latd_campaign, advertising_partner_name FROM `branch_events_2020` WHERE `name` LIKE 'INSTALL' and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at < CURRENT_DATE) as a left join (Select date(timestamp) as join_dt, student_id,udid from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(created_at) as ask_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at<CURRENT_DATE and student_id >100 and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from LIKE 'DEEPLINK')) group by student_id, date(created_at)) as c on b.student_id = c.student_id where b.student_id is not NULL) as d group by d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date"
	return mysql.query(sql)
}

function campClassSplit(mysql){
	let sql ="select d.join_dt,d.latd_campaign,d.advertising_partner_name,d.student_class,count(d.student_id) from (Select a.advertising_partner_name,a.latd_campaign, b.student_class,b.student_id, b.join_dt from ( SELECT referred_udid,latd_campaign, advertising_partner_name FROM `branch_events_2020` WHERE `name` LIKE 'INSTALL' and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at< CURRENT_DATE) as a left join (Select date(timestamp) as join_dt, student_id,student_class,udid from students where timestamp>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp< CURRENT_DATE) as b on a.referred_udid=b.udid) as d group by d.advertising_partner_name,d.latd_campaign,d.student_class,d.join_dt"
	return mysql.query(sql)
}
function qsDoneToSeven(mysql){
	let sql ="Select d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select b.student_id, b.join_dt,c.ask_date, c.count_q from (Select date(timestamp) as join_dt, student_id from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 31 DAY) and timestamp<CURRENT_DATE) as b left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where doubt not like 'WEB' and doubt not like 'WHATSAPP' and doubt not like 'WHATSAPP_NT' and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 31 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.ask_date"
	return mysql.query(sql)
}
function vidToSeven(mysql){
	let sql ="Select d.join_dt, d.view_date,d.view_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select b.student_id, b.join_dt,c.view_date, c.count_q from (Select date(timestamp) as join_dt, student_id,udid from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 31 DAY) and timestamp<CURRENT_DATE) as b left JOIN (SELECT student_id, date(created_at) as view_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 31 DAY) and created_at<CURRENT_DATE and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from like 'DEEPLINK')) group by student_id, date(created_at)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.view_date"
	return mysql.query(sql)
}
function campQsDone(mysql){
	let sql ="Select d.advertising_partner_name,d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select a.*, b.student_id, b.join_dt,c.ask_date, c.count_q from ( SELECT referred_udid,latd_campaign, advertising_partner_name FROM `branch_events_2020` WHERE `name` LIKE 'INSTALL' and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at < CURRENT_DATE) as a left join (Select date(timestamp) as join_dt, student_id,udid from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where doubt not like 'WEB' and doubt not like 'WHATSAPP' and doubt not like 'WHATSAPP_NT' and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.advertising_partner_name,d.join_dt, d.ask_date"
	return mysql.query(sql)
}
function campVidDone(mysql){
	let sql ="Select d.advertising_partner_name,d.join_dt, d.view_date,d.view_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select a.*, b.student_id, b.join_dt,c.view_date, c.count_q from ( SELECT referred_udid,latd_campaign, advertising_partner_name FROM `branch_events_2020` WHERE `name` LIKE 'INSTALL' and created_at < CURRENT_DATE) as a left join (Select date(timestamp) as join_dt, student_id,udid from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(created_at) as view_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at<CURRENT_DATE and student_id >100 and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from like 'DEEPLINK')) group by student_id, date(created_at)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.advertising_partner_name,d.join_dt, d.view_date"
	return mysql.query(sql)
}
function qsDoneNotOneFour(mysql){
	let sql="Select d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select b.student_id, b.join_dt,c.ask_date, c.count_q from (Select date(timestamp) as join_dt, student_id from students where  timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE and student_class<>14) as b left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE and student_id >100 and doubt not like 'WEB' and doubt not like 'WHATSAPP' and doubt not like 'WHATSAPP_NT' group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.ask_date"
	return mysql.query(sql)
}
function vidDoneNotOneFour(mysql){
	let sql="Select d.join_dt, d.view_date,d.view_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select b.student_id, b.join_dt,c.view_date, c.count_q from (Select date(timestamp) as join_dt, student_id,udid from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE and student_class<>14) as b left JOIN (SELECT student_id, date(created_at) as view_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at<CURRENT_DATE and student_id >100 and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from like 'DEEPLINK') ) group by student_id, date(created_at)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.view_date"
	return mysql.query(sql)
}
function matPageDone(mysql){
	let sql ="SELECT d.join_dt,d.ask_dt,d.ask_dt-d.join_dt,count(DISTINCT d.student_id) from (select join_dt,ask_dt,a.student_id from (SELECT date(timestamp) as join_dt,student_id FROM `students` WHERE timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as a left join (Select DISTINCT student_id from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at<CURRENT_DATE and parent_id<>0 and source like 'android') as b on a.student_id=b.student_id left JOIN (select date(timestamp) as ask_dt,student_id from questions where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as c on a.student_id=c.student_id where b.student_id is not null and c.student_id is not null) as d GROUP by d.join_dt,d.ask_dt"
	return mysql.query(sql)
}

function camOneFourRet(mysql){
	let sql ="select d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date, d.ask_date-d.join_dt as day_num,count(d.student_id) as count_s from (Select a.advertising_partner_name,a.latd_campaign, b.student_id, b.join_dt,c.ask_date, c.count_q from ( SELECT referred_udid,latd_campaign, advertising_partner_name FROM `branch_events_2020` WHERE `name` LIKE 'INSTALL' and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at < CURRENT_DATE) as a left join (Select date(timestamp) as join_dt, student_id,udid from students where student_class<>14 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(created_at) as ask_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at<CURRENT_DATE and student_id >100 and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from like 'DEEPLINK')) group by student_id, date(created_at)) as c on b.student_id = c.student_id where b.student_id is not NULL) as d group by d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date"
	return mysql.query(sql)
}

function camOneFourQsAskRet(mysql){
	let sql ="select d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date, d.ask_date-d.join_dt as day_num,count(d.student_id) as count_s from (Select a.advertising_partner_name,a.latd_campaign, b.student_id, b.join_dt,c.ask_date, c.count_q from ( SELECT referred_udid,latd_campaign, advertising_partner_name FROM `branch_events_2020` WHERE `name` LIKE 'INSTALL' and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at < CURRENT_DATE) as a left join (Select date(timestamp) as join_dt, student_id,udid from students where student_class<>14 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE and student_id >100 and doubt not like 'WHATSAPP' and doubt not like 'WHATSAPP_NT' and doubt not like 'WEB' group by student_id, date(timestamp)) as c on b.student_id = c.student_id where b.student_id is not NULL) as d group by d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date"
	return mysql.query(sql)
}

function classWiseQsDone(mysql){
	let sql ="Select d.join_dt, d.ask_date,d.student_class, d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from(Select b.student_id, b.student_class,b.join_dt,c.ask_date, c.count_q from (Select date(timestamp) as join_dt, student_class,student_id from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE and student_id >100 and doubt not like 'WEB' and doubt not like 'WHATSAPP' and doubt NOT LIKE 'WHATSAPP_NT' group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not NULL GROUP by d.join_dt, d.ask_date,d.student_class"
	return mysql.query(sql)
}

function classVidDone(mysql){
	let sql ="Select d.join_dt, d.ask_date,d.student_class, d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from(Select b.student_id, b.student_class,b.join_dt,c.ask_date, c.count_q from (Select date(timestamp) as join_dt, student_class,student_id from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and timestamp<CURRENT_DATE) as b left JOIN (SELECT student_id, date(created_at) as ask_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 2 DAY) and created_at<CURRENT_DATE and student_id >100  and (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from like 'DEEPLINK')) group by student_id, date(created_at)) as c on b.student_id = c.student_id) as d where d.student_id is not NULL GROUP by d.join_dt, d.ask_date,d.student_class"
	return mysql.query(sql)
}

function webQuesReten(mysql){
	let sql ="select d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date, d.ask_date-d.join_dt as day_num,count(d.student_id) as count_s from (Select a.advertising_partner_name,a.latd_campaign, b.student_id, b.join_dt,c.ask_date, c.count_q from ( SELECT referred_udid,latd_campaign, advertising_partner_name FROM `branch_events_2020` WHERE `name` LIKE 'INSTALL' and latd_campaign like 'web%' and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 10 DAY) and created_at < CURRENT_DATE) as a left join (Select date(timestamp) as join_dt, student_id,udid from students where is_web=1 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 10 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 10 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id where b.student_id is not NULL) as d group by d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date"
	return mysql.query(sql)
}

function webVideoReten(mysql){
	let sql ="select d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date, d.ask_date-d.join_dt as day_num,count(d.student_id) as count_s from (Select a.advertising_partner_name,a.latd_campaign, b.student_id, b.join_dt,c.ask_date, c.count_q from ( SELECT referred_udid,latd_campaign, advertising_partner_name FROM `branch_events_2020` WHERE `name` LIKE 'INSTALL' and latd_campaign like 'web%' and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 10 DAY) and created_at < CURRENT_DATE) as a left join (Select date(timestamp) as join_dt, student_id,udid from students where is_web=1 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 10 DAY) and timestamp<CURRENT_DATE) as b on a.referred_udid=b.udid left JOIN (SELECT student_id, date(created_at) as ask_date, count(view_id) as count_q from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 10 DAY) and created_at<CURRENT_DATE and student_id >100 group by student_id, date(created_at)) as c on b.student_id = c.student_id where b.student_id is not NULL) as d group by d.advertising_partner_name,d.latd_campaign,d.join_dt, d.ask_date"
	return mysql.query(sql)
}

function webToAppInstall(mysql){
	let sql ="SELECT count(referred_udid) FROM `branch_events_2020` where latd_campaign like 'WHA%' and name like 'INS%' and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at < CURRENT_DATE"
	return mysql.query(sql)
}
function totRegNewUsers(mysql){
	let sql ="SELECT count(student_id) FROM `students` WHERE timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE and `is_web` = 2"
	return mysql.query(sql)
}
function channelWiseReg(mysql){
	let sql ="SELECT date(timestamp),fingerprints,count(student_id) FROM `students` WHERE `is_web` = 2 and timestamp>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE GROUP by fingerprints"
	return mysql.query(sql)
}
function questionTotUsers(mysql){
	let sql ="SELECT date(timestamp),count(question_id),count(DISTINCT student_id) FROM `questions` where doubt like 'wha%' and is_skipped<>5 and timestamp>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE"
	return mysql.query(sql)
}
function questionImage(mysql){
	let sql="SELECT date(timestamp),count(question_id),count(DISTINCT student_id) FROM `questions` where doubt like 'wha%' and is_skipped<>5 and timestamp>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE and (question_image is not NULL or question_image not like '')"
	return mysql.query(sql)
}
function questionVerImg(mysql){
	let sql ="SELECT date(timestamp),count(question_id),count(DISTINCT student_id) FROM `questions` where doubt like 'wha%' and is_skipped=5 GROUP by date(timestamp) order by date(timestamp) desc"
	return mysql.query(sql)
}
function videosWatched(mysql){
	let sql ="SELECT date(Created_at),count(view_id),count(DISTINCT student_id) FROM `video_view_stats` where source like 'wha%' and created_at>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	return mysql.query(sql)
}
function disParentId(mysql){
	let sql="SELECT date(Created_at),count(DISTINCT parent_id) FROM `video_view_stats` where source like 'wha%' and created_at>DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE"
	return mysql.query(sql)
}
function dOneReten(mysql){
	let sql ="Select d.join_dt, d.ask_date,d.ask_date-d.join_dt as day_num, count(d.student_id) as count_s from ( Select b.student_id, b.join_dt,c.ask_date, c.count_q from (Select date(timestamp) as join_dt, student_id,udid from students where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 15 DAY) and timestamp<CURRENT_DATE) as b left JOIN (SELECT student_id, date(timestamp) as ask_date, count(question_id) as count_q from questions where doubt like 'WHA%' and question_image is not NULL and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 15 DAY) and timestamp<CURRENT_DATE and student_id >100 group by student_id, date(timestamp)) as c on b.student_id = c.student_id) as d where d.student_id is not null group by d.join_dt, d.ask_date"
	return mysql.query(sql)
}

function vidViewSubEleTwe(mysql){
	let sql ="SELECT b.subject,count(a.view_id),COUNT(DISTINCT a.student_id) from (SELECT view_id,student_id,question_id FROM `video_view_stats` where (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from like 'DEEPLINK') ) and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE) as a left join (SELECT question_id,subject from questions where student_id<100 and class in (11,12)) as b on a.question_id=b.question_id where b.question_id is not NULL GROUP by b.subject"
	return mysql.query(sql)
}

function vidViewSubNineTen(mysql){
	let sql ="SELECT b.subject,count(a.view_id),COUNT(DISTINCT a.student_id) from (SELECT view_id,student_id,question_id FROM `video_view_stats` where (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from like 'DEEPLINK')) and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE) as a left join (SELECT question_id,subject from questions where student_id<100 and class in (9,10)) as b on a.question_id=b.question_id where b.question_id is not NULL GROUP by b.subject"
	return mysql.query(sql)
}

function subWiseMatchRateEleTwe(mysql){
	let sql ="SELECT a.subject, count(DISTINCT a.question_id) from (SELECT question_id,subject FROM `questions` where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE and class in (11,12) and student_id>100 and doubt not like 'web' and doubt not like 'WHATSAPP' or doubt not like 'WHATSAPP_NT') as a left join (SELECT parent_id from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE) as b on a.question_id=b.parent_id where b.parent_id is not NULL GROUP by a.subject"
	return mysql.query(sql)
}

function subWiseMatchRateNineTen(mysql){
	let sql ="SELECT a.subject, count(DISTINCT a.question_id) from (SELECT question_id,subject FROM `questions` where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE and class in (9,10) and student_id>100 and doubt not like 'web' and doubt not like 'WHATSAPP' and doubt not like 'WHATSAPP_NT') as a left join (SELECT parent_id from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE) as b on a.question_id=b.parent_id where b.parent_id is not NULL GROUP by a.subject"
	return mysql.query(sql)
}

function qsAskSubEleTwe(mysql){
	let sql ="SELECT subject,count(question_id) FROM `questions` where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE and class in (11,12) and doubt not like 'WEB' and doubt not like 'WHATSAPP' and doubt not like 'WHATSAPP_NT' and student_id>100 GROUP by subject"
	return mysql.query(sql)
}

function qsAskSubNineTen(mysql){
	let sql ="SELECT subject,count(question_id) FROM `questions` where timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE and class in (9,10) and doubt not like 'WEB' and doubt not like 'WHATSAPP' and doubt not like 'WHATSAPP_NT' and student_id>100 GROUP by subject"
	return mysql.query(sql)
}

function textTypeVidType(mysql){
	let sql ="SELECT a.type,count(a.view_id) from (select view_id, student_id, case when answer_video like 'text' then 'text' else 'video' end as type FROM `video_view_stats` where (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK') or (source like 'WHA_NT' and view_from like 'DEEPLINK')) and created_at>DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) and created_at<CURRENT_DATE) as a group by a.type"
	return mysql.query(sql)
}

async function sendMail(sendgrid, toMail, tempFilePath, helper) {
return new Promise(async function (resolve, reject) {
  try{	

  let from_email = new helper.Email("vivek@doubtnut.com")
  let to_email = new helper.Email(toMail)
  let subject = "Daily Report for " + moment().subtract(1, 'd').format("YYYY-MM-DD")
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