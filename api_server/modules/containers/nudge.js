const _ = require('lodash');
const config = require('../../config/config');

const mysql = require('../mysql/nudge');
const redis = require('../redis/nudge');

module.exports = class Nudge {
    static async getInAppPopUpData(db, page, studentClass, versionCode) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getInAppPopUpData(db.redis.read, page, studentClass, versionCode);
                if (!_.isNull(data)) return JSON.parse(data);

                data = await mysql.getInAppPopUpData(db.mysql.read, page, studentClass, versionCode);
                if (data.length) redis.setInAppPopUpData(db.redis.write, page, studentClass, versionCode, data);
                return data;
            }
            return mysql.getInAppPopUpData(db.mysql.read, page, studentClass, versionCode);
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getInAppPopUpDnPropertyData(db, bucket, name) {
        try {
            let data;
            const redisKey = `INAPP_ALL_POPUP_OVERALL:${name}`;
            if (config.caching) {
                data = await redis.getInAppPopUpPropertyData(db.redis.read, redisKey);
                if (!_.isNull(data)) return JSON.parse(data);

                data = await mysql.getInAppPopUpDnPropertyData(db.mysql.read, bucket, name);
                if (data.length) redis.setInAppPopUpPropertyData(db.redis.write, redisKey, data, 60 * 60 * 24);
                return data;
            }
            return mysql.getInAppPopUpDnPropertyData(db.mysql.read, bucket, name);
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }
};
