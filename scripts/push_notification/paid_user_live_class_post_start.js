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
        let dateUTC = new Date();
        dateUTC = dateUTC.getTime();
        const dateIST = new Date(dateUTC);
        dateIST.setHours(dateIST.getHours() + 5);
        dateIST.setMinutes(dateIST.getMinutes() + 30);
        // console.log(dateIST.getHours()+1)
        let questionData = await getAllQuestions(dateIST.getHours());
        let students = await getPaidUsers();
        const qids = questionData.map((a) => a.resource_reference);
        let watchedStudents = await getUserVideoWatched(qids);
        watchedStudents = watchedStudents.map((a) => a.student_id);
        if(questionData.length > 0 && students.length > 0) {
            const notificationPayload = {}
            notificationPayload.event = "live_class";
            notificationPayload.title = "Dear VIP,  "+questionData[0].topic+" की लाइव क्लास शुरू होचुकी है";
            notificationPayload.message = "जल्दी से शुरू करो नहीं तो जरुरी कांसेप्ट मिस होजयेगेंगे✔️";
            notificationPayload.s_n_id = "10HMLIVIP";
            notificationPayload.firebase_eventtag = '10HMLIVIP';
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
        let questionData12 = await getAll12Questions(dateIST.getHours());
        let students12 = await get12PaidUsers();
        const qids12 = questionData12.map((a) => a.resource_reference);
        let watchedStudents12 = await getUserVideoWatched(qids12);
        if(questionData12.length > 0 && students12.length > 0) {
            const notificationPayload12 = {}
            notificationPayload12.event = "live_class";
            notificationPayload12.title = "Dear VIP,  "+questionData12[0].topic+" की लाइव क्लास शुरू होचुकी है";
            notificationPayload12.message = "जल्दी से शुरू करो नहीं तो जरुरी कांसेप्ट मिस होजयेगेंगे✔️";
            notificationPayload12.s_n_id = "12HMLIVIP";
            notificationPayload12.firebase_eventtag = '12HMLIVIP';
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

	let questionData9 = await getAll9Questions(dateIST.getHours());
        let students9 = await get9PaidUsers();
        const qids9 = questionData9.map((a) => a.resource_reference);
        let watchedStudents9 = await getUserVideoWatched(qids9);
        if(questionData9.length > 0 && students9.length > 0) {
            const notificationPayload9 = {}
            notificationPayload9.event = "live_class";
            notificationPayload9.title = "Dear VIP,  "+questionData9[0].topic+" की लाइव क्लास शुरू होचुकी है";
            notificationPayload9.message = "जल्दी से शुरू करो नहीं तो जरुरी कांसेप्ट मिस होजयेगेंगे✔️";
            notificationPayload9.s_n_id = "9HMLIVIP";
            notificationPayload9.firebase_eventtag = '9HMLIVIP';
            notificationPayload9.data={};
            notificationPayload9.data.id=questionData9[0].resource_reference;
            notificationPayload9.data.page="LIVECLASS_NOTIFICATION";
            const allStudents9 = [];
            for(let i=0; i< students9.length ; i++) {
                if(!watchedStudents9.includes(students9[i].student_id)) {
                    let stu = {};
                    stu.id = students9[i].student_id;
                    stu.gcmId = students9[i].gcm_reg_id;
                    allStudents9.push(stu)
                }
            }
            await sendNotification(allStudents9, notificationPayload9);
        }

	let questionData11 = await getAll11Questions(dateIST.getHours());
        let students11 = await get11PaidUsers();
        const qids11 = questionData11.map((a) => a.resource_reference);
        let watchedStudents11 = await getUserVideoWatched(qids11);
        if(questionData11.length > 0 && students11.length > 0) {
            const notificationPayload11 = {}
            notificationPayload11.event = "live_class";
            notificationPayload11.title = "Dear VIP,  "+questionData11[0].topic+" की लाइव क्लास शुरू होचुकी है";
            notificationPayload11.message = "जल्दी से शुरू करो नहीं तो जरुरी कांसेप्ट मिस होजयेगेंगे✔️";
            notificationPayload11.s_n_id = "11HMLIVIP";
            notificationPayload11.firebase_eventtag = '11HMLIVIP';
            notificationPayload11.data={};
            notificationPayload11.data.id=questionData11[0].resource_reference;
            notificationPayload11.data.page="LIVECLASS_NOTIFICATION";
            const allStudents11 = [];
            for(let i=0; i< students11.length ; i++) {
                if(!watchedStudents11.includes(students11[i].student_id)) {
                    let stu = {};
                    stu.id = students11[i].student_id;
                    stu.gcmId = students11[i].gcm_reg_id;
                    allStudents11.push(stu)
                }
            }
            await sendNotification(allStudents11, notificationPayload11);
        }
    } catch(e){
        console.log(e)
        // mysqlR.connection.end();
        // mysqlW.connection.end();
    } finally {
          console.log("the script successfully ran at "+ new Date())
          mysqlR.connection.end();
          mysqlW.connection.end();
    }
}

function getUserVideoWatched(qids) {
    let sql = "select distinct(student_id) from video_view_stats where date(created_at) = CURDATE() and question_id in (?)";
    return mysqlR.query(sql,[qids]);
}

function getPaidUsers(){
    let sql = "Select d.student_id, e.gcm_reg_id, e.student_class from (SELECT * FROM liveclass_course where id = 22) as a left join student_master_package as b on a.category_id = b.category_id left join student_package as c on b.id = c.subcategory_id left join student_package_subscription as d on c.id=d.student_package_id left join students as e on d.student_id=e.student_id where d.student_id is not null and e.student_class=10";
    return mysqlR.query(sql);
}

function getAllQuestions(hour){
    const sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4 and liveclass_course_id=22) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE and hour(live_at)='"+hour+"') as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
}

function getAll12Questions(hour){
    const sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4 and liveclass_course_id=24) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE and hour(live_at)='"+hour+"') as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
}

function get12PaidUsers(){
    let sql = "Select d.student_id, e.gcm_reg_id, e.student_class from (SELECT * FROM liveclass_course where id = 24) as a left join student_master_package as b on a.category_id = b.category_id left join student_package as c on b.id = c.subcategory_id left join student_package_subscription as d on c.id=d.student_package_id left join students as e on d.student_id=e.student_id where d.student_id is not null and e.student_class=12";
    return mysqlR.query(sql);
}

function getAll9Questions(hour){
    const sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4 and liveclass_course_id=31) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE and hour(live_at)='"+hour+"') as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
}

function get9PaidUsers(){
    let sql = "Select d.student_id, e.gcm_reg_id, e.student_class from (SELECT * FROM liveclass_course where id = 31) as a left join student_master_package as b on a.category_id = b.category_id left join student_package as c on b.id = c.subcategory_id left join student_package_subscription as d on c.id=d.student_package_id left join students as e on d.student_id=e.student_id where d.student_id is not null and e.student_class=9";
    return mysqlR.query(sql);
}

function getAll11Questions(hour){
    const sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4 and liveclass_course_id=32) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE and hour(live_at)='"+hour+"') as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
}

function get11PaidUsers(){
    let sql = "Select d.student_id, e.gcm_reg_id, e.student_class from (SELECT * FROM liveclass_course where id = 32) as a left join student_master_package as b on a.category_id = b.category_id left join student_package as c on b.id = c.subcategory_id left join student_package_subscription as d on c.id=d.student_package_id left join students as e on d.student_id=e.student_id where d.student_id is not null and e.student_class=11";
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
