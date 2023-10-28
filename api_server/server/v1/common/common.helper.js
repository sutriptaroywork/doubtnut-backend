const _ = require('lodash');
const moment = require('moment');
const AnswerContainerV13 = require('../../v13/answer/answer.container');
const LiveclassHelperLocal = require('../../v6/course/course.helper');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const CourseHelper = require('../../helpers/course');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const CourseContainer = require('../../../modules/containers/coursev2');
const WidgetHelper = require('../../widgets/liveclass');
const TrialMysql = require('../../../modules/mysql/trail');
const packageMysql = require('../../../modules/mysql/package');
const PaidUserChampionshipRedis = require('../../../modules/redis/paidUserChampionship');
const referralFlowHelper = require('../../helpers/referralFlow');
const studentHelper = require('../../helpers/student.helper');
const targetGroupHelper = require('../../helpers/target-group');
const NudgeHelper = require('../../helpers/nudge');
const NudgeContainer = require('../../../modules/containers/nudge');
const NudgeRedis = require('../../../modules/redis/nudge');
const InappPopupLogs = require('../../../modules/mongo/inappPopupLogs');

async function trialFlow({
    // eslint-disable-next-line no-unused-vars
    tab, locale, page, studentID, db, studentCcmIds, studentClass, config, versionCode,
}) {
    const tabLocale = tab || locale;
    if (+page !== 0) {
        return {
            title_one: tabLocale === 'hi' ? 'ट्रायल कोर्स चुनें' : 'Select Trial Course',
            title_one_text_size: '22',
            title_one_text_color: '#000000',
            action_text: '',
            action_text_size: '15',
            action_text_color: '#ea532c',
            action_deeplink: '',
            show_close_btn: true,
            background_color: '#ffffff',
            extra_params: {
            },
            tab_data: {
                style: 1,
                items: [
                    {
                        id: 'en',
                        text: 'English',
                        is_selected: tabLocale === 'en',
                    },
                    {
                        id: 'hi',
                        text: 'हिंदी',
                        is_selected: tabLocale === 'hi',
                    },
                ],
            },
            widgets: [],
        };
    }
    const studentPackages = await packageMysql.getAllStudentPackage(db.mysql.read, studentID);
    let widgets = [];
    if (studentPackages.length > 0) {
        widgets.unshift({
            type: 'text_widget',
            data: {
                title: tabLocale === 'hi' ? 'आप पहले ही अपने फ़्री ट्रायल का उपयोग कर चुके हैं!' : 'You have already used your Free Trial!',
                isBold: false,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 16,
            },
        });
    } else {
        let result = await TrialMysql.getAssortmentListForStudent(db.mysql.read, studentID, studentClass, tabLocale);
        if (result.length === 0) {
            result = await TrialMysql.getAssortmentListForStudentByClass(db.mysql.read, studentClass, tabLocale);
        }
        const assortmentList = [];
        result.map((item) => assortmentList.push(item.assortment_id));
        const demoVideoQids = [];
        result.map((item) => demoVideoQids.push(item.demo_video_qid));
        const promise = [];
        for (let i = 0; i < result.length; i++) {
            if (demoVideoQids[i]) {
                // eslint-disable-next-line no-await-in-loop
                const answerData = await CourseV2Mysql.getAnswerIdbyQuestionId(db.mysql.read, demoVideoQids[i]);
                if (answerData.length) {
                    promise.push(AnswerContainerV13.getAnswerVideoResource(db, config, answerData[0].answer_id, demoVideoQids[i], ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true));
                } else {
                    promise.push([]);
                }
            } else {
                promise.push([]);
            }
        }

        const videoResources = await Promise.all(promise);
        const assortmentPriceMapping = assortmentList.length ? await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID, true) : {};
        const courseStudentEnrolledCount = assortmentList.length ? await LiveclassHelperLocal.generateAssortmentStudentEnrolledMapping(db, assortmentList) : {};

        widgets = WidgetHelper.getTrialCourse({
            carousel: { title: '' },
            result,
            locale: tabLocale,
            videoResources,
            assortmentPriceMapping,
            courseStudentEnrolledCount,
            page: 'bottom_sheet',
        });
    }
    return {
        title_one: tabLocale === 'hi' ? 'ट्रायल कोर्स चुनें' : 'Select Trial Course',
        title_one_text_size: '22',
        title_one_text_color: '#000000',
        action_text: '',
        action_text_size: '15',
        action_text_color: '#ea532c',
        action_deeplink: '',
        show_close_btn: true,
        background_color: '#ffffff',
        extra_params: {
        },
        tab_data: {
            style: 1,
            items: [
                {
                    id: 'en',
                    text: 'English',
                    is_selected: tabLocale === 'en',
                },
                {
                    id: 'hi',
                    text: 'हिंदी',
                    is_selected: tabLocale === 'hi',
                },
            ],
        },
        widgets,
    };
}

