"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
// config.read_mysql.host="reader-1.cpymfjcydr4n.ap-south-1.rds.amazonaws.com"
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
        let class6Questions=[];
        let class7Questions=[];
        let class8Questions=[];
        let class9Questions=[];
        let class10Questions=[];
        let class11Questions=[];
        let class12Questions=[];
        let allStudents = await getAllStudents();
        let questionData = await getAllQuestions();
        for(let j=0; j< questionData.length;j++){
            if(questionData[j].class == 9) {
                class9Questions.push(questionData[j].resource_reference);
            }else if(questionData[j].class == 10){
                class10Questions.push(questionData[j].resource_reference);
            }else if(questionData[j].class == 11){
                class11Questions.push(questionData[j].resource_reference);
            }else if(questionData[j].class == 12){
                class12Questions.push(questionData[j].resource_reference);
            }else if(questionData[j].class == 6){
                class6Questions.push(questionData[j].resource_reference);
            }else if(questionData[j].class == 7){
                class7Questions.push(questionData[j].resource_reference);
            }else if(questionData[j].class == 8){
                class8Questions.push(questionData[j].resource_reference);
            }
        }
        console.log(class9Questions)
        console.log(class10Questions)
        console.log(class11Questions)
        console.log(class12Questions)
        let students= [];
        for(let i=0; i< allStudents.rows.length;i++) {
            students.push(allStudents.rows[i].student_id)
            if(students.length == 1000){
                let studentDetails = await getClassAndLocale(students);
                let promises = []
                console.log(studentDetails.length)
                for(let k=0; k< studentDetails.length;k++){
                    promises.push(checkAndSendNotification(studentDetails[k], class9Questions,  class10Questions, class11Questions, class12Questions, class6Questions, class7Questions, class8Questions))
                    if((k != 0 && k%300 ==0) || k == studentDetails.length-1){
                        const resolvedPromises = await Promise.all(promises);
                        promises = []
                        // break;
                    }
                }
                students=[]
                // break;
            }
        }
       
        console.log("the script successfully ran at "+ new Date())

    }catch(e){
      console.log(e)
      mysqlR.connection.end();
      mysqlW.connection.end();
    }finally {
        mysqlR.connection.end();
        mysqlW.connection.end();
    }
}


