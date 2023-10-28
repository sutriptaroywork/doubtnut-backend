/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const { ObjectId } = require('mongodb');
const { ValidationError } = require('express-validation');
const CourseContainer = require('../../../modules/containers/course');
const EtoosBannerMysql = require('../../../modules/mysql/etoosBanner');
const EtoosStrcturedCourseMysql = require('../../../modules/mysql/eStructuredCourse');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const CourseMysql = require('../../../modules/mysql/course');
const randomNumberGenerator = require('../../../modules/randomNumberGenerator');
const QuestionContainer = require('../../../modules/containers/question');
const PznContainer = require('../../../modules/containers/pzn');
const CourseHelper = require('../../helpers/course');
const Data = require('../../../data/data');
const PaidUserChampionshipData = require('../paid_user_championship/paidUserChampionship.data');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');

function generateTag(background_color, text, text_color) {
    return {
        background_color,
        text,
        text_color,
    };
}
function facultyDataMapper(data) {
    const cloned = [];
    console.log('mapper');
    console.log(data);
    for (let i = 0; i < data.length; i++) {
        const obj = {};
        let subtitle = null;
        obj.faculty_id = data[i].faculty_id;
        obj.ecm_id = data[i].ecm_id;
        obj.title = data[i].title;
        obj.image_url = data[i].image_url;
        obj.background_color = data[i].background_color;
        if (!_.isNull(data[i].subject) && !_.isEmpty(data[i].subject)) {
            subtitle = data[i].subject;
        }
        if (!_.isNull(data[i].degree_obtained) && !_.isEmpty(data[i].degree_obtained)) {
            subtitle = (subtitle === null) ? `${data[i].degree_obtained}` : `${subtitle} | ${data[i].degree_obtained}`;
        }
        if (!_.isNull(data[i].college) && !_.isEmpty(data[i].college)) {
            subtitle = (subtitle === null) ? `${data[i].college}` : `${subtitle} | ${data[i].college}`;
        }
        if (!_.isNull(data[i].coaching) && !_.isEmpty(data[i].coaching)) {
            subtitle = (subtitle === null) ? `${data[i].coaching}` : `${subtitle} | ${data[i].coaching}`;
        }
        if (!_.isNull(data[i].years_experience) && !_.isEmpty(data[i].years_experience)) {
            subtitle = (subtitle === null) ? `${data[i].years_experience} years of exp` : `${subtitle} | ${data[i].years_experience} years of exp}`;
        }
        obj.subtitle = subtitle;
        cloned.push(obj);
    }
    return cloned;
}
function generateDfcData(data) {
    const {
        caraouselObject,
        caraouselData,
        whatsappShareMessage,
    } = data;
    const obj = {};
    const secondaryObj = {};
    secondaryObj.title = caraouselObject.title;
    secondaryObj.page = 'E_COURSE';
    secondaryObj.is_vip = true;
    secondaryObj.whatsapp_share_message = whatsappShareMessage;
    obj.type = caraouselObject.data_type;
    secondaryObj.items = caraouselData;
    obj.data = secondaryObj;
    return obj;
}
function generateECourseData(data) {
    const {
        caraouselObject,
        caraouselData,
        whatsappShareMessage,
        isVip,
    } = data;
    const obj = {};
    const secondaryObj = {};
    secondaryObj.title = caraouselObject.title;
    secondaryObj.page = caraouselObject.type;
    secondaryObj.is_vip = isVip;
    secondaryObj.whatsapp_share_message = whatsappShareMessage;
    secondaryObj.items = caraouselData;
    obj.type = caraouselObject.data_type;
    obj.data = secondaryObj;
    return obj;
}
function generateFacultyChapterListData(data) {
    const {
        caraouselObject,
        caraouselData,
    } = data;
    const obj = {};
    const secondaryObj = {};
    secondaryObj.title = caraouselObject.title;
    obj.type = caraouselObject.data_type;
    secondaryObj.items = caraouselData;
    if (secondaryObj.items.length > 0) {
        secondaryObj.items[0].left_tag = generateTag(Data.left_tag_background_color, Data.left_tag_text, Data.left_tag_text_color);
        secondaryObj.items[0].right_tag = generateTag(Data.right_tag_background_color, Data.right_tag_text, Data.right_tag_text_color);
    }

    obj.data = secondaryObj;
    return obj;
}
function generateTopFacultyData(data) {
    const {
        caraouselObject,
        caraouselData,
    } = data;
    const obj = {};
    const secondaryObj = {};
    secondaryObj.title = caraouselObject.title;
    obj.type = caraouselObject.data_type;
    secondaryObj.items = facultyDataMapper(caraouselData);
    if (secondaryObj.items.length > 0) {
        secondaryObj.items[0].left_tag = generateTag(Data.left_tag_background_color, Data.left_tag_text, Data.left_tag_text_color);
    }
    obj.data = secondaryObj;
    return obj;
}
function generateStructuredCourseData(data) {
    const {
        caraouselObject,
        caraouselData,
    } = data;
    const obj = {};
    const secondaryObj = {};
    secondaryObj.title = caraouselObject.title;
    obj.type = caraouselObject.data_type;
    secondaryObj.items = caraouselData;
    obj.data = secondaryObj;
    return obj;
}
function generateAppBannerData(data) {
    const {
        caraouselObject,
        caraouselData,
    } = data;
    const obj = {};
    const secondaryObj = {};
    secondaryObj.image_url = caraouselData.image_url;
    secondaryObj.type = caraouselData.type;
    obj.type = caraouselObject.data_type;
    obj.action = {};
    obj.action.action_data = JSON.parse(caraouselData.action_data);
    obj.action.action_activity = caraouselData.action_activity;
    obj.data = secondaryObj;
    return obj;
}
function generatePromises(data) {
    const {
        caraouselList,
        db,
        ecmId,
        studentClass,
    } = data;
    const promise = [];

    for (let i = 0; i < caraouselList.length; i++) {
        if (caraouselList[i].type === 'DFC') {
            promise.push(CourseContainer.getDfcData({
                db,
                ecmId,
                limit: caraouselList[i].data_limit,
                studentClass,
            }));
        } else if (caraouselList[i].type === 'APP_BANNER') {
            promise.push(EtoosBannerMysql.get({
                database: db.mysql.read,
                ecmId,
            }));
        } else if (caraouselList[i].type === 'STRUCTURED_COURSE') {
            promise.push(EtoosStrcturedCourseMysql.getFreeClass(db.mysql.read, ecmId));
        } else if (caraouselList[i].type === 'TOP_FACULTY') {
            promise.push(CourseMysql.getTopTeachersMeta(db.mysql.read, JSON.parse(caraouselList[i].meta_data), ecmId, caraouselList[i].data_limit));
        } else if (caraouselList[i].type === 'FACULTY_CHAPTER_LIST') {
            promise.push(CourseMysql.getTeacherChapters(db.mysql.read, JSON.parse(caraouselList[i].meta_data), ecmId, caraouselList[i].data_limit));
        } else if (caraouselList[i].type === 'E_COURSE') {
            promise.push(CourseMysql.getLecturesList(db.mysql.read, JSON.parse(caraouselList[i].meta_data), caraouselList[i].data_limit));
        }
    }
    return promise;
}
async function getCaraouselData(data) {
    const {
        caraouselList,
        whatsappShareMessage,
        isVip,
        studentClass,
    } = data;
    try {
        console.log('mysql');
        console.log(studentClass);
        const caraouselData = [];
        const resolvedPromiseData = await Promise.all(generatePromises(data));
        for (let i = 0; i < caraouselList.length; i++) {
            if (caraouselList[i].type === 'DFC') {
                caraouselData.push(generateDfcData({ caraouselObject: caraouselList[i], caraouselData: resolvedPromiseData[i], whatsappShareMessage }));
            } else if (caraouselList[i].type === 'APP_BANNER') {
                caraouselData.push(generateAppBannerData({ caraouselObject: caraouselList[i], caraouselData: resolvedPromiseData[i][0] }));
            } else if (caraouselList[i].type === 'STRUCTURED_COURSE') {
                caraouselData.push(generateStructuredCourseData({ caraouselObject: caraouselList[i], caraouselData: resolvedPromiseData[i] }));
            } else if (caraouselList[i].type === 'TOP_FACULTY') {
                caraouselData.push(generateTopFacultyData({ caraouselObject: caraouselList[i], caraouselData: resolvedPromiseData[i] }));
            } else if (caraouselList[i].type === 'FACULTY_CHAPTER_LIST') {
                caraouselData.push(generateFacultyChapterListData({ caraouselObject: caraouselList[i], caraouselData: resolvedPromiseData[i] }));
            } else if (caraouselList[i].type === 'E_COURSE') {
                caraouselData.push(generateECourseData({
                    caraouselObject: caraouselList[i],
                    caraouselData: resolvedPromiseData[i],
                    isVip,
                }));
            }
        }
        return caraouselData;
    } catch (e) {
        throw new Error(e);
    }
}

