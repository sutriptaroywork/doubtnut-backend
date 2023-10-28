const _ = require('lodash');
const config = require('../../config/config');
const Utility = require('../utility');
// let _ = require('./utility');
const mysql = require('../mysql/testseries');
const redis = require('../redis/testseries');

module.exports = class TestSeries {
    constructor() {
    }

    static async getDailyQuizData(type, student_class, limit, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getDailyQuizDataType(type, student_class, db.redis.read);
                    console.log('redis data');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDailyQuizDataType(student_class, limit, db.mysql.read);
                    console.log('mysql data');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDailyQuizDataType(type, student_class, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDailyQuizDataType(student_class, limit, db.mysql.read);
                // console.log("mysql data")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }
};
