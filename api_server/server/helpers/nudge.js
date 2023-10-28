/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const moment = require('moment');
const NudgeMysql = require('../../modules/mysql/nudge');
const NudgeRedis = require('../../modules/redis/nudge');
const LiveclassData = require('../../data/liveclass.data');
const TgHelper = require('./target-group');
const redisAnswer = require('../../modules/redis/answer');
const staticData = require('../../data/data');
const StudentMySQL = require('../../modules/mysql/student');
const StudentRedis = require('../../modules/redis/student');
const CourseContainer = require('../../modules/containers/coursev2');
const Notification = require('../../modules/notifications');
const StudentCourseMapping = require('../../modules/studentCourseMapping');

function getWidget(nudges, config, variantId) {
    const widgetData = {};
    widgetData.type = 'nudges';
    widgetData.data = {};
    widgetData.data.title = 'Nudge carousel';
    widgetData.data.scroll_type = 'horizontal';
    widgetData.data.items = [];
    for (let i = 0; i < nudges.length; i++) {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const timeRemaining = moment(nudges[i].end_time).diff(now, 'seconds');
        const item = {};
        item.id = nudges[i].id;
        item.nudge_id = nudges[i].id;
        item.type = nudges[i].type;
        item.title = nudges[i].text;
        item.subtitle = nudges[i].subtitle_text || '';
        item.scratch_text = nudges[i].display_text;
        item.bottom_text = nudges[i].display_text || '';
        item.bottom_text_color = '#ffffff';
        item.price_text = nudges[i].price_text;
        item.buy_now_text = nudges[i].optional_display_text1 || '';
        if (nudges[i].trigger_events === 'validity_reminder') {
            item.subtitle = '';
        }
        item.end_time = timeRemaining * 1000;
        item.coupon_code = nudges[i].coupon_id;
        item.deeplink = nudges[i].trigger_events === 'emi_reminder' || nudges[i].trigger_events === 'validity_reminder' ? `${nudges[i].deeplink}${variantId}` : nudges[i].deeplink;
        item.image_url = nudges[i].display_image_rectangle || LiveclassData.salesTimerCardImage(config);
        item.image_url_second = nudges[i].display_image_square || LiveclassData.salesTimerCardImage2(config);
        item.price_text_color = '#ffffff';
        item.buy_now_text_color = '#ffffff';
        item.dialog = nudges[i].trigger_events === 'data_watch_time';
        widgetData.data.items.push(item);
    }
    return widgetData;
}

async function getPopUpDeeplink({
    db,
    studentID,
    event,
    locale,
    studentClass,
}) {
    // this function return nudgepopup deeplink value based on trigger event and user last seen nudge check
    const nudgeList = ['nudge_popup', 'course_popup_auto_board', 'course_popup_auto_exam'];
    const promise = [];
    for (let i = 0; i < nudgeList.length; i++) {
        promise.push(CourseContainer.getByTypeAndEvent(db, nudgeList[i], event, studentClass));
    }
    const settledPromises = await Promise.allSettled(promise);
    let nudgeData = settledPromises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
    nudgeData = nudgeData.filter((value) => !_.isEmpty(value));
    nudgeData = _.flatten(nudgeData);
    for (let i = 0; i < nudgeData.length; i++) {
        const [
            checkLastShownTime,
            visibilityCount,
        ] = await Promise.all([
            NudgeRedis.getUserSessionByNudgeID(db.redis.read, studentID, nudgeData[i].id),
            NudgeRedis.getUserViewCountByNudgeID(db.redis.read, studentID, nudgeData[i].id),
        ]);
        const visibilityCountExceeded = !visibilityCount || JSON.parse(visibilityCount) < nudgeData[0].count;
        if (!checkLastShownTime && visibilityCountExceeded) {
            let tgCheck = true;
            if (nudgeData[i].target_group) {
                tgCheck = await TgHelper.targetGroupCheck({
                    db, studentId: studentID, tgID: nudgeData[i].target_group, studentClass, locale,
                });
            }
            const duration = nudgeData.length ? nudgeData[i].duration : 1;
            NudgeRedis.setUserSessionByNudgeID(db.redis.write, studentID, nudgeData[i].id, duration || 1);
            if (nudgeData[0].count > 0 && !visibilityCount) {
                NudgeRedis.setUserViewCountByNudgeID(db.redis.write, studentID, nudgeData[i].id, duration || 1);
            } else if (nudgeData[0].count > 0) {
                NudgeRedis.updateUserViewCountByNudgeID(db.redis.write, studentID, nudgeData[i].id, duration || 1);
            }
            if (tgCheck) {
                if (event === 'prepurchase_course' || event === 'postpurchase_course' || event === 'prepurchase_course_back' || event === 'postpurchase_course_back') {
                    return `doubtnutapp://nudge_popup?nudge_id=${nudgeData[i].id}&is_transparent=false`;
                }
                if (nudgeData[i].type == 'course_popup_auto_board' || nudgeData[i].type == 'course_popup_auto_exam') {
                    if (studentClass <= 8) {
                        return `doubtnutapp://nudge_popup?nudge_id=${nudgeData[i].id}`;
                    }
                    let studentCcm = await StudentCourseMapping.getStudentSelectedCourseActive(studentID, db.mysql.read);
                    if (nudgeData[i].type == 'course_popup_auto_board') {
                        studentCcm = studentCcm.filter((x) => x.category == 'board');
                    }
                    if (nudgeData[i].type == 'course_popup_auto_exam') {
                        studentCcm = studentCcm.filter((x) => x.category == 'exam');
                    }
                    if (!studentCcm.length) {
                        continue;
                    }
                }

                return `doubtnutapp://nudge_popup?nudge_id=${nudgeData[i].id}`;
            }
        }
    }
    return '';
}

