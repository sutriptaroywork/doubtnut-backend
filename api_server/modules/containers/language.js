const _ = require('lodash');

const config = require('../../config/config');
const mysql = require('../mysql/language');
const redis = require('../redis/language');
const nodeCache = require('../dn-cache/language');

module.exports = class Language {
    static async getList(db) {
        try {
            let answer;
            if (config.caching) {
                answer = nodeCache.mgetall();
                if (answer.filter(Boolean).length) {
                    return answer;
                }
                answer = await redis.getList(db.redis.read);
                if (!_.isNull(answer)) {
                    answer = JSON.parse(answer);
                    nodeCache.mset(answer, 'code');
                    return answer;
                }
                answer = await mysql.getList(db.mysql.read);
                if (answer.length > 0) {
                    redis.setList(answer, db.redis.write);
                }
                return answer;
            }
            answer = await mysql.getList(db.mysql.read);
            return answer;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async getByCode(code, db) {
        try {
            let answer;
            if (config.caching) {
                answer = nodeCache.get(code);
                if (answer) {
                    return [answer];
                }
                answer = await redis.getByCode(code, db.redis.read);
                if (!_.isNull(answer)) {
                    answer = JSON.parse(answer);
                    // nodeCache.set(code, answer[0]);
                    return answer;
                }
                answer = await mysql.getByCode(code, db.mysql.read);
                if (answer.length > 0) {
                    redis.setByCode(code, answer, db.redis.write);
                }
                return answer;
            }
            answer = await mysql.getByCode(code, db.mysql.read);
            return answer;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getLanguageByCode(db, code) {
        try {
            if (!config.caching) {
                return mysql.getLanguageByCode(db.mysql.read, code);
            }
            let data = nodeCache.get(code);
            if (data) {
                return [data];
            }
            data = await redis.getLanguageByCode(db.redis.read, code);
            if (!_.isNull(data)) {
                data = JSON.parse(data);
                nodeCache.set(code, data[0]);
                return data;
            }
            data = await mysql.getLanguageByCode(db.mysql.read, code);
            if (data.length) {
                redis.setLanguageByCode(db.redis.write, code, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }
};