async function referralFlow({
    // eslint-disable-next-line no-unused-vars
    tab, locale, page, studentID, db, studentCcmIds, studentClass, config, versionCode,
}) {
    const tabLocale = tab || locale;
    const CouponAndUserData = await referralFlowHelper.getRefererSidAndCouponCode(db, studentID);
    if (!CouponAndUserData) {
        throw new Error('No Referral Data Found');
    }
    if (+page !== 0) {
        return {
            title_one: 'Courses only for you!',
            title_one_text_size: '22',
            title_one_text_color: '#000000',
            action_text: '',
            action_text_size: '15',
            action_text_color: '#ea532c',
            action_deeplink: '',
            show_close_btn: true,
            background_color: '#ffffff',
            extra_params: {
            },
            tab_data: {
                style: 1,
                items: [
                    {
                        id: 'en',
                        text: 'English',
                        is_selected: tabLocale === 'en',
                    },
                    {
                        id: 'hi',
                        text: 'हिंदी',
                        is_selected: tabLocale === 'hi',
                    },
                ],
            },
            widgets: [],
        };
    }
    let widgets = [];

    let result = await TrialMysql.getAssortmentListForStudent(db.mysql.read, studentID, studentClass, tabLocale);
    if (result.length === 0) {
        result = await TrialMysql.getAssortmentListForStudentByClass(db.mysql.read, studentClass, tabLocale);
    }
    const assortmentList = [];
    result.map((item) => assortmentList.push(item.assortment_id));
    const demoVideoQids = [];
    result.map((item) => demoVideoQids.push(item.demo_video_qid));
    const promise = [];
    for (let i = 0; i < result.length; i++) {
        if (demoVideoQids[i]) {
            // eslint-disable-next-line no-await-in-loop
            const answerData = await CourseV2Mysql.getAnswerIdbyQuestionId(db.mysql.read, demoVideoQids[i]);
            if (answerData.length) {
                promise.push(AnswerContainerV13.getAnswerVideoResource(db, config, answerData[0].answer_id, demoVideoQids[i], ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true));
            } else {
                promise.push([]);
            }
        } else {
            promise.push([]);
        }
    }

    const videoResources = await Promise.all(promise);
    const assortmentPriceMapping = assortmentList.length ? await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID, true) : {};
    const courseStudentEnrolledCount = assortmentList.length ? await LiveclassHelperLocal.generateAssortmentStudentEnrolledMapping(db, assortmentList) : {};

    widgets = WidgetHelper.getTrialCourse({
        carousel: { title: '' },
        result,
        locale: tabLocale,
        videoResources,
        assortmentPriceMapping,
        courseStudentEnrolledCount,
        page: 'referral_bottom_sheet',
    });
    widgets.unshift(
        {
            type: 'text_widget',
            data: {
                title: tabLocale === 'hi' ? `अपने दोस्त का कूपन ${CouponAndUserData.coupon_code} लगाओ और अभी कोर्स खरीदो` : `Use Coupon Code ${CouponAndUserData.coupon_code} to buy these courses`,
                text_color: '#273de9',
                text_size: '14',
                background_color: '#e1e4ff',
                isBold: true,
                layout_padding: {
                    padding_start: 8,
                    padding_end: 8,
                    padding_top: 7,
                    padding_bottom: 7,
                },
            },
            layout_config: {
                margin_top: 16,
                margin_left: 16,
                margin_right: 16,
            },
        },
    );
    return {
        title_one: tabLocale === 'hi' ? 'Courses only for you' : 'Courses only for you',
        title_one_text_size: '22',
        title_one_text_color: '#000000',
        action_text: '',
        action_text_size: '15',
        action_text_color: '#ea532c',
        action_deeplink: '',
        show_close_btn: true,
        background_color: '#ffffff',
        extra_params: {
        },
        tab_data: {
            style: 1,
            items: [
                {
                    id: 'en',
                    text: 'English',
                    is_selected: tabLocale === 'en',
                },
                {
                    id: 'hi',
                    text: 'हिंदी',
                    is_selected: tabLocale === 'hi',
                },
            ],
        },
        widgets,
    };
}

