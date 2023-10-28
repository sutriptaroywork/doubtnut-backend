const _ = require('lodash');
const config = require('../../config/config');
// let Utility = require('./utility');
// let _ = require('./utility');
const mysql = require('../mysql/quiz');
const redis = require('../redis/quiz');
// const redisAnswer = require("../qu/answer")
module.exports = class Student {
    static async getQuizDetails(class1, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getQuizDetails(class1, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getQuizDetails(class1, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setQuizDetails(class1, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getQuizDetails(class1, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    // Saayon added___________________________________________________________________________
    static async getQuizDetailsById(id, db) {
    // first try from redis
        return new Promise(async (resolve, reject) => {
            // do async job
            try {
                let data;
                if (0) {
                    data = await redis.getQuizDetailsById(id, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getQuizDetailsById(id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setQuizDetailsById(id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getQuizDetailsById(id, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }
    // ______________________________________________________________________________

    static async getQuizQuestionsById(quiz_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getQuizQuestionsById(quiz_id, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getQuizQuestionsById(quiz_id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setQuizQuestionsById(quiz_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getQuizQuestionsById(quiz_id, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getQuizQuestionsOption(quiz_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getQuizQuestionsOption(quiz_id, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getQuizQuestionsOption(quiz_id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setQuizQuestionsOption(quiz_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getQuizQuestionsOption(quiz_id, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getQuizQuestionsOptionWithResult(quiz_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getQuizQuestionsOptionWithResult(quiz_id, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getQuizQuestionsOptionWithResult(quiz_id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setQuizQuestionsOptionWithResult(quiz_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getQuizQuestionsOptionWithResult(quiz_id, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async checkQuestionAnswer(quiz_id, question_id, option_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.checkQuestionAnswer(quiz_id, question_id, option_id, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.checkQuestionAnswer(quiz_id, question_id, option_id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setCheckQuestionAnswer(quiz_id, question_id, option_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.checkQuestionAnswer(quiz_id, question_id, option_id, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getQuiznQuestion(quiz_id, question_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getQuiznQuestion(quiz_id, question_id, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getQuiznQuestion(quiz_id, question_id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setQuiznQuestion(quiz_id, question_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getQuiznQuestion(quiz_id, question_id, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getQuizQuestionsOptionWithCorrect(quiz_id, question_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getQuizQuestionsOptionWithCorrect(quiz_id, question_id, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getQuizQuestionsOptionWithCorrect(quiz_id, question_id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setQuizQuestionsOptionWithCorrect(quiz_id, question_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getQuizQuestionsOptionWithCorrect(quiz_id, question_id, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getQuizRulesById(quiz_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getQuizRulesById(quiz_id, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getQuizRulesById(quiz_id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setQuizRulesById(quiz_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getQuizRulesById(quiz_id, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    // static async getDailyQuizData(type,button_text,button_bg_color,button_text_color, student_class, limit,db) {
    //   //first try to get from redis
    //   return new Promise(async function (resolve, reject) {
    //     // Do async job
    //     try {
    //       let data
    //       if (0) {
    //         data = await redis.getDailyQuizDataType(student_class, db.redis.read)
    //         // console.log("redis answer")
    //         // console.log(data)
    //         if (!_.isNull(data)) {
    //           console.log("exist")
    //           return resolve(JSON.parse(data))
    //         } else {
    //           //get from mysql
    //           console.log(" not exist")
    //           data = await mysql.getDailyQuizDataType(type,button_text,button_bg_color,button_text_color,student_class, limit,db.mysql.read)
    //           // console.log("mysql answer")
    //           // console.log(data)
    //           if (data.length > 0) {
    //             //set in redis
    //             await redis.setDailyQuizDataType(student_class, data, db.redis.write)
    //           }
    //           return resolve(data)
    //         }
    //       } else {
    //         console.log(" not exist")
    //         data = await mysql.getDailyQuizDataType(type,button_text,button_bg_color,button_text_color,student_class, limit,db.mysql.read)
    //         // console.log("mysql answer")
    //         // console.log(data)
    //         return resolve(data)
    //      }
    //     } catch (e) {
    //       console.log(e)
    //       reject(e)
    //     }
    //   })
    // }
};
