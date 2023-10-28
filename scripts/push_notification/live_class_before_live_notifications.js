"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
const mysqlR = new database(config.mysql_analytics)
const mysqlW = new database(config.mysql_write)
let configRedshift = require("./config")
const request = require('request');



main()
async function main (){
	try{
        let dateUTC = new Date();
        dateUTC = dateUTC.getTime();
        const dateIST = new Date(dateUTC);
        dateIST.setHours(dateIST.getHours() + 5);
        dateIST.setMinutes(dateIST.getMinutes() + 30);
        console.log(dateIST.getHours()+1)
        let questionData = await getAllQuestions(dateIST.getHours()+1);
        // console.log(questionData)
        for(let i=0; i< questionData.length;i++){
            console.log(questionData[i].resource_reference);
            const response =await getWatchedStudents(questionData[i].resource_reference);
            if(response && response.length > 0) {
                const students = response.map((a) => a.student_id);  
                const studentDetails = await getClassAndLocale(students)
                const student_en = []
                const student_hi = []
                for(let j=0; j< studentDetails.length;j++) {
                    let stu = {};
                    stu.id = studentDetails[j].student_id;
                    stu.gcmId = studentDetails[j].gcm_reg_id;
                    if(studentDetails[j].locale == 'hi'){
                        student_hi.push(stu);
                    }else{
                        student_en.push(stu);
                    }
                }
                // console.log(student_en)
                // console.log(student_hi)
                if(student_en.length > 0){
                    const notificationPayload = {}
                    notificationPayload.event = "live_class";
                    notificationPayload.title = "5 Log already JEET chuke h aaj CASH CONTEST⚔️";
                    notificationPayload.message = "Abhi kro attend live class and pao ₹5,000 tak ke inam ka mauka🏆";
                    notificationPayload.s_n_id = "PAGELIV2";
                    notificationPayload.firebase_eventtag = 'PAGELIV2';
                    notificationPayload.data={};
                    notificationPayload.data.id=questionData[i].resource_reference;
                    notificationPayload.data.page="LIVECLASS_NOTIFICATION";
                    await sendNotification(student_en, notificationPayload);
                }
                if(student_hi.length > 0){
                    const notificationPayload = {}
                    notificationPayload.event = "live_class";
                    notificationPayload.title = "आपकी क्लास के 5  लॉग जीत चुके है CASH CONTEST⚔️";
                    notificationPayload.message = "अभी करो लाइव क्लास और पाओ ₹5,000 टेक के इनम जितने का मौका🏆 ";
                    notificationPayload.s_n_id = "PAGELIV1";
                    notificationPayload.firebase_eventtag = 'PAGELIV1';
                    notificationPayload.data={};
                    notificationPayload.data.id=questionData[i].resource_reference;
                    notificationPayload.data.page="LIVECLASS_NOTIFICATION";
                    await sendNotification(student_hi, notificationPayload);
                }
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


function getAllQuestions(hour){
    const sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE and hour(live_at)='"+hour+"') as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
}

function getWatchedStudents(question_id){
    let sql = "select distinct(student_id) from video_view_stats where date(created_at) = CURRENT_DATE  and question_id ='"+question_id+"'"
    return mysqlR.query(sql);
}

function getClassAndLocale(students) {
    let sql = "select student_class, locale, gcm_reg_id, student_id from students where student_class in ('9', '10', '11', '12', '13') and student_id in (?) and gcm_reg_id is not null";
    return mysqlR.query(sql, [students]);
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
