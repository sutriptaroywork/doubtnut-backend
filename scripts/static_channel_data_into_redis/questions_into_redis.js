"use strict"
const request = require('request');
require('dotenv').config({path : __dirname + '/.env'});
const config = require('./config');
const database = require('./database');
config.mysql_analytics.charset= 'utf8mb4';
const mysql = new database(config.mysql_analytics);
const FlagrUtility = require('./flagrData');
const notificationType= 'inactive_no_login_10_day';
const redisClient = require('./redis');
main(mysql, redisClient)

//This script will run every minute
async function main (mysql, redisClient){
	try{
		const staticChannelList = await getChannelList(mysql);
		for (let i = 0; i < staticChannelList.length; i++){
			const dataType = staticChannelList[i].data_type;
			console.log('\ndataType > ', dataType)
			const dataTypeArr = dataType.split("_");
			const studentId = dataTypeArr[2];
			let qList = [];
			if (staticChannelList[i].class === 'all'){
				qList = await getQuestions(mysql, studentId);
			} else {
				qList = await getQuestionsWithClass(mysql, studentId, staticChannelList[i].class);
			}
			if (qList.length > 0){
                const qidArr = qList.map((x) => x.question_id);
				console.log('qidArr len > ', qidArr.length)
				await setIntoRedis(redisClient, dataType, qidArr);
			}
		}
        console.log("success at: "+new Date())
        mysql.connection.end();
		redisClient.disconnect();
    }catch(e){
        console.log(e)
    }
}

function getChannelList(mysql){
	let sql= 'SELECT * FROM `channels` WHERE `type` = "STATIC_CHANNEL"';
    return mysql.query(sql)
}

function getQuestions(mysql, sid){
	let sql= 'SELECT q.question_id FROM questions q INNER JOIN answers ans ON q.question_id = ans.question_id WHERE q.student_id = '+sid+' AND q.is_answered = 1 AND q.is_text_answered <> 1 AND ans.answer_video <> "" AND ans.answer_video IS NOT NULL AND ans.duration <> "" AND ans.duration IS NOT NULL AND ans.duration <> 0 ORDER BY q.question_id DESC';
	console.log('sql > ', sql)
	return mysql.query(sql)
}

function getQuestionsWithClass(mysql, sid, cls){
	let sql= 'SELECT q.question_id FROM questions q INNER JOIN answers ans ON q.question_id = ans.question_id WHERE q.student_id = '+sid+' AND q.class IN ("", "all", '+cls+') AND q.is_answered = 1 AND q.is_text_answered <> 1 AND ans.answer_video <> "" AND ans.answer_video IS NOT NULL AND ans.duration <> "" AND ans.duration IS NOT NULL AND ans.duration <> 0 ORDER BY q.question_id DESC';
	console.log('sql with class > ', sql)
    return mysql.query(sql)
}

function setIntoRedis(client, redisKey, qidArr){
    console.log(redisKey, qidArr.length)
	client.set(redisKey, JSON.stringify(qidArr), 'Ex', 60 * 60 * 24);
}
