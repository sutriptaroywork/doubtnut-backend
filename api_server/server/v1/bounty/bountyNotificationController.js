const notification = require('../../../modules/newtonNotifications');
const BountyNotification = require('../../../modules/bountyNotification');
const bountyConstants = require('../../../data/bounty');
const BountyPostDetail = require('../../../modules/bounytPostDetail');
const BountyAnswerDetail = require('../../../modules/bountyAnswerDetail');

async function sendBountyNotification(db, params) {
    try {
        let studentDetails;
        if (params.type == 'more-than-5-likes') {
            // sendNotification
            studentDetails = await BountyNotification.getStudentWithAnswerId(db.mysql.read, params);
            const payload = bountyConstants.notification.more_than_5_likes;
            payload.data = JSON.stringify({ question_id: params.question_id });
            payload.s_n_id = params.type;
            notification.sendNotification(studentDetails[0].student_id, payload, db.mysql.read);
        } else if (params.type === 'got-answer') {
            // studentDetails = await BountyNotification.getStudentWithBountyId(db.mysql.read, params);
            const payload = bountyConstants.notification.got_answer;
            payload.data = JSON.stringify({ question_id: parseInt(params.question_id) });
            payload.s_n_id = params.type;
            notification.sendNotification(params.student_id, payload, db.mysql.read);
            // sendNotification
        } else if (params.type === 'answer-accepted') {
            const payload = bountyConstants.notification.answer_accepted;
            payload.s_n_id = params.type;
            payload.data = JSON.stringify({ question_id: parseInt(params.question_id) });
            notification.sendNotification(params.student_id, payload, db.mysql.read);
            // sendNotification
        } else if (params.type === 'received_comment') {
            const payload = bountyConstants.notification.received_comment;
            payload.data = JSON.stringify({ question_id: parseInt(params.question_id) });
            payload.s_n_id = params.type;
            notification.sendNotification(params.student_id, payload, db.mysql.read);
        } else if (params.type === 'bounty_raise_notification') {
            const payload = bountyConstants.notification.bounty_raise;
            payload.s_n_id = params.type;
            await notification.sendNotification(params.student_id, payload, db);
        } else if (params.type === 'encourage_to_accept') {
            const payload = bountyConstants.notification.encourage_to_accept;
            payload.data = JSON.stringify({ question_id: parseInt(params.question_id) });
            payload.s_n_id = params.type;
            await notification.sendNotification(params.student_id, payload, db);
        }
    } catch (e) {
        console.log(e);
    }
}

async function notificationForComment(db, obj) {
    try {
        const id = parseInt(obj.entity_id);
        if (obj.entity_type == 'bounty_question') {
            const quesDetails = await BountyPostDetail.getBountyDetailsByBountyId(db.mysql.read, id);
            // if (obj.student_id != quesDetails[0].student_id) {
            const { question_id } = quesDetails[0];
            const params = {
                type: 'received_comment',
                student_id: quesDetails[0].student_id,
                question_id,
            };
            sendBountyNotification(db, params);
            // }
        } else if (obj.entity_type == 'bounty_answer') {
            const ansDetails = await BountyAnswerDetail.getAnswerDeatilsByAnswerId(db.mysql.read, id);
            if (obj.student_id !== ansDetails[0]) {
                const params = {
                    type: 'received_comment',
                    student_id: ansDetails[0].student_id,
                    question_id: ansDetails[0].question_id,
                };
                sendBountyNotification(db, params);
            }
        }
    } catch (e) {
        console.log(e);
    }
}

module.exports = { sendBountyNotification, notificationForComment };
