require('dotenv').config({ path: `${__dirname  }/../../api_server/.env` });
const config = require(`${__dirname}/../../api_server/config/config`);

const _ = require('lodash');
// var rp = require('request-promise');
const Redis = require('ioredis');
// const bluebird = require('bluebird');
const bluebird = require('bluebird');
const axios = require('axios');
const rp = require('request-promise');
const Database = require('./database');
const Pagerduty = require(`${__dirname}/../../api_server/modules/pagerduty/pagerduty`);

bluebird.promisifyAll(Redis);
const conWrite = config.write_mysql;
const conRead = config.read_mysql;
// main(conWrite, conRead);
function getResourceByResourceReference(database, resourceReference) {
    const mysqlQ = `select * from (SELECT id, resource_type, resource_reference, old_detail_id, stream_status, subject FROM course_resources WHERE resource_reference = '${resourceReference}' and resource_type IN (1,4,8) limit 1) a inner join (select id, resource_reference, old_detail_id from course_resources where resource_type=2 and meta_info='Homework') as b on a.old_detail_id=b.old_detail_id`;
    console.log(mysqlQ);
    return database.query(mysqlQ);
}

function getAssortmentsByResourceReference(database, resourceReference) {
    const mysqlQ = `select b.assortment_id from (select id from course_resources where resource_reference='${resourceReference}') as a inner join (select assortment_id, course_resource_id, resource_type  from course_resource_mapping where resource_type='resource') as b on a.id=b.course_resource_id`;
    // console.log('mysqlQ')
    // console.log(mysqlQ)
    return database.query(mysqlQ);
}

function getAllParentAssortments(database, assortmentIDArray) {
    const mysqlQ = `select assortment_id,course_resource_id from course_resource_mapping where course_resource_id in (${assortmentIDArray}) and resource_type='assortment'`;
    // console.log('mysqlQ');
    // console.log(mysqlQ);
    return database.query(mysqlQ);
}

async function getParentAssortmentListRecursively(mysqlRead, assortmentList, totalResource = []) {
    try {
        const results = await getAllParentAssortments(mysqlRead, assortmentList);
        if (results.length > 0) {
            const assortmentListArr = results.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            totalResource = [...totalResource, ...assortmentListArr];
            return getParentAssortmentListRecursively(mysqlRead, assortmentListArr, totalResource);
        }
        return totalResource;
    } catch (e) {
        throw new Error(e);
    }
}

async function getParentAssortmentList(mysqlRead, assortmentList) {
    try {
        const totalResource = [];
        const totalMapppings = await getParentAssortmentListRecursively(mysqlRead, assortmentList, totalResource);
        return totalMapppings;
    } catch (e) {
        throw new Error(e);
    }
}

function getSubscribedUnpushedUsers(database, assortmentIDArray, questionID) {
    const mysqlQ = `select * from (select id, assortment_id from package where assortment_id in (${assortmentIDArray})) as a inner join (select student_id, new_package_id from student_package_subscription where start_date <= now() and end_date >= now() and is_active=1) as b on a.id=b.new_package_id inner join (select student_id, is_pushed from liveclass_subscribers where resource_reference=${questionID} and is_pushed is null) as c on b.student_id=c.student_id inner join (select student_id, gcm_reg_id, mobile, locale, app_version from students where gcm_reg_id is not null) as d on b.student_id=d.student_id`;
    console.log(mysqlQ);
    return database.query(mysqlQ);
}

function upsertSubscribers(database, studentID, questionID) {
    const mysqlQ = `INSERT INTO liveclass_subscribers (resource_reference, student_id, is_pushed, is_interested, is_view) VALUES (${questionID}, ${studentID}, 1, 1, 1) ON DUPLICATE KEY UPDATE is_pushed = 1, is_interested=1 , is_view=1`;
    // console.log(mysqlQ);
    return database.query(mysqlQ);
}

