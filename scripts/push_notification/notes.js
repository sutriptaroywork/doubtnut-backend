/* eslint-disable no-await-in-loop */

require('dotenv').config({ path: `${__dirname}/../../api_server/.env` });

const config = require(`${__dirname}/../../api_server/config/config`);
const Pagerduty = require(`${__dirname}/../../api_server/modules/pagerduty/pagerduty`);
const _ = require('lodash');
const moment = require('moment');
const rp = require('request-promise');
const axios = require('axios');
const Database = require('./database');

const mysql = config.mysql_analytics;
const cronServerServiceID = 'P9T0CZU';
async function getNotesAssortment(database) {
    const sql = `select * from (select id, resource_reference, chapter from course_resources where created_at >='${moment().format('YYYY-MM-DD')}  00:00:00' and created_at < '${moment().add(1, 'days').format('YYYY-MM-DD')}  00:00:00' and resource_type=2 and meta_info like 'notes') as a left join (select assortment_id, course_resource_id from course_resource_mapping where resource_type='resource') as b on a.id=b.course_resource_id`;
    console.log(sql);
    return database.query(sql);
}
function getAllParentAssortments(database, assortmentIDArray) {
    const sql = `select assortment_id,course_resource_id from course_resource_mapping where course_resource_id in (${assortmentIDArray.join(',')}) and resource_type='assortment'`;
    // console.log(sql);
    return database.query(sql);
}

function getSubscribedUsersByAssortmentList(database, assortmentIDArray) {
    const sql = `select b.student_id, c.gcm_reg_id, c.mobile, c.locale from (select * from package where assortment_id in (${assortmentIDArray}))  as a inner join (select student_id, new_package_id from student_package_subscription where start_date < now() and end_date > now() and is_active=1) as b on a.id=b.new_package_id left join (select * from students where gcm_reg_id is not null) as c on b.student_id=c.student_id group by b.student_id`;
    // console.log(sql);
    return database.query(sql);
}
async function getParentAssortmentListRecursivelyV1(db, assortmentList, totalResource = []) {
    try {
        const results = await getAllParentAssortments(db.mysql.read, assortmentList);
        if (results.length > 0) {
            totalResource = [...totalResource, ...results];
            const assortmentListArr = results.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            return getParentAssortmentListRecursivelyV1(db, assortmentListArr, totalResource);
        }
        return totalResource;
    } catch (e) {
        throw new Error(e);
    }
}
async function getParentAssortmentListV1(db, assortmentList) {
    try {
        const totalResource = [];
        const totalMapppings = await getParentAssortmentListRecursivelyV1(db, assortmentList, totalResource);
        // divide it into resources and assortment ids
        return totalMapppings;
    } catch (e) {
        throw new Error(e);
    }
}

function getNotificationPayload(locale, chapterName, pdfUrl, id) {
    let title = `${chapterName} ke notes`;
    let message = 'View now !';
    let imageUrl = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5AD84CB1-2B9B-5A86-0F48-40F050DAC490.webp';
    if (locale === 'hi') {
        title = `${chapterName} के नोट्स`;
        message = 'अभी देखें !';
        imageUrl = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/ABC117CF-CA6E-5ADE-D925-F7BC8EE1975E.webp';
    }
    return {
        event: 'pdf_viewer',
        title,
        message,
        image: imageUrl,
        firebase_eventtag: `NOTES_${id}`,
        data: JSON.stringify({ pdf_url: pdfUrl }),
    };
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
    return rp(options);
}
async function main() {
    let client = '';
    try {
        client = new Database(mysql);
        const result = await getNotesAssortment(client);
        // console.log('result')
        // console.log(result)

        // group by assortment id
        const groupedAssortments = _.groupBy(result, 'assortment_id');
        for (const key in groupedAssortments) {
            if (Object.prototype.hasOwnProperty.call(groupedAssortments, key)) {
                const item = groupedAssortments[key];
                const check = await axios.get(item[0].resource_reference);
                if (check.status === 200) {
                // console.log(item)
                    const assortmentID = key;
                    // get all parent assortments
                    const assList = await getParentAssortmentListV1({ mysql: { read: client } }, [assortmentID]);
                    const list = assList.reduce((acc, obj) => acc.concat(obj.assortment_id), [parseInt(assortmentID)]);
                    // get active subscribed users
                    const users = await getSubscribedUsersByAssortmentList(client, list);
                    // console.log(users)
                    const hindiPayload = getNotificationPayload('hi', item[0].chapter, item[0].resource_reference, item[0].id);
                    const enPayload = getNotificationPayload('en', item[0].chapter, item[0].resource_reference, item[0].id);
                    const hindiUsers = [];
                    const englishUsers = [];
                    for (let i = 0; i < users.length; i++) {
                        if (users[i].locale === 'hi') {
                            hindiUsers.push({ id: users[i].student_id, gcmId: users[i].gcm_reg_id });
                        } else {
                            englishUsers.push({ id: users[i].student_id, gcmId: users[i].gcm_reg_id });
                        }
                    }
                    await Promise.all([
                        sendNotification(hindiUsers, hindiPayload),
                        sendNotification(englishUsers, enPayload),
                    ]);
                }
            }
        }
        console.log(`the script successfully ran at ${new Date()}`);
    } catch (error) {
        console.log(error);
        const title = 'Issue in Notes nudge script';
        const from = 'vivek@doubtnut.com';
        await Pagerduty.createIncident(config.pagerduty_api_key, cronServerServiceID, title, from);
    } finally {
        client.connection.end();
    }
}

main();
