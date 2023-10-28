/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const moment = require('moment');
const CourseContainer = require('../../../modules/containers/course');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const StudentRedis = require('../../../modules/redis/student');
const WidgetHelper = require('../../widgets/liveclass');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const answerContainer = require('../../../modules/containers/answer');
const PznContainer = require('../../../modules/containers/pzn');
const CourseManager = require('../../helpers/course');
const Properties = require('../../../modules/mysql/property');
// const EtoosStrcturedCourseMysql = require('../../../modules/mysql/eStructuredCourse');
const Data = require('../../../data/data');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');
// https://d10lpgp6xz60nq.cloudfront.net/etoos/v2/

function getPaymentCard(data, actionData = null) {
    return {
        type: 'payment_card',
        action: {
            action_activity: 'payment_page',
            action_data: actionData,
        },
        data: {
            text1: data.paymentCardState.message.text,
            text2: Data.paymentCardMessage,
            button_text: data.paymentCardState.message.button_text,
            variant_id: data.paymentCardState.variantId,
            event_name: (data.paymentCardState.isTrial) ? 'trial' : 'vip',
        },
    };
}
function generateCourseListButton(data) {
    return {
        type: 'button',
        action: {
            action_activity: 'course_list_page',
            action_data: data.actionData,
        },
        data: {
            button_text: 'VIEW ALL COURSE',
            variant_id: data.paymentCardState.variantId,
            event_name: (data.paymentCardState.isTrial) ? 'trial' : 'vip',
        },
    };
}
function getBarColor(subject) {
    const colorMap = {
        PHYSICS: '#05d37d',
        BIOLOGY: '#e586ff',
        CHEMISTRY: '#f6c300',
        MATHS: '#ff6e00',
    };
    return colorMap[subject];
}
function generateToppersSpeak(data) {
    const {
        caraouselObject,
        caraouselData,
    } = data;
    return {
        type: caraouselObject.type,
        data: {
            title: caraouselObject.title,
            items: caraouselData,
        },
    };
}
function getSubjectFilters(data) {
    if (data.length > 0) {
        const distinctSubject = _.chain(data).map('subject').uniq().value();
        const list = [];
        list.push({
            key: '0',
            display: 'All Subjects',
            color: 'mix',
        });
        for (let i = 0; i < distinctSubject.length; i++) {
            const obj = {};
            obj.key = distinctSubject[i];
            obj.color = getBarColor(distinctSubject[i]);
            obj.display = distinctSubject[i].replace(/^.{1}/g, distinctSubject[i][0].toUpperCase());
            list.push(obj);
        }
        return list;
    }
    return [{
        key: '0',
        display: 'All Subjects',
        color: 'mix',
    },
    {
        key: 'MATHS',
        display: 'Maths',
        color: getBarColor('MATHS'),
    },
    {
        key: 'PHYSICS',
        display: 'Physics',
        color: getBarColor('PHYSICS'),
    },
    {
        key: 'CHEMISTRY',
        display: 'Chemistry',
        color: getBarColor('CHEMISTRY'),
    },
    {
        key: 'BIOLOGY',
        display: 'Biology',
        color: getBarColor('BIOLOGY'),
    },
    ];
}

function generatePaymentCard(data) {
    const {
        actionData,
    } = data;
    return getPaymentCard(data, actionData);
}
async function generateFacultyGridData(data) {
    const {
        caraouselObject,
        caraouselData,
        db,
    } = data;
    const promise = [];
    for (let i = 0; i < caraouselData.length; i++) {
        promise.push(CourseContainer.getRandomSubsViews({
            db,
            type: 'etoos_faculty',
            id: caraouselData[i].id,
        }));
        caraouselData[i].button_text = 'WATCH DEMO';
        caraouselData[i].page = 'E_LECTURES';
        caraouselData[i].color = getBarColor(caraouselData[i].subject);
        caraouselData[i].degree_college = `${caraouselData[i].degree_obtained}-${caraouselData[i].college}`;
    }
    const subData = await Promise.all(promise);
    for (let i = 0; i < caraouselData.length; i++) {
        caraouselData[i].students = `${subData[i].subs} students`;
    }
    // get subjects from ecm
    // const subjects = await CourseContainer.getSubjectsByEcmID(db, ecmId);
    const obj = {};
    const secondaryObj = {};
    secondaryObj.title = caraouselObject.title;
    secondaryObj.subject_filter = getSubjectFilters(caraouselData);
    secondaryObj.items = caraouselData;
    obj.type = caraouselObject.data_type;
    obj.action = {
        action_activity: 'faculty_page',
        action_data: null,
    };
    obj.data = secondaryObj;
    return obj;
}

async function mapData(data) {
    const {
        db,
        originalData,
        ecmData,
        subscriberCount,
        paymentCardState,
        config,
    } = data;
    originalData.faculty_details.students = `${subscriberCount.subs} students`;
    originalData.faculty_details.gradient_image_url = originalData.faculty_details.demo_image_url;
    originalData.faculty_details.gradient = Data.etoosGradient;
    originalData.faculty_details.play_button_title = 'Watch demo video';
    originalData.faculty_details.subject_course = `${originalData.chapter_details.chapters[0].subject}-${ecmData[0].display_name}`;
    originalData.faculty_details.degree_college = `${originalData.faculty_details.degree_obtained}-${originalData.faculty_details.college}`;
    originalData.faculty_details.image_url = originalData.faculty_details.demo_image_url;
    originalData.payment_card = getPaymentCard(data, {
        faculty_id: originalData.faculty_details.id,
    });
    originalData.button = {};
    originalData.button.button_text = (paymentCardState.isVip) ? 'Check your plan' : 'BUY NOW';
    originalData.button.action = {};
    originalData.button.action.type = 'button';
    originalData.button.action.action_activity = 'payment_page';
    originalData.button.data = {};
    originalData.button.data.variant_id = paymentCardState.variantId;
    originalData.button.data.event_name = (paymentCardState.isTrial) ? 'trial' : 'vip';
    originalData.button.action.action_data = {
        faculty_id: originalData.faculty_details.id,
    };
    const promise = [];
    for (let i = 0; i < originalData.chapter_details.chapters.length; i++) {
        const bg_image_url = (0) ? `${config.cdn_url}etoos/v2/${originalData.chapter_details.chapters[i].subject}_S_VIP.png` : `${config.cdn_url}etoos/v2/${originalData.chapter_details.chapters[i].subject}_S.png`;
        const dataObject = {};
        dataObject.id = originalData.chapter_details.chapters[i].id;
        dataObject.ecm_id = originalData.chapter_details.chapters[i].ecm_id;
        dataObject.faculty_id = originalData.chapter_details.chapters[i].faculty_id;
        dataObject.faculty_name = originalData.faculty_details.name;
        dataObject.title1 = originalData.chapter_details.chapters[i].name;
        dataObject.title2 = `${originalData.chapter_details.chapters[i].subject} - ${originalData.chapter_details.chapters[i].lecture_count} videos`;
        dataObject.duration = originalData.chapter_details.chapters[i].duration;
        dataObject.background_image_url = bg_image_url;
        promise.push(CourseContainer.getRandomSubsViews({
            db,
            type: 'etoos_chapter',
            id: originalData.chapter_details.chapters[i].id,
        }));
        dataObject.is_vip = paymentCardState.isVip;
        originalData.chapter_details.chapters[i] = dataObject;
    }
    const subsAndViewData = await Promise.all(promise);
    for (let i = 0; i < originalData.chapter_details.chapters.length; i++) {
        originalData.chapter_details.chapters[i].students = `${subsAndViewData[i].subs} students`;
        originalData.chapter_details.chapters[i].views = `${subsAndViewData[i].views}k`;
    }
    return originalData;
}

