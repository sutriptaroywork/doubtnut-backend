/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const moment = require('moment');
const config = require('../../config/config');
// const LiveclassHelper = require('../../server/helpers/liveclass');
const LiveclassMysql = require('../mysql/liveclass');
const CourseContainerV2 = require('./coursev2');
const StudentContainer = require('./student');
const mysql = require('../mysql/course');
const CourseMysqlV2 = require('../mysql/coursev2');
const liveclassmysql = require('../mysql/liveclass');
const redis = require('../redis/course');
const CourseRedisV2 = require('../redis/coursev2');
const Utility = require('../utility');
const Data = require('../../data/data');
const PackageContainer = require('./package');
const trialMysql = require('../mysql/trail');
const newtonNotifications = require('../newtonNotifications');
const packageMysql = require('../mysql/package');

// const redis = require("../redis/icons")
module.exports = class Course {
    static async getCaraousels(db, ecmId, locale, page, limit, studentClass) {
        // first try to get from redis
        // return new Promise(async function (resolve, reject) {
        try {
            let data;
            if (0) {
                data = await mysql.getCaraousels(db.mysql.read, ecmId, locale, page, limit, studentClass);
            } else {
                // console.log(" not exist")
                data = await mysql.getCaraousels(db.mysql.read, ecmId, locale, page, limit, studentClass);
                // console.log("mysql data")
                // console.log(data)
                return data;
            }
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
        // })
    }

    static async getCaraouselsWithAppVersionCode(db, ecmId, locale, page, limit, studentClass, versionCode) {
        // first try to get from redis
        // return new Promise(async function (resolve, reject) {
        try {
            let data;
            if (0) {
                data = await mysql.getCaraouselsWithAppVersionCode(db.mysql.read, ecmId, locale, page, limit, studentClass);
            } else {
                // console.log(" not exist")
                data = await mysql.getCaraouselsWithAppVersionCode(db.mysql.read, ecmId, locale, page, limit, studentClass, versionCode);
                // console.log("mysql data")
                // console.log(data)
                return data;
            }
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
        // })
    }

    static async getFacultyDetails(db, faculty_id) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getFacultyDetails(db.redis.read, faculty_id);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await mysql.getFacultyDetails(db.mysql.read, faculty_id);
                if (data.length) {
                    await redis.setFacultyDetails(db.redis.write, faculty_id, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getChapterDetails(db, faculty_id, ecm_id) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (0) {
                    data = await redis.getChapterDetails(db.redis.read, faculty_id, ecm_id);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await mysql.getChapterDetails(db.mysql.read, faculty_id, ecm_id);
                if (data.length) {
                    await redis.setChapterDetails(db.redis.write, faculty_id, ecm_id, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getChapterDetailsV2(db, facultyId, ecmId) {
        // first try to get from redis
        try {
            let data;
            if (config.caching) {
                data = await redis.getChapterDetailsV2(db.redis.read, facultyId, ecmId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getChapterDetailsV2(db.mysql.read, facultyId, ecmId);
            if (data.length) {
                await redis.setChapterDetailsV2(db.redis.write, facultyId, ecmId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getFacultyDetailsUsingChapterId(db, chapterId) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getFacultyDetailsUsingChapterId(db.redis.read, chapterId);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await mysql.getFacultyDetailsUsingChapterId(db.mysql.read, chapterId);
                if (data.length) {
                    await redis.setFacultyDetailsUsingChapterId(db.redis.write, chapterId, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getFacultyDetailsUsingChapterIdV2(db, chapterId, studentClass) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getFacultyDetailsUsingChapterIdV2(db.redis.read, chapterId, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getFacultyDetailsUsingChapterIdV2(db.mysql.read, chapterId, studentClass);
            if (data.length) {
                await redis.setFacultyDetailsUsingChapterIdV2(db.redis.write, chapterId, studentClass, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLectures(db, chapterId) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getLectures(db.redis.read, chapterId);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await await mysql.getLectures(db.mysql.read, chapterId);
                if (data.length) {
                    await redis.setLectures(db.redis.write, chapterId, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getAllMasterChapters(db, ecm_id, studentClass, subject) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (0) {
                    data = await redis.getAllMasterChapters(db.redis.read, ecm_id, studentClass, subject);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await mysql.getAllMasterChapters(db.mysql.read, ecm_id, studentClass, subject);
                if (data.length) {
                    await redis.setAllMasterChapters(db.redis.write, ecm_id, studentClass, subject, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getAllMasterChaptersEtoos(db, ecm_id, studentClass, subject) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (0) {
                    data = await redis.getAllMasterChaptersEtoos(db.redis.read, ecm_id, studentClass, subject);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await mysql.getAllMasterChaptersEtoos(db.mysql.read, ecm_id, studentClass, subject);
                if (data.length) {
                    await redis.setAllMasterChaptersEtoos(db.redis.write, ecm_id, studentClass, subject, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getAllMasterChaptersEtoosV1(db, ecm_id, studentClass, subject) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (0) {
                    data = await redis.getAllMasterChaptersEtoosV1(db.redis.read, ecm_id, studentClass, subject);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await mysql.getAllMasterChaptersEtoosV1(db.mysql.read, ecm_id, studentClass, subject);
                if (data.length) {
                    await redis.setAllMasterChaptersEtoosV1(db.redis.write, ecm_id, studentClass, subject, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getDfcData(data) {
        const {
            db,
            ecmId,
            limit,
            studentClass,
        } = data;
        try {
            let data;
            if (0) {
                // data = await mysql.getCaraousels(db.mysql.read, ecmId, locale, page, limit);
            } else {
                // console.log(" not exist")
                data = await mysql.getDfcData({
                    database: db.mysql.read,
                    ecmId,
                    limit,
                    studentClass,
                });
                // console.log("mysql data")
                // console.log(data)
                return data;
            }
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
        // })
    }

    static async getTopFacultyFromLectureId(db, lecture_id) {
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (0) {
                    data = await redis.getTopFacultyFromLectureId(db.redis.read, lecture_id);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await mysql.getTopFacultyFromLectureId(db.mysql.read, lecture_id);
                if (data.length) {
                    await redis.setTopFacultyFromLectureId(db.redis.write, lecture_id, data);
                }
                resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getLectureIdFromQuestionId(db, questionId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getLectureIdFromQuestionId(db.redis.read, questionId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getLectureIdFromQuestionId(db.mysql.read, questionId);
            if (data.length) {
                await redis.setLectureIdFromQuestionId(db.redis.write, questionId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async checkForDemo(db, question_id) {
        try {
            let data;
            if (0) {
                data = await mysql.checkForDemo(db.mysql.read, question_id);
            } else {
                data = await mysql.checkForDemo(db.mysql.read, question_id);
            }
            return data;
        } catch (e) {
            throw new Error(e);
        }
    }

    static async getChapterDetailsUsingChapterId(db, chapterId) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getChapterDetailsUsingChapterId(db.redis.read, chapterId);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await mysql.getChapterDetailsUsingChapterId(db.mysql.read, chapterId);
                if (data.length) {
                    await redis.setChapterDetailsUsingChapterId(db.redis.write, chapterId, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getEResourcesFromChapterId(db, chapterId) {
        // first try to get from redis
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (0) {
                    data = await redis.getEResourcesFromChapterId(db.redis.read, chapterId);
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data));
                    }
                }
                data = await mysql.getEResourcesFromChapterId(db.mysql.read, chapterId);
                if (data.length) {
                    await redis.setEResourcesFromChapterId(db.redis.write, chapterId, data);
                }
                return resolve(data);
            } catch (e) {
                console.log(e);
                throw new Error(e);
            }
        }));
    }

    static async getEcmByIdAndClass(db, ecmId, studentClass) {
        // first try to get from redis
        // Do async job
        try {
            let data;
            if (config.caching) {
                data = await redis.getEcmByIdAndClass(db.redis.read, ecmId, studentClass);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getEcmByIdAndClass(db.mysql.read, ecmId, studentClass);
            if (data.length) {
                await redis.setEcmByIdAndClass(db.redis.write, ecmId, studentClass, data);
            }
            return data;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getFacultyGrid(data) {
        const {
            db,
            ecmId,
            studentClass,
        } = data;
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getFacultyGrid(db.redis.read, ecmId, studentClass);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getFacultyGrid(db.mysql.read, ecmId, studentClass);
            if (dataToReturn.length) {
                await redis.setFacultyGrid(db.redis.write, ecmId, studentClass, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getFacultyGridBySubject(data) {
        const {
            db,
            ecmId,
            studentClass,
            subject,
        } = data;
        try {
            let dataToReturn;
            if (0) {
                dataToReturn = await redis.getFacultyGridBySubject(db.redis.read, ecmId, studentClass, subject);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getFacultyGridBySubject(db.mysql.read, ecmId, studentClass, subject);
            if (dataToReturn.length) {
                await redis.setFacultyGridBySubject(db.redis.write, ecmId, studentClass, subject, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getTopCourses(data) {
        const {
            db,
            ecmId,
            studentClass,
        } = data;
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getTopCourses(db.redis.read, ecmId, studentClass);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getTopCourses(db.mysql.read, ecmId, studentClass);
            if (dataToReturn.length) {
                await redis.setTopCourses(db.redis.write, ecmId, studentClass, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getPopularCourses(data) {
        const {
            db,
            ecmId,
            studentClass,
        } = data;
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getPopularCourses(db.redis.read, ecmId, studentClass);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getPopularCourses(db.mysql.read, ecmId, studentClass);
            if (dataToReturn.length) {
                await redis.setPopularCourses(db.redis.write, ecmId, studentClass, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getCourseList(data) {
        const {
            db,
            ecmId,
            studentClass,
            subject,
            page,
        } = data;
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getCourseList(db.redis.read, ecmId, studentClass, subject, page);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getCourseList(db.mysql.read, ecmId, studentClass, subject, page);
            if (dataToReturn.length) {
                await redis.setCourseList(db.redis.write, ecmId, studentClass, subject, page, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getDistinctSubject(data) {
        const {
            db,
            ecmId,
            studentClass,
        } = data;
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getDistinctSubject(db.redis.read, ecmId, studentClass);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getDistinctSubject(db.mysql.read, ecmId, studentClass);
            if (dataToReturn.length) {
                await redis.setDistinctSubject(db.redis.write, ecmId, studentClass, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getStructuredFreeCourse(data) {
        const {
            db,
            ecmId,
            studentClass,
        } = data;
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getStructuredFreeCourse(db.redis.read, ecmId, studentClass);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getStructuredFreeCourse(db.mysql.read, ecmId, studentClass);
            if (dataToReturn.length) {
                await redis.setStructuredFreeCourse(db.redis.write, ecmId, studentClass, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getAllStructuredCourse(data) {
        const {
            db,
            ecmId,
            studentClass,
            subject,
        } = data;
        try {
            let dataToReturn;
            if (0) {
                dataToReturn = await redis.getAllStructuredCourse(db.redis.read, ecmId, studentClass, subject);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getAllStructuredCourse(db.mysql.read, ecmId, studentClass, subject);
            if (dataToReturn.length) {
                await redis.setAllStructuredCourse(db.redis.write, ecmId, studentClass, subject, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getAllStructuredCourseV2(data) {
        const {
            db,
            ecmId,
            studentClass,
            subject,
        } = data;
        try {
            let dataToReturn;
            if (0) {
                dataToReturn = await redis.getAllStructuredCourseV2(db.redis.read, ecmId, studentClass, subject);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getAllStructuredCourseV2(db.mysql.read, ecmId, studentClass, subject);
            if (dataToReturn.length) {
                await redis.setAllStructuredCourseV2(db.redis.write, ecmId, studentClass, subject, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getCoursesByFaculty(data) {
        const {
            db,
            ecmId,
            studentClass,
            facultyId,
        } = data;
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getCoursesByFaculty(db.redis.read, ecmId, studentClass, facultyId);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getCoursesByFaculty(db.mysql.read, ecmId, studentClass, facultyId);
            if (dataToReturn.length) {
                await redis.setCoursesByFaculty(db.redis.write, ecmId, studentClass, facultyId, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getSyllabusByFaculty(data) {
        const {
            db,
            ecmId,
            studentClass,
            facultyId,
        } = data;
        try {
            let dataToReturn;
            if (0) {
                dataToReturn = await redis.getSyllabusByFaculty(db.redis.read, ecmId, studentClass, facultyId);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getSyllabusByFaculty(db.mysql.read, ecmId, studentClass, facultyId);
            if (dataToReturn.length) {
                await redis.setSyllabusByFaculty(db.redis.write, ecmId, studentClass, facultyId, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getLiveSectionVideos(data) {
        const {
            db,
            ecmId,
            studentClass,
            subject,
        } = data;
        try {
            let dataToReturn;
            if (0) {
                dataToReturn = await redis.getLiveSectionVideos(db.redis.read, ecmId, studentClass, subject);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getLiveSectionVideos(db.mysql.read, ecmId, studentClass, subject);
            if (dataToReturn.length) {
                await redis.setLiveSectionVideos(db.redis.write, ecmId, studentClass, subject, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getTestimonials(data) {
        const {
            db,
        } = data;
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getTestimonials(db.redis.read);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getTestimonials(db.mysql.read);
            if (dataToReturn.length) {
                await redis.setTestimonials(db.redis.write, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getRandomSubsViews(data) {
        const {
            db,
            type,
            id,
        } = data;
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getRandomSubsViews(db.redis.read, type, id);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = {};
            dataToReturn.subs = Utility.getRandomInt(100000, 200000);
            dataToReturn.views = Utility.getRandomInt(50, 100);
            await redis.setRandomSubsViews(db.redis.write, type, id, dataToReturn);
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getPromoSection(db, ecmId) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getPromoSection(db.redis.read, ecmId);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getPromoSection(db.mysql.read, ecmId);
            if (dataToReturn.length) {
                await redis.setPromoSection(db.redis.write, ecmId, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getSubscribers(db, resourceId) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getSubscribers(db.redis.read, resourceId);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await liveclassmysql.getSubscribers(db.mysql.read, resourceId);
            if (dataToReturn.length) {
                await redis.setSubscribers(db.redis.write, resourceId, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getViewSubscribers(db, resourceId) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getViewSubscribers(db.redis.read, resourceId);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await liveclassmysql.getViewSubscribers(db.mysql.read, resourceId);
            if (dataToReturn.length) {
                await redis.setViewSubscribers(db.redis.write, resourceId, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static replaceChar(origString, replaceC, index) {
        const firstPart = origString.substr(0, index);
        const lastPart = origString.substr(index + 1);
        const newString = firstPart + replaceC + lastPart;
        return newString;
    }

    static replaceWithHash(mobile) {
        if (_.isNull(mobile)) {
            return '######0000';
        }
        for (let i = 0; i < mobile.length; i++) {
            if (i < mobile.length - 4) {
                mobile = this.replaceChar(mobile, '#', i);
            }
        }
        return mobile;
    }

    static async getAllCourse(db) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getAllCourse(db.redis.read);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await LiveclassMysql.getAllCourseV2(db.mysql.read);
            if (dataToReturn.length) {
                await redis.setAllCourse(db.redis.write, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getPerviosContestWinner(db, date) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await CourseRedisV2.getPerviosContestWinner(db.redis.read, date);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await CourseMysqlV2.getPerviosContestWinner(db.mysql.read, date);
            if (dataToReturn.length) {
                await CourseRedisV2.setPerviosContestWinner(db.redis.write, date, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static generateLeaderBoardV2(leaderBoardList, courseID, previousWinnerList) {
        // console.log('previousWinnerList')
        // console.log(previousWinnerList)
        const leaderBoard = [];
        const studentArr = [];
        const pointsArr = [];
        for (let i = 0; i < leaderBoardList.length; i++) {
            if (typeof previousWinnerList[leaderBoardList[i]] === 'undefined') {
                if (i % 2 === 0) {
                    studentArr.push(leaderBoardList[i]);
                } else {
                    pointsArr.push(leaderBoardList[i]);
                }
            }
        }
        for (let i = 0; i < studentArr.length; i++) {
            const obj = {};
            obj.rank = i + 1;
            obj.student_id = parseInt(studentArr[i]);
            obj.points = parseInt(pointsArr[i]);
            obj.course_id = courseID;
            leaderBoard.push(obj);
        }
        return leaderBoard;
    }

    static async getFastestCorrect(db, studentID, date) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getFastestAnswer(db.redis.read, studentID, date);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getFastestAnswer(db.mysql.read, studentID, date);
            if (dataToReturn.length) {
                await redis.setFastestAnswer(db.redis.write, studentID, date, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getLeaderBoard(db, courseID, date, courseList, slicedCount, previousWinnerList) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getLeaderBoard(db.redis.read, courseID, date, slicedCount);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            const totalLeaderBoard = [];
            const doneSid = {};
            for (let i = 0; i < courseList.length; i++) {
                const leaderBoardList = await redis.getLeaderboardByDateAndCourse(db.redis.read, date, courseList[i].course_id, 0, 250);
                // console.log(courseList[i].course_id);
                // console.log(leaderBoardList);
                totalLeaderBoard.push(this.generateLeaderBoardV2(leaderBoardList, courseList[i].course_id, previousWinnerList));
            }
            const groupedFinalLeaderBoard = {};
            groupedFinalLeaderBoard[courseID] = [];
            // being cached for 2 min
            for (let i = 0; i < totalLeaderBoard.length; i++) {
                if (totalLeaderBoard[i].length > 0) {
                    if (courseID == totalLeaderBoard[i][0].course_id) {
                        for (let j = 0; j < totalLeaderBoard[i].length; j++) {
                            let notPush = false;
                            for (let k = 0; k < totalLeaderBoard.length; k++) {
                                if (i !== k) {
                                    for (let l = 0; l < totalLeaderBoard[k].length; l++) {
                                        if (typeof doneSid[totalLeaderBoard[i][j].student_id] !== 'undefined') {
                                            notPush = true;
                                        }
                                        if (totalLeaderBoard[i][j].student_id === totalLeaderBoard[k][l].student_id && typeof doneSid[totalLeaderBoard[i][j].student_id] === 'undefined') {
                                            const sid = totalLeaderBoard[i][j].student_id;
                                            if (totalLeaderBoard[i][j].points < totalLeaderBoard[k][l].points) {
                                                notPush = true;
                                            }
                                            if (totalLeaderBoard[i][j].points === totalLeaderBoard[k][l].points) {
                                                // tie breaker
                                                const courseArr = [totalLeaderBoard[i][j].course_id, totalLeaderBoard[k][l].course_id];
                                                const recent = await CourseContainerV2.getRecentCorrect(db, sid, courseArr, date);
                                                let ind = 0;
                                                courseArr.filter((item, index) => {
                                                    // if (recent.length > 0) {
                                                    if (item === recent) {
                                                        ind = index;
                                                        return true;
                                                    }
                                                    // }
                                                    // return false;
                                                });
                                                if (ind === 1) {
                                                    notPush = true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if (!notPush) {
                                doneSid[totalLeaderBoard[i][j].student_id] = true;
                                groupedFinalLeaderBoard[courseID].push(totalLeaderBoard[i][j]);
                            }
                        }
                    }
                }
            }
            const anAsyncFunction = async (item, index) => {
                // return functionWithPromise(item)
                const studentDetails = await StudentContainer.getById(item.student_id, db);
                return {
                    rank: index + 1,
                    student_id: parseInt(item.student_id),
                    username: studentDetails[0].student_fname ? studentDetails[0].student_fname : studentDetails[0].student_username,
                    avatar: studentDetails[0].img_url,
                    mobile: this.replaceWithHash(studentDetails[0].mobile),
                    points: parseInt(item.points),
                    hexcode: (index < 13) ? '#000000' : '#808080',
                };
            };
            const getData = async () => Promise.all(groupedFinalLeaderBoard[courseID].map((item, index) => anAsyncFunction(item, index)));
            dataToReturn = await getData();
            let finalLeader = [];
            // re order
            const groupedByPoints = _.groupBy(dataToReturn, 'points');
            // return groupedByPoints
            for (const key in groupedByPoints) {
                if (Object.prototype.hasOwnProperty.call(groupedByPoints, key)) {
                    const item = groupedByPoints[key];
                    finalLeader = [..._.sortBy(item, (dateObj) => new Date(dateObj.fastest)), ...finalLeader];
                }
            }
            // return finalLeader;
            finalLeader = finalLeader.splice(0, (slicedCount !== 0) ? slicedCount : finalLeader.length);
            for (let i = 0; i < finalLeader.length; i++) {
                finalLeader[i].rank = i + 1;
                finalLeader[i].hexcode = (i + 1 < 14) ? '#000000' : '#808080';
            }
            if (finalLeader.length && config.caching) {
                await redis.setLeaderBoard(db.redis.read, courseID, date, slicedCount, finalLeader);
            }
            return finalLeader;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getLiveSectionHome(db, coursesId, courseType, subject, studentClass) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getLiveSectionHome(db.redis.read, coursesId, courseType, subject, studentClass);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await LiveclassMysql.getLiveSectionHome(db.mysql.read, coursesId, courseType, subject, studentClass);
            if (dataToReturn.length) {
                await redis.setLiveSectionHome(db.redis.write, coursesId, courseType, subject, studentClass, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getAssortmentIDFromCcm(db, ccmArray, studentClass, userLocale) {
        let dataToReturn;
        if (config.caching) {
            dataToReturn = await redis.getAssortmentIDFromCcm(db.redis.read, ccmArray, studentClass, userLocale);
            if (!_.isNull(dataToReturn)) {
                return JSON.parse(dataToReturn);
            }
        }
        dataToReturn = await mysql.getAssortmentIDFromCcm(db.mysql.read, ccmArray, studentClass, userLocale);
        if (dataToReturn.length) {
            await redis.setAssortmentIDFromCcm(db.redis.write, ccmArray, studentClass, userLocale, dataToReturn);
        }
        return dataToReturn;
    }

    static async getReferralV2RedmiWinners(db) {
        try {
            const count = await redis.getReferralV2RedmiWinners(db.redis.read);
            if (!_.isNull(count)) {
                return count;
            }
            const winnerCount = Math.floor(Math.random() * (15 - 5 + 1) + 5);
            await redis.setReferralV2RedmiWinners(db.redis.read, winnerCount);
            return winnerCount;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getAssortmentIDFromClass(db, studentClass = 12, userLocale) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getAssortmentIDFromClass(db.redis.read, studentClass, userLocale);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getAssortmentIDFromClass(db.mysql.read, studentClass, userLocale);
            if (dataToReturn.length) {
                await redis.setAssortmentIDFromClass(db.redis.write, studentClass, userLocale, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    // trial for students of english locale based on ccmId
    static async giveTrial(db, sid) {
        const studentPackages = await packageMysql.getAllStudentPackage(db.mysql.read, sid);
        if (!studentPackages.length) {
            trialMysql.insertTrialStudents(db.mysql.write, sid);
        }
    }

    static getPaymentCardStateV2({
        data,
        flagrResponse = {},
        courseType,
        categoryID,
    }) {
        let isVip = false;
        let isTrial = false;
        let remainingDays = 0;
        let is_remaining_upated = false;
        let lastFiveDaysVip = 0;
        const variantId = (typeof flagrResponse.variantID === 'undefined') ? '0' : flagrResponse.variantID;
        const trialDuration = (typeof flagrResponse.variantAttachment === 'undefined') ? '0' : flagrResponse.variantAttachment.trial_duration;
        let expiredTrial = false;
        let expiredVip = false;
        let packageDetails = null;
        const momentNow = moment().add(5, 'hours').add(30, 'minutes');
        let noTrial = true;
        categoryID = parseInt(categoryID);
        for (let i = 0; i < data.length; i++) {
            const momentEnd = moment(data[i].end_date);
            // active pack part
            if ((data[i].category_id === categoryID) && (momentNow.isAfter(data[i].start_date)) && momentNow.isBefore(data[i].end_date) && data[i].sub_active) {
                noTrial = false;
                if (data[i].course_type == courseType) {
                    if (!is_remaining_upated) {
                        remainingDays = momentEnd.diff(momentNow, 'days');
                        is_remaining_upated = true;
                    }
                    if (data[i].amount === -1.00) {
                        // trial user
                        isTrial = true;
                    } else if (remainingDays < 5) {
                        lastFiveDaysVip = true;
                    }
                    isVip = true;
                    expiredVip = false;
                    packageDetails = data[i];
                }
                if (data[i].course_type === 'all') {
                    isVip = true;
                    if (!is_remaining_upated) {
                        remainingDays = momentEnd.diff(momentNow, 'days');
                        is_remaining_upated = true;
                    }
                    if (data[i].amount === -1.00) {
                        // trial user
                        isTrial = true;
                    } else if (remainingDays < 5) {
                        lastFiveDaysVip = true;
                    }
                    if (_.isNull(packageDetails)) {
                        packageDetails = data[i];
                    }
                }
            }
            if (data[i].amount === -1.00 && momentEnd < momentNow && (data[i].category_id === categoryID)) {
                noTrial = false;
                if (data[i].amount === -1.00) {
                    expiredTrial = true;
                }
            }
            if (!isVip && data[i].amount !== -1.00 && (data[i].course_type === courseType) && (data[i].category_id === categoryID)) {
                noTrial = false;
                expiredVip = true;
                packageDetails = data[i];
            }
        }
        // never vip and trial ever
        const neverVipAndTrial = noTrial;// (data.length === 0);
        if (neverVipAndTrial) {
            return {
                message: Data.neverVipAndTrialMessageFn(trialDuration),
                isVip,
                isTrial,
                remainingDays,
                variantId,
                expiredTrial,
                expiredVip,
                packageDetails,
                noTrial,
            };
        }
        // trial expired and no vip
        if (expiredTrial) {
            if (lastFiveDaysVip) {
                return {
                    message: Data.lastFiveDaysVipMessage(remainingDays),
                    isVip: true,
                    isTrial,
                    remainingDays,
                    variantId,
                    expiredTrial,
                    expiredVip,
                    packageDetails,
                };
            }
            if (expiredVip) {
                return {
                    message: Data.expiredVipMessage,
                    isVip,
                    isTrial,
                    remainingDays,
                    variantId,
                    expiredTrial,
                    expiredVip,
                    packageDetails,
                };
            }
            if (isVip) {
                return {
                    message: Data.vipMessage,
                    isVip,
                    isTrial,
                    remainingDays,
                    variantId,
                    expiredTrial,
                    expiredVip,
                    packageDetails,
                };
            }
            return {
                message: Data.everTrialUsedNoVipMessage,
                isVip,
                isTrial,
                remainingDays,
                variantId,
                expiredTrial,
                expiredVip,
                packageDetails,
            };
        }
        // user is in Trial
        if (isTrial) {
            return {
                message: Data.trialMessage(remainingDays),
                isVip: true,
                isTrial,
                remainingDays,
                variantId,
                expiredTrial,
                expiredVip,
                packageDetails,
            };
        }
        if (lastFiveDaysVip) {
            return {
                message: Data.lastFiveDaysVipMessage(remainingDays),
                isVip: true,
                isTrial,
                remainingDays,
                variantId,
                expiredTrial,
                expiredVip,
                packageDetails,
            };
        }
        // VIP member
        if (isVip) {
            return {
                message: Data.vipMessage,
                isVip,
                isTrial,
                remainingDays,
                variantId,
                expiredTrial,
                expiredVip,
                packageDetails,
            };
        }
        // expired vip
        if (expiredVip) {
            return {
                message: Data.expiredVipMessage,
                isVip,
                isTrial,
                remainingDays,
                variantId,
                expiredTrial,
                expiredVip,
                packageDetails,
            };
        }
        return {
            message: Data.everTrialUsedNoVipMessage,
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
            packageDetails,
        };
    }

    static async getCourseCategoryTypes(db) {
        let data = [];
        if (config.caching) {
            data = await redis.getCourseCategoryTypes(db.redis.read);
            if (!_.isEmpty(data)) {
                return JSON.parse(data);
            }
        }
        data = await mysql.getCourseCategoryTypes(db.mysql.read);
        if (data.length) {
            await redis.setCourseCategoryTypes(db.redis.write, data);
        }
        return data;
    }

    static async getCourseMetaTypes(db) {
        let data = [];
        if (config.caching) {
            data = await redis.getCourseMetaTypes(db.redis.read);
            if (!_.isEmpty(data)) {
                return JSON.parse(data);
            }
        }
        data = await mysql.getCourseCategoryTypes(db.mysql.read);
        if (data.length) {
            await redis.setCourseMetaTypes(db.redis.write, data);
        }
        return data;
    }

    static async getCourseYears(db) {
        let data = [];
        if (config.caching) {
            data = await redis.getCourseYears(db.redis.read);
            if (!_.isEmpty(data)) {
                return JSON.parse(data);
            }
        }
        data = await mysql.getCourseYears(db.mysql.read);
        if (data.length) {
            await redis.setCourseYears(db.redis.write, data);
        }
        return data;
    }

    static async getCourseFilters(db) {
        let data = [];
        if (config.caching) {
            data = await redis.getCourseFilters(db.redis.read);
            if (!_.isEmpty(data)) {
                return JSON.parse(data);
            }
        }
        data = await mysql.getCourseFilters(db.mysql.read);
        if (data.length) {
            await redis.setCourseFilters(db.redis.write, data);
        }
        return data;
    }

    static async getCourseCategories(db, categoryType) {
        let data = [];
        if (config.caching) {
            data = await redis.getCourseCategories(db.redis.read, categoryType);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
        }
        data = await mysql.getCourseCategories(db.mysql.read, categoryType);
        if (data.length) {
            await redis.setCourseCategories(db.redis.write, categoryType, data);
        }
        return data;
    }
};
