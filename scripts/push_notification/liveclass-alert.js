require('dotenv').config({ path: `${__dirname}/../../api_server/.env` });
const rp = require('request-promise');
const _ = require('lodash');
const moment = require('moment');
// const admin = require('firebase-admin');
const config = require('../../api_server/config/config');
// const LiveclassHelper = require('../../api_server/server/helpers/liveclass');
const Database = require('../../api_server/config/database');
// config.read_mysql.host="app-reader.cluster-custom-cpymfjcydr4n.ap-south-1.rds.amazonaws.com";
const mysqlR = new Database(config.mysql_analytics);
const mysqlW = new Database(config.mysql_write);

// const serviceAccount = `${__dirname}/../../api_server/${config.GOOGLE_KEYFILE}`;
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: config.firebase.baseUrl,
// });

function getData() {
    // let sql = "select *, a.id as detail_id from (select * from liveclass_course_details where live_at > now()) as a left join (select * from liveclass_course_resources where resource_type=4) as b on a.id=b.liveclass_course_detail_id left join (select * from liveclass_course where is_live=1) as c on a.liveclass_course_id=c.id left join (select resource_reference,student_id from liveclass_subscribers where date(created_at) = current_date()) as d on b.resource_reference=d.resource_reference left join (select student_id, gcm_reg_id from students) as e on d.student_id=e.student_id";
    // const sql = 'select *,  a.id as detail_id from (select * from liveclass_course_details where live_at > now() and live_at < date_add(now(),interval 2 minute)) as a left join (select * from liveclass_course_resources where resource_type in (1,4, 8)) as b on a.id=b.liveclass_course_detail_id left join (select * from liveclass_course where is_live=1) as c on a.liveclass_course_id=c.id inner join (select resource_reference,student_id from liveclass_subscribers where date(created_at) = current_date() and is_interested=1 and version_code > 767) as d on b.resource_reference=d.resource_reference left join (select student_id, gcm_reg_id from students) as e on d.student_id=e.student_id';
    const sql = 'SELECT e.*, f.gcm_reg_id, f.locale FROM (SELECT c.* FROM (SELECT b.*, a.live_at, a.student_id FROM (SELECT resource_reference, student_id, live_at FROM liveclass_subscribers WHERE live_at IS NOT NULL AND live_at > now() AND live_at <= (now() + interval 15 minute) AND is_interested = 1) AS a LEFT JOIN (select id, resource_reference, topic, chapter, expert_name, expert_image, subject from course_resources where resource_type in (1,4,8)) AS b ON a.resource_reference = b.resource_reference) AS c LEFT JOIN course_resource_mapping AS d ON d.course_resource_id = c.id AND d.live_at = c.live_at) AS e LEFT JOIN students AS f ON e.student_id = f.student_id';
    return mysqlR.query(sql);
}
function bgImage(subject) {
    const map = {
        MATHS: `${config.cdn_url}engagement_framework/0251576E-39EA-1DE1-15D1-12BAB34128AB.webp`,
        BIOLOGY: `${config.cdn_url}engagement_framework/33A464F5-16AA-573A-4B57-6EAFAD37F5A8.webp`,
        CHEMISTRY: `${config.cdn_url}engagement_framework/201DC20A-3EA4-7AF9-9B6C-E0C1F971B28E.webp`,
        ENGLISH: `${config.cdn_url}engagement_framework/E90A0654-0EF1-64C4-B2FD-A56A32D39431.webp`,
        PHYSICS: `${config.cdn_url}engagement_framework/5CA149CD-C61E-3019-92B5-1E9A57D99E0B.webp`,
        SCIENCE: `${config.cdn_url}engagement_framework/E90A0654-0EF1-64C4-B2FD-A56A32D39431.webp`,
    };
    if (typeof map[subject] === 'undefined') {
        return `${config.cdn_url}engagement_framework/0251576E-39EA-1DE1-15D1-12BAB34128AB.webp`;
    }
    return map[subject];
}

