const _ = require('lodash');
const moment = require('moment');
const AnswerContainer = require('../../v13/answer/answer.container');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const TestSeries = require('../../../modules/mysql/testseries');
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const courseHelper = require('../../helpers/course');
const boardData = require('../../../data/data');
const Utility = require('../../../modules/utility');
const newtonNotifications = require('../../../modules/newtonNotifications');
const TGHelper = require('../../helpers/target-group');
const schHelper = require('./scholarship.helper');
const scholarshipV1 = require('../../v1/scholarship/scholarship.controller.js');
const dnExamRewardsHelper = require('../../v1/dn_exam_rewards/dn_exam_rewards.helper');

function getShareMessageSMS(locale, textData, url, date) {
    return boardData.scholarshipShareSMS(locale, textData[0].test_name, date, url);
}

async function getLeaderBoard(db, studentId, testId, leaderboardIds, locale, subscriptionId) {
    const leaderboard = await CourseContainerV2.getScholarshipLeaderByTest(db, leaderboardIds);
    const studentRanking = await CourseMysqlV2.getStudentScholarshipRank(db.mysql.read, testId, studentId);
    const type = 'single';
    const leaderBoard = scholarshipV1.leaderboardStudents(leaderboard, type);
    let studentRank = [];
    if (studentRanking[0]) {
        const sli = studentRanking[0].mobile.slice(0, 6);
        const phone = studentRanking[0].mobile.replace(sli, 'xxxxxx');
        let userName;
        if (studentRanking[0].student_fname !== null) {
            if (studentRanking[0].student_lname !== null) {
                userName = `${studentRanking[0].student_fname} ${studentRanking[0].student_lname}`;
            } else {
                userName = `${studentRanking[0].student_fname}`;
            }
        } else {
            userName = 'No-name';
        }
        let rankText;
        if (subscriptionId && subscriptionId[0] && subscriptionId[0].status === 'COMPLETED') {
            rankText = locale === 'hi' ? 'योग्य नहीं है||आपने यह परीक्षा देर से शुरू की है' : 'Not eligible||Aapne yeh test late start kiya hai';
        } else {
            rankText = locale === 'hi' ? 'योग्य नहीं है||आपने यह परीक्षा नहीं दी है' : 'Not Eligible||Aapne yeh test nahi diya hai';
        }
        studentRank = [{
            rank: studentRanking[0].rank && studentRanking[0].marks !== null ? `${studentRanking[0].rank}` : 'NA',
            image: studentRanking[0].img_url ? studentRanking[0].img_url : '',
            moblie: phone,
            name: userName,
            marks: studentRanking[0].marks !== null && studentRanking[0].rank ? `${studentRanking[0].marks}` : rankText,
        }];
    }
    return [leaderBoard, studentRank];
}

async function videoResource(db, config, questionId) {
    const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, questionId);
    let videoResources;
    if (answerData.length) {
        videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, questionId, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE']);
    }
    return videoResources;
}

async function getVideoResources(db, config, locale, filterdTest, page) {
    const videoDetails = {
        scroll_direction: 'vertical',
        auto_play: true,
        default_mute: false,
        auto_play_initiation: 100,
        items: [
            {
                type: 'course_video',
                data: {
                    title1: '',
                    state: 2,
                    disable_click: true,
                    title2: '',
                    top_title1: '',
                    question_id: '',
                    subject: '',
                    color: '',
                    page: '',
                    image_url: '',
                    live_at: 0,
                    live_date: '',
                    is_live: true,
                    card_width: '1',
                    card_ratio: '16:9',
                    auto_play: true,
                    default_mute: false,
                    auto_play_initiation: 100,
                    top_title: '',
                },
                extra_params: {
                    source: '',
                },
            },
        ],
    };
    let questionId;
    let index;
    if (locale === 'hi') {
        videoDetails.items[0].data.image_bg_card = `${filterdTest[0].video_thumbnail.split('||')[0]}`;
        if (page === 'registration') {
            index = 0;
        } else if (page === 'start') {
            index = 2;
        } else if (page === 'wait') {
            index = 4;
        } else if (page === 'result') {
            index = 6;
        }
        questionId = filterdTest[0].video.split('||')[index];
    } else {
        videoDetails.items[0].data.image_bg_card = `${filterdTest[0].video_thumbnail.split('||')[1]}`;
        if (page === 'registration') {
            index = 1;
        } else if (page === 'start') {
            index = 3;
        } else if (page === 'wait') {
            index = 5;
        } else if (page === 'result') {
            index = 7;
        }
        questionId = filterdTest[0].video.split('||')[index];
    }
    const videoResources = await videoResource(db, config, questionId);
    if (videoResources && videoResources[0]) {
        videoDetails.items[0].data.video_resource = videoResources[0];
    } else {
        videoDetails.items[0].data.video_resource = null;
    }
    return {
        type: 'widget_autoplay',
        data: videoDetails,
    };
}

