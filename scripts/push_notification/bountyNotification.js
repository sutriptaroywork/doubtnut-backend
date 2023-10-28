"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
// const database = require('../../api_server/config/database');
const database = require('./database');
const bountyNotification = require('../../api_server/server/v1/bounty/bountyNotificationController');
const UtilityMail = require('../../api_server/modules/Utility.mail');
const mysql = new database(config.mysql_analytics);
main(mysql)



async function getStudentsToNotify(mysql){
  const sql = `Select student_id from students where (student_id % 4 = 0) and app_version in ('7.8.43', '7.8.44', '7.8.45', '7.8.46', '7.8.47', '7.8.48')`;
  return mysql.query(sql);
}

async function checkForBountyQuestion(mysql){
  const sql = `Select * from bounty_post_detail where created_at >= DATE_SUB(NOW(),INTERVAL 24 HOUR) and bounty_amount > 0 and is_delete = 0 and is_active = 1`;
  return mysql.query(sql);
}

function waitForASec(time){
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      console.log('wait');
      resolve(true);
    }, time)
  })
}

async function sendNotification(students){
  for (let i = 0; i < students.length; i++) {
    const params = {
      type: 'bounty_raise_notification',
      student_id: students[i].student_id,
      }
      try{
        await bountyNotification.sendBountyNotification(mysql, params);
      } catch(e){
        console.log(e);
      }
      console.log('sent', i);
      await waitForASec(50);
    }
}

async function main(mysql){
    try {
      const checkToSendNotification = await checkForBountyQuestion(mysql);
      console.log(checkToSendNotification.length);
      if (checkToSendNotification.length) {
        const students = await getStudentsToNotify(mysql);
          // const students = [{student_id: 8306072}, {student_id: 7887845}];
          await sendNotification(students);
        }
        await UtilityMail.sendMailViaSendGrid(config, "autobot@doubtnut.com", "gaurang.sinha@doubtnut.com", "cron-for-bountyNotification", "Cron has run");
        await UtilityMail.sendMailViaSendGrid(config, "autobot@doubtnut.com", "atur@doubtnut.com", "cron-for-bountyNotification", "Cron has run");

    } catch(e) {
        console.log(e);
    } finally{
      mysql.connection.end();
    }
}