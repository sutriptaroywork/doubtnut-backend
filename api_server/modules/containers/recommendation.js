const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/recommendation');
const redis = require('../redis/recommendation');
const liveclassData = require('../../data/liveclass.data');

module.exports = class Recommendation {
    static async getRecommendedCourseByCCM(db) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getRecommendedCourseByCCM(db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getRecommendedCourseByCCM(db.mysql.read);
                if (data && data.length > 0) {
                    data = _.groupBy(data, 'ccm_id2');

                    // set in redis
                    await redis.setRecommendedCourseByCCM(db.redis.write, data);
                    return data;
                }
                return [];
            }
            data = await mysql.getRecommendedCourseByCCM(db.mysql.read);
            if (data && data.length > 0) {
                data = _.groupBy(data, 'ccm_id2');
                // mysql class
                return data;
            }
            return [];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getRecommendedCourseByCCMValues(db, ccmArray, studentClass, courseArray) {
        try {
            if (!ccmArray.length) {
                return [];
            }
            let data;
            ccmArray.sort();
            const ccmArrayString = ccmArray.join();
            if (config.caching) {
                data = await redis.getRecommendedCourseByCCMValues(db.redis.read, ccmArrayString);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getRecommendedCourseByCCMValues(db.mysql.read, courseArray, studentClass);
                if (data && data.length > 0) {
                    // set in redis
                    await redis.setRecommendedCourseByCCMValues(db.redis.write, data, ccmArrayString);
                    return data;
                }
                return [];
            }
            data = await mysql.getRecommendedCourseByCCMValues(db.mysql.read, ccmArray);
            if (data && data.length > 0) {
                // mysql class
                return data;
            }
            return [];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }
};