function getBarColorHomepage(subject) {
    const colorMap = {
        PHYSICS: '#508f17',
        BIOLOGY: '#8064f4',
        CHEMISTRY: '#b62da8',
        MATHS: '#1f3157',
        ENGLISH: '#1a99e9',
        SCIENCE: '#0E2B6D',
        GUIDANCE: '#0E2B6D',
        ALL: '#0E2B6D',
        TEST: '#54138a',
        'रसायन विज्ञान': '#b62da8',
        गणित: '#1f3157',
        'भौतिक विज्ञान': '#508f17',
        अंग्रेज़ी: '#1a99e9',
        विज्ञान: '#0E2B6D',
        'दिशा निर्देश': '#0E2B6D',
        जीवविज्ञान: '#8064f4',
        'जीव विज्ञान': '#8064f4',
        'सामाजिक विज्ञान': '#0E2B6D',
    };
    if (colorMap[subject]) {
        return colorMap[subject];
    }
    if (subject.includes('अंग्रेज़ी')) {
        return colorMap['अंग्रेज़ी'];
    }

    return '#ffffff';
}

function generatePayload(item) {
    const payload = {};
    payload.data = {};
    payload.data.event = 'live_class_reminder_pop_up';
    payload.data.title = 'Nahi kr paye aaj ki live class attend❓';
    payload.data.message = 'Abhi dekho kya kya hua apki live class mai 😀 check now✔️👀';
    payload.data.s_n_id = '11SUMMAR2';
    payload.data.firebase_eventtag = '11SUMMAR2';
    payload.data.data = {};
    payload.data.data.title_one = (item.locale === 'ENGLISH') ? `Your ${item.subject} Live class\n starts in` : `आपकी ${item.subject} की लाइव क्लास\n शुरू होने वाली है`;
    payload.data.data.title_two = `${item.topic} | ${item.chapter}`;
    payload.data.data.title_three = `By ${item.expert_name}`;
    payload.data.data.button_text = (item.locale === 'ENGLISH') ? 'Join Now' : 'अभी शामिल हों';
    payload.data.data.deeplink = `doubtnutapp://live_class?id=${item.resource_reference}&page=LIVECLASS_ALERT&source_id=reminder`;
    payload.data.data.image_url = item.expert_image;
    payload.data.data.subject = item.subject;
    payload.data.data.image_url_bg = bgImage(item.subject);
    payload.data.data.color_code = LiveclassHelper.getBarColorHomepage(item.subject);
    payload.data.data.live_at = moment(item.live_at).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000;
    payload.data.data = JSON.stringify(payload.data.data);
    return payload;
}
function sendNotificationUsingFirebase(registrationTokens, payload) {
// Send a message to the devices corresponding to the provided
// registration tokens.
    if (registrationTokens.length > 999) {
        throw Error(`tokens exceed 1000 - ${registrationTokens.length}`);
    }
    console.log(payload);
    return admin.messaging().sendToDevice(registrationTokens, payload);
}
async function notificationWrapper(totalTokens, payload) {
    try {
        if (totalTokens.length === 0) {
            // exit
            return true;
        }
        const cloned = _.clone(totalTokens);
        const registrationTokens = cloned.splice(0, 1000); // splice first 1000
        if (registrationTokens.length < 1000) {
            const notifRepsonse = await sendNotificationUsingFirebase(registrationTokens, payload);
            console.log(notifRepsonse);
            return await notificationWrapper(cloned, payload);
        }
    } catch (error) {
        console.log('error');
        console.log(error);
        throw new Error(error);
    }
}

async function sendNotificationUsingService(userArray, notificationInfo) {
    const options = {
        method: 'POST',
        url: config.NEWTON_NOTIFICATION_URL,
        headers:
            { 'Content-Type': 'application/json' },
        body:
            { notificationInfo, user: userArray },
        json: true,
    };
    return new Promise((res, rej) => {
        rp(options, (error, response, body) => {
            if (error) {
                console.log(error);
                rej(error);
            }
            console.log(body);
            res(body);
        });
    });
}

