/* eslint-disable no-await-in-loop */

require('dotenv').config({ path: `${__dirname}/../../api_server/.env` });

const config = require(`${__dirname}/../../api_server/config/config`);
const Pagerduty = require(`${__dirname}/../../api_server/modules/pagerduty/pagerduty`);
const _ = require('lodash');
const moment = require('moment');
const rp = require('request-promise');
const Database = require('./database');

const mysql = config.mysql_analytics;
const cronServerServiceID = 'P9T0CZU';
async function getUsers(database) {
    const sql = `select a.display_name, b.assortment_id, c.student_id, d.gcm_reg_id, d.locale from (select * from course_details where start_date >= '${moment().format('YYYY-MM-DD')}  00:00:00' and start_date < '${moment().add(1, 'days').format('YYYY-MM-DD')}  00:00:00')  as a inner join (select * from package) as b on a.assortment_id=b.assortment_id inner join (select * from student_package_subscription where start_date < now() and end_date > now() and is_active=1  and amount = -1) as c on b.id=c.new_package_id inner join (select * from students where gcm_reg_id is not null) as d on c.student_id=d.student_id`;
    console.log(sql);
    return database.query(sql);
}
function getNotificationPayload(locale, courseName, assortmentID) {
    const title = courseName;
    let message = 'Your free trial starts today !';
    let imageUrl = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1504F241-C872-0B1F-2D77-75FF21356BF5.webp';
    if (locale === 'hi') {
        message = 'आप का फ़्री ट्रायल आज से शुरू';
        imageUrl = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/979FC27F-71E8-3BFB-E7B6-20E6FE8A8C4B.webp';
    }
    return {
        event: 'course_details',
        title,
        message,
        image: imageUrl,
        firebase_eventtag: `COURSE_START_${assortmentID}`,
        data: JSON.stringify({ id: assortmentID }),
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
        const userDetails = await getUsers(client);
        // console.log('users')
        // console.log(userDetails)
        const groupedUser = _.groupBy(userDetails, 'assortment_id');
        for (const key in groupedUser) {
            if (Object.prototype.hasOwnProperty.call(groupedUser, key)) {
                const items = groupedUser[key];
                const hindiUsers = [];
                const englishUsers = [];
                const hindiPayload = getNotificationPayload('hi', items[0].display_name, key);
                const enPayload = getNotificationPayload('en', items[0].display_name, key);
                for (let i = 0; i < items.length; i++) {
                    if (items[i].locale === 'hi') {
                        hindiUsers.push({ id: items[i].student_id, gcmId: items[i].gcm_reg_id });
                    } else {
                        englishUsers.push({ id: items[i].student_id, gcmId: items[i].gcm_reg_id });
                    }
                }
                await Promise.all([
                    sendNotification(hindiUsers, hindiPayload),
                    sendNotification(englishUsers, enPayload),
                ]);
            }
        }
        console.log(`The script successfully ran at ${new Date()}`);
    } catch (error) {
        console.log(error);
        const title = 'Issue in course start trial user notification script';
        const from = 'vivek@doubtnut.com';
        await Pagerduty.createIncident(config.pagerduty_api_key, cronServerServiceID, title, from);
    } finally {
        client.connection.end();
    }
}

main();
