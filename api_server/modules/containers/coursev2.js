const _ = require('lodash');
const moment = require('moment');
const mysql = require('../mysql/coursev2');
const LiveclassMysql = require('../mysql/liveclass');
const packageMysql = require('../mysql/package');
const redis = require('../redis/coursev2');
const config = require('../../config/config');
const staticData = require('../../data/liveclass.data');
const Utility = require('../utility');
const redisKeys = require('../redis/keys');
const FlagrUtility = require('../Utility.flagr');
const Data = require('../../data/liveclass.data');
const libraryMysql = require('../mysql/library');
const studentContainer = require('./student');
const redisUtility = require('../redis/utility.redis');
const studentRedis = require('../redis/student');
const NudgeMysql = require('../mysql/nudge');
const { buildStaticCdnUrl } = require('../../server/helpers/buildStaticCdnUrl');
const AppConfigurationContainer = require('./AppConfiguration');

module.exports = class Course {
    static async getCaraouselDataLandingPage(db, studentClass, locale, category) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCaraouselDataLandingPage(db.redis.read, studentClass, locale, category);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCaraouselDataLandingPage(db.mysql.read, studentClass, locale, category);
            if (data.length) {
                await redis.setCaraouselDataLandingPage(db.redis.write, studentClass, locale, category, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAssortmentDetailsFromId(db, assortmentId, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAssortmentDetailsFromId(db.redis.read, assortmentId, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getAssortmentDetailsFromId(db.mysql.read, assortmentId, studentClass);
            if (data.length) {
                await redis.setAssortmentDetailsFromId(db.redis.write, assortmentId, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAssortmentsByResourceReference(db, resourceReference, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAssortmentsByResourceReference(db.redis.read, resourceReference, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getAssortmentsByResourceReference(db.mysql.read, resourceReference, studentClass);
            if (data.length) {
                await redis.setAssortmentsByResourceReference(db.redis.write, resourceReference, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAssortmentsByResourceReferenceV1(db, resourceReference) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAssortmentsByResourceReferenceV1(db.redis.read, resourceReference);
                if (!_.isNull(data)) {
                    data = JSON.parse(data);
                    if (!data.length || !data[0].display || !data[0].expert_name) {
                        data = await mysql.getAssortmentsByResourceReferenceV1(db.mysql.read, resourceReference);
                        redis.setAssortmentsByResourceReferenceV1(db.redis.write, resourceReference, data);
                    }
                    return data;
                }
            }
            data = await mysql.getAssortmentsByResourceReferenceV1(db.mysql.read, resourceReference);
            redis.setAssortmentsByResourceReferenceV1(db.redis.write, resourceReference, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getVariantDetails(db, variantId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getVariantDetails(db.redis.read, variantId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await packageMysql.getVariantDetails(db.mysql.read, variantId);
            if (data.length) {
                await redis.setVariantDetails(db.redis.write, variantId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getEmiVariantOfPackage(db, variantId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getEmiVariantOfPackage(db.redis.read, variantId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await packageMysql.getEmiVariantOfPackage(db.mysql.read, variantId);
            // if (data.length) {
            await redis.setEmiVariantOfPackage(db.redis.write, variantId, data);
            // }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDefaultVariantFromAssortmentId(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getDefaultVariantFromAssortmentId(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await packageMysql.getDefaultVariantFromAssortmentId(db.mysql.read, assortmentId);
            if (data.length) {
                await redis.setDefaultVariantFromAssortmentId(db.redis.write, assortmentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDefaultVariantFromAssortmentIdHome(db, assortmentId) {
        try {
            let data;
            const key = `assortment_price_details_home1_${assortmentId}`;
            if (config.caching) {
                data = await redis.getDefaultVariantFromAssortmentIdHome(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    data = JSON.parse(data);
                    if (!data.length) {
                        // logger.warn(`CONTENT_ISSUE: No package/variant found for assortment ID ${assortmentId}`);
                    }
                    return data;
                }
            }
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, key)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, key);
            data = await packageMysql.getDefaultVariantFromAssortmentIdHome(db.mysql.read, assortmentId);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, key);
            if (!data.length) {
                // logger.warn(`CONTENT_ISSUE: No package/variant found for assortment ID ${assortmentId}`);
            }
            await redis.setDefaultVariantFromAssortmentIdHome(db.redis.write, assortmentId, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDefaultVariantFromAssortmentReferral(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getDefaultVariantFromAssortmentReferral(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    data = JSON.parse(data);
                    if (!data.length) {
                        // logger.warn(`CONTENT_ISSUE: No referral package/variant found for assortment ID ${assortmentId}`);
                    }
                    return data;
                }
            }
            data = await packageMysql.getDefaultVariantFromAssortmentReferral(db.mysql.read, assortmentId);
            if (!data.length) {
                // logger.warn(`CONTENT_ISSUE: No referral package/variant found for assortment ID ${assortmentId}`);
            }
            await redis.setDefaultVariantFromAssortmentReferral(db.redis.write, assortmentId, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDefaultVariantFromAssortmentAutosalesCampaign(db, assortmentId) {
        let data;
        if (config.caching) {
            data = await redis.getDefaultVariantFromAssortmentAutosalesCampaign(db.redis.read, assortmentId);
            if (!_.isNull(data)) {
                data = JSON.parse(data);
                return data;
            }
        }
        data = await packageMysql.getDefaultVariantFromAssortmentAutosalesCampaign(db.mysql.read, assortmentId);
        redis.setDefaultVariantFromAssortmentAutosalesCampaign(db.redis.write, assortmentId, data);
        return data;
    }

    static async getAllVariantFromAssortmentIdHome(db, flagKey, keyID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAllVariantFromAssortmentIdHome(db.redis.read, flagKey, keyID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await packageMysql.getAllVariantFromAssortmentIdHome(db.mysql.read, flagKey, keyID);
            // if (data.length) {
            await redis.setAllVariantFromAssortmentIdHome(db.redis.write, flagKey, keyID, data);
            // }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getChildAssortments(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getChildAssortments(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getChildAssortments(db.mysql.read, assortmentId);
            if (data.length) {
                await redis.setChildAssortments(db.redis.write, assortmentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getChildAssortmentsFromParent(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getChildAssortmentsFromParent(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getChildAssortmentsFromParent(db.mysql.read, assortmentId);
            if (data.length) {
                await redis.setChildAssortmentsFromParent(db.redis.write, assortmentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getChapterAssortment(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getChapterAssortment(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getChapterAssortment(db.mysql.read, assortmentId);
            if (data.length) {
                await redis.setChapterAssortment(db.redis.write, assortmentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getResourceDetailsFromAssortmentId(db, arr, limit, offset, subject, studentClass, assortmentId, scheduleType, batchID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getResourceDetailsFromAssortmentId(db.redis.read, assortmentId, offset, subject, studentClass, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getResourceDetailsFromAssortmentId(db.mysql.read, arr, limit, offset, subject, studentClass, scheduleType, batchID);
            if (data.length) {
                await redis.setResourceDetailsFromAssortmentId(db.redis.write, assortmentId, offset, subject, studentClass, batchID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getUpcomingResourceDetailsFromAssortmentId(db, arr, limit, offset, subject, studentClass, assortmentId, batchID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUpcomingResourceDetailsFromAssortmentId(db.redis.read, assortmentId, offset, subject, studentClass, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getUpcomingResourceDetailsFromAssortmentId(db.mysql.read, arr, limit, offset, subject, studentClass, batchID);
            if (data.length) {
                await redis.setUpcomingResourceDetailsFromAssortmentId(db.redis.write, assortmentId, offset, subject, studentClass, batchID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async setRecentCorrectAnswer(db, courseID, studentID, date) {
        // check if it is set or not
        const result = await redis.getRecentCorrectAnswer(db.redis.read, courseID, studentID, date);
        if (_.isNull(result)) {
            // set
            await redis.setRecentCorrectAnswer(db.redis.read, courseID, studentID, date, moment.now().toString());
        }
    }

    static async getRecentCorrect(db, studentID, courseArr, date) {
        const promise = [];
        for (let i = 0; i < courseArr.length; i++) {
            promise.push(redis.getRecentCorrectAnswer(db.redis.read, courseArr[i], studentID, date));
        }
        const recentArr = await Promise.all(promise);
        const recentCourseID = courseArr[_.indexOf(recentArr, _.min(recentArr))];
        return (typeof recentCourseID !== 'undefined') ? recentCourseID : '0';
    }

    static async getNotesFromAssortmentId(db, arr, limit, offset, subject, notesType, studentClass, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getNotesFromAssortmentId(db.redis.read, assortmentId, offset, subject, notesType, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getNotesFromAssortmentId(db.mysql.read, arr, limit, offset, subject, notesType, studentClass);
            if (data.length) {
                await redis.setNotesFromAssortmentId(db.redis.write, assortmentId, offset, subject, notesType, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getUserEmiPackages(db, studentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUserEmiPackages(db.redis.read, studentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getUserEmiPackages(db.mysql.read, studentId);
            if (data.length) {
                await redis.setUserEmiPackages(db.redis.write, studentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getChildAssortmentsByResourceType(db, category, studentClass, resourceTypes, subject, free, sort, offset) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getChildAssortmentsByResourceType(db.redis.read, category, studentClass, resourceTypes, subject, free, sort, offset);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getChildAssortmentsByResourceType(db.mysql.read, category, studentClass, resourceTypes, subject, free, sort, offset);
            if (data.length) {
                await redis.setChildAssortmentsByResourceType(db.redis.write, category, studentClass, resourceTypes, subject, free, sort, offset, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLivestreamDetails(db, resourceReference, updateCache = false) {
        try {
            let data;
            if (config.caching && !updateCache) {
                data = await redis.getLivestreamDetails(db.redis.read, resourceReference);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getLivestreamDetails(db.mysql.read, resourceReference);
            if (data.length) {
                await redis.setLivestreamDetails(db.redis.write, resourceReference, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveSectionFromAssortmentHome(db, parentAssortmentID, assortmentList, studentClass, subject, batchID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getLiveSectionFromAssortmentHome(db.redis.read, parentAssortmentID, studentClass, subject, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getLiveSectionFromAssortmentHome(db.mysql.read, assortmentList, studentClass, subject, batchID);
            data = data.map((item) => {
                item.students = Math.floor(10000 + Math.random() * 20000);
                item.interested = Math.floor(20000 + Math.random() * 30000);
                return item;
            });
            // if (data.length) {
            await redis.setLiveSectionFromAssortmentHome(db.redis.write, parentAssortmentID, studentClass, subject, batchID, data);
            // }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveSectionFromAssortment(db, parentAssortmentID, assortmentList, subject, studentClass, batchID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getLiveSectionFromAssortment(db.redis.read, parentAssortmentID, studentClass, subject, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getLiveSectionFromAssortment(db.mysql.read, assortmentList, subject, studentClass, batchID);
            if (data.length) {
                await redis.setLiveSectionFromAssortment(db.redis.write, parentAssortmentID, studentClass, subject, batchID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getSubjectsList(db, parentAssortmentID, assortmentList, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getSubjectsList(db.redis.read, parentAssortmentID, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getSubjectsList(db.mysql.read, assortmentList, studentClass);
            if (data.length) {
                await redis.setSubjectsList(db.redis.write, parentAssortmentID, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async checkNextEmiPaid(db, studentId, newPackageID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.checkNextEmiPaid(db.redis.read, studentId, newPackageID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.checkNextEmiPaid(db.mysql.read, studentId, newPackageID);
            if (data.length) {
                await redis.setCheckNextEmiPaid(db.redis.write, studentId, newPackageID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getUserActivePackages(db, studentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUserActivePackages(db.redis.read, studentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getUserActivePackages(db.mysql.read, studentID);
            // if (data.length) {
            await redis.setUserActivePackages(db.redis.write, studentID, data);
            // }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getUserExpiredPackages(db, studentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUserExpiredPackages(db.redis.read, studentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getUserExpiredPackages(db.mysql.read, studentID);
            // if (data.length) {
            await redis.setUserExpiredPackages(db.redis.write, studentID, data);
            // }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getUserExpiredPackagesIncludingTrial(db, studentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUserExpiredPackagesIncludingTrial(db.redis.read, studentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getUserExpiredPackagesIncludingTrial(db.mysql.read, studentID);
            // if (data.length) {
            await redis.setUserExpiredPackagesIncludingTrial(db.redis.write, studentID, data);
            // }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getUserAllPurchasedPackages(db, studentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUserAllPurchasedPackages(db.redis.read, studentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getUserAllPurchasedPackages(db.mysql.read, studentID);
            // if (data.length) {
            await redis.setUserAllPurchasedPackages(db.redis.write, studentID, data);
            // }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getNotesByQuestionID(db, questionID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getNotesByQuestionID(db.redis.read, questionID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getNotesByQuestionID(db.mysql.read, questionID);
            if (data.length) {
                await redis.setNotesByQuestionID(db.redis.write, questionID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getHomeworkByQuestionID(db, questionID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getHomeworkByQuestionID(db.redis.read, questionID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getHomeworkByQuestionID(db.mysql.read, questionID);
            if (data.length) {
                await redis.setHomeworkByQuestionID(db.redis.write, questionID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getHomeworkByQuestionIDNew(db, questionID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getHomeworkByQuestionIDNew(db.redis.read, questionID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getHomeworkByQuestionIDNew(db.mysql.read, questionID);
            if (data.length) {
                await redis.setHomeworkByQuestionIDNew(db.redis.write, questionID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getHomeworkByQuestionIDWithBatchCheck(db, questionID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getHomeworkByQuestionIDWithBatchCheck(db.redis.read, questionID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getHomeworkByQuestionIDWithBatchCheck(db.mysql.read, questionID);
            if (data.length) {
                await redis.setHomeworkByQuestionIDWithBatchCheck(db.redis.write, questionID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAssortments(db, assortmentID, size, offset) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAssortments(db.redis.read, assortmentID, size, offset);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getAssortments(db.mysql.read, assortmentID, size, offset);
            if (data.length) {
                await redis.setAssortments(db.redis.write, assortmentID, size, offset, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFullHomeworkResponse(db, studentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFullHomeworkResponse(db.redis.read, studentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getFullHomeworkResponse(db.mysql.read, studentID);
            if (data.length) {
                await redis.setFullHomeworkResponse(db.redis.write, studentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getHomeworkQuestionDetails(db, questionIdList) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getHomeworkQuestionDetails(db.redis.read, questionIdList);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const questionIdListArr = questionIdList.split('|');
            data = await mysql.getHomeworkQuestionDetails(db.mysql.read, questionIdListArr);
            if (data.length) {
                await redis.setHomeworkQuestionDetails(db.redis.write, questionIdList, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAllAssortmentsRecursively(db, assortmentList, totalAssortments = [], studentClass) {
        try {
            if (assortmentList.length) {
                const results = await mysql.getChildAssortments(db.mysql.read, assortmentList, studentClass);
                // results = results.filter((e) => e.class == studentClass);
                const now = moment();
                if (results.length) {
                    const assortmentListArr = results.filter((obj) => !obj.live_at || now.diff(obj.live_at, 'days') <= 3).map((obj) => obj.course_resource_id);
                    totalAssortments = [...totalAssortments, ...assortmentListArr];
                    return this.getAllAssortmentsRecursively(db, assortmentListArr, totalAssortments, studentClass);
                }
            }
            return { totalAssortments, assortmentList };
        } catch (e) {
            throw new Error(e);
        }
    }

    static async getAllAssortments(db, assortmentList, studentClass) {
        try {
            let data = [];
            if (config.caching) {
                data = await redis.getAllAssortments(db.redis.read, JSON.stringify(assortmentList), studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await this.getAllAssortmentsRecursively(db, assortmentList, [], studentClass);
            // if (data.length) {
            await redis.setAllAssortments(db.redis.write, JSON.stringify(assortmentList), studentClass, data);
            // }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getHomeworkByAssortmentID(db, assortmentId, page, offset, subject, batchID) {
        try {
            let data = [];
            if (!subject) {
                subject = null;
            }
            if (config.caching) {
                data = await redis.getHomeworkByAssortmentID(db.redis.read, assortmentId, page, offset, subject, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getHomeworkByAssortmentID(db.mysql.read, assortmentId, page, offset, subject, '', 0, batchID);
            if (data.length) {
                await redis.setHomeworkByAssortmentID(db.redis.write, assortmentId, page, offset, subject, batchID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getHomeworkByAssortmentIDHomepage(db, assortmentId, batchID, limit, offset) {
        try {
            let data = [];
            if (config.caching) {
                data = await redis.getHomeworkByAssortmentIDHomepage(db.redis.read, assortmentId, batchID, limit, offset);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getHomeworkByAssortmentIDHomepage(db.mysql.read, assortmentId, batchID, limit, offset);
            if (data.length) {
                redis.setHomeworkByAssortmentIDHomepage(db.redis.write, assortmentId, batchID, limit, offset, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getHomeworkBySubjectAssortmentID(db, assortmentId, page, offset, batchID) {
        try {
            let data = [];
            if (config.caching) {
                data = await redis.getHomeworkByAssortmentID(db.redis.read, assortmentId, page, offset, null, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getHomeworkBySubjectAssortmentID(db.mysql.read, assortmentId, page, offset, '', 0, batchID);
            if (data.length) {
                await redis.setHomeworkByAssortmentID(db.redis.write, assortmentId, page, offset, null, batchID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getResourcesCountFromCourseAssortment(db, assortmentId, batchID) {
        try {
            let data = [];
            if (config.caching) {
                data = await redis.getResourcesCountFromAssortment(db.redis.read, assortmentId, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getResourcesCountFromCourseAssortment(db.mysql.read, assortmentId, batchID);
            if (data.length) {
                await redis.setResourcesCountFromAssortment(db.redis.write, assortmentId, batchID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getResourcesCountFromChapterAssortment(db, assortmentId, batchID) {
        try {
            let data = [];
            if (config.caching) {
                data = await redis.getResourcesCountFromAssortment(db.redis.read, assortmentId, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getResourcesCountFromChapterAssortment(db.mysql.read, assortmentId, batchID);
            if (data.length) {
                await redis.setResourcesCountFromAssortment(db.redis.write, assortmentId, batchID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getResourcesCountFromSubjectAssortment(db, assortmentId, batchID) {
        try {
            let data = [];
            if (config.caching) {
                data = await redis.getResourcesCountFromAssortment(db.redis.read, assortmentId, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getResourcesCountFromSubjectAssortment(db.mysql.read, assortmentId, batchID);
            if (data.length) {
                await redis.setResourcesCountFromAssortment(db.redis.write, assortmentId, batchID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getRecentLecturesByClass(db, assortmentList, studentClass, startTime, endTime, category, ccmTitle) {
        try {
            let data = [];
            if (config.caching) {
                data = await redis.getRecentLecturesByClass(db.redis.read, studentClass, category, ccmTitle);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getRecentLecturesByClass(db.mysql.read, assortmentList, startTime, endTime, category);
            if (data.length) {
                await redis.setRecentLecturesByClass(db.redis.write, studentClass, category, ccmTitle, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getOnboardingItems(db, studentLocale, sessionCount) {
        try {
            let data = [];
            if (config.caching) {
                data = await redis.getOnboardingItems(db.redis.read, studentLocale, sessionCount);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getOnboardingItems(db.mysql.read, studentLocale, sessionCount);
            if (data.length) {
                await redis.setOnboardingItems(db.redis.write, studentLocale, sessionCount, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTG(db, tgID) {
        let data = [];
        try {
            if (config.caching) {
                data = await redis.getTG(db.redis.read, tgID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await packageMysql.getTG(db.mysql.read, tgID);
            if (data.length) {
                redis.setTG(db.redis.write, tgID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            return data;
        }
    }

    static async getDailyAdsLimit(db) {
        return AppConfigurationContainer.getConfigByKey(db, 'daily_limit');
    }

    static async getAdsPlayArray(db) {
        return AppConfigurationContainer.getConfigByKey(db, 'ads_play_array');
    }

    static async getvideoViewExperiment(db) {
        return AppConfigurationContainer.getConfigByKey(db, 'video_experiment');
    }

    static async getCourseDetailsFromVariantId(db, varaintID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCourseDetailsFromVariantId(db.redis.read, varaintID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const courseData = await mysql.getCourseDetailsFromVariantId(db.mysql.read, varaintID);
            if (courseData.length) {
                data = [{
                    display_image_rectangle: courseData[0].demo_video_thumbnail,
                    display_name: courseData[0].display_name,
                    subtitle: courseData[0].subtitle,
                    assortment_type: courseData[0].assortment_type,
                }];
                await redis.setCourseDetailsFromVariantId(db.redis.write, varaintID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDistinctNotesType(db, assortmentID, assortmentType) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getDistinctNotesType(db.redis.read, assortmentID);
            }
            data = await mysql.getDistinctNotesType(db.mysql.read, assortmentID, assortmentType);
            if (data.length) {
                await redis.setDistinctNotesType(db.redis.write, assortmentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDistinctSubjectByLocaleClass(db, studentClass, locale) {
        try {
            let data;
            const localeAbbr = staticData.localeMapping[locale];
            if (config.caching) {
                data = await redis.getDistinctSubjectByLocaleClass(db.redis.read, studentClass, locale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const distinctSubjects = await mysql.getDistinctSubjectsByLocaleClass(db.mysql.read, studentClass, localeAbbr);
            if (distinctSubjects.length) {
                data = distinctSubjects.map((item) => ({
                    subject: item.subject,
                    average_et: item.et_per_st,
                }));
                await redis.setDistinctSubjectByLocaleClass(db.redis.write, studentClass, locale, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTopFreeClassesBySubjectClassLocale(db, studentClass, studentLocale, subject) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTopFreeClassesBySubjectClassLocale(db.redis.read, studentClass, studentLocale, subject);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getTopFreeClassesBySubjectClassLocale(db.mysql.read, studentClass, studentLocale, subject);
            if (data.length) {
                await redis.setTopFreeClassesBySubjectClassLocale(db.redis.write, studentClass, studentLocale, subject, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getPreviousYearQuestionsByCcmId(db, ccmArray, page, studentClass) {
        let data;
        if (config.caching) {
            data = await redis.getPreviousYearBooksByCcmId(db.redis.read, ccmArray, page, studentClass);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
        }
        data = await libraryMysql.getPreviousYearBooksByCcmId(db.mysql.read, ccmArray, page, studentClass);
        if (data.length) {
            await redis.setPreviousYearBooksByCcmId(db.redis.write, ccmArray, page, studentClass, data);
        }
        return data;
    }

    static async getBooksByCcmId(db, ccmArray, subject, locale, page, studentClass) {
        let data;
        if (config.caching) {
            data = await redis.getBooksByCcmId(db.redis.read, ccmArray, subject, locale, page, studentClass);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
        }
        data = await libraryMysql.getBooksByCcmId(db.mysql.read, ccmArray, subject, locale, page, studentClass);
        if (data.length) {
            await redis.setBooksByCcmId(db.redis.write, ccmArray, subject, locale, page, data, studentClass);
        }
        return data;
    }

    static async getLiveNowLecturesByClass(db, assortmentList, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getLiveNowLecturesByClass(db.redis.read, studentClass);
            }
            data = await mysql.getLiveNowLecturesByClass(db.mysql.read, assortmentList, studentClass);
            if (data.length) {
                await redis.setLiveNowLecturesByClass(db.redis.write, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveclassTvCarouselData(db, type, assortmentList) {
        try {
            const multiRedis = db.redis.read.multi();
            for (let i = 0; i < assortmentList.length; i++) {
                // get data
                multiRedis.get(`${redisKeys[type].key}${assortmentList[i]}`);
            }
            const data = await multiRedis.execAsync();
            // aggregate data
            let aggregatedData = [];
            data.map((item) => {
                if (!_.isNull(item[1])) {
                    item[1] = JSON.parse(item[1]);
                    item[1].expert_image = buildStaticCdnUrl(item[1].expert_image);
                    aggregatedData = [...aggregatedData, ...item[1]];
                }
                return aggregatedData;
            });
            // re order based on type
            if (!_.isEmpty(redisKeys[type].sortKey)) {
                aggregatedData = _.orderBy(aggregatedData, redisKeys[type].sortKey[0], redisKeys[type].sortKey[1]);
            }
            return aggregatedData;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getReplayLecturesByClass(db, assortmentList, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getReplayLecturesByClass(db.redis.read, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getReplayLecturesByClass(db.mysql.read, assortmentList, studentClass);
            if (data.length) {
                await redis.setReplayLecturesByClass(db.redis.write, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getUpcomingLecturesByClass(db, assortmentList, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUpcomingLecturesByClass(db.redis.read, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getUpcomingLecturesByClass(db.mysql.read, assortmentList, studentClass);
            if (data.length) {
                await redis.setUpcomingLecturesByClass(db.redis.write, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDemoVideoExperiment(db, assortmentID, courseClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getDemoVideoExperiment(db.redis.read, assortmentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getDemoVideoExperiment(db.mysql.read, assortmentID, courseClass);
            if (data.length) {
                await redis.setDemoVideoExperiment(db.redis.write, assortmentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getPaidCoursesExcludingUsersPurchased(db, assortmentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getPaidCoursesExcludingUsersPurchased(db.redis.read, assortmentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getPaidCoursesExcludingUsersPurchased(db.mysql.read, assortmentID);
            if (data.length) {
                await redis.setPaidCoursesExcludingUsersPurchased(db.redis.write, assortmentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAssortmentDataForExploreCarousel(db, assortmentIds, studentClass, carouselID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAssortmentDataForExploreCarousel(db.redis.read, carouselID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getAssortmentDetailsFromId(db.mysql.read, assortmentIds, studentClass);
            if (data.length) {
                await redis.setAssortmentDataForExploreCarousel(db.redis.write, carouselID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFreeResourceDetailsFromAssortmentId(db, assortmentId, studentClass, offset) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFreeResourceDetailsFromAssortmentId(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getFreeResourceDetailsFromAssortmentId(db.mysql.read, assortmentId, studentClass, offset);
            if (data.length) {
                await redis.setFreeResourceDetailsFromAssortmentId(db.redis.write, assortmentId, data);
            }
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCoursesClassCourseMapping(db, studentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCoursesClassCourseMapping(db.redis.read, studentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCoursesClassCourseMapping(db.mysql.read, studentId);
            if (data.length) {
                await redis.setCoursesClassCourseMapping(db.redis.write, studentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCategoriesFromCcmId(db, ccmArray) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCategoriesByCcmId(db.redis.read, ccmArray);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCategoriesByCcmId(db.mysql.read, ccmArray);
            if (data.length) {
                await redis.setCategoriesByCcmId(db.redis.write, ccmArray, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFreeCouseAssortmentIdsByCcmId(db, ccmArray, locale) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFreeCourseByCcmId(db.redis.read, ccmArray, locale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getFreeAssortmentsByCcmId(db.mysql.read, ccmArray, locale);
            if (data.length) {
                await redis.setFreeCourseByCcmId(db.redis.write, ccmArray, locale, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCoursesForHomepageIcons(db, studentClass, category, studentLocale) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCoursesForHomepageIcons(db.redis.read, studentClass, category, studentLocale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCoursesForHomepageIcons(db.mysql.read, studentClass, category, studentLocale);
            if (data.length) {
                await redis.setCoursesForHomepageIcons(db.redis.write, studentClass, category, studentLocale, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCoursesForHomepageByCategory(db, studentClass, studentLocale) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCoursesForHomepageByCategory(db.redis.read, studentClass, studentLocale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCoursesForHomepageByCategory(db.mysql.read, studentClass, studentLocale);
            if (data.length) {
                await redis.setCoursesForHomepageByCategory(db.redis.write, studentClass, studentLocale, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getUserActivePackagesByClass(db, studentID, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUserActivePackagesByClass(db.redis.read, studentID, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getUserActivePackagesByClass(db.mysql.read, studentID, studentClass);
            await redis.setUserActivePackagesByClass(db.redis.write, studentID, studentClass, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getNewUserInterval(db) {
        return AppConfigurationContainer.getConfigByKey(db, 'interval');
    }

    static async getChapterListOfAssortmentVodWithoutOffset(db, assortmentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getChapterListOfAssortmentVodWithoutOffset(db.redis.read, assortmentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getChapterListOfAssortmentVodWithoutOffset(db.mysql.read, assortmentID);
            if (data.length) {
                await redis.setChapterListOfAssortmentVodWithoutOffset(db.redis.write, assortmentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getChapterListOfAssortmentWithoutOffset(db, assortmentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getChapterListOfAssortmentWithoutOffset(db.redis.read, assortmentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getChapterListOfAssortmentWithoutOffset(db.mysql.read, assortmentID);
            if (data.length) {
                await redis.setChapterListOfAssortmentWithoutOffset(db.redis.write, assortmentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getStudentAssortmentProgress(db, studentID, assortmentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getStudentAssortmentProgress(db.redis.read, studentID, assortmentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getStudentAssortmentProgress(db.mysql.read, studentID, assortmentID);
            if (data.length) {
                await redis.setStudentAssortmentProgress(db.redis.write, studentID, assortmentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getStudentRecordFromBNBClickersTable(db, studentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getStudentRecordFromBNBClickersTable(db.redis.read, studentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getStudentRecordFromBNBClickersTable(db.mysql.read, studentID);
            if (data.length) {
                await redis.setStudentRecordFromBNBClickersTable(db.redis.write, studentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFiltersFromCourseDetails(db, filterClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFiltersFromCourseDetails(db.redis.read, filterClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getFiltersFromCourseDetails(db.mysql.read, filterClass);
            if (data.length) {
                await redis.setFiltersFromCourseDetails(db.redis.write, filterClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFreeAssortmentsByCategory(db, category, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFreeAssortmentsByCategory(db.redis.read, category, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getFreeAssortmentsByCategory(db.mysql.read, category, studentClass);
            if (data.length) {
                await redis.setFreeAssortmentsByCategory(db.redis.write, category, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCourseDetailsFromQuestionId(db, questionID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCourseDetailsFromQuestionId(db.redis.read, questionID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCourseDetailsFromQuestionId(db.mysql.read, questionID);
            if (data.length) {
                await redis.setCourseDetailsFromQuestionId(db.redis.write, questionID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getBannersFromId(db, bannerId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getBannersFromId(db.redis.read, bannerId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getBannersFromId(db.mysql.read, bannerId);
            if (data.length) {
                await redis.setBannersFromId(db.redis.write, bannerId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCourseAdDataQid(db, studentClass, subject) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCourseAdDataQid(db.redis.read, studentClass, subject);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCourseAdDataQid(db.mysql.read, studentClass, subject);
            if (data.length) {
                await redis.setCourseAdDataQid(db.redis.write, studentClass, subject, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCoursesList(db, categ, category, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCoursesList(db.redis.read, categ, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCoursesList(db.mysql.read, category, studentClass);
            if (data.length) {
                await redis.setCoursesList(db.redis.write, categ, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAssortmentSubject(db, courseAssortment, subject) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAssortmentSubject(db.redis.read, courseAssortment, subject);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getAssortmentSubject(db.mysql.read, courseAssortment, subject);
            if (data.length) {
                await redis.setAssortmentSubject(db.redis.write, courseAssortment, subject, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDemoVideoSubject(db, assortmentID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getDemoVideoSubject(db.redis.read, assortmentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getDemoVideoSubject(db.mysql.read, assortmentID);
            if (data.length) {
                await redis.setDemoVideoSubject(db.redis.write, assortmentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLFAdData(db, studentClass, subject) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getLFAdData(db.redis.read, studentClass, subject);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getLFAdData(db.mysql.read, studentClass, subject);
            if (data.length) {
                await redis.setLFAdData(db.redis.write, studentClass, subject, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCoursesForHomepageWeb(db) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCoursesForHomepageWeb(db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCoursesForHomepageWeb(db.mysql.read);
            if (data.length) {
                redis.setCoursesForHomepageWeb(db.redis.write, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCourseDetailInfoBranchDeeplinkFromAppDeeplink(db, assortmentId, subject) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCourseDetailInfoBranchDeeplinkFromAppDeeplink(db.redis.read, assortmentId, subject);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'WEB_TO_APP', 'mWeb', `doubtnutapp://course_detail_info?assortment_id=${assortmentId}&tab=subject&subject=${subject}`);
            if (data) {
                redis.setCourseDetailInfoBranchDeeplinkFromAppDeeplink(db.redis.write, assortmentId, subject, data.url);
            }
            return data ? data.url : null;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCourseDetailsBranchDeeplinkFromAppDeeplink(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCourseDetailsBranchDeeplinkFromAppDeeplink(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'WEB_TO_APP', 'mWeb', `doubtnutapp://course_details?id=${assortmentId}`);
            if (data) {
                redis.setCourseDetailsBranchDeeplinkFromAppDeeplink(db.redis.write, assortmentId, data.url);
            }
            return data ? data.url : null;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAutomatedReplyBranchDeeplinkFromAppDeeplink(db) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAutomatedReplyBranchDeeplinkFromAppDeeplink(db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'EXPLORE_PAGE', 'AUTOMATED_REPLY', 'doubtnutapp://course_details?id=xxxx');
            if (data) {
                redis.setAutomatedReplyBranchDeeplinkFromAppDeeplink(db.redis.write, data.url);
            }
            return data ? data.url : '';
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCoursesListForWeb(db, category, studentClass) {
        try {
            let data;
            let key = '';
            if (category && category.length) {
                category.forEach((categoryItem) => {
                    key = `${key}:${categoryItem}`;
                });
            }
            if (studentClass) {
                key += `:${studentClass}`;
            }
            if (config.caching) {
                data = await redis.getCoursesListForWeb(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCoursesListForWeb(db.mysql.read, category, studentClass);
            if (data.length) {
                redis.setCoursesListForWeb(db.redis.write, key, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getScholarshipExams(db) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getScholarshipExams(db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getScholarshipExams(db.mysql.read);
            if (data.length) {
                await redis.setScholarshipExams(db.redis.write, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getScholarshipLeaderByTest(db, testId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getScholarshipLeaderByTest(db.redis.read, testId[0]);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getScholarshipLeaderByTest(db.mysql.read, testId);
            if (data.length) {
                await redis.setScholarshipLeaderByTest(db.redis.write, testId[0], data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getScholarshipResultBanner(db, couponCode, locale) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getScholarshipResultBanner(db.redis.read, couponCode, locale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getScholarshipResultBanner(db.mysql.read, couponCode, locale);
            if (data.length) {
                await redis.setScholarshipResultBanner(db.redis.write, couponCode, locale, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAppConfigurationContent(db, keyName) {
        return AppConfigurationContainer.getConfigByKey(db, keyName);
    }

    static async getScholarshipAppGeneralBanner(db, testId, locale, progress) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getScholarshipAppGeneralBanner(db.redis.read, testId, locale, progress);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getScholarshipAppGeneralBanner(db.mysql.read, testId, locale, progress);
            if (data.length) {
                await redis.setScholarshipAppGeneralBanner(db.redis.write, testId, locale, progress, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFlagrResp(db, exp, studentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFlagrResp(db.redis.read, exp, studentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await FlagrUtility.getFlagrResp({
                url: `${config.microUrl}/api/app-config/flagr`,
                body: {
                    entityId: studentId.toString(),
                    capabilities: {
                        [exp]: {
                            entityId: exp === 'homepage_revamp' ? Number(studentId) : studentId.toString(),
                        },
                    },
                },
            });
            if (!_.isEmpty(data)) {
                redis.setFlagrResp(db.redis.read, exp, studentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            return {};
        }
    }

    static async getFlagrRespWithClassVersionCode(db, exp, studentId, studentClass, versionCode) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFlagrRespWithClassVersionCode(db.redis.read, exp, studentId, studentClass, versionCode);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const flagData = await FlagrUtility.getFlagrResp({
                url: `${config.microUrl}/api/app-config/flagr`,
                body: {
                    entityId: studentId.toString(),
                    capabilities: {
                        [exp]: {
                            studentId: studentId.toString(),
                            studentClass: studentClass.toString(),
                            versionCode,
                        },
                    },
                },
            });
            data = _.get(flagData, `${exp}.payload.enabled`, false);
            redis.setFlagrRespWithClassVersionCode(db.redis.read, exp, studentId, studentClass, versionCode, data);

            return data;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    static async getOtherLanguageCourse(db, assortmentId, locale) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getOtherLanguageCourse(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getOtherLanguageCourse(db.mysql.read, assortmentId, locale);
            if (data.length) {
                await redis.setOtherLanguageCourse(db.redis.write, assortmentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getPastResourceDetailsFromAssortmentId(db, arr, resourceTypes, studentClass, subject_filter, carouselId, batchID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getPastResourceDetailsFromAssortmentId(db.redis.read, carouselId, batchID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getPastResourceDetailsFromAssortmentId(db.mysql.read, arr, resourceTypes, studentClass, subject_filter, 0, batchID);
            if (data.length) {
                await redis.setPastResourceDetailsFromAssortmentId(db.redis.write, carouselId, batchID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLastestBatchByAssortment(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getLastestBatchByAssortment(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getLastestBatchByAssortment(db.mysql.read, assortmentId);
            if (data.length) {
                await redis.setLastestBatchByAssortment(db.redis.write, assortmentId, data);
            } else {
                data = [{ batch_id: 1, assortment_id: assortmentId }];
                await redis.setLastestBatchByAssortment(db.redis.write, assortmentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getEnrolledStudentsInCourse(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getEnrolledStudentsInCourse(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getEnrolledStudentsInCourse(db.mysql.read, assortmentId);
            if (data.length) {
                await redis.setEnrolledStudentsInCourse(db.redis.write, assortmentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveSectionPastAndLive(db, courseID, courseType, subject, studentClass) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getLiveSectionPastAndLive(db.redis.read, courseID, courseType, subject, studentClass);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await LiveclassMysql.getLiveSectionPastAndLive(db.mysql.read, courseID, courseType, subject, studentClass);
            // if (dataToReturn.length) {
            // setting empty data incase of no rows from mysql

            redis.setLiveSectionPastAndLive(db.redis.write, courseID, courseType, subject, studentClass, dataToReturn);
            // }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getLiveSectionUpcoming(db, courseID, courseType, subject, studentClass) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getLiveSectionUpcoming(db.redis.read, courseID, courseType, subject, studentClass);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await LiveclassMysql.getLiveSectionUpcoming(db.mysql.read, courseID, courseType, subject, studentClass);
            // if (dataToReturn.length) {
            // setting empty data incase of no rows from mysql
            redis.setLiveSectionUpcoming(db.redis.write, courseID, courseType, subject, studentClass, dataToReturn);
            // }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    static getBarColorHomepage(subject) {
        const colorMap = {
            PHYSICS: '#508f17',
            BIOLOGY: '#8064f4',
            CHEMISTRY: '#b62da8',
            MATHS: '#1f3157',
            ENGLISH: '#1a99e9',
            SCIENCE: '#0E2B6D',
            GUIDANCE: '#0E2B6D',
            ALL: '#0E2B6D',
            TEST: '#54138a',
            'रसायन विज्ञान': '#b62da8',
            गणित: '#1f3157',
            'भौतिक विज्ञान': '#508f17',
            अंग्रेज़ी: '#1a99e9',
            विज्ञान: '#0E2B6D',
            'दिशा निर्देश': '#0E2B6D',
            जीवविज्ञान: '#8064f4',
            'जीव विज्ञान': '#8064f4',
            'सामाजिक विज्ञान': '#0E2B6D',
        };
        if (colorMap[subject]) {
            return colorMap[subject];
        }
        if (subject.includes('अंग्रेज़ी')) {
            return colorMap['अंग्रेज़ी'];
        }
        return Data.subjectColor;
    }

    static async getSubjectFiltersByEcm(db, ecmId, studentClass, course) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getSubjectFiltersByEcm(db.redis.read, ecmId, studentClass, course);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            let filterData;
            const items = [];
            if (course === 'course') {
                filterData = await LiveclassMysql.getSubjectsListV3(db.mysql.read, ecmId, studentClass);
            } else {
                filterData = await mysql.getSubjectList(db.mysql.read, ecmId, studentClass);
            }
            items.push({ filter_id: 'ALL', color: this.getBarColorHomepage('ALL') });
            filterData.forEach((e) => {
                if (e.subject !== 'ALL') items.push({ filter_id: e.subject, color: this.getBarColorHomepage(e.subject) });
            });
            data = {
                type: 'subject_filters',
                data: {
                    items,
                },
            };
            if (items.length) {
                redis.setSubjectFiltersByEcm(db.redis.write, ecmId, studentClass, course, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getScholarshipAppStripBanner(db, testId, locale, progress) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getScholarshipAppStripBanner(db.redis.read, testId, locale, progress);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getScholarshipAppStripBanner(db.mysql.read, testId, locale, progress);
            if (data.length) {
                await redis.setScholarshipAppStripBanner(db.redis.write, testId, locale, progress, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getScholarshipExamsOld(db, type) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getScholarshipExamsOld(db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getScholarshipExamsOld(db.mysql.read, type);
            if (data.length) {
                await redis.setScholarshipExamsOld(db.redis.write, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getScholarshipLeaderByTestSmall(db, testId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getScholarshipLeaderByTestSmall(db.redis.read, testId[0]);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getScholarshipLeaderByTestSmall(db.mysql.read, testId);
            if (data.length) {
                await redis.setScholarshipLeaderByTestSmall(db.redis.write, testId[0], data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCourseTargetGroupsForThumbnailTags(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCourseTargetGroupsForThumbnailTags(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCourseTargetGroupsForThumbnailTags(db.mysql.read, assortmentId);
            redis.setCourseTargetGroupsForThumbnailTags(db.redis.write, assortmentId, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getBatchDetailsByAssortment(db, assortmentId, batchId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getBatchDetailsByAssortment(db.redis.read, assortmentId, batchId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getBatchDetailsByAssortment(db.mysql.read, assortmentId, batchId, data);
            redis.setBatchDetailsByAssortment(db.redis.write, assortmentId, batchId, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getContineBuyingCoursesData(db, assortmentId, studentID) {
        try {
            let coursesList = [];
            if (config.caching) {
                const data = await redis.getContineBuyingCoursesData(db.redis.read, studentID);
                if (!_.isNull(data)) {
                    coursesList = JSON.parse(data);
                    if (coursesList.length === 5) {
                        return 1;
                    }
                }
            }
            const checkIndex = coursesList.indexOf(assortmentId);
            if (checkIndex >= 0) {
                coursesList.splice(checkIndex, 1);
            }
            coursesList.unshift(assortmentId);
            redis.setContineBuyingCoursesData(db.redis.write, studentID, coursesList);
            return 1;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getPrePurchaseCourseHighlights(db, assortmentId = 0, locale, limit) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getPrePurchaseCourseHighlights(db.redis.read, assortmentId, locale, limit);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getPrePurchaseCourseHighlights(db.mysql.read, assortmentId, locale, limit);
            redis.setPrePurchaseCourseHighlights(db.redis.write, assortmentId, locale, limit, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLatestLauncedCourses(db, studentClass, locale, studentId) {
        try {
            let data;
            const ccmIds = await studentContainer.getStudentCcmIds(db, studentId);
            const biharUpCCMList = await studentContainer.getBiharUpActiveCCMData(db);
            let isBiharUpCCM = false;
            for (let i = 0; i < ccmIds.length; i++) {
                if (biharUpCCMList.includes(parseInt(ccmIds[i]))) {
                    isBiharUpCCM = true;
                    break;
                }
            }
            if (!_.isEmpty(ccmIds) && isBiharUpCCM) {
                locale = 'hi';
            }
            if (config.caching) {
                data = await redis.getLatestLauncedCourses(db.redis.read, studentClass, locale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getLatestLauncedCourses(db.mysql.read, studentClass, locale);
            if (data.length) {
                redis.setLatestLauncedCourses(db.redis.write, studentClass, locale, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getScholarshipWebBanner(db, testId, progress, locale) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getScholarshipWebBanner(db.redis.read, testId, progress, locale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getScholarshipWebBanner(db.mysql.read, testId, progress, locale);
            if (data.length) {
                await redis.setScholarshipWebBanner(db.redis.write, testId, progress, locale, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getChapterRelatedVideosFromResourceID(db, questionID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getChapterRelatedVideosFromResourceID(db.redis.read, questionID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getChapterRelatedVideosFromResourceID(db.mysql.read, questionID);
            if (data.length) {
                redis.setChapterRelatedVideosFromResourceID(db.redis.write, questionID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async userWatchedTopicsFromSRP(db, studentID, topic) {
        try {
            let topicList = [];
            if (config.caching) {
                const data = await studentRedis.get30Day(db.redis.read, 'uwsrp', studentID);
                if (!_.isNull(data)) {
                    topicList = JSON.parse(data);
                    if (topicList.length === 5) {
                        topicList.pop();
                    }
                }
                topicList.unshift(topic);
                studentRedis.set30Day(db.redis.write, 'uwsrp', studentID, topicList);
            }
            return 1;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLastDNST(db) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getLastDNST(db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getLastDNST(db.mysql.read);
            if (data.length) {
                await redis.setLastDNST(db.redis.write, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getPastVideoResourcesOfChapter(db, chapterAssortmentList, batchID, assortmentId, subject = 'all') {
        try {
            let data;
            if (config.caching) {
                data = await redis.getPastVideoResourcesOfChapter(db.redis.read, assortmentId, batchID, subject);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getPastVideoResourcesOfChapter(db.mysql.read, chapterAssortmentList, batchID);
            if (data.length) {
                await redis.setPastVideoResourcesOfChapter(db.redis.write, assortmentId, batchID, subject, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getParentPlaylistId(db, studentClass, studentLocaleTemp, ccmId) {
        try {
            let data;
            if (config.caching) {
                if (ccmId) {
                    data = await redis.getParentPlaylistId(db.redis.read, studentLocaleTemp, ccmId);
                } else {
                    data = await redis.getParentPlaylistIdByClass(db.redis.read, studentClass, studentLocaleTemp);
                }
                if (!_.isNull(data) || data == 'No Data') {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getParentPlaylistId(db.mysql.read, studentClass, studentLocaleTemp, ccmId);
            if (ccmId) {
                if (!data.length) {
                    data = 'No Data';
                }
                await redis.setParentPlaylistId(db.redis.write, studentLocaleTemp, ccmId, data);
            } else {
                if (!data.length) {
                    data = 'No Data';
                }
                await redis.setParentPlaylistIdByClass(db.redis.write, studentClass, studentLocaleTemp, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFreeLiveClassCaraousel(db, stClass, locale, versionCode, page, limit) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFreeLiveClassCaraousel(db.redis.read, stClass, locale, versionCode, page, limit);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getFreeLiveClassCaraousel(db.mysql.read, stClass, locale, versionCode, page, limit);
                if (data.length) {
                    redis.setFreeLiveClassCaraousel(db.redis.write, stClass, locale, versionCode, page, limit, data);
                }
                return data;
            }
            return mysql.getFreeLiveClassCaraousel(db.mysql.read, stClass, locale, versionCode, page, limit);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFreeAssortmentList(db, stClass, category, locale) {
        try {
            let data;
            if (locale) {
                locale = locale === 'hi' ? 'HINDI' : 'ENGLISH';
            }
            let key = 'LIVE_CLASS_FREE_ASSORTMENT_LIST';
            key = stClass ? `${key}_${stClass}` : key;
            key = locale ? `${key}_${locale}` : key;
            key = category ? `${key}_${category}` : key;

            if (config.caching) {
                data = await redis.getFreeAssortmentListData(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getFreeAssortmentListData(db.mysql.read, stClass, category, locale);
                if (data.length) {
                    redis.setFreeAssortmentListData(db.redis.write, key, data);
                }
                return data;
            }
            return mysql.getFreeAssortmentListData(db.mysql.read, stClass, category, locale);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveClassVideoDataChapterWise(db, asortList) {
        try {
            let data;
            const key = `LIVE_CLASS_FREE_SUBJECT_CHAPTER_LIST_${asortList.join('_')}`;

            if (config.caching) {
                data = await redis.getRedisDataUsingKey(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getLiveClassVideoDataChapterWise(db.mysql.read, asortList);
                if (data.length) {
                    redis.setFreeAssortmentListData(db.redis.write, key, data);
                }
                return data;
            }
            return mysql.getLiveClassVideoDataChapterWise(db.mysql.read, asortList);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveClassTopTeachersData(db, stClass, language) {
        try {
            const key = `LIVE_CLASS_FREE_TOP_TEACHER_${stClass}_${language}`;
            const data = await redis.getRedisDataUsingKey(db.redis.read, key);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            return [];
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveClassTeachersLatestVideo(db, facultyId) {
        try {
            let data;
            const key = `LIVE_CLASS_FREE_TEACHER_LATEST_VIDEO_${facultyId}`;

            if (config.caching) {
                data = await redis.getRedisDataUsingKey(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getLiveClassTeachersLatestVideoSql(db.mysql.read, facultyId);
                if (data.length) {
                    redis.setFreeAssortmentListData(db.redis.write, key, data);
                }
                return data;
            }
            return mysql.getLiveClassTeachersLatestVideoSql(db.mysql.read, facultyId);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveClassRecommendedVideoData(db, stClass, language) {
        try {
            const key = `LIVE_CLASS_FREE_RECOMMENDED_VIDEO_${stClass}_${language}`;
            // console.log(key);
            const data = await redis.getRedisDataUsingKey(db.redis.read, key);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            return [];
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveClassTopTopicsWidgetData(db, stClass, language) {
        try {
            const key = `LIVE_CLASS_FREE_RECOMMENDED_TOPICS_${stClass}_${language}`;
            // console.log(key);
            const data = await redis.getRedisDataUsingKey(db.redis.read, key);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            return [];
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFacultyPriorityByClassAndLocale(db, studentClass, locale) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFacultyPriorityByClassAndLocale(db.redis.read, studentClass, locale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getFacultyPriorityByClassAndLocale(db.mysql.read, studentClass, locale);
            if (data.length) {
                await redis.setFacultyPriorityByClassAndLocale(db.redis.write, studentClass, locale, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getPracticeEnglishBottomSheetData(db) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getPracticeEnglishBottomsheetData(db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getPracticeEnglishBottomSheetData(db.mysql.read);
                if (data.length) {
                    redis.setPracticeEnglishBottomsheetData(db.redis.write, data);
                }
                return data;
            }
            return mysql.getPracticeEnglishBottomSheetData(db.mysql.read);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getSubjectAssortmentByQid(db, resourceReference) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getSubjectAssortmentByQid(db.redis.read, resourceReference);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getSubjectAssortmentByQid(db.mysql.read, resourceReference);
                if (data.length) {
                    redis.setSubjectAssortmentByQid(db.redis.write, data, resourceReference);
                }
                return data;
            }
            return mysql.getSubjectAssortmentByQid(db.mysql.read, resourceReference);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getClassLocaleAssortments(db, studentClass, studentLocale) {
        try {
            let data;
            if (config.caching) {
                const key = `CLASS_LOCALE:${studentClass}:${studentLocale}`;
                data = await redis.getClassLocaleAssortments(db.redis.read, studentClass, studentLocale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, key)) {
                    return [];
                }
                await redisUtility.setCacheHerdingKeyNew(db.redis.write, key);
                data = await mysql.getClassLocaleAssortments(db.mysql.read, studentClass, studentLocale);
                await redisUtility.removeCacheHerdingKeyNew(db.redis.write, key);
                if (data.length) {
                    redis.setClassLocaleAssortments(db.redis.write, data, studentClass, studentLocale);
                }
                return data;
            }
            return mysql.getClassLocaleAssortments(db.mysql.read, studentClass, studentLocale);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getSubjectsListWithTeachersByCourseAssortment(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getSubjectsListWithTeachersByCourseAssortment(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getSubjectsListWithTeachersByCourseAssortment(db.mysql.read, assortmentId);
                if (data.length) {
                    redis.setSubjectsListWithTeachersByCourseAssortment(db.redis.write, data, assortmentId);
                }
                return data;
            }
            return mysql.getSubjectsListWithTeachersByCourseAssortment(db.mysql.read, assortmentId);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLatestLFVideoChapterWise(db, stClass, language, chapter) {
        try {
            let data;
            const key = `LATEST_LF_VIDEO_BY_CHPATER_${stClass}_${language}_${chapter}`;
            if (config.caching) {
                data = await redis.getRedisDataUsingKey(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getLatestLFVideoChapterWiseSql(db.mysql.read, stClass, language, chapter);
                if (data.length) {
                    redis.setRedisDataUsingKey(db.redis.write, key, data);
                }
                return data;
            }
            return mysql.getLatestLFVideoChapterWiseSql(db.mysql.read, stClass, language, chapter);
        } catch (e) {
            console.log(e);
        }
    }

    static async getVideoPageCarousels(db, studentClass) {
        try {
            let data;
            const key = `videopage:carousel:class:${studentClass}`;
            if (config.caching) {
                data = await redis.getRedisDataUsingKey(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, key)) {
                    return [];
                }
                await redisUtility.setCacheHerdingKeyNew(db.redis.write, key);
                data = await mysql.getVideoPageCarousels(db.mysql.read, studentClass);
                await redisUtility.removeCacheHerdingKeyNew(db.redis.write, key);
                if (data.length) {
                    redis.setRedisDataUsingKey(db.redis.write, key, data);
                }
                return data;
            }
            return mysql.getVideoPageCarousels(db.mysql.read, studentClass);
        } catch (e) {
            console.log(e);
        }
    }

    static async getTopFreeClassesBySubjectClassLocaleChapter(db, subject, classId, locale, chapter) {
        let data;
        if (config.caching) {
            data = await redis.getTopFreeClassesBySubjectClassLocaleChapter(db.redis.read, subject, classId, locale, chapter);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysql.getTopFreeClassesBySubjectClassLocaleChapter(db.mysql.read, subject, classId, locale, chapter);
            redis.setTopFreeClassesBySubjectClassLocaleChapter(db.redis.read, subject, classId, locale, chapter, data);
            return data;
        }
        data = mysql.getTopFreeClassesBySubjectClassLocaleChapter(db.mysql.read, subject, classId, locale, chapter);
    }

    static async getTopFreeClassesBySubjectClassLocaleChapters(db, subject, classId, locale, chapters) {
        const promises = [];
        chapters.forEach((chapter) => {
            promises.push(this.getTopFreeClassesBySubjectClassLocaleChapter(db, subject, classId, locale, chapter));
        });
        const resolvedPromises = await Promise.all(promises);
        return _.uniqBy(_.flatten(resolvedPromises), 'question_id');
    }

    static async getAssortmentDetails(db, assortmentId) {
        try {
            let data;
            const key = `LIVECLASS_ASSORTMENT_DATA_${assortmentId}`;
            if (config.caching) {
                data = await redis.getDataByKey(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getAssortmentDetails(db.mysql.read, assortmentId);
            redis.setDataByKey(db.redis.write, key, data, 60 * 60 * 4);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getExploreCampaignCarouselData(db, sql, carouselId) {
        try {
            let data;
            const key = `explore:${carouselId}`;
            if (config.caching) {
                data = await redis.getRedisDataUsingKey(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, key)) {
                    return [];
                }
                await redisUtility.setCacheHerdingKeyNew(db.redis.write, key);
                data = await db.mysql.read.query(sql);
                await redisUtility.removeCacheHerdingKeyNew(db.redis.write, key);
                if (data.length) {
                    redis.setRedisDataUsingKey(db.redis.write, key, data);
                }
                return data;
            }
            return db.mysql.read.query(sql);
        } catch (e) {
            console.log(e);
        }
    }

    static async getTGAds(db, tgID) {
        let data = [];
        try {
            if (config.caching) {
                data = await redis.getTGAds(db.redis.read, tgID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await packageMysql.getTG(db.mysql.read, tgID);
            if (data.length) {
                redis.setTGAds(db.redis.write, tgID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            return data;
        }
    }

    static async getByTypeAndEvent(db, type, event, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getByTypeAndEvent(db.redis.read, type, event, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await NudgeMysql.getByTypeAndEvent(db.mysql.read, type, event, studentClass);
                if (data.length) {
                    redis.setByTypeAndEvent(db.redis.write, type, event, studentClass, data);
                }
                return data;
            }
            return NudgeMysql.getByTypeAndEvent(db.mysql.read, type, event, studentClass);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getCourseCampNotifData(db, studentID) {
        try {
            let data;
            const key = `COURSE_NOTIFICATION:${studentID}`;
            const field = 'csm_data';
            if (config.caching) {
                data = await redis.getCourseNotificationData(db.redis.read, key, field);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCourseCampNotifData(db.mysql.read, studentID);
            redis.setCourseNotificationData(db.redis.write, key, field, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getPostQuizDetails(db, resourceReference) {
        try {
            let data;
            const key = `lcl:${resourceReference}`;
            if (config.caching) {
                data = await redis.getRedisDataUsingKey(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, key)) {
                    return [];
                }
                await redisUtility.setCacheHerdingKeyNew(db.redis.write, key);
                data = await mysql.getPostQuizDetails(db.mysql.read, resourceReference);
                await redisUtility.removeCacheHerdingKeyNew(db.redis.write, key);
                if (data.length) {
                    redis.setRedisDataUsingKey(db.redis.write, key, data);
                }
                return data;
            }
            return mysql.getPostQuizDetails(db.mysql.read, resourceReference);
        } catch (e) {
            console.log(e);
        }
    }

    static async getLiveStreamDetailsByQuestionID(db, questionID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getLiveStreamDetailsByQuestionID(db.redis.read, questionID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getLivestreamDetails(db.mysql.read, questionID);
            if (data.length) {
                await redis.setLiveStreamDetailsByQuestionID(db.redis.write, questionID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveClassTopTeachersDataNewClp(db, stClass, language, categoryfinal) {
        let data = [];
        try {
            const key = `lctopteachers_newclp_${stClass}_${language}_${categoryfinal}`;
            if (config.caching) {
                data = await redis.getLiveClassTopTeachersDataNewClp(db.redis.read, stClass, language, categoryfinal);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, key)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, key);
            data = await mysql.getLiveClassTopTeachersDataNewClp(db.mysql.read, stClass, language, categoryfinal);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, key);
            if (data.length) {
                redis.setLiveClassTopTeachersDataNewClp(db.redis.write, stClass, language, categoryfinal, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            return data;
        }
    }
};
