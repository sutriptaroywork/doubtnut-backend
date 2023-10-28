"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
config.read_mysql.host = 'readers-slave.doubtnut.internal';
const mysqlR = new database(config.read_mysql);
const mysqlW = new database(config.mysql_write);
const request = require('request');
const _ = require('lodash');


main()
async function main (){
	try{
        const liveClasses = await getLiveClasses();
         console.log(liveClasses);
        const qids = liveClasses.map((a) => a.resource_reference);
        let watchedStudents = await getUserVideoWatched(qids);
        console.log(watchedStudents.length);
        let quizStudents = await getQuizStudents();
        quizStudents = quizStudents.map((a) => a.student_id);
        const smsStudents = [];
        for(let i=0; i< watchedStudents.length; i++) {
            if(!quizStudents.includes(watchedStudents[i].student_id)) {
                smsStudents.push(watchedStudents[i].mobile);
            }
        }
        // console.log(smsStudents);
        console.log(smsStudents.length);
        const contestWinner = await getWinner();
        const deeplink = await generateDeeplink(config, "SMS",'video', 'SMS_LIVE_CLASS_T2', contestWinner[0].question_id, '', 'DEEPLINK', 115);
        if(deeplink.url) {
            for (let j=0; j<smsStudents.length;j++) {
                const response = await sendSms(config, deeplink.url, smsStudents[j]);
                const insertObj = {
                    mobile:smsStudents[j],
                    response,
                    deeplink: deeplink.url,
                    type:2,
                }
                await insertData(insertObj);
            }
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

function sendSms(config, deeplink, mobile) {
    return new Promise(((resolve, reject) => {
        try {
            var options = { method: 'GET',
            url: 'https://api.msg91.com/api/sendhttp.php',
            qs: 
            { authkey: config.MSG91_AUTH_KEY,
                mobiles: mobile,
                country: '91',
                message: '5000 ka inaam rakha hai Doubtnut LIVE CLASSES ke Upar | Abhi jaano kaise Milega yeh inaam aapko | Click now:'+deeplink,
                sender: 'DOUBTN',
                route: '4' }};
                request(options, function (error, response, body) {
                    if (error) throw new Error(error);
                    return resolve(body);
                    });

        } catch (e) {
            console.log(e);
            return reject(e);
        }
    }));
}

function insertData(insertObj) {
    let sql = "insert into quiz_sms_campaign_data SET ?";
    return mysqlW.query(sql,[insertObj]);
}

function getQuizStudents() {
    let sql = "select b.student_id, b.mobile from (select distinct(student_id) from liveclass_quiz_response where date(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) a left join students b on a.student_id=b.student_id where b.student_id is not null";
    return mysqlR.query(sql);
}

function getLiveClasses() {
    let sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
}

function getUserVideoWatched(qids) {
    let sql = "select a.student_id, b.mobile from (select distinct(student_id) from video_view_stats where date(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)  and question_id in (?)) a left join students b on a .student_id=b.student_id where b.student_id is not null";
    return mysqlR.query(sql,[qids]);
}

function getWinner() {
    let sql = "SELECT question_id from classzoo1.questions where student_id=80 and question like 'Winners Announcement%' and date(timestamp) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)  order by question_id DESC limit 1";
    return mysqlR.query(sql);
}

function generateDeeplink(config, channel, feature, campaign, question_id, type, page, student_id) {
    // console.log(post_id)
    return new Promise(((resolve, reject) => {
        try {
            const myJSONObject = {
                branch_key: config.branch_key,
                channel,
                feature,
                campaign,
            };
            const data = {};
            if (!_.isNull(page)) {
                data.page = page;
            }
            if (!_.isNull(question_id)) {
                data.qid = question_id;
                data.resource_type = 'video';
            }
            if (!_.isNull(type)) {
                data.type = type;
            }
            if (!_.isNull(student_id)) {
                data.sid = student_id;
            }
            myJSONObject.data = data;
            console.log(myJSONObject);
            request(
                {
                    url: 'https://api.branch.io/v1/url',
                    method: 'POST',
                    json: true, // <--Very important!!!
                    body: myJSONObject,
                },
                (error, response, body) => {
                    if (error) {
                        console.log(error);
                    } else {
                        // console.log(body);
                        return resolve(body);
                    }
                },
            );
        } catch (e) {
            console.log(e);
            return reject(e);
        }
    }));
}