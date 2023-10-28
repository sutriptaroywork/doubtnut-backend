/***
 * Cron to check if user is subscribed to VIP
 * If not, make its is_active field in student package subscription to 0
 */

"use strict"
const log = require('why-is-node-running')
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
const mysqlWrite = new database(config.write_mysql)
const sendgrid = require("sendgrid")(config.send_grid_key);
const helper = require("sendgrid").mail


async function setPackageInactive()
{


    let q = `update student_package_subscription set is_active = 0 where end_date < CURRENT_DATE and is_active = 1`;
    return mysqlWrite.query(q)
}


async function deregister(){

    try {
            await setPackageInactive()
            sendMail("CRON | VIP expire cron ran successfully", "")
    }
    catch(e)
    {
        sendMail("CRON | ALERT!!! Exception in expiring VIP",e);
    }

    mysqlWrite.connection.end();

    setTimeout(function () {
        log() // logs out active handles that are keeping node running
    }, 100)

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



deregister();