async function generateStructuredCourseData(data) {
    const {
        db,
        caraouselObject,
        caraouselData,
        config,
    } = data;
    const promise = [];
    for (let i = 0; i < caraouselData.length; i++) {
        caraouselData[i].title = `Doubtnut Free Course-${caraouselData[i].course}`;
        caraouselData[i].bottom_title = 'DOUBTNUT FREE COURSE';
        caraouselData[i].image_title = caraouselData[i].image_subtitle;
        caraouselData[i].is_premium = false;
        caraouselData[i].image_bg = `${config.staticCDN}etoos/v2/FREE_COURSE_THUMB.png`;
        // caraouselData[i].image_url = `${config.cdn_url}etoos/v2/FREE_COURSE_IMAGE.png`;
        caraouselData[i].image_url = '';
        caraouselData[i].bottom_color = '#FF0000';
        promise.push(CourseContainer.getRandomSubsViews({
            db,
            type: 'etoos_chapter',
            id: caraouselData[i].id,
        }));
        // caraouselData[i].tag = generateTag('#FF0000', 'Trending', '#000000');
        // caraouselData[i].views = '143k';
        caraouselData[i].image_bar_color = '#FF0000';
    }
    const subsAndViewData = await Promise.all(promise);
    for (let i = 0; i < caraouselData.length; i++) {
        caraouselData[i].views = `${subsAndViewData[i].views}k`;
    }
    const obj = {};
    const secondaryObj = {};
    obj.type = caraouselObject.data_type;
    obj.action = {};
    obj.action.action_activity = 'structured_course';
    obj.action.action_data = null;
    secondaryObj.items = caraouselData;
    obj.data = secondaryObj;
    return obj;
}

