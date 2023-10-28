/***
 * Cron to send payment links to users
 */

"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
const moment = require('moment')
const mysqlRead = new database(config.mysql_analytics)
const mysqlWrite = new database(config.write_mysql)
const sendgrid = require("sendgrid")(config.send_grid_key);
const helper = require("sendgrid").mail;
const axios = require("axios");



const now = moment().add(5, 'hours').add(30, 'minutes');
const nowFormatted = now.add(-1,"days").format('YYYY-MM-DD');


async function getEligibleUsers(){
    let q = `SELECT s.mobile, ps.*, DATEDIFF(ps.next_part_payment_date, CURDATE()) AS days FROM payment_summary ps JOIN students s ON s.student_id = ps.student_id WHERE (ps.is_refunded = 0 OR ps.is_refunded IS NULL) AND ps.next_package_id IS NULL AND type = 'emi' AND ((DATE(ps.next_part_payment_date) = DATE_ADD(CURDATE(), INTERVAL 7 DAY)) OR (DATE(ps.next_part_payment_date) = DATE_ADD(CURDATE(), INTERVAL 3 DAY)) OR (DATE(ps.next_part_payment_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY))) ORDER BY days DESC`
    return mysqlRead.query(q)
}


async function sendReminder(id,mobile){

    var config = {
        method: 'get',
        url: `https://api.doubtnut.com/v1/package/follow-up?id=${id}&mobile=${mobile}`,
        timeout:3000
    };

    const { data } = await axios(config);

    return data;

}


async function saveReminderInfo(student_id)
{
    let q = `insert into payment_info_invoice set student_id = ${student_id} , payment_info_id = (select id from payment_info where student_id = ${student_id} and payment_for = "vip_offline"  and status = "INITIATED" order by id desc limit 1)`;
    console.log(q);

    return mysqlWrite.query(q)

}


async function sendPaymentReminder(){

    try {
        let studentList = await getEligibleUsers();

        let studentFinal = []

        for(let i = 0; i < studentList.length; i++)
        {
            try {
                let response = await sendReminder(studentList[i].id, studentList[i].mobile);
                await saveReminderInfo(studentList[i].student_id)
                studentFinal.push({student_id: studentList[i].student_id, "invoice_id":response.data.url});
            }
            catch(e)
            {
                console.log("e",e);
            }
        }

        console.log("studentFinal", JSON.stringify(studentFinal));
        if(studentFinal.length) {
            sendMail("CRON | Payment Reminder cron ran successfully", "Reminder sent to StudentId : "+ JSON.stringify(studentFinal))
        }
        else {
            sendMail("CRON | Payment Reminder cron ran successfully", "No student found")
        }
    }

    catch(e)
    {

        sendMail("CRON | ALERT!!! Exception in Payment Reminder ",e);

    }

    mysqlRead.connection.end();
    mysqlWrite.connection.end();

}


function sendMail(subject,body)
{
    let from_email = new helper.Email("autobot@doubtnut.com");
    let to_email = new helper.Email("tech-alerts@doubtnut.com");

    let content = new helper.Content("text/html", body.toString())
    let mail = new helper.Mail(from_email, subject, to_email, content);

    var sg = sendgrid.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
    });

    sendgrid.API(sg, function (error, response) {
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
    })
}




sendPaymentReminder();