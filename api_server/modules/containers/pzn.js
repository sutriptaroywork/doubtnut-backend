const _ = require('lodash');
const axios = require('axios');
const config = require('../../config/config');
// let _ = require('./utility');
const mysql = require('../mysql/pzn');
const redis = require('../redis/pzn');
const Data = require('../../data/data');
const axioInst = require('../axiosInstances');

module.exports = class pzn {
    static async getVideosByPznTG(db, targetGroup, mcID, locale) {
        try {
            if (!config.caching) {
                return mysql.getVideosByPznTG(db.mysql.read, targetGroup, mcID, locale);
            }
            let data = await redis.getVideosByPznTG(db.redis.read, targetGroup, mcID, locale);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysql.getVideosByPznTG(db.mysql.read, targetGroup, mcID, locale);
            if (data && data.length) {
                redis.setVideosByPznTG(db.redis.write, data, targetGroup, mcID, locale);
            }
            return data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getVideos(db, mcID, locale) {
        try {
            if (!config.caching) {
                return mysql.getVideos(db.mysql.read, mcID, locale);
            }
            let data = await redis.getVideos(db.redis.read, mcID, locale);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysql.getVideos(db.mysql.read, mcID, locale);
            if (data && data.length) {
                redis.setVideos(db.redis.write, data, mcID, locale);
            }
            return data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getVideosByStudentId(studentId, locale = 'ENGLISH') {
        try {
            const { data } = await axios({
                method: 'get',
                url: `${Data.pznUrl}v1/get-top-videos/student-id`,
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify({
                    student_id: `${studentId}`,
                    language: (locale === 'hi' ? 'HINDI' : 'ENGLISH'),
                }),
            });
            return data;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    static async getTop10VideosByCcmIdForTimeRange(ccmIdData, startTime, endTime, studentClass, locale = '') {
        try {
            const dataObj = {
                start_time: startTime,
                end_time: endTime,
            };
            if (!_.isEmpty(ccmIdData)) {
                dataObj.ccm_id = ccmIdData[0].ccm_id;
            } else {
                dataObj.class = parseInt(studentClass);
            }
            if (!_.isEmpty(locale)) {
                dataObj.language = locale === 'hi' ? 'hi' : 'en';
            }

            const { data } = await axios({
                method: 'get',
                url: `${Data.pznUrl}v1/get-top-videos/ccm-id`,
                headers: {
                    'Content-Type': 'application/json',
                },
                data: dataObj,
            });
            return data;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    static async getUserTotalEngageTimeBuketForRange(studentId, startDate, endDate) {
        const data = await axioInst.pznInst({
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            url: `${Data.pznUrl}v1/summation-by-student-id/engage-time`,
            timeout: 2500,
            data: {
                student_id: studentId,
                start_date: `${startDate}`,
                end_date: `${endDate}`,
            },
        });
        return data && data.data ? data.data : null;
    }

    static async getUserVideoViewBucket(studentId) {
        const data = await axioInst.pznInst({
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            url: `${Data.pznUrl}v1/buckets/engage-time`,
            timeout: 2500,
            data: {
                student_id: `${studentId}`,
            },
        });
        return data && data.data ? data.data : null;
    }

    static async getQuestionByMaxEngageTime(queryData) {
        const data = await axioInst.pznInst({
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            url: `${Data.pznUrl}v1/get-top-videos/question-id-by-sum-engage-time`,
            timeout: 2500,
            data: queryData,
        });
        return data && data.data ? data.data : null;
    }

    static async getStudentTopTargetGroup(studentId) {
        const data = await axioInst.pznInst({
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            url: `${Data.pznUrl}v1/get-top-videos/target-group-by-sum-engage-time`,
            timeout: 2500,
            data: {
                student_id: `${studentId}`,
            },
        });
        return data && data.data ? data.data : null;
    }

    static async getSubjectListByTotalEt(studentId, startDate, endDate) {
        const data = await axioInst.pznInst({
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            url: `${Data.pznUrl}v1/get-top-videos/subject-by-sum-engage-time`,
            timeout: 2500,
            data: {
                student_id: `${studentId}`,
                start_date: `${startDate}`,
                end_date: `${endDate}`,
            },
        });
        return data && data.data ? data.data : null;
    }

    static async getViewTimeForStudentsByQidList(studentId, qidLists) {
        const data = await axioInst.pznInst({
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            url: `${Data.pznUrl}v1/get-max-value/video-time`,
            timeout: 2500,
            data: {
                student_id: studentId,
                question_ids: qidLists,
            },
        });
        return data && data.data ? data.data : null;
    }
};
