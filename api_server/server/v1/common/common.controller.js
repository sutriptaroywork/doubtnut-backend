/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const moment = require('moment');
const PaidUserChampionshipHelper = require('../../helpers/paidUserChamionship');
const scholarshipWidget = require('../../helpers/scholarship');
const StudentMysql = require('../../../modules/mysql/student');
const StudentRedis = require('../../../modules/redis/student');
const paidUserChampionshipHelperV1 = require('../paid_user_championship/paidUserChampionship.helper');
const courseHelperV1 = require('../course/course.helper');
const commonHelper = require('./common.helper');
const NudgeContainer = require('../../../modules/containers/nudge');
const NudgeRedis = require('../../../modules/redis/nudge');
const altAppData = require('../../../data/alt-app');

async function bottomSheet(req, res, next) {
    try {
        // const {
        //     student_id: studentId,
        // } = req.user;
        // const { version_code: versionCode } = req.headers;

        if (req.query.source === 'home') {
            // const userActivePackages = await CourseContainerV2.getUserActivePackages(db, studentId);
            // const couponData = await paidUserChampionshipContainer.getPaidUserChampionshipCouponsToShow(db, studentId);
            // if (couponData.length && +versionCode >= 973) {
            //     return next({
            //         data: {
            //             deeplink: `doubtnutapp://dialog_widget?widget_type=championship_coupon&assortment_id=${couponData[0].coupon}`,
            //         },
            //     });
            // }
            // const data = await PaidUserChampionshipMysql.getUnSeenTshirts(db.mysql.read, studentId);
            // if (data.length > 0 && +versionCode >= 973) {
            //     return next({
            //         data: {
            //             deeplink: 'doubtnutapp://dialog_widget?widget_type=paid_user_championship_check_rewards&show_close_btn=true',
            //         },
            //     });
            // }
            // if (userActivePackages.length > 0) {
            //     const countOfInteractions = await commonHelper.getCountofInteractions(db, studentId);
            //     return next({
            //         data: {
            //             deeplink: (countOfInteractions <= 3) ? 'doubtnutapp://bottom_sheet_widget?widget_type=paid_user_championship&show_close_btn=true' : '',
            //         },
            //     });
            // }
            // if (userActivePackages.length === 0 && (+versionCode >= 965)) {
            //     const lastTime = await StudentRedis.getPracticeEnglishLastBottomsheetTime(db.redis.read, studentId);
            //     if (!lastTime || moment().diff(JSON.parse(lastTime), 'hours') >= 6) {
            //         const result = await StudentMysql.checkStudentPracticeEnglishParticipation(db.mysql.read, studentId);
            //         if (result.length === 0) {
            //             StudentRedis.setPracticeEnglishLastBottomsheetTime(db.redis.read, studentId, moment().toISOString());
            //             return next({
            //                 data: {
            //                     deeplink: 'doubtnutapp://bottom_sheet_widget?widget_type=practice_english_promo_bottomsheet&show_close_btn=true',
            //                 },
            //             });
            //         }
            //     }
            // }

            return next({
                data: {
                    deeplink: '',
                },
            });
        }
    } catch (err) {
        return next({ err });
    }
}

async function getCourseBottomSheetHomepage(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale, student_class: studentClass } = req.user;
        const { version_code: versionCode } = req.headers;
        const {
            page, id, tab_id: tab,
        } = req.query;
        let respData;
        let studentCcmIds = [];
        const splitId = id.split('_');
        let type = '';
        for (let i = 0; i < splitId.length; i++) {
            // eslint-disable-next-line no-restricted-globals
            if (isNaN(splitId[i])) {
                if (i !== 0) {
                    type = `${type}_${splitId[i]}`;
                } else {
                    type = splitId[i];
                }
            } else {
                studentCcmIds.push(+splitId[i]);
            }
        }
        if (studentCcmIds.length === 0) {
            studentCcmIds = await StudentRedis.getStudentCcmIds(db.redis.read, studentID);
            studentCcmIds = JSON.parse(studentCcmIds);
            if (_.isNull(studentCcmIds)) {
                // if not available  in redis getting from mysql and caching in redis
                studentCcmIds = await StudentMysql.getCcmIdbyStudentId(db.mysql.read, studentID);
                studentCcmIds = studentCcmIds.map((item) => item.ccm_id);
                // adding the data to student redis cache
                StudentRedis.setStudentCcmIds(db.redis.write, studentID, studentCcmIds);
            }
        }

        if (type === 'trial_flow') {
            respData = await commonHelper.trialFlow({
                tab, locale, page, studentID, db, studentCcmIds, studentClass, config, versionCode,
            });
        } else if (type === 'referral_flow') {
            respData = await commonHelper.referralFlow({
                tab, locale, page, studentID, db, studentCcmIds, studentClass, config, versionCode,
            });
        } else if (type === 'courses') {
            respData = await commonHelper.bottomSheetCourses({
                tab, locale, page, studentID, db, studentCcmIds, studentClass, config, versionCode,
            });
        } else if (type === 'online_classes') {
            respData = await commonHelper.bottomSheetOnlineClasses({
                tab, locale, page, studentID, db, studentCcmIds, studentClass, config, versionCode,
            });
        } else if (type === 'books') {
            respData = await commonHelper.bottomSheetBooks({
                tab, locale, page, studentID, db, studentCcmIds, studentClass, config, versionCode,
            });
        } else if (type === 'prev_year') {
            respData = await commonHelper.bottomSheetPreviousYear({
                tab, locale, page, studentID, db, studentCcmIds, studentClass, config, versionCode,
            });
        } else if (type === 'homepage_vertical') {
            respData = await commonHelper.bottomSheetVideos({ db, tab, page });
        }

        if (respData) {
            return next({ data: respData });
        }
        throw new Error('Internal server Error');
    } catch (err) {
        return next({ err });
    }
}