async function getBannerWidget(db, filterdTest, progress, locale, studentResult) {
    let banner;
    if (progress === 4) {
        banner = await CourseContainerV2.getScholarshipResultBanner(db, studentResult[0].coupon_code, locale);
    } else {
        banner = await CourseContainerV2.getScholarshipWebBanner(db, filterdTest[0].test_id, progress, locale);
    }
    if (banner && banner[0]) {
        return {
            type: 'promo_list',
            data: {
                items: [
                    {
                        id: banner[0].id,
                        image_url: banner[0].url,
                        deeplink: banner[0].deeplink,
                    },
                ],
                margin: true,
            },
            layout_config: {
                margin_top: 14,
                margin_left: 16,
                margin_right: 16,
                margin_bottom: 0,
            },
        };
    }
    return [];
}

async function getPrevTestWidget(db, studentId, locale) {
    const oldTestData = await CourseMysqlV2.getOldTestData(db.mysql.read, studentId);
    const oldTestResources = [];
    if (oldTestData && oldTestData[0]) {
        for (const value of oldTestData) {
            let attempt;
            if (value.created_at) {
                const date = moment(value.created_at).format("Do MMM'YY");
                attempt = locale === 'hi' ? `Attempted on -  ${date}` : `प्रयास किया - ${date}`;
            } else {
                attempt = locale === 'hi' ? "You didn't attempt this test" : 'आपने इस परीक्षण का प्रयास नहीं किया';
            }
            oldTestResources.push({
                bg_color: '',
                deeplink: '',
                title1: value.test_name.replace(/\n/g, ' '),
                title1_text_color: '#541388',
                title1_text_size: '16',
                title2: locale === 'hi' ? `मार्क:- ${value.eligiblescore} / ${value.totalmarks}` : `Marks:- ${value.eligiblescore} / ${value.totalmarks}`,
                title2_text_color: '#333333',
                title2_text_size: '13',
                title3: attempt,
                title3_text_color: '#333333',
                title3_text_size: '13',
            });
        }
        const bgArray = ['#aae0e5', '#e5e4aa', '#e5caaa', '#cde5aa'];
        for (let i = 0; i < oldTestResources.length; i++) {
            const index = i % 4;
            oldTestResources[i].bg_color = bgArray[index];
        }
    }
    if (oldTestResources && oldTestResources[0]) {
        const widget = {
            type: 'widget_previous_test_results',
            data: {
                title: locale === 'hi' ? 'आपका पिछला टेस्ट परिणाम' : 'Yours previous Test result',
                title_text_color: '#272727',
                title_text_size: '18',
                bg_color: '',
                items: oldTestResources,
            },
            layout_config: {
                margin_top: 16,
                margin_left: 16,
                margin_right: 16,
                margin_bottom: 0,
            },
        };
        return widget;
    }
    return [];
}

async function getAwardedStudentsWidget(db, locale, filterdTest) {
    let { type } = filterdTest[0];
    let number;
    let oldTests;
    if (type.includes('DNST')) {
        number = type.replace('DNST', '');
        const oldTypes = [`DNST${number - 1}`, `DNST${number - 2}`];
        oldTests = await CourseContainerV2.getScholarshipExamsOld(db, oldTypes);
    } else {
        const test = await CourseContainerV2.getLastDNST(db);
        type = test[0].type;
        number = type.replace('DNST', '');
        const oldTypes = [`DNST${number}`, `DNST${number - 1}`];
        oldTests = await CourseContainerV2.getScholarshipExamsOld(db, oldTypes);
    }
    const examPairs = [];
    if (oldTests && oldTests[0]) {
        for (const value of oldTests) {
            if (value.other_result_tests === null) {
                examPairs.unshift(`${value.test_id}`);
            } else {
                examPairs.unshift(value.other_result_tests);
            }
        }
    }
    const uniqueExams = [...new Set(examPairs)];
    let finalLeaderboard = [];
    if (uniqueExams && uniqueExams[0]) {
        for (const value of uniqueExams) {
            const leaderBoardTestIds = value.split('||');
            // eslint-disable-next-line no-await-in-loop
            const leaderboard = await CourseContainerV2.getScholarshipLeaderByTestSmall(db, leaderBoardTestIds);
            const type2 = 'all';
            const leaderBoard = scholarshipV1.leaderboardStudents(leaderboard, type2, oldTests);
            finalLeaderboard = finalLeaderboard.concat(leaderBoard);
        }
    }
    if (finalLeaderboard && finalLeaderboard[0]) {
        const awardedStudents = [];
        for (const value of finalLeaderboard) {
            let color;
            if (value.rank == 1) {
                color = '#ff7f00';
            } else {
                color = '#007aff';
            }
            awardedStudents.push({
                rank: value.rank,
                rank_text_color: '#ffffff',
                rank_text_size: '18',
                highlight_color: color,
                profile_image: value.image,
                name: value.name,
                name_text_size: '14',
                name_text_color: '#541388',
                scholarship_granted: value.reward,
                scholarship_granted_text_size: '10',
                scholarship_granted_text_color: '#ffffff',
                exam_targeted: value.testName,
                exam_targeted_text_size: '12',
                exam_targeted_text_color: '#666467',
                scholarship_test: value.scholarshipName,
                scholarship_test_text_size: '9',
                scholarship_test_text_color: '#666467',
                bg_color: '#ffffff',
                deeplink: '',
            });
        }
        const widget = {
            type: 'widget_awarded_students_list',
            data: {
                title: locale === 'hi' ? 'पुरस्कृत स्टूडेंट्स' : 'Awarded Students',
                title_text_color: '#272727',
                title_text_size: '18',
                bg_color: '',
                auto_scroll_time_in_sec: 3,
                items: awardedStudents,
            },
            layout_config: {
                margin_top: 16,
                margin_left: 16,
                margin_right: 0,
                margin_bottom: 0,
            },
        };
        return widget;
    }
    return [];
}

