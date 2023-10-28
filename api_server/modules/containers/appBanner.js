const _ = require('lodash');
const config = require('../../config/config');
// let Utility = require('./utility');
// let _ = require('./utility');
const mysql = require('../mysql/appBanner');
const redis = require('../redis/appBanner');

module.exports = class Question {
    constructor() {
    }

    static async getAppBanner1xData(type1, scroll_size, type, button, subtitle, description, limit, student_class, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching && config.overide_caching) {
                    data = await redis.getAppBanner1xDataType(type1, scroll_size, student_class, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getAppBanner1xDataType(student_class, type, button, subtitle, description, limit, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setAppBanner1xDataType(type1, scroll_size, student_class, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getAppBanner1xDataType(student_class, type, button, subtitle, description, limit, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getAppBanner1xDataNew(type1, scroll_size, type, button, subtitle, description, limit, student_class, version_code, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getAppBanner1xDataTypeNew(type1, scroll_size, student_class, version_code, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getAppBanner1xDataTypeNew(student_class, type, button, subtitle, description, limit, version_code, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setAppBanner1xDataTypeNew(type1, scroll_size, student_class, version_code, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getAppBanner1xDataTypeNew(student_class, type, button, subtitle, description, limit, version_code, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getAppBanner1xDataTypeWithFlag(db, type1, scrollSize, type, button, subtitle, description, limit, studentClass, versionCode, flagrVariants) {
        // first try to get from redis
        try {
            let data;
            if (config.caching) {
                data = await redis.getAppBanner1xDataTypeWithFlag(db.redis.read, type1, scrollSize, studentClass, versionCode, flagrVariants);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getAppBanner1xDataTypeWithFlag(db.mysql.read, studentClass, type, button, subtitle, description, limit, versionCode, flagrVariants);
            if (data.length) {
                await redis.setAppBanner1xDataTypeWithFlag(db.redis.write, type1, scrollSize, studentClass, versionCode, flagrVariants, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAppBanner15xData(type1, scroll_size, type, button, subtitle, description, limit, student_class, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getAppBanner15xDataType(type1, scroll_size, student_class, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getAppBanner15xDataType(student_class, type, button, subtitle, description, limit, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setAppBanner15xDataType(type1, scroll_size, student_class, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getAppBanner15xDataType(student_class, type, button, subtitle, description, limit, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getAppBanner25xData(type1, scroll_size, type, button, subtitle, description, limit, student_class, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getAppBanner25xDataType(type1, scroll_size, student_class, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getAppBanner25xDataType(type, button, subtitle, description, limit, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setAppBanner25xDataType(type1, scroll_size, student_class, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getAppBanner25xDataType(type, button, subtitle, description, limit, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getPromotionalData(db, student_class, page, version_code) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data; const limit = 5;
                if (config.caching) {
                    data = await redis.getPromotionalData(db.redis.read, student_class, page, version_code, limit);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getPromotionalData(db.mysql.read, student_class, page, version_code, limit);

                    if (data.length > 0) {
                        await redis.setPromotionalData(db.redis.write, data, student_class, page, version_code, limit);
                    }
                    return resolve(data);
                }
                data = await mysql.getPromotionalData(db.mysql.read, student_class, page, version_code, limit);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }
};
