const _ = require('lodash');
const moment = require('moment');
const base64 = require('base-64');
const Faq = require('../../../modules/mysql/faq');
const AnswerContainer = require('../../v13/answer/answer.container');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const TestSeries = require('../../../modules/mysql/testseries');
const TestQuestions = require('../../../modules/mysql/testquestions');
const TestSections = require('../../../modules/mysql/testsections');
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const courseRedis = require('../../../modules/redis/coursev2');
const courseHelper = require('../../helpers/course');
const boardData = require('../../../data/data');
const { generateDeeplinkFromAppDeeplink } = require('../../../modules/utility');
const Utility = require('../../../modules/utility');
const newtonNotifications = require('../../../modules/newtonNotifications');
const TGHelper = require('../../helpers/target-group');

async function getFaq(db, config, locale, faqBucket) {
    let bucketNames = [`${faqBucket}`];
    bucketNames = bucketNames.map((item) => {
        if (/^'.*'$/.test(item) || item === 'all') {
            return item;
        }
        return `${item}`;
    });
    const versionCode = 850;
    let faqData = await Faq.getByLocale(db.mysql.read, bucketNames, locale, versionCode);
    const headers = faqData.filter((item) => item.type === 'header');
    faqData = faqData.map((item, index) => {
        if (index === 1) {
            item.is_expand = true;
        }
        return item;
    });
    faqData = faqData.filter((item) => item.type !== 'header');
    const newData = faqData.map((item) => ({
        id: item.id,
        bucket: item.bucket,
        question: item.question,
        type: item.type,
        answer: item.answer,
        is_expand: item.is_expand || false,
    }));
    const defaultFAQHeader = {
        hi: 'सबसे ज़्यादा पूछे जाने वाले सवाल',
        en: 'FAQ',
    };
    const header = bucketNames.length > 1 || bucketNames[0] === 'all' || !_.get(headers[0], 'question', false) ? defaultFAQHeader[locale] : headers[0].question;
    const widgets = [];
    widgets.push({
        header,
        widget_type: 'faq',
        widget_data: {
            faq_list: newData,
        },
    });
    return widgets;
}

async function getFaqLanding(db, locale, faqBucket) {
    let bucketNames = [`${faqBucket}_app`];
    bucketNames = bucketNames.map((item) => {
        if (/^'.*'$/.test(item) || item === 'all') {
            return item;
        }
        return `${item}`;
    });
    const versionCode = 850;
    let faqData = await Faq.getByLocale(db.mysql.read, bucketNames, locale, versionCode);
    const headers = faqData.filter((item) => item.type === 'header');
    faqData = faqData.map((item, index) => {
        if (index === 1) {
            item.toggle = true;
        }
        return item;
    });
    faqData = faqData.filter((item) => item.type !== 'header');
    const newData = faqData.map((item) => ({
        title: item.question,
        description: item.answer,
        toggle: item.toggle || false,
    }));
    const defaultFAQHeader = {
        hi: 'सबसे ज़्यादा पूछे जाने वाले सवाल',
        en: 'FAQ',
    };
    let defaultFAQDescription = {
        hi: 'जाने और डिटेल्स',
        en: 'Jane aur details',
    };
    if (faqBucket.includes('NKC')) {
        defaultFAQDescription = {
            hi: 'Frequently Asked Questions',
            en: 'Frequently Asked Questions',
        };
    }
    const header = bucketNames.length > 1 || bucketNames[0] === 'all' || !_.get(headers[0], 'question', false) ? defaultFAQHeader[locale] : headers[0].question;
    return {
        type: 'course_faqs',
        data: {
            title: header,
            description: defaultFAQDescription[locale],
            bottom_text: global.t8[locale].t('More questions'),
            toggle: true,
            see_more_text: global.t8[locale].t('See all FAQs'),
            items: newData,
        },
    };
}

function getShareMessage(locale, sharelink, testDate) {
    let message;
    const shareMessageObj = {
        locale,
        shareLink: sharelink,
        testDate: testDate[0].test_date,
        interviewDate: testDate[0].interview_date,
        batchDate: testDate[0].batch_date,
    };
    if (testDate[0].type.includes('DNST')) {
        message = boardData.scholarshipShareMessage(shareMessageObj).DNST;
    } else if (testDate[0].type.includes('TALENT')) {
        message = boardData.scholarshipShareMessage(shareMessageObj).TALENT;
    } else {
        message = boardData.scholarshipShareMessage(shareMessageObj).OTHER;
    }
    return message;
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
    const videoDetails = {};
    let questionId;
    let index;
    if (locale === 'hi') {
        videoDetails.thumbnail = `${filterdTest[0].video_thumbnail.split('||')[0]}`;
        if (page === 'registration') {
            index = 0;
        } else if (page === 'start') {
            index = 2;
        } else if (page === 'wait') {
            index = 4;
        } else if (page === 'result') {
            index = 6;
        } else if (page === 'round2reg') {
            index = 8;
        } else if (page === 'round2start') {
            index = 10;
        } else if (page === 'round2wait') {
            index = 12;
        } else if (page === 'round2result') {
            index = 14;
        }
        questionId = filterdTest[0].video.split('||')[index];
    } else {
        videoDetails.thumbnail = `${filterdTest[0].video_thumbnail.split('||')[1]}`;
        if (page === 'registration') {
            index = 1;
        } else if (page === 'start') {
            index = 3;
        } else if (page === 'wait') {
            index = 5;
        } else if (page === 'result') {
            index = 7;
        } else if (page === 'round2reg') {
            index = 9;
        } else if (page === 'round2start') {
            index = 11;
        } else if (page === 'round2wait') {
            index = 13;
        } else if (page === 'round2result') {
            index = 15;
        }
        questionId = filterdTest[0].video.split('||')[index];
    }
    const videoResources = await videoResource(db, config, questionId);
    videoDetails.video_resources = videoResources;
    return videoDetails;
}

function getShareLink(config, locale, testDate) {
    const shareBranchLink = testDate[0].share_branchlink;
    return getShareMessage(locale, shareBranchLink, testDate);
}

