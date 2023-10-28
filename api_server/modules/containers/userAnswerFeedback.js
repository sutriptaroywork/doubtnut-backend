const _ = require('lodash');
const config = require('../../config/config');

// let Utility = require('./utility');
// let _ = require('./utility');
const mysqlUserAnswerFeedback = require('../mysql/userAnswerFeedback');
const redisUserAnswerFeedback = require('../redis/userAnswerFeedback');

module.exports = class UserAnswerFeedback {
    constructor() {
    }

    static getAnswerFeedBackByStudent(student_id, answer_id, db) {
    // console.log("student_id")
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let feedback;
                // get from redis
                if (config.caching) {
                    feedback = await redisUserAnswerFeedback.getAnswerFeedBackByStudent(student_id, answer_id, db.redis.read);
                    // console.log("redis feedback")
                    // console.log(feedback)
                    if (!_.isNull(feedback)) {
                        console.log('exist');
                        return resolve(JSON.parse(feedback));
                    }
                    // get from mysql
                    console.log(' not exist');
                    feedback = await mysqlUserAnswerFeedback.getAnswerFeedBackByStudent(student_id, answer_id, db.mysql.read);
                    // console.log("mysql feedback")
                    // console.log(feedback)
                    if (feedback.length > 0) {
                        console.log('setting feedback inredis');
                        // set in redis
                        await redisUserAnswerFeedback.setAnswerFeedBackByStudent(student_id, answer_id, feedback, db.redis.write);
                    }
                    return resolve(feedback);
                }
                feedback = await mysqlUserAnswerFeedback.getAnswerFeedBackByStudent(student_id, answer_id, db.mysql.read);
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

    static getAnswerFeedBackByStudentNew(student_id, answer_id, answer_video, db) {
        return new Promise(async (resolve, reject) => {
            try {
                let feedback;
                if (config.caching) {
                    feedback = await redisUserAnswerFeedback.getAnswerFeedBackByStudentNew(student_id, answer_id, answer_video, db.redis.read);
                    if (!_.isNull(feedback)) {
                        // console.log('exist');
                        return resolve(JSON.parse(feedback));
                    }
                    feedback = await mysqlUserAnswerFeedback.getAnswerFeedBackByStudentNew(student_id, answer_id, answer_video, db.mysql.read);
                    if (feedback.length > 0) {
                        await redisUserAnswerFeedback.setAnswerFeedBackByStudentNew(student_id, answer_id, answer_video, feedback, db.redis.write);
                    }
                    return resolve(feedback);
                }
                feedback = await mysqlUserAnswerFeedback.getAnswerFeedBackByStudentNew(student_id, answer_id, answer_video, db.mysql.read);
                return resolve(feedback);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getAnswerFeedBackByStudentMulti(questionIdArray, student_id, db) {
        return new Promise(async (resolve, reject) => {
            try {
                const resolvedPromise = await redisUserAnswerFeedback.getAnswerFeedBackByStudentMulti(questionIdArray, student_id, db.redis.read);
                // console.log("feed")
                // console.log(resolvedPromise)
                for (let i = 0; i < questionIdArray.length; i++) {
                    if (_.isNull(resolvedPromise[i])) {
                        // get from mysql
                        const feedback = await mysqlUserAnswerFeedback.getAnswerFeedBackByStudent(student_id, questionIdArray[i].answer_id, db.mysql.read);
                        // console.log("feedback")
                        // console.log(feedback)
                        questionIdArray[i]._source.isLiked = false;
                        if (feedback.length > 0) {
                            if (feedback[0].rating > 3) {
                                questionIdArray[i]._source.isLiked = true;
                            }
                            await redisUserAnswerFeedback.setAnswerFeedBackByStudent(student_id, questionIdArray[i].answer_id, feedback, db.redis.write);
                        }
                    } else if (!_.isEmpty(resolvedPromise[i][1])) {
                        resolvedPromise[i] = JSON.parse(resolvedPromise[i][1]);
                        // console.log(resolvedPromise[i])
                        // console.log(resolvedPromise[i][0])
                        // console.log(resolvedPromise[i][0]['rating'])
                        if (resolvedPromise[i].length > 0 && resolvedPromise[i][0].rating > 3) {
                            questionIdArray[i]._source.isLiked = true;
                        } else {
                            questionIdArray[i]._source.isLiked = false;
                        }
                    } else {
                        questionIdArray[i]._source.isLiked = false;
                    }
                }
                return resolve(questionIdArray);
            } catch (e) {
                return reject(e);
            }
        });
    }

    static async getAnswerFeedBackByStudentMultiNew(questionIdArray, student_id, db) {
        return new Promise(async (resolve, reject) => {
            try {
                const resolvedPromise = await redisUserAnswerFeedback.getAnswerFeedBackByStudentMultiNew(questionIdArray, student_id, db.redis.read);
                // console.log("feed")
                // console.log(resolvedPromise)
                for (let i = 0; i < questionIdArray.length; i++) {
                    if (_.isNull(resolvedPromise[i])) {
                        // get from mysql
                        const feedback = await mysqlUserAnswerFeedback.getAnswerFeedBackByStudentNew(student_id, questionIdArray[i].answer_id, questionIdArray[i].answer_video, db.mysql.read);
                        // console.log("feedback")
                        // console.log(feedback)
                        questionIdArray[i]._source.isLiked = false;
                        if (feedback.length > 0) {
                            if (feedback[0].rating > 3) {
                                questionIdArray[i]._source.isLiked = true;
                            }
                            await redisUserAnswerFeedback.setAnswerFeedBackByStudentNew(student_id, questionIdArray[i].answer_id, questionIdArray[i].answer_video, feedback, db.redis.write);
                        }
                    } else {
                        resolvedPromise[i] = JSON.parse(resolvedPromise[i]);
                        // console.log(resolvedPromise[i])
                        // console.log(resolvedPromise[i][0])
                        // console.log(resolvedPromise[i][0]['rating'])
                        if (resolvedPromise[i].length > 0 && resolvedPromise[i][0].rating > 3) {
                            questionIdArray[i]._source.isLiked = true;
                        } else {
                            questionIdArray[i]._source.isLiked = false;
                        }
                    }
                }
                return resolve(questionIdArray);
            } catch (e) {
                return reject(e);
            }
        });
    }
};
