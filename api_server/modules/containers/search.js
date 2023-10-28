const _ = require('lodash');
const mysql = require('../mysql/search');
const redis = require('../redis/search');
const config = require('../../config/config');

module.exports = class Search {
    static async getSugg(student_class, limit, language, db) {
        try {
            let data;
            if (0) {
                // fetch from redis and return
                data = await redis.getSugg(student_class, limit, language, db.redis.read);
                if (!_.isNull(data)) return JSON.parse(data);

                // fetch from mysql and set in redis and return
                data = await mysql.getSugg(student_class, limit, language, db.mysql.read);
                if (data.length) redis.setSugg(student_class, limit, language, data, db.redis.write);
                return data;
            }
            // fetch from mysql and return
            data = await mysql.getSugg(student_class, limit, language, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getIasTopTags(db, sClass) {
        // first try to get from redis
        try {
            let iasTopTagData;
            if (config.caching) {
                iasTopTagData = await redis.getIasTopTags(db.redis.read, sClass);
                if (!_.isNull(iasTopTagData)) {
                    return JSON.parse(iasTopTagData);
                }
                // get from mysql
                iasTopTagData = await mysql.getIasTopTags(db.mysql.read, sClass);
                if (iasTopTagData.length > 0) {
                    // set in redis
                    redis.setIasTopTags(db.redis.write, sClass, iasTopTagData);
                }
                return iasTopTagData;
            }
            iasTopTagData = await mysql.getIasTopTags(db.mysql.read, sClass);
            return iasTopTagData;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getPopularPlaylist(db, sClass, locale, flag, isFreeApp = false) {
        // first try to get from redis
        try {
            let iasPopularOnDoubtnutData;
            if (config.caching) {
                iasPopularOnDoubtnutData = await redis.getIasPopularOnDoubtnut(db.redis.read, sClass, locale, flag, isFreeApp);
                if (!_.isNull(iasPopularOnDoubtnutData)) {
                    return JSON.parse(iasPopularOnDoubtnutData);
                }
                // get from mysql
                iasPopularOnDoubtnutData = await mysql.getIasPopularOnDoubtnut(db.mysql.read, sClass, locale, flag, isFreeApp);
                if (iasPopularOnDoubtnutData.length) {
                    // set in redis
                    redis.setIasPopularOnDoubtnut(db.redis.write, sClass, iasPopularOnDoubtnutData, locale, flag, isFreeApp);
                }
                return iasPopularOnDoubtnutData;
            }
            iasPopularOnDoubtnutData = await mysql.getIasPopularOnDoubtnut(db.mysql.read, sClass, locale, flag, isFreeApp);
            return iasPopularOnDoubtnutData;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getIasTopBooks(db, sClass) {
        // first try to get from redis
        try {
            let iasTopBooksData;
            if (config.caching) {
                iasTopBooksData = await redis.getIasTopBooks(db.redis.read, sClass);
                if (!_.isNull(iasTopBooksData)) {
                    return JSON.parse(iasTopBooksData);
                }
                // get from mysql
                iasTopBooksData = await mysql.getIasTopBooks(db.mysql.read, sClass);
                if (iasTopBooksData.length) {
                    // set in redis
                    redis.setIasTopBooks(db.redis.write, sClass, iasTopBooksData);
                }
                return iasTopBooksData;
            }
            iasTopBooksData = await mysql.getIasTopBooks(db.mysql.read, sClass);
            return iasTopBooksData;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getIasTopExams(db, sClass) {
        // first try to get from redis
        try {
            let iasTopExamsData;
            if (config.caching) {
                iasTopExamsData = await redis.getIasTopExams(db.redis.read, sClass);
                if (!_.isNull(iasTopExamsData)) {
                    return JSON.parse(iasTopExamsData);
                }
                // get from mysql
                iasTopExamsData = await mysql.getIasTopExams(db.mysql.read, sClass);
                if (iasTopExamsData.length) {
                    // set in redis
                    redis.setIasTopExams(db.redis.write, sClass, iasTopExamsData);
                }
                return iasTopExamsData;
            }
            iasTopExamsData = await mysql.getIasTopExams(db.mysql.read, sClass);
            return iasTopExamsData;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getIasTopCourse(db, sClass) {
        // first try to get from redis
        try {
            let iasTopCourseData;
            if (config.caching) {
                iasTopCourseData = await redis.getIasTopCourse(db.redis.read, sClass);
                if (!_.isNull(iasTopCourseData)) {
                    return JSON.parse(iasTopCourseData);
                }
                // get from mysql
                iasTopCourseData = await mysql.getIasTopCourse(db.mysql.read, sClass);
                if (iasTopCourseData.length) {
                    // set in redis
                    redis.setIasTopCourse(db.redis.write, sClass, iasTopCourseData);
                }
                return iasTopCourseData;
            }
            iasTopCourseData = await mysql.getIasTopCourse(db.mysql.read, sClass);
            return iasTopCourseData;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getTrendingPlaylist(db, studentClass, limit, flag) {
        try {
            let data;
            if (config.caching) {
                // fetch from redis and return
                data = await redis.getTrendingplaylist(db.redis.read, studentClass, limit, flag);
                // console.log('redis', data);
                if (!_.isNull(data)) return JSON.parse(data);

                // fetch from mysql and set in redis and return
                data = await mysql.getTrendingPlaylist(db.mysql.read, studentClass, limit, flag);
                // console.log('sql', data);
                if (data.length) redis.setTrendingplaylist(db.redis.write, studentClass, limit, data, flag);
                return data;
            }
            // fetch from mysql and return
            data = await mysql.getTrendingPlaylist(db.mysql.read, studentClass, limit, flag);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getRecentWatchedVideo(db, studentClass, flag, locale) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getRecentWatchedVideo(db.redis.read, studentClass, flag, locale);
                if (!_.isNull(data)) return JSON.parse(data);

                data = await mysql.getRecentWatchedVideo(db.mysql.read, studentClass, flag, locale);
                if (data.length) redis.setRecentWatchedVideo(db.redis.write, studentClass, flag, locale, data);
                return data;
            }
            return mysql.getRecentWatchedVideo(db.mysql.read, studentClass, flag, locale);
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }
};
