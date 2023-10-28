"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname + '/../../api_server/config/config');
const database = require(__dirname + '/../../api_server/config/database');
const mysql = new database(config.mysql_analytics);
const mysqlWrite = new database(config.write_mysql);

function mostWatchedVideo(database, sClass){
    const sql = `SELECT a.question_id, count(*) as count1, b.class, b.subject, '' as chapter, b.ocr_text, b.question, b.doubt, 'most_watched' as type from  video_view_stats as a left join questions as b on a.question_id=b.question_id WHERE a.source='android' and a.engage_time<>0 and b.class=? and b.matched_question is null and b.is_answered=1 and a.created_at >= (NOW() - INTERVAL 2 DAY) group by a.question_id ORDER by count1 desc limit 10`;
    return database.query(sql, [sClass]);
}

function insertIntoInappRecent(database, obj){
  const sql = 'INSERT INTO `inapp_search_suggestion_video` set ?'
  return database.query(sql, obj)
}

function tuncateTable(database){
  const sql = 'TRUNCATE inapp_search_suggestion_video'
  return database.query(sql)
}

async function main(mysql){
  const sClass = [6, 7, 8, 9, 10, 11, 12, 14];
  await tuncateTable(mysqlWrite);
  // for recent most watched video
  let promises = [];
  for(let i=0;i <sClass.length; i++){
    promises.push(mostWatchedVideo(mysql, sClass[i]))
  }
  const recentData = await Promise.all(promises);
  console.log(recentData);
  for (let i=0; i<recentData.length; i++){
    promises = []
    for(let j=0; j<recentData[i].length; j++){
      if(recentData[i][j].question_id && recentData[i][j].class){
        let obj = {
            question_id: recentData[i][j].question_id,
            class: recentData[i][j].class,
            subject: recentData[i][j].subject,
            chapter: recentData[i][j].chapter,
            ocr_text: recentData[i][j].ocr_text,
            question: recentData[i][j].question,
            doubt: recentData[i][j].doubt,
            type: recentData[i][j].type,
        }
        promises.push(insertIntoInappRecent(mysqlWrite, obj));
      }
    }
    await Promise.all(promises);
  }
  console.log('done')
  mysql.connection.end();   
  mysqlWrite.connection.end();
  process.exit();
}

main(mysql);