async function bottomSheetCourses({
    tab, locale, page, studentID, db, studentCcmIds, studentClass, config, versionCode,
}) {
    const studentLocale = tab || locale;
    const categoriesResult = await CourseContainerv2.getCategoriesFromCcmId(db, studentCcmIds);
    const category = [];
    categoriesResult.forEach((item) => category.push(item.category));
    let result = await CourseContainerv2.getCoursesForHomepageIcons(db, studentClass, category, studentLocale);
    const pageStart = Number(page) * 10;
    const pageEnd = (Number(page) + 1) * 10 - 1;
    const assortmentList = [];
    result = result.slice(pageStart, pageEnd);
    result.map((item) => assortmentList.push(item.assortment_id));
    const demoVideoQids = [];
    result.map((item) => demoVideoQids.push(item.demo_video_qid));
    const promise = [];
    for (let i = 0; i < result.length; i++) {
        if (demoVideoQids[i]) {
            // eslint-disable-next-line no-await-in-loop
            const answerData = await CourseV2Mysql.getAnswerIdbyQuestionId(db.mysql.read, demoVideoQids[i]);
            if (answerData.length) {
                promise.push(AnswerContainerV13.getAnswerVideoResource(db, config, answerData[0].answer_id, demoVideoQids[i], ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true));
            } else {
                promise.push([]);
            }
        } else {
            promise.push([]);
        }
    }

    const videoResources = await Promise.all(promise);
    const assortmentPriceMapping = assortmentList.length ? await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID, true) : {};
    const courseStudentEnrolledCount = assortmentList.length ? await LiveclassHelperLocal.generateAssortmentStudentEnrolledMapping(db, assortmentList) : {};

    const widgets = WidgetHelper.getLatestSoldCourseWidget({
        carousel: { title: '' },
        result,
        locale,
        videoResources,
        assortmentPriceMapping,
        courseStudentEnrolledCount,
        page: 'bottom_sheet',
    });
    return {
        title_one: studentLocale === 'hi' ? 'कोर्स' : 'Courses',
        title_one_text_size: '22',
        title_one_text_color: '#000000',
        action_text: 'View all',
        action_text_size: '15',
        action_text_color: '#ea532c',
        action_deeplink: 'doubtnutapp://course_explore',
        show_close_btn: true,
        background_color: '#ffffff',
        extra_params: {
        },
        tab_data: {
            style: 1,
            items: [
                {
                    id: 'en',
                    text: 'English',
                    is_selected: studentLocale === 'en',
                },
                {
                    id: 'hi',
                    text: 'हिंदी',
                    is_selected: studentLocale === 'hi',
                },
            ],
        },
        widgets,
    };
}
async function getLivePastUpcomingTabsAndData({
    tab, locale, page, db, versionCode, config, assortmentList, isPaid = false,
}) {
    let title;
    let data = [];
    const pageStart = Number(page) * 10;
    const pageEnd = (Number(page) + 1) * 10 - 1;
    if (tab === 'live_classes') {
        data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'live_now', assortmentList);
        title = locale === 'hi' ? 'लाइव क्लासेज़' : 'Live Classes';
    } else if (tab === 'past') {
        data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'recent_boards', assortmentList);
        if (!data.length) {
            data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'recent_iit_neet', assortmentList);
        }
        title = locale === 'hi' ? 'पिछली क्लासेज़' : 'Past Classes';
    } else if (tab === 'upcoming') {
        data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'upcoming', assortmentList);
        title = locale === 'hi' ? 'होने वाली क्लासेज़' : 'Upcoming Classes';
    }
    data = _.uniqBy(data, 'id');
    data = data.slice(pageStart, pageEnd);

    const widgets = await WidgetHelper.onlineClassesBottomsheet({
        db,
        data,
        title,
        isLive: tab === 'live_now',
        studentLocale: locale,
        config,
        paymentCardState: { isVip: true },
        versionCode,
        pageValue: 'homepage',
    });
    // text for case when there are no courses in the tab
    const emptyClassTexts = {
        live_classes: {
            en: 'No Live Class currently playing for this category',
            hi: 'इस कैटेगरी के लिए अभी कोई लाइव क्लास नहीं चल रही',
        },
        past: {
            en: 'No Past Classes for this category',
            hi: 'इस कैटेगरी के लिए अभी कोई क्लास नहीं हुई है',
        },
        upcoming: {
            en: 'No Classes Scheduled for this category',
            hi: 'इस कैटेगरी के लिए कोई क्लास निर्धारित नहीं है',
        },
    };
    // empty text if nothing no classes to show
    if (widgets.length === 0 && Number(page) === 0) {
        widgets.unshift({
            type: 'text_widget',
            data: {
                title: locale === 'hi' ? emptyClassTexts[tab].hi : emptyClassTexts[tab].en,
                isBold: false,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 16,
            },
        });
    }

    return {
        title_one: locale === 'hi' ? 'ऑनलाइन क्लासेज़' : 'Online Classes',
        title_one_text_size: '22',
        title_one_text_color: '#000000',
        action_text: locale === 'hi' ? 'सभी देखें' : 'View all',
        action_text_size: '15',
        action_text_color: '#ea532c',
        action_deeplink: (isPaid && versionCode >= 967) ? 'doubtnutapp://library_tab?id=3&tag=free_classes' : 'doubtnutapp://library_tab?id=1&tag=free_classes',
        show_close_btn: true,
        background_color: '#ffffff',
        style: 1,
        extra_params: {
        },
        tab_data: {
            style: 1,
            items: [
                {
                    id: 'live_classes',
                    text: locale === 'hi' ? 'लाइव क्लासेज़' : 'Live Classes',
                    is_selected: tab === 'live_classes',
                },
                {
                    id: 'past',
                    text: locale === 'hi' ? 'पिछली क्लासेज़' : 'Past Classes',
                    is_selected: tab === 'past',

                },
                {
                    id: 'upcoming',
                    text: locale === 'hi' ? 'होने वाली क्लासेज़' : 'Upcoming Classes',
                    is_selected: tab === 'upcoming',
                },
            ],
        },
        widgets,
    };
}

