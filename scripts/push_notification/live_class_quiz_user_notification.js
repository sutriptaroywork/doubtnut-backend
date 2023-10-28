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
        const liveClasses = await getLiveClasses();
        for(let j=0; j<liveClasses.length; j++) {
            let students = await getUserVideoWatched(liveClasses[j].resource_reference);
            const nextLiveClass = await getNextLiveClass(liveClasses[j].class);
            console.log(nextLiveClass);
            if(nextLiveClass.length > 0) {
                const hindiLiveClass = _.find(nextLiveClass, function(o) { return o.doubt.includes('_HIN'); });
                const englishLiveClass = _.find(nextLiveClass, function(o) { return o.doubt.includes('_ENG'); });
                const result = students.map((a) => a.student_id);
                const studentDetails = await getStudentDetails(result, liveClasses[j].class);
                // console.log("studentDetails");
                // console.log(studentDetails.length);
                const hindiNotification= [];
                const englishNotification= [];
                const notificationPayload_en = {};
                const notificationPayload_hi = {};

                notificationPayload_en.event = 'live_class';
                notificationPayload_en.title = 'Agli live class ke liye ho taiyar❓';
                notificationPayload_en.message = 'zyada se zyada answers do aur karo 💯 % marks pakke 🏆';
                notificationPayload_en.s_n_id = liveClasses[j].class+'QUIZ';
                notificationPayload_en.firebase_eventtag = liveClasses[j].class+'QUIZ';
                notificationPayload_en.data = {};
                notificationPayload_en.data.page = 'LIVECLASS_NOTIFICATION';
                if (_.isObject(englishLiveClass)) {
                    notificationPayload_en.data.id = englishLiveClass.resource_reference;
                    notificationPayload_en.image = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${englishLiveClass.resource_reference}.png`;
                }

                notificationPayload_hi.event = 'live_class';
                notificationPayload_hi.title = 'अगली live class के लिए हो तैयार❓';
                notificationPayload_hi.message = 'ज़्यादा से ज़्यादा answers दो और karo 💯 % marks pakke 🏆';
                notificationPayload_hi.data = {};
                notificationPayload_hi.data.page = 'LIVECLASS_NOTIFICATION';
                notificationPayload_hi.s_n_id = liveClasses[j].class+'QUIZH';
                notificationPayload_hi.firebase_eventtag = liveClasses[j].class+'QUIZH';
                if (_.isObject(hindiLiveClass)) {
                    notificationPayload_hi.data.id = hindiLiveClass.resource_reference;
                    notificationPayload_hi.image = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${hindiLiveClass.resource_reference}.png`;
                }
                for (let i=0; i < studentDetails.length; i++) {
                    let stu = {
                        "id": studentDetails[i].student_id,
                        "gcmId": studentDetails[i].gcm_reg_id
                    }
                    // if(studentDetails[i].locale == 'hi' && _.isObject(hindiLiveClass)) { 
                    //     hindiNotification.push(stu);
                    // }else if(studentDetails[i].locale != 'hi' && _.isObject(englishLiveClass)){
                    //     englishNotification.push(stu);
                    // }
                    if(studentDetails[i].locale == 'hi' && _.isObject(hindiLiveClass)) { 
                        hindiNotification.push(stu);
                    }else if(_.isObject(englishLiveClass)){
                        englishNotification.push(stu);
                    }else if(_.isObject(hindiLiveClass)){
                        hindiNotification.push(stu);
                    }
                }
                if(englishNotification.length > 0) {
                    // console.log("english");
                    await sendNotification(englishNotification, notificationPayload_en);
                    // console.log(englishNotification.length);
                }
                if(hindiNotification.length > 0) {
                    // console.log("hindi");
                    await sendNotification(hindiNotification, notificationPayload_hi);
                    // console.log(hindiNotification.length);
                }
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

function getLiveClasses() {
    let sql = "select a.* from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4) as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE AND hour(live_at) = hour(CURRENT_TIMESTAMP)) as b on a.liveclass_course_detail_id=b.id where b.id is not null";
    return mysqlR.query(sql);
}

function getNextLiveClass(student_class) {
    let sql = "select a.*, c.package_language, questions.doubt from (SELECT * FROM `liveclass_course_resources` WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4 and class='"+student_class+"') as a left join (SELECT * FROM `liveclass_course_details` where date(live_at)=CURRENT_DATE AND hour(live_at) = hour(CURRENT_TIMESTAMP) +1) as b on a.liveclass_course_detail_id=b.id left join questions on questions.question_id=a.resource_reference left join studentid_package_mapping_new as c on questions.student_id=c.student_id where b.id is not null";
    return mysqlR.query(sql);
}

function getUserVideoWatched(question_id) {
    let sql = "select distinct(student_id) from video_view_stats where date(created_at) = CURRENT_DATE  and question_id = '"+ question_id+"'";
    return mysqlR.query(sql);
}

function getStudentDetails(students , student_class) {
    let sql = "select student_id, gcm_reg_id, locale from students where student_id in (?) and student_class= ?";
    return mysqlR.query(sql, [students, student_class]);
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

    console.log(options);
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