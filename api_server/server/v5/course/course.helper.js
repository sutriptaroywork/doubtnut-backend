/* eslint-disable no-await-in-loop */
const moment = require('moment');
const _ = require('lodash');
const LiveclassHelper = require('../../helpers/liveclass');
const StructuredCourse = require('../../../modules/mysql/eStructuredCourse');
const Liveclass = require('../../../modules/mysql/liveclass');
const CourseContainer = require('../../../modules/containers/course');
const LiveclassData = require('../../../data/liveclass.data');
const CourseHelper = require('../../helpers/course');
// const CourseMysql = require('../../../modules/mysql/course');
const CourseContainerV2 = require('../../../modules/containers/coursev2');

function getHomePageFilter(subFilterData, filterData, showSubFilter) {
    const obj = [];
    const items = [];
    if (showSubFilter) {
        for (let i = 0; i < subFilterData.length; i++) {
            items.push({ filter_id: subFilterData[i].course_type, text: LiveclassData.getCourseText(subFilterData[i].course_type) });
        }
        obj.push({
            type: 'course_type_filter',
            data: {
                items,
            },
        });
    }
    return obj;
}

function getClassesFilter(ecmClasses, actualClass) {
    const classItems = [];
    if (actualClass) classItems.push({ filter_id: parseInt(actualClass), text: `Courses for Class ${actualClass}` });
    ecmClasses.forEach((e) => {
        if (e.class != actualClass) classItems.push({ filter_id: e.class, text: `Courses for Class ${e.class}` });
    });
    if (actualClass && classItems[0].filter_id != actualClass) {
        classItems.reverse();
    }

    const obj = {
        type: 'class_filters',
        data: {
            items: classItems,
        },
    };
    return obj;
}

function topicWidget(resourceList) {
    const topicList = [];
    let k = 1;
    for (let i = 0; i < resourceList.length; i++) {
        const topics = resourceList[i].topic.split('|');
        for (let j = 0; j < topics.length; j++) {
            if (topics[j] && !(resourceList[i].resource_type === 4 && !resourceList[i].is_active && moment().add(5, 'hours').add(30, 'minutes').isAfter(resourceList[i].live_at))) {
                topicList.push(`${k++}. ${topics[j].trim()}`);
            }
        }
    }
    const obj = {
        type: 'topic_list',
        data: {
            title: 'Topics Covered',
            items: topicList,
        },
    };
    return obj;
}

function getTrialButton(paymentCardState, paymentCardStateV2, categoryID, courseType, ref, pageType) {
    const paymentDetails = {
        page_ref: ref,
        category_id: categoryID,
        page_type: pageType,
    };
    let { isVip } = paymentCardState;
    let { isTrial } = paymentCardState;
    if (paymentCardStateV2) {
        isVip = (paymentCardState.isVip || paymentCardStateV2.isVip);
        isTrial = (paymentCardState.isTrial || paymentCardStateV2.isTrial);
    }
    const obj = {
        type: 'button',
        action: {
            action_activity: 'payment_page',
            action_data: {
                page_type: isVip ? 'my' : 'buy',
                category_id: categoryID,
                course_type: courseType,
                payment_details: JSON.stringify(paymentDetails),
            },
        },
        button_text: isVip ? 'Check your plan' : 'BUY NOW',
        variant_id: paymentCardState.variantId,
        event_name: isTrial ? 'trial' : 'vip',
    };
    return obj;
}

async function getSubjectFilters(db, courseID) {
    try {
        const subList = await Liveclass.getSubjectsList(db.mysql.read, courseID);
        const subReturn = [];
        subReturn.push({
            filter_id: 'ALL',
            color: LiveclassHelper.getBarColorHomepage('ALL'),
        });
        for (let i = 0; i < subList.length; i++) {
            if (subList[i].subject !== 'ALL') {
                subReturn.push({
                    filter_id: subList[i].subject, color: LiveclassHelper.getBarColorHomepage(subList[i].subject.toUpperCase()),
                });
            }
        }
        return {
            type: 'subject_filters',
            data: {
                items: subReturn,
            },
        };
    } catch (e) {
        throw new Error(e);
    }
}

function getSubjectFiltersByEcm(db, ecmId, studentClass, course) {
    return CourseContainerV2.getSubjectFiltersByEcm(db, ecmId, studentClass, course);
}

