const _ = require('lodash');
const moment = require('moment');
const MicroconceptContainer = require('../../../modules/containers/microconcept');
const AnswerContainer = require('../../../modules/containers/answer');
const CourseContainer = require('../../../modules/containers/course');
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const Data = require('../../../data/data');
const mysqlCourse = require('../../../modules/mysql/course');
const Liveclass = require('../../../modules/mysql/liveclass');
// const coursev2 = require('../../../modules/mysql/coursev2');
const UtilityVDO = require('../../../modules/utility.vdocipher');
const CourseHelper = require('../../helpers/course');

async function checkEVideos(db, data, questionWithAnswer, student_id) {
    try {
        if (Data.et_student_id.includes(questionWithAnswer.student_id)) {
        // if(true){
            const promises = [];
            promises.push(CourseContainer.checkForDemo(db, questionWithAnswer.question_id));
            promises.push(mysqlCourse.checkVip(db.mysql.read, student_id));
            promises.push(CourseContainer.getLectureIdFromQuestionId(db, questionWithAnswer.question_id));
            // promises.push(CourseContainer.getEResourcesFromQuestionId(db, questionWithAnswer.question_id));
            const resolvedPromisesData = await Promise.all(promises);
            console.log(resolvedPromisesData);
            if (resolvedPromisesData[0].length > 0) {
                data.isPremium = false;
            } else {
                data.isPremium = true;
            }
            if (resolvedPromisesData[1].length > 0) {
                data.isVip = true;
                if (resolvedPromisesData[1].amount == -1.00) {
                    data.trial_text = `Your Free Trial will expire in ${resolvedPromisesData[1][0].diff} days`;
                }
            }
            if (resolvedPromisesData[2].length > 0) {
                data.lecture_id = resolvedPromisesData[2][0].id;
            }
        }
        return data;
    } catch (e) {
        console.log(e);
        return data;
    }
}

// eslint-disable-next-line no-unused-vars
async function checkLiveClassVideos(db, data, questionWithAnswer, studentID, versionCode, studentClass) {
    try {
        if (versionCode < 784) {
            data.is_vip = true;
            const result = await Liveclass.getCourseIdByresourceReference(db.mysql.read, questionWithAnswer.question_id.toString());
            if (result.length > 0) {
                data.course_id = result[0].liveclass_course_id;
            }
            const subscribedCourses = await Liveclass.getSubscribedCourse(db.mysql.read, studentID);
            for (let i = 0; i < subscribedCourses.length; i++) {
                if (subscribedCourses[i].reference_id == data.course_id) {
                    data.is_vip = true;
                }
            }
            data.is_premium = true;
        } else {
            const result = await CourseContainerV2.getAssortmentsByResourceReference(db, questionWithAnswer.question_id);
            if (result.length && !result[0].is_free) {
                data.is_premium = true;
                const isVipAndAssortmentListData = await CourseHelper.checkVipByQuestionIdForVideoPage(db, result, studentID, questionWithAnswer.question_id);
                data.is_vip = isVipAndAssortmentListData.isVip;
                data.payment_deeplink = `doubtnutapp://vip?assortment_id=${result[0].assortment_id}`;
            } else {
                data.is_premium = false;
                data.is_vip = true;
            }
        }
        return data;
    } catch (e) {
        console.log(e);
        return data;
    }
}

async function getNextMicroConcept(mcID, studentClass, studentCourse, data, db) {
    let promiseResolve;
    const promise = new Promise((resolve) => {
        promiseResolve = resolve;
    });
    try {
        let nextMicroConcept;
        const microConceptOrderData = await MicroconceptContainer.getByMcCourseMappingByClassAndCourse(mcID, studentClass, studentCourse, db);
        let { chapter_order: chapterOrder, sub_topic_order: subTopicOrder } = microConceptOrderData[0];
        const { subject } = microConceptOrderData[0];
        let microConceptOrder = microConceptOrderData[0].micro_concept_order + 1;
        data.question_meta = {
            chapter: microConceptOrderData[0].chapter,
            subtopic: microConceptOrderData[0].subtopic,
        };
        nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(studentClass, studentCourse, chapterOrder, subTopicOrder, microConceptOrder, subject, db);
        if (!nextMicroConcept.length > 0) {
            // get next micro concept using subtopic order
            subTopicOrder += 1;
            microConceptOrder = 1;
            nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(studentClass, studentCourse, chapterOrder, subTopicOrder, microConceptOrder, subject, db);
            if (!nextMicroConcept.length > 0) {
            // get next micro concept using chapter order
                chapterOrder += 1;
                subTopicOrder = 1;
                nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(studentClass, studentCourse, chapterOrder, subTopicOrder, microConceptOrder, subject, db);
                data.next_microconcept = nextMicroConcept[0];
                promiseResolve(data);
                return promise;
            }
            data.next_microconcept = nextMicroConcept[0];
            promiseResolve(data);
            return promise;
        }
        data.next_microconcept = nextMicroConcept[0];
        promiseResolve(data);
        return promise;
    } catch (e) {
        promiseResolve(data);
        return promise;
    }
}

function dashHandling(originalData, questionWithAnswer, config) {
    originalData.is_shareable = true;
    originalData.use_fallback = true;
    originalData.is_dn_video = true;
    if (questionWithAnswer.is_vdo_ready == 2) {
        let licenseUrl = '';
        const contentID = questionWithAnswer.vdo_cipher_id;
        if (!_.isEmpty(contentID) && !_.isNull(contentID)) {
            licenseUrl = UtilityVDO.getLicenseUrl(contentID, config);
            if (originalData.is_premium && originalData.is_vip) {
                originalData.is_downloadable = true;
            }
        }
        originalData.drm_license_url = licenseUrl;
        originalData.media_type = 'dash';
        originalData.drm_scheme = 'widevine';
        originalData.answer_video = `${config.cdn_video_url}${questionWithAnswer.answer_video}`;
        originalData.is_shareable = false;
        originalData.use_fallback = false;
        originalData.is_dn_video = false;
        originalData.is_youtube = false;
    }
    return originalData;
}

async function commentWindow(db, questionId, duration) {
    const result = await Liveclass.getLiveAtByQuestionId(db.mysql.read, questionId);
    let obj = {};
    if (result && result.length) {
        obj = {
            start: moment(result[0].live_at)
                .subtract(5, 'hours').subtract(30, 'minutes')
                .add(parseInt(duration) - 600, 'seconds')
                .unix() * 1000,
            end: moment(result[0].live_at)
                .subtract(5, 'hours').subtract(30, 'minutes')
                .add(parseInt(duration) + 1800, 'seconds')
                .unix() * 1000,
        };
    }
    return obj;
}

async function getLocale(db, studentID, locale) {
    try {
        const result = await AnswerContainer.getVideoLocale(db, studentID);
        if (result.length > 0) {
            locale = result[0].video_language;
        }
        return locale;
    } catch (e) {
        // console.log(e);
        // return locale;
        throw new Error(e);
    }
}

module.exports = {
    getNextMicroConcept,
    checkEVideos,
    dashHandling,
    checkLiveClassVideos,
    commentWindow,
    getLocale,
};