async function getSubjectsTabsData({
    tab, locale, page, db, versionCode, config, assortmentList, variantType, isPaid = false,
}) {
    let tabsList = ['All'];
    let subjectsData = [];
    if (assortmentList.length) {
        subjectsData = await CourseV2Mysql.getSubjeectsByAssortmentId(db.mysql.read, assortmentList);
        subjectsData.forEach((item) => tabsList.push(item.name));
    }

    const tabData = [];
    tabsList = _.uniqBy(tabsList);
    if (!tab || !tabsList.includes(tab)) {
        tab = tabsList[0];
    }
    tabsList.forEach((item) => tabData.push({
        id: item,
        text: item,
        is_selected: tab === item,
    }));
    const subjectAssortmentList = [];
    subjectsData.forEach((item) => {
        if (tab === item.name || tab === 'All') {
            subjectAssortmentList.push(item.course_resource_id);
        }
    });

    if (+page !== 0) {
        return {
            title_one: locale === 'hi' ? 'ऑनलाइन क्लासेज़' : 'Online Classes',
            title_one_text_size: '22',
            title_one_text_color: '#000000',
            action_text: locale === 'hi' ? 'सभी देखें' : 'View all',
            action_text_size: '15',
            action_text_color: '#ea532c',
            action_deeplink: (isPaid && versionCode >= 967) ? 'doubtnutapp://library_tab?id=3&tag=free_classes' : 'doubtnutapp://library_tab?id=1&tag=free_classes',
            show_close_btn: true,
            background_color: '#ffffff',
            extra_params: {
            },
            tab_data: {
                style: variantType === 'b' ? 1 : 2,

                items: tabData,
            },
            widgets: [],
        };
    }

    let liveClasses = await CourseContainerv2.getLiveclassTvCarouselData(db, 'live_now', assortmentList);
    let pastClasses = await CourseContainerv2.getLiveclassTvCarouselData(db, 'recent_boards', assortmentList);
    if (!pastClasses.length) {
        pastClasses = await CourseContainerv2.getLiveclassTvCarouselData(db, 'recent_iit_neet', assortmentList);
    }

    let upcomingClasses = await CourseContainerv2.getLiveclassTvCarouselData(db, 'upcoming', assortmentList);

    liveClasses = _.uniqBy(liveClasses, 'id');
    liveClasses = liveClasses.filter((item) => item.subject === tab || tab === 'All');
    pastClasses = _.uniqBy(pastClasses, 'id');
    upcomingClasses = _.uniqBy(upcomingClasses, 'id');

    pastClasses = pastClasses.filter((item) => item.subject === tab || tab === 'All');
    upcomingClasses = upcomingClasses.filter((item) => item.subject === tab || tab === 'All');

    const widgets = await WidgetHelper.onlineClassesBottomsheet({
        db,
        data: [...liveClasses],
        title: locale === 'hi' ? 'लाइव क्लासेज़' : 'Live Classes',
        isLive: true,
        studentLocale: locale,
        config,
        paymentCardState: { isVip: true },
        versionCode,
        pageValue: 'homepage',
    });
    widgets.push(...await WidgetHelper.onlineClassesBottomsheet({
        db,
        data: [...pastClasses],
        title: locale === 'hi' ? 'पिछली क्लासेज़' : 'Past Classes',
        isLive: false,
        studentLocale: locale,
        config,
        paymentCardState: { isVip: true },
        versionCode,
        pageValue: 'homepage',
    }));
    widgets.push(...await WidgetHelper.onlineClassesBottomsheet({
        db,
        data: [...upcomingClasses],
        title: locale === 'hi' ? 'होने वाली क्लासेज़' : 'Upcoming Classes',
        isLive: false,
        studentLocale: locale,
        config,
        paymentCardState: { isVip: true },
        versionCode,
        pageValue: 'homepage',
    }));
    // text for case when there are no courses in the tab
    const emptyClassTexts = {
        en: 'No Class currently playing for this category',
        hi: 'इस कैटेगरी के लिए अभी कोई क्लास नहीं चल रही',
    };
    // empty text if nothing no classes to show
    if (widgets.length === 0 && Number(page) === 0) {
        widgets.unshift({
            type: 'text_widget',
            data: {
                title: locale === 'hi' ? emptyClassTexts.hi : emptyClassTexts.en,
                isBold: false,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 16,
            },
        });
    }

    return {
        title_one: locale === 'hi' ? 'ऑनलाइन क्लासेज़' : 'Online Classes',
        title_one_text_size: '22',
        title_one_text_color: '#000000',
        action_text: locale === 'hi' ? 'सभी देखें' : 'View all',
        action_text_size: '15',
        action_text_color: '#ea532c',
        action_deeplink: (isPaid && versionCode >= 967) ? 'doubtnutapp://library_tab?id=3&tag=free_classes' : 'doubtnutapp://library_tab?id=1&tag=free_classes',
        show_close_btn: true,
        background_color: '#ffffff',
        extra_params: {
        },
        tab_data: {
            style: variantType === 'b' ? 1 : 2,

            items: tabData,
        },
        widgets,
    };
}

