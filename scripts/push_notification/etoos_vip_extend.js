const moment = require('moment');
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require("./database");
const _ = require("lodash");
const admin = require('firebase-admin');
var rp = require('request-promise');
const daysToExtend = 7;

const serviceAccount = `${__dirname}/../../api_server/${config.GOOGLE_KEYFILE}`;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.firebase.baseUrl,
});
const conWrite = config.mysql_write;
main(conWrite);
async function main(conWrite) {
    try{
        // const startDate = moment('2020-05-19').format('YYYY-MM-DD');
        // console.log(startDate)
        const writeClient = new database(conWrite);
        // get sps affected rows
        const spsData = await getVipUsers(writeClient);
        console.log(spsData)
        console.log(spsData.length)
        for (let i = 0; i < spsData.length; i++) {
            console.log(i)
            const spsID = spsData[i].id
            const studentID = spsData[i].student_id;
            const mobile = spsData[i].mobile;
            const gcmID = spsData[i].gcm_reg_id;
            // update end date
            await sendSMS(mobile);
            // send notification
            const notification_data = {
                event: 'camera',
                title: 'KOTA CLASSES 2.0 with MOTION CLASSES + NV SIR  coming soon!',
                message: "We are sorry that ETOOS India has stopped serving us. In a WEEK we bring you NV sir's MOTION CLASSES-KOTA Lectures/Tests/Live sessions. We are adding ALL VIP PASS users EXTRA 1 MONTH for FREE or REFUND.  Reach us at 01247158250.",
                image: 'https://d10lpgp6xz60nq.cloudfront.net/etoos-motion2.jpeg',
                data:'{}'
            };
            if(!_.isNull(gcmID) && gcmID.length > 0){
                sendNotification(gcmID, notification_data, admin);
            }else{
                console.log('null')
                console.log(studentID)
            }
            // send sms
        }
        // console.log('done')
    } catch (error) {
        console.log(error);
    }
}

function sendNotification(gcmId, message, admin) {
    console.log(gcmId)
    const messageTosend = {};
    messageTosend.token = gcmId;
    messageTosend.data = message;
    messageTosend.android = {
        priority: 'high',
        ttl: 4500,
    };
    return admin
        .messaging()
        .send(messageTosend)
}
function sendSMS(mobile) {
    const formData = {
        To: mobile,
        TemplateName:'disable-etoos2',
        From: 'DOUBTN',
    };
    const options = {
        method: 'POST',
        uri: `https://2factor.in/API/V1/${config.two_fa_key}/ADDON_SERVICES/SEND/TSMS`,
        formData: formData,
    };
    return rp(options);
}
function updateSpsEndDate(client, endDate, id){
    let query = `update student_package_subscription set end_date = '${endDate}' where id = ${id}`;
    console.log(query);
    return client.query(query);
}

function getSpsData(client, startDate) {
    const query = `select * from (select * from student_package_subscription where start_date='${startDate}' order by start_date) as a left join (select mobile,student_id from students) as b on a.student_id=b.student_id`;
    console.log(query);
    return client.query(query);
}

// function getVipUsers(client) {
//     const query = 'select * from (select * from student_package_subscription where amount <> -1 and end_date >CURRENT_TIMESTAMP order by start_date) as a left join (select mobile, student_id, gcm_reg_id from students) as b on a.student_id=b.student_id';
//     console.log(query);
//     return client.query(query);
// }

function getVipUsers(client) {
    const query = 'select * from ((select * from sms_campaign) as a left join (select student_id, mobile, gcm_reg_id from students) as b on a.mobile=b.mobile)';
    console.log(query);
    return client.query(query);
}