function getTopHeaderMessages(moment, data) {
    let isVip = false;
    // never vip and trial ever
    const neverVipAndTrial = (data.length === 0);
    if (neverVipAndTrial) {
        return { message: Data.neverVipAndTrialMessage, isVip };
    }
    let isTrial = false;
    const momentEnd = moment(data[0].end_date);
    const momentNow = moment();
    const remainingDays = momentEnd.diff(momentNow, 'days');
    const remainingHours = momentEnd.diff(momentNow, 'hours');
    console.log('remainingDays');
    console.log(remainingDays);
    console.log('remainingHOurs');
    console.log(remainingHours);

    // check trial
    if (data[0].amount === -1.00 && remainingDays >= 0 && remainingHours > 0) {
        isTrial = true;
    }
    let isEverTrialUsedNoVip = false;
    for (let i = 0; i < data.length; i++) {
        if (data[i].amount === -1.00 && (remainingDays <= 0) && remainingHours < 0) {
            isEverTrialUsedNoVip = true;
        }
    }
    // trial expired and no vip
    if (isEverTrialUsedNoVip) {
        return { message: Data.everTrialUsedNoVipMessage, isVip };
    }
    // user is in Trial
    if (isTrial) {
        return { message: Data.trialMessage(remainingDays), isVip };
    }
    // last 5 days remaining vip
    const lastFiveDaysVip = ((data.length > 0) && (remainingDays < 6) && (remainingDays >= 0) && (remainingHours > 0));
    if (lastFiveDaysVip) {
        return { message: Data.lastFiveDaysVipMessage(remainingDays), isVip };
    }
    // VIP member
    isVip = (((data.length > 0) && (remainingDays > 0) && (!isTrial)));
    if (isVip) {
        return { message: Data.vipMessage, isVip };
    }

    // expired vip
    const expiredVip = ((data.length > 0) && (remainingDays <= 0) && (remainingHours < 0));
    if (expiredVip) {
        return { message: Data.expiredVipMessage, isVip };
    }
}