async function generateCoursesData(data) {
    try {
        const {
            db,
            caraouselObject,
            caraouselData,
            isVip,
            config,
            page,
            distinctSubject = [],
        } = data;
        const obj = {};
        const secondaryObj = {};
        const promise = [];
        for (let i = 0; i < caraouselData.length; i++) {
            caraouselData[i].is_vip = isVip;
            caraouselData[i].is_premium = true;
            // caraouselData[i].views = ;
            promise.push(CourseContainer.getRandomSubsViews({
                db,
                type: 'etoos_chapter',
                id: caraouselData[i].id,
            }));
            caraouselData[i].bottom_color = '#000000';
            caraouselData[i].image_bg = `${config.staticCDN}etoos/v2/${caraouselData[i].subject}_THUMB.png`;
            caraouselData[i].image_bar_color = getBarColor(caraouselData[i].subject);
        }
        const subsAndViews = await Promise.all(promise);
        for (let i = 0; i < caraouselData.length; i++) {
            caraouselData[i].views = `${subsAndViews[i].views}k`;
        }
        if (page == 1) {
            secondaryObj.subject_filter = getSubjectFilters(distinctSubject);
            secondaryObj.title = caraouselObject.title;
        }
        obj.type = caraouselObject.data_type;
        obj.action = {
            action_activity: 'lecture_page',
            action_data: null,
        };

        secondaryObj.items = caraouselData;
        obj.data = secondaryObj;
        if (caraouselData.length === 0) {
            return false;
        }
        return obj;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function generatePromises(data) {
    const {
        caraouselList,
        db,
        ecmId,
        studentClass,
        paymentCardState,
    } = data;
    const promise = [];
    for (let i = 0; i < caraouselList.length; i++) {
        if (caraouselList[i].type === 'FACULTY_GRID') {
            promise.push(CourseContainer.getFacultyGrid({
                db,
                ecmId,
                limit: caraouselList[i].data_limit,
                studentClass,
            }));
        } else if (caraouselList[i].type === 'PAYMENT') {
            promise.push((async (caraousel) => generatePaymentCard({
                caraouselObject: caraousel,
                actionData: { ecm_id: ecmId },
                paymentCardState,
            }))(caraouselList[i])); // mock promise with context
        } else if (caraouselList[i].type === 'STRUCTURED_COURSE') {
            promise.push(CourseContainer.getStructuredFreeCourse({ db, ecmId, studentClass }));
        } else if (caraouselList[i].type === 'TOP_COURSES') {
            promise.push(CourseContainer.getTopCourses({
                db,
                ecmId,
                limit: caraouselList[i].data_limit,
                studentClass,
            }));
        } else if (caraouselList[i].type === 'COURSE_LIST_BUTTON') {
            promise.push((async () => generateCourseListButton({ paymentCardState, actionData: { ecm_id: ecmId, subject: '0' } }))());
        } else if (caraouselList[i].type === 'TOPPERS_SPEAK') {
            promise.push(CourseContainer.getTestimonials({ db }));
        } else if (caraouselList[i].type === 'POPULAR_COURSES') {
            promise.push(CourseContainer.getPopularCourses({
                db,
                ecmId,
                limit: caraouselList[i].data_limit,
                studentClass,
            }));
        }
    }
    return promise;
}
async function getCaraouselData(data) {
    const {
        caraouselList,
        db,
        config,
        paymentCardState,
        ecmId,
    } = data;
    try {
        const caraouselData = [];
        const resolvedPromiseData = await Promise.all(generatePromises(data));
        const staticDataArray = ['PAYMENT', 'COURSE_LIST_BUTTON'];
        for (let i = 0; i < caraouselList.length; i++) {
            if (_.includes(staticDataArray, caraouselList[i].type)) {
                caraouselData.push(resolvedPromiseData[i]);
            } else if (caraouselList[i].type === 'FACULTY_GRID') {
                caraouselData.push(await generateFacultyGridData({
                    db,
                    caraouselObject: caraouselList[i],
                    caraouselData: resolvedPromiseData[i],
                    ecmId,
                }));
            } else if (caraouselList[i].type === 'STRUCTURED_COURSE') {
                caraouselData.push(await generateStructuredCourseData({
                    db,
                    caraouselObject: caraouselList[i],
                    caraouselData: resolvedPromiseData[i],
                    config,
                }));
            } else if (caraouselList[i].type === 'TOP_COURSES') {
                caraouselData.push(await generateCoursesData({
                    db,
                    caraouselObject: caraouselList[i],
                    caraouselData: resolvedPromiseData[i],
                    isVip: paymentCardState.isVip,
                    config,
                }));
            } else if (caraouselList[i].type === 'POPULAR_COURSES') {
                caraouselData.push(await generateCoursesData({
                    db,
                    caraouselObject: caraouselList[i],
                    caraouselData: resolvedPromiseData[i],
                    isVip: paymentCardState.isVip,
                    config,
                }));
            } else if (caraouselList[i].type === 'TOPPERS_SPEAK') {
                caraouselData.push(generateToppersSpeak({
                    caraouselObject: caraouselList[i],
                    caraouselData: resolvedPromiseData[i],
                }));
            }
        }
        return caraouselData;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}
// function checkSubscriptionState(moment, data) {
//     let isVip = false;
//     let isTrial = false;
//     // never vip and trial ever
//     const momentEnd = moment(data[0].end_date);
//     const momentNow = moment();
//     const remainingDays = momentEnd.diff(momentNow, 'days');
//     // check trial
//     if (data[0].amount === -1.00 && momentEnd > momentNow) {
//         isTrial = true;
//     }
//     // VIP member
//     isVip = !!(((data.length > 0) && (momentEnd > momentNow)));
//     return { isTrial, isVip, remainingDays };
// }
function getPaymentCardState({
    // eslint-disable-next-line no-shadow
    moment,
    data,
    flagrResponse = {},
}) {
    let isVip = false;
    let isTrial = false;
    let remainingDays = 0;
    const variantId = (typeof flagrResponse.variantID === 'undefined') ? '0' : flagrResponse.variantID;
    const trialDuration = (typeof flagrResponse.variantAttachment === 'undefined') ? '0' : flagrResponse.variantAttachment.trial_duration;
    let expiredTrial = false;
    let expiredVip = false;
    // never vip and trial ever
    const neverVipAndTrial = (data.length === 0);
    if (neverVipAndTrial) {
        return {
            message: Data.neverVipAndTrialMessageFn(trialDuration),
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
        };
    }
    const momentEnd = moment(data[0].end_date);
    const momentNow = moment().add(5, 'hours').add(30, 'minutes');
    remainingDays = momentEnd.diff(momentNow, 'days');
    // check trial
    if (data[0].amount === -1.00 && momentEnd > momentNow) {
        isTrial = true;
        isVip = true;
    }
    for (let i = 0; i < data.length; i++) {
        if (data[i].amount === -1.00 && momentEnd < momentNow) {
            expiredTrial = true;
        }
    }
    // trial expired and no vip
    if (expiredTrial) {
        return {
            message: Data.everTrialUsedNoVipMessage,
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
        };
    }
    // user is in Trial
    if (isTrial) {
        return {
            message: Data.trialMessage(remainingDays),
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
        };
    }

    // last 5 days remaining vip
    const lastFiveDaysVip = ((data.length > 0) && (momentEnd > momentNow) && ((remainingDays > 0) && (remainingDays < 5)));
    if (lastFiveDaysVip) {
        return {
            message: Data.lastFiveDaysVipMessage(remainingDays),
            isVip: true,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
        };
    }
    // VIP member
    // console.log('vip');
    // console.log((data.length > 0));
    // console.log((momentEnd > momentNow));
    // console.log(((data.length > 0) && (momentEnd > momentNow)));
    isVip = ((data.length > 0) && (momentEnd > momentNow));
    if (isVip) {
        return {
            message: Data.vipMessage,
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
        };
    }

    // expired vip
    expiredVip = ((data.length > 0) && (momentEnd < momentNow));
    if (expiredVip) {
        return {
            message: Data.expiredVipMessage,
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
        };
    }
}

function getVideoPageIconsList(config, videoBookmarkData, isFree) {
    return isFree ? [{
        id: '',
        deeplink: '',
        image_url: '',
    },
    {
        id: '',
        deeplink: '',
        image_url: '',
    },
    {
        id: 'comment',
        deeplink: '',
        image_url: `${config.staticCDN}engagement_framework/icon_small_comment.webp`,
    },
    {
        id: 'share',
        deeplink: '',
        image_url: `${config.staticCDN}images/2021/12/23/11-16-23-699-AM_Share.webp`,
    }] : [
        {
            id: 'comment',
            deeplink: '',
            image_url: `${config.staticCDN}engagement_framework/icon_small_comment.webp`,
        },
        {
            id: 'bookmark',
            deeplink: '',
            image_url: videoBookmarkData.length ? `${config.staticCDN}engagement_framework/icon_small_bookmark_filled.webp` : `${config.staticCDN}engagement_framework/icon_small_bookmark_line.webp`,
        },
        {
            id: 'download',
            deeplink: '',
            image_url: `${config.staticCDN}images/2021/12/23/11-15-26-637-AM_Download%20%281%29.webp`,
        },
        {
            id: 'share',
            deeplink: '',
            image_url: `${config.staticCDN}images/2021/12/23/11-16-23-699-AM_Share.webp`,
        },
    ];
}

function getVideoPageTabsList(tabID, topics, homeworkData, notesData, locale) {
    const items = [];
    if (topics.length) {
        items.push({
            key: 'chapters',
            id: 'chapters',
            display: locale === 'hi' ? 'इस वीडियो में' : 'In this video',
            text: locale === 'hi' ? 'इस वीडियो में' : 'In this video',
            is_selected: tabID === 'chapters',
        });
    }
    if (notesData.length) {
        items.push({
            key: 'notes',
            id: 'notes',
            display: locale === 'hi' ? 'PDF नोट्स' : 'PDF Notes',
            text: locale === 'hi' ? 'PDF नोट्स' : 'PDF Notes',
            is_selected: tabID === 'notes',
        });
    }
    if (homeworkData.length) {
        items.push({
            key: 'homework',
            id: 'homework',
            display: locale === 'hi' ? 'होमवर्क' : 'Homework',
            text: locale === 'hi' ? 'होमवर्क' : 'Homework',
            is_selected: tabID === 'homework',
        });
    }
    if (!tabID && items.length) {
        items[0].is_selected = true;
    }
    return {
        type: 'video_tab_filter',
        is_sticky: true,
        data: {
            items,
        },
    };
}

function getLibraryBanner(newBanner, config, locale) {
    const image = locale === 'hi' ? `${config.cdn_url}engagement_framework/F8B78B3E-5F81-049B-0016-BDD9F0C3F5D5.webp` : `${config.cdn_url}engagement_framework/B4FAB862-B1F2-968A-C3FD-469F306075E6.webp`;
    const image2 = locale === 'hi' ? `${config.cdn_url}engagement_framework/BA8BD0E8-ACDD-C0F1-3C47-7F00C05EAB5A.webp` : `${config.cdn_url}engagement_framework/12AABD45-1320-B36A-BB4F-BE29C5F90DBE.webp`;
    const banner = {
        type: 'promo_list',
        data: {
            items: [
                {
                    id: '',
                    image_url: newBanner ? image : image2,
                    deeplink: 'doubtnutapp://library_tab?tag=library&recreate=true',
                },
            ],
            ratio: newBanner ? '16:3' : '16:5',
        },
        layout_config: {
            margin_top: 25,
            margin_left: 16,
            margin_right: 16,
            margin_bottom: 5,
        },
    };
    return banner;
}

async function generateLikesDurationText(db, videoDetails, locale) {
    const videoDuration = await answerContainer.getByQuestionIdWithTextSolution(videoDetails[0].resource_reference, db);
    let status = 'past';
    const now = moment().add(5, 'hours').add(30, 'minutes');
    if (videoDetails[0].stream_status === 'ACTIVE' || (videoDuration.length && moment(videoDetails[0].live_at).add(videoDuration[0].duration, 'seconds') > now)) {
        status = 'live';
    }
    const dataTemp = {
        data: {
            id: videoDetails[0].resource_reference,
        },
        group_id: status,
    };
    const text = CourseManager.getLikesCountAndDurationOfQid(dataTemp, videoDuration, locale);
    return text || '';
}

async function getStudentCCmIds(db, studentId) {
    const studentCourses = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, studentId);
    const ccmIdList = [];
    studentCourses.forEach((element) => {
        ccmIdList.push(element.id);
    });
    return ccmIdList;
}

async function getTabDataByTabId({
    db,
    config,
    xAuthToken,
    versionCode,
    tabID,
    locale,
    batchID,
    questionID,
    studentID,
    studentClass,
    liveStreamDetails,
    filteredUserSubscription,
}) {
    let result = [];
    if (tabID === 'chapters' || !tabID) {
        const topicTimestamps = [];
        let topics = [];
        if (liveStreamDetails.length) {
            // const offsetTopics = liveStreamDetails[0].name.split('|');
            const { startTimeTitle, offsetsArr, offsetTopics } = WidgetHelper.createTitleWithtimestamps(liveStreamDetails[0], locale);
            const startTimeArr = startTimeTitle.split('|');
            for (let i = 0; i < startTimeArr.length - 1; i++) {
                topicTimestamps.push({
                    title: offsetTopics[i].trim(),
                    offset_title: startTimeArr[i],
                    offset: offsetsArr[i] * 1000,
                });
            }
            let quizList = await CourseV2Mysql.getQuizLogsFromVod(db.mysql.read, questionID);
            quizList = quizList.filter((e) => e.batch_id === batchID && e.visibility_timestamp !== null);
            topics = topicTimestamps;
            let k = 0;
            for (let i = 0; i < topicTimestamps.length && k < quizList.length; i++) {
                const quizTime = quizList[k].visibility_timestamp * 1000;
                if (topicTimestamps[i].offset > quizTime) {
                    topics.splice(i, 0, {
                        title: `Quiz ${k + 1}`,
                        offset_title: quizList[k].visibility_timestamp > 3600 ? `${moment().startOf('day').add(quizList[k].visibility_timestamp * 1000).format('HH:mm:ss')}` : `${moment().startOf('day').add(quizList[k].visibility_timestamp * 1000).format('mm:ss')}`,
                        offset: quizTime,
                    });
                    k++;
                }
            }
            if (k < quizList.length) {
                for (let i = k; i < quizList.length; i++) {
                    topics.push({
                        title: `Quiz ${k + 1}`,
                        offset_title: quizList[i].visibility_timestamp > 3600 ? `${moment().startOf('day').add(quizList[i].visibility_timestamp * 1000).format('HH:mm:ss')}` : `${moment().startOf('day').add(quizList[i].visibility_timestamp * 1000).format('mm:ss')}`,
                        offset: quizList[i].visibility_timestamp * 1000,
                    });
                }
            }
        }
        result = topics;
    } else if (tabID === 'homework') {
        result = await CourseContainerv2.getHomeworkByQuestionIDWithBatchCheck(db, questionID, studentID);
        result = result.filter((item) => item.batch_id === batchID);
        const homeworkResponse = await CourseV2Mysql.getHomeworkResponse(db.mysql.read, questionID, studentID);
        if (homeworkResponse.length && result.length) {
            result[0].status = 1;
        }
    } else if (tabID === 'notes') {
        result = await CourseContainerv2.getNotesByQuestionID(db, questionID);
        result = result.filter((item) => item.batch_id === batchID);
        const resourceList = [];
        result.forEach((item) => resourceList.push(item.id));
        const bookmarkedNotes = await CourseV2Mysql.getBookMarkedResourcesByResourceId(db.mysql.read, studentID, resourceList);
        result.forEach((item) => {
            item.topic = item.display;
            item.course_assortment_id = filteredUserSubscription[0].assortment_id;
            item.is_free = 1;
            if (_.find(bookmarkedNotes, ['course_resource_id', item.id])) {
                item.isbookmarked = 1;
            } else {
                item.isbookmarked = 0;
            }
        });
    } else if (tabID === 'free_classes') {
        const lectureList = await CourseManager.getLectureSeriesByQuestionID(db, questionID, filteredUserSubscription, studentID);
        result = [lectureList.result];
        const resultTemp = [];
        for (let i = 0; i < result.length; i++) {
            if (result[i].live_at !== null && result[i].live_at !== undefined && moment().add(5, 'hours').add(30, 'minutes').isBefore(result[i].live_at)) {
                resultTemp.push(result[i].resource_reference);
            }
        }
        result = result.filter((item) => !resultTemp.includes(item.resource_reference));
        const promise = [];
        const ccmIdList = await getStudentCCmIds(db, studentID);
        const localeNew = locale === 'hi' ? 'HINDI' : 'ENGLISH';
        const mostWatchedData = await PznContainer.getQuestionByMaxEngageTime({ ccm_ids: ccmIdList, languages: [localeNew] });
        for (let i = 0; i < mostWatchedData.length; i++) {
            promise.push(CourseContainerv2.getAssortmentsByResourceReferenceV1(db, mostWatchedData[i]));
        }
        const resolvedPromises = await Promise.all(promise);
        let recentClasses = [];
        // resolvedPromises.forEach((e) => {
        //     recentClasses = [...recentClasses, ...e];
        // });
        for (let i = 0; i < resolvedPromises.length; i++) {
            if (resolvedPromises[i].length) {
                resolvedPromises[i][0].resource_reference = mostWatchedData[i];
                recentClasses.push(resolvedPromises[i][0]);
            }
        }
        recentClasses.forEach((item) => {
            if (item.subject !== undefined && item.subject !== null) {
                item.subject = item.subject.trim();
            }
        });
        recentClasses = _.groupBy(recentClasses, 'subject');
        const promise2 = [];
        for (const key in recentClasses) {
            if (recentClasses[key]) {
                recentClasses[key] = recentClasses[key].slice(0, 3);
                for (let i = 0; i < recentClasses[key].length; i++) {
                    promise2.push(generateLikesDurationText(db, [{
                        resource_reference: recentClasses[key][i].resource_reference, stream_status: recentClasses[key][i].stream_status, live_at: recentClasses[key][i].live_at,
                    }], locale));
                }
            }
        }
        const tempRecentClasses = recentClasses;
        recentClasses = [];
        for (const key in tempRecentClasses) {
            if (tempRecentClasses[key]) {
                recentClasses = [...recentClasses, ...tempRecentClasses[key]];
            }
        }
        const likesData = await Promise.all(promise2);
        for (let i = 0; i < recentClasses.length; i++) {
            if (likesData[i]) {
                recentClasses[i].likes_data = likesData[i];
            }
        }
        result.push(recentClasses);
    } else if (tabID === 'free_notes') {
        result = await CourseContainerv2.getNotesByQuestionID(db, questionID);
    } else if (tabID === 'tutions') {
        const userActivePackages = await CourseContainerv2.getUserActivePackages(db, studentID);
        const userCourseAssortments = [];
        userActivePackages.map((item) => userCourseAssortments.push(item.assortment_id));
        const coursesList = await CourseManager.getDataForPopularCourseCarousel({
            db,
            studentClass,
            config,
            versionCode,
            studentId: studentID,
            studentLocale: locale,
            xAuthToken,
            page: 'VIDEO_PAGE',
            questionID,
            userCourseAssortments,
        });
        const tempStudentCcmAssortments = [];
        for (let i = 0; i < coursesList.studentCcmAssortments.length; i++) {
            if (coursesList.studentCcmAssortments[i] !== null && coursesList.studentCcmAssortments[i].assortment_id !== undefined && coursesList.studentCcmAssortments[i].assortment_id !== null) {
                tempStudentCcmAssortments.push(coursesList.studentCcmAssortments[i]);
            }
        }
        coursesList.studentCcmAssortments = tempStudentCcmAssortments;
        const tempAssortmentList = [];
        for (let i = 0; i < coursesList.assortmentList.length; i++) {
            if (coursesList.assortmentList[i] !== undefined && coursesList.assortmentList[i] !== null) {
                tempAssortmentList.push(coursesList.assortmentList[i]);
            }
        }
        coursesList.assortmentList = tempAssortmentList;
        let subjectAssortments = [];
        if (coursesList.studentCcmAssortments.length > 0) {
            subjectAssortments = await CourseContainerv2.getSubjectsListWithTeachersByCourseAssortment(db, coursesList.studentCcmAssortments[0].assortment_id);
        }
        result.push(coursesList);
        result.push(subjectAssortments);
    }
    return result;
}

async function getTabWidgetsByTabId({
    db,
    tabID,
    tabs,
    result,
    config,
    locale,
    studentClass,
    studentID,
    videoDetails,
    source,
}) {
    const widgets = [];
    if (tabID === 'chapters' || !tabID) {
        widgets.push(WidgetHelper.getVideoTopicsOffsetWidget({ result }));
    } else if (tabID === 'homework') {
        const widget = WidgetHelper.getCourseHomeworkWidget({ result, locale, config });
        widget.data.title = '';
        widget.extra_params = {
            source: 'video_page',
        };

        widgets.push(widget);
    } else if (tabID === 'notes') {
        const items = CourseManager.getNotesData(result, [], [], {}, {}, config);
        items.forEach((item) => { item.is_video_page = true; });
        widgets.push({
            type: 'resource_notes',
            data: {
                title: '', items, showsearch: false,
            },
            extra_params: {
                source: 'video_page',
            },
        });
    } else if (tabID === 'free_notes') {
        const pdfOpenCount = await StudentRedis.getUserFreePdfAccessedCount(db.redis.read, studentID);
        let courseAssortment = 1;
        if (+pdfOpenCount >= 2) {
            const coursesList = await CourseManager.getDataForPopularCourseCarousel({
                db,
                studentClass,
                config,
                studentId: studentID,
                studentLocale: locale,
                page: 'VIDEO_PAGE',
                questionID: videoDetails[0].resource_reference,
                userCourseAssortments: [],
            });
            const tempStudentCcmAssortments = [];
            for (let i = 0; i < coursesList.studentCcmAssortments.length; i++) {
                if (coursesList.studentCcmAssortments[i] !== null && coursesList.studentCcmAssortments[i].assortment_id !== undefined && coursesList.studentCcmAssortments[i].assortment_id !== null) {
                    tempStudentCcmAssortments.push(coursesList.studentCcmAssortments[i]);
                }
            }
            coursesList.studentCcmAssortments = tempStudentCcmAssortments;
            if (coursesList.studentCcmAssortments.length) {
                courseAssortment = coursesList.studentCcmAssortments[0].assortment_id;
            } else {
                const classCourseList = await CourseContainerv2.getCoursesForHomepageByCategory(db, studentClass, locale);
                courseAssortment = classCourseList[0].assortment_id;
            }
        }
        if (result.length) {
            let title2 = '';
            if (tabs) {
                title2 = 'Ye PDFs course kharidne par hi milte hain';
            }
            widgets.push(WidgetHelper.getNotesV3Widget({
                result, lock: +pdfOpenCount >= 2, courseAssortment, config, title2, locale, source,
            }));
        }
        if (tabs) {
            widgets.push(getLibraryBanner(true, config, locale));
        }
    } else if (tabID === 'free_classes') {
        const lectureList = result[0];
        const recentClasses = result[1];
        const subjectStartDate = moment().subtract(10, 'days').add(5, 'h').add(30, 'minutes')
            .format('YYYY-MM-DD hh:mm:ss');
        const subjectEndDate = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD hh:mm:ss');
        const subjectList = await PznContainer.getSubjectListByTotalEt(studentID, subjectStartDate, subjectEndDate);
        const promise = [];
        for (let i = 0; i < lectureList.length; i++) {
            promise.push(generateLikesDurationText(db, [{
                resource_reference: lectureList[i].resource_reference, stream_status: lectureList[i].stream_status, live_at: lectureList[i].live_at,
            }], locale));
        }
        const likesData = await Promise.all(promise);
        for (let i = 0; i < lectureList.length; i++) {
            if (likesData[i]) {
                lectureList[i].likes_data = likesData[i];
            }
        }
        if (lectureList.length) {
            // widgets.push(WidgetHelper.getLiveclassCourseCard3Widget({ result: lectureList, locale, source }));
            widgets.push(await WidgetHelper.generateNextChapterVideos({
                locale, source, result: lectureList, db,
            }));
        }
        let categoryType = ['BOARDS/SCHOOL/TUITION'];
        if (parseInt(studentClass) === 14) {
            categoryType = ['BOARDS/SCHOOL/TUITION', 'SSC', 'DEFENCE/NDA/NAVY', 'RAILWAY', 'BANKING', 'CTET'];
        }
        const subjectAssortData = await CourseV2Mysql.getFreeSubjectsForFreeClassVideoPage(db.mysql.read, studentClass, locale, categoryType);
        if (recentClasses.length) {
            widgets.push(WidgetHelper.getSubjectTabsWidget({
                result: recentClasses, locale, subjectList, source, subjectAssortData,
            }));
        }
    } else if (tabID === 'tutions') {
        // widgets.push(WidgetHelper.getWidgetImageText({
        //     title: locale === 'hi' ? 'आपके लिए ट्रेंडिंग कोर्स' : 'Trending courses for you!', color: 'ffffff', image2: `${config.cdn_url}engagement_framework/A1F7AA6F-713B-F2CD-A757-A5D8814D94CD.webp`, subtitle: locale === 'hi' ? '20,000+ छात्र यह पढ़ रहे हैं' : 'More than 20,000 students are studying', isBold: true,
        // }));
        const courseWidget = WidgetHelper.getLatestSoldCourseWidget({
            carousel: { title: locale === 'hi' ? 'आपके लिए ट्रेंडिंग कोर्स' : 'Trending courses for you!' },
            result: result[0].studentCcmAssortments,
            locale,
            videoResources: [],
            assortmentPriceMapping: result[0].assortmentPriceMapping,
            courseStudentEnrolledCount: [],
            source,
        });
        if (courseWidget.data.items.length > 0) {
            widgets.push(courseWidget);
        }
        const subjectAssortmentList = [];
        let subjectAssortments = result[1];
        subjectAssortments.map((item) => subjectAssortmentList.push(item.assortment_id));
        if (subjectAssortments.length) {
            const subjectPricing = await CourseManager.generateAssortmentVariantMapping(db, subjectAssortmentList);
            const tempSubjects = [];
            for (let i = 0; i < subjectAssortments.length; i++) {
                if (subjectPricing[subjectAssortments[i].assortment_id] !== undefined && subjectPricing[subjectAssortments[i].assortment_id] !== null) {
                    tempSubjects.push(subjectAssortments[i]);
                }
            }
            subjectAssortments = tempSubjects;
            if (subjectAssortments.length) {
                widgets.push(WidgetHelper.getSubjectCourseCardTabsWidget({
                    result: subjectAssortments, subjectPricing, courseTitle: result[0].studentCcmAssortments[0].display_name, locale, source,
                }));
            }
        }
    }
    return widgets;
}

async function getWidgetsForChapterCarousel({
    db, locale, config, result, subjectAssortmentID, topic,
}) {
    const nextQuestionID = await CourseManager.getNextChapterQuestionID(db, subjectAssortmentID, topic);
    const carousel = {
        carousel_type: 'widget_parent',
        title: locale === 'hi' ? 'इस अध्याय के अन्य क्लासेस' : 'More classes in this chapter',
    };
    const widgets = await WidgetHelper.generateNextChapterVideos({
        db,
        locale,
        config,
        carousel,
        result,
        questionID: nextQuestionID,
    });
    return [widgets];
}

async function getReferralV2Widgets(widget_type, referralObject, referralObjectDnProperty, studentLocale, db) {
    let obj;
    const referralCount = referralObject.length;
    if (widget_type == 'referral_video_widget') {
        const [winnerCount, referralVideoWidgetData] = await Promise.all([CourseContainer.getReferralV2RedmiWinners(db), Properties.getNameAndValueByBucket(db.mysql.read, widget_type)]);
        const groupedReferralVideoWidgetData = _.groupBy(referralVideoWidgetData, 'name');
        obj = JSON.parse(JSON.stringify(Data.referral_v2.default_json[widget_type]));
        obj.widget_data.items[0].data.title1 = (studentLocale == 'en') ? groupedReferralVideoWidgetData.title1[0].value.split('|||')[0] : groupedReferralVideoWidgetData.title1[0].value.split('|||')[1];
        obj.widget_data.items[0].data.title2 = (studentLocale == 'en') ? groupedReferralVideoWidgetData.title2[0].value.split('|||')[0] : groupedReferralVideoWidgetData.title2[0].value.split('|||')[1];
        obj.widget_data.items[0].data.title3 = (studentLocale == 'en') ? groupedReferralVideoWidgetData.title3[0].value.split('|||')[0] : groupedReferralVideoWidgetData.title3[0].value.split('|||')[1];
        obj.widget_data.items[0].data.bg_color = Data.referral_v2.video_widget_bg_color_array[parseInt(referralCount) % 5];
        obj.widget_data.items[0].data.image_url = groupedReferralVideoWidgetData.image_url[0].value;
        obj.widget_data.items[0].data.title4.title = groupedReferralVideoWidgetData.winner_count_text[0].value.replace(/{winnerCount}/g, winnerCount);
        obj.widget_data.items[0].data.title4.image_url = groupedReferralVideoWidgetData.level_widget_phone_url[0].value;
        obj.widget_data.items[0].data.bg_image_url = groupedReferralVideoWidgetData[`qid${referralCount}`][0].value.split('|||')[2];
        obj.widget_data.items[0].data.qid = groupedReferralVideoWidgetData[`qid${referralCount}`][0].value.split('|||')[0];
        obj.widget_data.items[0].data.video_resource.resource = `${Data.cdnUrlLimeLight}/${groupedReferralVideoWidgetData[`qid${referralCount}`][0].value.split('|||')[1]}`;
        obj.widget_data.items[0].data.video_resource.video_resource = groupedReferralVideoWidgetData[`qid${referralCount}`][0].value.split('|||')[1];
    } else if (widget_type == 'referral_level_widget') {
        const myOrderedArray = _.sortBy(referralObjectDnProperty, (o) => parseInt(o.name));
        const awayCount = referralObjectDnProperty.length - referralCount;
        const levelWidgetData = await Properties.getNameAndValueByBucket(db.mysql.read, widget_type);
        const groupedLevelWidgetData = _.groupBy(levelWidgetData, 'name');
        obj = JSON.parse(JSON.stringify(Data.referral_v2.default_json[widget_type]));
        obj.data.title = (studentLocale == 'en') ? groupedLevelWidgetData[`title${referralCount}`][0].value.split('|||')[0].replace(/{levels}/g, awayCount) : groupedLevelWidgetData[`title${referralCount}`][0].value.split('|||')[1].replace(/{levels}/g, awayCount);
        const admText = (studentLocale == 'en') ? 'Admission' : 'एडमिशन';
        for (let i = 0; i < myOrderedArray.length; i++) {
            const level = { text: `${admText} ${i + 1}`, is_locked: 1 };
            if (myOrderedArray[i].value.includes('://')) {
                level.image_url = myOrderedArray[i].value;
            } else {
                level.amount = myOrderedArray[i].value;
            }
            if (referralObject[i]) {
                level.is_locked = 0;
                if (level.amount) {
                    level.amount = referralObject[i].amount;
                }
            }
            obj.data.levels.push(level);
        }
    } else if (widget_type == 'referral_testimonial_widget') {
        const testimonials = await Properties.getNameAndValueByBucket(db.mysql.read, 'referral_ceo_v2_testimonials');
        obj = JSON.parse(JSON.stringify(Data.referral_v2.default_json[widget_type][studentLocale]));
        for (let i = 0; i < testimonials.length; i++) {
            const item = JSON.parse(JSON.stringify(Data.referral_v2.default_json.referral_testimonial_widget_item));
            item.data.id = testimonials[i].name;
            item.data.image_url = testimonials[i].value;
            item.data.deeplink = `doubtnutapp://video?qid=${testimonials[i].name}&page=REFERRAL_V2`;
            obj.widget_data.items.push(item);
        }
    } else if (widget_type == 'referral_faq_widget') {
        let bucket = 'referral_ceo_v2';
        if (studentLocale == 'hi') {
            bucket = `${bucket}_${studentLocale}`;
        }
        const faq = await Properties.getNameAndValueByBucket(
            db.mysql.read,
            bucket,
        );
        obj = JSON.parse(JSON.stringify(Data.referral_v2.default_json[widget_type]));
        for (let i = 0; i < faq.length; i++) {
            obj.data.items.push({
                toggle: true,
                enable_toggle: false,
                name: faq[i].name,
                name_color: '#969696',
                name_size: 14,
                value: faq[i].value,
                value_color: '#2f2f2f',
                value_size: 14,
            });
        }
    } else if (widget_type == 'referral_claim_widget') {
        obj = JSON.parse(JSON.stringify(Data.referral_v2.default_json[widget_type][studentLocale]));
        obj.widget_data.deeplink = obj.widget_data.deeplink.replace(/{id}/g, referralObject[referralObject.length - 1].id);
    } else if (['referral_goodie_widget', 'referral_calling_widget', 'referral_steps_widget', 'referral_earn_more_widget', 'referral_winner_congratulation_widget', 'referral_winner_earn_more_widget', 'referral_text_widget'].includes(widget_type)) {
        obj = JSON.parse(JSON.stringify(Data.referral_v2.default_json[widget_type][studentLocale]));
    }
    return obj;
}

async function getCoursesWidgetsByQid({
    db,
    studentClass,
    config,
    versionCode,
    studentID,
    studentLocale: locale,
    xAuthToken,
    questionID,
    bottomSheet,
    videoDetails,
    source,
}) {
    const userActivePackages = await CourseContainerv2.getUserActivePackages(db, studentID);
    const userCourseAssortments = [];
    userActivePackages.map((item) => userCourseAssortments.push(item.assortment_id));
    const coursesList = await CourseManager.getDataForPopularCourseCarousel({
        db,
        studentClass,
        config,
        versionCode,
        studentId: studentID,
        studentLocale: locale,
        xAuthToken,
        page: 'VIDEO_PAGE',
        questionID,
        userCourseAssortments,
    });
    // console.log(coursesList);
    if (coursesList.studentCcmAssortments.length === 0) {
        return [];
    }
    const tempStudentCcmAssortments = [];
    for (let i = 0; i < coursesList.studentCcmAssortments.length; i++) {
        if (coursesList.studentCcmAssortments[i] !== null && coursesList.studentCcmAssortments[i].assortment_id !== undefined && coursesList.studentCcmAssortments[i].assortment_id !== null) {
            tempStudentCcmAssortments.push(coursesList.studentCcmAssortments[i]);
        }
    }
    coursesList.studentCcmAssortments = tempStudentCcmAssortments;
    const tempAssortmentList = [];
    for (let i = 0; i < coursesList.assortmentList.length; i++) {
        if (coursesList.assortmentList[i] !== undefined && coursesList.assortmentList[i] !== null) {
            tempAssortmentList.push(coursesList.assortmentList[i]);
        }
    }
    coursesList.assortmentList = tempAssortmentList;
    const { assortmentPriceMapping } = coursesList;
    let subjectAssortments = [];
    if (coursesList.studentCcmAssortments.length > 0) {
        subjectAssortments = await CourseContainerv2.getSubjectsListWithTeachersByCourseAssortment(db, coursesList.studentCcmAssortments[0].assortment_id);
    }
    const result = [];
    result.push(coursesList);
    result.push(subjectAssortments);
    const widgets = await getTabWidgetsByTabId({
        db,
        result,
        tabID: 'tutions',
        config,
        locale,
        videoDetails,
        assortmentPriceMapping,
        source,
    });
    // widgets.push(courseWidgets[0]);
    // const subjectAssortmentList = [];
    // subjectAssortments.map((item) => subjectAssortmentList.push(item.assortment_id));
    // const subjectPricing = subjectAssortmentList.length ? await CourseManager.generateAssortmentVariantMapping(db, subjectAssortmentList) : {};
    // widgets.push(WidgetHelper.getSubjectCourseCardTabsWidget({
    //     result: subjectAssortments, subjectPricing, courseTitle: coursesList[0].studentCcmAssortments[0].display_name,
    // }));
    if (!bottomSheet) {
        widgets.push(WidgetHelper.getWidgetImageText({
            title: locale === 'hi' ? 'आपके लिए और अधिक फ्री क्लासेस' : 'More FREE classes for you', title_color: '#ffffff', color: '#54138a', image: `${config.cdn_url}engagement_framework/F96434A2-9E38-999A-1646-F4F711357889.webp`, deeplink: `doubtnutapp://course_bottom_sheet_v2?type=free_classes&qid=${questionID}`, image2: `${config.cdn_url}engagement_framework/7A0CA41A-3A5E-B867-D185-00EDB4ACA16E.webp`, textColor: '#ffffff',
        }));
    }
    return widgets;
}

async function getFreeClassesContentByQId({
    db, questionID, filteredUserSubscription, studentID, locale, config, studentClass, source, newSimilar = 0,
}) {
    const notesDetail = await CourseContainerv2.getNotesByQuestionID(db, questionID);
    // const subjectAssortments = await CourseV2Mysql.getScheduleTypeWithAssortmentId(db.mysql.read, courseDetailsOfVideo[0].assortment_id);
    let { result } = await CourseManager.getLectureSeriesByQuestionID(db, questionID, filteredUserSubscription, studentID);
    const resultTemp = [];
    for (let i = 0; i < result.length; i++) {
        if (result[i].live_at !== null && result[i].live_at !== undefined && moment().add(5, 'hours').add(30, 'minutes').isBefore(result[i].live_at)) {
            resultTemp.push(result[i].resource_reference);
        }
    }
    result = result.filter((item) => !resultTemp.includes(item.resource_reference));
    let promise = [];
    const ccmIdList = await getStudentCCmIds(db, studentID);
    const subjectStartDate = moment().subtract(10, 'days').add(5, 'h').add(30, 'minutes')
        .format('YYYY-MM-DD hh:mm:ss');
    const subjectEndDate = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD hh:mm:ss');
    const localeNew = locale === 'hi' ? 'HINDI' : 'ENGLISH';
    const [
        mostWatchedData,
        subjectList,
    ] = await Promise.all([
        PznContainer.getQuestionByMaxEngageTime({ ccm_ids: ccmIdList, languages: [localeNew] }),
        PznContainer.getSubjectListByTotalEt(studentID, subjectStartDate, subjectEndDate),
    ]);
    for (let i = 0; i < mostWatchedData.length; i++) {
        promise.push(CourseContainerv2.getAssortmentsByResourceReferenceV1(db, mostWatchedData[i]));
    }
    const resolvedPromises = await Promise.all(promise);
    let recentClasses = [];
    for (let i = 0; i < resolvedPromises.length; i++) {
        if (resolvedPromises[i].length) {
            resolvedPromises[i][0].resource_reference = mostWatchedData[i];
            recentClasses.push(resolvedPromises[i][0]);
        }
    }
    // console.log(recentClasses)
    const widgets = [];
    const lectureList = result.filter((item) => item.resource_reference !== questionID);
    promise = [];
    for (let i = 0; i < lectureList.length; i++) {
        promise.push(generateLikesDurationText(db, [{
            resource_reference: lectureList[i].resource_reference, stream_status: lectureList[i].stream_status, live_at: lectureList[i].live_at,
        }], locale));
    }
    recentClasses.forEach((item) => {
        if (item.subject !== undefined && item.subject !== null) {
            item.subject = item.subject.trim();
        }
    });
    recentClasses = _.groupBy(recentClasses, 'subject');
    for (const key in recentClasses) {
        if (recentClasses[key]) {
            recentClasses[key] = recentClasses[key].slice(0, 3);
            for (let i = 0; i < recentClasses[key].length; i++) {
                promise.push(generateLikesDurationText(db, [{
                    resource_reference: recentClasses[key][i].resource_reference, stream_status: recentClasses[key][i].stream_status, live_at: recentClasses[key][i].live_at,
                }], locale));
            }
        }
    }
    const tempRecentClasses = recentClasses;
    recentClasses = [];
    for (const key in tempRecentClasses) {
        if (tempRecentClasses[key]) {
            recentClasses = [...recentClasses, ...tempRecentClasses[key]];
        }
    }
    const likesData = await Promise.all(promise);
    for (let i = 0; i < lectureList.length; i++) {
        if (likesData[i]) {
            lectureList[i].likes_data = likesData[i];
        }
    }
    for (let i = 0; i < recentClasses.length; i++) {
        if (likesData[i]) {
            recentClasses[i].likes_data = likesData[i];
        }
    }
    if (lectureList.length) {
        if (newSimilar) {
            widgets.push(await WidgetHelper.generateNextChapterVideos({
                locale, config, result: lectureList, db,
            }));
        } else {
            widgets.push(WidgetHelper.getLiveclassCourseCard3Widget({ result: lectureList, locale, source }));
        }
    }
    if (notesDetail.length) {
        const widget = await getTabWidgetsByTabId({
            db,
            result: notesDetail,
            tabID: 'free_notes',
            locale,
            config,
            studentID,
            studentClass,
            videoDetails: [{ resource_reference: questionID }],
            source,
        });
        widgets.push(widget[0]);
    }
    let categoryType = ['BOARDS/SCHOOL/TUITION'];
    if (parseInt(studentClass) === 14) {
        categoryType = ['BOARDS/SCHOOL/TUITION', 'SSC', 'DEFENCE/NDA/NAVY', 'RAILWAY', 'BANKING', 'CTET'];
    }
    const subjectAssortData = await CourseV2Mysql.getFreeSubjectsForFreeClassVideoPage(db.mysql.read, studentClass, locale, categoryType);
    if (recentClasses.length) {
        widgets.push(WidgetHelper.getSubjectTabsWidget({
            result: recentClasses, locale, subjectList, source, subjectAssortData,
        }));
    }
    widgets.push(getLibraryBanner(false, config, locale));
    return widgets;
}

module.exports = {
    getFreeClassesContentByQId,
    getCoursesWidgetsByQid,
    getTabWidgetsByTabId,
    getTabDataByTabId,
    getCaraouselData,
    getPaymentCardState,
    generateCoursesData,
    mapData,
    getBarColor,
    getVideoPageIconsList,
    getVideoPageTabsList,
    getWidgetsForChapterCarousel,
    getReferralV2Widgets,
    generateLikesDurationText,
};