async function getOnlineClassesFlagr(db, studentId) {
    const flagrResp = await CourseContainerv2.getFlagrResp(db, 'online_classes_icon_homepage_tabs_experiment', studentId);
    return _.get(flagrResp, 'online_classes_icon_homepage_tabs_experiment.payload.variant_type', 'a');
}
async function bottomSheetOnlineClasses({
    // eslint-disable-next-line no-unused-vars
    tab, locale, page, db, studentCcmIds, studentClass, versionCode, config, studentID,
}) {
    const assortmentList = [];
    let assortmentData = [];
    if (studentCcmIds.length) {
        assortmentData = await CourseContainerv2.getFreeCouseAssortmentIdsByCcmId(db, studentCcmIds, locale);
    }
    assortmentData.forEach((item) => assortmentList.push(item.assortment_id));
    const variantType = await getOnlineClassesFlagr(db, studentID);
    const emiPackages = await CourseContainer.getUserEmiPackages(db, studentID);
    const studentSubscriptionDetails = await CourseContainer.getUserActivePackages(db, studentID);
    const isPaid = (emiPackages.length !== 0 || studentSubscriptionDetails.length !== 0);
    if (variantType === 'a') {
        return getLivePastUpcomingTabsAndData({
            tab, locale, page, db, versionCode, config, assortmentList, isPaid,
        });
    }
    return getSubjectsTabsData({
        tab, locale, page, db, versionCode, config, assortmentList, variantType, isPaid,
    });
}

function replaceAwithBinArr(arr, a, b) {
    const index = arr.indexOf(a);

    if (index !== -1) {
        arr[index] = b;
    }

    return arr;
}
async function bottomSheetBooks({
    tab, locale, page, db, studentCcmIds, versionCode, config, studentClass,
}) {
    let studentCcmArrNew = studentCcmIds.map(Number);
    studentCcmArrNew = replaceAwithBinArr(studentCcmArrNew, 11301, 11201);
    studentCcmArrNew = replaceAwithBinArr(studentCcmArrNew, 11306, 11206);
    studentCcmArrNew = replaceAwithBinArr(studentCcmArrNew, 11303, 11203);

    const data = await CourseContainerv2.getBooksByCcmId(db, studentCcmArrNew, tab, locale, page, studentClass);
    const widgets = await WidgetHelper.booksForHomepage({
        db,
        data,
        title: tab.charAt(0).toUpperCase() + tab.slice(1),
        isLive: true,
        studentLocale: locale,
        config,
        paymentCardState: { isVip: true },
        versionCode,
        pageValue: 'homepage',
    });
    widgets.scroll_direction = 'vertical';
    const tabs = [];
    if (studentClass > 8 && studentClass <= 13) {
        tabs.push(...[
            {
                id: 'maths',
                text: locale === 'hi' ? 'गणित' : 'Maths',
                is_selected: tab === 'maths',
            },
            {
                id: 'physics',
                text: locale === 'hi' ? 'भौतिक विज्ञान' : 'Physics',
                is_selected: tab === 'physics',
            },
            {
                id: 'chemistry',
                text: locale === 'hi' ? 'रसायन विज्ञान' : 'Chemistry',
                is_selected: tab === 'chemistry',
            },
            {
                id: 'biology',
                text: locale === 'hi' ? 'जीव-विज्ञान' : 'Biology',
                is_selected: tab === 'biology',
            },
        ]);
    } else if (studentClass <= 8) {
        tabs.push(...[
            {
                id: 'maths',
                text: locale === 'hi' ? 'गणित' : 'Maths',
                is_selected: tab === 'maths',
            },
            {
                id: 'science',
                text: locale === 'hi' ? 'विज्ञान' : 'Science',
                is_selected: tab === 'science',
            },
        ]);
    }
    if (studentClass > 8 && studentClass < 13) {
        tabs.push(...[{
            id: 'history',
            text: 'History',
            is_selected: tab === 'history',
        },
        {
            id: 'geography',
            text: 'Geography',
            is_selected: tab === 'geography',
        },
        {
            id: 'political science',
            text: 'Political Science',
            is_selected: tab === 'political science',

        },
        {
            id: 'economics',
            text: 'Economics',
            is_selected: tab === 'economics',
        },
        {
            id: 'social science',
            text: 'Social Science',
            is_selected: tab === 'social science',
        }]);
    }
    if (studentClass >= 11 && studentClass <= 12) {
        tabs.push(...[{
            id: 'accounts',
            text: 'Accounts',
            is_selected: tab === 'accounts',
        }, {
            id: 'bussiness studies',
            text: 'Bussiness Studies',
            is_selected: tab === 'bussiness studies',
        }]);
    }
    if (widgets.length === 0 && Number(page) === 0) {
        widgets.unshift({
            type: 'text_widget',
            data: {
                title: 'No books currently available for this subject in your class',
                isBold: false,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 16,
            },
        });
    }
    return {
        title_one: locale === 'hi' ? 'किताबें' : 'Books',
        title_one_text_size: '22',
        title_one_text_color: '#000000',
        action_text: '',
        action_text_size: '15',
        action_text_color: '#ea532c',
        action_deeplink: '',
        show_close_btn: true,
        background_color: '#ffffff',
        extra_params: {
        },
        ...(tabs.length
            && {
                tab_data: {
                    style: 1,
                    items: tabs,
                },
            }
        ),
        widgets,
    };
}

