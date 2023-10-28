/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-case-declarations */
/* eslint-disable no-await-in-loop */

const path = `${__dirname}/../../api_server/`;
require('dotenv').config({ path: `${path}.env` });
const moment = require('moment');
const _ = require('lodash');

const config = require(`${path}config/config`);
const Database = require(`${path}config/database`);

const mysql = new Database(config.read_mysql);
const { mysql: studyGroupSQL, utility: Utility } = require('./modules');
const studyGroupData = require('./data/data');

// TODO: Enter a query name from list
// getActiveGroupsByMembers, getActiveGroupsByCreatedAt, getActiveGroupsByLastSent, getActiveGroupsMessageCount, getAllGroups
const queryType = 'getAllGroups';

async function getStudentDetails(roomIdList) {
    try {
        const chunk = 10000;
        let i; let j;
        let temporary;
        for (i = 0, j = roomIdList.length; i < j; i += chunk) {
            temporary = roomIdList.slice(i, i + chunk);
            console.log(temporary, ' temp');
            const memberData = await studyGroupSQL.getMemberData(temporary, mysql);
            Utility.sendNotification(memberData);
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function main() {
    try {
        const mongo = await Utility.connectMongo(config);
        /** Refer data file for message widget format */
        const messageDetails = {
            message: {
                widget_data: {
                    child_widget: {
                        widget_data: {
                            deeplink: 'doubtnutapp://course_explore',
                            question_image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/115C3D8E-20D2-66A8-DA98-BF18CBE5D75F.webp',
                            id: 'question',
                            card_ratio: '16:9',
                        },
                        widget_type: 'widget_asked_question',
                    },
                    created_at: moment().valueOf(),
                    student_img_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/upload_45917205_1619087619.png',
                    title: 'Are wo Offer use kara kya kisi discount wala Doubtnut par?🤔\nCoupon Code: SASTAHAFTA use kar k 20% OFF mil raha 27th tak sare courses par.\n',
                    sender_detail: 'Sent by Doubtnut',
                    visibility_message: '',
                    widget_display_name: 'Image',
                    cta_text: 'Explore Now',
                    deeplink: 'doubtnutapp://course_explore',
                },
                widget_type: 'widget_study_group_parent',
            },
            room_type: 'study_group',
            student_id: 32585989,
            attachment: '',
            attachment_mime_type: '',
            student_img_url: '',
        };
        let activeGroups;
        switch (queryType) {
            case 'getAllGroups':
                activeGroups = await studyGroupSQL.getAllGroups(mysql);
                break;
            case 'getActiveGroupsByMembers':
                activeGroups = await studyGroupSQL.getActiveGroupsByMembers(studyGroupData.members.operator, studyGroupData.members.TOTAL_MEMBERS, mysql);
                break;
            case 'getActiveGroupsByCreatedAt':
                activeGroups = await studyGroupSQL.getActiveGroupsByCreatedAt(studyGroupData.createdAt.operator, studyGroupData.createdAt.timestamp, mysql);
                break;
            case 'getActiveGroupsByLastSent':
                const mongoData = await mongo.collection('chatroom_messages').find({
                    room_type: 'study_group',
                    created_at: {
                        $gte: moment(studyGroupData.lastSent.timestamp).toDate(),
                    },
                });
                activeGroups = _.uniq(mongoData.map((item) => item.room_id));
                break;
            default:
                process.exit();
        }
        console.log('activeGroups ', activeGroups.length);

        let i; let j; const chunk = 500;
        for (i = 0, j = 500000; i < j; i += chunk) {
            const roomIds = activeGroups.slice(i, i + chunk);
            if (_.isEmpty(roomIds)) {
                console.log("roomIds Empty");
                break;
            }
            Utility.postMultipleMessage(JSON.stringify(messageDetails), roomIds);
            await new Promise((resolve) => {
                console.log("Waiting for 15 seconds....");
                setTimeout(resolve, 15000);
            });
        }
        console.log(`Message sent in ${activeGroups.length} groups`);
        // getStudentDetails(activeGroups);
    } catch (e) {
        console.error(e);
        mysql.connection.end();
    } finally {
        // mysql.connection.end();
        console.log(`the script successfully ran at ${new Date()}`);
    }
}

main();