function getWhatsappOptinSource(database, mobile) {
    const mysqlQ = `select source from whatsapp_optins where phone='${mobile}'`;
    // console.log(mysqlQ);
    return database.query(mysqlQ);
}
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

async function handleWhatsappPush(mysqlRead, mobile, studentID, userLocale, questionID, subject, deeplink) {
    try {
    // get opt in source from mobile no.
        const sourceDetails = await getWhatsappOptinSource(mysqlRead, mobile);
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
            // console.log(sources);
            // console.log(attributes);
            const hsmData = {
                sources,
                attributes,
            };
            return sendWhatsappPush(mobile, studentID, message, questionID, hsmData);
        }
        return false;
    } catch (e) {
        console.log(e);
        throw new Error(e);
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
    console.log('sent');
    return rp(options);
}
async function liveclassEndAction(readDb, writeDb, questionID) {
    try {
        const resourceDetails = await getResourceByResourceReference(readDb, questionID);
        // console.log('resourceDetails')
        // console.log(resourceDetails)
        if (resourceDetails.length > 0 && !_.isNull(resourceDetails[0].resource_reference)) {
            // check pdf exists or not
            const pdfUrl = resourceDetails[0].resource_reference;
            const check = await axios.get(pdfUrl);
            const updatePromise = [];
            if (check.status === 200) {
                const notificationObject = {};
                const notificationObject2 = {};
                const whatsappPushPromise = [];
                // get list of assortment id's of question id
                const assortments = await getAssortmentsByResourceReference(readDb, questionID);
                if (assortments.length > 0) {
                    let assortmentList = assortments.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
                    if (assortmentList.length > 0) {
                        // get all assortments
                        assortmentList = await getParentAssortmentList(readDb, assortmentList);
                        console.log('assortmentList');
                        console.log(assortmentList);
                        // get subscribed unpushed users
                        const studentDetails = await getSubscribedUnpushedUsers(readDb, assortmentList, questionID);
                        console.log('studentDetails');
                        console.log(studentDetails.length);
                        // update promise
                        console.log(studentDetails.length);
                        // const groupedUsers = _.groupBy(studentDetails, 'locale');
                        const pdfDeeplink = await generateDeeplinkFromAppDeeplink(config.branch_key, 'HOMEWORK_PDF', `HW${questionID}`, `doubtnutapp://pdf_viewer?pdf_url=${pdfUrl}`);
                        const hcDeeplink = await generateDeeplinkFromAppDeeplink(config.branch_key, 'HOMEWORK_PDF', `HW${questionID}`, `doubtnutapp://homework?qid=${questionID}`);
                        const groupedByAppVersion = _.groupBy(studentDetails, 'app_version');
                        // console.log(groupedByAppVersion);
                        for (const appVersion in groupedByAppVersion) {
                            if (Object.prototype.hasOwnProperty.call(groupedByAppVersion, appVersion)) {
                                const groupedUsers = _.groupBy(groupedByAppVersion[appVersion], 'locale');
                                const splittedAppVersion = appVersion.split('.');
                                for (const locale in groupedUsers) {
                                    if (parseInt(splittedAppVersion[2]) > 188) {
                                        // homework corner
                                        if (typeof notificationObject[locale] === 'undefined') {
                                            notificationObject[locale] = {};
                                        }
                                        notificationObject[locale].payload = getNotificationPayload(locale, resourceDetails[0].subject, questionID, pdfUrl, 'homework_corner');
                                        if (typeof notificationObject[locale].users === 'undefined') {
                                            notificationObject[locale].users = [];
                                        }
                                        for (let i = 0; i < groupedUsers[locale].length; i++) {
                                            // if (groupedUsers[locale][i].student_id == 2524641) {
                                                whatsappPushPromise.push(handleWhatsappPush(readDb, groupedUsers[locale][i].mobile, groupedUsers[locale][i].student_id, groupedUsers[locale][i].locale, questionID, resourceDetails[0].subject, hcDeeplink.url));
                                                updatePromise.push(upsertSubscribers(writeDb, groupedUsers[locale][i].student_id, questionID));
                                                notificationObject[locale].users.push({
                                                    id: groupedUsers[locale][i].student_id,
                                                    gcmId: groupedUsers[locale][i].gcm_reg_id,
                                                });
                                            // }
                                        }
                                    } else {
                                        // pdf
                                        if (typeof notificationObject2[locale] === 'undefined') {
                                            notificationObject2[locale] = {};
                                        }
                                        notificationObject2[locale].payload = getNotificationPayload(locale, resourceDetails[0].subject, questionID, pdfUrl, 'pdf');
                                        if (typeof notificationObject2[locale].users === 'undefined') {
                                            notificationObject2[locale].users = [];
                                        }
                                        for (let i = 0; i < groupedUsers[locale].length; i++) {
                                            // if (groupedUsers[locale][i].student_id == 2524641) {
                                                console.log(groupedUsers[locale][i]);
                                                whatsappPushPromise.push(handleWhatsappPush(readDb, groupedUsers[locale][i].mobile, groupedUsers[locale][i].student_id, groupedUsers[locale][i].locale, questionID, resourceDetails[0].subject, pdfDeeplink.url));
                                                updatePromise.push(upsertSubscribers(writeDb, groupedUsers[locale][i].student_id, questionID));
                                                notificationObject2[locale].users.push({
                                                    id: groupedUsers[locale][i].student_id,
                                                    gcmId: groupedUsers[locale][i].gcm_reg_id,
                                                });
                                            // }
                                        }
                                    }
                                }
                            }
                        }
                        console.log('done processing');
                    }
                    // console.log('notificationObject')
                    // console.log(notificationObject)
                    // console.log(notificationObject2)
                    const workers = [];
                    console.log('resolving start');
                    for (const key3 in notificationObject) {
                        if (notificationObject[key3].users.length > 0) {
                            workers.push(sendNotification(notificationObject[key3].users, notificationObject[key3].payload));
                        }
                    }
                    for (const key4 in notificationObject2) {
                        if (notificationObject2[key4].users.length > 0) {
                            workers.push(sendNotification(notificationObject2[key4].users, notificationObject2[key4].payload));
                        }
                    }
                    console.log('resolving end');
                    console.log(workers);
                    await Promise.all(workers);
                    await Promise.all(whatsappPushPromise);
                    await Promise.all(updatePromise);
                }
            }
        }
        // return true;
    } catch (e) {
        console.log(e);
        throw new Error('Error in liveclass end action');
    }
}
function getFinishedLiveclass(database) {
    const sql = 'select * from (select assortment_id, course_resource_id from course_resource_mapping where schedule_type=\'scheduled\' and live_at > now() and live_at < date_add(now(),interval 5 minute) and resource_type=\'resource\') as a inner join (select id, resource_reference from course_resources where resource_type=4) as b on a.course_resource_id=b.id limit 1';
    return database.query(sql);
}

(async () => {
    let writeClient = '';
    let readClient = '';
    try {
        writeClient = new Database(conWrite);
        readClient = new Database(conRead);
        const liveclasses = await getFinishedLiveclass(readClient);
        console.log(liveclasses);
        await Promise.all(liveclasses.map(async (item) => {
            await liveclassEndAction(readClient, writeClient, item.resource_reference);
            // await liveclassEndAction(readClient, writeClient, '638675167')
        }));

        // await liveclassEndAction(db, 638675167);
        console.log(`the script successfully ran at ${new Date()}`);
    } catch (error) {
        console.log(error);
        const title = 'Issue in Liveclass end script';
        const from = 'vivek@doubtnut.com';
        const cronServerServiceID = 'P9T0CZU';
        await Pagerduty.createIncident(config.pagerduty_api_key, cronServerServiceID, title, from);
    } finally {
        writeClient.connection.end();
        readClient.connection.end();
    }
})();
