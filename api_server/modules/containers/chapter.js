const _ = require('lodash');

const config = require('../../config/config');
const Utility = require('../utility');
// let _ = require('./utility');
const mysql = require('../mysql/chapter');
const redis = require('../redis/chapter');

const FlagrUtility = require('../Utility.flagr');
// const redis = require("../redis/answer")
module.exports = class Chapters {
    static async getListWithClass(student_class, student_course, language, db) {
    // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getListWithClass(db.redis.read, student_class, student_course, language);
                    console.log('redis data');

                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getListWithClass(db.mysql.read, student_class, student_course, language);
                    console.log('mysql data');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setListWithClass(db.redis.write, student_class, student_course, language, data);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getListWithClass(db.mysql.read, student_class, student_course, language);
                console.log('mysql data');

                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDetails(student_class, student_course, chapter, language, db) {
    // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDetails(db.redis.read, student_class, student_course, chapter, language);
                    console.log('redis data');

                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDetails(db.mysql.read, student_class, student_course, chapter, language);
                    console.log('mysql data');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDetails(db.redis.write, student_class, student_course, chapter, language, data);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDetails(db.mysql.read, student_class, student_course, chapter, language);
                console.log('mysql data');

                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getSubtopicDetails(student_class, student_course, chapter, subtopic, language, db) {
    // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getSubtopicDetails(db.redis.read, student_class, student_course, chapter, subtopic, language);
                    console.log('redis data');

                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getSubtopicDetails(db.mysql.read, student_class, student_course, chapter, subtopic, language);
                    console.log('mysql data');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setSubtopicDetails(db.redis.write, student_class, student_course, chapter, subtopic, language, data);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getSubtopicDetails(db.mysql.read, student_class, student_course, chapter, subtopic, language);
                console.log('mysql data');

                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getConceptBoosterData(type1, base_url, gradient, type, description, page, capsule, student_class, student_course, language, limit, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getConceptBoosterDataWithClass(type1, db.redis.read, student_class, student_course, language);
                    console.log('redis data');

                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql

                    console.log(' not exist');
                    data = await mysql.getConceptBoosterDataWithClass(base_url, db.mysql.read, gradient, type, description, page, capsule, student_class, student_course, limit, language);
                    // console.log("mysql data")
                    // console.log(data)
                    if (data.length > 0) {
                        // set in redis
                        await redis.setConceptBoosterDataWithClass(type1, db.redis.write, data, student_class, student_course, language);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getConceptBoosterDataWithClass(base_url, db.mysql.read, gradient, type, description, page, capsule, student_class, student_course, limit, language);
                // console.log("mysql data")
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getChapterStats(student_class, student_course, chapter, language, db) {
    // first try to get from redis

        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getChapterStats(db.redis.read, student_class, student_course, chapter, language);
                    console.log('redis data');

                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getChapterStats(db.mysql.read, student_class, student_course, chapter, language);
                    console.log('mysql data');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setChapterStats(db.redis.write, student_class, student_course, chapter, language, data);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getChapterStats(db.mysql.read, student_class, student_course, chapter, language);
                console.log('mysql data');

                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistClasses(course, db) {
    // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistClasses(course, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistClasses(course, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistClasses(course, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistClasses(course, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistinctChapter(course, class1, db) {
    // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistinctChapter(course, class1, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistinctChapter(course, class1, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistinctChapter(course, class1, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistinctChapter(course, class1, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistSubtopics(course, chapter, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistSubtopics(course, chapter, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistSubtopics(course, chapter, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistSubtopics(course, chapter, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistSubtopics(course, chapter, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistExercises(course, sclass, chapter, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistExercises(course, sclass, chapter, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistExercises(course, sclass, chapter, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistExercises(course, sclass, chapter, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistExercises(course, sclass, chapter, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistSubtopicsForMostWatched(course, sclass, chapter, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistSubtopicsForMostWatched(course, sclass, chapter, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistSubtopicsForMostWatched(course, sclass, chapter, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistSubtopicsForMostWatched(course, sclass, chapter, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistSubtopicsForMostWatched(course, sclass, chapter, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistYears(exam, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistYears(exam, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistYears(exam, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistYears(exam, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistYears(exam, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistClassesForStudyMaterial(exam, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistClassesForStudyMaterial(exam, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistClassesForStudyMaterial(exam, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistClassesForStudyMaterial(exam, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistClassesForStudyMaterial(exam, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistChaptersForStudyMaterial(study, sclass, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistChaptersForStudyMaterial(study, sclass, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistChaptersForStudyMaterial(study, sclass, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistChaptersForStudyMaterial(study, sclass, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistChaptersForStudyMaterial(study, sclass, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getCodeByChapter(chapter, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getCodeByChapter(chapter, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getCodeByChapter(chapter, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setCodeByChapter(chapter, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getCodeByChapter(chapter, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistinctChapterLocalised(locale_val, version, course, class1, db) {
    // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistinctChapterLocalised(locale_val, version, course, class1, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getDistinctChapterLocalised(locale_val, course, class1, db.mysql.read);
                    if (data.length > 0) {
                        await redis.setDistinctChapterLocalised(locale_val, version, course, class1, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getDistinctChapterLocalised(locale_val, course, class1, db.mysql.read);
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        }));
    }

    static async getDistinctChapterLocalisedNew(locale_val, version, course, class1, db) {
    // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistinctChapterLocalised(locale_val, version, course, class1, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getDistinctChapterLocalisedNew(locale_val, course, class1, db.mysql.read);
                    if (data.length > 0) {
                        await redis.setDistinctChapterLocalised(locale_val, version, course, class1, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getDistinctChapterLocalisedNew(locale_val, course, class1, db.mysql.read);
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        }));
    }

    static async getDistSubtopicsLocalised(locale_val, version, course, chapter, db) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistSubtopicsLocalised(locale_val, version, course, chapter, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getDistSubtopicsLocalised(locale_val, course, chapter, db.mysql.read);
                    if (data.length > 0) {
                        await redis.setDistSubtopicsLocalised(locale_val, version, course, chapter, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getDistSubtopicsLocalised(locale_val, course, chapter, db.mysql.read);
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        }));
    }

    static async getDistClassesLocalised(locale_val, version, course, db) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistClassesLocalised(locale_val, version, course, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getDistClassesLocalised(db.mysql.read);
                    if (data.length > 0) {
                        await redis.setDistClassesLocalised(locale_val, version, course, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getDistClassesLocalised(db.mysql.read);
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        }));
    }

    static async getDistExercisesLocalised(locale_val, version, course, sclass, chapter, db) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistExercisesLocalised(locale_val, version, course, sclass, chapter, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getDistExercisesLocalised(locale_val, sclass, chapter, db.mysql.read);
                    if (data.length > 0) {
                        await redis.setDistExercisesLocalised(locale_val, version, course, sclass, chapter, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getDistExercisesLocalised(locale_val, sclass, chapter, db.mysql.read);
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        }));
    }

    static async getDistYearsLocalised(version, exam, db) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistYearsLocalised(version, exam, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getDistYearsLocalised(exam, db.mysql.read);
                    if (data.length > 0) {
                        await redis.setDistYearsLocalised(version, exam, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getDistYearsLocalised(exam, db.mysql.read);
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        }));
    }

    static async getDistClassesForStudyMaterialLocalised(version, exam, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistClassesForStudyMaterialLocalised(version, exam, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistClassesForStudyMaterialLocalised(exam, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistClassesForStudyMaterialLocalised(version, exam, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistClassesForStudyMaterialLocalised(exam, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistChaptersForStudyMaterialLocalised(locale_val, version, study, sclass, db) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistChaptersForStudyMaterialLocalised(locale_val, version, study, sclass, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getDistChaptersForStudyMaterialLocalised(locale_val, study, sclass, db.mysql.read);
                    if (data.length > 0) {
                        await redis.setDistChaptersForStudyMaterialLocalised(locale_val, version, study, sclass, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getDistChaptersForStudyMaterialLocalised(locale_val, study, sclass, db.mysql.read);
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        }));
    }

    static async getDistSubtopicsForMostWatchedNew(course, sclass, chapter, db) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistSubtopicsForMostWatchedNew(course, sclass, chapter, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getDistSubtopicsForMostWatchedNew(course, sclass, chapter, db.mysql.read);
                    console.log('mysql answer');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redis.setDistSubtopicsForMostWatchedNew(course, sclass, chapter, data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getDistSubtopicsForMostWatchedNew(course, sclass, chapter, db.mysql.read);
                console.log('mysql answer');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDistChaptersOfContent(locale_val, version, topic, sclass, db) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getDistChaptersOfContent(locale_val, version, topic, sclass, db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getDistChaptersOfContent(locale_val, topic, sclass, db.mysql.read);
                    if (data.length > 0) {
                        await redis.setDistChaptersOfContent(locale_val, version, topic, sclass, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getDistChaptersOfContent(locale_val, topic, sclass, db.mysql.read);
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        }));
    }

    static async getPersonalizedChapters(studentId, ccmId, student_class, student_locale) {
        return [];
        /*        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                const exp = 'homepage-personalized-chapters';
                const flagrResp = await FlagrUtility.getFlagrResp({
                    url: `${config.microUrl}/api/app-config/flagr`,
                    body: {
                        entityId: studentId.toString(),
                        capabilities: {
                            [exp]: {
                                entityId: studentId.toString(),
                            },
                        },
                    },
                }, 200);
                console.log('flgrResponse');
                console.log(flagrResp);
                if (flagrResp && flagrResp[exp] && flagrResp[exp].enabled && flagrResp[exp].payload && flagrResp[exp].payload.endpoint) {
                    console.log('inside');
                    const data = {};
                    data.student_id = studentId;
                    data.ccm_id = ccmId;
                    data.student_class = parseInt(student_class);
                    data.locale = student_locale;
                    const response = await Utility.getPersonalizedHomePageUsingVariantAttachment(flagrResp[exp].payload, data);
                    if (response && response.length > 0) {
                        const result = {};
                        result.title = flagrResp[exp].payload.title;
                        result.list = response;
                        return resolve(result);
                    }
                    resolve([]);
                } else {
                    console.log('outside');
                    resolve([]);
                }
            } catch (e) {
                console.log(e);
                resolve([]);
            }
        })); */
    }
};