async function checkEligiblityForRenewalNudge({
    db,
    type,
    studentID,
    assortmentID,
}) {
    const nudgeID = assortmentID;
    const checkLastShownTime = type === 'renewal' ? await NudgeRedis.getUserSessionByAssortmentID(db.redis.read, studentID, assortmentID) : await NudgeRedis.getUserSessionByNudgeID(db.redis.read, studentID, nudgeID);
    return !checkLastShownTime;
}

async function checkTargetGroupEligibilityForNudge({
    db, studentId: studentID, tgID, studentClass, locale,
}) {
    try {
        const tgCheck = await TgHelper.targetGroupCheck({
            db, studentId: studentID, tgID, studentClass, locale,
        });
        return tgCheck;
    } catch (e) {
        console.log(e);
    }
}

async function getSurveyBottomSheetDeeplink({
    db,
    event,
    locale,
    studentID,
    studentClass,
}) {
    const surveyData = await NudgeMysql.getSurveyByTypeAndEvent(db.mysql.read, event, locale, studentClass);
    if (surveyData.length) {
        const checkLastShownTime = await NudgeRedis.getUserSessionBySurveyID(db.redis.read, studentID, surveyData[0].id);
        if (!checkLastShownTime) {
            let tgCheck = true;
            if (surveyData[0].target_group) {
                tgCheck = await TgHelper.targetGroupCheck({
                    db, studentId: studentID, tgID: surveyData[0].target_group, studentClass, locale,
                });
            }
            NudgeRedis.setUserSessionBySurveyID(db.redis.write, studentID, surveyData[0].id, surveyData[0].duration || 1);
            if (tgCheck) {
                return `doubtnutapp://app_survey?survey_id=${surveyData[0].id}`;
            }
        }
        return null;
    }
    return null;
}

function getContentType(etTime, bufferDay) {
    const timeStamp = moment().add(5, 'h').add(30, 'minutes').unix();
    if (etTime && (timeStamp - (+etTime)) > 0) {
        return 1;
    }
    if (bufferDay && (timeStamp - (+bufferDay)) > 0) {
        return 2;
    }
    return 0;
}

async function getContinueWatchingBottomSheet(db, studentID) {
    let deeplink;
    const [etTime, bufferDay, userActiveCourses] = await Promise.all([
        redisAnswer.getUserLiveClassWatchedVideo(db.redis.read, studentID, 'LIVECLASS_VIDEO_LF_ET_TIME'),
        redisAnswer.getUserLiveClassWatchedVideo(db.redis.read, studentID, 'LIVECLASS_VIDEO_LF_ET_BUFFER_TIME'),
        CourseContainer.getUserActivePackages(db, studentID),
    ]);
    const contentType = getContentType(etTime, bufferDay);
    if (contentType && userActiveCourses && userActiveCourses.length === 0) {
        deeplink = `doubtnutapp://bottom_sheet_widget?widget_type=homepage_continue_watching&user_category=${contentType}`;
    } else {
        const notificationData = await Notification.getPendingNotificationNew(db.mongo.read, studentID);
        if (notificationData && notificationData.length) {
            return [null, notificationData[0].message];
        }
        deeplink = 'doubtnutapp://bottom_sheet_widget?widget_type=homepage_continue_watching'; // replace with notification deeplink
    }
    return [deeplink, null];
}