async function dialog(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const {
            widget_type: widgetType, assortment_id: assortmentId, student_id: studentId, tab_number: tab, test_id: testId,
        } = req.query;
        let { locale } = req.user;
        if (widgetType === 'widget_scholarship_test') {
            locale = (locale !== 'hi') ? 'en' : 'hi';
            const data = await scholarshipWidget.registerWidget(db, +testId, locale);
            return next({ data });
        }
        if (widgetType === 'widget_scholarship_start_test') {
            locale = (locale !== 'hi') ? 'en' : 'hi';
            const data = await scholarshipWidget.startWidget(db, +testId, locale);
            return next({ data });
        }
        const batchId = await PaidUserChampionshipHelper.getBatchByAssortmentIdAndStudentId(db, studentId, assortmentId);
        if (widgetType === 'paid_user_championship_profile') {
            const data = await PaidUserChampionshipHelper.getUserScores(db, studentId, assortmentId, locale, batchId, tab, config);
            return next({ data });
        }
        if (widgetType === 'paid_user_championship_check_rewards') {
            const { student_id: userStudentId } = req.user;

            const data = await PaidUserChampionshipHelper.getShirtFlow(db, userStudentId, locale);
            return next({ data });
        }
        if (widgetType === 'championship_coupon') {
            const data = await PaidUserChampionshipHelper.couponPopUp(locale, assortmentId);
            return next({ data });
        }
        if (widgetType === 'referral_flow') {
            const { student_id: userStudentId } = req.user;
            const data = await commonHelper.getReferralPopUp(db, userStudentId, locale, config);
            return next({ data });
        }
    } catch (err) {
        return next({ err });
    }
}

async function addressFormData(req, res, next) {
    const {
        type,
    } = req.query;
    if (type === 'paid_user_championship_reward') {
        return paidUserChampionshipHelperV1.claimReward(req, res, next);
    }
    return courseHelperV1.claimReward(req, res, next);
}

async function submitAddress(req, res, next) {
    const {
        type,
    } = req.body;
    if (type === 'paid_user_championship_reward') {
        return paidUserChampionshipHelperV1.submitClaim(req, res, next);
    }
    return courseHelperV1.submitClaim(req, res, next);
}

async function getInappPopup(req, res, next) {
    try {
        const db = req.app.get('db');
        const { page, session_id: sessionId } = req.query;
        const { version_code: versionCode } = req.headers;
        const { student_id: studentId, student_class: studentClass, locale } = req.user;
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;
        let respData = {};
        if (!isFreeApp) {
            // fetching popuplist and user last watched data
            const [popupList, popupViewData, lastWatchedPopupId, lastWatchedSessionPopupCount, overallSessionLimit, overallDailyLimit] = await Promise.all([
                NudgeContainer.getInAppPopUpData(db, page, studentClass, versionCode),
                commonHelper.getPopupViewData(studentId, page),
                NudgeRedis.getUserPopupWatchedData(db.redis.read, studentId, 'LAST_WATCHED_POPUP'),
                NudgeRedis.getUserPopupWatchedData(db.redis.read, studentId, 'LAST_WATCHED_SESSION_POPUP_COUNTS'),
                NudgeRedis.getUserPopupWatchedData(db.redis.read, studentId, `OVERALL_SESSION_LIMIT_${page}_${sessionId}`),
                NudgeRedis.getUserPopupWatchedData(db.redis.read, studentId, `OVERALL_DAILY_LIMIT_${page}`),
            ]);

            // finding next popup index and parsing user watched data
            let nextPopupIndex = 0;
            let lastWatchedPopupIdData = {};
            let lastWatchedSessionPopupCountData = {};
            if (!_.isNull(lastWatchedPopupId)) {
                lastWatchedPopupIdData = JSON.parse(lastWatchedPopupId);
                const currentDate = moment().add(5, 'h').add(30, 'm').format('DD-MM-YYYY');
                if (currentDate === lastWatchedPopupIdData.last_active_date) {
                    nextPopupIndex = commonHelper.findNextPopupDeeplinkIndex(popupList, lastWatchedPopupIdData);
                    if (!_.isNull(lastWatchedSessionPopupCount)) {
                        lastWatchedSessionPopupCountData = JSON.parse(lastWatchedSessionPopupCount);
                    }
                } else {
                    lastWatchedPopupIdData = {};
                }
            }

            // reponse fetch for a particular index until not found or limit exceed
            const newPopUpList = [...popupList.slice(nextPopupIndex, popupList.length), ...popupList.splice(0, nextPopupIndex)];
            nextPopupIndex = 0;
            while (nextPopupIndex < newPopUpList.length) {
                respData = await commonHelper.findNextPopupDeeplinkData(db, studentId, studentClass, locale, versionCode, sessionId, newPopUpList[nextPopupIndex], popupViewData, lastWatchedPopupIdData, lastWatchedSessionPopupCountData, overallSessionLimit, overallDailyLimit);
                nextPopupIndex++;
                if (respData.deeplink || respData.notification_popup_data) {
                    break;
                }
            }
        }
        next({ data: respData });
    } catch (e) {
        next(e);
    }
}

module.exports = {
    bottomSheet, dialog, getCourseBottomSheetHomepage, addressFormData, submitAddress, getInappPopup,
};
