const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/library');
const redis = require('../redis/library');
const Utility = require('../utility');

module.exports = class Library {
    static async getPlaylistHomepage(playlist_id, type1, gradient, type, page, capsule_bg_color, capsule_text_color, limit, student_class, duration_text_color, duration_bg_color, db) {
    // first try to get from redis
        // return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            let data;
            if (config.caching && config.overide_caching) {
                // if(0){
                data = await redis.getPlaylistHomepagePCM(type1, student_class, db.redis.read);
                // console.log("redis answer")
                // console.log(data)
                if (!_.isNull(data)) {
                    console.log('exist');
                    // return resolve(JSON.parse(data));
                    return JSON.parse(data);
                }
                // get from mysql
                console.log(' not exist');
                data = await mysql.getPlaylistHomepage(playlist_id, gradient, type, page, capsule_bg_color, capsule_text_color, student_class, limit, duration_text_color, duration_bg_color, db.mysql.read);
                // console.log("mysql answer")
                // console.log(data)
                if (data.length > 0) {
                    // set in redis
                    await redis.setPlaylistHomepagePCM(type1, student_class, data, db.redis.write);
                }
                // return resolve(data);
                return data;
            }
            console.log('Not exist');
            data = await mysql.getPlaylistHomepage(playlist_id, gradient, type, page, capsule_bg_color, capsule_text_color, student_class, limit, duration_text_color, duration_bg_color, db.mysql.read);
            return data;
            // return resolve(data);
        } catch (e) {
            console.log(e);

            // reject(e);
        }
        // }));
    }

    static async getLocalisedPlaylistHomepage(locale, playlist_id, type1, gradient, type, page, capsule_bg_color, capsule_text_color, limit, student_class, duration_text_color, duration_bg_color, db) {
    // first try to get from redis
        // return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            let data;
            if (config.caching && config.overide_caching) {
                console.log('type1 ------------- type 1 ---------------');
                console.log(type1);
                // if(0){
                data = await redis.getLocalisedPlaylistHomepagePCM(playlist_id, locale, type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    // return resolve(JSON.parse(data));
                    return JSON.parse(data);
                }
                data = await mysql.getPlaylistHomepage(playlist_id, gradient, type, page, capsule_bg_color, capsule_text_color, student_class, limit, duration_text_color, duration_bg_color, db.mysql.read);
                const translatedData = await Utility.translateMyLibraryData(db.mysql.read, 'new_library', data, locale);

                if (translatedData.length > 0) {
                    await redis.setLocalisedPlaylistHomepagePCM(playlist_id, locale, type1, student_class, translatedData, db.redis.write);
                } else {
                    await redis.setLocalisedPlaylistHomepagePCM(playlist_id, 'en', type1, student_class, data, db.redis.write);
                }
                // return resolve(translatedData);
                return translatedData;
            }
            data = await mysql.getPlaylistHomepage(playlist_id, gradient, type, page, capsule_bg_color, capsule_text_color, student_class, limit, duration_text_color, duration_bg_color, db.mysql.read);
            // console.log(data);
            const translatedData = await Utility.translateMyLibraryData(db.mysql.read, 'new_library', data, locale);
            // return resolve(translatedData);
            return translatedData;
        } catch (e) {
            console.log(e);
            // reject(e);
        }
        // }));
    }

    static async getParentPlaylistHomepage(locale, playlist_id, type1, gradient, type, page, capsule_bg_color, capsule_text_color, limit, student_class, duration_text_color, duration_bg_color, db) {
        // return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            let data;
            if (config.caching && config.overide_caching) {
                console.log('type1 ------------- type 1 ---------------');
                console.log(type1);
                // if(0){
                data = await redis.getParentPlaylistHomepagePCM(playlist_id, locale, type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    console.log('exist');
                    // return resolve(JSON.parse(data));
                    return JSON.parse(data);
                }
                // get from mysql
                console.log(' not exist');
                data = await mysql.getParentPlaylistHomepage(locale, playlist_id, gradient, type, page, capsule_bg_color, capsule_text_color, student_class, limit, duration_text_color, duration_bg_color, db.mysql.read);
                if (type === 'topic_parent') {
                    data = data.map((item) => ({ ...item, type: 'topic' }));
                }
                const translatedData = await Utility.translateMyLibraryData(db.mysql.read, 'new_library', data, locale);
                if (translatedData.length > 0) {
                    await redis.setParentPlaylistHomepagePCM(playlist_id, locale, type1, student_class, translatedData, db.redis.write);
                } else {
                    await redis.setParentPlaylistHomepagePCM(playlist_id, 'en', type1, student_class, data, db.redis.write);
                }
                // return resolve(translatedData);
                return translatedData;
            }
            data = await mysql.getParentPlaylistHomepage(locale, playlist_id, gradient, type, page, capsule_bg_color, capsule_text_color, student_class, limit, duration_text_color, duration_bg_color, db.mysql.read);
            console.log(data);
            data = data.map((item) => ({ ...item, type: 'topic' }));
            const translatedData = await Utility.translateMyLibraryData(db.mysql.read, 'new_library', data, locale);
            // return resolve(translatedData);
            return translatedData;
        } catch (e) {
            console.log(e);
            // reject(e);
        }
        // }));
    }

    // getInnerPlaylistHomepage
    static async getPlaylistTab(student_class, db) {
    // first try to get from redis
        // return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            let answer;
            // if(0){
            if (config.caching && config.overide_caching) {
                answer = await redis.getPlaylistTab(student_class, db.redis.read);
                if (!_.isNull(answer)) {
                    // return resolve(JSON.parse(answer));
                    return JSON.parse(answer);
                }
                // get from mysql
                answer = await mysql.getPlaylistTab(db.mysql.read, student_class);
                if (answer.length > 0) {
                    // set in redis
                    await redis.setPlaylistTab(student_class, answer, db.redis.write);
                }
                // return resolve(answer);
                return answer;
            }
            answer = await mysql.getPlaylistTab(db.mysql.read, student_class);
            // return resolve(answer);
            return answer;
        } catch (e) {
            console.log(e);
            // reject(e);
        }
        // }));
    }

    static async getPlaylistAllWithPCMUpdated(student_class, student_id, page, limit, db) {
    // first try to get from redis
        // return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            let answer;
            if (config.caching && config.overide_caching) {
                // if(0){
                answer = await redis.getPlaylistAllWithPCMUpdated(student_class, page, limit, db.redis.read);
                if (!_.isNull(answer)) {
                    // return resolve(JSON.parse(answer));
                    return JSON.parse(answer);
                }
                // get from mysql
                answer = await mysql.getPlaylistAllWithPCMUpdated(student_class, page, limit, db.mysql.read);
                if (answer.length > 0) {
                    // set in redis
                    await redis.setPlaylistAllWithPCMUpdated(student_class, page, limit, answer, db.redis.write);
                }
                // return resolve(answer);
                return answer;
            }
            answer = await mysql.getPlaylistAllWithPCMUpdated(student_class, page, limit, db.mysql.read);
            // return resolve(answer);
            return answer;
        } catch (e) {
            console.log(e);
            // reject(e);
        }
        // }));
    }

    static async getPlaylistAllWithPCMUpdatedWithVersionCode(student_class, student_id, page, limit, db, version_code) {
    // first try to get from redis
        // return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            let answer;
            if (config.caching && config.overide_caching) {
                // if(0){
                answer = await redis.getPlaylistAllWithPCMUpdatedWithVersionCode(student_class, page, limit, db.redis.read, version_code);
                if (!_.isNull(answer)) {
                    // return resolve(JSON.parse(answer));
                    return JSON.parse(answer);
                }
                // get from mysql
                answer = await mysql.getPlaylistAllWithPCMUpdatedWithVersionCode(student_class, page, limit, db.mysql.read, version_code);
                if (answer.length > 0) {
                    // set in redis
                    await redis.setPlaylistAllWithPCMUpdatedWithVersionCode(student_class, page, limit, answer, db.redis.write, version_code);
                }
                // return resolve(answer);
                return answer;
            }
            answer = await mysql.getPlaylistAllWithPCMUpdatedWithVersionCode(student_class, page, limit, db.mysql.read, version_code);
            // return resolve(answer);
            return answer;
        } catch (e) {
            console.log(e);
            // reject(e);
        }
        // }));
    }

    static async getPlaylistWithPCM(db, student_class, student_id, page_no, limit, id) {
    // first try to get from redis
        // return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            let answer;
            if (config.caching && config.overide_caching) {
                // if(0){
                answer = await redis.getPlaylistWithPCM(student_class, id, page_no, db.redis.read);
                if (!_.isNull(answer)) {
                    // return resolve(JSON.parse(answer));
                    return JSON.parse(answer);
                }
                // get from mysql
                answer = await mysql.getPlaylistWithPCM(db.mysql.read, student_class, student_id, page_no, limit, id);
                if (answer.length > 0) {
                    // set in redis
                    await redis.setPlaylistWithPCM(student_class, id, page_no, answer, db.redis.write);
                }
                // return resolve(answer);
                return answer;
            }
            answer = await mysql.getPlaylistWithPCM(db.mysql.read, student_class, student_id, page_no, limit, id);
            // return resolve(answer);
            return answer;
        } catch (e) {
            console.log(e);
            // reject(e);
        }
        // }));
    }

    static async isAnnouncementPresent(db, id) {
    // first try to get from redis
        // return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            let answer;
            if (config.caching) {
                // if(0){
                console.log('test');
                answer = await redis.getIsAnnouncementPresent(db.redis.read, id);
                console.log('answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    // return resolve(JSON.parse(answer));
                    return JSON.parse(answer);
                }
                // get from mysql
                answer = await mysql.isAnnouncementPresent(db.mysql.read, id);
                console.log('mysql');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    await redis.setIsAnnouncementPresent(db.redis.write, id, answer);
                }
                // return resolve(answer);
                return answer;
            }
            answer = await mysql.isAnnouncementPresent(db.mysql.read, id);
            // return resolve(answer);
            return answer;
        } catch (e) {
            console.log(e);
            // reject(e);
        }
        // }));
    }

    static async getPlaylistWithView(db, student_class, student_id, page, limit, playlist_id, versionCode, flagData = false) {
        try {
            let answer;
            let redisKey = 'LIBRARY_PLAYLIST_CHILD_DATA';
            if (flagData && (+playlist_id === 110499 || +playlist_id === 110503)) {
                redisKey = `${redisKey}_${playlist_id}_${page}`;
            } else {
                redisKey = `${redisKey}_${playlist_id}_${versionCode}__${page}`;
            }

            if (config.caching && config.overide_caching) {
                answer = await redis.getPlaylistWithView(db.redis.read, redisKey);
                if (!_.isNull(answer)) {
                    return JSON.parse(answer);
                }

                answer = await mysql.getPlaylistWithView(db.mysql.read, student_class, student_id, page, limit, playlist_id, versionCode, flagData);
                if (answer.length) {
                    redis.setPlaylistWithView(db.redis.write, redisKey, answer);
                }
                return answer;
            }
            return mysql.getPlaylistWithPCM(db.mysql.read, student_class, student_id, page, limit, playlist_id, versionCode, flagData);
        } catch (e) {
            console.log(e);
        }
    }
};