async function getCourseData(db, studentClass, config, versionCode, studentId, locale, xAuthToken, couponCode, testDetails) {
    const page = 'SCHOLARSHIP_PAGE';
    const assortmentList = [];
    const studentCcmAssortments = [];
    let data = [];
    let assortmentID = [];
    let classStudent;
    if (testDetails && testDetails[0]) {
        if (testDetails[0].assortment_ids) {
            assortmentID = testDetails[0].assortment_ids.split('||');
            classStudent = testDetails[0].assortment_class;
        } else if (testDetails[0].assortment_ids2) {
            assortmentID = testDetails[0].assortment_ids2.split('||');
            classStudent = testDetails[0].assortment_class;
        }
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
        // const studentAssortments = await CourseMysqlV2.
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
        let newDeeplink;
        // generalise later
        let campaignName;
        if (testDetails[0].type.includes('DNST')) {
            campaignName = `${testDetails[0].type}_WEB`;
        } else {
            campaignName = `${testDetails[0].type}_DNST_WEB`;
        }
        if (hasCoupon) {
            // eslint-disable-next-line no-await-in-loop
            const newDeeplink2 = await courseRedis.getScholarshipPopularCourseCoupon(db.redis.read, value.data.assortment_id, couponCode[0].coupon_code);
            newDeeplink = JSON.parse(newDeeplink2);
            if (!newDeeplink) {
                // eslint-disable-next-line no-await-in-loop
                newDeeplink = await generateDeeplinkFromAppDeeplink(config.branch_key, `POPULAR_COURSE_${value.data.assortment_id}`, campaignName, courseDeeplink);
                courseRedis.setScholarshipPopularCourseCoupon(db.redis.read, value.data.assortment_id, newDeeplink, couponCode[0].coupon_code);
            }
        } else {
            // eslint-disable-next-line no-await-in-loop
            const newDeeplink2 = await courseRedis.getScholarshipPopularCourse(db.redis.read, value.data.assortment_id);
            newDeeplink = JSON.parse(newDeeplink2);
            if (!newDeeplink) {
                // eslint-disable-next-line no-await-in-loop
                newDeeplink = await generateDeeplinkFromAppDeeplink(config.branch_key, `POPULAR_COURSE_${value.data.assortment_id}`, campaignName, courseDeeplink);
                courseRedis.setScholarshipPopularCourse(db.redis.read, value.data.assortment_id, newDeeplink);
            }
        }
        value.data.deeplink = newDeeplink.url;
        value.data.buy_deeplink = newDeeplink.url;
        if (courseAssortment.includes(value.data.assortment_id)) {
            value.tab = 'Course';
        } else if (subjectAssortment.includes(value.data.assortment_id)) {
            value.tab = 'Subject';
        }
    }
    return popularCourseData.items.filter(item => Boolean(item));
}

function getShareMessageSMS(locale, textData, url, date) {
    return boardData.scholarshipShareSMS(locale, textData[0].test_name, date, url);
}

async function getTestReportCard(db, textData, subscriptionId, locale, coupon) {
    const testSections = await TestSections.getTestSectionByTestSeriesId(db.mysql.read, textData[0].test_id);
    const groupedTestSections = _.groupBy(testSections, 'section_code');
    let sectionMeta;
    let total;
    let eligible;
    let sectionHeading;
    if (subscriptionId && subscriptionId[0] && subscriptionId[0].status === 'COMPLETED') {
        const result = await TestSeries.getResultByTestSubscriptionId(db.mysql.write, subscriptionId[0].id);
        const reportCard = await TestSeries.getRepostCardByTestSubscriptionId(db.mysql.write, subscriptionId[0].id);
        const resultGrouped = _.groupBy(result, 'questionbank_id');
        const testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, textData[0].test_id);
        const questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',');
        const questionsOptionData = await TestQuestions.getAllOptionsByQuestionIds(db.mysql.read, questionBankKeysString);
        const questionsOptionDataGrouped = _.groupBy(questionsOptionData, 'questionbank_id');
        const questionWiseResult = [];
        _.forEach(testQuestionsData, (question) => {
            const questionOptions = questionsOptionDataGrouped[question.questionbank_id];
            const questionResult = resultGrouped[question.questionbank_id][0];
            const questionResultOptions = _.split(questionResult.response_options, ',');
            for (let i = questionOptions.length - 1; i >= 0; i--) {
                if (question.type == 'TEXT') {
                    questionOptions[i].title = questionResultOptions[0];
                    questionOptions[i].is_selected = 1;
                } else if (_.includes(questionResultOptions, questionOptions[i].option_code)) {
                    // Is Selected
                    //
                    questionOptions[i].is_selected = 1;
                } else {
                    questionOptions[i].is_selected = 0;
                }
            }
            question.is_correct = questionResult.is_correct;
            question.marks_scored = questionResult.marks_scored;

            question.options = questionOptions;
            question.is_skipped = questionResult.is_skipped;
            question.marks_scored = questionResult.marks_scored;
            question.section_title = groupedTestSections[question.section_code][0].title;
            questionWiseResult.push(question);
        });
        const groupedformatedData = _.groupBy(questionWiseResult, 'section_code');
        sectionMeta = _.map(testSections, (section) => {
            section.correct = _.sumBy(groupedformatedData[section.section_code], 'is_correct');
            section.skipped = _.sumBy(groupedformatedData[section.section_code], 'is_skipped');
            section.marks_scored = _.sumBy(groupedformatedData[section.section_code], 'marks_scored');
            section.incorrect = groupedformatedData[section.section_code].length - section.correct - section.skipped;
            delete section.section_code;
            delete section.title;
            return section;
        });
        if (locale === 'hi') {
            for (const value of sectionMeta) {
                if (value.description.toLowerCase() === 'biology') value.description = 'जीवविज्ञान';
                else if (value.description.toLowerCase() === 'chemistry') value.description = 'रसायन विज्ञान';
                else if (value.description.toLowerCase() === 'maths') value.description = 'गणित';
                else if (value.description.toLowerCase() === 'physics') value.description = 'भौतिक विज्ञान';
                else if (value.description.toLowerCase() === 'social science') value.description = 'सामाजिक विज्ञान';
                else if (value.description.toLowerCase() === 'science') value.description = 'विज्ञान';
                else if (value.description.toLowerCase() === 'aptitude') value.description = 'एप्टीट्यूड';
            }
        }
        let correct = reportCard[0].correct.split(',');
        correct = correct.filter((item) => item !== '');
        let incorrect = reportCard[0].incorrect.split(',');
        incorrect = incorrect.filter((item) => item !== '');
        let skipped = reportCard[0].skipped.split(',');
        skipped = skipped.filter((item) => item !== '');
        total = {
            description: global.t8[locale].t('Total'),
            correct: correct.length,
            incorrect: incorrect.length,
            skipped: skipped.length,
            marks_scored: reportCard[0].totalscore,
        };
        sectionMeta.unshift(total);
        let minutes = 0;
        let seconds = 0;
        if (coupon && coupon[0] && coupon[0].time_taken !== null) {
            const timeTaken = coupon[0].time_taken;
            minutes = Math.floor(parseInt(timeTaken) / 60);
            seconds = parseInt(timeTaken) - minutes * 60;
        }
        eligible = [{
            time_heading: global.t8[locale].t('Time Taken:'),
            time: ` ${minutes} min ${seconds} sec`,
            score_heading: global.t8[locale].t('Eligible score:'),
            score: ` ${reportCard[0].eligiblescore}`,
        }];
        sectionHeading = [global.t8[locale].t('Correct'), global.t8[locale].t('Incorrect'), global.t8[locale].t('Skipped'), global.t8[locale].t('Score')];
        return { sections: sectionMeta, eligibleSection: eligible, sectionHeading };
    }
    sectionMeta = _.map(testSections, (section) => {
        section.correct = 0;
        section.incorrect = 0;
        section.skipped = 0;
        section.marks_scored = 0;
        delete section.section_code;
        delete section.title;
        return section;
    });
    if (locale === 'hi') {
        for (let i = 0; i < sectionMeta.length; i++) {
            if (sectionMeta[i].description.toLowerCase() === 'biology') sectionMeta[i].description = 'जीवविज्ञान';
            else if (sectionMeta[i].description.toLowerCase() === 'chemistry') sectionMeta[i].description = 'रसायन विज्ञान';
            else if (sectionMeta[i].description.toLowerCase() === 'maths') sectionMeta[i].description = 'गणित';
            else if (sectionMeta[i].description.toLowerCase() === 'physics') sectionMeta[i].description = 'भौतिक विज्ञान';
            else if (sectionMeta[i].description.toLowerCase() === 'social science') sectionMeta[i].description = 'सामाजिक विज्ञान';
            else if (sectionMeta[i].description.toLowerCase() === 'science') sectionMeta[i].description = 'विज्ञान';
            else if (sectionMeta[i].description.toLowerCase() === 'aptitude') sectionMeta[i].description = 'एप्टीट्यूड';
        }
    }
    total = {
        description: global.t8[locale].t('Total'),
        correct: 0,
        incorrect: 0,
        skipped: 0,
        marks_scored: 0,
    };
    sectionMeta.unshift(total);
    eligible = [{
        time_heading: global.t8[locale].t('Time Taken'),
        time: '--',
        score_heading: global.t8[locale].t('Eligible score'),
        score: 0,
    }];
    sectionHeading = [global.t8[locale].t('Correct'), global.t8[locale].t('Incorrect'), global.t8[locale].t('Skipped'), global.t8[locale].t('Score')];
    return { sections: sectionMeta, eligibleSection: eligible, sectionHeading };
}