function getCourseInfo(courseDetail, config) {
    const obj = {
        type: 'course_info',
        data: {
            title: courseDetail[0].title ? courseDetail[0].title : '',
            description: LiveclassData.getDescriptionByCourseId(courseDetail[0].id),
            link: '', // 'What Will I Learn?',

        },
    };
    if (courseDetail[0].intro_video) {
        obj.data.demo_button = {
            id: courseDetail[0].intro_video,
            player_type: 'video',
            state: 2,
            page: 'COURSE_DETAIL',
            text: 'Watch Demo Video',
            text_color: '#ff4001',
            icon: `${config.staticCDN}liveclass/Play_Button.png`,
        };
    }
    if (courseDetail[0].timetable) {
        obj.data.timetable_button = {
            text: 'View my Time Table',
            icon: `${config.staticCDN}liveclass/Calendar.png`,
            text_color: '#54138a',
            bg_color: '#e0eaff',
            deeplink: `doubtnutapp://time_table?course_id=${courseDetail[0].id}`,
        };
    }
    return obj;
}

async function getCoursePageResponse({
    paymentCardState,
    db,
    config,
    data,
    versionCode,
}) {
    const today = [];
    const tomorrow = [];
    for (let i = 0; i < data.length; i++) {
        data[i].resource_reference = data[i].id;
        if (data[i].is_replay !== 1) {
            const o = LiveclassHelper.generateStreamObjectResourcePage(data[i], db, config, paymentCardState.isVip, 'COURSE_DETAIL', 'detail');
            const tod = moment().startOf('day');
            o.diff = tod.diff(moment(data[i].live_at, 'DD-MM-YYYY'), 'days') + 1;
            o.title2 = `By ${data[i].faculty_name ? data[i].faculty_name.toUpperCase() : LiveclassData.liveclassDefaultFaculty} ${data[i].degree_obtained ? `,${data[i].degree_obtained}` : ''}`;
            if (versionCode > 862) {
                o.button = {
                    deeplink: `doubtnutapp://course_details?id=${o.id}`,
                };
            } else {
                o.button = {
                    action: {
                        action_data: {
                            id: o.id,
                        },
                    },
                };
            }
            if (!o.is_live) {
                o.button_state = 'notify_me';
                o.button.text = 'Notify Me';
            }
            o.deeplink = `doubtnutapp://course_details?id=${o.id}`;
            if (o.diff === 1) {
                if (_.isNull(data[i].is_active) && data[i].resource_type !== 8) {
                    today.push(o);
                } else if (!((moment(data[i].live_at) < moment().add(5, 'hours').add(30, 'minutes')) && data[i].is_active == 0) && data[i].resource_type !== 8) {
                    today.push(o);
                }
            } else if (o.diff === 0) {
                tomorrow.push(o);
            }
        }
    }
    const obj = {};
    if (today.length || tomorrow.length) {
        obj.type = 'course_page_carousel';
        obj.data = {
            title: 'Live And Upcoming Lectures',
            is_resource_page: false,
            filters: [
                {
                    id: 'Today',
                    title: 'Today',
                    list: today,
                },
                {
                    id: 'Tomorrow',
                    title: 'Tomorrow',
                    list: tomorrow,
                },
            ],
        };
    }
    return obj;
}

async function getResourcePageResponse({
    resourceList,
    resourceListVideo,
    db,
    config,
    paymentCardState,
    versionCode,
}) {
    const widgets = [];
    const gridData = [];
    for (let i = 0; i < resourceListVideo.length; i++) {
        const obj = LiveclassHelper.generateStreamObjectResourcePage(resourceListVideo[i], db, config, paymentCardState.isVip, 'COURSE_RESOURCE', 'detail');
        if (moment().add(5, 'hours').add(30, 'minutes').isAfter(resourceListVideo[i].live_at)) {
            obj.top_title = LiveclassHelper.getLiveclassStatusRecorded(resourceListVideo[i].live_at);
            obj.button = {
                text: LiveclassData.notifyButtonText,
            };
            if (versionCode > 866) {
                obj.button.deeplink = `doubtnutapp://course_details?id=${obj.id}`;
            } else {
                obj.button.action = {
                    action_data: {
                        id: obj.id,
                    },
                };
            }
            obj.deeplink = `doubtnutapp://course_details?id=${obj.id}`;
        } else {
            obj.button_state = 'notify_me';
        }
        if (!(resourceListVideo[i].resource_type === 4 && resourceListVideo[i].player_type === 'liveclass' && resourceListVideo[i].is_active === 0 && moment().add(5, 'hours').add(30, 'minutes').isAfter(resourceList[0].live_at))) {
            gridData.push(obj);
        }
    }

    if (moment().add(5, 'hours').add(30, 'minutes').isBefore(resourceList[0].live_at)) {
        gridData[0].image_bg_card = `${config.staticCDN}liveclass/UPCOMING_LBG_HOME.png`;
        widgets.push({ type: 'resource_page_upcoming', data: gridData[0] });
        widgets[0].data.is_resource_page = true;
        widgets[0].data.title = resourceList[0].chapter;
        widgets.push(topicWidget(resourceListVideo));
        widgets.push({
            type: 'resource_page_notify',
            data: {
                title: gridData[0].top_title,
                button_text: 'Notify Me',
                bottom_title: gridData[0].bottom_title,
            },
        });
    } else {
        const filters = [
            {
                id: 'Today',
                title: 'Today',
                list: gridData,
            },
            {
                id: 'Tomorrow',
                title: 'Tomorrow',
                list: [],
            },
        ];
        widgets.push({
            type: 'course_page_carousel',
            data: {
                filters, show_full_screen: true, is_resource_page: true, title: resourceList[0].chapter,
            },
        });
        widgets.push(topicWidget(resourceListVideo));
    }
    return widgets;
}

