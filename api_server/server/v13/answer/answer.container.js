/* eslint-disable array-callback-return */
const _ = require('lodash');
const moment = require('moment');
// const MicroconceptContainer = require('../../../modules/containers/microconcept');
const AnswerContainer = require('../../../modules/containers/answer');
const CourseContainer = require('../../../modules/containers/course');
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const Data = require('../../../data/data');
const mysqlCourse = require('../../../modules/mysql/course');
const SchedulerContainer = require('../../../modules/containers/scheduler');
const Liveclass = require('../../../modules/mysql/liveclass');
// const coursev2 = require('../../../modules/mysql/coursev2');
const UtilityVDO = require('../../../modules/utility.vdocipher');
const Utility = require('../../../modules/utility');
const CourseHelper = require('../../helpers/course');
const QuestionContainer = require('../../../modules/containers/question');
const MysqlQuestion = require('../../../modules/mysql/question');
const StudentContainer = require('../../../modules/containers/student');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
// const liveclassCourseContainer = require('../../../modules/containers/liveclassCourse');

async function checkLiveClassVideoByQuestionId(db, questionWithAnswer, versionCode, studentId = 0) {
    try {
        let result = [];
        if (versionCode < 784) {
            result = await Liveclass.getCourseIdByresourceReference(db.mysql.read, questionWithAnswer.question_id.toString());
        } else {
            result = await CourseContainerV2.getAssortmentsByResourceReferenceV1(db, questionWithAnswer.question_id);
        }
        //  else {
        //     result = await liveclassCourseContainer.getAssortmentsByResourceReferenceV1(db, questionWithAnswer.question_id);
        // }
        return result;
    } catch (e) {
        console.log(e);
        return e;
    }
}

