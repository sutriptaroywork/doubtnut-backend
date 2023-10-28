/* eslint-disable no-await-in-loop */

const _ = require('lodash');
// const moment = require('moment');
const moment = require('moment');
const CourseContainer = require('../../../modules/containers/course');
const CourseMysql = require('../../../modules/mysql/course');
const Data = require('../../../data/data');
const paymentHelper = require('../../helpers/payment');
const Liveclass = require('../../../modules/mysql/liveclass');
const CourseHelper = require('../../helpers/course');
const { autoScrollTime } = require('../../../data/data');

function getPaymentCard(data, actionData = null) {
    return {
        type: 'payment_card_list',
        data: {
            items: [
                {
                    text1: Data.paymentMessage.text,
                    text2: '',
                    button_text: data.paymentCardState.message.button_text,
                    variant_id: data.paymentCardState.variantId,
                    event_name: (data.paymentCardState.isTrial) ? 'trial' : 'vip',
                    action: {
                        action_activity: 'payment_page',
                        action_data: {
                            page_type: (data.paymentCardState.isVip && data.paymentCardState.remainingDays > 5) && !data.paymentCardState.isTrial ? 'my' : 'buy',
                            category_id: data.categoryID,
                            course_type: data.courseType,
                        },
                    },
                },
            ],
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

async function getFilterData(db, studentClass, studentId, isNeet) {
    const filterData = await CourseMysql.getEcmListDataV4(db.mysql.read, studentClass);
    const obj = [];
    if (isNeet) {
        filterData.forEach((item, i) => {
            if (item.filter_id === Data.neetFilerId) {
                filterData.splice(i, 1);
                filterData.unshift(item);
            }
        });
    }
    obj.push({
        type: 'course_exam_tabs',
        data: {
            items: filterData,
        },
    });
    if (studentId && studentId % 2 === 1) {
        obj.push({
            type: 'course_type_filter',
            data: {
                items: [
                    { filter_id: 2, text: 'DAILY CLASSES' },
                    { filter_id: 1, text: 'RECORDED LECTURES' },
                ],
            },
        });
    } else {
        obj.push({
            type: 'course_type_filter',
            data: {
                items: [
                    { filter_id: 1, text: 'RECORDED LECTURES' },
                    { filter_id: 2, text: 'DAILY CLASSES' },
                ],
            },
        });
    }
    return obj;
}

function generatePaymentCard(data) {
    const {
        actionData,
    } = data;
    return getPaymentCard(data, actionData);
}

async function getSubjectFilters(db, ecmId, studentClass, actualClass) {
    const promise = [];
    promise.push(CourseMysql.getSubjectList(db.mysql.read, ecmId, studentClass));
    promise.push(Liveclass.getSubjectsListV2(db.mysql.read, ecmId));
    promise.push(CourseMysql.getClassByEcmId(db.mysql.read, ecmId));
    const filterData = await Promise.all(promise);
    filterData[1].forEach((e) => {
        if (!(filterData[1].filter((sub) => sub.subject === e.subject).length > 0)) filterData[1].push(e);
    });
    const items = [{ filter_id: 'ALL', color: getBarColor('ALL') }];
    filterData[0].forEach((e) => {
        if (e.subject !== 'ALL') items.push({ filter_id: e.subject, color: getBarColor(e.subject) });
    });

    const classItems = [];
    if (actualClass) classItems.push({ filter_id: parseInt(actualClass), text: `CLASS ${actualClass}` });
    filterData[2].forEach((e) => {
        if (e.class != actualClass) classItems.push({ filter_id: e.class, text: `CLASS ${e.class}` });
    });
    if (actualClass && classItems[0].filter_id != actualClass) {
        classItems.reverse();
    }

    const obj = [
        {
            type: 'class_filters',
            data: {
                items: classItems,
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

function getLiveclassStatus(liveAt) {
    const momentObj = moment(liveAt);
    return (momentObj.isSame(moment(), 'day')) ? `TODAY ${momentObj.format('h:mm A')}` : `LIVE AT ${momentObj.format('MMMM Do YYYY, h:mm:ss A')}`;
}

async function generateCourseDetailData(data) {
    const {
        db,
        caraouselObject,
        caraouselData,
        subject,
        paymentCardState,
        promo,
        res,
        config,
        versionCode,
        studentClass,
    } = data;
    const result = promo ? res : await Liveclass.getLiveSectionV1(db.mysql.read, caraouselData.id, caraouselData.course_type, subject, studentClass);

    const past = []; const upcoming = [];

    for (let i = 0; i < result.length; i++) {
        const o = {};
        o.id = result[i].id;
        o.detail_id = result[i].detail_id;
        o.board_name = (!_.isEmpty(result[i].board_name)) ? result[i].board_name : null;
        o.top_title = getLiveclassStatus(result[i].live_at);
        o.player_type = result[i].player_type;
        o.image_url = result[i].image_bg_liveclass;
        o.subject = result[i].subject;
        o.is_live = false;
        o.page = 'LIVECLASS';
        o.image_bg_card = `${config.staticCDN}liveclass/${result[i].subject}_LBG.png`;
        o.live_text = 'LIVE';
        o.is_premium = (result[i].is_free === 0 && versionCode > 752);
        o.is_vip = paymentCardState.isVip;
        o.title1 = result[i].topic;
        o.title2 = `By ${result[i].faculty_name ? result[i].faculty_name.toUpperCase() : ''}`;
        o.students = `${(await CourseContainer.getRandomSubsViews({
            db,
            type: 'liveclass_faculty',
            id: result[i].faculty_id,
        })).subs} registered`;
        o.color = getBarColor(result[i].subject);
        o.start_gd = '#8967ff';
        o.mid_gd = '#8967ff';
        o.end_gd = '#01235b';
        if (result[i].resource_type === 4 && result[i].player_type === 'liveclass') {
            o.is_live = (_.isNull(result[i].is_active)) ? false : !!(result[i].is_active);
            upcoming.push(o);
        }
        if (result[i].resource_type === 1 && result[i].player_type === 'livevideo') {
            o.page = 'STRUCTURED';
            if (moment().add(5, 'hours').add(30, 'minutes').isAfter(result[i].live_at) && result[i].is_active) {
                o.is_live = true;
                upcoming.push(o);
            } else if (moment().add(5, 'hours').add(30, 'minutes').isAfter(result[i].live_at) && !result[i].is_active) {
                o.is_live = false;
                o.player_type = 'video';
                past.push(o);
            } else {
                upcoming.push(o);
            }
        }
        if (result[i].resource_type === 8 && result[i].player_type === 'liveclass') {
            o.player_type = 'video';
            past.push(o);
        }
    }

    const dataToReturn = {
        type: caraouselObject.data_type,
        action: {
            action_activity: 'structured_course',
            action_data: {
                ecm_id: null,
            },
        },
        data: {
            title: caraouselData.image_title,
            subtitle: caraouselData.image_subtitle,
            link_text: 'View All',
            id: caraouselData.id,
            hide_tab: !!promo,
            filters: [],
        },
    };

    if (!promo) {
        dataToReturn.data.filters = [
            {
                id: 'Upcoming',
                title: 'Upcoming',
                list: upcoming,
            },
            {
                id: 'Past',
                title: 'Past',
                list: past,
            },
        ];
    } else {
        const list = [...upcoming, ...past];
        dataToReturn.data.filters = [
            {
                id: 'Upcoming',
                title: 'Upcoming',
                list,
            },
        ];
    }

    return dataToReturn;
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
    };
    secondaryObj.title = 'SYLLABUS';
    secondaryObj.items = caraouselData;
    obj.data = secondaryObj;
    return obj;
}

function generateBannerData({
    caraouselObject,
    config,
}) {
    const obj = {
        type: caraouselObject.data_type,
        data: {
            items: [
                {
                    image_url: `${config.staticCDN}vmc/why_vip.png`,
                    deeplink: 'doubtnutapp://vip_detail',
                },
            ],
        },
    };
    // adding auto_scroll_time_in_sec if of type promo_list
    if (caraouselObject.data_type === 'promo_list') {
        obj.data.auto_scroll_time_in_sec = autoScrollTime;
    }
    return obj;
}

async function getCaraouselData(data) {
    const {
        caraouselList,
        db,
        config,
        subject,
        studentClass,
        paymentCardState,
        page,
        courseFilter,
        actualClass,
        versionCode,
        isNeet,
        studentId,
    } = data;
    let { ecmId } = data;
    try {
        let caraouselData = [];
        if (page == 1) caraouselData = await getFilterData(db, studentClass, studentId, isNeet);

        if (courseFilter === 1) {
            for (let i = 0; i < caraouselList.length; i++) {
                if (caraouselList[i].type === 'PAYMENT') {
                    caraouselData.push(generatePaymentCard(data));
                } else if (caraouselList[i].type === 'SYLLABUS') {
                    const syllabusData = await CourseContainer.getAllMasterChaptersEtoos(db, ecmId, studentClass, subject);
                    caraouselData.push(generateSyllabusData({
                        caraouselObject: caraouselList[i],
                        caraouselData: syllabusData,
                    }));
                } else if (caraouselList[i].type === 'PROMO_LIST') {
                    caraouselData.push(generateBannerData({
                        db,
                        caraouselObject: caraouselList[i],
                        config,
                    }));
                } else if (caraouselList[i].type === 'CLASS_FILTER') {
                    const filterData = await getSubjectFilters(db, ecmId, studentClass, actualClass);
                    caraouselData.push(filterData[0]);
                    caraouselData.push(filterData[1]);
                } else if (caraouselList[i].type === 'PROMO_VIDEOS') {
                    const res = await CourseContainer.getPromoSection(db, ecmId);
                    if (res.length > 0) {
                        caraouselData.push(generateCourseDetailData({
                            db,
                            caraouselObject: caraouselList[i],
                            caraouselData: [],
                            config,
                            subject,
                            paymentCardState,
                            promo: true,
                            res,
                            versionCode,
                        }));
                    }
                }
            }
        } else if (courseFilter === 2) {
            let courseData = [];
            if (versionCode > 752) {
                ecmId = [ecmId];
                courseData = await CourseContainer.getAllStructuredCourseV2({
                    db, ecmId, studentClass, subject: 'ALL',
                });
            } else {
                courseData = await CourseContainer.getAllStructuredCourse({
                    db, ecmId, studentClass, subject: 'ALL',
                });
            }

            for (let i = 0; i < caraouselList.length; i++) {
                if (caraouselList[i].type === 'PAYMENT' && versionCode > 752) {
                    caraouselData.push(generatePaymentCard(data));
                } else if (caraouselList[i].type === 'STRUCTURED_COURSE') {
                    if (courseData.length > 0) {
                        caraouselData.push(CourseHelper.generateStructuredCourseDataV1({
                            db,
                            caraouselObject: caraouselList[i],
                            caraouselData: courseData,
                            config,
                            subject,
                            isVip: paymentCardState.isVip,
                        }));
                    }
                } else if (caraouselList[i].type === 'COURSE_DETAIL') {
                    if (courseData.length > 0) {
                        for (let j = 0; j < courseData.length; j++) {
                            const result = await Liveclass.getLiveSection(db.mysql.read, courseData[j].id, courseData[j].course_type, subject === 0 ? '0' : subject, studentClass);
                            if (result.length > 0) {
                                caraouselData.push(generateCourseDetailData({
                                    db,
                                    caraouselObject: caraouselList[i],
                                    caraouselData: courseData[j],
                                    config,
                                    subject,
                                    paymentCardState,
                                    promo: false,
                                    versionCode,
                                    studentClass,
                                }));
                            }
                        }
                    }
                } else if (caraouselList[i].type === 'CLASS_FILTER') {
                    const filterData = await getSubjectFilters(db, ecmId, studentClass, actualClass);
                    caraouselData.push(filterData[1]);
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

async function getPaymentCardState({
    data,
    flagrResponse = {},
    studentId,
    db,
    studentClass,
    ecmId,
    courseType,
}) {
    let isVip = false;
    let isTrial = false;
    let remainingDays = 0;
    const variantId = (typeof flagrResponse.variantID === 'undefined') ? '0' : flagrResponse.variantID;
    const trialDuration = (typeof flagrResponse.variantAttachment === 'undefined') ? '0' : flagrResponse.variantAttachment.trial_duration;
    let expiredTrial = false;
    let expiredVip = false;
    let packageId = null;
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
            packageId,
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
            packageId,
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
            packageId,
        };
    }

    const obj = await paymentHelper.checkVipUserBasedOnPackage(db, studentId, ecmId, studentClass, courseType);
    isVip = obj.isVip;
    packageId = obj.packageId;
    console.log(`vip ${isVip}`);
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
            packageId,
        };
    }
    // VIP member
    // console.log('vip');
    // console.log((data.length > 0));
    // console.log((momentEnd > momentNow));
    // console.log(((data.length > 0) && (momentEnd > momentNow)));
    // isVip = ((data.length > 0) && (momentEnd > momentNow));
    if (isVip) {
        return {
            message: Data.vipMessage,
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
            packageId,
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
            packageId,
        };
    }

    return {
        message: Data.vipMessage,
        isVip,
        isTrial,
        remainingDays,
        variantId,
        expiredTrial,
        expiredVip,
        packageId,
    };
}
function getPaymentCardStateV2({
    data,
    flagrResponse = {},
    courseType,
    categoryID,
}) {
    let isVip = false;
    let isTrial = false;
    let remainingDays = 0;
    let is_remaining_upated = false;
    let lastFiveDaysVip = 0;
    const variantId = (typeof flagrResponse.variantID === 'undefined') ? '0' : flagrResponse.variantID;
    const trialDuration = (typeof flagrResponse.variantAttachment === 'undefined') ? '0' : flagrResponse.variantAttachment.trial_duration;
    let expiredTrial = false;
    let expiredVip = false;
    let packageDetails = null;
    const momentNow = moment().add(5, 'hours').add(30, 'minutes');
    let noTrial = true;
    categoryID = parseInt(categoryID);
    for (let i = 0; i < data.length; i++) {
        const momentEnd = moment(data[i].end_date);
        // active pack part
        if ((data[i].category_id === categoryID) && (momentNow.isAfter(data[i].start_date)) && momentNow.isBefore(data[i].end_date) && data[i].sub_active) {
            noTrial = false;
            if (data[i].course_type == courseType) {
                if (!is_remaining_upated) {
                    remainingDays = momentEnd.diff(momentNow, 'days');
                    is_remaining_upated = true;
                }
                if (data[i].amount === -1.00) {
                    // trial user
                    isTrial = true;
                } else if (remainingDays < 5) {
                    lastFiveDaysVip = true;
                }
                isVip = true;
                expiredVip = false;
                packageDetails = data[i];
            }
            if (data[i].course_type === 'all') {
                isVip = true;
                if (!is_remaining_upated) {
                    remainingDays = momentEnd.diff(momentNow, 'days');
                    is_remaining_upated = true;
                }
                if (data[i].amount === -1.00) {
                    // trial user
                    isTrial = true;
                } else if (remainingDays < 5) {
                    lastFiveDaysVip = true;
                }
                if (_.isNull(packageDetails)) {
                    packageDetails = data[i];
                }
            }
        }
        if (data[i].amount === -1.00 && momentEnd < momentNow && (data[i].category_id === categoryID)) {
            noTrial = false;
            if (data[i].amount === -1.00) {
                expiredTrial = true;
            }
        }
        if (!isVip && data[i].amount !== -1.00 && (data[i].course_type === courseType) && (data[i].category_id === categoryID)) {
            noTrial = false;
            expiredVip = true;
            packageDetails = data[i];
        }
    }
    // never vip and trial ever
    const neverVipAndTrial = noTrial;// (data.length === 0);
    if (neverVipAndTrial) {
        return {
            message: Data.neverVipAndTrialMessageFn(trialDuration),
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
            packageDetails,
            noTrial,
        };
    }
    // trial expired and no vip
    if (expiredTrial) {
        if (lastFiveDaysVip) {
            return {
                message: Data.lastFiveDaysVipMessage(remainingDays),
                isVip: true,
                isTrial,
                remainingDays,
                variantId,
                expiredTrial,
                expiredVip,
                packageDetails,
            };
        }
        if (expiredVip) {
            return {
                message: Data.expiredVipMessage,
                isVip,
                isTrial,
                remainingDays,
                variantId,
                expiredTrial,
                expiredVip,
                packageDetails,
            };
        }
        if (isVip) {
            return {
                message: Data.vipMessage,
                isVip,
                isTrial,
                remainingDays,
                variantId,
                expiredTrial,
                expiredVip,
                packageDetails,
            };
        }
        return {
            message: Data.everTrialUsedNoVipMessage,
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
            packageDetails,
        };
    }
    // user is in Trial
    if (isTrial) {
        return {
            message: Data.trialMessage(remainingDays),
            isVip: true,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
            packageDetails,
        };
    }
    if (lastFiveDaysVip) {
        return {
            message: Data.lastFiveDaysVipMessage(remainingDays),
            isVip: true,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
            packageDetails,
        };
    }
    // VIP member
    if (isVip) {
        return {
            message: Data.vipMessage,
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
            packageDetails,
        };
    }
    // expired vip
    if (expiredVip) {
        return {
            message: Data.expiredVipMessage,
            isVip,
            isTrial,
            remainingDays,
            variantId,
            expiredTrial,
            expiredVip,
            packageDetails,
        };
    }
    return {
        message: Data.everTrialUsedNoVipMessage,
        isVip,
        isTrial,
        remainingDays,
        variantId,
        expiredTrial,
        expiredVip,
        packageDetails,
    };
}
module.exports = {
    getCaraouselData,
    getPaymentCard,
    getSubjectFilters,
    generateSyllabusData,
    getPaymentCardState,
    getPaymentCardStateV2,
};
