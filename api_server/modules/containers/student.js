const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/student');
const redis = require('../redis/student');
const sendSms = require('../../server/helpers/sendsms.handler');
const Utility = require('../utility');
const StaticData = require('../../data/data');
const TestSeries = require('../mysql/testseries');
const teacherMysql = require('../mysql/teacher');
const StudentMongo = require('../mongo/student');
const microService = require('../microservice');
const QuestionMysql = require('../mysql/question');
const redisUtility = require('../redis/utility.redis');
const Property = require('../mysql/property');
const QuestionPuchoContestRedis = require('../redis/questionPuchoContest');
const CcmContainer = require('./ClassCourseMapping');

module.exports = class Student {
    static async getById(student_id, db) {
        // eslint-disable-next-line no-async-promise-executor
        let data;
        if (config.caching) {
            data = await redis.getById(student_id, db.redis.read);
            const [campaign, scmData] = await Promise.all([redis.getCampaignData(db.redis.read, student_id), CcmContainer.getStudentsExamsBoardsData(db, student_id)]);
            if (!_.isNull(data)) {
                const finalData = JSON.parse(data);
                if (campaign) {
                    _.set(finalData, '[0].campaign', campaign);
                }
                if (scmData) {
                    _.set(finalData, '[0].ccm_data', scmData);
                }
                return finalData;
            }
            data = await mysql.getById(student_id, db.mysql.read);

            if (data.length) {
                if (campaign) {
                    _.set(data, '[0].campaign', campaign);
                }
                if (scmData) {
                    _.set(data, '[0].ccm_data', scmData);
                }
                redis.setById(student_id, data, db.redis.write);
            }
            return data;
        }
        data = await mysql.getById(student_id, db.mysql.read);
        return data;
    }

    static async generatePinBL(db, pin, userInfo, force_change, isUsFlag) {
        let responseData;

        try {
            let { mobile } = userInfo;
            const { student_email } = userInfo;
            if (_.isNull(mobile)) {
                mobile = student_email;
            }
            let pinOpertion;
            let pinOpertionMsg;
            const userPin = await mysql.getPin(db.mysql.read, mobile, isUsFlag);
            if (userPin.length === 1) {
                if (!force_change) {
                    return;
                }
                pinOpertion = await mysql.updatePin(db.mysql.write, pin, mobile, isUsFlag);
                pinOpertionMsg = 'Pin Updated';
            } else {
                const obj = {
                    mobile,
                    pin,
                };
                if (isUsFlag) {
                    obj.app_country = 'US_APP';
                }
                pinOpertion = await mysql.storePin(db.mysql.write, obj);
                pinOpertionMsg = 'Pin Inserted';
            }

            if (pinOpertion.affectedRows >= 1) {
                if (!isUsFlag) {
                    const studentData = await mysql.getAllStudentsByPhone(mobile, db.mysql.read);
                    let msg = `Your DN PIN is ${pin}. Please use it to login the next time to Doubtnut.`;
                    let msg_type = 'TEXT';
                    for (let i = 0; i < studentData.length; i++) {
                        if (studentData[0].student_id === userInfo.student_id && studentData[0].locale === 'hi') {
                            msg = `आपका DN पिन ${pin} है। अगली बार Doubtnut में लॉगिन करने के लिए इसका उपयोग करें।`;
                            msg_type = 'Unicode_text';
                        }
                    }
                    const smsSendResp = await sendSms.sendSms({ mobile, msg, msg_type });
                    const obj = {
                        student_id: userInfo.student_id,
                        mobile: userInfo.mobile,
                        gaid: userInfo.gaid,
                        gcm_id: userInfo.gcm_reg_id,
                        pin,
                        udid: userInfo.udid,
                    };
                    if (smsSendResp.Status === 'Success') {
                        obj.status_details = 'Pin Updated and sms sent';
                        obj.status = 'Pin Success';
                    } else {
                        obj.status_details = 'Pin Updated and sms sent failed';
                        obj.status = 'Pin Failed';
                    }
                    mysql.storePinMetrics(db.mysql.write, obj);
                }

                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                    },
                    data: {
                        message: pinOpertionMsg,
                    },
                };
            } else {
                responseData = {
                    meta: {
                        code: 403,
                        success: false,
                    },
                    data: {
                        message: 'Error Pin Insertion',
                    },
                };
            }
        } catch (e) {
            responseData = {
                meta: {
                    code: 403,
                    success: false,
                },
                data: {
                    message: 'Error Pin Insertion',
                },
            };
        }

        return responseData;
    }

    static async getStudentQuestionHistoryList(student_id, limit, db) {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getStudentQuestionHistoryList(student_id, limit, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.getStudentQuestionHistoryList(student_id, limit, db.mysql.read);
                    if (data.length) {
                        await redis.setStudentQuestionHistoryList(student_id, limit, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.getStudentQuestionHistoryList(student_id, limit, db.mysql.read);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async subscribedStudentHistory(student_id, flag, limit, db) {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.subscribedStudentHistory(student_id, flag, limit, db.redis.read);
                    console.log('redis answer');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    data = await mysql.subscribedStudentHistory(student_id, flag, limit, db.mysql.read);
                    if (data.length > 0) {
                        await redis.setsubscribedStudentHistory(student_id, flag, limit, data, db.redis.write);
                    }
                    return resolve(data);
                }
                data = await mysql.subscribedStudentHistory(student_id, flag, limit, db.mysql.read);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getDailySrpViewsCounter(db, student_id) {
        try {
            let counter;
            if (config.caching) {
                counter = await redis.getDailySrpViewCount(db.redis.read, student_id);
                if (_.isNull(counter)) {
                    counter = await mysql.getLastDayVideoCountByStudentId(db.mysql.read, student_id);
                    redis.setDailySrpViewCount(db.redis.write, counter);
                }
                return counter;
            }
            counter = await mysql.getLastDayVideoCountByStudentId(db.mysql.read, student_id);
            return counter;
        } catch (e) {
            console.log(e);
            return 0;
        }
    }

    static async isStudentEligibleForPopup(redis_database, sid) {
        try {
            let isEligible = true;
            const checkIsStudentIdBlockedForPopup = await redis.getUserBlockedForRatingPopup(redis_database, sid);
            if (!_.isNull(checkIsStudentIdBlockedForPopup)) {
                isEligible = false;
            }
            return isEligible;
        } catch (e) {
            console.log(e);
            return true;
        }
    }

    static async makeStudentUnEligibleForPopup(redis_database, sid) {
        return redis.setUserBlockedForRatingPopup(redis_database, sid);
    }

    static async srpViewCount(sid, parent_id, db) {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    let flag = 0;
                    const parentData = await redis.getParentIds(sid, db);
                    if (!_.isNull(parentData)) {
                        const parentArr = JSON.parse(parentData);
                        if (!parentArr.includes(parent_id)) {
                            parentArr.push(parent_id);
                            // await redis.setParentIds(sid, parentArr, db);
                            redis.delParentIds(sid, db);
                            flag = 1;
                        }
                    } else {
                    // const parentIds = [parent_id];
                    // await redis.setParentIds(sid, parentIds, db);
                        redis.delParentIds(sid, db);
                        flag = 1;
                    }
                    data = await redis.getSrpViewCount(sid, db);
                    if (!_.isNull(data)) {
                        if (flag === 1) {
                            data++;
                        }
                    } else {
                        console.log(' not exist');
                        data = 1;
                    }
                    // await redis.setSrpViewCount(sid, data, db);
                    redis.delSrpViewCount(sid, db);
                    return resolve();
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getRatingDone(sid, db) {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getRatingDone(sid, db);
                    return resolve(data);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async setRatingDone(sid, db) {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.setRatingDone(sid, db);
                    return resolve(data);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getSrpViewCount(sid, db) {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getSrpViewCount(sid, db);
                    return resolve(data);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getCrossPress(sid, db) {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    data = await redis.getCrossPress(sid, db);
                    return resolve(data);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async setCrossPress(sid, db) {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise((async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    const srpData = await redis.getSrpViewCount(sid, db);
                    data = await redis.setCrossPress(sid, srpData, db);
                    return resolve(data);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    static async getExamsBoardsDetails(db, studentClass, type) {
        try {
            if (!config.caching) {
                return mysql.getExamsBoardsDetails(db.mysql.read, studentClass, type);
            }
            let data = await redis.getExamsBoardsDetails(db.redis.read, studentClass, type);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }

            data = await mysql.getExamsBoardsDetails(db.mysql.read, studentClass, type);
            if (data.length) {
                redis.setExamsBoardsDetails(db.redis.write, studentClass, type, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getExamsBoardsDetailsLocalised(db, studentClass, type, lang, examOrdering = '') {
        try {
            if (!config.caching) {
                return mysql.getExamsBoardsDetailsLocalised(db.mysql.read, studentClass, type, lang, examOrdering);
            }
            let data = await redis.getExamsBoardsDetailsLocalised(db.redis.read, studentClass, type, lang, examOrdering);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }

            data = await mysql.getExamsBoardsDetailsLocalised(db.mysql.read, studentClass, type, lang, examOrdering);
            if (data.length) {
                redis.setExamsBoardsDetailsLocalised(db.redis.write, studentClass, type, lang, examOrdering, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async redisSetForLiveClass(db, type, sid, diff) {
        let flag = 0;
        const liveClassData = await redis.getLiveClassData(db.redis.read, type);
        if (!_.isNull(liveClassData)) {
            const liveClassDataArr = JSON.parse(liveClassData);
            if (!liveClassDataArr.includes(sid)) {
                liveClassDataArr.push(sid);
                const redisInsert = await redis.setLiveClassData(db.redis.write, type, diff, liveClassDataArr);
                if (redisInsert) {
                    flag = 1;
                }
            }
        } else {
            const liveClassDataArr = [sid];
            const redisInsert = await redis.setLiveClassData(db.redis.write, type, diff, liveClassDataArr);
            if (redisInsert) {
                flag = 1;
            }
        }
        if (flag == 1) {
            return true;
        }
        return false;
    }

    static async getBranchDeeplink(db, studentID, campaignId, referralCode) {
        try {
            let branchLink = {};
            if (config.caching) {
                branchLink = await redis.getBranchDeeplink(db.redis.read, studentID);
                if (!_.isNull(branchLink)) {
                    return JSON.parse(branchLink);
                }
            }
            branchLink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'VIDEO_PAGE', campaignId, `doubtnutapp://course_details?id=xxxx||||${referralCode}&referrer_student_id=${studentID}`);
            if (!_.isNull(branchLink)) {
                redis.setBranchDeeplink(db.redis.write, studentID, branchLink);
            }
            return branchLink;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async redisSetUserTenRecenltyWatched(db, studentID, recentlyWatchedObj) {
        try {
            const userRecentWatchHistory = await redis.getUserTenRecentlyWatchedDetails(db.redis.read, studentID);
            let userRecentWatchHistoryArr = [];
            if (!_.isNull(userRecentWatchHistory)) {
                userRecentWatchHistoryArr = JSON.parse(userRecentWatchHistory);
                const filterRecentlyWatchedIndex = userRecentWatchHistoryArr.findIndex((item) => (item.chapter === recentlyWatchedObj.chapter && item.subject === recentlyWatchedObj.subject));
                if (filterRecentlyWatchedIndex !== -1) {
                    userRecentWatchHistoryArr.splice(filterRecentlyWatchedIndex, 1);
                }
                userRecentWatchHistoryArr.unshift(recentlyWatchedObj);
                if (userRecentWatchHistoryArr.length > 10) {
                    userRecentWatchHistoryArr.pop();
                }
            } else {
                userRecentWatchHistoryArr = [recentlyWatchedObj];
            }
            await redis.setUserTenRecentlyWatchedDetails(db.redis.write, studentID, userRecentWatchHistoryArr);
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async updateClassBoardExam(db, surveyId, studentId, questionId, feedback) {
        let feedbackType = '';
        const { examUpdateClass, boardUpdateClass } = StaticData;
        let feebackToUpdate = '';
        if ((surveyId == 9 && questionId == 36) || (surveyId == 10 && questionId == 39)) {
            feedbackType = 'class';
        } else if ((surveyId == 9 && questionId == 37) || (surveyId == 10 && questionId == 40)) {
            feedbackType = 'board';
        } else if ((surveyId == 9 && questionId == 38) || (surveyId == 10 && questionId == 41)) {
            feedbackType = 'exam';
        }

        if (feedbackType === 'class') {
            if ((surveyId == 9 && feedback.includes('Class')) || (surveyId == 10 && feedback.includes('कक्षा'))) {
                const feedbackArr = feedback.split(' ');
                feebackToUpdate = feedbackArr[1];
            } else {
                feebackToUpdate = 13;
            }
        } else if (feedbackType === 'board' || feedbackType === 'exam') {
            feebackToUpdate = feedback;
        }

        if (feedbackType != '' && feebackToUpdate != '') {
            if (feedbackType === 'class') {
                mysql.updateClass(db.mysql.write, studentId, feebackToUpdate);
                mysql.deleteBoardExam(db.mysql.write, studentId);
                redis.deleteUserRedis(db.redis.write, studentId);
            } else if (feedbackType === 'board') {
                const studentDetails = await mysql.getById(studentId, db.mysql.read);
                if (studentDetails.length > 0) {
                    const studentClass = studentDetails[0].student_class;
                    if (boardUpdateClass.includes(parseInt(studentClass))) {
                        const ccmIdResponse = await mysql.getBoardExamId(db.mysql.read, studentClass, feebackToUpdate, surveyId, feedbackType);
                        if (ccmIdResponse.length > 0) {
                            feebackToUpdate = ccmIdResponse[0].id;
                            mysql.insertBoardExam(db.mysql.write, studentId, feebackToUpdate);
                        }
                    }
                }
            } else if (feedbackType === 'exam') {
                const studentDetails = await mysql.getById(studentId, db.mysql.read);
                if (studentDetails.length > 0) {
                    const studentClass = studentDetails[0].student_class;
                    if (examUpdateClass.includes(parseInt(studentClass))) {
                        const feebackToUpdateArr = feebackToUpdate.split('::,::');

                        const promise = [];
                        feebackToUpdateArr.forEach((x) => {
                            promise.push(mysql.getBoardExamId(db.mysql.read, studentClass, x, surveyId, feedbackType));
                        });
                        const promiseResult = await Promise.all(promise);

                        promiseResult.forEach((item) => {
                            if (item.length > 0) {
                                const ccmIdToUpdate = item[0].id;
                                mysql.insertBoardExam(db.mysql.write, studentId, ccmIdToUpdate);
                            }
                        });
                    }
                }
            }
        }
    }

    static async getStudentScholarshipRegistered(db, studentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getStudentScholarshipRegistered(db.redis.read, studentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getStudentScholarshipRegistered(db.mysql.read, studentId);
            if (data.length) {
                await redis.setStudentScholarshipRegistered(db.redis.write, studentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getTestSeriesData(db, studentId, testId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTestSeriesData(db.redis.read, studentId, testId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await TestSeries.getTestSeriesData(db.mysql.read, studentId, testId);
            if (data.length) {
                await redis.setTestSeriesData(db.redis.write, studentId, testId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getSubscribedTeachersData(db, studentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getSubscribedTeachersData(db.redis.read, studentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await teacherMysql.getSubscribedTeachersData(db.mysql.read, studentId);
            if (data.length) {
                await redis.setSubscribedTeachersData(db.redis.write, studentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getStudentCcmIds(db, studentId) {
        let studentCcmIds = await redis.getStudentCcmIds(db.redis.read, studentId);
        studentCcmIds = JSON.parse(studentCcmIds);
        if (_.isNull(studentCcmIds)) {
        // if not available  in redis getting from mysql and caching in redis
            studentCcmIds = await mysql.getCcmIdbyStudentId(db.mysql.read, studentId);
            studentCcmIds = studentCcmIds.map((id) => id.ccm_id);
            // adding the data to student redis cache
            if (studentCcmIds.length > 0) {
                await redis.setStudentCcmIds(db.redis.write, studentId, studentCcmIds);
            }
        }
        return studentCcmIds;
    }

    static async getStudentCcmIdsWithType(db, studentId) {
        let studentCcmIds = await redis.getStudentCcmIdsWithType(db.redis.read, studentId);
        studentCcmIds = JSON.parse(studentCcmIds);
        if (_.isNull(studentCcmIds)) {
        // if not available  in redis getting from mysql and caching in redis
            studentCcmIds = await mysql.getCcmIdbyStudentId(db.mysql.read, studentId);
            studentCcmIds = studentCcmIds.map((id) => ({ id: id.ccm_id, type: id.type }));
            // adding the data to student redis cache
            if (studentCcmIds.length > 0) {
                await redis.setStudentCcmIdsWithType(db.redis.write, studentId, studentCcmIds);
            }
        }
        return studentCcmIds;
    }

    static async getAskedQuestions(db, studentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getAskedQuestionNo(db.redis.read, studentId);
                if (!_.isNull(data) && data > 8) {
                    return data;
                }
            }
            data = await QuestionMysql.getLast10QuestionsAskedData(db.mysql.read, studentId);
            if (data.length > 8) {
                redis.setAskedQuestionNo(db.redis.write, studentId, data.length);
            }
            return data.length;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getSubscribedInternalTeachersData(db, studentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getSubscribedInternalTeachersData(db.redis.read, studentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await teacherMysql.getSubscribedInternalTeachersData(db.mysql.read, studentId);
            if (data.length) {
                await redis.setSubscribedInternalTeachersData(db.redis.write, studentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async studentReloginReward(db, xAuthToken, versionCode, studentId) {
        try {
        // preparing request object
            const data = { message: 'Reinstalling Rewarding Student' };
            const postUrl = '/api/dnr/rewarding-reinstall-student';
            // checking if user is eligible for relogin reward
            const isEligibleForReward = await StudentMongo.isEligibleForReward(studentId, db.mongo.read);
            if (!_.isEmpty(isEligibleForReward)) {
            // deleting the student data from sms collection so that he is not eligible for the reward again
                StudentMongo.deletingRewardedStudent(studentId, db.mongo.write);
                microService.requestMicroServer(postUrl, data, xAuthToken, versionCode);
            } else {
                return false;
            }
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async checkR2V2Student(db, studentId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getR2V2status(db.redis.read, studentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.checkR2V2Student(db.mysql.read, studentId);
            if (data.length) {
                await redis.setR2V2status(db.redis.write, studentId, data.length);
            }
            return data.length;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getBiharUpActiveCCMData(db) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getBiharUpActiveCCMData(db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            const keyname = 'BIHAR:UP:CCMID';
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, keyname)) {
                return [];
            }
            await redisUtility.setCacheHerdingKeyNew(db.redis.write, keyname);
            data = await mysql.getBiharUpActiveCCMData(db.mysql.read);
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, keyname);
            const list = [];
            for (let i = 0; i < data.length; i++) {
                list.push(data[i].id);
            }
            if (list.length) {
                redis.setBiharUpActiveCCMData(db.redis.write, list);
            }
            return list;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getUpActiveCCMData(db) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUpActiveCCMData(db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getUpActiveCCMData(db.mysql.read);
            const list = [];
            for (let i = 0; i < data.length; i++) {
                list.push(data[i].id);
            }
            if (list.length) {
                redis.setUpActiveCCMData(db.redis.write, list);
            }
            return list;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDnPropertyValue(db, bucket, name) {
        try {
            let bucketData; let bucketValue;
            if (config.caching) {
                bucketValue = await QuestionPuchoContestRedis.getPropertyBucketValue(db.redis.read, bucket, name);
                if (_.isNull(bucketValue)) {
                    bucketData = await Property.getValueByBucketAndName(db.mysql.read, bucket, name);
                    if (bucketData.length > 0) {
                        bucketValue = bucketData[0].value;
                    }
                    QuestionPuchoContestRedis.setPropertyBucketValue(db.redis.write, bucket, name, bucketValue, 60 * 60);
                }
                return bucketValue;
            }
            bucketValue = await Property.getValueByBucketAndName(db.mysql.read, bucket, name);
            return bucketValue;
        } catch (e) {
            console.log(e);
            return 0;
        }
    }

    static async getTeacherData(db, teacherId) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getTeacherData(db.redis.read, teacherId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await teacherMysql.getTeacherData(db.mysql.read, teacherId);
            if (data.length) {
                await redis.setTeacherData(db.redis.write, teacherId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getGoogleAdsData(db, page) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getGoogleAdsData(db.redis.read, page);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getGoogleAdsData(db.mysql.read, page);
            if (data.length) {
                redis.setGoogleAdsData(db.redis.write, page, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
};
