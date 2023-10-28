const _ = require('lodash');
const config = require('../../config/config');

// let Utility = require('./utility');
// let _ = require('./utility');
const mysqlPlaylist = require('../mysql/playlist');
const redisPlaylist = require('../redis/playlist');

module.exports = class Playlist {
    constructor() {
    }

    static async getPlaylistCheck(question_id, student_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let playlist_check;
                if (config.caching) {
                    playlist_check = await redisPlaylist.getPlaylistCheck(question_id, student_id, db.redis.read);
                    console.log('redis check');
                    console.log(playlist_check);
                    if (!_.isNull(playlist_check)) {
                        console.log('exist');
                        return resolve(JSON.parse(playlist_check));
                    }
                    // get from mysql
                    console.log(' not exist');
                    playlist_check = await mysqlPlaylist.getPlaylistCheck(question_id, student_id, db.mysql.read);
                    console.log('mysql playlist_check');
                    console.log(playlist_check);
                    if (playlist_check.length > 0) {
                        // set in redis
                        await redisPlaylist.setPlaylistCheck(question_id, student_id, playlist_check, db.redis.write);
                    }
                    return resolve(playlist_check);
                }
                console.log('not exist');
                playlist_check = await mysqlPlaylist.getPlaylistCheck(question_id, student_id, db.mysql.read);
                console.log('mysql playlist_check');
                console.log(playlist_check);
                // set in redis
                return resolve(playlist_check);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getDpp(student_id, page_no, limit, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redisPlaylist.getDpp(student_id, page_no, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getDpp(student_id, page_no, limit, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setDpp(student_id, page_no, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getDpp(student_id, page_no, limit, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getDppWithLanguage(student_id, language, page_no, limit, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redisPlaylist.getDppWithLanguage(student_id, language, page_no, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getDppWithLanguage(student_id, language, page_no, limit, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setDppWithLanguage(student_id, language, page_no, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getDppWithLanguage(student_id, language, page_no, limit, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    // sudhir
    static async getCrashCoursePlaylist(student_class, page_no, limit, language, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redisPlaylist.getCrashCoursePlaylist(student_class, language, page_no, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getCrashCoursePlaylist(student_class, language, page_no, limit, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setCrashCoursePlaylist(student_class, language, page_no, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getCrashCoursePlaylist(student_class, language, page_no, limit, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getLatestFromDoubtnutPlaylist(student_class, page_no, limit, language, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redisPlaylist.getLatestFromDoubtnutPlaylist(student_class, language, page_no, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getLatestFromDoubtnutPlaylist(student_class, language, page_no, limit, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setLatestFromDoubtnutPlaylist(student_class, language, page_no, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getLatestFromDoubtnutPlaylist(student_class, language, page_no, limit, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getGeneralKnowledgePlaylist(student_class, page_no, limit, language, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redisPlaylist.getGeneralKnowledgePlaylist(student_class, language, page_no, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getGeneralKnowledgePlaylist(student_class, language, page_no, limit, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setGeneralKnowledgePlaylist(student_class, language, page_no, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getGeneralKnowledgePlaylist(student_class, language, page_no, limit, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    // sudhir end here
    static async getDppSimilar(student_id, limit, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redisPlaylist.getDpp(student_id, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getDpp(student_id, page_no, limit, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setDpp(student_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getDppSimilar(student_id, limit, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getCrashCourseSimilar(student_id, limit, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redisPlaylist.getCrashCourse(student_id, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getCrashCourse(student_id, limit, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setCrashCourse(student_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getCrashCourse(student_id, limit, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getPlaylistByPlaylistIdList(student_id, playlist_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redisPlaylist.getPlaylistByPlaylistIdList(student_id, playlist_id, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getPlaylistByPlaylistIdList(student_id, playlist_id, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setPlaylistByPlaylistIdList(student_id, playlist_id, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getPlaylistByPlaylistIdList(student_id, playlist_id, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getTrendingVideosNew(student_class, limit, language, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redisPlaylist.getTrendingVideosNew(student_class, language, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getTrendingVideosNew(student_class, limit, language, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setTrendingVideosNew(student_class, language, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getTrendingVideosNew(student_class, limit, language, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getNCERTData(type1, gradient, type, description, page, capsule, student_class, limit, language, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redisPlaylist.getNCERTDataType(type1, student_class, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getNCERTDataType(gradient, type, description, page, capsule, student_class, limit, language, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setNCERTDataType(type1, student_class, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getNCERTDataType(gradient, type, description, page, capsule, student_class, limit, language, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getNCERTDataNewLibrary(type1, gradient, type, description, page, capsule, student_class, limit, language, mapped_playlist_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redisPlaylist.getNCERTDataNewLibrary(type1, student_class, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getNCERTDataNewLibrary(gradient, type, description, page, capsule, student_class, limit, language, mapped_playlist_id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setNCERTDataNewLibrary(type1, student_class, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getNCERTDataNewLibrary(gradient, type, description, page, capsule, student_class, limit, language, mapped_playlist_id, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }

    static async getNCERTDataNewLibraryWithPCM(type1, gradient, type, description, page, capsule, student_class, limit, language, mapped_playlist_id, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redisPlaylist.getNCERTDataNewLibraryWithPCM(type1, student_class, db.redis.read);
                    // console.log("redis answer")
                    // console.log(data)
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlPlaylist.getNCERTDataNewLibraryWithPCM(gradient, type, description, page, capsule, student_class, limit, language, mapped_playlist_id, db.mysql.read);
                    // console.log("mysql answer")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redisPlaylist.setNCERTDataNewLibraryWithPCM(type1, student_class, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlPlaylist.getNCERTDataNewLibraryWithPCM(gradient, type, description, page, capsule, student_class, limit, language, mapped_playlist_id, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);

                reject(e);
            }
        });
    }
};
