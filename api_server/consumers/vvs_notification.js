/* eslint-disable camelcase */
require('../modules/mongo/comment');
const bluebird = require('bluebird');
const mongoose = require('mongoose');

bluebird.promisifyAll(mongoose);
const _ = require('lodash');

const VideoView = require('../modules/videoView');
const Data = require('../data/data');
const Notification = require('../modules/notifications');
const AnswerContainer = require('../modules/containers/answer');
const CourseHelper = require('../server/helpers/course');
const CourseContainerV2 = require('../modules/containers/coursev2');

let db;
let config;

async function updateAnswerView(req, app) {
    db = app.get('db');
    config = app.get('config');
    const { view_id } = req.body;
    let { engage_time, video_time } = req.body;
    const pageArray = ['COURSE_FAQ', 'POST_PURCHASE_COURSE_DETAILS', 'WHATS_NEW_HOME'];

    const videoViewStatRow = await VideoView.getVideoViewStatById(view_id, db.mysql.write);
    const sid = videoViewStatRow[0].student_id;
    const qid = videoViewStatRow[0].question_id;
    const { answer_id } = videoViewStatRow[0];
    const isComputationQuestionView = !!(videoViewStatRow[0].answer_video && videoViewStatRow[0].answer_video.includes('computational'));

    if (videoViewStatRow[0].engage_time > engage_time) {
        engage_time = videoViewStatRow[0].engage_time;
    }
    if (videoViewStatRow[0].video_time > video_time) {
        video_time = videoViewStatRow[0].video_time;
    }

    if (isComputationQuestionView) {
        try {
            await AnswerContainer.getByQuestionNewId(qid, db).then((row) => {
                if (row.length && !Data.et_student_id.includes(row[0].student_id) && !pageArray.includes(videoViewStatRow[0].view_from)) {
                    Notification.resumeVideoNotification(sid, qid, answer_id, video_time, view_id, db);
                }
            });
        } catch (e) {
            console.log(e);
        }
    } else {
        try {
            await AnswerContainer.getByQuestionId(qid, db).then((row) => {
                if (row.length && !Data.et_student_id.includes(row[0].student_id) && !pageArray.includes(videoViewStatRow[0].view_from)) {
                    Notification.resumeVideoNotification(sid, qid, answer_id, video_time, view_id, db);
                }
            });
        } catch (e) {
            console.log(e);
        }
    }

    if (video_time >= 1) {
        try {
            const data = await CourseContainerV2.getAssortmentsByResourceReferenceV1(db, qid);
            if (data.length && !data[0].is_chapter_free) {
                await CourseHelper.updateUserLastWatchedVideoInAssortmentProgress(db, data, sid, qid, data[0].subject, engage_time, view_id);
            }
        } catch (e) {
            console.log(e);
        }
    }
    if (parseInt(engage_time) > 15 && parseInt(engage_time) <= 1800) {
        try {
            await Notification.incompleteVideoView(qid.toString(), req.user, null, db, config);
        } catch (e) {
            console.log(e);
        }
    } else if (parseInt(engage_time) > 1800) {
        try {
            await Notification.completeVideoView(qid.toString(), req.user, null, db, config);
        } catch (e) {
            console.log(e);
        }
    }

    try {
        await Notification.firstQuestionEver(sid, qid, req.user.gcm_reg_id, null, db);
    } catch (e) {
        console.log(e);
    }

    console.log('done');
}

module.exports = {
    updateAnswerView,
};
