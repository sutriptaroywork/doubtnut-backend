const schedulerMysql = require('../mysql/scheduler');
const config = require('../../config/config');
const schedulerRedis = require('../redis/scheduler');

module.exports = class Scheduler {
    static async checkQid(db, questionId) {
        let data;
        if (config.caching) {
            data = await schedulerRedis.getQidCheck(db.redis.read, questionId);
            if (data) {
                return JSON.parse(data);
            }
        }
        data = await schedulerMysql.checkQid(db.mysql.read, questionId);
        if (config.caching) {
            schedulerRedis.setQidCheck(db.redis.write, questionId, data);
        }
        return data;
    }
};
