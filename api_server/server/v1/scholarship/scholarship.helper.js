const _ = require('lodash');
const base64 = require('base-64');
const moment = require('moment');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const TestSeries = require('../../../modules/mysql/testseries');
const CourseContainerV2 = require('../../../modules/containers/coursev2');

async function scholarshipDeeplink(versionCode, db, scholarshipType, xAuthToken, studentId, progressID, subscriptionID) {
    let deeplink;
    let progressId;
    const testArray = [];
    let dataTest = await CourseContainerV2.getScholarshipExams(db);
    dataTest = dataTest.filter((e) => e.type.includes(scholarshipType));
    if (_.isEmpty(dataTest)) {
        return null;
    }
    for (const value of dataTest) {
        testArray.push(value.test_id);
    }
    if (progressID) {
        progressId = progressID;
    } else {
        progressId = await CourseMysqlV2.getScholarshipTestProgress(db.mysql.read, studentId);
        progressId = progressId.filter((e) => testArray.includes(e.test_id));
    }
    let textData;
    let subscriptionId;
    if (progressId && progressId[0] && !_.isEmpty(dataTest)) {
        textData = dataTest.filter((e) => e.test_id === progressId[0].test_id);
    }
    if (progressId && progressId[0] && subscriptionID) {
        subscriptionId = subscriptionID;
    } else if (progressId && progressId[0] && !subscriptionID) {
        subscriptionId = await TestSeries.getTestSeriesData(db.mysql.read, studentId, progressId[0].test_id);
    }
    if (subscriptionId && subscriptionId[0]) {
        for (let j = 0; j < subscriptionId.length; j++) {
            if (subscriptionId && subscriptionId[j] && subscriptionId[j].status === 'COMPLETED') {
                subscriptionId = [subscriptionId[j]];
                break;
            }
        }
    }
    let interviewData;
    if (textData && textData[0] && textData[0].test_id) {
        interviewData = await CourseMysqlV2.getInterviewData(db.mysql.read, studentId, textData[0].test_id);
    }
    const auth = base64.encode(xAuthToken);
    let startTime;
    let endTime;
    if (textData && textData[0] && textData[0].publish_time && textData[0].unpublish_time) {
        startTime = moment(textData[0].publish_time).subtract(5, 'hours').subtract(45, 'minutes').format();
        endTime = moment(textData[0].unpublish_time).subtract(5, 'hours').subtract(30, 'minutes').format();
    }
    if (!progressId || !progressId.length) {
        if (versionCode > 945 && !dataTest[0].type.includes('TALENT')) {
            deeplink = `doubtnutapp://course_details?id=scholarship_test_${dataTest[0].type}`;
        } else if (dataTest[0].type.includes('TALENT')) {
            deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/1/${dataTest[0].type}`;
        } else {
            deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST3/registered?token=${auth}/1/${dataTest[0].type}`;
        }
    } else if (progressId && progressId[0] && progressId[0].progress_id && versionCode > 945 && textData && textData[0] && !textData[0].type.includes('TALENT')) {
        if (moment().isAfter(startTime) && moment().isBefore(endTime) && progressId[0].progress_id == 2 && ((subscriptionId && subscriptionId[0] && subscriptionId[0].status !== 'COMPLETED') || (!subscriptionId || subscriptionId.length === 0))) {
            deeplink = `doubtnutapp://mock_test_subscribe?id=${textData[0].test_id}`;
        } else {
            deeplink = `doubtnutapp://course_details?id=scholarship_test_${dataTest[0].type}`;
        }
    } else if (progressId && progressId[0] && progressId[0].progress_id == 2 && textData && textData[0] && ((subscriptionId && subscriptionId[0] && subscriptionId[0].status !== 'COMPLETED') || (!subscriptionId || subscriptionId.length === 0))) {
        if (moment().isAfter(startTime) && moment().isBefore(endTime)) {
            deeplink = `doubtnutapp://mock_test_subscribe?id=${textData[0].test_id}`;
        } else if (textData[0].type.includes('TALENT')) {
            deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/2/${textData[0].type}/${progressId[0].test_id}`;
        } else {
            deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST3/registered?token=${auth}/2/${textData[0].type}/${progressId[0].test_id}`;
        }
    } else if (progressId && progressId[0] && progressId[0].progress_id == 2 && textData && textData[0] && subscriptionId && subscriptionId[0] && subscriptionId[0].status === 'COMPLETED') {
        if (textData[0].type.includes('TALENT')) {
            deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/3/${textData[0].type}/${progressId[0].test_id}`;
        } else {
            deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST3/registered?token=${auth}/3/${textData[0].type}/${progressId[0].test_id}`;
        }
    } else if (progressId && progressId[0] && progressId[0].progress_id == 4 && textData && textData[0]) {
        if (textData[0].type.includes('TALENT')) {
            deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/4/${textData[0].type}/${progressId[0].test_id}`;
        } else {
            deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST3/registered?token=${auth}/4/${textData[0].type}/${progressId[0].test_id}`;
        }
    } else if (progressId && progressId[0] && progressId[0].progress_id == 5 && textData && textData[0] && textData[0].type.includes('TALENT') && !interviewData.length) {
        deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/5/${textData[0].type}/${progressId[0].test_id}`;
    } else if (progressId && progressId[0] && progressId[0].progress_id == 5 && textData && textData[0] && textData[0].type.includes('TALENT') && interviewData && interviewData[0] && (interviewData[0].progress_id == 0 || interviewData[0].progress_id == 1)) {
        deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/6/${textData[0].type}/${progressId[0].test_id}`;
    } else if (progressId && progressId[0] && progressId[0].progress_id == 5 && textData && textData[0] && textData[0].type.includes('TALENT') && interviewData && interviewData[0] && interviewData[0].progress_id == 2) {
        deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/7/${textData[0].type}/${progressId[0].test_id}`;
    } else if (progressId && progressId[0] && progressId[0].progress_id == 5 && textData && textData[0] && textData[0].type.includes('TALENT') && interviewData && interviewData[0] && interviewData[0].progress_id == 3) {
        deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/8/${textData[0].type}/${progressId[0].test_id}`;
    } else if (progressId && progressId[0] && progressId[0].progress_id == 5 && textData && textData[0] && textData[0].type.includes('TALENT') && interviewData && interviewData[0] && (interviewData[0].progress_id == 4 || interviewData[0].progress_id == 5)) {
        deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/4/${textData[0].type}/${progressId[0].test_id}`;
    }
    return deeplink;
}

module.exports = {
    scholarshipDeeplink,
};