async function getResourcePageResponseForRecorded({
    resourceList,
    db,
    config,
    paymentCardState,
    versionCode,
}) {
    const widgets = [];
    const gridData = [];
    for (let i = 0; i < resourceList.length; i++) {
        const obj = {
            id: resourceList[i].resource_reference,
            top_title: 'Recorded',
            image_url: resourceList[i].image_bg_liveclass,
            subject: `${resourceList[i].subject}, CLASS ${resourceList[i].class}`,
            topic: resourceList[i].subject,
            video_thumbnail: resourceList[i].video_thumbnail,
            color: LiveclassHelper.getBarColorHomepage(resourceList[i].subject),
            is_live: false,
            player_type: 'video',
            page: 'COURSE_RESOURCE',
            image_bg_card: `${config.staticCDN}liveclass/${resourceList[i].subject}_LBG_HOME.png`,
            is_premium: false,
            is_vip: paymentCardState.isVip,
            bottom_title: '',
            title1: resourceList[i].chapter,
            title2: resourceList[i].mapped_faculty_name,
            // eslint-disable-next-line no-await-in-loop
            students: `${(await CourseContainer.getRandomSubsViews({
                db,
                type: 'liveclass_course',
                id: resourceList[i].id,
            })).subs} students`,
            interested: '20000 INTERESTED',
            button_state: 'demo_video',
            button: {
                text: 'WATCH DEMO VIDEO',
                button_image: `${config.staticCDN}liveclass/Play_Button.png`,
            },
        };
        if (versionCode > 866) {
            obj.button.deeplink = `doubtnutapp://course_details?id=${resourceList[i].resource_reference}`;
        } else {
            obj.action = {
                action_data: {
                    id: resourceList[i].resource_reference,
                },
            };
        }
        obj.deeplink = `doubtnutapp://course_details?id=${obj.id}`;
        gridData.push(obj);
    }
    const filters = [
        {
            id: 'Today',
            title: 'Today',
            list: gridData,
        },
        {
            id: 'Tomorrow',
            title: 'Tomorrow',
            list: [],
        },
    ];
    widgets.push({
        type: 'course_page_carousel',
        data: {
            filters, show_full_screen: true, is_resource_page: true, title: resourceList[0].chapter,
        },
    });

    return widgets;
}