function leaderboardStudents(leaderboard, type, testDetail) {
    const leaderBoard = [];
    if (leaderboard && leaderboard[0]) {
        for (const value of leaderboard) {
            const sli = value.mobile.slice(0, 6);
            const phone = value.mobile.replace(sli, 'xxxxxx');
            let userName;
            if (value.student_fname !== null) {
                if (value.student_lname !== null) {
                    userName = `${value.student_fname} ${value.student_lname}`;
                    userName = userName.replace(/\n/g, ' ');
                } else {
                    userName = `${value.student_fname}`;
                }
            } else {
                userName = 'No-name';
            }
            if (value.use_name == 1 || userName === 'No-name') {
                userName = phone;
            }
            if (type === 'all') {
                const test = testDetail.filter((e) => e.test_id == value.test_id);
                let scholarship;
                let testNames;
                if (test && test[0]) {
                    const number = test[0].type.match(/[a-z]+|[^a-z]+/gi)[1];
                    scholarship = `Scholarship test ${number}`;
                    testNames = test[0].test_name.replace(/\n/g, ' ').replace(/\r/g, ' ');
                } else {
                    scholarship = '';
                    testNames = '';
                }
                leaderBoard.push({
                    rank: `${value.rank}`,
                    image: value.img_url ? value.img_url : null,
                    name: userName,
                    reward: `${value.discount_percent}% Scholarship`,
                    testName: testNames,
                    scholarshipName: scholarship,
                });
            } else {
                leaderBoard.push({
                    rank: `${value.rank}`,
                    image: value.img_url ? value.img_url : null,
                    moblie: phone,
                    name: userName,
                    marks: value.marks || '',
                    studentId: value.student_id,
                });
            }
        }
    }
    return leaderBoard;
}

async function getLeaderBoard(db, studentId, testId, leaderboardIds, locale, subscriptionId) {
    const leaderboard = await CourseContainerV2.getScholarshipLeaderByTest(db, leaderboardIds);
    const studentRanking = await CourseMysqlV2.getStudentScholarshipRank(db.mysql.read, testId, studentId);
    const type = 'single';
    const leaderBoard = leaderboardStudents(leaderboard, type);
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
            rankText = global.t8[locale].t('Not eligible<br/>Aapne yeh test late start kiya hai');
        } else {
            rankText = global.t8[locale].t('Not Eligible<br/>Aapne yeh test nahi diya hai');
        }
        studentRank = [{
            rank: studentRanking[0].rank && studentRanking[0].marks !== null ? `${studentRanking[0].marks}` : rankText,
            image: studentRanking[0].img_url ? studentRanking[0].img_url : '',
            moblie: phone,
            name: userName,
            marks: studentRanking[0].marks !== null && studentRanking[0].rank ? `${studentRanking[0].rank}` : '00',
        }];
    }
    return [leaderBoard, studentRank];
}

async function getOldResults(db, activeTest) {
    let { type } = activeTest[0];
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
            const typeLeader = 'all';
            const leaderBoard = leaderboardStudents(leaderboard, typeLeader, oldTests);
            finalLeaderboard = finalLeaderboard.concat(leaderBoard);
        }
    }
    return finalLeaderboard;
}

async function getOldTestResources(db, studentId, locale) {
    const oldTestData = await CourseMysqlV2.getOldTestData(db.mysql.read, studentId);
    const oldTestResources = [];
    let oldTestHeading;
    if (oldTestData && oldTestData[0]) {
        for (const value of oldTestData) {
            let attempt;
            if (value.created_at) {
                const date = moment(value.created_at).format("Do MMM'YY");
                attempt = global.t8[locale].t('Attempted on -  {{date}}', { date });
            } else {
                attempt = global.t8[locale].t("You didn't attempt this test");
            }
            oldTestResources.push({
                test_name: value.test_name,
                marks: global.t8[locale].t('Marks:- {{eligiblescore}} / {{totalmarks}}',{eligiblescore:value.eligiblescore,totalmarks:value.totalmarks}),
                attempted_on: attempt,
                deeplink: '',
            });
        }
        if (oldTestResources.length > 0) {
            oldTestHeading = global.t8[locale].t('Yours previous Test result');
        } else {
            oldTestHeading = '';
        }
    }
    return [oldTestResources, oldTestHeading];
}

