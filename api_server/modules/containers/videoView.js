const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/videoView');
const redis = require('../redis/videoView');

module.exports = class UserAnswerFeedback {
    constructor() {
    }

    static getVideoViews(student_id, db) {
        console.log('student_id');
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let feedback;
                // get from redis
                if (0) {
                    feedback = await redis.getVideoViews(student_id, db.redis.read);
                    console.log('redis feedback');
                    console.log(feedback);
                    if (!_.isNull(feedback)) {
                        console.log('exist');
                        feedback = JSON.parse(feedback);
                        feedback += 1;
                        return resolve(JSON.parse(feedback));
                    }
                    // get from mysql
                    console.log(' not exist');
                    feedback = await mysql.getVideoViews(student_id, db.mysql.read);
                    console.log('mysql feedback');
                    console.log(feedback);
                    if (feedback.length > 0) {
                        console.log('setting feedback inredis');
                        // set in redis
                        await redis.setVideoViews(student_id, feedback, db.redis.write);
                    }
                    return resolve(feedback);
                }
                feedback = await mysql.getVideoViews(student_id, db.mysql.read);
                // console.log("mysql feedback")
                // console.log(feedback)
                // set in redis
                return resolve(feedback);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static getStudentId(udid, db) {
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let stu_id;
                // get from redis
                if (config.caching) {
                    stu_id = await redis.getStudentId(udid, db.redis.read);
                    if (!_.isNull(stu_id)) {
                        return resolve(JSON.parse(stu_id));
                    }
                    // get from mysql
                    stu_id = await mysql.getStudentId(udid, db.mysql.read);
                    if (stu_id.length > 0) {
                        // set in redis
                        await redis.setStudentId(udid, stu_id, db.redis.write);
                    }
                    return resolve(stu_id);
                }
                stu_id = await mysql.getStudentId(udid, db.mysql.read);
                // set in redis
                return resolve(stu_id[0].id);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }
};