async function getInappSurveyPopupId(db, studentId, studentClass, locale, versionCode, surveyId) {
    if (surveyId) {
        const surveyData = await StudentMySQL.getLastFeedbackBySurveyId(db.mysql.read, surveyId, studentId);
        if (!surveyData.length) {
            return surveyId;
        }
        return null;
    }
    const NPS_ID = 6;
    const testingSids = staticData.surveyTestingIds;
    if (versionCode >= 851) {
        const surveyNo = 0;

        const promiseArr = [
            StudentMySQL.getAllSurveyByUser(db.mysql.read, studentId),
            StudentMySQL.getSurveyFeedbackDataForUser(db.mysql.read, studentId),
            StudentMySQL.getLastFeedbackBySurveyId(db.mysql.read, NPS_ID, studentId),
        ];
        const allRes = await Promise.all(promiseArr);

        let allSurveyByUser = allRes[0];
        const studentFeedbackDetails = allRes[1];
        const lastFeedbackOfRepeatingSurvey = allRes[2];

        allSurveyByUser = allSurveyByUser.filter((x) => x.locale === 'all' || x.locale === locale);
        if (!allSurveyByUser.find((x) => x.id === 6)) {
            allSurveyByUser.push({ id: 6, locale: 'all' });
            allSurveyByUser = _.orderBy(allSurveyByUser, 'id', 'desc');
        }
        const requiredResult = [];
        for (let i = 0; i < allSurveyByUser.length; i++) {
            let tgCheck = true;
            if (allSurveyByUser[i].target_group) {
                // eslint-disable-next-line no-await-in-loop
                tgCheck = await TgHelper.targetGroupCheck({
                    db, studentId, tgID: allSurveyByUser[i].target_group, studentClass, locale,
                });
            }
            if (tgCheck) {
                requiredResult.push(allSurveyByUser[i]);
            }
        }
        allSurveyByUser = requiredResult;

        let isStudentCached = 0;
        let isPackageAvailable = 0;
        if (lastFeedbackOfRepeatingSurvey.length === 0) {
            isStudentCached = await StudentRedis.getSurveyStudentId(studentId, db.redis.read);
        } else {
            isPackageAvailable = await StudentMySQL.getStudentActivePackages(studentId, db.mysql.read);
        }
        const surveyDoneArr = studentFeedbackDetails.map((x) => x.survey_id);
        if (allSurveyByUser.length > 0) {
            for (const item of allSurveyByUser) {
                if (surveyNo === 0) {
                    let flag = 0;
                    if (item.id === NPS_ID) {
                        if (isStudentCached) {
                            flag = 1;
                        } else if (isPackageAvailable && isPackageAvailable.length > 0 && isPackageAvailable[0].EXIST === 1) {
                            const now = new Date().getTime();
                            const lastFeedbackTime = new Date(lastFeedbackOfRepeatingSurvey[0].time).getTime();
                            const diff = now - lastFeedbackTime;
                            const diffHours = Math.floor(((diff / 1000) / 60) / 60); // hours
                            const lastFeedbackType = lastFeedbackOfRepeatingSurvey[0].type;
                            if (lastFeedbackType === 'feedback') {
                                let { feedback } = lastFeedbackOfRepeatingSurvey[0];
                                feedback = feedback.replace(/\n/g, '');
                                if (feedback === 'Haan, Zaroor Batunga' && diffHours >= 24 * 14) {
                                    flag = 1;
                                } else if ((feedback === 'Nahi, Utna Accha Nahi Laga' || feedback === 'Abhi Socha Nahi Hai') && diffHours >= 24 * 7) {
                                    flag = 1;
                                }
                            } else if (lastFeedbackType === 'started' && diffHours >= 24 * 10) {
                                flag = 1;
                            }
                        }
                    } else if (!surveyDoneArr.includes(item.id) || testingSids.includes(parseInt(studentId))) {
                        flag = 1;
                    }
                    if (flag === 1) {
                        return item.id;
                    }
                }
            }
        }
    }
    return null;
}

module.exports = {
    getWidget, getPopUpDeeplink, checkEligiblityForRenewalNudge, checkTargetGroupEligibilityForNudge, getSurveyBottomSheetDeeplink, getContinueWatchingBottomSheet, getInappSurveyPopupId,
};
