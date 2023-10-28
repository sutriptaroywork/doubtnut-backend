const Redis = require('ioredis');
const bluebird = require('bluebird');
const axios = require('axios');
const request = require('request');
const rp = require('request-promise');
const mysql = require('mysql');
const _ = require('lodash');

bluebird.promisifyAll(Redis);
const container = require('./container');
const mysqlModule = require('./mysql');
const config = require(__dirname+'/../../api_server/config/config');
// const populateSecrets = require('./secrets');

function createMysqlConnection(host, user, password, database) {
    const client = mysql.createConnection({
        host,
        user,
        password,
        database,
    });
    return client;
}
function createRedisConnection(hosts, password) {
    return hosts.length > 1
        ? new Redis.Cluster(hosts.map((host) => ({ host, port: 6379 })), { redisOptions: { password, showFriendlyErrorStack: true } })
        : new Redis({
            host: hosts, port: 6379, password, showFriendlyErrorStack: true,
        });
}
let clientR; let clientW; let redisClient;
if (typeof clientR === 'undefined') {
    clientR = createMysqlConnection(process.env.MYSQL_HOST_ANALYTICS, process.env.MYSQL_USER, process.env.MYSQL_PASS, 'classzoo1');
    clientR.connect();
}
if (typeof redisClient === 'undefined') {
    redisClient = createRedisConnection(process.env.REDIS_HOSTS.split(','), process.env.REDIS_PWD);
}
// let secretFlag = false;
function subjectMap(subject) {
    const map = {
        MATHS: 'गणित',
        SCIENCE: 'विज्ञान',
        ENGLISH: 'अंग्रेज़ी',
        'SOCIAL SCIENCE': 'सामाजिक विज्ञान',
        PHYSICS: 'भौतिक विज्ञान',
        CHEMISTRY: 'रसायन विज्ञान',
        BIOLOGY: 'जीवविज्ञान',
    };
    if (typeof map[subject] !== 'undefined') {
        return map[subject];
    }
    return subject;
}
function getNotificationPayload(locale, subject, questionID, pdfUrl, type) {
    let title = 'Class me rehna hai aage';
    let message = `Hello bachcho! Aaj ki ${subject} class ka homework! Class me aage rehne ke liye poora attempt karna!`;
    let imageUrl = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/D4A4513B-F50D-397C-A39C-309FA5E35E40.webp';
    if (locale === 'hi') {
        title = 'कक्षा  में रहना है आगे';
        message = `नमस्ते बच्चों ! आज की ${subjectMap(subject)} क्लास का HW लीजिये! क्लास में आगे रहने के लिए पूरा ज़रूर करना!`;
        imageUrl = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/8BAF2D70-EF97-195B-8E8D-19098C2755CE.webp';
    }
    if (type === 'pdf') {
        return {
            event: 'pdf_viewer',
            title,
            message,
            image: imageUrl,
            firebase_eventtag: `HW${questionID}`,
            data: JSON.stringify({ pdf_url: pdfUrl }),
        };
    }
    if (type === 'homework_corner') {
        return {
            event: 'homework',
            title,
            message,
            image: imageUrl,
            firebase_eventtag: `HW${questionID}`,
            data: JSON.stringify({ qid: questionID }),
        };
    }
}
function generateDeeplinkFromAppDeeplink(branchKey, channel, campaign, deeplink) {
    // deeplink = 'doubtnutapp://pdf_viewer?pdf_url=${config.staticCDN}pdf_download/JM_2019_ALL.pdf&foo=bar';
    const splitted = deeplink.split('?');
    const featureSplitted = splitted[0].split('//');
    const dataSplitted = splitted[1].split('&');
    const feature = featureSplitted[1];
    const data = {};
    for (let i = 0; i < dataSplitted.length; i++) {
        const s = dataSplitted[i].split('=');
        data[s[0]] = s[1];
    }
    const myJSONObject = {
        branch_key: branchKey,
        channel,
        feature,
        campaign,
    };
    if (!_.isEmpty(data)) {
        myJSONObject.data = data;
    }
    const options = {
        url: 'https://api.branch.io/v1/url',
        method: 'POST',
        json: true,
        body: myJSONObject,
    };
    return rp(options);
}