async function checkEVideos(db, data, questionWithAnswer, student_id) {
    try {
        if (Data.et_student_id.includes(questionWithAnswer.student_id)) {
            // if(true){
            const promises = [];
            // promises.push(CourseContainer.checkForDemo(db, questionWithAnswer.question_id));
            promises.push([]);
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

async function getVideoOffsetDetails(db, data, totalMapppings, studentID, page, flagrResp, isBrowser) {
    // console.log(flagrResp);
    const variantId = (flagrResp && flagrResp.paid_video_lock_unlock_experiment && flagrResp.paid_video_lock_unlock_experiment.payload && flagrResp.paid_video_lock_unlock_experiment.payload.enabled) ? flagrResp.paid_video_lock_unlock_experiment.variantId : 0;
    const locale = (data.doubt.match(/HIN/i)) ? 'hi' : 'en';
    const [videoExperimentDetailsdata, courseDetails] = await Promise.all([
        mysqlCourse.getVideoExperimentDetailsdata(db.mysql.read, locale, variantId),
        mysqlCourse.getCourseDetailsWithPrice(db.mysql.read, totalMapppings),
    ]);

    const batchMapping = await CourseHelper.getBatchByAssortmentListAndStudentId(db, studentID, totalMapppings);
    let courseDetailsData = courseDetails;
    if (!_.isEmpty(batchMapping)) {
        const batchCourseDetails = courseDetails.filter((item) => item.batch_id === batchMapping[item.assortment_id]);
        if (batchCourseDetails.length) {
            courseDetailsData = batchCourseDetails;
        }
    }

    if (videoExperimentDetailsdata.length && videoExperimentDetailsdata[0].lock_time_sec && courseDetailsData.length && courseDetailsData[0].assortment_id && courseDetailsData[0].id) {
        // remove array when sturcture changes is done
        const assortmentIdList = (videoExperimentDetailsdata[0].assortment_id) ? videoExperimentDetailsdata[0].assortment_id.split(',') : [];
        const enabledPageList = (videoExperimentDetailsdata[0].page) ? videoExperimentDetailsdata[0].page.split(',') : [];

        // set lock unlock meta parameters
        const metaData = {
            title: videoExperimentDetailsdata[0].message_title,
            description: videoExperimentDetailsdata[0].message_description,
            course_details_button_text: videoExperimentDetailsdata[0].course_details_button_text,
            course_details_button_deeplink: `doubtnutapp://course_details?id=${courseDetailsData[0].assortment_id}`,
            course_purchase_button_text: videoExperimentDetailsdata[0].course_purchase_button_text,
            course_purchase_button_deeplink: `doubtnutapp://vip?variant_id=${courseDetailsData[0].id}`,
        };
        const monthlyCoursePrice = (courseDetailsData[0].display_price && courseDetailsData[0].duration_in_days) ? Math.floor(courseDetailsData[0].display_price / Math.floor(courseDetailsData[0].duration_in_days / 30)) : null;
        metaData.course_id = courseDetailsData[0].assortment_id;
        metaData.course_details_button_deeplink = (courseDetailsData[0].parent === 4) ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : metaData.course_details_button_deeplink;
        metaData.description = (courseDetailsData[0].display_name && monthlyCoursePrice) ? metaData.description.replace('##course##', courseDetailsData[0].display_name).replace('##price##', monthlyCoursePrice) : Data.premiumVideoBlockContentMetaData.default_description;

        // exit if implemented for videos level
        const pageCheck = !!(enabledPageList.length && enabledPageList.includes(page));
        const courseCheck = !!(assortmentIdList.length && assortmentIdList.includes(courseDetailsData[0].assortment_id));

        const browserVideoMetaData = {
            description: `To view this content please buy ${courseDetailsData[0].display_name}`,
            course_id: metaData.course_id,
            button: {
                title: `Buy @ ₹${monthlyCoursePrice}/mo`,
                deeplink: metaData.course_purchase_button_deeplink,
            },
        };

        if (videoExperimentDetailsdata[0].is_video_lock && ((!enabledPageList.length && !assortmentIdList.length) || (pageCheck && !assortmentIdList) || (courseCheck && !enabledPageList.length) || (pageCheck && courseCheck))) {
            data.premium_video_block_meta_data = isBrowser ? browserVideoMetaData : { ...metaData, ...Data.premiumVideoBlockContentMetaData };
            data.premium_video_offfset = videoExperimentDetailsdata[0].lock_time_sec;
            return;
        }

        // check for page assortment or both with lock window
        if (!videoExperimentDetailsdata[0].is_video_lock && ((!enabledPageList.length && !assortmentIdList) || (pageCheck && !assortmentIdList) || (courseCheck && !enabledPageList.length) || (pageCheck && courseCheck))) {
            const sidRedisData = await StudentContainer.getById(studentID, db);
            if (videoExperimentDetailsdata[0].lock_window_day && sidRedisData && sidRedisData.length) {
                const currentDay = new Date();
                let dayDiff = 0;
                if (sidRedisData[0].video_lock_unlock_logs_data && sidRedisData[0].video_lock_unlock_logs_data.start_date) {
                    const startDay = new Date(sidRedisData[0].video_lock_unlock_logs_data.start_date);
                    dayDiff = Math.ceil((currentDay.getTime() - startDay.getTime()) / (1000 * 3600 * 24));
                }

                if (!sidRedisData[0].video_lock_unlock_logs_data || (sidRedisData[0].video_lock_unlock_logs_data && sidRedisData[0].video_lock_unlock_logs_data.lock_window_day && dayDiff >= sidRedisData[0].video_lock_unlock_logs_data.lock_window_day)) {
                    data.premium_video_offfset = videoExperimentDetailsdata[0].lock_time_sec;
                    data.video_lock_unlock_logs_data = JSON.stringify({ lock_window_day: videoExperimentDetailsdata[0].lock_window_day, lock_time_sec: videoExperimentDetailsdata[0].lock_time_sec, start_date: currentDay });
                    data.premium_video_block_meta_data = isBrowser ? browserVideoMetaData : { ...metaData, ...Data.premiumVideoBlockContentMetaData };
                    return;
                }

                if (sidRedisData[0].video_lock_unlock_logs_data && sidRedisData[0].video_lock_unlock_logs_data.lock_time_sec && sidRedisData[0].video_lock_unlock_logs_data.lock_window_day && dayDiff < sidRedisData[0].video_lock_unlock_logs_data.lock_window_day) {
                    data.premium_video_offfset = sidRedisData[0].video_lock_unlock_logs_data.lock_time_sec;
                    data.video_lock_unlock_logs_data = JSON.stringify(sidRedisData[0].video_lock_unlock_logs_data);
                    data.premium_video_block_meta_data = isBrowser ? browserVideoMetaData : { ...metaData, ...Data.premiumVideoBlockContentMetaData };
                    return;
                }

                data.premium_video_offfset = 0;
                data.premium_video_block_meta_data = isBrowser ? browserVideoMetaData : { ...metaData, ...Data.premiumVideoBlockContentMetaData };
            }
        }
    }
}

function addDataForConvivaAnalysis(data, result, userPackages) {
    data.analysis_data = {
        is_vip: data.is_vip,
        faculty_name: result[0].expert_name,
        subscription_start: userPackages && userPackages.length ? moment(userPackages[0].start_date).format('DD-MM-YYYY') : '',
        subscription_end: userPackages && userPackages.length ? moment(userPackages[0].end_date).format('DD-MM-YYYY') : '',
        batch_id: data.batch_id,
        assortment_id: result[0].assortment_id,
    };
    if (result[0].faculty_id) {
        data.analysis_data.faculty_id = result[0].faculty_id;
    }
    if (data.premium_video_block_meta_data && data.premium_video_block_meta_data.course_id) {
        data.analysis_data.course_id = data.premium_video_block_meta_data.course_id;
    }
    return data;
}

async function checkLiveClassVideos(db, data, questionWithAnswer, studentID, versionCode, studentClass, result, page, flagrResp, isBrowser) {
    try {
        let scheduler = false;
        // check for scheduler
        const isExist = await SchedulerContainer.checkQid(db, questionWithAnswer.question_id);
        if (isExist.length > 0) {
            scheduler = true;
        }
        if (versionCode < 784) {
            data.is_vip = true;
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
        } else if (result.length && !result[0].is_free && !scheduler) {
            data.is_premium = true;
            // vip check for videos
            const isVipAndAssortmentListData = await CourseHelper.checkVipByQuestionIdForVideoPage(db, result, studentID, questionWithAnswer.question_id);
            data.is_vip = isVipAndAssortmentListData.isVip;
            data.userPackages = isVipAndAssortmentListData.userPackages;
            if (data.is_premium && !data.is_vip && versionCode >= 884) {
                await getVideoOffsetDetails(db, data, isVipAndAssortmentListData.totalMapppings, studentID, page, flagrResp, isBrowser);
            }
            data.batch_id = isVipAndAssortmentListData.batchId;
            data.payment_deeplink = `doubtnutapp://vip?assortment_id=${result[0].assortment_id}`;
            // set playlist for kot classes videos
            if (result[0].parent === 4) {
                CourseHelper.setPlaylistOfUserForEtoos(db, studentID, result[0].assortment_id);
            }
            addDataForConvivaAnalysis(data, result, data.userPackages);
        } else {
            // for free LF videos
            data.batch_id = 1; // TODO: get batch for free courses.
            data.is_premium = false;
            data.is_vip = true;
            if (result.length && result[0].parent === 4) {
                CourseHelper.setPlaylistOfUserForEtoos(db, studentID, result[0].assortment_id);
            } else if (result.length && !result[0].is_chapter_free) {
                CourseHelper.checkVipByQuestionIdForVideoPage(db, result, studentID, questionWithAnswer.question_id);
            }
            addDataForConvivaAnalysis(data, result, []);
        }
        return data;
    } catch (e) {
        console.log(e);
        return data;
    }
}

// async function getNextMicroConcept(mcID, studentClass, studentCourse, data, db) {
//     let promiseResolve;
//     const promise = new Promise((resolve) => {
//         promiseResolve = resolve;
//     });
//     try {
//         let nextMicroConcept;
//         const microConceptOrderData = await MicroconceptContainer.getByMcCourseMappingByClassAndCourse(mcID, studentClass, studentCourse, db);
//         let { chapter_order: chapterOrder, sub_topic_order: subTopicOrder } = microConceptOrderData[0];
//         const { subject } = microConceptOrderData[0];
//         let microConceptOrder = microConceptOrderData[0].micro_concept_order + 1;
//         data.question_meta = {
//             chapter: microConceptOrderData[0].chapter,
//             subtopic: microConceptOrderData[0].subtopic,
//         };
//         nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(studentClass, studentCourse, chapterOrder, subTopicOrder, microConceptOrder, subject, db);
//         if (!nextMicroConcept.length > 0) {
//             // get next micro concept using subtopic order
//             subTopicOrder += 1;
//             microConceptOrder = 1;
//             nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(studentClass, studentCourse, chapterOrder, subTopicOrder, microConceptOrder, subject, db);
//             if (!nextMicroConcept.length > 0) {
//             // get next micro concept using chapter order
//                 chapterOrder += 1;
//                 subTopicOrder = 1;
//                 nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(studentClass, studentCourse, chapterOrder, subTopicOrder, microConceptOrder, subject, db);
//                 data.next_microconcept = nextMicroConcept[0];
//                 promiseResolve(data);
//                 return promise;
//             }
//             data.next_microconcept = nextMicroConcept[0];
//             promiseResolve(data);
//             return promise;
//         }
//         data.next_microconcept = nextMicroConcept[0];
//         promiseResolve(data);
//         return promise;
//     } catch (e) {
//         promiseResolve(data);
//         return promise;
//     }
// }

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

function generateVideoResourceObject(config, videoResource, timeout, questionID, versionCode, offsetEnabled = false) {
    const obj = {};
    let drmLicenseUrl = '';
    const drmScheme = 'widevine';
    let offset = null;
    if (offsetEnabled && versionCode > 844) {
        offset = (typeof videoResource.video_offset !== 'undefined') ? videoResource.video_offset : null;
    }
    obj.resource = videoResource.resource;
    obj.is_flv = false;
    obj.video_resource = videoResource.resource;
    obj.timeout = timeout;
    obj.drm_scheme = drmScheme;
    obj.media_type = videoResource.resource_type;
    let dropDownList = [];
    if (videoResource.resource_type === 'DASH') {
        if (!_.isEmpty(videoResource.vdo_cipher_id) && !_.isNull(videoResource.vdo_cipher_id)) {
            drmLicenseUrl = UtilityVDO.getLicenseUrl(videoResource.vdo_cipher_id, config);
        }
        obj.resource = buildStaticCdnUrl(`${config.cdn_video_url}${videoResource.resource}`, true);
        if (videoResource.resource.includes('http')) {
            obj.resource = videoResource.resource;
        }
    } else if (videoResource.resource_type === 'HLS') {
        if (!_.isEmpty(videoResource.vdo_cipher_id) && !_.isNull(videoResource.vdo_cipher_id)) {
            drmLicenseUrl = UtilityVDO.getLicenseUrl(videoResource.vdo_cipher_id, config);
        }
        obj.resource = buildStaticCdnUrl(`${config.cdn_video_url}${videoResource.resource}`, true);
        // check if tencent
        if (videoResource.resource.includes('vod2.myqcloud')) {
            obj.resource = videoResource.resource;
        }
        if (videoResource.resource.includes('http')) {
            obj.resource = videoResource.resource;
        }
    } else if (videoResource.resource_type === 'RTMP') {
        const streamName = `${questionID}_H264xait`;
        const streamName2 = `${questionID}_480`;
        const streamName3 = `${questionID}_720`;
        dropDownList = [
            {
                display: '360',
                resource: `http://live.doubtnut.com/live/${streamName}.flv`,
                drm_scheme: '',
                drm_license_url: '',
                offset,
                media_type: 'BLOB',
                timeout,
            },
            {
                display: '480',
                resource: `http://live.doubtnut.com/live/${streamName2}.flv`,
                drm_scheme: '',
                drm_license_url: '',
                offset,
                media_type: 'BLOB',
                timeout,
            },
            {
                display: '720',
                resource: `http://live.doubtnut.com/live/${streamName3}.flv`,
                drm_scheme: '',
                drm_license_url: '',
                offset,
                media_type: 'BLOB',
                timeout,
            },
        ];
        // add timeshift resource
        obj.time_shift_resource = {
            resource: Utility.getTimeshiftUrl(config.liveclass.vodDomain, config.liveclass.appName, questionID),
            drm_scheme: '',
            drm_license_url: '',
            media_type: 'HLS',
            offset,
        };
    } else if (videoResource.resource_type === 'BLOB') {
        obj.resource = buildStaticCdnUrl(`${config.cdn_video_url}${videoResource.resource}`, true);
        if (videoResource.resource.includes('http')) {
            obj.resource = videoResource.resource;
        }
    }

    obj.drop_down_list = dropDownList;
    obj.drm_license_url = drmLicenseUrl;
    if (videoResource.resource_type !== 'RTMP') {
        obj.offset = offset;
    }
    if (videoResource.resource_type === 'RTMP') {
        obj.resource = `http://live.doubtnut.com/live/${questionID}_H264xait.flv`;
        obj.video_resource = `http://live.doubtnut.com/live/${questionID}_H264xait.flv`;
        obj.timeout = timeout;
        obj.drm_scheme = drmScheme;
        obj.media_type = 'BLOB';
        obj.is_flv = true;
    }
    return obj;
}
function getDefaultVideoResource(config, questionWithAnswer, versionCode) {
    try {
        const videoResource = [];
        let obj = {};
        // TODO: Handling of 1. rtmp and 2. broken stream to youtube player cases.
        if (_.includes([0, 1], questionWithAnswer.is_vdo_ready)) {
            // if (_.includes(Data.yt_student_id, questionWithAnswer.student_id)) {
            //     // youtube resource
            //     obj = generateVideoResourceObject(config, {
            //         resource: questionWithAnswer.youtube_id,
            //         resource_type: 'YOUTUBE',
            //         vdo_cipher_id: questionWithAnswer.vdo_cipher_id,
            //     }, 4, questionWithAnswer.question_id);
            // }
            // blob resource
            obj = generateVideoResourceObject(config, {
                resource: questionWithAnswer.answer_video,
                resource_type: 'BLOB',
                vdo_cipher_id: null,
                video_offset: null,
            }, 4, questionWithAnswer.question_id, versionCode, false);
            videoResource.push(obj);
        }
        if (questionWithAnswer.is_vdo_ready === 2) {
            // DASH resource
            obj = generateVideoResourceObject(config, {
                resource: questionWithAnswer.answer_video,
                resource_type: 'DASH',
                vdo_cipher_id: questionWithAnswer.vdo_cipher_id,
                video_offset: null,
            }, 4, questionWithAnswer.question_id, versionCode, false);
            videoResource.push(obj);
        }
        if (questionWithAnswer.is_vdo_ready === 3) {
            // HLS resource
            obj = generateVideoResourceObject(config, {
                resource: questionWithAnswer.answer_video,
                resource_type: 'HLS',
                vdo_cipher_id: questionWithAnswer.vdo_cipher_id,
                video_offset: null,
            }, 4, questionWithAnswer.question_id, versionCode, false);
            videoResource.push(obj);
        }
        return videoResource;
    } catch (e) {
        throw new Error(e);
    }
}

async function getAnswerVideoResource(db, config, answerID, questionID, supportedMediaList, versionCode, offsetEnabled = false) {
    try {
        const timeout = 4;
        let answerResources = await AnswerContainer.getAnswerVideoResource(db, answerID);
        answerResources = answerResources.slice(0, 2);
        const list = answerResources.map((item) => {
            if (_.includes(supportedMediaList, item.resource_type)) {
                const returned = generateVideoResourceObject(config, item, timeout, questionID, versionCode, offsetEnabled);
                if (!_.isNull(returned)) {
                    return returned;
                }
            }
        });
        if (list.length > 0) {
            return list;
        }
        return null;
    } catch (e) {
        console.error(e);
        throw new Error(e);
    }
}

async function getOneMinVideoLink(db, questionWithAnswer, videoResource) {
    const vidLang = await QuestionContainer.getVideoSubjectUsa(questionWithAnswer.question_id, db.mysql.read);
    let oneMinVidLink = '';
    let videoList = [];
    if (vidLang !== 'en') {
        const oneMinuteExist = await MysqlQuestion.getOneMinuteVideo(db.mysql.read, questionWithAnswer.answer_id);
        if (oneMinuteExist.length > 0) {
            oneMinVidLink = `https://d2ni2wmgjy1ooe.cloudfront.net/1min/${questionWithAnswer.answer_video}`;
        }
    }
    if (oneMinVidLink !== '') {
        videoList = videoResource.filter((item) => item.media_type === 'BLOB');
        if (videoList.length === 1) {
            videoList[0].resource = oneMinVidLink;
        } else {
            videoList = [
                {
                    resource: oneMinVidLink,
                    timeout: 4,
                    drm_scheme: 'widevine',
                    media_type: 'BLOB',
                    drop_down_list: [],
                    drm_license_url: '',
                },
            ];
        }
    }
    return videoList;
}

async function getUsExamData(db, questionId) {
    let examData = '';
    const usExamArr = ['SAT', 'ACT'];
    const getExamType = await AnswerContainer.getUsExam(db, questionId);
    if (getExamType.length === 1 && !_.isNull(getExamType[0].target_group) && usExamArr.includes(getExamType[0].target_group)) {
        examData = getExamType[0].target_group;
    }
    return examData;
}

async function getFlagsForSRP(versionCode) {
    let flagrData = { video_screen_tabs_v2: {}, srp_pdf_download: {} };
    if (versionCode > 815) {
        flagrData = {
            video_screen_tabs_v2_new: {}, srp_pdf_download: {}, ads_combined_experiment: {},
        };
    }
    if (versionCode >= 927) {
        flagrData.suggested_courses_for_you = {};
    }
    return flagrData;
}

async function getFlagsForLiveClassPages() {
    const flagrData = { video_offset: {}, ads_combined_experiment: {} };
    return flagrData;
}

async function getAllFlagsNeededForThePage(db, versionCode, page, liveclassPages, student_id) {
    if (_.includes(liveclassPages, page)) {
        page = 'liveClassPageSample';
    }
    if (page === 'MPVP_BOTTOM_SHEET') {
        page = 'SRP';
    }

    // add all the universal flagr here
    let capabilities = { paid_video_lock_unlock_experiment: {}, renewal_ads_target_page: {} };
    if (versionCode > 1003) {
        capabilities = { paid_video_lock_unlock_experiment: {}, renewal_ads_target_page: {}, video_quality_options_experiment: {} };
    }
    switch (page) {
        case 'SRP':
            capabilities = _.merge(capabilities, await getFlagsForSRP(versionCode));
            break;
        case 'liveClassPageSample':
            capabilities = _.merge(capabilities, await getFlagsForLiveClassPages());
        // eslint-disable-next-line no-fallthrough
        default:
            capabilities = _.merge(capabilities, { popular_course_carousel_similar: {}, ads_combined_experiment: {} });
    }
    const flags = Object.keys(capabilities);
    const promises = [];
    for (let i = 0; i < flags.length; i++) {
        promises.push(CourseContainerV2.getFlagrResp(db, flags[i], student_id));
    }
    const settledPromises = await Promise.allSettled(promises);
    let flagrResp = settledPromises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
    flagrResp = flagrResp.filter((item) => !_.isEmpty(item));
    const obj = {};
    for (let i = 0; i < flagrResp.length; i++) {
        const key = Object.keys(flagrResp[i])[0];
        obj[key] = flagrResp[i][key];
    }
    return obj;
}

function dropDownOptions(cdnLink, item) {
    let videoQualityOptions = [];
    if (item.resource && item.drm_scheme && item.media_type && item.timeout) {
        const staticResponseData = {
            display_color: '#313131',
            display_size: '16',
            subtitle_color: '#817e7e',
            subtitle_size: '14',
            // resource: item.resource,
            resource: '',
            drm_scheme: item.drm_scheme,
            drm_license_url: item.drm_license_url ? item.drm_license_url : '',
            offset: item.offset ? item.offset : null,
            media_type: item.media_type,
            timeout: item.timeout,
        };
        videoQualityOptions = [
            {
                // icon_url: `${cdnLink}images/2022/04/18/09-41-06-964-AM_Screenshot%202022-04-18%20at%203.09.06%20PM.png`,
                display: Data.videoQualityDisplay.autoTitle,
                subtitle: Data.videoQualityDisplay.autoSubTitle,
            },
            {
                display: Data.videoQualityDisplay.saverTitle,
                subtitle: Data.videoQualityDisplay.saverSubTitle,
            },
            {
                display: Data.videoQualityDisplay.highTitle,
                subtitle: Data.videoQualityDisplay.highSubTitle,
            },
        ];

        for (let i = 0; i < videoQualityOptions.length; i++) {
            videoQualityOptions[i] = { ...videoQualityOptions[i], ...staticResponseData };
        }
    }
    return videoQualityOptions;
}

function addVideoQualityOptionsList(cdnLink, videoResourceData, liveclassPages, page) {
    videoResourceData.forEach((x) => {
        if ((!x.drop_down_list || x.drop_down_list.length === 0) && !_.includes(liveclassPages, page)) {
            x.drop_down_list = dropDownOptions(cdnLink, x);
        } else if (x.drop_down_list.length > 0) {
            x.drop_down_list.forEach((y) => {
                if (y.display === '360') {
                    // y.icon_url = `${cdnLink}images/2022/04/18/09-41-06-964-AM_Screenshot%202022-04-18%20at%203.09.06%20PM.png`;
                    y.display += ` ${Data.videoQualityDisplay.saverTitle}`;
                    // y.subtitle = Data.videoQualityDisplay.saverSubTitle;
                } else if (y.display === '480') {
                    y.display += ` ${Data.videoQualityDisplay.autoTitle}`;
                    // y.subtitle = Data.videoQualityDisplay.autoSubTitle;
                } else if (y.display === '720') {
                    y.display += ` ${Data.videoQualityDisplay.highTitle}`;
                    // y.subtitle = Data.videoQualityDisplay.highSubTitle;
                }
                y.display_color = '#313131';
                y.display_size = '16';
                // y.subtitle_color = '#817e7e';
                // y.subtitle_size = '14';
            });
        }
    });
    return videoResourceData;
}

module.exports = {
    // getNextMicroConcept,
    checkEVideos,
    dashHandling,
    checkLiveClassVideos,
    checkLiveClassVideoByQuestionId,
    commentWindow,
    getLocale,
    getAnswerVideoResource,
    getDefaultVideoResource,
    getOneMinVideoLink,
    getUsExamData,
    getAllFlagsNeededForThePage,
    generateVideoResourceObject,
    addVideoQualityOptionsList,
};
