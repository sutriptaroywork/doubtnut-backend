/* eslint-disable prefer-const */
const _ = require('lodash');
const moment = require('moment');
const StudentCourseMapping = require('../../modules/studentCourseMapping');
const CourseHelper = require('./course');
const WidgetHelper = require('../widgets/liveclass');
const RecommendationContainer = require('../../modules/containers/recommendation');
const CourseMysql = require('../../modules/mysql/coursev2');
const CourseContainer = require('../../modules/containers/coursev2');
const liveclassData = require('../../data/liveclass.data');

function generateSampleQuestionWidget(subjectList, showOrView) {
    return {
        type: 'widget_sample_question',
        data: { image_url: subjectList[0].imageUrl, show_or_view: showOrView, deeplink: `doubtnutapp://camera?camera_crop_url=${subjectList[0].imageUrl}` },
    };
}

function generateExploreWidget(locale, courseData, pricing, nudgeData) {
    let titleMain = (locale === 'hi') ? 'आपके स्टेट के ५०००+ बच्चे पढ़ रहे इंडिया के बेस्ट टीचर्स से Doubtnut पर और आप?' : 'Aapke state ke 5000+ bachche padh rhe India ke best Teachers se Doubtnut par! And aap?';
    let nudgeCta = (locale === 'hi') ? 'आखिरी १० सीट्स बची हैं! अभी करें कोर्स ज्वाइन! अभी देखें!' : 'Last 10 seats left! Join karen course abhi!';
    let buttonTitle = (locale === 'hi') ? 'अभी देखें!!' : 'Explore Now!';
    if (nudgeData && nudgeData[0]) {
        if (nudgeData[0].display_text !== null && nudgeData[0].display_text !== '') {
            if (nudgeData[0].display_text.includes('||')) {
                titleMain = (locale === 'hi') ? nudgeData[0].display_text.split('||')[0] : nudgeData[0].display_text.split('||')[1];
            } else {
                titleMain = nudgeData[0].display_text;
            }
        }
        if (nudgeData[0].subtitle_text !== null && nudgeData[0].subtitle_text !== '') {
            if (nudgeData[0].subtitle_text.includes('||')) {
                nudgeCta = (locale === 'hi') ? nudgeData[0].subtitle_text.split('||')[0] : nudgeData[0].subtitle_text.split('||')[1];
            } else {
                nudgeCta = nudgeData[0].subtitle_text;
            }
        }
        if (nudgeData[0].optional_display_text1 !== null && nudgeData[0].optional_display_text1 !== '') {
            if (nudgeData[0].optional_display_text1.includes('||')) {
                buttonTitle = (locale === 'hi') ? nudgeData[0].optional_display_text1.split('||')[0] : nudgeData[0].optional_display_text1.split('||')[1];
            } else {
                buttonTitle = nudgeData[0].optional_display_text1;
            }
        }
    }
    return {
        type: 'widget_course_explore',
        data: {
            title: titleMain,
            course_details: {
                assortment_id: courseData.assortment_id,
                image_url: courseData.demo_video_thumbnail,
                left_title: courseData.display_name,
                secondary_title: (courseData.meta_info === 'HINDI') ? 'Hindi Medium' : 'English Medium',
                right_title: `${pricing.monthly_price}/Month`,
                deeplink: `doubtnutapp://course_details?id=${courseData.assortment_id}`,
            },
            nudge_cta_text: nudgeCta,
            button_title: buttonTitle,
            button_deeplink: 'doubtnutapp://course_explore',
        },
    };
}

async function getAutoPlayWidget(db, config, versionCode, studentId, studentClass, studentLocale, showAutoPlayWidget, showSampleQuestionWidget, checkForPersonalisation, ccmArray) {
    if (showAutoPlayWidget) {
        let ccmCourses = await CourseHelper.getCoursesFromCcmArray(db, ccmArray, studentClass, studentLocale);
        ccmCourses = ccmCourses.filter((item) => item.is_free === 1);
        const carousel = {};
        let scheduleData = await CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, studentLocale, 'live', carousel);
        if (scheduleData.length === 0) {
            scheduleData = await CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, studentLocale, 'recent', carousel);
        }
        if (scheduleData.length) {
            const widget = await WidgetHelper.homepageVideoWidgetWithAutoplay({
                data: [scheduleData[0]], paymentCardState: { isVip: false }, db, config, title: 'Live Classes', studentLocale, versionCode, pageValue: 'camerapage',
            });
            let title = (studentLocale === 'hi') ? 'Doubtnut अब आपके लिए लाया है फ्री ऑनलाइन क्लासेज!' : 'Doubtnut ab aapke liye laya hai Online Classes';
            if (showSampleQuestionWidget && showAutoPlayWidget) {
                title = 'Free Live Classes Join Kare!'; // TODO: Add hindi text
            }
            widget.title = title;
            if (widget.items) {
                return {
                    widget_data: widget,
                    widget_type: 'widget_autoplay',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                };
            }
        }
    }
    return false;
}

