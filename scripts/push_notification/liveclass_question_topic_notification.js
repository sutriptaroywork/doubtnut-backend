"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'})
const config = require(__dirname+'/../../api_server/config/config')
const database = require('../../api_server/config/database')
const conRead = config.mysql_analytics;
const mysql = new database(conRead)
const StudentContainer = require('../../api_server/modules/mysql/student')
const QuestionsMetaContainer = require('../../api_server/modules/containers/questionsMeta');
const request = require('request');
const moment = require('moment');
const _ = require('lodash');
const redis = require('../../api_server/config/redis');
const db = {};
db.mysql = {
    read: mysql
};
db.mongo = {};
db.events_mongo = {};
db.redis = {
    read: redis,
    write: redis,
};


function getAllVideos() {
    const sql = 'select max(view_id) as view_id from video_view_stats where created_at >= (now() - interval 60 minute) and created_at < (now() - interval 30 minute) and parent_id <> 0 group by student_id order by view_id DESC';
    // const sql = 'select max(view_id) as view_id from video_view_stats where student_id=24593286 and parent_id <> 0 group by student_id';
    return mysql.query(sql);
}

function getCourseMeta(question_id, studentClass) {
    const sql = "select cd.assortment_id, cd.is_free, cd.class, cr.resource_reference from  (select * from course_resources where resource_reference=?) as cr left join course_resource_mapping as crm on crm.course_resource_id=cr.id and crm.resource_type='resource' left join course_details as cd on cd.assortment_id=crm.assortment_id where cd.is_free=1 and cd.class=?";
    return mysql.query(sql, [question_id.toString(), studentClass]);
}

function getViewDetails(view_id) {
    const sql = 'select question_id, student_id from video_view_stats where view_id=?';
    return mysql.query(sql, [view_id]);
}

async function getSimilarQuestionId(locale, question_id) {
    const metaInfo = await QuestionsMetaContainer.getQuestionMeta(question_id, db);
    if (metaInfo.length > 0 && metaInfo[0].microconcept != null) {
        return getVideosByPznTG(metaInfo[0].microconcept, locale);
    }
    return [];
}



function setSentNotification(key) {
    return redis.setAsync(`${key}`, JSON.stringify({sent: true}), 'Ex', 60 * 60 * 24);
}

function getSentNotification(key) {
    return redis.getAsync(key);
}

function getVideosByPznTG(mcID, locale) {
    const sql = 'select b.question_id from  (select target_group, mc_id, locale, question_id from pzn_similar where mc_id= ? and locale= ?) as b  inner join (select question_id, question, matched_question, chapter, subject from questions where student_id < 100) as c on b.question_id=c.question_id group by question_id order by rand() limit 5';
    return mysql.query(sql, [mcID, locale]);
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

async function _processStudents(video) {
    video = await getViewDetails(video.view_id);
    const studentDetails = await StudentContainer.getById(video[0].student_id, db.mysql.read);
    const checkNotificationAlreadySent = await getSentNotification(`${moment().add(5, 'hours').add(30, 'minutes').format('L')}:${studentDetails[0].student_id}`);
    if (_.isNull(checkNotificationAlreadySent)) {
        const similarVideos = await getSimilarQuestionId(studentDetails[0].locale == 'en' ? 'ENGLISH' : 'HINDI',video[0].question_id);
        if (similarVideos.length > 0) {
            const promise = [];
            for (let i=0; i< similarVideos.length; i++) {
                promise.push(getCourseMeta(similarVideos[0].question_id, studentDetails[0].student_class));
            }
            const courseMeta = await Promise.all(promise);
            console.log(courseMeta);
            for (let j=0; j< courseMeta.length; j++) {
                if (courseMeta[j].length > 0) {
                    const notificationPayload = {}
                    notificationPayload.event = "video";
                    notificationPayload.title = "Special class sirf apke liye 🤩️";
                    notificationPayload.message = "Chapter padh ke karo apna topic clear 🤩 ";
                    notificationPayload.s_n_id = "Question_Topicvideo_5sep";
                    notificationPayload.firebase_eventtag = 'Question_Topicvideo_5sep';
                    notificationPayload.data={};
                    notificationPayload.data.qid=courseMeta[j][0].resource_reference;
                    notificationPayload.data.page="LIVECLASS_NOTIFICATION";
                    notificationPayload.data.resource_type="video";
                    sendNotification([{
                        id:studentDetails[0].student_id,
                        gcmId:studentDetails[0].gcm_reg_id,
                    }], notificationPayload);
                    await setSentNotification(`${moment().add(5, 'hours').add(30, 'minutes').format('L')}:${studentDetails[0].student_id}`);
                    break;
                }
            }
        }
    }
}




(async () => {
    try {
        console.log(`the script started at ${new Date()}`);
        // get last half hour videos
       const videos =  await getAllVideos();
       let promise = [];
       for (let i=0; i < videos.length; i++) {
           promise.push(_processStudents(videos[i]));
           if ((i != 0 && i% 100 == 0) || i == videos.length-1) {
               await Promise.all(promise);
               promise = [];
           }
       }
    } catch (error) {
        console.log(error);
    } finally {
        mysql.close();
        redis.disconnect();
    }
})();