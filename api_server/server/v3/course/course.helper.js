const _ = require('lodash');
// const moment = require('moment');
const moment = require('moment');
const CourseContainer = require('../../../modules/containers/course');
const CourseMysql = require('../../../modules/mysql/course');
const Data = require('../../../data/data');
const LiveclassHelper = require('../../helpers/liveclass');
const Liveclass = require('../../../modules/mysql/liveclass');
const CourseHelper = require('../../helpers/course');

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

function getBarColor(subject) {
    const colorMap = {
        PHYSICS: '#05d37d',
        BIOLOGY: '#6236ff',
        CHEMISTRY: '#f6c300',
        MATHS: '#ea532e',
        ALL: '#ffffff',
        ENGLISH: '#1da0f4',
        SCIENCE: '#ff6e00',
    };
    return colorMap[subject];
}

// function getButtonObj() {
//     const obj = {
//         type: 'button',
//         action: {
//             action_activity: 'payment_card',
//             action_data: null,
//         },
//         data: {
//             button_text: 'START FREE TRIAL',
//             variant_id: '0',
//             event_name: 'trial',
//         },
//     };
//     return obj;
// }

function generatePaymentCard(data) {
    const {
        actionData,
    } = data;
    return getPaymentCard(data, actionData);
}

async function getSubjectFilters(db, ecmId, studentClass) {
    const promise = [];
    promise.push(CourseMysql.getEcmListDataV3(db.mysql.read, studentClass));
    promise.push(CourseMysql.getSubjectList(db.mysql.read, ecmId, studentClass));
    promise.push(Liveclass.getSubjectsListV2(db.mysql.read, ecmId));
    const filterData = await Promise.all(promise);
    filterData[2].forEach((e) => {
        if (!(filterData[1].filter((sub) => sub.subject === e.subject).length > 0)) filterData[1].push(e);
    });
    const items = [{ filter_id: 'ALL', color: getBarColor('ALL') }];
    filterData[1].forEach((e) => {
        if (e.subject !== 'ALL') items.push({ filter_id: e.subject, color: getBarColor(e.subject) });
    });
    const obj = [
        {
            type: 'course_filter_exam',
            data: {
                items: filterData[0],
            },
        },
        {
            type: 'subject_filters',
            data: {
                items,
            },
        },
    ];
    return obj;
}

async function generateLiveSectionData(data) {
    const {
        db,
        caraouselObject,
        caraouselData,
        ecmId,
        paymentCardState,
        config,
    } = data;

    const livesection = await LiveclassHelper.generateFreeclassGrid({
        data: caraouselData,
        caraousel: { type: 'freeclass_grid' },
        db,
        config,
        paymentCardState,
        actionActivity: 'structured_course',
        ecmId,
    });
    const secondaryObj = {};
    secondaryObj.title = caraouselObject.title;
    secondaryObj.link_text = 'View All';
    secondaryObj.bg_color = '#0e2133';
    secondaryObj.items = livesection.data.items;
    const obj = {
        type: caraouselObject.data_type,
        action: {
            action_activity: 'all_livesection',
            action_data: {
                ecm_id: parseInt(ecmId),
            },
        },
        data: secondaryObj,
    };
    return obj;
}

async function getLiveSection(data) {
    const {
        db,
        ecmId,
        result,
        config,
        paymentCardState,
    } = data;

    const secondaryObj = await generateLiveSectionData({
        db,
        caraouselData: result[1],
        ecmId,
        config,
        paymentCardState,
        bottomInfo: 1,
        caraouselObject: { title: 'LIVE SECTION', data_type: 'freeclass_grid' },
    });
    console.log(secondaryObj);
    const obj = result[0];

    obj.push({
        type: secondaryObj.type,
        data: {
            title: secondaryObj.data.title,
            scroll_direction: 'vertical',
            bg_color: '#0e2133',
            items: secondaryObj.data.items,
        },
    });
    return obj;
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
        caraouselData[i].button_text = 'DEMO QUESTION';
        caraouselData[i].page = 'E_LECTURES';
        caraouselData[i].color = getBarColor(caraouselData[i].subject);
        caraouselData[i].degree_college = `${caraouselData[i].degree_obtained}, ${caraouselData[i].college}`;
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
    secondaryObj.link_text = '';
    secondaryObj.items = caraouselData;
    obj.type = caraouselObject.data_type;
    obj.action = {
        action_activity: 'faculty_page',
        action_data: null,
    };
    obj.data = secondaryObj;
    return obj;
}

async function generateSyllabusData(data) {
    const {
        caraouselObject,
        caraouselData,
    } = data;

    for (let i = 0; i < caraouselData.length; i++) {
        const hr = Math.floor(caraouselData[i].duration / 3600);
        const min = Math.floor((caraouselData[i].duration % 3600) / 60);
        caraouselData[i].subtitle = `${caraouselData[i].number_of_videos} VIDEOS - ${hr} hr ${min} mins`;
    }
    const secondaryObj = {};
    const obj = {
        type: caraouselObject.data_type,
        action: {
            action_activity: 'structured_course',
            action_data: null,
        },
    };
    secondaryObj.title = 'SYLLABUS';
    secondaryObj.items = caraouselData;
    obj.data = secondaryObj;
    return obj;
}