async function getViewAllBranchLink(db, config, coupon, locale, textData) {
    if (coupon[0].coupon_code === null || coupon[0].coupon_code === '') {
        const deeplink = 'doubtnutapp://course_explore?id=0';
        return deeplink;
    }
    const id = 'Apke liye Courses';
    let filter;
    if (coupon[0].coupon_code.includes('C6')) {
        filter = `6,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C7')) {
        filter = `7,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C8')) {
        filter = `8,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C9')) {
        filter = `9,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C10')) {
        filter = `10,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C11')) {
        filter = `11,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C12B')) {
        filter = `12,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C12M')) {
        filter = `12,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('I22')) {
        filter = `IIT JEE_CT,12,2022,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('I23')) {
        filter = `IIT JEE_CT,11,2023,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('N22')) {
        filter = `NEET_CT,12,2022,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('N23')) {
        filter = `NEET_CT,11,2023,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('NDA')) {
        filter = `DEFENCE/NDA/NAVY_CT,12,$$${coupon[0].coupon_code}`;
    }
    const deeplink = `doubtnutapp://course_category?title=${id}&filters=${filter}`;
    const campaignName = `${textData[0].type}_WEB`;
    const newDeeplink2 = await courseRedis.getScholarshipViewAll(db.redis.read, coupon[0].coupon_code);
    let newDeeplink = JSON.parse(newDeeplink2);
    if (!newDeeplink) {
        // eslint-disable-next-line no-await-in-loop
        newDeeplink = await generateDeeplinkFromAppDeeplink(config.branch_key, 'CLP', campaignName, deeplink);
        courseRedis.setScholarshipViewAll(db.redis.write, coupon[0].coupon_code, newDeeplink);
    }
    return newDeeplink;
}