(async () => {
    try {
        const info = await getData();
        const sentData = [];

        for (let i = 0; i < info.length; i++) {
            const item = info[i];
            const userArray = [{
                id : item.student_id, gcmId: item.gcm_reg_id,
            }];
            const findArr = sentData.filter((x) => x.sid === item.student_id && x.qid === item.resource_reference );
            if (findArr.length === 0) {
                const notificationInfo = {
                    // event: 'live_class_reminder_pop_up',
                    event: 'live_class',
                    title: 'Reminder: Your Class is starting soon',
                    message: `Live Class on ${item.topic} is starting in 10 min. Join on time`,
                    s_n_id: 'PAGELIV2',
                    firebase_eventtag: 'PAGELIV2',
                    image: `${config.staticCDN}q-thumbnail/${item.resource_reference}.png`,
                    data: {
                        id: item.resource_reference,
                        page: 'LIVECLASS_NOTIFICATION',
                        title_one: (item.locale === 'en') ? `Your ${item.subject} Live class\n starts in` : `आपकी ${item.subject} की लाइव क्लास\n शुरू होने वाली है`,
                        title_two: `${item.topic} | ${item.chapter}`,
                        title_three: `By ${item.expert_name}`,
                        button_text: (item.locale === 'en') ? 'Join Now' : 'अभी शामिल हों',
                        deeplink: `doubtnutapp://live_class?id=${item.resource_reference}&page=LIVECLASS_ALERT&source_id=reminder`,
                        image_url: item.expert_image,
                        subject: item.subject,
                        image_url_bg: bgImage(item.subject),
                        color_code: getBarColorHomepage(item.subject),
                        live_at: moment(item.live_at).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000,
                    },
                };
                notificationInfo.data = JSON.stringify(notificationInfo.data);
                await sendNotificationUsingService(userArray, notificationInfo);
                const sentDataObj = {
                    sid: item.student_id, qid: item.resource_reference,
                };
                sentData.push(sentDataObj);
            }
        }
        // console.log("info");
        // console.log(info);
        // const students = [];
        // const notificationObject = {};
        // const grouped = _.groupBy(info, 'detail_id');
        // for (const key in grouped) {
        //     if (Object.prototype.hasOwnProperty.call(grouped, key)) {
        //         const item = grouped[key];
        //         const payload = generatePayload(item[0]);
        //         if (typeof notificationObject[key] === 'undefined') {
        //             notificationObject[key] = {};
        //         }
        //         notificationObject[key].payload = payload;
        //         notificationObject[key].studentTokens = [];
        //         for (let i = 0; i < item.length; i++) {
        //             if (!_.isNull(item[i].gcm_reg_id)) {
        //                 notificationObject[key].studentTokens.push(item[i].gcm_reg_id);
        //             }
        //         }
        //     }
        // }
        // // console.log(notification Object);
        // const workers = [];
        // for (const key in notificationObject) {
        //     if (Object.prototype.hasOwnProperty.call(notificationObject, key)) {
        //         console.log(`detail id = ${key}`);
        //         // console.log("notificationObject[key]")
        //         // console.log(199777)
        //         // console.log(notificationObject[199777])
        //         // await notificationWrapper(notificationObject[199777].studentTokens, notificationObject[199777].payload);
        //         workers.push(notificationWrapper(notificationObject[key].studentTokens, notificationObject[key].payload));
        //     }
        // }
        // const response = await Promise.all(workers);
        // console.log(response);
        // console.log(`the script ran at ${new Date()} : Response = ${response}`);
        console.log(`the script ran at ${new Date()}`);
    } catch (e) {
        console.log(e);
        mysqlR.connection.end();
        mysqlW.connection.end();
    } finally {
        mysqlR.connection.end();
        mysqlW.connection.end();
    }
})();
