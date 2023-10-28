const _ = require('lodash');
const config = require('../../config/config');
const redis = require('../redis/quizNotification');
const mysql = require('../mysql/quiz_notifications.js');
module.exports = class Student {
    static async getNotificationData(db, ccmIds, featureId) {
        try {
            let data;
            ccmIds.push(0); // default ccmId case
            if (config.caching) {
                for (let i = 0; i < ccmIds.length; i++) {
                    data = await redis.getNotificationData(ccmIds[i], featureId, db.redis.read);
                    if (!_.isNull(data)) {
                        // console.log('exist');
                        return JSON.parse(data);
                    }
                }
            }
            return null;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getNotificationDefaultData(db, currentDay) {
        try {
            let data = await redis.getNotificationDefaultData(db.redis.read, currentDay);
            if (!_.isNull(data)) {
                data = JSON.parse(data);
                return data;
            }
            data = await redis.getNotificationDefaultFinalData(db.redis.read);
            if (!_.isNull(data)) {
                data = JSON.parse(data);
                return data[currentDay % 2];
            }
            return null;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }
};
