const _ = require('lodash');
const moment = require('moment');
const PaidUserChampionshipRedis = require('../redis/paidUserChampionship');
const PaidUserChampionshipMysql = require('../mysql/paidUserChampionship');

async function getAssortmentIdParams(db, assortmentId, batchId) {
    const now = moment().add(5, 'hours').add(30, 'minutes');
    const value = {};
    const promises = [PaidUserChampionshipRedis.getAssortmentIdParamsWeekly(db.redis.read, assortmentId, now.isoWeek(), batchId), PaidUserChampionshipRedis.getAssortmentIdParamsMonthly(db.redis.read, assortmentId, now.month(), batchId), PaidUserChampionshipRedis.getAssortmentIdParamsYearly(db.redis.read, assortmentId, now.year(), batchId)];
    const redisData = await Promise.all(promises);
    if (_.isNull(redisData[0])) {
        const data = {};
        const start = now.clone();
        const startStr = start.startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
        const promises = [];
        promises.push(PaidUserChampionshipMysql.getResourcesCountFromCourseAssortment(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        promises.push(PaidUserChampionshipMysql.getHomeworkCountFromAssortment(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        promises.push(PaidUserChampionshipMysql.getTotalVideoTimeFromAssortmentId(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        promises.push(PaidUserChampionshipMysql.getVideoCountByAssortmentId(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        const resolvedPromises = await Promise.all(promises);

        const resourceCount = resolvedPromises[0];

        for (let i = 0; i < resourceCount.length; i++) {
            if (resourceCount[i].assortment_type === 'resource_pdf') {
                data.pdf_count = resourceCount[i].count;
            } else if (resourceCount[i].assortment_type === 'resource_test') {
                data.quiz_count = resourceCount[i].count;
            }
        }
        data.pdf_count = data.pdf_count ? data.pdf_count : 0;
        data.quiz_count = data.quiz_count ? data.quiz_count : 0;
        const homeworkcount = resolvedPromises[1];
        data.homework_count = homeworkcount[0].count ? homeworkcount[0].count : 0;
        const totalVideoTime = resolvedPromises[2];
        data.total_time = totalVideoTime[0].total_time ? totalVideoTime[0].total_time : 0;
        const videoCount = resolvedPromises[3];
        data.video_count = videoCount[0].count ? videoCount[0].count : 0;
        PaidUserChampionshipRedis.setAssortmentIdParamsWeekly(db.redis.read, assortmentId, now.isoWeek(), batchId, data);
        value.weekly = data;
    } else {
        value.weekly = JSON.parse(redisData[0]);
    }
    if (_.isNull(redisData[1])) {
        const data = {};
        const start = now.clone();
        const startStr = start.startOf('month').format('YYYY-MM-DD HH:mm:ss');
        const promises = [];
        promises.push(PaidUserChampionshipMysql.getResourcesCountFromCourseAssortment(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        promises.push(PaidUserChampionshipMysql.getHomeworkCountFromAssortment(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        promises.push(PaidUserChampionshipMysql.getTotalVideoTimeFromAssortmentId(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        promises.push(PaidUserChampionshipMysql.getVideoCountByAssortmentId(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        const resolvedPromises = await Promise.all(promises);

        const resourceCount = resolvedPromises[0];

        for (let i = 0; i < resourceCount.length; i++) {
            if (resourceCount[i].assortment_type === 'resource_pdf') {
                data.pdf_count = resourceCount[i].count;
            } else if (resourceCount[i].assortment_type === 'resource_test') {
                data.quiz_count = resourceCount[i].count;
            }
        }
        data.pdf_count = data.pdf_count ? data.pdf_count : 0;
        data.quiz_count = data.quiz_count ? data.quiz_count : 0;
        const homeworkcount = resolvedPromises[1];
        data.homework_count = homeworkcount[0].count ? homeworkcount[0].count : 0;
        const totalVideoTime = resolvedPromises[2];
        data.total_time = totalVideoTime[0].total_time ? totalVideoTime[0].total_time : 0;
        const videoCount = resolvedPromises[3];
        data.video_count = videoCount[0].count ? videoCount[0].count : 0;
        PaidUserChampionshipRedis.setAssortmentIdParamsMonthly(db.redis.read, assortmentId, now.month(), batchId, data);
        value.monthly = data;
    } else {
        value.monthly = JSON.parse(redisData[1]);
    }
    if (_.isNull(redisData[2])) {
        const data = {};
        const start = now.clone();
        const startStr = start.startOf('year').format('YYYY-MM-DD HH:mm:ss');
        const promises = [];
        promises.push(PaidUserChampionshipMysql.getResourcesCountFromCourseAssortment(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        promises.push(PaidUserChampionshipMysql.getHomeworkCountFromAssortment(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        promises.push(PaidUserChampionshipMysql.getTotalVideoTimeFromAssortmentId(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        promises.push(PaidUserChampionshipMysql.getVideoCountByAssortmentId(db.mysql.read, assortmentId, batchId, startStr, now.format('YYYY-MM-DD HH:mm:ss')));
        const resolvedPromises = await Promise.all(promises);

        const resourceCount = resolvedPromises[0];
        for (let i = 0; i < resourceCount.length; i++) {
            if (resourceCount[i].assortment_type === 'resource_pdf') {
                data.pdf_count = resourceCount[i].count;
            } else if (resourceCount[i].assortment_type === 'resource_test') {
                data.quiz_count = resourceCount[i].count;
            }
        }
        data.pdf_count = data.pdf_count ? data.pdf_count : 0;
        data.quiz_count = data.quiz_count ? data.quiz_count : 0;
        const homeworkcount = resolvedPromises[1];
        data.homework_count = homeworkcount[0].count ? homeworkcount[0].count : 0;
        const totalVideoTime = resolvedPromises[2];
        data.total_time = totalVideoTime[0].total_time ? totalVideoTime[0].total_time : 0;
        const videoCount = resolvedPromises[3];
        data.video_count = videoCount[0].count ? videoCount[0].count : 0;
        PaidUserChampionshipRedis.setAssortmentIdParamsYearly(db.redis.read, assortmentId, now.year(), batchId, data);
        value.yearly = data;
    } else {
        value.yearly = JSON.parse(redisData[2]);
    }
    return value;
}

async function getCourseStartDate(db, config, assortmentId) {
    try {
        let startDate;
        if (config.caching) {
            startDate = await PaidUserChampionshipRedis.getCourseStartDate(db.redis.read, assortmentId);
            if (!_.isNull(startDate)) {
                return startDate;
            }
            startDate = await PaidUserChampionshipMysql.getCouseStartDate(db.mysql.read, assortmentId);
            if (startDate.length > 0) {
                // set in redis
                PaidUserChampionshipRedis.setCourseStartDate(db.redis.write, assortmentId, startDate[0].startDate);
            }
            return startDate[0].startDate;
        }
    } catch (e) {
        console.log(e);
        throw (e);
    }
}
async function getPaidUserChampionshipCouponsToShow(db, studentId) {
    let popUpsShownList = await PaidUserChampionshipRedis.getPaidUserChampionshipShownCoupons(db.redis.read, studentId);
    if (popUpsShownList) {
        popUpsShownList = JSON.parse(popUpsShownList);
    } else {
        popUpsShownList = [];
    }
    const couponsList = await PaidUserChampionshipMysql.getStudentsCouponsForChampionship(db.mysql.read, studentId, popUpsShownList);
    if (couponsList.length) {
        popUpsShownList.push(couponsList[0].id);
        PaidUserChampionshipRedis.setPaidUserChampionshipShownCoupons(db.redis.read, studentId, popUpsShownList);
    }
    return couponsList;
}
module.exports = { getAssortmentIdParams, getCourseStartDate, getPaidUserChampionshipCouponsToShow };
