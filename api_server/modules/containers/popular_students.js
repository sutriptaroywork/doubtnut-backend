const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/user_connections');
const redis = require('../redis/popular_students');


module.exports = class PopularStudents {
    static async getPopularStudents(student_id, db) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getPopularStudents(db.redis.read, student_id);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    // data = await mysql.getPopularStudents(db.mysql.read, student_id);
                    if (data.length) {
                        redis.setPopularStudents(db.redis.write, student_id, data);
                    }
                    return resolve(data);
                }
                // data = await mysql.getPopularStudents(db.mysql.read, student_id);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }
    static async updatePopularStudents(student_id, data, db) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                if (config.caching) {
                  redis.setPopularStudents(db.redis.write, student_id, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }
};