async function checkAndSendNotification(student, class9Questions,  class10Questions, class11Questions, class12Questions, class6Questions, class7Questions, class8Questions) {
    if(student.student_class == 9) {
        const check = await checkWatched(class9Questions, student.student_id);
        if(!check){
            if(student.locale == 'hi'){
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "आज का कांटेस्ट सवाल मिस हो गया क्या❓";
                notificationPayload.message = "अभी देखो आज की लाइव क्लास😀और पाओ ₹5000 कमाने का दूसरा मौका✔️✔️";
                notificationPayload.s_n_id = "9SUMMAR1";
                notificationPayload.firebase_eventtag = '9SUMMAR1';
                notificationPayload.data={};
                notificationPayload.data.qid=class9Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video"
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }else{
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "Aaj ka contest question MISS ho gya kya❓";
                notificationPayload.message = "Abhi dekho aaj ki LIVE CLASS😀aur paao ₹5000 kamaane ka dusra mauka✔️✔️";
                notificationPayload.s_n_id = "9SUMMAR2";
                notificationPayload.firebase_eventtag = '9SUMMAR2';
                notificationPayload.data={};
                notificationPayload.data.qid=class9Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video"
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }
        }
    }else if(student.student_class == 10){
        const check = await checkWatched(class10Questions, student.student_id);
        if(!check){
            if(student.locale == 'hi'){
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "आज का कांटेस्ट सवाल मिस हो गया क्या❓";
                notificationPayload.message = "अभी देखो आज की लाइव क्लास😀और पाओ ₹5000 कमाने का दूसरा मौका✔️✔️";
                notificationPayload.s_n_id = "10SUMMAR1";
                notificationPayload.firebase_eventtag = '10SUMMAR1';
                notificationPayload.data={};
                notificationPayload.data.qid=class10Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }else{
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "Aaj ka contest question MISS ho gya kya❓";
                notificationPayload.message = "Abhi dekho aaj ki LIVE CLASS😀aur paao ₹5000 kamaane ka dusra mauka✔️✔️";
                notificationPayload.s_n_id = "10SUMMAR2";
                notificationPayload.firebase_eventtag = '10SUMMAR2';
                notificationPayload.data={};
                notificationPayload.data.qid=class10Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }
        }
    }else if(student.student_class == 11){
        const check = await checkWatched(class11Questions, student.student_id);
        if(!check){
            if(student.locale == 'hi'){
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "आज का कांटेस्ट सवाल मिस हो गया क्या❓";
                notificationPayload.message = "अभी देखो आज की लाइव क्लास😀और पाओ ₹5000 कमाने का दूसरा मौका✔️✔️";
                notificationPayload.s_n_id = "11SUMMAR1";
                notificationPayload.firebase_eventtag = '11SUMMAR1';
                notificationPayload.data={};
                notificationPayload.data.qid=class11Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }else{
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "Aaj ka contest question MISS ho gya kya❓";
                notificationPayload.message = "Abhi dekho aaj ki LIVE CLASS😀aur paao ₹5000 kamaane ka dusra mauka✔️✔️";
                notificationPayload.s_n_id = "11SUMMAR2";
                notificationPayload.firebase_eventtag = '11SUMMAR2';
                notificationPayload.data={};
                notificationPayload.data.qid=class11Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }
        }
    }else if(student.student_class == 12){
        const check = await checkWatched(class12Questions, student.student_id);
        if(!check){
            if(student.locale == 'hi'){
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "आज का कांटेस्ट सवाल मिस हो गया क्या❓";
                notificationPayload.message = "अभी देखो आज की लाइव क्लास😀और पाओ ₹5000 कमाने का दूसरा मौका✔️✔️";
                notificationPayload.s_n_id = "12SUMMAR1";
                notificationPayload.firebase_eventtag = '12SUMMAR1';
                notificationPayload.data={};
                notificationPayload.data.qid=class12Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }else{
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "Aaj ka contest question MISS ho gya kya❓";
                notificationPayload.message = "Abhi dekho aaj ki LIVE CLASS😀aur paao ₹5000 kamaane ka dusra mauka✔️✔️";
                notificationPayload.s_n_id = "12SUMMAR2";
                notificationPayload.firebase_eventtag = '12SUMMAR2';
                notificationPayload.data={};
                notificationPayload.data.qid=class12Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }
        }
    }else if(student.student_class == 13){
        const check = await checkWatched(class12Questions, student.student_id);
        if(!check){
            if(student.locale == 'hi'){
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "आज का कांटेस्ट सवाल मिस हो गया क्या❓";
                notificationPayload.message = "अभी देखो आज की लाइव क्लास😀और पाओ ₹5000 कमाने का दूसरा मौका✔️✔️";
                notificationPayload.s_n_id = "13SUMMAR1";
                notificationPayload.firebase_eventtag = '13SUMMAR1';
                notificationPayload.data={};
                notificationPayload.data.qid=class12Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }else{
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "Aaj ka contest question MISS ho gya kya❓";
                notificationPayload.message = "Abhi dekho aaj ki LIVE CLASS😀aur paao ₹5000 kamaane ka dusra mauka✔️✔️";
                notificationPayload.s_n_id = "13SUMMAR2";
                notificationPayload.firebase_eventtag = '13SUMMAR2';
                notificationPayload.data={};
                notificationPayload.data.qid=class12Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }
        }
    }else if(student.student_class == 6){
        const check = await checkWatched(class6Questions, student.student_id);
        if(!check){
            if(student.locale == 'hi'){
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "आज का कांटेस्ट सवाल मिस हो गया क्या❓";
                notificationPayload.message = "अभी देखो आज की लाइव क्लास😀और पाओ ₹5000 कमाने का दूसरा मौका✔️✔️";
                notificationPayload.s_n_id = "6SUMMAR1";
                notificationPayload.firebase_eventtag = '6SUMMAR1';
                notificationPayload.data={};
                notificationPayload.data.qid=class6Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }else{
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "Aaj ka contest question MISS ho gya kya❓";
                notificationPayload.message = "Abhi dekho aaj ki LIVE CLASS😀aur paao ₹5000 kamaane ka dusra mauka✔️✔️";
                notificationPayload.s_n_id = "6SUMMAR2";
                notificationPayload.firebase_eventtag = '6SUMMAR2';
                notificationPayload.data={};
                notificationPayload.data.qid=class6Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }
        }
    }else if(student.student_class == 7){
        const check = await checkWatched(class7Questions, student.student_id);
        if(!check){
            if(student.locale == 'hi'){
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "आज का कांटेस्ट सवाल मिस हो गया क्या❓";
                notificationPayload.message = "अभी देखो आज की लाइव क्लास😀और पाओ ₹5000 कमाने का दूसरा मौका✔️✔️";
                notificationPayload.s_n_id = "7SUMMAR1";
                notificationPayload.firebase_eventtag = '7SUMMAR1';
                notificationPayload.data={};
                notificationPayload.data.qid=class7Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }else{
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "Aaj ka contest question MISS ho gya kya❓";
                notificationPayload.message = "Abhi dekho aaj ki LIVE CLASS😀aur paao ₹5000 kamaane ka dusra mauka✔️✔️";
                notificationPayload.s_n_id = "7SUMMAR2";
                notificationPayload.firebase_eventtag = '7SUMMAR2';
                notificationPayload.data={};
                notificationPayload.data.qid=class7Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }
        }
    }else if(student.student_class == 8){
        const check = await checkWatched(class8Questions, student.student_id);
        if(!check){
            if(student.locale == 'hi'){
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "आज का कांटेस्ट सवाल मिस हो गया क्या❓";
                notificationPayload.message = "अभी देखो आज की लाइव क्लास😀और पाओ ₹5000 कमाने का दूसरा मौका✔️✔️";
                notificationPayload.s_n_id = "8SUMMAR1";
                notificationPayload.firebase_eventtag = '8SUMMAR1';
                notificationPayload.data={};
                notificationPayload.data.qid=class8Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }else{
                const notificationPayload = {}
                notificationPayload.event = "video";
                notificationPayload.title = "Aaj ka contest question MISS ho gya kya❓";
                notificationPayload.message = "Abhi dekho aaj ki LIVE CLASS😀aur paao ₹5000 kamaane ka dusra mauka✔️✔️";
                notificationPayload.s_n_id = "8SUMMAR2";
                notificationPayload.firebase_eventtag = '8SUMMAR2';
                notificationPayload.data={};
                notificationPayload.data.qid=class8Questions[0];
                notificationPayload.data.page="NOTIFICATION";
                notificationPayload.data.resource_type = "video";
                const stu = {};
                stu.id = student.student_id;
                stu.gcmId = student.gcm_reg_id;
                console.log(notificationPayload)
                console.log(stu)
                const students = []
                students.push(stu)
                await sendNotification(students, notificationPayload);
            }
        }
    }
    
}


async function checkWatched(questions, student_id) { 
    let sql = "SELECT question_id FROM `video_view_stats` where question_id in ("+questions.join()+") and student_id='"+student_id+"' and DATE(created_at) =CURRENT_DATE  GROUP by question_id"
    const res = await mysqlR.query(sql);
    if(res.length ==  questions.length){
        return true
    }
    return false;
}

function getClassAndLocale(students) {
    let sql = "select student_class, locale, gcm_reg_id, student_id from students where student_class in ('9', '10', '11', '12', '13') and student_id in (?)";
    return mysqlR.query(sql, [students]);
}

function getWatchedStudents(quesionIdArray){
    let sql = "select distinct(student_id) from video_view_stats where date(created_at) = CURRENT_DATE  and question_id in ("+quesionIdArray.join()+")"
    return mysqlR.query(sql);
}

async function getAllStudents(){
    try {
        let sql="SELECT distinct(student_id) FROM classzoo1.video_view_stats where created_at >= current_date-5 and source= 'android'";
        const result = await redshiftClient.query(sql);
        return result;
    } catch (e) {
        console.log("error", e);
    }
}

function getAllQuestions(){
    const sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE) as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
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
