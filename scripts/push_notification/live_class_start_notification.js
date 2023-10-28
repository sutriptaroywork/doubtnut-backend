"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
// config.read_mysql.host="app-reader.cluster-custom-cpymfjcydr4n.ap-south-1.rds.amazonaws.com";
const mysqlR = new database(config.mysql_analytics);
const mysqlW = new database(config.mysql_write);
const request = require('request');


main()
async function main (){
	try{
        const liveClasses = await getLiveClasses();
        console.log(liveClasses);
        if(liveClasses.length > 0) {
            const promise = []
            const qids = liveClasses.map((a) => a.resource_reference);
            console.log(qids)
            promise.push(getAllStudentsVideoWatched(liveClasses[0].class))
            promise.push(getAllLiveClassWatchingStudents(qids));
            const resolvedPromises = await Promise.all(promise);
            console.log(resolvedPromises[0].length);
            console.log(resolvedPromises[1].length);
            const watchedStudentId = resolvedPromises[1].map((a) => a.student_id);
            const leftJoinArray  = resolvedPromises[0].filter(x => !watchedStudentId.includes(x.student_id)) 
            console.log(leftJoinArray.length);
            const hi_students=[];
            const en_students=[];
            const notificationPayload_en = {};
            const notificationPayload_hi = {};
            notificationPayload_en.event = 'live_class';
            notificationPayload_en.title = 'Jaldi karo CASH CONTEST⚔️ab shuru hai🙌';
            notificationPayload_en.message = 'Abhi dekho LIVE Class do sahi jawaab🤾‍♂️aur JEETO CASH PRIZE💸';
            notificationPayload_en.s_n_id = liveClasses[0].class+'OLIV';
            notificationPayload_en.firebase_eventtag = liveClasses[0].class+'OLIV';
            notificationPayload_en.data = {};
            notificationPayload_en.data.page = 'LIVECLASS_NOTIFICATION';
            notificationPayload_hi.event = 'live_class';
            notificationPayload_hi.title = 'जल्दी करो CASH CONTEST⚔️अब शुरू है🙌';
            notificationPayload_hi.message = 'अभी देखो लाइव क्लास👨‍🏫दो सही जवाब🤾‍♂️और जीतो कॅश प्राइज💸';
            notificationPayload_hi.data = {};
            notificationPayload_hi.data.page = 'LIVECLASS_NOTIFICATION';
            notificationPayload_hi.s_n_id = liveClasses[0].class+'OLIVH';
            notificationPayload_hi.firebase_eventtag = liveClasses[0].class+'OLIVH';
            for(let j=0; j< leftJoinArray.length;j++) {
                let isAdded= 0;
                for (let i=0; i < liveClasses.length; i++) {
                    let stu = {
                        "id": leftJoinArray[j].student_id,
                        "gcmId": leftJoinArray[j].gcm_reg_id
                    }
                    if(isAdded == 0) {
                        if(liveClasses[i].video_language == 'hi-en' && leftJoinArray[j] != 'hi') {  
                            en_students.push(stu)
                            notificationPayload_en.data.id = liveClasses[i].resource_reference;
                            notificationPayload_en.image = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${liveClasses[i].resource_reference}.png`;
                            isAdded = 1;
                        }else if(liveClasses[i].video_language == 'hi' && leftJoinArray[j] == 'hi') {
                            hi_students.push(stu);
                            notificationPayload_hi.data.id = liveClasses[i].resource_reference;
                            notificationPayload_hi.image = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${liveClasses[i].resource_reference}.png`;
                            isAdded = 1;
                        }
                    }
                }
            }
            if(en_students.length > 0) {
                if(en_students.length > 100000) {
                    const chunks = chunkArray(en_students, 100000);
                    for(let k=0; k < chunks.length; k++) {
                        sendNotification(chunks[k], notificationPayload_en);
                    }
                }else{
                    sendNotification(en_students, notificationPayload_en);
                }
            }
            if(hi_students.length > 0) {
                if(hi_students.length > 100000) {
                    const chunks = chunkArray(hi_students, 100000);
                    for(let k=0; k < chunks.length; k++) {
                        sendNotification(chunks[k], notificationPayload_hi);
                    }
                }else{
                    sendNotification(hi_students, notificationPayload_hi);
                }
            }
            console.log(en_students.length);
            console.log(hi_students.length);
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

function getAllStudentsVideoWatched(student_class) {
    let sql = "select a.student_id, b.locale, b.gcm_reg_id from (SELECT distinct(student_id) FROM classzoo1.video_view_stats where created_at >= current_date and source= 'android') as a left join (select student_id, locale, gcm_reg_id from students where student_class = '"+student_class+"' and is_web=0) as b on a.student_id=b.student_id where b.student_id is not null"
    console.log(sql);
    return mysqlR.query(sql);
}

function getAllLiveClassWatchingStudents(qids) {
    let sql = "SELECT distinct(student_id) FROM classzoo1.video_view_stats where created_at >= current_date and source= 'android' and question_id in (?)"
    console.log(sql);
    return mysqlR.query(sql,[qids]);
}

function getLiveClasses() {
    let sql = "SELECT b.class, b.resource_reference, d.video_language FROM (select * from liveclass_stream where is_active=1 ) as a left join liveclass_course_resources as b on a.detail_id=b.liveclass_course_detail_id left join questions as c on b.resource_reference=c.question_id left join studentid_package_mapping_new as d on c.student_id=d.student_id where b.resource_type=4";
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

function chunkArray(myArray, chunk_size){
    let arrayLength = myArray.length;
    let tempArray = [];
    for (let index = 0; index < arrayLength; index += chunk_size) {
        let myChunk = myArray.slice(index, index+chunk_size);
        // Do something if you want with the group
        tempArray.push(myChunk);
    }
    return tempArray;
}