async function getRelatedLectures(data, config, paymentCardState, db, studentID, play, recorded = false) {
    const lectures = [];
    for (let i = 0; i < data.length; i++) {
        const o = {};
        o.id = recorded ? data[i].question_id : data[i].resource_reference;
        o.detail_id = data[i].detail_id;
        o.live_text_bg = '#cedeff';
        o.live_date = moment(data[i].live_at).format('Do MMM');
        o.is_premium = recorded ? true : (data[i].is_free == 0);
        o.is_vip = paymentCardState.isVip;
        const payDetails = {
            page_ref: 'detail',
            category_id: !recorded ? data[i].category_id : 1,
            course_type: !recorded ? data[i].course_type : 'vod',
        };
        o.payment_details = JSON.stringify(payDetails);
        if (data[i].resource_type == 9) {
            const mockTestDetails = await StructuredCourse.getMockTestDetails(data[i].resource_reference, studentID, db.mysql.read);
            o.subject = 'TEST';
            o.subject_color = LiveclassHelper.getBarColorHomepage(o.subject);
            o.image_url = `${config.staticCDN}liveclass/Exam_upcoming_3x.png`;
            o.type = 'mock-test';
            o.title = `${mockTestDetails[0].no_of_questions} Questions`;
            o.link = 'Start Exam';
            o.is_live = moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at);
            o.state = o.is_live ? 1 : 0;
            o.live_at = moment(data[i].live_at).unix() * 1000;
            o.is_last_resource = play;
            data[i].duration = parseInt(mockTestDetails[0].duration_in_min) * 60;
        } else {
            o.image_url = `${config.staticCDN}liveclass/Play_Button.png`;
            o.subject = data[i].subject;
            o.subject_color = LiveclassHelper.getBarColorHomepage(o.subject);
            o.title = data[i].chapter;
            o.subtitle = recorded ? `${data[i].mapped_faculty_name}` : `by ${data[i].mapped_faculty_name}, ${data[i].degree ? data[i].degree : ''}`;
            o.topics = recorded ? '' : `Topics: ${data[i].topic}`;
            o.is_live = !!recorded;
            o.live_at = moment(data[i].live_at).unix() * 1000;
            o.type = 'lecture';
            o.resource_reference = data[i].resource_reference;
            o.player_type = data[i].player_type ? data[i].player_type : 'video';
            o.is_last_resource = play;
            if (!play) {
                o.deeplink = `doubtnutapp://resource?id=${data[i].detail_id}&recorded=0`;
            }
            o.page = 'COURSE_RESOURCE';
            o.past = true;
            o.state = 2;
            const hr = Math.floor(data[i].duration / 3600);
            const mins = Math.floor((data[i].duration % 3600) / 60);
            o.duration = data[i].duration ? `${hr > 0 ? `${hr} hr` : ''}${mins > 0 ? `${mins} mins` : ''}` : '';
            if (data[i].resource_type === 4 && data[i].player_type === 'liveclass') {
                o.is_live = data[i].is_active === 0 && moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at);
                if (data[i].is_active === 1) {
                    o.is_live = true;
                    o.past = false;
                    o.topics = 'Now Playing';
                }
            }

            if (data[i].resource_type == 1 && data[i].player_type === 'livevideo') {
                if (moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at) && data[i].is_active) {
                    o.is_live = true;
                    o.state = 1;
                } else if (moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at) && !data[i].is_active) {
                    o.is_live = false;
                    o.player_type = 'video';
                }
            }
            if (data[i].resource_type === 1 && data[i].player_type === 'youtube' && !_.isNull(data[i].meta_info)) {
                o.id = data[i].meta_info;
                o.player_type = 'video';
            }

            if (moment().add(5, 'hours').add(30, 'minutes').isBefore(data[i].live_at)) {
                o.state = 0;
                o.image_url = `${config.staticCDN}liveclass/Play_Grey.png`;
                o.live_text = LiveclassHelper.getLiveclassStatus(data[i].live_at);
                o.reminderLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${data[i].topic}&dates=${moment(data[i].live_at).subtract(5, 'hours').subtract(30, 'minutes').format('YYYYMMDDTHHmmSS')}Z/${moment(data[i].live_at).subtract(5, 'hours').subtract(30, 'minutes').add(1, 'hours')
                    .format('YYYYMMDDTHHmmSS')}Z&sf=true&output=xml`;
                o.duration = '';
                o.live_date = '';
            }
        }
        if (!(data[i].resource_type === 4 && !data[i].is_active && moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at))) {
            lectures.push(o);
        }
    }
    return lectures;
}

function getNotesData(resourceListNotes, paymentCardState, recorded = false) {
    const notes = [];
    for (let i = 0; i < resourceListNotes.length; i++) {
        const payDetails = {
            page_ref: 'detail',
            category_id: !recorded ? resourceListNotes[i].category_id : 1,
            course_type: !recorded ? resourceListNotes[i].course_type : 'vod',
        };

        notes.push({
            resource_type: 2,
            title: 'PDF',
            text: `${resourceListNotes[i].subject}, ${resourceListNotes[i].topic}`,
            link: recorded ? resourceListNotes[i].resource_location : resourceListNotes[i].resource_reference,
            resource_location: resourceListNotes[i].resource_location,
            is_premium: !resourceListNotes[i].is_free,
            is_vip: paymentCardState.isVip,
            subject: resourceListNotes[i].subject,
            master_chapter: resourceListNotes[i].master_chapter,
            payment_details: JSON.stringify(payDetails),
        });
    }
    return notes;
}

function getTopicsData(data) {
    const topics = [];
    for (let i = 0; i < data.length; i++) {
        const obj = CourseHelper.generateTopicObject(data[i], true);
        topics.push(obj);
    }
    return topics;
}

async function generateCourseDetailData(data) {
    const {
        db,
        caraouselData,
        subject,
        paymentCardState,
        promo,
        res,
        config,
        studentClass,
        widgetTitle,
        versionCode,
    } = data;
    let sub = subject;
    if (subject === 'ALL') sub = 0;
    let result = [];
    if (!promo) {
        let [
            resultPast,
            // eslint-disable-next-line prefer-const
            resultUpcoming,
        ] = await Promise.all([
            CourseContainerV2.getLiveSectionPastAndLive(db, caraouselData.id, caraouselData.course_type, sub, studentClass),
            CourseContainerV2.getLiveSectionUpcoming(db, caraouselData.id, caraouselData.course_type, sub, studentClass),
        ]);
        resultPast = resultPast.reverse();
        result = [...resultPast, ...resultUpcoming];
    } else {
        result = res;
    }

    const past = []; const upcoming = [];

    for (let i = 0; i < result.length; i++) {
        const o = LiveclassHelper.generateStreamObjectResourcePage(result[i], db, config, paymentCardState.isVip, 'COURSE_LANDING', 'home');
        o.button = {
            text: promo ? LiveclassData.resourcePageButtonText : LiveclassData.freeClassButtonText,
        };
        if (versionCode > 866) {
            o.button.deeplink = `doubtnutapp://course_details?id=${promo ? result[i].detail_id : caraouselData.id}`;
        } else {
            o.button.action = {
                action_data: {
                    id: promo ? result[i].detail_id : caraouselData.id,
                },
            };
        }
        o.deeplink = `doubtnutapp://course_details?id=${o.id}`;
        if (moment().add(5, 'hours').add(30, 'minutes').isAfter(result[i].live_at)) {
            o.show_reminder = false;
            o.button_state = promo ? 'chapter' : 'multiple';
            if (!(result[i].resource_type === 4 && !result[i].is_active && moment().add(5, 'hours').add(30, 'minutes').isAfter(result[i].live_at))) {
                past.push(o);
            }
        } else {
            o.show_reminder = true;
            o.button_state = promo ? 'chapter' : 'multiple';
            upcoming.push(o);
        }
    }
    const dataToReturn = {
        type: 'course_page_carousel',
        action: {
            action_activity: '',
            action_data: {
                ecm_id: null,
            },
        },
        data: {
            title: widgetTitle || caraouselData.image_title,
            subtitle: widgetTitle ? '' : caraouselData.image_subtitle,
            link_text: 'View All',
            id: caraouselData.id,
            hide_tab: !!promo,
            logo: caraouselData.is_free || promo ? '' : `${config.staticCDN}liveclass/VIP_ICON.png`,
            widget_bg_color: '#e0eaff',
            filters: [],
            is_resource_page: false,
        },
    };

    if (!promo) {
        dataToReturn.data.filters = [
            {
                id: 'Past',
                title: 'Past',
                list: past.reverse(),
            },
            {
                id: 'Upcoming',
                title: 'Upcoming',
                list: upcoming,
            },
        ];
    } else {
        const list = [...upcoming, ...past];
        dataToReturn.data.filters = [
            {
                id: 'Upcoming',
                title: '',
                list,
            },
            {
                id: 'Past',
                title: 'Past',
                list: [],
            },
        ];
    }

    return dataToReturn;
}

