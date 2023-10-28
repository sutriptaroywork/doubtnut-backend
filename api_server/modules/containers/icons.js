const _ = require('lodash');
const md5 = require('md5');

const config = require('../../config/config');
const mysql = require('../mysql/icons');
const redis = require('../redis/icons');

module.exports = class Icons {
    static async geticonsByIconOrder(db, student_class) {
        // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getIconData(db.redis.read, student_class);
                    // data=null
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getIconData(db.mysql.read, student_class);
                    // console.log("mysql data")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setIconData(db.redis.write, data, student_class);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getIconData(db.mysql.read, student_class);
                // console.log("mysql data")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async geticonsByIconOrderByClass(db, student_class, app_version) {
        // first try to get from redis
        // add app_version params when you apply caching in redis,and mysql calling function
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getIconDataByClass(db.redis.read, student_class);
                    // data=null
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getIconDataByClass(db.mysql.read, student_class);
                    // console.log("mysql data")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.getIconDataByClass(db.redis.write, data, student_class);
                    }
                    return resolve(data);
                }
                // console.log(" not exist")
                data = await mysql.getIconDataByClass(db.mysql.read, student_class, app_version);
                // console.log("mysql data")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async checkForTGOfDoubtnutCEOIcon(db, studentId) {
        let data;
        if (config.caching) {
            data = await redis.getcheckForDoubtnutCeoDisplay(db.redis.read, studentId);
            if (!_.isNull(data)) {
                return data;
            }
        }
        data = await mysql.getCheckForDoubtnutCeo(db.mysql.read, studentId);
        await redis.setcheckForDoubtnutCeoDisplay(db.redis.write, studentId, data.length > 0);
        return data.length > 0;
    }


    static async getDnCeoIcon(db, versionCode) {
        let data;
        if (config.caching) {
            data = await redis.getDnCeoIcon(db.redis.read, versionCode);
            if (!_.isNull(data)) {
                data = JSON.parse(data);
            }
        }
        data = await mysql.getDnCeoIcon(db.mysql.read, versionCode);
        if (!_.isNull(data)) {
            redis.setDnCeoIcon(db.redis.write, versionCode, data);
        }

        return data;
    }

    static async getIconsByCategory(db, studentClass, locale, screen, versionCode, flagrVariationIds, studentCourseOrClassSubcriptionDetails) {
        if (locale !== 'en' && locale !== 'hi') {
            locale = 'other';
        }

        const cacheKey = md5(JSON.stringify({
            student_class: studentClass, locale, screen, versionCode, flagrVariationIds, studentCourseOrClassSubcriptionDetails,
        }));
        let data = await redis.getIconListByCategories(db.redis.read, cacheKey);
        if (!_.isNull(data)) {
            data = JSON.parse(data);
        } else {
            data = await mysql.getIcons(db.mysql.read, studentClass, locale, screen, versionCode, flagrVariationIds);
            if (!_.isNull(data)) {
                redis.setIconListByCategories(db.redis.write, cacheKey, data);
            }
        }
        return data;
    }
};
