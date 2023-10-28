"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
// const database = require('../../api_server/config/database');
const database = require('./database');
const bountyNotification = require('../../api_server/server/v1/bounty/bountyNotificationController');
const UtilityMail = require('../../api_server/modules/Utility.mail');
const mysql = new database(config.mysql_analytics)
main(mysql);


// async function getBountyIdsNotAccepted(mysql){
//     const sql = 'SELECT bpd.student_id, bpd.question_id from bounty_answer_detail a JOIN (SELECT answer_id, COUNT(bounty_id) as cnt from bounty_answer_detail where acceptance_flag = 0 and is_delete = 0 GROUP by bounty_id) b on a.answer_id = b.answer_id join bounty_post_detail bpd on bpd.bounty_id = a.bounty_id where b.cnt = 1 and bpd.is_active = 1 and bpd.is_delete = 0 and bpd.is_answered = 1';
//     return mysql.query(sql);
// }

async function getBountyIdsNotAccepted(mysql){
    const sql = `select bounty_id, student_id, question_id from bounty_post_detail where is_accepted = 0 and is_delete = 0 and is_active = 1 and is_answered = 1 and created_at > NOW() - INTERVAL 2 DAY`;
    return mysql.query(sql);
}

async function sendBountyNotification(getStudents, mysql) {
    let checkIfSent = new Set();
    for(let i = 0; i < getStudents.length; i++){
        console.log('check if sent', checkIfSent);
        if(checkIfSent.has(getStudents[i].student_id)){
            console.log('already senttttttt');
        } else{
            checkIfSent.add(getStudents[i].student_id);
            const params = {
                type: 'encourage_to_accept',
                student_id: getStudents[i].student_id,
                question_id: getStudents[i].question_id,
            }
            try{
                await bountyNotification.sendBountyNotification(mysql, params);
            } catch(e){
                console.log(e)
            }
            console.log('sent', i);
            await waitForASec(50);
        }

    }
}

function waitForASec(time){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
        console.log('wait');
        resolve(true);
      }, time)
    })
  }


async function main(mysql){
    try{
        const getStudents = await getBountyIdsNotAccepted(mysql);
        console.log(getStudents.length);
        // const getStudents = [{student_id: 13438573, question_id: 122798280}, {student_id: 8306072, question_id: 123018857}, {student_id: 8306072, question_id: 123018857}]
        await sendBountyNotification(getStudents, mysql);
        await UtilityMail.sendMailViaSendGrid(config, "autobot@doubtnut.com", "gaurang.sinha@doubtnut.com", "cron-for-encourage-to-accept", "Cron has run");
        await UtilityMail.sendMailViaSendGrid(config, "autobot@doubtnut.com", "atur@doubtnut.com", "cron-for-encourage-to-accept", "Cron has run");
    } catch(e) {
        console.log(e);
    } finally{
        mysql.connection.end();
    }
}