async function getCourseData(db, studentClass, config, versionCode, studentId, locale, xAuthToken, couponCode, testDetails) {
    const page = 'SCHOLARSHIP_PAGE';
    const assortmentList = [];
    const studentCcmAssortments = [];
    let data = [];
    let assortmentID = [];
    let classStudent;
    if (testDetails && testDetails[0] && testDetails[0].assortment_ids) {
        assortmentID = testDetails[0].assortment_ids.split('||');
        classStudent = testDetails[0].assortment_class;
    }
    if (assortmentID && assortmentID.length > 0 && assortmentID[0] != 'ccmid') {
        data = await CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, assortmentID, classStudent);
    } else {
        let studentCcmData = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, studentId);
        studentCcmData = studentCcmData.filter((item) => boardData.boards.includes(item.course));
        if (studentClass != testDetails[0].test_class && studentCcmData && studentCcmData[0]) {
            studentCcmData = await CourseMysqlV2.getCoursesClassCourseMappingBasedOnCcm(db.mysql.read, studentCcmData[0].id, testDetails[0].test_class);
        }
        const assortment1 = await courseHelper.getAssortmentByCategory(db, studentCcmData, testDetails[0].test_class, locale);
        assortmentID.push(assortment1.toString());
        const locale2 = (locale === 'hi') ? 'en' : 'hi';
        const assortment2 = await courseHelper.getAssortmentByCategory(db, studentCcmData, testDetails[0].test_class, locale2);
        assortmentID.push(assortment2.toString());
        data = await CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, assortmentID, testDetails[0].test_class);
    }
    const courseAssortment = [];
    const subjectAssortment = [];
    let subjectCourses = [];
    if (data && data[0]) {
        data.forEach((item) => {
            courseAssortment.push(item.assortment_id);
        });
        for (let i = 0; i < courseAssortment.length; i++) {
            if (courseAssortment[i] !== 248266 && courseAssortment[i] !== 248265 && courseAssortment[i] !== 273538 && courseAssortment[i] !== 273539 && !data[i].created_by.includes('ETOOS')) {
                // eslint-disable-next-line no-await-in-loop
                const subjects = await CourseMysqlV2.getSubjectsListByCourseAssortmentRecommendationWidget(db.mysql.read, courseAssortment[i]);
                subjectCourses = subjectCourses.concat(subjects);
            }
        }
        subjectCourses.forEach((item) => {
            subjectAssortment.push(item.assortment_id);
        });
        data = data.concat(subjectCourses);
    }
    data.forEach((item) => {
        studentCcmAssortments.push(item);
    });
    studentCcmAssortments.forEach((item) => assortmentList.push(item.assortment_id));
    const assortmentPriceMapping = await courseHelper.generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
    const promises = [];
    for (const value of studentCcmAssortments) {
        const paymentCardState = {
            isVip: false,
            isTrial: false,
        };
        if ((value.assortment_type === 'course' || value.assortment_type === 'class' || value.assortment_type === 'subject') && assortmentPriceMapping[value.assortment_id]) {
            const setWidth = true;
            promises.push(courseHelper.generateAssortmentObject({
                data: value,
                config,
                paymentCardState,
                assortmentPriceMapping,
                db,
                setWidth,
                versionCode,
                assortmentFlagrResponse: null,
                locale,
                category: null,
                page,
                eventPage: null,
                studentId,
            }));
        }
    }
    const courses = await Promise.all(promises);
    const popularCourseData = { items: courses };
    for (const value of popularCourseData.items) {
        let courseDeeplink = value.data.deeplink;
        let hasCoupon = false;
        if (couponCode && couponCode[0] && couponCode[0].coupon_code && couponCode[0].progress_id == 4) {
            courseDeeplink = value.data.deeplink.concat(`||||${couponCode[0].coupon_code}`);
            hasCoupon = true;
        }
        if (hasCoupon) {
            value.data.deeplink = courseDeeplink;
            value.data.buy_deeplink = courseDeeplink;
        }
        if (courseAssortment.includes(value.data.assortment_id)) {
            value.tab = 'Course';
        } else if (subjectAssortment.includes(value.data.assortment_id)) {
            value.tab = 'Subject';
        }
    }
    return popularCourseData.items.filter((item) => Boolean(item));
}