async function getMostWatchedLFVideo(db, studentClass) {
    const mostWatchedData = await PznContainer.getQuestionByMaxEngageTime({ class: +studentClass });
    const promise = [];
    for (let i = 0; i < mostWatchedData.length; i++) {
        promise.push(CourseContainerv2.getAssortmentsByResourceReferenceV1(db, mostWatchedData[i]));
    }
    const liveClassData = await Promise.all(promise);
    const data = CourseHelper.bottomSheetDataFormat(mostWatchedData, liveClassData, 0);
    if (data.widget_data.items.length) {
        data.extra_params = { source: 'homepage_continue_watching' };
        data.widget_data.tab_gravity_full = true;
        return {
            widgets: [data],
            title: 'Aapki padhai ke liye sabse best classes for <font color="#e34c4c"><b>free</font>.&#x1f929',
            title_text_color: '#504949',
            title_text_size: '20',
            back_press_deeplink: 'doubtnutapp://library_tab?tag=free_classes',
        };
    }
    return [];
}

async function getLFSuggestionVideo(db, qid) {
    const qData = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, qid);
    let title = 'You were watching this kind of videos';
    if (qData && qData.length) {
        const [qList, lfQidData] = await Promise.all([
            QuestionContainer.rescursiveList(qData[0], 1, 10, [], db),
            CourseContainerv2.getSubjectAssortmentByQid(db, qid),
        ]);
        const promise = [];
        for (let i = 0; i < qList.length; i++) {
            promise.push(CourseContainerv2.getAssortmentsByResourceReferenceV1(db, qList[i].question_id));
        }
        const liveClassData = await Promise.all(promise);
        const data = CourseHelper.bottomSheetDataFormat(qList, liveClassData, 1);
        if (data.widget_data.items.length && lfQidData && lfQidData.length) {
            data.widget_data.actions = [
                {
                    text_one: 'View more videos >',
                    text_one_size: '12',
                    text_one_color: '#ea532c',
                    bg_stroke_color: '#ea532c',
                    deeplink: `doubtnutapp://course_detail_info?assortment_id=${lfQidData[0].subject_assortment_id}&tab=recent`,
                },
            ];
            title = `You were watching ${_.startCase(data.widget_data.items[0].data.subject.toLowerCase())} videos`;
            data.extra_params = { source: 'homepage_continue_watching' };
            return {
                widgets: [data],
                title,
                subtitle: 'Here are some similar suggested videos exclusively for <font color="#e34c4c"><b>free</font>.&#x1f929',
                title_text_color: '#504949',
                title_text_size: '20',
                subtitle_text_color: '#808080',
                subtitle_text_size: '14',
                back_press_deeplink: 'doubtnutapp://library_tab?tag=free_classes',
            };
        }
        return [];
    }
    return [];
}

