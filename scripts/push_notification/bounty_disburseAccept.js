"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
// const database = require('../../api_server/config/database');
const database = require('./database');
const UtilityMail = require('../../api_server/modules/Utility.mail');
const mysql = new database(config.mysql_analytics);
const mysqlwr = new database(config.mysql_write);
main(mysql,mysqlwr);


async function getStudentsWithAcceptedAnswers(mysql){
    const sql = `select bad.student_id, bad.answer_id, bad.bounty_id from bounty_answer_detail bad join bounty_post_detail bpd on bpd.bounty_id = bad.bounty_id where bpd.bounty_amount = 0 and bad.acceptance_flag = 1 and bad.created_at >= DATE_SUB(NOW(),INTERVAL 24 HOUR) limit 200`;
    return mysql.query(sql);
}

async function checkForPaytmPhone(mysql, student_id){
    const sql = `select * from payment_info_paytm where student_id =${student_id}`;
    return mysql.query(sql);
}

async function insertBountyDisburse(mysqlwr, obj){
    const sql = 'INSERT INTO bounty_disbursement SET ?';
    return mysqlwr.query(sql, obj);
}

async function checkStudentExists(mysql, obj){
    const sql = `select student_id from bounty_disbursement where bounty_id = ${obj.bounty_id} and answer_id = ${obj.answer_id}`;
    return mysql.query(sql, obj);
}

function createObj(students, mobile, amt){
    const obj = {
        student_id: students.student_id,
        bounty_id: students.bounty_id,
        answer_id: students.answer_id,
        amount_to_disburse: amt,
        type: 'bounty-zero-disburse',
        phone: mobile,
    }
    return obj;
}

async function checkToInsert(mysql, obj){
    const student_exists = await checkStudentExists(mysql, obj);
    console.log(student_exists, 'student_exists')

    if(student_exists.length == 0){
        return 1;
    }
    return 0;

}

async function insertIntoBountyDisbursement(students, amt, mysql, mysqlwr){
    let mobile;
    for(let i = 0; i<students.length; i++){
        const phone = await checkForPaytmPhone(mysql, students[i].student_id);
        if(phone.length == 0){
            mobile = 0;
        } else{
            mobile = phone[0].phone;
        }
        const obj = createObj(students[i], mobile, amt);
        console.log(obj);
        const isInsert = await checkToInsert(mysql, obj);
        console.log(isInsert, 'isInsert')
        if(isInsert){
            await insertBountyDisburse(mysqlwr, obj);
        }
        console.log('not insert')
        console.log('done');
        
    }
}

function getAmountToDisburse(len){
    let amount_to_disburse;
    if(len <=66){
        amount_to_disburse = 3;
    } else if(len>66 && len<100){
        amount_to_disburse = 2
    } else{
        amount_to_disburse = 1;
    }
    return amount_to_disburse;
}

async function main(mysql, mysqlwr){
    try{
        const students = await getStudentsWithAcceptedAnswers(mysql);
        const amt = getAmountToDisburse(students.length);
        await insertIntoBountyDisbursement(students, amt, mysql, mysqlwr);
        await UtilityMail.sendMailViaSendGrid(config, "autobot@doubtnut.com", "gaurang.sinha@doubtnut.com", "cron-for-bounty-disburseAccept", "Cron has run");
        await UtilityMail.sendMailViaSendGrid(config, "autobot@doubtnut.com", "atur@doubtnut.com", "cron-for-bounty-disburseAccept", "Cron has run");
    } catch(e){
        console.log(e);
    } finally{
        mysql.connection.end();
    }
    // mysql.connection.end();
}