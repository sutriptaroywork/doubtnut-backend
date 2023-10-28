/* eslint-disable no-shadow */
/* eslint-disable no-async-promise-executor */
/* eslint-disable camelcase */
const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/homepage');
const courseMysql = require('../mysql/course');
const redis = require('../redis/homepage');
const languageTranslator = require('../languageTranslations');
const libraryMysql = require('../mysql/library');
const studentRedis = require('../redis/student');

module.exports = class Homepage {
    static async getCaraousel(db, student_class, limit, page, version_code, flagVariants) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                const flagVariantsString = flagVariants.sort().join('_');
                if (config.caching) {
                    data = await redis.getCaraousel(db.redis.read, student_class, limit, page, version_code, flagVariantsString);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getCaraousel(db.mysql.read, student_class, limit, page, version_code, flagVariants);
                    if (data.length > 0) {
                        redis.setCaraousel(db.redis.write, student_class, limit, page, version_code, data, flagVariantsString);
                    }
                    return resolve(data);
                }
                data = await mysql.getCaraousel(db.mysql.read, student_class, limit, page, version_code, flagVariants);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getCacheHomepage(data, config, HomepageHelper, db, elasticSearchInstance) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                if (0) {
                    const redisData = await redis.getCacheHomepage(data.student_class, data.page, data.caraousel_limit, db.redis.read);
                    if (!_.isNull(redisData)) {
                        return resolve(JSON.parse(redisData));
                    }
                    const homeData = await HomepageHelper.getHomepage(data, config, db, elasticSearchInstance);
                    if (homeData.length > 0) {
                        // set in redis
                        await redis.setCacheHomepage(homeData, data.student_class, data.page, data.caraousel_limit, db.redis.write);
                    } else {
                        return resolve([]);
                    }
                    return resolve(homeData);
                }
                const homeData = HomepageHelper.getHomepage(data, config, db, elasticSearchInstance);
                return resolve(homeData);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getCachePersonalisedHomepage(data, config, HomepageHelper, db, elasticSearchInstance) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                if (0) {
                    //   let redisData = await redis.getCacheHomepage(data['student_class'], data['page'], data['caraousel_limit'], db.redis.read)
                    //   console.log("redissssssssssssssss data")
                    //   console.log(data)
                    //   if (!_.isNull(redisData)) {
                    //     // console.log("exist")
                    //     return resolve(JSON.parse(redisData))
                    //   }
                    //   else {
                    //     let homeData = await HomepageHelper.getHomepage(data, config, db, elasticSearchInstance)
                    //     console.log("homeDataaaaaaaaaaaaaaa")
                    //     console.log(homeData)
                    //     //get from mysql
                    //     // console.log(" not exist")
                    //     // data = await mysql.getCaraousel(language,student_class,page,db.mysql.read)
                    //     // console.log("mysql data")
                    //     // console.log(data)
                    //     if (homeData.length > 0) {

                    //       //set in redis
                    //       await redis.setCacheHomepage(homeData, data['student_class'], data['page'], data['caraousel_limit'], db.redis.write)
                    //     } else {
                    //       return resolve([])
                    //     }
                    //     return resolve(homeData)
                    //   }
                } else {
                    const homeData = HomepageHelper.getPersonalisedHomepage(data, config, db, elasticSearchInstance);
                    return resolve(homeData);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    // result = await HomepageContainer.getCachePersonalisedHomepage(data, config, HomepageHelper, db, elasticSearchInstance)

    // ---- config is missing from this will need to add in this -- will do later
    static async getPersonalisedCaraousel(db, student_id, student_class, student_locale, cep_string, limit, page, version_code, flagVariants) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                const flagVariantsString = flagVariants.sort().join('_');
                if (config.caching) {
                    data = await redis.getPersonalisedCaraousel(db.redis.read, student_class, student_locale, cep_string, page, version_code, flagVariantsString);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getPersonalisedCaraousel(db.mysql.read, student_id, student_class, student_locale, cep_string, limit, page, version_code, flagVariants);
                    if (data.length > 0) {
                        redis.setPersonalisedCaraousel(db.redis.write, student_class, student_locale, cep_string, page, data, version_code, flagVariantsString);
                    }
                    return resolve(data);
                }
                data = await mysql.getPersonalisedCaraousel(db.mysql.read, student_id, student_class, student_locale, cep_string, limit, page, version_code, flagVariants);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getAllActiveHomePageWidgets(db, config, student_class, version_code, page, caraousel_limit) {
        // for now caching is disabled would do this code later --------  next release
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    // if (0) {
                    data = await redis.getAllActiveHomePageWidgets(db.redis.read);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getAllActiveHomePageWidgets(db.mysql.read, student_class, version_code, page, caraousel_limit);
                    if (data.length > 0) {
                        await redis.setAllActiveHomePageWidgets(db.redis.write, data);
                    }
                    resolve(data);

                    return resolve(data);
                }
                data = await mysql.getAllActiveHomePageWidgets(db.mysql.read, student_class, version_code, page, caraousel_limit);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getHomeCaraouselStringsLocalised(db, conifg, version_code, caraousel_id, locale) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                const localised_fields = ['title'];
                if (config.caching) {
                    data = await redis.getLocalisedCaraouselString(db.redis.read, caraousel_id, locale);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                    data = await languageTranslator.getTranslatedDataForRow(db.mysql.read, 'home_caraousels', caraousel_id, localised_fields[0], locale);

                    if (data.length > 0) {
                        redis.setLocalisedCaraouselString(db.redis.write, caraousel_id, locale, data[0]);
                    } else {
                        redis.setLocalisedCaraouselString(db.redis.write, caraousel_id, locale, {});
                    }
                    resolve(data[0]);
                    // return resolve(data);
                }
                data = await languageTranslator.getTranslatedDataForRow(db.mysql.read, 'home_caraousels', caraousel_id, localised_fields[0], locale);
                return resolve(data[0]);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getEtoosTopFacultyData(db, etoosCaraouselData) {
        try {
            if (!config.caching) {
                return courseMysql.getTopTeachersMeta(db.mysql.read, JSON.parse(etoosCaraouselData.meta_data), etoosCaraouselData.ecm_id, etoosCaraouselData.data_limit);
            }
            let answer = await redis.getEtoosData(db.redis.read, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class);
            if (!_.isNull(answer)) {
                return JSON.parse(answer);
            }
            answer = await courseMysql.getTopTeachersMeta(db.mysql.read, JSON.parse(etoosCaraouselData.meta_data), etoosCaraouselData.ecm_id, etoosCaraouselData.data_limit);
            if (answer) {
                redis.setEtoosData(db.redis.write, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class, answer);
            }
            return answer;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getEtoosFacultyChapterList(db, etoosCaraouselData) {
        try {
            if (!config.caching) {
                return courseMysql.getTeacherChapters(db.mysql.read, JSON.parse(etoosCaraouselData.meta_data), etoosCaraouselData.ecm_id, etoosCaraouselData.data_limit);
            }
            let answer = await redis.getEtoosData(db.redis.read, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class);
            if (!_.isNull(answer)) {
                return JSON.parse(answer);
            }
            answer = await courseMysql.getTeacherChapters(db.mysql.read, JSON.parse(etoosCaraouselData.meta_data), etoosCaraouselData.ecm_id, etoosCaraouselData.data_limit);
            if (answer) {
                redis.setEtoosData(db.redis.write, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class, answer);
            }
            return answer;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getEtoosChapterListByChapterid(db, etoosCaraouselData) {
        try {
            if (!config.caching) {
                return courseMysql.getEtoosChapterListByChapterid(db.mysql.read, JSON.parse(etoosCaraouselData.meta_data2), etoosCaraouselData.data_limit);
            }
            let answer = await redis.getEtoosData(db.redis.read, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class);
            if (!_.isNull(answer)) {
                return JSON.parse(answer);
            }
            answer = await courseMysql.getEtoosChapterListByChapterid(db.mysql.read, JSON.parse(etoosCaraouselData.meta_data2), etoosCaraouselData.data_limit);
            if (answer) {
                redis.setEtoosData(db.redis.write, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class, answer);
            }
            return answer;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getEtoosECourse(db, etoosCaraouselData) {
        try {
            if (!config.caching) {
                return courseMysql.getLecturesList(db.mysql.read, JSON.parse(etoosCaraouselData.meta_data), etoosCaraouselData.data_limit);
            }
            let answer = await redis.getEtoosData(db.redis.read, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class);
            if (!_.isNull(answer)) {
                return JSON.parse(answer);
            }
            answer = await courseMysql.getLecturesList(db.mysql.read, JSON.parse(etoosCaraouselData.meta_data), etoosCaraouselData.data_limit);
            if (answer) {
                redis.setEtoosData(db.redis.write, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class, answer);
            }
            return answer;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getEtoosDFC(db, etoosCaraouselData) {
        try {
            const data = {
                database: db.mysql.read,
                ecmId: etoosCaraouselData.ecm_id,
                limit: etoosCaraouselData.data_limit,
                studentClass: etoosCaraouselData.mapped_class,
            };
            if (!config.caching) {
                return courseMysql.getDfcData(data);
            }
            let answer = await redis.getEtoosData(db.redis.read, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class);
            if (!_.isNull(answer)) {
                return JSON.parse(answer);
            }
            answer = await courseMysql.getDfcData(data);
            if (answer) {
                redis.setEtoosData(db.redis.write, etoosCaraouselData.type, etoosCaraouselData.ecm_id, etoosCaraouselData.meta_data, etoosCaraouselData.mapped_class, answer);
            }
            return answer;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getActiveSubjectsByClass(db, student_class) {
        try {
            if (!config.caching) {
                return libraryMysql.getActiveSubjectsByClass(db.mysql.read, student_class);
            }
            const redis_response = await redis.getUsWebHomepageSubjects(db.redis.read, student_class);
            if (!_.isNull(redis_response)) {
                return JSON.parse(redis_response);
            }
            const mysql_response = await libraryMysql.getActiveSubjectsByClass(db.mysql.read, student_class);
            if (mysql_response) {
                redis.setUsWebHomepageSubjects(db.redis.write, student_class, mysql_response);
            }
            return mysql_response;
        } catch (e) {
            return [];
        }
    }

    static async getActiveSubjectsByClass(db, student_class) {
        try {
            if (!config.caching) {
                return libraryMysql.getActiveSubjectsByClass(db.mysql.read, student_class);
            }
            const redis_response = await redis.getUsWebHomepageSubjects(db.redis.read, student_class);
            if (!_.isNull(redis_response)) {
                return JSON.parse(redis_response);
            }
            const mysql_response = await libraryMysql.getActiveSubjectsByClass(db.mysql.read, student_class);
            if (mysql_response) {
                redis.setUsWebHomepageSubjects(db.redis.write, student_class, mysql_response);
            }
            return mysql_response;
        } catch (e) {
            return [];
        }
    }

    static async getActiveNcertLibraryRowByParentId(db, parent_id) {
        try {
            if (!config.caching) {
                return libraryMysql.getNcertLibraryDataByParentId(db.mysql.read, parent_id);
            }
            const redis_response = await redis.getLibraryDataByParentId(db.redis.read, parent_id);
            if (!_.isNull(redis_response)) {
                return JSON.parse(redis_response);
            }
            const mysql_response = await libraryMysql.getNcertLibraryDataByParentId(db.mysql.read, parent_id);
            if (mysql_response) {
                redis.setLibraryDataByParentId(db.redis.write, parent_id, mysql_response);
            }
            return mysql_response;
        } catch (e) {
            return [];
        }
    }

    static async getActiveLibraryRowByParentId(db, parent_id) {
        try {
            if (!config.caching) {
                return libraryMysql.getLibraryRowByParentId(db.mysql.read, parent_id);
            }
            const redis_response = await redis.getLibraryDataByParentId(db.redis.read, parent_id);
            if (!_.isNull(redis_response)) {
                return JSON.parse(redis_response);
            }
            const mysql_response = await libraryMysql.getLibraryRowByParentId(db.mysql.read, parent_id);
            if (mysql_response) {
                redis.setLibraryDataByParentId(db.redis.write, parent_id, mysql_response);
            }
            return mysql_response;
        } catch (e) {
            return [];
        }
    }

    static async getChapterDataByLibrary(db, query, sClass, topic) {
        try {
            if (!config.caching) {
                if (_.isEmpty(query)) {
                    return [];
                }
                return db.mysql.read.query(query);
            }
            const redis_response = await redis.getLibraryDataByClassChapter(db.redis.read, sClass, topic);
            if (!_.isNull(redis_response)) {
                return JSON.parse(redis_response);
            }
            let mysql_response;
            if (_.isEmpty(query)) {
                mysql_response = [];
            } else {
                mysql_response = await db.mysql.read.query(query);
            }
            if (mysql_response) {
                redis.setLibraryDataByClassChapter(db.redis.write, sClass, topic, mysql_response);
            }
            return mysql_response;
        } catch (e) {
            return [];
        }
    }

    static async storeActivityDetails(db, studentId, activityName) {
        try {
            let getStoredActivity = await studentRedis.get7Day(db.read, 'nudge_pop_up', studentId);
            let msg = '';
            if (_.isNull(getStoredActivity)) {
                const activityArr = [activityName];
                studentRedis.set7Day(db.write, 'nudge_pop_up', studentId, activityArr);
                msg = 'Activity Stored';
            } else {
                getStoredActivity = JSON.parse(getStoredActivity);
                if (getStoredActivity.indexOf(activityName) > -1) {
                    msg = 'Activity Already Exist';
                } else {
                    getStoredActivity.push(activityName);
                    studentRedis.set7Day(db.write, 'nudge_pop_up', studentId, getStoredActivity);
                    msg = 'Activity Stored';
                }
            }
            return msg;
        } catch (e) {
            console.error(e);
        }
    }

    static async storeAppOpen(db, studentId) {
        try {
            studentRedis.inc7DayCount(db.write, studentId, 1);
            const msg = 'Open Count Stored';
            return msg;
        } catch (e) {
            console.error(e);
        }
    }

    static async gethomepageCarousel(db, type, dataType, sclass, locale) {
        try {
            let getStoredActivity = await redis.getHomepageCarousel(db.redis.read, type, dataType, sclass, locale);
            if (_.isNull(getStoredActivity)) {
                getStoredActivity = await mysql.getHomepageCarousel(db.mysql.read, type, dataType, sclass, locale);
                if (getStoredActivity.length > 0) {
                    redis.setHomepageCarousel(db.redis.write, type, dataType, sclass, locale, getStoredActivity);
                }
            } else {
                getStoredActivity = JSON.parse(getStoredActivity);
            }
            return getStoredActivity;
        } catch (e) {
            console.error(e);
        }
    }
};