async function getTest(req, res, next) {
    try {
        const scholarshipData = {};
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_class: studentClass } = req.user;
        const { student_id: studentId } = req.user;
        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';
        const { source } = req.query;

        let dataTest = await CourseContainerV2.getScholarshipExams(db);
        dataTest = dataTest.filter((item) => item.type.includes(source));
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
        let stopRegistration = false;
        const testArr = [];
        filterdTest.forEach((item) => {
            testArr.push(item.test_id);
        });
        if (filterdTest && filterdTest[0]) {
            const timeAfterReg = moment.duration('05:45:00');
            const stopDuplicateReg = moment(filterdTest[0].publish_time).subtract(timeAfterReg).format();
            if (moment().isAfter(stopDuplicateReg)) {
                const studentReg = await CourseMysqlV2.getStudentRegistrationByTestIds(db.mysql.read, studentId, testArr);
                if (studentReg && studentReg.length > 0) {
                    stopRegistration = true;
                }
            }
        }
        if (filterdTest[0].type.includes('TALENT')) {
            scholarshipData.pageTopHeading = 'Doubtnut SUPER 100';
            scholarshipData.shareTextOnPage = boardData.scholarshipshareTextOnPage(locale).TALENT;
            scholarshipData.oldTestHeading = '';
            scholarshipData.oldTestResources = [];
            scholarshipData.awardedStudentsHeading = '';
            scholarshipData.awardedStudentsResources = [];
            scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Round 1 result'), global.t8[locale].t('Round 2 Registration'), global.t8[locale].t('Give interview'), global.t8[locale].t('Round 2 result')];
        } else {
            scholarshipData.pageTopHeading = 'DNST(Doubtnut Scholarship Test)';
            scholarshipData.shareTextOnPage = boardData.scholarshipshareTextOnPage(locale).DNST;
            // student's old test results
            const studentOldTestData = await getOldTestResources(db, studentId, locale);
            scholarshipData.oldTestHeading = studentOldTestData[1];
            scholarshipData.oldTestResources = studentOldTestData[0];
            // toppers list
            const oldResultsResources = await getOldResults(db, filterdTest);
            if (oldResultsResources.length > 0) {
                scholarshipData.awardedStudentsHeading = global.t8[locale].t('Awarded Students');
            } else {
                scholarshipData.awardedStudentsHeading = '';
            }
            scholarshipData.awardedStudentsResources = oldResultsResources;
            scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Win Scholarship')];
        }
        const page = 'registration';
        scholarshipData.videoDetails = await getVideoResources(db, config, locale, filterdTest, page);
        const banner = await CourseContainerV2.getScholarshipWebBanner(db, filterdTest[0].test_id, 1, locale);
        scholarshipData.banner = (banner && banner[0] && banner[0].url !== null) ? banner[0].url : '';
        scholarshipData.banner_deeplink = (banner && banner[0] && banner[0].deeplink !== null) ? banner[0].deeplink : '';
        scholarshipData.testDetails = [];
        for (const value of filterdTest) {
            if (scholarshipData.testDetails.filter((e) => e.tab_name === value.tile_tab).length > 0) {
                const index = scholarshipData.testDetails.map((e) => e.tab_name).indexOf(value.tile_tab);
                scholarshipData.testDetails[index].items.push({
                    stop_registration: stopRegistration,
                    testName: value.test_name,
                    testTime: value.test_time,
                    testDate: value.test_date,
                    test_id: value.test_id,
                    registerButtonTile: global.t8[locale].t('Register Now'),
                    registration_faq: value.registration_rules.replace(/\n/g, '<br/>'),
                });
            } else {
                scholarshipData.testDetails.push({
                    tab_name: value.tile_tab,
                    items: [{
                        testName: value.test_name,
                        testTime: value.test_time,
                        testDate: value.test_date,
                        test_id: value.test_id,
                        registerButtonTile: global.t8[locale].t('Register Now'),
                        registration_faq: value.registration_rules.replace(/\n/g, '<br/>'),
                    }],
                });
            }
        }
        scholarshipData.buttonText = global.t8[locale].t('Register Now (FREE)');

        scholarshipData.whatsappShareIcon = 'whatsapp icon';
        scholarshipData.telegramShareIcon = 'telegram icon';
        scholarshipData.shareLink = getShareLink(config, locale, filterdTest);
        scholarshipData.shareImage = locale === 'hi' ? filterdTest[0].video_thumbnail.split('||')[0] : filterdTest[0].video_thumbnail.split('||')[1];
        const timeEnd = moment.duration('05:30:00');
        const start = moment(filterdTest[0].publish_time).subtract(timeEnd).format();
        if (moment().isAfter(start)) {
            if (filterdTest[0].type.includes('TALENT')) {
                scholarshipData.registrationText = boardData.scholarship1registrationText(locale).TALENT;
            } else {
                scholarshipData.registrationText = boardData.scholarship1registrationText(locale).DNST;
            }
        } else {
            scholarshipData.registrationText = global.t8[locale].t('Select your test to register');
        }
        const widget = await getFaq(db, config, locale, filterdTest[0].faq_bucket);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                scholarshipData,
                widget,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
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
        dataTest = dataTest.filter((item) => item.type.includes(textData[0].type));
        for (const value of dataTest) {
            testArray.push(value.test_id);
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
        const date = `${textData[0].test_date} ${textData[0].test_time}`;
        const branchLinkSMS = textData[0].sms_branchlink;
        const notificationDeeplink = `scholarship_test_${textData[0].type}`;
        let head;
        if (dataTest[0].type.includes('TALENT')) {
            defaultCoupon = null;
            discountPercent = null;
            head = boardData.scholarship2head(locale, textData[0].test_name).TALENT;
        } else {
            defaultCoupon = textData[0].default_coupon_after.split('||')[0];
            discountPercent = textData[0].default_coupon_after.split('||')[1];
            head = boardData.scholarship2head(locale, textData[0].test_name).DNST;
        }
        const msg = boardData.scholarship2msg(locale, date);

        const notificationPayload = {
            event: 'course_details',
            title: head,
            message: msg,
            firebase_eventtag: 'dnst_scholarship',
            s_n_id: 'Dnst_successful_registration',
            data: JSON.stringify({
                id: notificationDeeplink,
            }),
        };
        const messageSMS = getShareMessageSMS(locale, textData, branchLinkSMS, date);
        if (testdata && testdata[0] && testdata[0].test_id == testId) {
            responseData.meta.message = 'Already Registered';
        } else if (testdata && testdata[0] && testdata[0].test_id != testId) {
            if (lateReg) {
                CourseMysqlV2.updateScholarshipTestLate(db.mysql.write, studentId, +testId, oldTestId, defaultCoupon, discountPercent);
            } else {
                CourseMysqlV2.updateScholarshipTest(db.mysql.write, studentId, +testId, oldTestId, progressId, defaultCoupon, discountPercent);
            }
            responseData.meta.message = 'success';
            newtonNotifications.sendNotification(studentId, notificationPayload, db.mysql.read);
            if (!dataTest[0].type.includes('TALENT')) {
                Utility.sendSMSToReferral(config, { mobile, message: messageSMS, locale }, true);
            }
        } else {
            if (progressId !== 4 && moment().isBefore(testStartTime) && !dataTest[0].type.includes('TALENT')) {
                defaultCoupon = textData[0].default_coupon_before.split('||')[0];
                discountPercent = textData[0].default_coupon_before.split('||')[1];
            }
            responseData.meta.message = 'success';
            newtonNotifications.sendNotification(studentId, notificationPayload, db.mysql.read);
            if (!dataTest[0].type.includes('TALENT')) {
                Utility.sendSMSToReferral(config, { mobile, message: messageSMS, locale }, true);
            }
            CourseMysqlV2.addScholarshipTest(db.mysql.write, studentId, +testId, progressId, defaultCoupon, discountPercent);
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getStartTestPage(req, res, next) {
    try {
        const scholarshipData = {};
        const db = req.app.get('db');
        const config = req.app.get('config');
        const xAuthToken = req.headers['x-auth-token'];
        const auth = base64.encode(xAuthToken);
        const { student_id: studentId } = req.user;

        const { test_id: testId } = req.query;
        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';

        const dataTest = await CourseContainerV2.getScholarshipExams(db);
        const studentRegisteration = await CourseMysqlV2.getScholarshipTestResult(db.mysql.read, studentId, testId);
        if (!studentRegisteration.length) {
            const responseData = {
                meta: {
                    code: 200,
                    message: 'Not Registerd for This Test',
                },
                data: {
                    message: 'Not Registerd for This Test',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const testseriesData = dataTest.filter((item) => item.test_id === +testId);
        const time = moment.duration('05:45:00');
        const timeEnd = moment.duration('05:30:00');
        const endtime = moment(testseriesData[0].unpublish_time).subtract(timeEnd).format();
        const timeText = moment(testseriesData[0].publish_time).subtract(15, 'minutes').format("h:mm A, Do MMM'YY");
        if (testseriesData[0].type.includes('TALENT')) {
            scholarshipData.pageTopHeading = 'Doubtnut SUPER 100';
            scholarshipData.shareTextOnPage = boardData.scholarshipshareTextOnPage(locale).TALENT;
            scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Round 1 result'), global.t8[locale].t('Round 2 Registration'), global.t8[locale].t('Give interview'), global.t8[locale].t('Round 2 result')];
            scholarshipData.oldTestHeading = '';
            scholarshipData.oldTestResources = [];
            scholarshipData.awardedStudentsHeading = '';
            scholarshipData.awardedStudentsResources = [];
        } else {
            scholarshipData.pageTopHeading = 'DNST(Doubtnut Scholarship Test)';
            scholarshipData.shareTextOnPage = boardData.scholarshipshareTextOnPage(locale).DNST;
            scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Win Scholarship')];
            // student's old test results
            const studentOldTestData = await getOldTestResources(db, studentId, locale);
            scholarshipData.oldTestHeading = studentOldTestData[1];
            scholarshipData.oldTestResources = studentOldTestData[0];
            // toppers list
            const oldResultsResources = await getOldResults(db, testseriesData);
            if (oldResultsResources.length > 0) {
                scholarshipData.awardedStudentsHeading = global.t8[locale].t('Awarded Students');
            } else {
                scholarshipData.awardedStudentsHeading = '';
            }
            scholarshipData.awardedStudentsResources = oldResultsResources;
        }
        const page = 'start';
        scholarshipData.videoDetails = await getVideoResources(db, config, locale, testseriesData, page);
        const banner = await CourseContainerV2.getScholarshipWebBanner(db, testseriesData[0].test_id, 2, locale);
        scholarshipData.banner = (banner && banner[0] && banner[0].url !== null) ? banner[0].url : '';
        scholarshipData.banner_deeplink = (banner && banner[0] && banner[0].deeplink !== null) ? banner[0].deeplink : '';
        let start;
        if (moment().isAfter(endtime)) {
            if (testseriesData[0].type.includes('TALENT')) {
                scholarshipData.registeredText = boardData.scholarship3registeredText1(locale).TALENT;
            } else {
                scholarshipData.registeredText = boardData.scholarship3registeredText1(locale).DNST;
            }
            scholarshipData.canStartTest = true;
            scholarshipData.testStartText = global.t8[locale].t('Test is live now');
            scholarshipData.buttonText = global.t8[locale].t('Start Test');
            scholarshipData.startTime = moment(testseriesData[0].publish_time).subtract(time).format();
        } else {
            if (testseriesData[0].type.includes('TALENT')) {
                scholarshipData.registeredText = boardData.scholarship3registeredText2(locale, testseriesData[0].test_name).TALENT;
            } else {
                scholarshipData.registeredText = boardData.scholarship3registeredText2(locale, testseriesData[0].test_name).DNST;
            }
            start = moment(testseriesData[0].publish_time).subtract(time).format();
            if (moment().isAfter(start) && moment().isBefore(endtime)) {
                scholarshipData.canStartTest = true;
                scholarshipData.testStartText = global.t8[locale].t('Test is live now');
                scholarshipData.buttonText = global.t8[locale].t('Start Test');
            } else {
                scholarshipData.canStartTest = false;
                scholarshipData.testStartText = global.t8[locale].t('Aapka test start hoga');
                scholarshipData.buttonText = global.t8[locale].t('Start Test ({{timeText}})', { timeText });
            }
            scholarshipData.startTime = moment(testseriesData[0].publish_time).subtract(time).format();
        }
        scholarshipData.timerWords = [global.t8[locale].t('Days'), global.t8[locale].t('Hours'), global.t8[locale].t('Min'), global.t8[locale].t('Sec')];
        scholarshipData.testDeeplink = `${testseriesData[0].test_branchlink}`;
        scholarshipData.whatsappShareIcon = 'whatsapp icon';
        scholarshipData.telegramShareIcon = 'telegram icon';
        scholarshipData.shareLink = getShareLink(config, locale, testseriesData);
        scholarshipData.shareImage = locale === 'hi' ? testseriesData[0].video_thumbnail.split('||')[0] : testseriesData[0].video_thumbnail.split('||')[1];
        scholarshipData.testName = testseriesData[0].test_name;
        let practiceList = [];
        let practiceResourceList = [];
        if (testseriesData && testseriesData[0] && testseriesData[0].resources_titles) {
            practiceList = testseriesData[0].resources_titles.split('||');
            practiceResourceList = testseriesData[0].resources.split('||');
        }
        const practiceResources = [];
        const diff = moment(endtime).diff(moment(), 'days');
        let today;
        let incr = 1;
        for (let i = 0; i < practiceList.length; i++) {
            if (i !== 0) {
                if (i > practiceList.length - diff - 1) {
                    today = moment().add(1 * incr, 'days').format('LL');
                    incr += 1;
                }
            }
            practiceResources.push({
                rescource_name: practiceList[i],
                rescource_link: practiceResourceList[i],
                available_on: today ? `Available on ${today}` : 'Opened',
                is_open: !today,
                is_video: false,
            });
        }
        // TODO :- video demo resources
        // const assortmentID = 101049;
        // const batchID = 1;
        // let data = await CourseContainerV2.getDemoVideoExperiment(db, assortmentID);
        // const batchWiseData = data.filter((item) => item.batch_id === batchID);
        // data = batchWiseData.length ? batchWiseData : data;
        // const result = _.uniqBy(data, 'subject');
        // for (let i = 0; i < result.length; i++) {
        //     // eslint-disable-next-line no-await-in-loop
        //     const videoResources = await AnswerContainer.getAnswerVideoResource(db, config, result[i].answer_id, result[i].resource_reference, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE']);
        //     practiceResources.push({
        //         rescource_name: `Demo Video ${i + 1}`,
        //         rescource_link: videoResources[0],
        //         available_on: 'Opened',
        //         is_open: true,
        //         is_video: true,
        //     });
        // }
        if (practiceResources.length > 0) {
            scholarshipData.practiceResourcesHeading = global.t8[locale].t('Practice Test');
        } else {
            scholarshipData.practiceResourcesHeading = '';
        }
        scholarshipData.practiceResources = practiceResources;
        const final = moment(testseriesData[0].publish_time).subtract(timeEnd).format();
        scholarshipData.startTimeFinal = final;
        if (moment().isAfter(final)) {
            scholarshipData.canStartTestFinal = true;
        } else {
            scholarshipData.canStartTestFinal = false;
        }
        const rules = await CourseMysqlV2.getScholarshipRules(db.mysql.read, testId);
        if (rules && rules[0]) {
            if (moment().isAfter(start)) {
                scholarshipData.startFaqHeading = `${testseriesData[0].test_name}`;
                scholarshipData.startFaq = `${rules[0].rule_text.replace(/#!#/g, '<br/>•').replace(/\n/g, '')}`;
            } else {
                scholarshipData.startFaqHeading = '';
                scholarshipData.startFaq = '';
            }
        }
        const widget = await getFaq(db, config, locale, testseriesData[0].faq_bucket);
        let backTestUrl;
        let backTestHeading;
        if (moment().isBefore(start)) {
            if (testseriesData[0].type.includes('TALENT')) {
                backTestUrl = `https://app.doubtnut.com/DNST4/registered?token=${auth}/1/${testseriesData[0].type}`;
            } else {
                backTestUrl = `https://app.doubtnut.com/DNST3/registered?token=${auth}/1/${testseriesData[0].type}`;
            }
            backTestHeading = global.t8[locale].t('Change test');
        } else {
            backTestUrl = '';
            backTestHeading = '';
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                scholarshipData,
                widget,
                backTestUrl,
                backTestUrlHeading: backTestHeading,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getWaitPage(req, res, next) {
    try {
        const scholarshipData = {};
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentId } = req.user;
        const xAuthToken = req.headers['x-auth-token'];
        const { student_class: studentClass } = req.user;

        const { test_id: testId } = req.query;
        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';

        const dataTest = await CourseContainerV2.getScholarshipExams(db);
        const textData = dataTest.filter((item) => item.test_id === +testId);
        if (textData[0].type.includes('TALENT')) {
            scholarshipData.pageTopHeading = 'Doubtnut SUPER 100';
            scholarshipData.oldTestHeading = '';
            scholarshipData.oldTestResources = [];
            scholarshipData.completionText = boardData.scholarship4completionText(locale, textData[0].test_name).TALENT;
        } else {
            scholarshipData.pageTopHeading = 'DNST(Doubtnut Scholarship Test)';
            // student's old test results
            const studentOldTestData = await getOldTestResources(db, studentId, locale);
            scholarshipData.oldTestHeading = studentOldTestData[1];
            scholarshipData.oldTestResources = studentOldTestData[0];
            scholarshipData.completionText = boardData.scholarship4completionText(locale, textData[0].test_name).DNST;
        }
        const page = 'wait';
        scholarshipData.videoDetails = await getVideoResources(db, config, locale, textData, page);
        const banner = await CourseContainerV2.getScholarshipWebBanner(db, textData[0].test_id, 3, locale);
        scholarshipData.banner = (banner && banner[0] && banner[0].url !== null) ? banner[0].url : '';
        scholarshipData.banner_deeplink = (banner && banner[0] && banner[0].deeplink !== null) ? banner[0].deeplink : '';
        const timeEnd = moment.duration('05:30:00');
        const date = moment(textData[0].result_time).subtract(timeEnd).format();
        scholarshipData.resultDate = global.t8[locale].t('Results will be declared in');
        scholarshipData.resultTimer = date;
        scholarshipData.testName = textData[0].test_name;
        scholarshipData.timerWords = [global.t8[locale].t('Days'), global.t8[locale].t('Hours'), global.t8[locale].t('Min'), global.t8[locale].t('Sec')];
        if (textData[0].type.includes('TALENT')) {
            scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Round 1 result'), global.t8[locale].t('Round 2 Registration'), global.t8[locale].t('Give interview'), global.t8[locale].t('Round 2 result')];
        } else {
            scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Win Scholarship')];
        }
        const versionCode = 880;
        const popularCourses = await getCourseData(db, studentClass, config, versionCode, studentId, locale, xAuthToken, null, textData);
        const endtime = moment(textData[0].unpublish_time).subtract(timeEnd).format();
        let showAnswerkey = true;
        if (moment().isBefore(endtime) || textData[0].solution_branchlink === null) {
            showAnswerkey = false;
            textData[0].solution_branchlink = '';
        }
        scholarshipData.answerData = {
            deeplink: textData[0].solution_branchlink,
            showAnswer: showAnswerkey,
        };
        scholarshipData.answerButtonText = global.t8[locale].t('View Answer Key');
        const widget = await getFaq(db, config, locale, textData[0].faq_bucket);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                scholarshipData,
                popularCoursesHeading: global.t8[locale].t('Best recommended courses for you'),
                popularCourses,
                widget,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getResultPage(req, res, next) {
    try {
        const scholarshipData = {};
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentId } = req.user;
        const xAuthToken = req.headers['x-auth-token'];
        const { student_class: studentClass } = req.user;
        const { test_id: testId } = req.query;

        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';

        const textData = await CourseMysqlV2.getScholarshipExamsResults(db.mysql.read, testId);
        // top heading
        if (textData[0].type.includes('TALENT')) {
            scholarshipData.pageTopHeading = 'Doubtnut SUPER 100';
        } else {
            scholarshipData.pageTopHeading = 'DNST(Doubtnut Scholarship Test)';
        }
        const page = 'result';
        scholarshipData.videoDetails = await getVideoResources(db, config, locale, textData, page);
        const coupon = await CourseMysqlV2.getScholarshipTestResult(db.mysql.read, studentId, textData[0].test_id);
        if (!coupon.length) {
            const responseData = {
                meta: {
                    code: 200,
                    message: 'Not Registerd for This Test',
                },
                data: {
                    message: 'Not Registerd for This Test',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        let leaderBoardTestIds;
        if (textData[0].other_result_tests !== '' && textData[0].other_result_tests !== null) {
            leaderBoardTestIds = textData[0].other_result_tests.split('||');
        } else {
            leaderBoardTestIds = [`${textData[0].test_id}`];
        }
        let banner;
        if (coupon && coupon[0] && coupon[0].coupon_code) {
            banner = await CourseContainerV2.getScholarshipResultBanner(db, coupon[0].coupon_code, locale);
        }
        scholarshipData.banner = (banner && banner[0] && banner[0].url !== null) ? banner[0].url : '';
        scholarshipData.banner_deeplink = (banner && banner[0] && banner[0].deeplink !== null) ? banner[0].deeplink : '';
        if (textData[0].type.includes('TALENT')) {
            scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Round 1 result'), global.t8[locale].t('Round 2 Registration'), global.t8[locale].t('Give interview'), global.t8[locale].t('Round 2 result')];
        } else {
            scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Win Scholarship')];
        }
        let subscriptionId = await TestSeries.getTestSeriesData(db.mysql.read, studentId, textData[0].test_id);
        let isCompleted = false;
        if (subscriptionId && subscriptionId[0]) {
            for (let i = 0; i < subscriptionId.length; i++) {
                if (subscriptionId && subscriptionId[i] && subscriptionId[i].status === 'COMPLETED') {
                    scholarshipData.answerData = {
                        deeplink: textData[0].solution_branchlink,
                        showAnswer: true,
                    };
                    scholarshipData.answerHeading = global.t8[locale].t('Your Result');
                    scholarshipData.answerButtonText = global.t8[locale].t('View Answer Key');
                    subscriptionId = [subscriptionId[i]];
                    isCompleted = true;
                    break;
                }
            }
        }
        if (!isCompleted) {
            scholarshipData.answerData = {
                deeplink: textData[0].test_branchlink,
                showAnswer: true,
            };
            scholarshipData.answerHeading = global.t8[locale].t('Your Result');
            scholarshipData.answerButtonText = global.t8[locale].t('Start Test');
        }
        scholarshipData.tab1 = global.t8[locale].t('My Result');
        scholarshipData.tab2 = global.t8[locale].t('Leader Board');
        const viewAllCourses = await getViewAllBranchLink(db, config, coupon, locale, textData);
        const versionCode = 880;
        const popularCourses = await getCourseData(db, studentClass, config, versionCode, studentId, locale, xAuthToken, coupon, textData);
        const reportCard = await getTestReportCard(db, textData, subscriptionId, locale, coupon);
        const rankData = await getLeaderBoard(db, studentId, textData[0].test_id, leaderBoardTestIds, locale, subscriptionId);
        const widget = await getFaq(db, config, locale, textData[0].faq_bucket);
        const leaderBoard = rankData[0];
        const studentRank = rankData[1];
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                scholarshipData,
                reportCard,
                viewAllCourse: viewAllCourses.url,
                popularCoursesHeading: global.t8[locale].t('Best recommended courses for you'),
                popularCourses,
                leaderBoard,
                studentRank,
                widget,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getRound2Reg(req, res, next) {
    try {
        const scholarshipData = {};
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { test_id: testId } = req.query;

        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';

        const textData = await CourseMysqlV2.getScholarshipExamsResults(db.mysql.read, testId);
        scholarshipData.pageTopHeading = 'Doubtnut SUPER 100';
        const page = 'round2reg';
        scholarshipData.videoDetails = await getVideoResources(db, config, locale, textData, page);
        const banner = await CourseContainerV2.getScholarshipWebBanner(db, textData[0].test_id, 5, locale);
        scholarshipData.banner = (banner && banner[0] && banner[0].url !== null) ? banner[0].url : '';
        scholarshipData.banner_deeplink = (banner && banner[0] && banner[0].deeplink !== null) ? banner[0].deeplink : '';
        scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Round 1 result'), global.t8[locale].t('Round 2 Registration'), global.t8[locale].t('Give interview'), global.t8[locale].t('Round 2 result')];
        let button = true;
        const endtime = moment(textData[0].round2_registration_endtime).subtract(5, 'hours').subtract(30, 'minutes').format();
        if (moment().isAfter(endtime)) {
            button = false;
            scholarshipData.commonText = boardData.round2page1(locale).common.end;
        } else {
            scholarshipData.commonText = boardData.round2page1(locale).common.start;
        }
        scholarshipData.buttonData = {
            deeplink: textData[0].interview_form_round2,
            showButton: button,
        };
        scholarshipData.buttonText = boardData.round2page1(locale).button;
        const widget = await getFaq(db, config, locale, textData[0].faq_bucket);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                scholarshipData,
                widget,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getRound2Start(req, res, next) {
    try {
        const scholarshipData = {};
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentId } = req.user;
        const { test_id: testId } = req.query;

        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';

        const textData = await CourseMysqlV2.getScholarshipExamsResults(db.mysql.read, testId);
        const interviewData = await CourseMysqlV2.getInterviewData(db.mysql.read, studentId, testId);
        scholarshipData.pageTopHeading = 'Doubtnut SUPER 100';
        const page = 'round2start';
        scholarshipData.videoDetails = await getVideoResources(db, config, locale, textData, page);
        const banner = await CourseContainerV2.getScholarshipWebBanner(db, textData[0].test_id, 6, locale);
        scholarshipData.banner = (banner && banner[0] && banner[0].url !== null) ? banner[0].url : '';
        scholarshipData.banner_deeplink = (banner && banner[0] && banner[0].deeplink !== null) ? banner[0].deeplink : '';
        scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Round 1 result'), global.t8[locale].t('Round 2 Registration'), global.t8[locale].t('Give interview'), global.t8[locale].t('Round 2 result')];
        scholarshipData.testName = textData[0].test_name;
        const time = moment(interviewData[0].slot_start_time).subtract(5, 'hours').subtract(30, 'minutes').format();
        const slot = locale === 'hi' ? interviewData[0].slot_alloted_display_text.split('||')[0] : interviewData[0].slot_alloted_display_text.split('||')[1];
        const page2Obj = {
            locale,
            slot,
        };
        if (moment().isAfter(time)) {
            if (interviewData[0].progress_id === 1) {
                scholarshipData.round2registeredText = boardData.round2page2(page2Obj).reg.end;
                scholarshipData.testStartText = boardData.round2page2(page2Obj).text.end;
                scholarshipData.commonText = boardData.round2page2(page2Obj).common.end;
            } else {
                scholarshipData.round2registeredText = boardData.round2page2(page2Obj).reg.mid;
                scholarshipData.testStartText = boardData.round2page2(page2Obj).text.mid;
                scholarshipData.commonText = boardData.round2page2(page2Obj).common.mid;
            }
        } else {
            scholarshipData.round2registeredText = boardData.round2page2(page2Obj).reg.start;
            scholarshipData.testStartText = boardData.round2page2(page2Obj).text.start;
            scholarshipData.commonText = boardData.round2page2(page2Obj).common.start;
        }
        scholarshipData.startTime = time;
        scholarshipData.timerWords = [global.t8[locale].t('Days'), global.t8[locale].t('Hours'), global.t8[locale].t('Min'), global.t8[locale].t('Sec')];
        const widget = await getFaq(db, config, locale, textData[0].faq_bucket);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                scholarshipData,
                widget,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getRound2Wait(req, res, next) {
    try {
        const scholarshipData = {};
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { test_id: testId } = req.query;

        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';

        const textData = await CourseMysqlV2.getScholarshipExamsResults(db.mysql.read, testId);
        scholarshipData.pageTopHeading = 'Doubtnut SUPER 100';
        const page = 'round2wait';
        scholarshipData.videoDetails = await getVideoResources(db, config, locale, textData, page);
        const banner = await CourseContainerV2.getScholarshipWebBanner(db, textData[0].test_id, 7, locale);
        scholarshipData.banner = (banner && banner[0] && banner[0].url !== null) ? banner[0].url : '';
        scholarshipData.banner_deeplink = (banner && banner[0] && banner[0].deeplink !== null) ? banner[0].deeplink : '';
        scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Round 1 result'), global.t8[locale].t('Round 2 Registration'), global.t8[locale].t('Give interview'), global.t8[locale].t('Round 2 result')];
        scholarshipData.commonText = boardData.round2page3(locale).common;
        const time = moment(textData[0].round2_result_time).subtract(5, 'hours').subtract(30, 'minutes').format();
        scholarshipData.testName = global.t8[locale].t('Round 2 interview');
        scholarshipData.resultTimerText = boardData.round2page3(locale).timerText;
        scholarshipData.resultTimer = time;
        scholarshipData.timerWords = [global.t8[locale].t('Days'), global.t8[locale].t('Hours'), global.t8[locale].t('Min'), global.t8[locale].t('Sec')];
        const widget = await getFaq(db, config, locale, textData[0].faq_bucket);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                scholarshipData,
                widget,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getRound2Result(req, res, next) {
    try {
        const scholarshipData = {};
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentId } = req.user;
        const xAuthToken = req.headers['x-auth-token'];
        const { student_class: studentClass } = req.user;
        const { test_id: testId } = req.query;

        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';

        const textData = await CourseMysqlV2.getScholarshipExamsResults(db.mysql.read, testId);
        const coupon = await CourseMysqlV2.getScholarshipTestResult(db.mysql.read, studentId, textData[0].test_id);
        scholarshipData.pageTopHeading = 'Doubtnut SUPER 100';
        const page = 'round2result';
        scholarshipData.videoDetails = await getVideoResources(db, config, locale, textData, page);
        scholarshipData.progressText = [global.t8[locale].t('Register'), global.t8[locale].t('Take live Test'), global.t8[locale].t('Round 1 result'), global.t8[locale].t('Round 2 Registration'), global.t8[locale].t('Give interview'), global.t8[locale].t('Round 2 result')];
        scholarshipData.commonText = boardData.round2page4(locale).common;
        const banner = await CourseContainerV2.getScholarshipWebBanner(db, textData[0].test_id, 8, locale);
        scholarshipData.banner = (banner && banner[0] && banner[0].url !== null) ? banner[0].url : '';
        scholarshipData.banner_deeplink = (banner && banner[0] && banner[0].deeplink !== null) ? banner[0].deeplink : '';
        let deeplink = '';
        let showButton = false;
        let buttontext = '';
        if (textData[0].reward_form_round2 !== null) {
            deeplink = textData[0].reward_form_round2;
            showButton = true;
            buttontext = boardData.round2page4(locale).button;
        }
        scholarshipData.buttonData = {
            deeplink,
            showButton,
        };
        scholarshipData.buttonText = buttontext;
        const viewAllCourses = await getViewAllBranchLink(db, config, coupon, locale, textData);
        const versionCode = 880;
        const popularCourses = await getCourseData(db, studentClass, config, versionCode, studentId, locale, xAuthToken, coupon, textData);
        const widget = await getFaq(db, config, locale, textData[0].faq_bucket);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                scholarshipData,
                popularCoursesHeading: global.t8[locale].t('Best recommended courses for you'),
                popularCourses,
                widget,
                viewAllCourse: viewAllCourses.url,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getTest,
    registerTest,
    getStartTestPage,
    getFaqLanding,
    getWaitPage,
    getResultPage,
    getRound2Reg,
    getRound2Start,
    getRound2Wait,
    getRound2Result,
    getTestReportCard,
    leaderboardStudents,
    getCourseData,
};
