"use strict";
const _ = require('lodash');
require('dotenv').config({path : __dirname + '/../api_server/.env'});
const config = require(__dirname+'/../api_server/config/config');
const Database = require(__dirname+'/../api_server/config/database');
const mysql = new Database(config.write_mysql);
const mysqlr = new Database(config.read_mysql);
const questionAskUrlPrefix = 'https://d10lpgp6xz60nq.cloudfront.net/images/';

async function getQuestion(){
    const sql = 'select a.*, now() as curr_time from insert_into_bounty a';
    return mysqlr.query(sql)
}

async function getQuestionDetails(qid){
    const sql = 'select * from questions where question_id = ' +qid;
    return mysqlr.query(sql);
}

function insert_into_bounty(obj){
    const sql = `INSERT INTO bounty_post_detail (student_id, question_id, bounty_ques_img, is_active, is_answered, bounty_amount, question_subject, student_class, expired_at) VALUES (${obj.student_id}, ${obj.question_id}, '${obj.bounty_ques_img}', ${obj.is_active}, ${obj.is_answered}, ${obj.bounty_amount}, '${obj.question_subject}', ${obj.student_class}, NOW() + INTERVAL 1 DAY) `;
    return mysql.query(sql);
}

async function main(){
    try{
      const bountyToRaise = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      console.log(bountyToRaise.length)
      const amount = bountyToRaise[ Math.floor(Math.random() * (bountyToRaise.length))];
      const bounty_details = await getQuestion()
      const question_details = await getQuestionDetails(bounty_details[0].question_id);
      for(let i = 0; i<bounty_details.length; i++){
        console.log(i)
        const obj = {
          student_id: bounty_details[i].student_id,
          question_id: bounty_details[i].question_id,
          bounty_ques_img: questionAskUrlPrefix + question_details[0].question_image,
          is_delete: 0,
          is_active: 1,
          is_answered: 0,
          bounty_amount: amount,
          expired_at: bounty_details[i].curr_time,
          question_subject: question_details[0].subject,
          student_class: bounty_details[i].student_class,
        }   
        console.log(obj)
        await insert_into_bounty(obj);
      }
    } catch(e){
      console.log(e)
    }
  }

  main()
