const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/class');
const redis = require('../redis/class');

module.exports = class Class {
    static async getList(language, db) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getList(language, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getList(language, db.mysql.read);
                    if (data.length) {
                        await redis.setList(language, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getList(language, db.mysql.read);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getListNew(language, appCountry, db) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getListNew(language, appCountry, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getListNew(language, appCountry, db.mysql.read);
                    if (data.length) {
                        await redis.setListNew(language, appCountry, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getListNew(language, appCountry, db.mysql.read);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getClassListNewOnBoarding(db, language) {
        try {
            if (!config.caching) {
                return mysql.getClassListNewOnBoarding(db.mysql.read, language);
            }
            let data = await redis.getClassListNewOnBoarding(db.redis.read, language);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysql.getClassListNewOnBoarding(db.mysql.read, language);
            if (data.length) {
                redis.setClassListNewOnBoarding(db.redis.write, language, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getClassListNewOnBoardingForHome(db, language, appCountry) {
        try {
            if (!config.caching) {
                return mysql.getClassListNewOnBoardingForHome(db.mysql.read, language, appCountry);
            }
            let data = await redis.getClassListNewOnBoardingForHome(db.redis.read, language, appCountry);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysql.getClassListNewOnBoardingForHome(db.mysql.read, language, appCountry);
            if (data.length) {
                redis.setClassListNewOnBoardingForHome(db.redis.write, language, data, appCountry);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }
};
