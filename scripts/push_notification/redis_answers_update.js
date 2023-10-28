"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
const mysql = new database(config.mysql_analytics)
const bluebird = require("bluebird");
const redis = require("redis");
bluebird.promisifyAll(redis);
const client = redis.createClient({host : config.redis.host});
const BATCH_SIZE=10000
// main(mysql)
client.on("connect", async function() {
    console.log("Redis client connected successfully");
    try{
    	await main(mysql)	
        client.quit();
	}catch(e){
		console.log(e)
	} 
}) 

client.on("error", function (err){
	console.log("Error" + err);
});

async function main (mysql){
	try{
		let answers = await getAllAnswers()
		console.log(answers[answers.length-1])
		var loopLength = Math.ceil(answers.length/BATCH_SIZE)
		console.log("loopLength:"+answers.length)
		let j=0
		for(let i =0; i<loopLength; i++){
			let str= ''
			let splicedArray = answers.slice(j, j+BATCH_SIZE)
			// console.log(splicedArray.length)
			for(let k=0; k< splicedArray.length; k++){
				str=str+splicedArray[k].question_id+','
			}
			str = str.substring(0, str.length - 1);
			let splicedAnswerData = await getAnswersData(str,mysql)
			let splicedAnswerTextData = await getAnswersTextData(str,mysql)
			await updateAnsweredRedis(splicedAnswerData, splicedAnswerTextData)
			j=j+BATCH_SIZE
		}
		let mcAnswers = await getAllMcAnswers()
		let mcAnswersText = await getAllMcAnswersText()
		await updateMcRedis(mcAnswers, mcAnswersText)

	}catch(e){
		console.log(e)
	}	
}


function updateMcRedis(mcAnswers, mcAnswersText){
	for(let i =0; i<mcAnswers.length; i++){
		client.hdelAsync("answers_mc", mcAnswers[i].question_id)
		let arr=[]
		arr.push(mcAnswers[i])
		console.log(JSON.stringify(arr))
		client.hsetAsync("answers_mc", mcAnswers[i].doubt ,JSON.stringify(arr))
	}
	for(let j =0; j<mcAnswersText.length; j++){
		client.hdelAsync("answers_mc_with_text_solution", mcAnswersText[j].question_id)
		let arr1=[]
		arr1.push(mcAnswersText[j])
		console.log(JSON.stringify(arr1))
		console.log(mcAnswersText[j].doubt)
		client.hsetAsync("answers_mc_with_text_solution", mcAnswersText[j].doubt  , JSON.stringify(arr1))
	}
}

function getAllMcAnswers(){
	let sql="Select t1.*,t3.* from (Select * from questions where student_id = 99 and is_answered=1) as t1 left join (Select question_id, max(answer_id) as answer_id from answers group by question_id) as t2 on t1.question_id=t2.question_id left join answers t3 on t2.answer_id=t3.answer_id"
	return mysql.query(sql)
}

function getAllMcAnswersText(){
	let sql="Select t1.*,t3.answer_id,t3.expert_id,t3.answer_video,t3.is_approved,t3.answer_rating,t3.answer_feedback,t3.youtube_id,t3.duration, t4.id as 'text_solution_id',t4.sub_obj,t4.opt_1,t4.opt_2,t4.opt_3,t4.opt_4,t4.answer as text_answer,t4.solutions as text_solutions from (Select * from questions where student_id = 99 and is_answered=1) as t1 left join (Select question_id, max(answer_id) as answer_id from answers group by question_id) as t2 on t1.question_id=t2.question_id left join answers t3 on t2.answer_id=t3.answer_id left join text_solutions t4 on t1.question_id=t4.question_id"
	return mysql.query(sql)
}

function getAllAnswers(){
	let sql="select question_id from questions where is_answered=1 and is_skipped=0"
	return mysql.query(sql)
}

function getAnswersData(splicedArray, mysql){
	let sql="Select t3.*, t2.* from (Select question_id, max(answer_id) as answer_id from answers where question_id in ("+splicedArray+") group by question_id) as t1 left join answers t2 on t1.answer_id=t2.answer_id left join questions t3 on t1.question_id=t3.question_id"
	// console.log(sql)
	return mysql.query(sql)
}

function getAnswersTextData(splicedArray, mysql){
	let sql="Select t3.*, t2.answer_id,t2.expert_id,t2.answer_video,t2.youtube_id, t2.is_approved,t2.answer_rating,t2.answer_feedback,t2.youtube_id,t2.duration, t4.id as 'text_solution_id',t4.sub_obj,t4.opt_1,t4.opt_2,t4.opt_3,t4.opt_4,t4.answer as text_answer,t4.solutions as text_solutions from (Select question_id, max(answer_id) as answer_id from answers where question_id in ("+splicedArray+") group by question_id) as t1 left join answers t2 on t1.answer_id=t2.answer_id left join questions t3 on t1.question_id=t3.question_id left join text_solutions as t4 on t1.question_id=t4.question_id"
	return mysql.query(sql)
}


function updateAnsweredRedis(splicedAnswerData, splicedAnswerTextData){
	console.log('inside')
	for(let i =0; i<splicedAnswerData.length; i++){
		console.log("in")
		client.hdelAsync("answers", splicedAnswerData[i].question_id)
		let arr=[]
		arr.push(splicedAnswerData[i])
		console.log(JSON.stringify(arr))
		client.hsetAsync("answers", splicedAnswerData[i].question_id ,JSON.stringify(arr))
	}
	for(let j =0; j<splicedAnswerTextData.length; j++){
		client.hdelAsync("answers_with_text_solution", splicedAnswerTextData[j].question_id)
		let arr1=[]
		arr1.push(splicedAnswerTextData[j])
		console.log(JSON.stringify(arr1))
		client.hsetAsync("answers_with_text_solution", splicedAnswerTextData[j].question_id  , JSON.stringify(arr1))
	}
}

// function getAndUpdateAnswersData()




