const _ = require('lodash');
const mysql = require('../mysql/gamification');
const redis = require('../redis/gamification');
const config = require('../../config/config');

module.exports = class Search {
    static async getUserData(db, studentId) {
        try {
            if (!config.caching) {
                return mysql.getGamificationUserMeta(db.mysql.read, studentId);
            }
            let data = await redis.getUserData(db.redis.read, studentId);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysql.getGamificationUserMeta(db.mysql.read, studentId);
            if (data.length) {
                redis.setUserData(db.redis.write, studentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }
};
