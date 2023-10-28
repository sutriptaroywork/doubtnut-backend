"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
const mysqlR = new database(config.read_mysql);
const mysqlW = new database(config.mysql_write);
const request = require('request');
const _ = require('lodash');


main()
async function main (){
	try{
        let questionData = await getAllQuestions();
        const qids = questionData.map((a) => a.resource_reference);
        let watchedStudents = await getUserVideoWatched(qids);
        let students = await getPaidUsers();
        watchedStudents = watchedStudents.map((a) => a.student_id);
        if(questionData.length > 0 && students.length > 0) {
            const notificationPayload = {}
            notificationPayload.event = "live_class";
            notificationPayload.title = "Dear VIP, आज लाइव क्लास में शामिल नहीं हो सके ❓";
            notificationPayload.message = "देखिए आज लाइव क्लास में क्या हुआ😀 अभी चेक करें✔️👀";
            notificationPayload.s_n_id = "10HVIP";
            notificationPayload.firebase_eventtag = '10HVIP';
            notificationPayload.data={};
            notificationPayload.data.id=questionData[0].resource_reference;
            notificationPayload.data.page="LIVECLASS_NOTIFICATION";
            const allStudents = [];
            for(let i=0; i< students.length ; i++) {
                if(!watchedStudents.includes(students[i].student_id)) {
                    let stu = {};
                    stu.id = students[i].student_id;
                    stu.gcmId = students[i].gcm_reg_id;
                    allStudents.push(stu)
                }
            }
            await sendNotification(allStudents, notificationPayload);
        }
        let questionData12 = await getAll12Questions();
        let students12 = await get12PaidUsers();
        const qids12 = questionData12.map((a) => a.resource_reference);
        let watchedStudents12 = await getUserVideoWatched(qids12);
        if(questionData12.length > 0 && students12.length > 0) {
            const notificationPayload12 = {}
            notificationPayload12.event = "live_class";
            notificationPayload12.title = "Dear VIP, आज लाइव क्लास में शामिल नहीं हो सके ❓";
            notificationPayload12.message = "देखिए आज लाइव क्लास में क्या हुआ😀 अभी चेक करें✔️👀";
            notificationPayload12.s_n_id = "12HVIP";
            notificationPayload12.firebase_eventtag = '12HVIP';
            notificationPayload12.data={};
            notificationPayload12.data.id=questionData12[0].resource_reference;
            notificationPayload12.data.page="LIVECLASS_NOTIFICATION";
            const allStudents12 = [];
            for(let i=0; i< students12.length ; i++) {
                if(!watchedStudents12.includes(students12[i].student_id)) {
                    let stu = {};
                    stu.id = students12[i].student_id;
                    stu.gcmId = students12[i].gcm_reg_id;
                    allStudents12.push(stu)
                }
            }
            await sendNotification(allStudents12, notificationPayload12);
        }

    }catch(e){
        console.log(e)
        mysqlR.connection.end();
        mysqlW.connection.end();
    }finally {
          console.log("the script successfully ran at "+ new Date())
          mysqlR.connection.end();
          mysqlW.connection.end();
    }
}

function getAllQuestions(){
    const sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4 and liveclass_course_id=22) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE) as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
}

function getAll12Questions(){
    const sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4 and liveclass_course_id=24) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE) as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
}

function getUserVideoWatched(qids) {
    let sql = "select distinct(student_id) from video_view_stats where date(created_at) = CURDATE() and question_id in (?)";
    return mysqlR.query(sql,[qids]);
}

function getPaidUsers(){
    let sql = "Select d.student_id, e.gcm_reg_id, e.student_class from (SELECT * FROM liveclass_course where id = 22) as a left join student_master_package as b on a.category_id = b.category_id left join student_package as c on b.id = c.subcategory_id left join student_package_subscription as d on c.id=d.student_package_id left join students as e on d.student_id=e.student_id where d.student_id is not null and e.student_class=10";
    return mysqlR.query(sql);
}

function get12PaidUsers() {
    let sql = "Select d.student_id, e.gcm_reg_id, e.student_class from (SELECT * FROM liveclass_course where id = 24) as a left join student_master_package as b on a.category_id = b.category_id left join student_package as c on b.id = c.subcategory_id left join student_package_subscription as d on c.id=d.student_package_id left join students as e on d.student_id=e.student_id where d.student_id is not null and e.student_class=12";
    return mysqlR.query(sql);
}

async function sendNotification(user, notificationInfo) {
    console.log('notificationInfo');
    console.log(notificationInfo)
    console.log(user.length)
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