function generateSyllabusData(caraouselList) {
    const result = [];
    for (let i = 0; i < caraouselList.length; i++) {
        const o = CourseHelper.generateTopicObject(caraouselList[i], false);
        o.video_count = o.lecture_count;
        o.deeplink = `doubtnutapp://resource?id=${caraouselList[i].detail_id}&recorded=1`;
        result.push(o);
    }
    const obj = {
        type: 'course_syllabus',
        data: {
            title: 'Complete Syllabus',
            items: result,
        },
    };
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
        courseFilter,
        ecmClasses,
        categoryID,
        boardList,
        courseClass,
        studentPackageList,
        studentID,
        paymentCardStateV2,
        versionCode,
    } = data;
    let { ecmId } = data;
    try {
        const caraouselData = [];

        if (courseFilter === 'vod') {
            for (let i = 0; i < caraouselList.length; i++) {
                if (caraouselList[i].type === 'PAYMENT') {
                    // caraouselData.push(generatePaymentCard(data));
                } else if (caraouselList[i].type === 'SYLLABUS') {
                    const syllabusData = await CourseContainer.getAllMasterChaptersEtoosV1(db, ecmId, courseClass, subject);
                    if (paymentCardState.isTrial || !paymentCardState.isVip) {
                        caraouselData.push(LiveclassData.getSalesBannerByEcm(paymentCardState, categoryID, courseFilter, config, { data_type: 'promo_list' }, 1, studentID));
                    }
                    caraouselData.push(await getSubjectFiltersByEcm(db, ecmId, studentClass, courseFilter));
                    caraouselData.push(generateSyllabusData(syllabusData));
                } else if (caraouselList[i].type === 'PROMO_LIST') {
                    caraouselData.push(LiveclassData.getBannerByEcm(ecmId, courseFilter, config, caraouselList[i]));
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
                } else if (caraouselList[i].type === 'CLASS_FILTER') {
                    caraouselData.push(getClassesFilter(ecmClasses, studentClass));
                }
            }
        } else if (courseFilter === 'course') {
            let ecmArray = [];
            if (categoryID !== 1) {
                boardList.forEach((e) => ecmArray.push(e.id));
            } else {
                ecmArray = [ecmId];
            }
            ecmArray = _.sortBy(ecmArray);
            ecmId = ecmArray;
            const courseData = await CourseContainer.getAllStructuredCourseV2({
                db, ecmId, studentClass, subject: 'ALL',
            });
            for (let i = 0; i < caraouselList.length; i++) {
                if (caraouselList[i].type === 'PAYMENT') {
                    // caraouselData.push(generatePaymentCard(data));
                } else if (caraouselList[i].type === 'STRUCTURED_COURSE' && studentID) {
                    if (categoryID != 1) {
                        const id = 2;
                        caraouselData.push(LiveclassData.getSalesBannerByEcm(paymentCardState, categoryID, courseFilter, config, { data_type: 'promo_list' }, id, studentID));
                    }
                    if (courseData.length > 0) {
                        caraouselData.push(CourseHelper.generateStructuredCourseDataV2({
                            db,
                            caraouselObject: caraouselList[i],
                            caraouselData: courseData,
                            config,
                        }));
                    }
                    if ((paymentCardStateV2.isTrial || !paymentCardStateV2.isVip) && categoryID === 1) {
                        const id = 1;
                        caraouselData.push(LiveclassData.getSalesBannerByEcm(paymentCardStateV2, categoryID, courseFilter, config, { data_type: 'promo_list' }, id, studentID));
                    }
                } else if (caraouselList[i].type === 'COURSE_DETAIL') {
                    if (courseData.length > 0) {
                        for (let j = 0; j < courseData.length; j++) {
                            if (courseData[j].id !== 9 && courseData[j].id !== 10) {
                                const paymentState = CourseHelper.getPaymentCardStateV2({
                                    data: studentPackageList,
                                    courseType: courseFilter,
                                    categoryID: courseData[j].category_id,
                                });
                                caraouselData.push(await generateCourseDetailData({
                                    db,
                                    caraouselObject: caraouselList[i],
                                    caraouselData: courseData[j],
                                    config,
                                    subject,
                                    paymentCardState: paymentState,
                                    promo: false,
                                    studentClass,
                                    categoryID,
                                    versionCode,
                                }));
                            }
                        }
                    }
                } else if (caraouselList[i].type === 'TRENDING_LECTURES') {
                    const trending = await Liveclass.getTrendingLectures(db.mysql.read, ecmId, subject === 'ALL' ? 0 : subject, studentClass);
                    if (trending.length > 0) {
                        caraouselData.push(generateCourseDetailData({
                            db,
                            caraouselObject: caraouselList[i],
                            caraouselData: courseData[0],
                            config,
                            subject,
                            paymentCardState,
                            promo: true,
                            studentClass,
                            res: trending,
                            widgetTitle: caraouselList[i].title,
                            versionCode,
                        }));
                    }
                } else if (caraouselList[i].type === 'PROMO_LIST') {
                    const bannerEcm = categoryID !== 1 ? (_.includes(ecmId, 22) ? 3 : 0) : ecmId[0];
                    caraouselData.push(LiveclassData.getBannerByEcm(bannerEcm, courseFilter, config, caraouselList[i]));
                    caraouselData.push(await getSubjectFiltersByEcm(db, ecmId, studentClass, courseFilter));
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

function sortTabs(tabs) {
    tabs.sort((item1, item2) => {
        if (+item1.sortKey > +item2.sortKey || item1.sortKey === 'IIT JEE') {
            return -1;
        }
        if (+item1.sortKey < +item2.sortKey || item2.sortKey === 'IIT JEE') {
            return 1;
        }
        return 0;
    });
    return tabs;
}

async function generateAssortmentObjects(coursesArray, db, config, studentId, studentLocale, studentCourseOrClassSubcriptionDetails) {
    const promises = [];
    const paidAssortments = coursesArray.map((item) => item.assortment_id);
    const userAssortmentPaymentState = studentCourseOrClassSubcriptionDetails ? studentCourseOrClassSubcriptionDetails.reduce((acc, item) => ({
        ...acc,
        [item.assortment_id]: {
            isTrial: item.amount === -1,
            isVip: item.amount !== -1 && moment().add(5, 'hours').add(30, 'minutes').isBefore(moment(item.end_date)),
            timeLeft: moment(item.end_date).diff(new Date(), 'hours'),
            isExpired: moment().add(5, 'hours').add(30, 'minutes').isAfter(moment(item.end_date)),
        },
    }), {}) : {};
    const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, paidAssortments, studentId || '');
    for (let i = 0; i < coursesArray.length; i++) {
        const paymentCardState = userAssortmentPaymentState[coursesArray[i].assortment_id] ? userAssortmentPaymentState[coursesArray[i].assortment_id] : {
            isTrial: false,
            isVip: false,
        };
        const subscriptionDetails = _.find(studentCourseOrClassSubcriptionDetails, ['assortment_id', coursesArray[i].assortment_id]);
        if (subscriptionDetails) {
            coursesArray[i].subscription_start_date = subscriptionDetails.start_date;
            coursesArray[i].subscription_end_date = subscriptionDetails.end_date;
        }
        promises.push(CourseHelper.generateAssortmentObject({
            data: coursesArray[i],
            config,
            paymentCardState,
            assortmentPriceMapping,
            db,
            setWidth: true,
            versionCode: 853,
            assortmentFlagrResponse: {},
            locale: studentLocale,
            studentId,
        }));
    }
    const objects = await Promise.all(promises);
    return objects;
}

async function generateCarouselDualFiltersForWeb(data, groupBy, db, config, studentId, studentLocale, studentCourseOrClassSubcriptionDetails) {
    const groupedData = _.groupBy(data, 'course_lang');
    const popularCourses = {};
    let primaryTabs = [];
    for (const key in groupedData) {
        if (groupedData[key]) {
            const groupedByClass = _.groupBy(groupedData[key], groupBy);
            const items = {};
            let secondaryTabs = [];
            for (const innerKey in groupedByClass) {
                if (groupedByClass[innerKey]) {
                    let filterKey = '';
                    groupedByClass[innerKey].splice(5);
                    if (groupBy === 'class') {
                        // eslint-disable-next-line no-await-in-loop
                        items[`${studentLocale === 'hi' ? 'कक्षा' : 'Class'} ${innerKey}`] = await generateAssortmentObjects(groupedByClass[innerKey], db, config, studentId, studentLocale, studentCourseOrClassSubcriptionDetails);
                        filterKey = `${studentLocale === 'hi' ? 'कक्षा' : 'Class'} ${innerKey}`;
                    } else if (groupBy === 'category') {
                        // eslint-disable-next-line no-await-in-loop
                        items[`${innerKey}`] = await generateAssortmentObjects(groupedByClass[innerKey], db, config, studentId, studentLocale, studentCourseOrClassSubcriptionDetails);
                        filterKey = `${innerKey}`;
                    }
                    secondaryTabs.push({
                        key: filterKey,
                        title: filterKey,
                        sortKey: innerKey,
                        is_selected: false,
                    });
                }
            }
            secondaryTabs = sortTabs(secondaryTabs);
            secondaryTabs = secondaryTabs.map((item) => {
                if (item.key === 'Class 12' || item.key === 'कक्षा 12' || item.key === 'IIT JEE') {
                    item.is_selected = true;
                }
                delete item.sortKey;
                return item;
            });
            if (key === 'HINDI') {
                popularCourses['हिंदी'] = {
                    items,
                    secondary_tabs: secondaryTabs,
                };
            } else {
                popularCourses.En = {
                    items,
                    secondary_tabs: secondaryTabs,
                };
            }
            primaryTabs.push({
                key: key === 'HINDI' ? 'हिंदी' : 'En',
                title: key === 'HINDI' ? 'हिंदी' : 'En',
                is_selected: false,
            });
        }
    }
    primaryTabs = primaryTabs.map((item) => {
        if (item.key === 'En') {
            item.is_selected = true;
        }
        return item;
    }).sort((item1, item2) => {
        if (item1.key === 'En') {
            return -1;
        }
        if (item2.key === 'En') {
            return 1;
        }
        return 0;
    });
    primaryTabs = _.uniqBy(primaryTabs, 'key');
    popularCourses.primary_tabs = primaryTabs;
    return {
        type: 'widget_dual_filters',
        data: {
            title: groupBy === 'class' ? 'Online Classes' : 'Popular Exam Online Classes',
            items: popularCourses,
            button: {
                deeplink: 'doubtnutapp://course_category?category_id=xxxx&title=Apke liye Courses',
                text: 'See All Courses',
            },
        },
    };
}

async function getCourseCarouselsWeb(data) {
    const {
        db,
        studentID: studentId,
        studentClass,
        locale: studentLocale,
        xAuthToken,
        config,
    } = data;
    let { versionCode } = data;
    if (versionCode < 893) versionCode = 893;
    let studentCourseOrClassSubcriptionDetails;
    const userCourseCarousels = [];
    if (studentId) {
        const studentSubscriptionDetails = await CourseContainerV2.getUserActivePackages(db, studentId);
        studentCourseOrClassSubcriptionDetails = studentSubscriptionDetails.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject'));
        const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
        let expiredPackages = await CourseContainerV2.getUserExpiredPackages(db, studentId);
        expiredPackages = expiredPackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject') && today.diff(moment(item.end_date), 'days') <= 30);
        expiredPackages = expiredPackages.filter((item) => !_.find(studentCourseOrClassSubcriptionDetails, ['assortment_id', item.assortment_id]));
        studentCourseOrClassSubcriptionDetails = [...studentCourseOrClassSubcriptionDetails, ...expiredPackages];
        studentCourseOrClassSubcriptionDetails = studentCourseOrClassSubcriptionDetails.filter((item) => item.assortment_id !== 138829); // * Filter kota classes packages
        if (studentCourseOrClassSubcriptionDetails.length) {
            const myCoursesCarousel = await CourseHelper.getUserCoursesCarousel({
                db,
                studentId,
                studentClass,
                studentLocale,
                xAuthToken,
                studentCourseOrClassSubcriptionDetails,
                versionCode,
                setWidth: true,
                config,
                coursePage: 'MY_COURSES',
            });
            userCourseCarousels.push({
                data: {
                    title: studentLocale === 'hi' ? 'मेरे कोर्स' : 'My Courses',
                    items: myCoursesCarousel.filter(Boolean),
                    background_color: '#fafafa',
                },
                widget_type: 'widget_my_courses',
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                },
            });
        }
    }
    const paidCourses = await CourseContainerV2.getCoursesForHomepageWeb(db);
    const topBestSellers = paidCourses.slice(0, 5);
    const topBestSellersCarousel = await generateAssortmentObjects(topBestSellers, db, config, studentId, studentLocale, studentCourseOrClassSubcriptionDetails);
    userCourseCarousels.push({
        type: 'widget_parent',
        data: {
            title: 'Today\'s Bestsellers',
            items: topBestSellersCarousel,
        },
    });
    const filterExamCourses = paidCourses.filter((item) => ['IIT JEE', 'NEET'].includes(item.category));
    const examCourses = filterExamCourses.reduce((acc, item) => {
        const index = acc.findIndex((course) => course.assortment_id === item.assortment_id);
        if (index === -1) {
            acc.push(item);
        }
        return acc;
    }, []);
    const liveClassCourses = await generateCarouselDualFiltersForWeb(paidCourses, 'class', db, config, studentId, studentLocale, studentCourseOrClassSubcriptionDetails);
    const popularExamCourses = await generateCarouselDualFiltersForWeb(examCourses, 'category', db, config, studentId, studentLocale, studentCourseOrClassSubcriptionDetails);
    userCourseCarousels.push(popularExamCourses);
    userCourseCarousels.push(liveClassCourses);
    return userCourseCarousels;
}

module.exports = {
    topicWidget,
    getRelatedLectures,
    getNotesData,
    getTopicsData,
    getSubjectFilters,
    getCoursePageResponse,
    getCourseInfo,
    getResourcePageResponse,
    getTrialButton,
    getHomePageFilter,
    getCaraouselData,
    getResourcePageResponseForRecorded,
    getCourseCarouselsWeb,
};
