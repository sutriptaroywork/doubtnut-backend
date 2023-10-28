/* eslint-disable no-await-in-loop */

require('dotenv').config({ path: `${__dirname}/../../api_server/.env` });

const config = require(`${__dirname}/../../api_server/config/config`);
const Pagerduty = require(`${__dirname}/../../api_server/modules/pagerduty/pagerduty`);
const CourseHelper = require(`${__dirname}/../../api_server/server/helpers/course`);
const Utility = require(`${__dirname}/../../api_server/modules/utility`);
const moment = require('moment');
const _ = require('lodash');
const rp = require('request-promise');
const Database = require('./database');

const mysql = config.mysql_analytics;
const cronServerServiceID = 'P9T0CZU';

function getTodaysPdf(mysqlClient) {
    const date = moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD');
    const nDate = moment().add(5, 'hours').add(30, 'minutes').add(1, 'days')
        .format('YYYY-MM-DD');
    const query = `select id, resource_reference, subject, topic, name from course_resources where (resource_type=2 or resource_type=3) and created_at >= '${date}' and created_at < '${nDate}'`;
    // return mysqlClient.query(query, [date, nDate]);
    console.log(query)
    return mysqlClient.query(query);
}

function getSubscribedUsersByAssortmentList(client, assortmentList) {
    const query = 'select a.student_id, c.mobile from (select * from student_package_subscription where start_date <= CURRENT_DATE and end_date >= CURRENT_DATE and is_active=1) as a inner join (select * from package where is_active=1 and assortment_id in (?)) as b on a.new_package_id=b.id inner join (select student_id, mobile from students) as c on a.student_id=c.student_id';
    return client.query(query, [assortmentList]);
}



function sendWhatsappPush(mobile, message, studentID) {
    const options = {
        method: 'PUT',
        url: 'https://micro.internal.doubtnut.com/api/whatsapp/send-text-msg',
        headers:
    { 'Content-Type': 'application/json' },
        body: {
          phone: `91${mobile}`,
          studentId: studentID,
          text: message,
          preview:true,
        },
        json: true,
    };

    // console.log(options);
    return rp(options);
}

async function main() {
    let client = '';
    try {
        client = new Database(mysql);
        const pdfs = await getTodaysPdf(client);
        const arr = [];
        for (let i = 0; i < pdfs.length; i++) {
          const appDeeplink = `doubtnutapp://pdf_viewer?pdf_url=${pdfs[i].resource_reference}`;
          const deeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'pdf_channel', 'pdf_nudge', appDeeplink);
        // get assortment id list
            const assortmentList = await CourseHelper.getAssortmentsByResourceList({ mysql: { read: client } }, [pdfs[i].id]);
            // get subscribed users for assortment id's
            const studentList = await getSubscribedUsersByAssortmentList(client, assortmentList);
            for (let j = 0; j < studentList.length; j++) {
                const obj = {
                    phone_number: studentList[j].mobile,
                    deeplink,
                    student_id: studentList[j].student_id,
                    title: `${pdfs[i].subject} | ${pdfs[i].topic} | ${pdfs[i].name}`
                };
                arr.push(obj);
            }
        }
        const grouped = _.groupBy(arr, 'phone_number');
        for (const key in grouped) {
            if (Object.prototype.hasOwnProperty.call(grouped, key)) {
                const item = grouped[key];
                let message = 'Aaj ki class ke notes ye rahe 👍\n';
                const studentID = item[0].student_id
                for(let i = 0; i < item.length; i++) {
                  message = `${message}${item[i].title} - ${item[i].deeplink.url}\n`
                }
                // console.log(key)
                // console.log(studentID)
                // console.log(message)
                // send message
            const resultLog =  await sendWhatsappPush(key, message, studentID);
            console.log(resultLog);
            }
        }
        console.log(`the script successfully ran at ${new Date()}`);
    } catch (error) {
        console.log(error);
        const title = 'Issue in Pdf nudge script';
        const from = 'vivek@doubtnut.com';
        await Pagerduty.createIncident(config.pagerduty_api_key, cronServerServiceID, title, from);
    } finally {
        client.connection.end();
    }
}

main();
