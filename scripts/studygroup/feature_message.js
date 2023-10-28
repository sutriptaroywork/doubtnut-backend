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
        const messageDetails = {
            message: {
                widget_data: {
                    group_guideline: 'Dear Students!\n'
                        + 'New Features have been added to study groups! Update to the latest app to get these features!(If you do not get update option, wait for a few days, the update will be available to all users in some days)\n'
                        + '-Now you can share videos (upto 10 Mb) in your study groups!\n'
                        + '-You can Mute notifications of any group!\n'
                        + '-You can share video solutions of doubts you ask from doubtnut app to your study groups!\n'
                        + 'Remember to follow all group guidelines and use study groups for meaningful discussions!\n',
                },
                widget_type: 'widget_study_group_guideline',
            },
            room_type: 'study_group',
            student_id: 32585989,
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

        for (const roomId of activeGroups) {
            messageDetails.room_id = roomId;
            Utility.postMessage(messageDetails);
            await new Promise((resolve) => setTimeout(resolve, 300));
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