async function getExplorePageWidget(db, studentId, studentClass, studentLocale, xAuthToken, mappedLocale, showExplorePageWidget, checkForPersonalisation, ccmArray) {
    if (showExplorePageWidget) {
        let courseArray = [];
        if (!Array.isArray(checkForPersonalisation) || !checkForPersonalisation.length) {
            checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, studentId);
        }
        if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length) {
            ccmArray = checkForPersonalisation.map((x) => x.ccm_id);
            courseArray = checkForPersonalisation.map((x) => liveclassData.examCategoryMapping[x.course]);
        }
        const promises = [];
        promises.push(RecommendationContainer.getRecommendedCourseByCCMValues(db, ccmArray, studentClass, courseArray));
        promises.push(CourseContainer.getUserActivePackages(db, studentId));
        let [assortmentArray, userActivePackages] = await Promise.all(promises);
        const groupedByAss = _.groupBy(userActivePackages, 'assortment_id');
        if (_.isEmpty(assortmentArray)) {
            // get cbse board of user class
            assortmentArray = await CourseMysql.getCourseByParams(db.mysql.read, studentClass, 'CBSE Boards', 'BOARDS/SCHOOL/TUITION', mappedLocale);
            assortmentArray = assortmentArray.filter((item) => _.isEmpty(groupedByAss[item.assortment_id]));
            if (_.isEmpty(assortmentArray) && _.isEmpty(assortmentArray)) {
                assortmentArray = await CourseMysql.getCourseByParams(db.mysql.read, studentClass, '', 'SPOKEN ENGLISH', mappedLocale);
                assortmentArray = assortmentArray.filter((item) => _.isEmpty(groupedByAss[item.assortment_id]));
            }
        }

        // console.log('groupedByAss');
        // console.log(groupedByAss);
        const assortmentList = assortmentArray.map(((item) => item.assortment_id));
        const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
        for (let i = 0; i < assortmentArray.length; i++) {
            if (!_.isEmpty(assortmentPriceMapping[assortmentArray[i].assortment_id])) {
                return generateExploreWidget(studentLocale, assortmentArray[i], assortmentPriceMapping[assortmentArray[i].assortment_id], null);
            }
        }
    }
    return false;
}

async function getCameraBackWidgets({
    db,
    config,
    studentId,
    studentClass,
    studentLocale,
    openCount,
    questionAskCount,
    bottomOverlayData,
    versionCode,
    mappedLocale,
    xAuthToken,
}) {
    try {
        // console.log('inside widget');
        // console.log(openCount);
        // console.log(questionAskCount);
        let cameraBackWidgetList = [];
        let showSampleQuestionWidget = false;
        let showAutoPlayWidget = false;
        let showExplorePageWidget = false;
        let showOrView = false;
        if (+openCount === 1 && +questionAskCount === 0) {
            showSampleQuestionWidget = true;
        }
        if (+openCount === 2) {
            if (+questionAskCount === 0) {
                showSampleQuestionWidget = true;
                showOrView = true;
            }
            showAutoPlayWidget = true;
        }
        if (+openCount === 3) {
            showExplorePageWidget = true;
        }
        if (showSampleQuestionWidget && !_.isEmpty(bottomOverlayData.subjectList)) {
            cameraBackWidgetList.push(generateSampleQuestionWidget(bottomOverlayData.subjectList, showOrView));
        }

        let checkForPersonalisation = [];
        let ccmArray = [];
        if (showAutoPlayWidget || showExplorePageWidget) {
            checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, studentId);
            if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length) {
                ccmArray = checkForPersonalisation.map((x) => x.ccm_id);
            }
        }
        const widgetPromises = [];
        widgetPromises.push(getAutoPlayWidget(db, config, versionCode, studentId, studentClass, studentLocale, showAutoPlayWidget, showSampleQuestionWidget, checkForPersonalisation, ccmArray));
        widgetPromises.push(getExplorePageWidget(db, studentId, studentClass, studentLocale, xAuthToken, mappedLocale, showExplorePageWidget, checkForPersonalisation, ccmArray));
        let widgetData = await Promise.all(widgetPromises);
        widgetData = widgetData.filter((x) => Boolean(x));
        cameraBackWidgetList = [...cameraBackWidgetList, ...widgetData];
        return cameraBackWidgetList;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

module.exports = {
    getCameraBackWidgets,
    generateExploreWidget,
};
