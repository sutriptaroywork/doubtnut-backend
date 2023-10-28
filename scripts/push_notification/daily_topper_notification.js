"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
// config.mysql_analytics.host="app-reader.cluster-custom-cpymfjcydr4n.ap-south-1.rds.amazonaws.com"
const mysqlR = new database(config.mysql_analytics)
const mysqlW = new database(config.mysql_write)
let configRedshift = require("./config")
const request = require('request');
var Redshift = require('node-redshift');
let RSclient = {
    user: configRedshift.redshift.user,
    database: configRedshift.redshift.database,
    password: configRedshift.redshift.password,
    port: configRedshift.redshift.port,
    host: configRedshift.redshift.host,
};

var redshiftClient = new Redshift(RSclient);

main()
async function main (){
	try{
        let students = await getAllStudents();
        // console.log(students)
        // console.log(students)
        let student_en = [];
        let student_hi = [];
        for(let i=0; i< students.rows.length;i++) {
            // console.log("inside")
            // console.log(students.rows[i])
            let stu = {};
            stu.id = students.rows[i].student_id;
            stu.gcmId = students.rows[i].gcm_reg_id;
            if(students.rows[i].locale == 'hi') {
                student_hi.push(stu);
            }else{
                student_en.push(stu);
            }
            if((i%100000 == 0 &&  i != 0) || i == students.rows.length -1) {
                if(student_en.length > 0){
                    const notificationPayload_en = {}
                    notificationPayload_en.event = "personalize";
                    notificationPayload_en.title = "Want to complete your Chapters📖on TIME⏱️";
                    notificationPayload_en.message = "GET STUDY PLAN OF TOPPERS💭Only on DOUBTNUT👈CLICK NOW✔️✔️";
                    notificationPayload_en.image ="https://d10lpgp6xz60nq.cloudfront.net/images/daily_topper_notification.png"
                    notificationPayload_en.s_n_id = "STUDY2";
                    notificationPayload_en.firebase_eventtag = 'STUDY2';
                    notificationPayload_en.data={};
                    notificationPayload_en.data.random="1";
                    await sendNotification(student_en, notificationPayload_en);
                    // console.log(student_en.length)
                }
                    
                if(student_hi.length > 0) {
                    const notificationPayload_hi = {}
                    notificationPayload_hi.event = "personalize";
                    notificationPayload_hi.title = "अपने अध्यायों📖को समय पर पूरा करना चाहते हैं⏱️";
                    notificationPayload_hi.message = "टॉपर्स की अध्ययन योजना प्राप्त करें💭केवल DOUBTNUT पर👈अभी क्लिक करें✔️✔️";
                    notificationPayload_hi.image ="https://d10lpgp6xz60nq.cloudfront.net/images/daily_topper_notification.png"
                    notificationPayload_hi.s_n_id = "STUDY1";
                    notificationPayload_hi.firebase_eventtag = 'STUDY1';
                    notificationPayload_hi.data={};
                    notificationPayload_hi.data.random="1";
                    await sendNotification(student_hi, notificationPayload_hi);
                    // console.log(student_hi.length)
                }    
                student_en = [];
                student_hi = [];
            }
        }

    }catch(e){
        console.log(e)
        mysqlR.connection.end();
        mysqlW.connection.end();
    }finally {
          mysqlR.connection.end();
          mysqlW.connection.end();
    }

}

async function getAllStudents(){
    try {
        const sql = "select locale, gcm_reg_id, student_id from classzoo1.students where is_online >= 739 and gcm_reg_id is not null";
        const result = await redshiftClient.query(sql);
        return result;
    } catch (e) {
        console.log("error", e);
    }
}


async function sendNotification(user, notificationInfo) {
    // console.log('notificationInfo');
    // console.log(notificationInfo)
    // console.log(user)
    const options = {
        method: 'POST',
        url: config.NEWTON_NOTIFICATION_URL,
        headers:
    { 'Content-Type': 'application/json' },
        body:
    { notificationInfo, user },
        json: true,
    };

    // console.log(options);
    return new Promise((resolve, reject) => {
        try {
            request(options, (error, response, body) => {
                if (error) console.log(error);
                console.log(body);
                resolve()
            });
        } catch (err) {
            // fn(err);
            console.log(err);
            reject(err);
        }
    })
}
