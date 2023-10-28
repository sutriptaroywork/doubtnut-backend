const _ = require('lodash');
const moment = require('moment');
const CourseContainer = require('../../../modules/containers/course');
const CourseMysql = require('../../../modules/mysql/course');
const Flagr = require('../../../modules/containers/Utility.flagr');
const CourseHelper = require('./course.helper');
const Data = require('../../../data/data');

async function get(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let ecmId = req.query.ecm_id;
        let subject = req.query.subject ? req.query.subject : 0;
        if (req.query.subject === 'ALL')subject = 0;
        const { page } = req.query;
        const versionCode = req.headers.version_code;
        const { locale } = req.user;
        let { studentClass } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        const studentId = req.user.student_id;
        const limit = 10;
        let ecmListData = [];
        ecmListData = await CourseMysql.getEcmListDataV3(db.mysql.read, studentClass);

        if (((page === 1 && _.isEmpty(ecmId)) || _.isEmpty(ecmId)) && ecmListData.length > 0) {
            ecmId = ecmListData[0].filter_id;
        }
        const promise = [];
        promise.push(CourseMysql.getCaraouselsWithAppVersionCodeFixed(db.mysql.read, ecmId, locale, page, limit, studentClass, versionCode));
        promise.push(CourseMysql.checkVipWithExpiry(db.mysql.read, studentId));
        promise.push(Flagr.evaluate(db, studentId.toString(), {}, config.package_subscription_flagr_id, 500));
        const result = await Promise.all(promise);
        const [caraouselList, userSubscriptionData, flagrResponse] = result;

        const paymentCardState = await CourseHelper.getPaymentCardState({
            moment,
            data: userSubscriptionData,
            flagrResponse,
        });
        const caraouselData = await CourseHelper.getCaraouselData({
            db,
            caraouselList,
            ecmId,
            config,
            whatsappShareMessage: Data.whatsappShareMessage,
            next,
            studentClass,
            paymentCardState,
            subject,
            page,
        });
        const data = {
            widgets: page == 1 ? caraouselData : [],
        };

        data.trial_button = {
            type: 'button',
            action: {
                action_activity: 'payment_page',
                action_data: {
                    ecm_id: ecmId,
                },
            },
            button_text: (paymentCardState.isVip) ? 'Check your plan' : 'BUY NOW',
            variant_id: paymentCardState.variantId,
            event_name: (paymentCardState.isTrial) ? 'trial' : 'vip',
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

async function getLivesection(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const ecmId = req.query.ecm_id;
        const studentId = req.user.student_id;
        let { studentClass } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        // let promo = req.query.promo ? req.query.promo : null;
        let subject = req.query.subject ? req.query.subject : 0;
        if (req.query.subject === 'ALL') subject = 0;

        const promise = [];
        promise.push(CourseHelper.getSubjectFilters(db, ecmId, studentClass));
        promise.push(CourseContainer.getLiveSectionVideos({
            db, ecmId, studentClass, subject,
        }));
        promise.push(CourseMysql.checkVipWithExpiry(db.mysql.read, studentId));
        promise.push(Flagr.evaluate(db, studentId.toString(), {}, config.package_subscription_flagr_id, 500));
        const result = await Promise.all(promise);
        console.log(result[1]);
        const paymentCardState = await CourseHelper.getPaymentCardState({
            moment,
            data: result[2],
            flagrResponse: result[3],
        });
        const widgets = await CourseHelper.getLiveSection({
            db, ecmId, result, config, paymentCardState,
        });
        const data = {
            widgets,
            trial_button: {
                type: 'button',
                action: {
                    action_activity: 'payment_page',
                    action_data: {
                        ecm_id: ecmId,
                    },
                },
                button_text: paymentCardState.message.button_text,
                variant_id: paymentCardState.variantId,
                event_name: (paymentCardState.isTrial) ? 'trial' : 'vip',
            },
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

async function getFacultyDetail(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const facultyId = req.params.faculty_id;
        const ecmId = req.params.ecm_id;
        const studentClass = req.user.student_class;
        const studentId = req.user.student_id;
        // const studentClass = 12;
        const promise = [];
        // subscribed students, coursename, experience
        promise.push(CourseContainer.getFacultyDetails(db, facultyId));
        promise.push(CourseContainer.getChapterDetailsV2(db, facultyId, ecmId));
        promise.push(CourseContainer.getAllStructuredCourse({
            db, ecmId, studentClass, subject: 'ALL',
        }));
        promise.push(CourseContainer.getRandomSubsViews({
            db,
            type: 'etoos_faculty',
            id: facultyId,
        }));
        promise.push(CourseContainer.getEcmByIdAndClass(db, ecmId, studentClass));
        promise.push(CourseMysql.checkVipWithExpiry(db.mysql.read, studentId));
        const resolvedPromises = await Promise.all(promise);
        console.log(resolvedPromises[4]);
        const userSubscriptionData = resolvedPromises[5];
        const paymentCardState = await CourseHelper.getPaymentCardState({
            moment,
            data: userSubscriptionData,
            flagrResponse: {},
        });
        const data = await CourseHelper.generateFacultyDetails(resolvedPromises, config, paymentCardState);
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
    get, getLivesection, getFacultyDetail,
};
