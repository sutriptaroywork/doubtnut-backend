const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/teacher');
const redis = require('../redis/teacher');
const redisUtility = require('../redis/utility.redis');

module.exports = class Student {
    static async getById(db, teacherId) {
        // eslint-disable-next-line no-async-promise-executor
        try {
            let data;
            if (config.caching) {
                data = await redis.getById(db.redis.read, teacherId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysql.getById(db.mysql.read, teacherId);
                if (data.length) {
                    redis.setById(db.redis.write, teacherId, data);
                }
                return data;
            }
            data = await mysql.getById(db.mysql.read, teacherId);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTeacherByCCMBoard(db, ccm, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTeacherByCCMBoard(db.redis.read, ccm, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getTeacherByCCMBoard(db.mysql.read, ccm, studentClass);
            if (data.length) {
                await redis.setTeacherByCCMBoard(db.redis.write, ccm, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTeacherByCCMExam(db, ccm, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTeacherByCCMExam(db.redis.read, ccm, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getTeacherByCCMExam(db.mysql.read, ccm, studentClass);
            if (data.length) {
                await redis.setTeacherByCCMExam(db.redis.write, ccm, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTeacherVideos(db, teacherId, versionCode, limit) {
        try {
            let data;
            if (config.caching) {
                if (parseInt(versionCode) < 9800) {
                    data = await redis.getTeacherVideos(db.redis.read, teacherId);
                } else {
                    data = await redis.getTeacherVideosNew(db.redis.read, teacherId);
                }
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getTeacherVideos(db.mysql.read, teacherId, versionCode, limit);
            if (data.length) {
                if (parseInt(versionCode) < 9800) {
                    await redis.setTeacherVideos(db.redis.write, teacherId, data);
                } else {
                    await redis.setTeacherVideosNew(db.redis.write, teacherId, data);
                }
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTeacherByClassLocale(db, studentClass, studentLocale) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTeacherByClassLocale(db.redis.read, studentClass, studentLocale);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getTeacherByClassLocale(db.mysql.read, studentClass, studentLocale);
            if (data.length) {
                await redis.setTeacherByClassLocale(db.redis.write, studentClass, studentLocale, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getSubsTotal(db, teacherId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getSubsTotal(db.redis.read, teacherId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getSubsTotal(db.mysql.read, teacherId);
            if (data.length) {
                await redis.setSubsTotal(db.redis.write, teacherId, parseInt(data[0].total));
            }
            return data[0].total;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTeacherVideoLikeStats(db, questionId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTeacherVideoLikeStats(db.redis.read, questionId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getTeacherVideoLikeStats(db.mysql.read, questionId);
            if (data.length) {
                await redis.setTeacherVideoLikeStats(db.redis.write, questionId, data[0].total);
            }
            return data[0].total;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTeacherVideoDislikeStats(db, questionId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTeacherVideoDislikeStats(db.redis.read, questionId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getTeacherVideoDislikeStats(db.mysql.read, questionId);
            if (data.length) {
                await redis.setTeacherVideoDislikeStats(db.redis.write, questionId, data[0].total);
            }
            return data[0].total;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTeacherVideoShareStats(db, questionId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTeacherVideoShareStats(db.redis.read, questionId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getTeacherVideoShareStats(db.mysql.read, questionId);
            if (data.length) {
                await redis.setTeacherVideoShareStats(db.redis.write, questionId, data[0].total);
            }
            return data[0].total;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDistinctSubjectsByTeacherAndClass(db, teacherId, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getDistinctSubjectsByTeacherAndClass(db.redis.read, teacherId, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `TEACHER:SUBJECTS:${teacherId}:${studentClass}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getDistinctSubjectsByTeacherAndClass(db.mysql.read, teacherId, studentClass);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setDistinctSubjectsByTeacherAndClass(db.redis.write, teacherId, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getInternalDistinctSubjectsByTeacherAndClass(db, teacherId, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getInternalDistinctSubjectsByTeacherAndClass(db.redis.read, teacherId, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `INTERNAL_TEACHER:SUBJECTS:${teacherId}:${studentClass}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getInternalDistinctSubjectsByTeacherAndClass(db.mysql.read, studentClass, teacherId);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setInternalDistinctSubjectsByTeacherAndClass(db.redis.write, teacherId, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFreeCourseAndFacultyByClass(db, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFreeCourseAndFacultyByClass(db.redis.read, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `INTERNAL:TEACHERS:${studentClass}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getFreeCourseAndFacultyByClass(db.mysql.read, studentClass);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setFreeCourseAndFacultyByClass(db.redis.write, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getAssortmentDetails(db, assortmentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAssortmentDetails(db.redis.read, assortmentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `INTERNAL:TEACHERS:ASSORTMENT:${assortmentId}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getAssortmentDetails(db.mysql.read, assortmentId);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setAssortmentDetails(db.redis.write, assortmentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getSubsTotalInternal(db, teacherId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getSubsTotalInternal(db.redis.read, teacherId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `INTERNAL:TEACHER:SUBSTOTAL:${teacherId}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getSubsTotalInternal(db.mysql.read, teacherId);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setSubsTotalInternal(db.redis.write, teacherId, data[0].total);
            }
            return data[0].total;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTeacherVideosInternal(db, teacherId, studentClass, limit) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTeacherVideosInternal(db.redis.read, teacherId, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `INTERNAL:TEACHER:VIDEOS:${teacherId}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getTeacherVideosInternal(db.mysql.read, teacherId, studentClass, limit);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setTeacherVideosInternal(db.redis.write, teacherId, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async checkTeacherIsInternal(db, teacherId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.checkTeacherIsInternal(db.redis.read, teacherId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `INTERNAL:TEACHER:DETAILS:${teacherId}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.checkTeacherIsInternal(db.mysql.read, teacherId);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setTeacherIsInternal(db.redis.write, teacherId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDinstinctSubjectAppInternal(db, teacherId, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getDinstinctSubjectAppInternal(db.redis.read, teacherId, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `INTERNAL:TEACHER:SUBJECT:${teacherId}:${studentClass}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getDinstinctSubjectAppInternal(db.mysql.read, teacherId, studentClass);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setDinstinctSubjectAppInternal(db.redis.write, teacherId, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDinstinctCategoriesAppInternal(db, teacherId, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getDinstinctCategoriesAppInternal(db.redis.read, teacherId, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `INTERNAL:TEACHER:CATEGORY:${teacherId}:${studentClass}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getDinstinctCategoriesAppInternal(db.mysql.read, teacherId, studentClass);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setDinstinctCategoriesAppInternal(db.redis.write, teacherId, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDistinctTeachingDetails(db, teacherId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getDistinctTeachingDetails(db.redis.read, teacherId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = `INTERNAL:TEACHER:TEACHINGDETAILS:${teacherId}`;
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getDistinctTeachingDetails(db.mysql.read, teacherId);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            if (data.length) {
                await redis.setDistinctTeachingDetails(db.redis.write, teacherId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
};