async function bottomSheetPreviousYear({
    tab, locale, page, db, studentCcmIds, versionCode, config, studentClass,
}) {
    let studentCcmArrNew = studentCcmIds.map(Number);
    studentCcmArrNew = replaceAwithBinArr(studentCcmArrNew, 11301, 11201);
    studentCcmArrNew = replaceAwithBinArr(studentCcmArrNew, 11306, 11206);
    studentCcmArrNew = replaceAwithBinArr(studentCcmArrNew, 11303, 11203);

    const data = await CourseContainerv2.getPreviousYearQuestionsByCcmId(db, studentCcmArrNew, page, studentClass);
    const widgets = await WidgetHelper.booksForHomepage({
        db,
        data,
        title: tab.charAt(0).toUpperCase() + tab.slice(1),
        isLive: true,
        studentLocale: locale,
        config,
        paymentCardState: { isVip: true },
        versionCode,
        pageValue: 'homepage',
    });

    widgets.scroll_direction = 'vertical';
    return {
        title_one: locale === 'hi' ? 'पिछले साल के सॉल्यूशन' : 'Previous Year Solutions',
        title_one_text_size: '22',
        title_one_text_color: '#000000',
        action_text: '',
        action_text_size: '15',
        action_text_color: '#ea532c',
        action_deeplink: '',
        show_close_btn: true,
        background_color: '#ffffff',
        extra_params: {
        },
        widgets,
    };
}

async function getCountofInteractions(db, studentId) {
    let countOfInteractions = await PaidUserChampionshipRedis.getStudentPaidCourseInteractionCount(db.redis.read, studentId);
    if (_.isNull(countOfInteractions)) {
        countOfInteractions = 0;
    }
    countOfInteractions = parseInt(countOfInteractions) + 1;
    if (countOfInteractions <= 3) {
        PaidUserChampionshipRedis.setStudentPaidCourseInteractionCount(db.redis.write, studentId, countOfInteractions);
    }
    return countOfInteractions;
}

async function getReferralPopUp(db, studentId, locale, config) {
    const CouponAndUserData = await referralFlowHelper.getRefererSidAndCouponCode(db, studentId);
    if (CouponAndUserData) {
        const userName = await studentHelper.getStudentName(db, CouponAndUserData.student_id);
        const { coupon_code: couponCode } = CouponAndUserData;
        return {
            lottie_url: `${config.cdn_url}referral_lottie.zip`,
            widgets: [
                {
                    widget_data: {
                        title: locale === 'hi' ? `बधाई हो ! आपके दोस्त ${userName} ने आपको दिया है अपना ख़ास कूपन कोड अब पाओ सभी कोर्सेज पे 30% की बचत` : `Congratulations! You have ben referred by your friend ${userName}! Use her coupon code for EXTRA 30% OFF on all courses.`,
                        title_text_size: '12',
                        title_text_color: '#808080',
                        action: locale === 'hi' ? `${userName} का कोड ${couponCode}` : `${userName}'s Code ${couponCode}`,
                        action_text_size: '16',
                        action_text_color: '#273de9',
                        action_image_url: `${config.staticCDN}engagement_framework/F5020410-0977-6E22-D9D4-44349B74A607.webp`,
                        action_deeplink: `doubtnutapp://copy?text=${couponCode}&label=referral_code&toast_message=${locale === 'hi' ? 'Code copied' : 'Code copied'}`,
                        image_url: `${config.staticCDN}engagement_framework/6EB6DACE-70D4-2BB2-3350-756E7B009AFC.webp`,
                    },
                    widget_type: 'widget_coupon_applied',
                    layout_config: {
                        margin_top: 46,
                        margin_left: 22,
                        margin_right: 22,
                    },
                },
                {
                    data: {
                        text_one: locale === 'hi' ? 'कोर्स चुने' : 'Explore Now',
                        text_one_size: '14',
                        text_one_color: '#ffffff',
                        bg_color: '#eb532c',
                        bg_stroke_color: '#eb532c',
                        deep_link: 'doubtnutapp://paginated_bottom_sheet_widget?id=referral_flow',
                        is_trial_btn: false,
                        corner_radius: '2.0',
                        elevation: '2.0',
                        min_height: '36',
                        is_offer_btn: false,
                    },
                    layout_config: {
                        margin_top: 12,
                        margin_left: 12,
                        margin_right: 12,
                        margin_bottom: 12,
                    },
                    type: 'widget_button_border',
                },
            ],
        };
    }

    throw new Error('No referral data found');
}
async function getPopupViewData(studentId, page) {
    const dailyQuery = {
        $match: {
            student_id: `${studentId}`,
            page,
            createdAt: {
                $gte: moment().add(5, 'h').add(30, 'minutes').startOf('day')
                    .toDate(),
                $lte: moment().add(5, 'h').add(30, 'minutes').endOf('day')
                    .toDate(),
            },
        },
    };

    const monthlyQuery = {
        $match: {
            student_id: `${studentId}`,
            page,
            createdAt: {
                $gte: moment().add(5, 'h').add(30, 'minutes').subtract(30, 'day')
                    .startOf('day')
                    .toDate(),
                $lte: moment().add(5, 'h').add(30, 'minutes').endOf('day')
                    .toDate(),
            },
        },
    };
    const aggregate = {
        $group: {
            _id: '$inapp_popups_id',
            total_count: {
                $sum: 1,
            },
        },
    };
    // const sort = { $sort: { total_count: 1 } }; // comment when needed
    const [dailyData, monthlyData] = await Promise.all([
        InappPopupLogs.aggregate([dailyQuery, aggregate]),
        InappPopupLogs.aggregate([monthlyQuery, aggregate]),
    ]);

    const dailyViewData = {};
    for (let i = 0; i < dailyData.length; i++) {
        dailyViewData[dailyData[i]._id] = dailyData[i].total_count;
    }
    const monthlyViewData = {};
    for (let i = 0; i < monthlyData.length; i++) {
        monthlyViewData[monthlyData[i]._id] = monthlyData[i].total_count;
    }
    return [dailyViewData, monthlyViewData];
}