async function getContinueWatching(data) {
    const likesData = randomNumberGenerator.getLikeDislikeStatsNew(data.question_id)[0];
    const obj = {
        thumbnail_image: data.expert_image,
        deeplink: `doubtnutapp://video?qid=${data.question_id}&page=LIVECLASS_FREE&video_start_position=${data.watched_time}&playlist_id=null`,
        text_one: `${_.startCase(data.subject.toLowerCase())}`,
        text_three: `${_.startCase(data.expert_name.toLowerCase())}`,
        text_two: `${data.display}`,
        card_width: '1.5x',
        watched_time: data.watched_time,
        total_time: data.total_time,
        bg_color: Data.freeLiveClassTab.subjetColorCode[data.subject.toLowerCase() || 'default'],
        views: `${Math.floor(likesData / 100)} students watched`,
        show_duration_text: true,
        text_one_color: '#000000',
        text_one_size: '16',
        icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/video_play_button.webp',
    };

    const widgetData = {
        text_one: 'You were watching this video',
        text_one_size: '19',
        text_one_color: '#000000',
        text_icon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/84A17AE6-3DEE-D5B7-11D7-408FE4B9180E.webp',
        videos: [obj],
        id: `${data.question_id}`,
        cta: 'WATCH NOW',
        cta_deeplink: `doubtnutapp://video?qid=${data.question_id}&page=LIVECLASS_FREE&video_start_position=${data.watched_time}&playlist_id=null`,
    };
    return {
        widgets: [{
            widget_type: 'you_were_watching_v2',
            layout_config: Data.freeLiveClassTab.you_were_watching_v2.layout_config,
            widget_data: widgetData,
            extra_params: { source: 'homepage_continue_watching' },
        }],
        back_press_deeplink: 'doubtnutapp://library_tab?tag=free_classes',
    };
}