function generatePromises(data) {
    const {
        caraouselList,
        db,
        ecmId,
        studentClass,
        paymentCardState,
        subject,
    } = data;
    const promise = [];
    // let subject = getSubjectFilters()[1].data.tabs.filter((e)=>{ return e.filter_id==subject})[0].text
    console.log(subject);
    for (let i = 0; i < caraouselList.length; i++) {
        if (caraouselList[i].type === 'FACULTY_GRID') {
            promise.push(CourseContainer.getFacultyGridBySubject({
                db,
                ecmId,
                limit: caraouselList[i].data_limit,
                studentClass,
                subject,
            }));
        } else if (caraouselList[i].type === 'PAYMENT') {
            promise.push((async (caraousel) => generatePaymentCard({
                caraouselObject: caraousel,
                actionData: null,
                paymentCardState,
                subject,
            }))(caraouselList[i])); // mock promise with context
        } else if (caraouselList[i].type === 'STRUCTURED_COURSE') {
            promise.push(CourseContainer.getAllStructuredCourse({
                db, ecmId, studentClass, subject: 'ALL',
            }));
        } else if (caraouselList[i].type === 'SYLLABUS' && subject !== 0) {
            promise.push(CourseContainer.getAllMasterChapters(db, ecmId, subject));
        } else if (caraouselList[i].type === 'LIVESECTION') {
            promise.push(CourseContainer.getLiveSectionVideos({
                db, ecmId, studentClass, subject,
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
        ecmId,
        subject,
        studentClass,
        paymentCardState,
        page,
    } = data;
    try {
        let caraouselData = [];
        if (page == 1) caraouselData = await getSubjectFilters(db, ecmId, studentClass);
        const resolvedPromiseData = await Promise.all(generatePromises(data));
        // console.log(resolvedPromiseData)
        const staticDataArray = ['PAYMENT', 'COURSE_LIST_BUTTON'];
        for (let i = 0; i < caraouselList.length; i++) {
            if (_.includes(staticDataArray, caraouselList[i].type)) {
                caraouselData.push(resolvedPromiseData[i]);
            } else if (caraouselList[i].type === 'FACULTY_GRID') {
                if (resolvedPromiseData[i].length > 0) {
                    caraouselData.push(generateFacultyGridData({
                        db,
                        caraouselObject: caraouselList[i],
                        caraouselData: resolvedPromiseData[i],
                        ecmId,
                        subject,
                    }));
                }
            } else if (caraouselList[i].type === 'STRUCTURED_COURSE') {
                if (resolvedPromiseData[i].length > 0) {
                    caraouselData.push(CourseHelper.generateStructuredCourseDataV1({
                        db,
                        caraouselObject: caraouselList[i],
                        caraouselData: resolvedPromiseData[i],
                        config,
                        subject,
                    }));
                }
            } else if (caraouselList[i].type === 'SYLLABUS' && subject !== 0) {
                if (resolvedPromiseData[i].length > 0) {
                    caraouselData.push(generateSyllabusData({
                        db,
                        caraouselObject: caraouselList[i],
                        caraouselData: resolvedPromiseData[i],
                        config,
                    }));
                }
            } else if (caraouselList[i].type === 'LIVESECTION') {
                if (resolvedPromiseData[i].length > 0) {
                    caraouselData.push(generateLiveSectionData({
                        db,
                        caraouselObject: caraouselList[i],
                        caraouselData: resolvedPromiseData[i],
                        config,
                        paymentCardState,
                        ecmId,
                        subject,
                        bottomInfo: 1,
                    }));
                }
            }
        }
        const result = await Promise.all(caraouselData);
        return result;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function getPaymentCardState({
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

async function generateFacultyDetails(data, config, paymentCardState) {
    console.log(data);
    const chapters = data[1];
    for (let i = 0; i < chapters.length; i++) {
        chapters[i].subject_color = getBarColor(chapters[i].subject);
        // chapters[i].duration = '3360';
        chapters[i].subtitle = chapters[i].lecture_count ? `${chapters[i].lecture_count} VIDEOS - ${Math.floor(chapters[i].duration / 3600)} hr ${Math.floor((chapters[i].duration % 3600) / 60)} mins` : 'Videos Coming Soon';
    }

    const courses = await CourseHelper.generateStructuredCourseDataV1({ caraouselObject: { data_type: 'course_list' }, caraouselData: data[2], config });
    const obj = {
        name: data[0][0].name,
        link_text: 'share',
        share_message: Data.etoosSharingMessage,
        share_image_url: config.logo_path,
        faculty_details: data[0][0],
        courses: { widgets: [courses] },
        chapters: { title: 'CHAPTERS', chapters },
    };
    // obj.button = getButtonObj();
    obj.button = {};
    obj.button.button_text = (paymentCardState.isVip) ? 'Check your plan' : 'BUY NOW';
    obj.button.action = {};
    obj.button.action.type = 'button';
    obj.button.action.action_activity = 'payment_page';
    obj.button.data = {};
    obj.button.data.variant_id = paymentCardState.variantId;
    obj.button.data.event_name = (paymentCardState.isTrial) ? 'trial' : 'vip';
    obj.button.action.action_data = {
        faculty_id: obj.faculty_details.id,
    };
    obj.courses.widgets[0].data.title = 'COURSES';
    obj.faculty_details.image_url = obj.faculty_details.demo_image_url;
    obj.faculty_details.page = 'E_FACULTY';
    obj.faculty_details.video_title = 'Start watching';
    obj.faculty_details.students = `${data[3].subs} students`;
    obj.faculty_details.subject_course = `${obj.chapters.chapters[0].subject}-${data[4][0].display_name}`;
    obj.faculty_details.degree_college = `${obj.faculty_details.degree_obtained}-${obj.faculty_details.college}`;
    return obj;
}

module.exports = {
    getCaraouselData,
    getPaymentCardState,
    generateFacultyDetails,
    getLiveSection,
    getSubjectFilters,
    generateFacultyGridData,
    generateSyllabusData,
    // generateCoursesData,
    // mapData,
    // getBarColor,
};
