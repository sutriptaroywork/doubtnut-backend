const request = require('request-promise');
const moment = require('moment');
const config = require('../config/config');

const rp = request.defaults({
    baseUrl: config.microUrl,
    json: true,
    timeout: 100,
    forever: true,
    pool: { maxSockets: 200 },
});

module.exports = class VideoView {
    static async createVVS(id, data) {
        try {
            await rp.put({
                url: `/api/video-view/${id}`,
                body: {
                    studentId: data.student_id,
                    questionId: data.question_id,
                    answerId: data.answer_id,
                    videoTime: data.video_time,
                    engageTime: data.engage_time,
                    parentId: data.parent_id,
                    source: data.source,
                    viewFrom: data.is_back ? data.refer_id : data.view_from,
                    referStudentId: data.referred_st_id,
                    createdAt: new Date().toISOString(),
                },
            });
        } catch (e) {
            return false;
        }
    }

    static async updateVVS(id, videoTime, engageTime) {
        try {
            await rp.patch({
                url: `/api/video-view/${id}`,
                body: {
                    videoTime,
                    engageTime,
                },
            });
        } catch (e) {
            return false;
        }
    }

    static async insertAnswerView(data, database) {
        const sql = 'INSERT INTO video_view_stats SET ?';
        const res = await database.query(sql, [data]);
        // this.createVVS(res.insertId, data);
        return res;
    }

    static updateTimeByViewId(video_time, engage_time, viewId, database) {
        // this.updateVVS(view_id, video_time, engage_time);
        const sql = 'UPDATE video_view_stats SET ? WHERE view_id = ?';
        return database.query(sql, [{ video_time, engage_time }, viewId]);
    }

    static getVideoViewStatById(viewId, database) {
        const sql = 'SELECT * from video_view_stats WHERE view_id = ?';
        return database.query(sql, [viewId]);
    }

    static getVideoViewStatByReferId(viewId, database) {
        const sql = 'SELECT view_id from video_view_stats WHERE is_back = 1 AND refer_id = ? order by view_id desc limit 1';
        return database.query(sql, [viewId]);
    }

    static updateVideoStat(video_time, engage_time, viewId, database) {
        // this.updateVVS(view_id, video_time, engage_time);
        const sql = 'UPDATE video_view_stats SET ? WHERE view_id = ?';
        return database.query(sql, [{ video_time, engage_time }, viewId]);
    }

    static checkVideoViewCountByStIdOfDay(studentId, database) {
        const sql = 'select * from video_view_stats where student_id =? and date(created_at) = CURDATE()';
        return database.query(sql, [studentId]);
    }

    static checkYesterdayTrendingQuestion(questionId, database) {
        /*
        // Dummy Test code, used to check the query formatting in the console. Will add to actual tests later.
        const mysql = require('mysql');
        const actual = mysql.format(sql, [100, mySqlCompatibleYesterdayStartDatetime, mySqlCompatibleYesterdayEndDatetime]);
        const expected = "select distinct(student_id) from video_view_stats where question_id = 100 and created_at BETWEEN '2020-10-18 00:00:00' AND '2020-10-18 23:59:59'";
        assertEqual(actual, expected);
        */
        const mySqlCompatibleYesterdayStartDatetime = moment().add(5, 'hours').add(30, 'minutes').subtract(1, 'days')
            .format('YYYY-MM-DD 00:00:00');
        const mySqlCompatibleYesterdayEndDatetime = moment().add(5, 'hours').add(30, 'minutes').subtract(1, 'days')
            .format('YYYY-MM-DD 23:59:59');
        const sql = 'select distinct(student_id) from video_view_stats where question_id = ? and created_at BETWEEN ? AND ?';
        return database.query(sql, [questionId, mySqlCompatibleYesterdayStartDatetime, mySqlCompatibleYesterdayEndDatetime]);
    }

    static checkVideoViewCountByStId(studentId, database) {
        const sql = 'select * from video_view_stats where student_id =? and is_back = 0 and source = \'android\' limit 201';
        return database.query(sql, [studentId]);
    }

    static checkTendingVideo(answerId, database) {
        const sql = 'SELECT distinct student_id  FROM video_view_stats where answer_id=?and date(created_at) = CURDATE()-1 ';
        database.query(sql, [answerId]);
    }

    static getVideoWatchMeta(questionId, database) {
        const sql = 'select * from questions_meta where question_id = ?';
        // console.log(sql);
        return database.query(sql, [questionId]);
    }

    static setStudentId(udid, database) {
        const sql = 'INSERT INTO students (udid, gcm_reg_id, is_web) VALUES (?, \'\', \'1\')';
        return database.query(sql, [udid]);
    }

    static async insertViewWeb(stuId, qId, ansId, answerVideo, videoTime, engageTime, refStuId, parentId, source, viewFrom, database) {
        const sql = 'INSERT INTO video_view_stats (student_id, question_id, answer_id, answer_video, video_time, engage_time, parent_id, is_back, source, referred_st_id, view_from) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)';
        const res = await database.query(sql, [stuId, qId, ansId, answerVideo, videoTime, engageTime, parentId, source, refStuId, viewFrom]);
        // this.createVVS(res.insertId, {
        //     student_id: stuId,
        //     question_id: qId,
        //     answerId: ansId,
        //     video_time: videoTime,
        //     engage_time: engageTime,
        //     referred_st_id: refStuId,
        //     parentId,
        //     source,
        //     view_from: viewFrom,
        // });
        return res;
    }

    static updateViewWeb(viewId, videoTime, engageTime, database) {
        // this.updateVVS(view_id, video_time, engage_time);
        const sql = 'UPDATE video_view_stats SET video_time = ?, engage_time = ? WHERE view_id = ?';
        return database.query(sql, [videoTime, engageTime, viewId]);
    }

    static autoPlayViewsInsertion(database, data) {
        const sql = 'INSERT INTO auto_play_srp_views SET ?';
        return database.query(sql, [data]);
    }

    static getVideoCountByStudent(database, studentId) {
        const sql = 'select count(view_id) as view_count from video_view_stats where student_id =?';
        return database.query(sql, [studentId]);
    }
};