async function claimReward(req, res, next) {
    try {
        const { type, id } = req.query;
        const { student_id: studentId, locale } = req.user;
        const versionCode = req.headers.version_code;
        const db = req.app.get('db');
        const result = await CourseMysql.getReferralId(db.mysql.read, id);
        if (result[0].invitor_student_id !== studentId) {
            throw new ValidationError('invalid username');
        }
        const states = [];
        Object.keys(PaidUserChampionshipData.stateAbbreviationMapping).forEach((item) => states.push({ id: item, title: PaidUserChampionshipData.stateAbbreviationMapping[item] }));
        states.unshift({
            id: '',
            title: locale === 'hi' ? 'स्टेट' : 'State',
        });
        const sizes = [];
        PaidUserChampionshipData.shirtSizes.forEach((item) => sizes.push({ id: item, title: item }));
        sizes.unshift({
            id: '',
            title: locale === 'hi' ? 'T-Shirt साइज़ चुनिये' : 'Select T-Shirt Size',
        });
        const data = {
            title: 'Enter Your Address',
            hint_full_name: locale === 'hi' ? 'पूरा नाम' : 'Full Name',
            title_text_sizeFull: '14',
            title_text_color: '#272727',
            country_code: '+91',
            hint_mobile_number: locale === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number',
            hint_pin_code: locale === 'hi' ? 'पिन कोड' : 'PIN CODE',
            hint_address_one: locale === 'hi' ? 'फ्लैट, हाउस नंबर, बिल्डिंग, अपार्टमेंट' : 'Flat, House No., Building, Apartment',
            hint_address_two: locale === 'hi' ? 'क्षेत्र, कॉलोनी, गली, सेक्टर, गांव' : 'Area, Colony, Street, Sector, Village',
            hint_landmark: locale === 'hi' ? 'लैंडमार्क (उदाहरण, नियर रिलायंस मार्ट)' : 'Landmark eg. Near Reliance Mart',
            hint_city: locale === 'hi' ? 'टाउन/सिटी' : 'Town/ City',
            hint_state: locale === 'hi' ? 'स्टेट' : 'STATE',
            submit_text: locale === 'hi' ? 'सबमिट' : 'Submit',
            extra_params: { type, id },
            states,
            sizes,
        };
        if (versionCode >= 994) {
            delete data.hint_address_one;
            delete data.hint_address_two;
            delete data.hint_landmark;
            delete data.hint_city;
            delete data.hint_state;
            data.hint_link = locale === 'hi' ? 'यूटूब या इन्स्टग्रैम या फ़ेस्बुक का लिंक' : 'Youtube/Instagram/Facebook Link';
            data.hint_link2 = locale === 'hi' ? 'लिंक पेस्ट करो' : 'Paste link';
            data.hint_full_address = locale === 'hi' ? 'अपना पूरा पता लिखो' : 'Apna poora address likho';
            data.lottie_url = Data.referral_v2.goodie_form_animation_video;
        }
        return next({ data });
    } catch (err) {
        return next({ err });
    }
}