function sendWhatsappPush(mobile, studentID, message, questionID, hsmData) {
    const options = {
        method: 'PUT',
        url: 'https://micro.internal.doubtnut.com/api/whatsapp/send-text-msg',
        headers:
    { 'Content-Type': 'application/json' },
        body: {
            phone: `91${mobile}`,
            studentId: studentID,
            text: message,
            preview: true,
            fallbackToHSM: true,
            campaign: `HW${questionID}`,
            hsmData,
        },
        json: true,
    };
    console.log('options');
    console.log(options);
    return rp(options);
}

async function handleWhatsappPush(db, mobile, studentID, userLocale, questionID, subject, deeplink) {
    try {
    // get opt in source from mobile no.
        const sourceDetails = await container.getWhatsappOptinSource(db, mobile);
        if (sourceDetails.length > 0) {
            // generate deeplink
            let message = `Dear Students ! Take the HW of today's ${subject} class ${deeplink} . Do all you can to stay ahead of the class!`;
            let templateID = 71922;
            if (userLocale === 'hi') {
                subject = subjectMap(subject);
                message = `प्रिय छात्रों ! आज के ${subject} विषय का होमवर्क लें ${deeplink}! कक्षा के आगे रहने के लिए आप पूरा ज़रूर करें !`;
                templateID = 71926;
            }
            const attributes = [subject, deeplink];
            const sources = {};
            sourceDetails.map((item) => {
                if (item.source == 10) {
                    sources['8400400400'] = message;
                }
                if (item.source == 11) {
                    sources['6003008001'] = templateID;
                }
                return true;
            });
            console.log(subject)
            console.log(sources)
            console.log(attributes)
            const hsmData = {
                sources,
                attributes,
            };
            const result = await sendWhatsappPush(mobile, studentID, message, questionID, hsmData);
            return result;
        }
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function userLeaveAction(db, studentID, questionID, userLocale, mobile, fcmID, appVersion) {
    try {
        const resourceDetails = await container.getResourceByResourceReference(db, questionID);
        console.log('resourceDetails');
        console.log(resourceDetails);
        if (resourceDetails.length > 0 && !_.isNull(resourceDetails[0].resource_reference)) {
            let notificationData = {};
            // check pdf exists or not
            const pdfUrl = resourceDetails[0].resource_reference;
            const check = await axios.get(pdfUrl);
            if (check.status === 200) {
                // check if push already sent or not
                const isPushed = await container.checkPushed(db, studentID, questionID);
                console.log('isPushed');
                console.log(isPushed);
                if (isPushed.length > 0) {
                    const splittedAppVersion = appVersion.split('.');
                    let deeplink = '';
                    if (parseInt(splittedAppVersion[2]) > 188) {
                    // homework corner
                        deeplink = await generateDeeplinkFromAppDeeplink(process.env.BRANCH_KEY, 'HOMEWORK_PDF', `HW${questionID}`, `doubtnutapp://homework?qid=${questionID}`);
                        notificationData = getNotificationPayload(userLocale, resourceDetails[0].subject, questionID, pdfUrl, 'homework_corner');
                    } else {
                    // homework pdf
                        deeplink = await generateDeeplinkFromAppDeeplink(process.env.BRANCH_KEY, 'HOMEWORK_PDF', `HW${questionID}`, `doubtnutapp://pdf_viewer?pdf_url=${pdfUrl}`);
                        notificationData = getNotificationPayload(userLocale, resourceDetails[0].subject, questionID, pdfUrl, 'pdf');
                    }
                    console.log(notificationData);
                    const promises = [];
                    promises.push(handleWhatsappPush(db, mobile, studentID, userLocale, questionID, resourceDetails[0].subject, deeplink.url));
                    promises.push(container.sendFcm(studentID, fcmID, notificationData));
                    await Promise.all(promises);
                    // update liveclass subscriber
                    await mysqlModule.updateLiveclassSubscriber(db.mysql.write, studentID, questionID);
                }
            }
        }
        return true;
    } catch (e) {
        console.log(e);
        throw new Error('Error in class leave action');
    }
}

async function sendNotification(user, notificationInfo) {
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
    return rp(options);
}

async function liveclassEndAction(db, questionID) {
    try {
        const resourceDetails = await container.getResourceByResourceReference(db, questionID);
        if (resourceDetails.length > 0 && !_.isNull(resourceDetails[0].resource_reference)) {
            // check pdf exists or not
            const pdfUrl = resourceDetails[0].resource_reference;
            const check = await axios.get(pdfUrl);
            if (check.status === 200) {
                const notificationObject = {};
                const deeplink = await generateDeeplinkFromAppDeeplink(process.env.BRANCH_KEY, 'HOMEWORK_PDF', `HW${questionID}`, `doubtnutapp://pdf_viewer?pdf_url=${pdfUrl}`);
                // get list of assortment id's of question id
                const assortments = await container.getAssortmentsByResourceReference(db, questionID);
                if (assortments.length > 0) {
                    let assortmentList = assortments.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
                    if (assortmentList.length > 0) {
                        // get all assortments
                        assortmentList = await container.getParentAssortmentList(db, assortmentList);
                        console.log('assortmentList');
                        console.log(assortmentList);
                        // get subscribed unpushed users
                        let studentDetails = await mysqlModule.getSubscribedUnpushedUsers(db.mysql.read, assortmentList, questionID);
                        studentDetails = studentDetails.filter((item) => _.isNull(item.is_pushed));
                        // update promise
                        const updatePromise = [];
                        const whatsappPushPromise = [];
                        console.log(studentDetails);
                        studentDetails.map((item) => {
                            updatePromise.push(mysqlModule.upsertSubscribers(db.mysql.write, item.student_id, questionID));
                            whatsappPushPromise.push(handleWhatsappPush(db, item.mobile, item.student_id, item.locale, questionID, resourceDetails[0].subject, deeplink));
                            return true;
                        });
                        const groupedUsers = _.groupBy(studentDetails, 'locale');
                        for (const key in groupedUsers) {
                            if (Object.prototype.hasOwnProperty.call(groupedUsers, key)) {
                                if (typeof notificationObject[key] === 'undefined') {
                                    notificationObject[key] = {};
                                }
                                notificationObject[key].payload = getNotificationPayload(key, resourceDetails[0].subject, questionID, pdfUrl);
                                notificationObject[key].users = [];
                                for (let i = 0; i < groupedUsers[key].length; i++) {
                                    notificationObject[key].users.push({
                                        id: groupedUsers[key][i].student_id,
                                        gcmId: groupedUsers[key][i].gcm_reg_id,
                                    });
                                }
                            }
                        }
                        console.log('notificationObject');
                        console.log(notificationObject);
                        const workers = [];
                        for (const key in notificationObject) {
                            if (Object.prototype.hasOwnProperty.call(notificationObject, key)) {
                                workers.push(sendNotification(notificationObject[key].users, notificationObject[key].payload));
                            }
                        }
                        await Promise.all(workers);
                        await Promise.all(whatsappPushPromise);
                        await Promise.all(updatePromise);
                    }
                }
            }
        }
        return true;
    } catch (e) {
        console.log(e);
        throw new Error('Error in liveclass end action');
    }
}
function dbconnect(clientWrite) {
    return new Promise((resolve, reject) => {
        clientWrite.connect((err) => {
            if (err) {
                reject(err);
            }
            resolve('connected');
        });
    });
}
exports.handler = async (event, context) => {
    try {
        // if (!secretFlag) {
        // await populateSecrets();
        // }
        console.log(event);
        const data = event.Records;
        clientW = createMysqlConnection(process.env.MYSQL_HOST_WRITE, process.env.MYSQL_USER, process.env.MYSQL_PASS, 'classzoo1');
        await dbconnect(clientW);
        const db = {
            mysql: {
                read: clientR,
                write: clientW,
            },
            redis: {
                read: redisClient,
                write: redisClient,
            },
        };
        for (let i = 0; i < data.length; i++) {
            // console.log('data');
            // console.log(data[i].body);
            let message = JSON.parse(data[i].body);
            // console.log('message1')
            // console.log(message)
            if (typeof message.Message !== 'undefined' && typeof message.Message === 'string') {
                message = JSON.parse(message.Message);
            }
            // console.log('message2')
            // console.log(message)
            if (message.actionType === 'liveclass_leave') {
                // console.log('liveclass_leave')
                await userLeaveAction(db, message.student_id, message.question_id, message.locale, message.mobile, message.gcm_reg_id, message.app_version);
            }
            if (message.actionType === 'liveclass_end') {
                await liveclassEndAction(db, message.question_id);
            }
        }
        return new Promise(((resolve) => {
            resolve('Completed');
        }));
    } catch (e) {
        console.log(e);
        return new Promise((resolve, reject) => {
            reject(new Error('Galat Scene'));
        });
    } finally {
        clientW.end((err) => {
            if (err) {
                console.log('write connection no closed');
                console.log(err);
            } else {
                console.log('write DB ended');
            }
        });
    }
};
