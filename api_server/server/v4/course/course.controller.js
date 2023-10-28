const _ = require('lodash');
// const moment = require('moment');
const CourseMysql = require('../../../modules/mysql/course');
const Flagr = require('../../../modules/containers/Utility.flagr');
const CourseHelper = require('./course.helper');
const Data = require('../../../data/data');

async function get(_req, res, next) {
    try {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getDetails(req, res, next) {
    try {
        const db = req.app.get('db');
        const studentId = req.user.student_id;
        const config = req.app.get('config');
        const promise = [];
        const courseType = 'vod';
        const versionCode = req.headers.version_code;
        const categoryID = 1;
        const xAuthToken = req.headers['x-auth-token'];
        const flagID = versionCode > 752 ? Data.flagIdNameMap[Data.categoryIDFlagrMap[categoryID]].default.flagID : config.package_subscription_flagr_id;
        promise.push(CourseMysql.getUserSubscription(db.mysql.read, studentId));
        promise.push(Flagr.evaluateServiceWrapper({
            db,
            xAuthToken,
            entityContext: { studentId: studentId.toString() },
            flagID,
            timeout: 3000,
        }));
        const result = await Promise.all(promise);
        const [userSubscriptionData, flagrResponse] = result;
        const paymentCardState = await CourseHelper.getPaymentCardStateV2({
            data: userSubscriptionData,
            flagrResponse,
            courseType,
            categoryID,
        });
        const paymentData = {
            paymentCardState,
            courseType,
            categoryID,
        };
        const widgets = [CourseHelper.getPaymentCard(paymentData)];
        widgets.push(Data.vmcDescriptionLive);
        widgets.push(Data.vmcDescriptionRecorded);
        widgets.push(Data.vmcInfo);
        widgets.push(Data.vmcRankers(config));
        widgets[3].data.bg_image = `${config.staticCDN}vmc/rankers.png`;
        const data = {
            title: 'Why IIT-JEE VIP Classes?',
            widgets,
        };
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    get, getDetails,
};