async function getDetails(req, res, next) {
    try {
        const stickyWidget = [];
        const widget = [];
        const footerWidget = [];
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_class: studentClass } = req.user;
        const { student_id: studentId, mobile } = req.user;
        const xAuthToken = req.headers['x-auth-token'];
        const { version_code: versionCode1 } = req.headers;
        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';
        const { id: ID, change_test: changeTest } = req.query;

        let testId;
        let testIdResult = 0;
        let type = ID.replace('scholarship_test_', '');
        if (type.includes('DNEXAMREWARDS')) {
            const { page, sticky, footy } = await dnExamRewardsHelper.getExamRewardsLandingPage(db, studentClass, +versionCode1, locale, xAuthToken, config);
            stickyWidget.push(sticky);
            footerWidget.push(footy);
            const responseData = {
                meta: {
                    code: 200,
                    message: 'success',
                },
                data: {
                    title: locale == 'hi' ? 'टॉपर रिवॉर्ड प्रोग्राम' : 'TOPPER REWARD PROGRAM',
                    title_text_size: '18',
                    title_text_color: '#272727',
                    highlight_color: '',
                    bg_color: '#ffffff',
                    sticky_widgets: stickyWidget,
                    widgets: page,
                    footer_widgets: footerWidget,
                    progress: 1,
                    scholarship_test_id: 'DNST23',
                    test_id: 400501,
                    start_time_in_millis: 184440894,
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (type.includes('_')) {
            testIdResult = parseInt(type.split('_')[1]);
            type = type.split('_')[0];
        }
        let progress;
        const testArray = [];
        let dataTest = await CourseContainerV2.getScholarshipExams(db);
        const oliginalActiveTests = [];
        let originalActiveTypes = [];
        dataTest.forEach((item) => {
            oliginalActiveTests.push(item.test_id);
            if (moment().add(5, 'hours').add(30, 'minutes').isBefore(item.publish_time)) {
                originalActiveTypes.push(item.type);
            }
        });
        if (_.isEmpty(originalActiveTypes)) {
            dataTest.forEach((item) => {
                originalActiveTypes.push(item.type);
            });
        }
        originalActiveTypes = [...new Set(originalActiveTypes)];
        let progressId = await CourseMysqlV2.getScholarshipTestProgress(db.mysql.read, studentId);
        const tempDataTest = dataTest.filter((item) => item.type === type);
        if (tempDataTest.length > 0) {
            dataTest = tempDataTest;
        } else {
            let keeperType = '';
            for (let i = 0; i < progressId.length; i++) {
                if (oliginalActiveTests.includes(progressId[i].test_id) && type !== 'DNSTxxxx') {
                    const index = dataTest.map((item) => item.test_id).indexOf(progressId[i].test_id);
                    if (index !== -1) {
                        keeperType = dataTest[index].type;
                        break;
                    }
                }
            }
            if (keeperType !== '') {
                dataTest = dataTest.filter((item) => item.type.includes(keeperType));
            } else {
                dataTest = dataTest.filter((item) => item.type.includes(originalActiveTypes[0]));
            }
        }
        for (let i = 0; i < dataTest.length; i++) {
            testArray.push(dataTest[i].test_id);
        }
        progressId = progressId.filter((e) => testArray.includes(e.test_id));
        if (!progressId || !progressId.length) {
            progress = 1;
        }
        let isCompleted = false;
        let subscriptionId;
        if (progressId && progressId[0]) {
            subscriptionId = await TestSeries.getTestSeriesData(db.mysql.read, studentId, progressId[0].test_id);
            if (subscriptionId && subscriptionId[0]) {
                for (let j = 0; j < subscriptionId.length; j++) {
                    if (subscriptionId && subscriptionId[j] && subscriptionId[j].status === 'COMPLETED') {
                        subscriptionId = [subscriptionId[j]];
                        isCompleted = true;
                        break;
                    }
                }
            }
            testId = progressId[0].test_id;
            if (progressId[0].progress_id == 2 && ((subscriptionId && subscriptionId[0] && subscriptionId[0].status !== 'COMPLETED') || (!subscriptionId || subscriptionId.length === 0))) {
                progress = 2;
            } else if (progressId[0].progress_id == 2 && subscriptionId && subscriptionId[0] && subscriptionId[0].status === 'COMPLETED') {
                progress = 3;
            } else if (progressId[0].progress_id == 4) {
                progress = 4;
            }
        }
        if (changeTest === 'true' || changeTest === true) {
            progress = 1;
        }
        if (testIdResult !== 0) {
            progress = 4;
            testId = testIdResult;
        }
        // For testing purpose only
        if (progressId && progressId[0] && progressId[0].progress_id == 3) {
            progress = 3;
        }
        let page;
        if (progress === 1) {
            let newAdCheck = false;
            let filterdTest = [];
            for (const value of dataTest) {
                if (value.target_group_id) {
                    // eslint-disable-next-line no-await-in-loop
                    newAdCheck = await TGHelper.targetGroupCheck({
                        db, studentId, tgID: value.target_group_id, studentClass, locale, adType: null,
                    });
                    if (newAdCheck) {
                        filterdTest.push(value);
                    }
                } else {
                    filterdTest.push(value);
                }
            }
            filterdTest.sort((a, b) => a.priority - b.priority);
            const newData = filterdTest.filter((item) => item.test_class == studentClass);
            const upperClassData = filterdTest.filter((item) => item.test_class == (parseInt(studentClass) + 1));
            filterdTest = filterdTest.filter((item) => item.test_class != studentClass);
            filterdTest = filterdTest.filter((item) => item.test_class != (parseInt(studentClass) + 1));
            let reorder = newData;
            if (upperClassData && upperClassData.length > 0) {
                reorder = newData.concat(upperClassData);
            }
            filterdTest = reorder.concat(filterdTest);
            if (filterdTest[0].type.includes('NKC')) {
                locale = 'en';
            }
            page = 'registration';
            const videoWidget = await getVideoResources(db, config, locale, filterdTest, page);
            stickyWidget.push(videoWidget);
            const progressWidget = schHelper.getProgressWidget(progress, locale);
            stickyWidget.push(progressWidget);
            const bannerWidget = await getBannerWidget(db, filterdTest, progress, locale, null);
            if (bannerWidget && bannerWidget[0]) {
                widget.push(bannerWidget);
            }
            const testDetailsWidget = schHelper.getTestDetails(studentId, filterdTest, locale);
            widget.push(testDetailsWidget);
            const referralWidget = schHelper.getReferralWidget(filterdTest, locale);
            widget.push(referralWidget);
            // const awardedStudentsWidget = await getAwardedStudentsWidget(db, locale, filterdTest);
            const awardedStudentsWidget = [];
            if (awardedStudentsWidget && awardedStudentsWidget.data && awardedStudentsWidget.data.items && awardedStudentsWidget.data.items.length) {
                widget.push(awardedStudentsWidget);
            }
            let prevTestWidget;
            // Don't show for previous test for NKC
            if (!filterdTest[0].type.includes('NKC')) {
                prevTestWidget = await getPrevTestWidget(db, studentId, locale);
            }
            if (prevTestWidget && prevTestWidget.data && prevTestWidget.data.items && prevTestWidget.data.items.length) {
                widget.push(prevTestWidget);
            }
            const faqWidget = await scholarshipV1.getFaqLanding(db, locale, filterdTest[0].faq_bucket);
            if (faqWidget && faqWidget.data && faqWidget.data.items && faqWidget.data.items.length) {
                const faqFinalWidget = schHelper.getFaqFinalWidget(faqWidget);
                widget.push(faqFinalWidget);
            }
            const responseData = {
                meta: {
                    code: 200,
                    message: 'success',
                },
                data: {
                    title: filterdTest[0].type.includes('NKC') ? 'Target JEE 2023 Scholarship Test' : 'DNST(Doubtnut Scholarship Test)',
                    title_text_size: '18',
                    title_text_color: '#272727',
                    highlight_color: '',
                    bg_color: '#ffffff',
                    sticky_widgets: stickyWidget,
                    widgets: widget,
                    progress: 1,
                    scholarship_test_id: type,
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (progress === 2) {
            const filterdTest = dataTest.filter((item) => item.test_id === +testId);
            if (filterdTest[0].type.includes('NKC')) {
                locale = 'en';
            }
            page = 'start';
            const progressWidget = schHelper.getProgressWidget(progress, locale);
            stickyWidget.push(progressWidget);
            const bannerWidget = await getBannerWidget(db, filterdTest, progress, locale, null);
            if (bannerWidget && bannerWidget.data && bannerWidget.data.items && bannerWidget.data.items.length) {
                widget.push(bannerWidget);
            }
            const textWidget = schHelper.getTextWidget(filterdTest, locale, progress, null, null);
            widget.push(textWidget);
            const progressCardWidget = schHelper.getProgressCardWidget(filterdTest, locale, progress, studentId);
            widget.push(progressCardWidget);
            const referralWidget = schHelper.getReferralWidget(filterdTest, locale);
            widget.push(referralWidget);
            // const awardedStudentsWidget = await getAwardedStudentsWidget(db, locale, filterdTest);
            const awardedStudentsWidget = [];
            if (awardedStudentsWidget && awardedStudentsWidget.data && awardedStudentsWidget.data.items && awardedStudentsWidget.data.items.length) {
                widget.push(awardedStudentsWidget);
            }

            const freeClassCarouselWidget = await schHelper.getFreeClassCarouselWidget(db, filterdTest, filterdTest[0].test_class, studentId, filterdTest[0].test_locale, locale, versionCode1, true);
            widget.push(...freeClassCarouselWidget);
            let prevTestWidget;
            // Don't show for previous test for NKC
            if (!filterdTest[0].type.includes('NKC')) {
                prevTestWidget = await getPrevTestWidget(db, studentId, locale);
            }
            if (prevTestWidget && prevTestWidget.data && prevTestWidget.data.items && prevTestWidget.data.items.length) {
                widget.push(prevTestWidget);
            }
            const practiceWidget = schHelper.getPracticeWidget(filterdTest, locale);
            if (practiceWidget && practiceWidget.data && practiceWidget.data.items && practiceWidget.data.items.length) {
                widget.push(practiceWidget);
            }
            const faqWidget = await scholarshipV1.getFaqLanding(db, locale, filterdTest[0].faq_bucket);
            if (faqWidget && faqWidget.data && faqWidget.data.items && faqWidget.data.items.length) {
                const faqFinalWidget = schHelper.getFaqFinalWidget(faqWidget);
                widget.push(faqFinalWidget);
            }
            const startButtonWidget = schHelper.getButtonWidget(filterdTest, locale, progress, null, studentId);
            footerWidget.push(startButtonWidget);
            let reload = moment(filterdTest[0].publish_time).subtract(5, 'hours').subtract(45, 'minutes').format();
            if (moment().isAfter(reload)) {
                reload = moment(filterdTest[0].publish_time).subtract(5, 'hours').subtract(30, 'minutes').format();
            }
            const responseData = {
                meta: {
                    code: 200,
                    message: 'success',
                },
                data: {
                    title: filterdTest[0].type.includes('NKC') ? 'Target JEE 2023 Scholarship Test' : 'DNST(Doubtnut Scholarship Test)',
                    title_text_size: '18',
                    title_text_color: '#272727',
                    bg_color: '#ffffff',
                    start_time_in_millis: moment(reload).diff(moment()),
                    sticky_widgets: stickyWidget,
                    widgets: widget,
                    footer_widgets: footerWidget,
                    progress: 2,
                    scholarship_test_id: type,
                    test_id: filterdTest[0].test_id,
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (progress === 3) {
            const filterdTest = dataTest.filter((item) => item.test_id === +testId);
            if (filterdTest[0].type.includes('NKC')) {
                locale = 'en';
            }
            page = 'wait';
            const videoWidget = await getVideoResources(db, config, locale, filterdTest, page);
            stickyWidget.push(videoWidget);
            const progressWidget = schHelper.getProgressWidget(progress, locale);
            stickyWidget.push(progressWidget);
            const bannerWidget = await getBannerWidget(db, filterdTest, progress, locale, null);
            if (bannerWidget && bannerWidget.data && bannerWidget.data.items && bannerWidget.data.items.length) {
                widget.push(bannerWidget);
            }
            const textWidget = schHelper.getTextWidget(filterdTest, locale, progress, null, null);
            widget.push(textWidget);
            const progressCardWidget = schHelper.getProgressCardWidget(filterdTest, locale, progress);
            widget.push(progressCardWidget);
            const answerButtonWidget = schHelper.getButtonWidget(filterdTest, locale, progress, null);
            if (answerButtonWidget && answerButtonWidget.data) {
                widget.push(answerButtonWidget);
            }
            const heading = 'popular';
            const popularHeadingWidget = schHelper.getTextWidget(filterdTest, locale, progress, heading, null);
            widget.push(popularHeadingWidget);
            const versionCode = 880;
            const popularCourses = await getCourseData(db, studentClass, config, versionCode, studentId, locale, xAuthToken, null, filterdTest);
            const popularCoursesWidget = schHelper.getPopularCoursesWidget(popularCourses, filterdTest);
            if (popularCoursesWidget && popularCoursesWidget.data && popularCoursesWidget.data.items && popularCoursesWidget.data.items.length) {
                widget.push(popularCoursesWidget);
            }
            const faqWidget = await scholarshipV1.getFaqLanding(db, locale, filterdTest[0].faq_bucket);
            if (faqWidget && faqWidget.data && faqWidget.data.items && faqWidget.data.items.length) {
                const faqFinalWidget = schHelper.getFaqFinalWidget(faqWidget);
                widget.push(faqFinalWidget);
            }
            const responseData = {
                meta: {
                    code: 200,
                    message: 'success',
                },
                data: {
                    title: filterdTest[0].type.includes('NKC') ? 'Target JEE 2023 Scholarship Test' : 'DNST(Doubtnut Scholarship Test)',
                    title_text_size: '18',
                    title_text_color: '#272727',
                    bg_color: '#ffffff',
                    sticky_widgets: stickyWidget,
                    widgets: widget,
                    progress: 3,
                    scholarship_test_id: type,
                    test_id: filterdTest[0].test_id,
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (progress === 4) {
            const filterdTest = dataTest.filter((item) => item.test_id === +testId);
            if (filterdTest[0].type.includes('NKC')) {
                locale = 'en';
            }
            widget.push({
                type: 'widget_scholarship_tabs',
                data: {
                    items: [{
                        title: (locale === 'hi') ? 'मेरा परिणाम' : 'My Result',
                        is_selected: true,
                        widgets: [],
                    },
                    {
                        title: (locale === 'hi') ? 'लीडर बोर्ड' : 'Leader Board',
                        widgets: [],
                    }],
                },
                layout_config: {
                    margin_top: 12,
                    margin_left: 0,
                    margin_right: 0,
                    margin_bottom: 0,
                },
            });
            const studentResult = await CourseMysqlV2.getScholarshipTestResult(db.mysql.read, studentId, filterdTest[0].test_id);
            page = 'result';
            const videoWidget = await getVideoResources(db, config, locale, filterdTest, page);
            stickyWidget.push(videoWidget);
            const progressWidget = schHelper.getProgressWidget(progress, locale);
            stickyWidget.push(progressWidget);
            const bannerWidget = await getBannerWidget(db, filterdTest, progress, locale, studentResult);
            if (bannerWidget && bannerWidget.data && bannerWidget.data.items && bannerWidget.data.items.length) {
                widget.unshift(bannerWidget);
            }
            const textWidget2 = schHelper.getTextWidget(filterdTest, locale, progress, 'number', mobile);
            widget.unshift(textWidget2);
            const textWidget1 = schHelper.getTextWidget(filterdTest, locale, progress, 'date', null);
            widget.unshift(textWidget1);
            const reportCardData = await scholarshipV1.getTestReportCard(db, filterdTest, subscriptionId, locale, studentResult);
            const reportCardWidget = schHelper.getReportCardWidget(filterdTest, reportCardData, locale, isCompleted);
            widget[3].data.items[0].widgets.push(reportCardWidget);
            const versionCode = 880;
            const popularCourses = await getCourseData(db, studentClass, config, versionCode, studentId, locale, xAuthToken, studentResult, filterdTest);
            const popularCoursesWidget = schHelper.getPopularCoursesWidget(popularCourses, filterdTest);
            if (popularCoursesWidget && popularCoursesWidget.data && popularCoursesWidget.data.items && popularCoursesWidget.data.items.length) {
                widget[3].data.items[0].widgets.push(popularCoursesWidget);
            }
            let leaderBoardTestIds;
            if (filterdTest[0].other_result_tests !== '' && filterdTest[0].other_result_tests !== null) {
                leaderBoardTestIds = filterdTest[0].other_result_tests.split('||');
            } else {
                leaderBoardTestIds = [`${filterdTest[0].test_id}`];
            }
            const rankData = await getLeaderBoard(db, studentId, filterdTest[0].test_id, leaderBoardTestIds, locale, subscriptionId);
            const leaderboardWidget = schHelper.getLeaderboardWidget(rankData[0]);
            if (leaderboardWidget[0].data.items.length) {
                widget[3].data.items[1].widgets.push(leaderboardWidget[0]);
            }
            for (let i = 0; i < leaderboardWidget[1].length; i++) {
                widget[3].data.items[1].widgets.push(leaderboardWidget[1][i]);
            }
            const bottomDataWidget = schHelper.getBottomDataWidget(rankData[1], studentId);
            widget[3].data.items[1].bottom_data = bottomDataWidget;
            const faqWidget = await scholarshipV1.getFaqLanding(db, locale, filterdTest[0].faq_bucket);
            if (faqWidget && faqWidget.data && faqWidget.data.items && faqWidget.data.items.length) {
                const faqFinalWidget = schHelper.getFaqFinalWidget(faqWidget);
                widget.push(faqFinalWidget);
            }
            const viewallButtonWidget = schHelper.getButtonWidget(filterdTest, locale, progress, studentResult);
            footerWidget.push(viewallButtonWidget);
            const responseData = {
                meta: {
                    code: 200,
                    message: 'success',
                },
                data: {
                    title: filterdTest[0].type.includes('NKC') ? 'Target JEE 2023 Scholarship Test' : 'DNST(Doubtnut Scholarship Test)',
                    title_text_size: '18',
                    title_text_color: '#272727',
                    bg_color: '#ffffff',
                    sticky_widgets: stickyWidget,
                    widgets: widget,
                    footer_widgets: footerWidget,
                    progress: 4,
                    scholarship_test_id: type,
                    test_id: filterdTest[0].test_id,
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);
    }
}

async function registerTest(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId, mobile } = req.user;
        const { test_id: testId } = req.body;
        const config = req.app.get('config');
        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';
        const responseData = {
            meta: {
                code: 200,
            },
        };
        let progressId = 2;
        let defaultCoupon;
        let discountPercent;
        const testArray = [];
        let dataTest = await CourseContainerV2.getScholarshipExams(db);
        const textData = dataTest.filter((item) => item.test_id == testId);
        if (textData[0].type.includes('NKC')) {
            locale = 'en';
        }
        dataTest = dataTest.filter((item) => item.type.includes(textData[0].type));
        for (let i = 0; i < dataTest.length; i++) {
            testArray.push(dataTest[i].test_id);
        }
        let testdata = await CourseMysqlV2.getScholarshipTest(db.mysql.read, studentId);
        testdata = testdata.filter((e) => testArray.includes(e.test_id));
        let oldTestId;
        if (testdata && testdata[0]) {
            oldTestId = testdata[0].test_id;
        } else {
            oldTestId = [];
        }
        const timeEnd = moment.duration('05:30:00');
        const start = moment(textData[0].result_time).subtract(timeEnd).format();
        const testStartTime = moment(textData[0].publish_time).subtract(timeEnd).format();
        let lateReg = false;
        if (moment().isAfter(start)) {
            progressId = 4;
            lateReg = true;
        }
        defaultCoupon = textData[0].default_coupon_after.split('||')[0];
        discountPercent = textData[0].default_coupon_after.split('||')[1];
        const date = `${textData[0].test_date} ${textData[0].test_time}`;
        const branchLinkSMS = textData[0].sms_branchlink;
        const notificationDeeplink = `scholarship_test_${textData[0].type}`;
        const notificationPayload = {
            event: 'course_details',
            title: (locale === 'hi') ? `आपने ${textData[0].test_name.replace(/\n/g, ' ')} स्कॉलरशिप परीक्षा के लिए रजिस्टर किया है|` : `Aapne ${textData[0].test_name.replace(/\n/g, ' ')} scholarship test ke liye register kiya hai.`,
            message: (locale === 'hi') ? `आपकी परीक्षा ${date} को है|` : `Aapka test ${date} ko hai.`,
            firebase_eventtag: 'dnst_scholarship',
            s_n_id: 'Dnst_successful_registration',
            data: JSON.stringify({
                id: notificationDeeplink,
            }),
        };
        if (textData[0].type.includes('NKC')) {
            notificationPayload.title = `You have Registered for the ${textData[0].test_name.replace(/\n/g, ' ')} Scholarship Test.`;
            notificationPayload.message = `Your test is on ${date}.`;
        }
        // forcing locale change to english for SMS
        locale = 'en';
        const messageSMS = getShareMessageSMS(locale, textData, branchLinkSMS, date);
        if (testdata && testdata[0] && testdata[0].test_id == testId) {
            responseData.meta.message = 'Already Registered';
            responseData.data = { message: 'Already Registered' };
        } else if (testdata && testdata[0] && testdata[0].test_id != testId) {
            if (lateReg) {
                CourseMysqlV2.updateScholarshipTestLate(db.mysql.write, studentId, +testId, oldTestId, defaultCoupon, discountPercent);
            } else {
                CourseMysqlV2.updateScholarshipTest(db.mysql.write, studentId, +testId, oldTestId, progressId, defaultCoupon, discountPercent);
            }
            responseData.meta.message = 'success';
            responseData.data = { message: 'Test Changed Successfully' };
            newtonNotifications.sendNotification(studentId, notificationPayload, db.mysql.read);
            Utility.sendSMSToReferral(config, { mobile, message: messageSMS, locale }, true);
        } else {
            if (progressId !== 4 && moment().isBefore(testStartTime)) {
                defaultCoupon = textData[0].default_coupon_before.split('||')[0];
                discountPercent = textData[0].default_coupon_before.split('||')[1];
            }
            responseData.meta.message = 'success';
            responseData.data = { message: 'Registration Successful' };
            newtonNotifications.sendNotification(studentId, notificationPayload, db.mysql.read);
            Utility.sendSMSToReferral(config, { mobile, message: messageSMS, locale }, true);
            CourseMysqlV2.addScholarshipTest(db.mysql.write, studentId, +testId, progressId, defaultCoupon, discountPercent);
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getDetails,
    registerTest,
};