function findNextPopupDeeplinkIndex(popupData, lastWatchedPopupIdData) {
    let lastWatchedIndex = 0; // could have used binary search but priority same may create confusion
    for (let i = 0; i < popupData.length; i++) {
        if (popupData[i].id === lastWatchedPopupIdData.popup_id) {
            lastWatchedIndex = i + 1;
            break;
        }
    }
    return lastWatchedIndex >= popupData.length ? 0 : lastWatchedIndex;
}

function isDailyAndMaxLimitValid(popupData, popupViewData) {
    const dailyWatch = popupViewData[0];
    const totalWatch = popupViewData[1];
    if (!popupData.max_limit || !totalWatch[popupData.id] || totalWatch[popupData.id] < popupData.max_limit) {
        if (!popupData.daily_limit || !dailyWatch[popupData.id] || dailyWatch[popupData.id] < popupData.daily_limit) {
            return true;
        }
    }
    return false;
}

function isPopupSessionValid(popupData, sessionId, lastWatchedPopupData, lastWatchedSessionPopupCountData) {
    const sessionData = popupData.session_ids.split(',');
    const sessionLimit = popupData.session_limit ? popupData.session_limit : 2; // 2 per session max if not specified on db
    const currentDate = moment().add(5, 'h').add(30, 'm').format('DD-MM-YYYY');

    let lastPoupData = _.clone(lastWatchedPopupData);
    let lastSessionData = _.clone(lastWatchedSessionPopupCountData);
    if (sessionData[0] === 'all' || sessionData.includes(sessionId)) {
        if (!lastPoupData.session_id || lastPoupData.session_id !== sessionId) {
            lastPoupData = { popup_id: popupData.id, session_id: sessionId, last_active_date: currentDate };
            lastSessionData = {};
            lastSessionData[popupData.id] = 1;
            return { isShow: true, lastPoupData, lastSessionData };
        }
        if (lastPoupData.session_id === sessionId && (!lastSessionData[popupData.id] || lastSessionData[popupData.id] < sessionLimit)) {
            lastPoupData.last_active_date = currentDate;
            lastPoupData.popup_id = popupData.id;
            lastSessionData[popupData.id] = lastSessionData[popupData.id] ? lastSessionData[popupData.id] + 1 : 1;
            return { isShow: true, lastPoupData, lastSessionData };
        }
    }
    return { isShow: false, lastPoupData, lastSessionData };
}

async function popupLogsData(db, studentId, studentClass, sessionId, versionCode, popupData, lastPoupData, lastSessionData, maxSessionLimit, maxDailyLImit) {
    const mongoObj = {
        student_id: studentId,
        student_class: studentClass,
        inapp_popups_id: popupData.id,
        popup_type: popupData.popup_type,
        page: popupData.page,
        nudge_id: popupData.nudge_id,
        session_id: sessionId,
        action_type: 'watched',
        engagement_time: 0,
        version_code: versionCode,
    };
    const inappPopupLogs = new InappPopupLogs(mongoObj);
    inappPopupLogs.save();

    await Promise.allSettled([
        NudgeRedis.setUserPopupWatchedData(db.redis.write, studentId, 'LAST_WATCHED_POPUP', lastPoupData),
        NudgeRedis.setUserPopupWatchedData(db.redis.write, studentId, 'LAST_WATCHED_SESSION_POPUP_COUNTS', lastSessionData),
        NudgeRedis.setUserPopupWatchedData(db.redis.write, studentId, `OVERALL_SESSION_LIMIT_${popupData.page}_${sessionId}`, maxSessionLimit),
        NudgeRedis.setUserPopupWatchedData(db.redis.write, studentId, `OVERALL_DAILY_LIMIT_${popupData.page}`, maxDailyLImit),
    ]);
}