async function submitClaim(req, res, next) {
    try {
        const {
            full_name: fullName, address_one: addressOne, address_two: addressTwo, city, country_code: countryCode, landmark, mobile_number: mobile, pin_code: pincode, state_id: stateId, id, size_id: sizeId, full_address, link,
        } = req.body;
        const versionCode = req.headers.version_code;
        const db = req.app.get('db');
        const { locale, student_id } = req.user;
        let errorMessage = '';
        // eslint-disable-next-line no-restricted-globals
        if (!mobile || mobile.length !== 10 || Number.isNaN(mobile)) {
            errorMessage = locale === 'hi' ? 'अमान्य मोबाइल' : 'Invalid Mobile';
        } else if (!pincode) {
            errorMessage = locale === 'hi' ? 'पिनकोड लिखें' : 'Enter Pincode';
        } else if (pincode.length !== 6) {
            errorMessage = locale === 'hi' ? '6 अंक का पिनकोड डालिये' : 'Enter 6 digit Pincode';
        } else if (!sizeId) {
            errorMessage = locale === 'hi' ? 'साइज़ चुनें' : 'Select Size';
        } else if (!fullName) {
            errorMessage = locale === 'hi' ? 'पूरा नाम लिखें' : 'Enter Full Name';
        } else if (versionCode >= 994) {
            if (!full_address) {
                errorMessage = locale === 'hi' ? 'पता लिखिएं' : 'Enter address';
            } else if (!link) {
                errorMessage = locale === 'hi' ? 'यूटूब या इन्स्टग्रैम या फ़ेस्बुक लिंक लिखें' : 'Enter Youtube/Instagram/Facebook Link';
            }
        } else if (!stateId) {
            errorMessage = locale === 'hi' ? 'राज्य चुनें' : 'Select State';
        } else if (!addressOne) {
            errorMessage = locale === 'hi' ? 'पता लिखिए' : 'Enter address';
        } else if (!city) {
            errorMessage = locale === 'hi' ? 'शहर लिखें' : 'Enter City';
        }
        if (errorMessage) {
            return next({ data: { error_message: errorMessage } });
        }
        if (versionCode >= 994) {
            await CourseMysql.claimReferralReward(db.mysql.write, {
                student_id,
                full_name: fullName,
                mobile: countryCode + mobile,
                pincode,
                address_line_1: full_address,
                spd_id: id,
                size: sizeId,
                data: link,
            });
        } else {
            await CourseMysql.claimReferralReward(db.mysql.write, {
                student_id,
                full_name: fullName,
                mobile: countryCode + mobile,
                pincode,
                address_line_1: addressOne,
                address_line_2: addressTwo,
                address_line_3: landmark,
                city,
                state: PaidUserChampionshipData.stateAbbreviationMapping[stateId],
                spd_id: id,
                size: sizeId,
            });
        }

        return next({
            data: {
                message: locale === 'hi' ? 'अपनी डिटेल्स सबमिट करने के लिए धन्यवाद।' : 'Thank you for submitting your details!',
                toast_message: locale === 'hi' ? 'अपनी डिटेल्स सबमिट करने के लिए धन्यवाद।' : 'Thank you for submitting your details!',
                deeplink: 'doubtnutapp://home?recreate=true',
            },
        });
    } catch (err) {
        return next({ err });
    }
}

async function bookmarkResource(db, studentId, resourceId, assortmentId, type) {
    const data = await CourseV2Mysql.getAllBookMarkedResourcesByResourceId(db.mysql.read, studentId, resourceId, assortmentId, type === 'doubt' ? 1 : 0);
    let message = 'Bookmarked Successfully';
    let bookmark = 1;
    if (data.length) {
        bookmark = data[0].is_bookmarked ? 0 : 1;
        CourseV2Mysql.setBookmarkedResource(db.mysql.write, studentId, resourceId, assortmentId, bookmark, type === 'doubt' ? 1 : 0);
        message = !bookmark ? 'Bookmarked Removed Successfully' : message;
    } else {
        const insertData = {
            student_id: studentId,
            course_assortment_id: assortmentId,
            course_resource_id: resourceId,
            is_bookmarked: 1,
            is_doubt: type === 'doubt' ? 1 : 0,
        };
        if (type === 'doubt') {
            const doubtsData = await db.mongo.read.collection('comments').find({ _id: ObjectId(resourceId) }).toArray();
            if (doubtsData.length) {
                const qId = doubtsData[0].entity_id;
                const videoDetails = await CourseV2Mysql.getRecordedResourceDetails(db.mysql.read, qId);
                insertData.course_resource_id = videoDetails[0].id;
                insertData.comment_id = resourceId;
            }
        }
        CourseV2Mysql.bookmarkCourseResource(db.mysql.write, insertData);
    }
    return { message, bookmark };
}
module.exports = {
    getCaraouselData,
    generateDfcData,
    generateTopFacultyData,
    generateFacultyChapterListData,
    generateECourseData,
    getTopHeaderMessages,
    getMostWatchedLFVideo,
    getLFSuggestionVideo,
    getContinueWatching,
    claimReward,
    submitClaim,
    bookmarkResource,
};