async function isOverallSessionAndDailyLimitValid(db, page, userOverallSessionLimit, userOverallDailyLimit) {
    userOverallSessionLimit = userOverallSessionLimit ? +userOverallSessionLimit : 0;
    userOverallDailyLimit = userOverallDailyLimit ? +userOverallDailyLimit : 0;

    const [overallSessionLimit, overallDailyLimit] = await Promise.allSettled([
        NudgeContainer.getInAppPopUpDnPropertyData(db, 'inapp_popup', `${page}_SESSION_LIMIT`),
        NudgeContainer.getInAppPopUpDnPropertyData(db, 'inapp_popup', `${page}_DAILY_LIMIT`),
    ]);

    const maxDailyLimit = overallDailyLimit.value && overallDailyLimit.value.length && overallDailyLimit.value[0].value ? +overallDailyLimit.value[0].value : 2; // 2 max if not specified in db
    const maxsessionLimit = overallSessionLimit.value && overallSessionLimit.value.length && overallSessionLimit.value[0].value ? +overallSessionLimit.value[0].value : 1; // 1 max if not specified in db

    if (!userOverallDailyLimit) {
        return [true, 1, 1];
    }
    if (userOverallDailyLimit < maxDailyLimit) {
        if (!userOverallSessionLimit) {
            return [true, 1, userOverallDailyLimit + 1];
        }
        if (userOverallSessionLimit < maxsessionLimit) {
            return [true, userOverallSessionLimit + 1, userOverallDailyLimit + 1];
        }
    }
    return [false, maxsessionLimit, maxDailyLimit];
}

async function findNextPopupDeeplinkData(db, studentId, studentClass, locale, versionCode, sessionId, popupData, popupViewData, lastWatchedPopupData, lastWatchedSessionPopupCountData, overallSessionLimit, overallDailyLimit) {
    const respData = {};
    const [isOverallLimitValid, maxSessionLimit, maxDailyLImit] = await isOverallSessionAndDailyLimitValid(db, popupData.page, overallSessionLimit, overallDailyLimit);
    if (isOverallLimitValid) {
        if (isDailyAndMaxLimitValid(popupData, popupViewData)) {
            const { isShow, lastPoupData, lastSessionData } = isPopupSessionValid(popupData, sessionId, lastWatchedPopupData, lastWatchedSessionPopupCountData);
            if (isShow) {
                const tgCheck = popupData.tg_id ? await targetGroupHelper.targetGroupCheck({
                    db, studentId, tgID: popupData.tg_id, studentClass, locale, adType: null,
                }) : true;

                // After tg Check finding url one by one
                if (tgCheck) {
                    if (popupData.nudge_id && (popupData.popup_type === 'nudge_popup' || popupData.popup_type === 'course_popup_auto_board' || popupData.popup_type === 'course_popup_auto_exam')) {
                        respData.deeplink = `doubtnutapp://nudge_popup?nudge_id=${popupData.nudge_id}&type=COMMON`;
                    } else if (popupData.nudge_id && popupData.popup_type === 'deeplink') {
                        respData.deeplink = popupData.meta_info;
                    } else if (popupData.popup_type === 'continue_watching') {
                        const [url, data] = await NudgeHelper.getContinueWatchingBottomSheet(db, studentId);
                        if (url) {
                            respData.deeplink = url;
                        } else {
                            respData.notification_popup_data = data;
                        }
                    } else if (popupData.popup_type === 'in_app_survey_pop_up') {
                        const surveyID = await NudgeHelper.getInappSurveyPopupId(db, studentId, studentClass, locale, versionCode, popupData.nudge_id);
                        respData.deeplink = surveyID ? `doubtnutapp://app_survey?survey_id=${surveyID}&type=COMMON` : null;
                    }
                }
            }

            // logging of data in mongo and redis
            if (respData.deeplink || respData.notification_popup_data) {
                await popupLogsData(db, studentId, studentClass, sessionId, versionCode, popupData, lastPoupData, lastSessionData, maxSessionLimit, maxDailyLImit);
            }
        }
    }
    return respData;
}

async function bottomSheetVideos({ db, page, tab }) {
    if (+page > 0) {
        return {
            widgets: [],
        };
    }
    const widgets = await db.mongo.read.collection('homepage_vertical_videos').find({ carousel_id: parseInt(tab) }).toArray();
    return {
        tab_data: {
            style: 1,
        },
        widgets,
    };
}

module.exports = {
    bottomSheetCourses, bottomSheetOnlineClasses, bottomSheetPreviousYear, bottomSheetBooks, trialFlow, getCountofInteractions, getPopupViewData, findNextPopupDeeplinkIndex, findNextPopupDeeplinkData, getReferralPopUp, referralFlow, bottomSheetVideos,
};
