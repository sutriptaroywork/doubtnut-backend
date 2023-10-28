const StudentContainer = require('../../../modules/containers/student');
const gamificationHelper = require('./gamification.helper');
const profileHelper = require('../../helpers/gamification-leaderboard');
const CourseHelper = require('../../helpers/course');

let db; let config;

async function getFinalWidgetData(locale, details, i, myStudentId, configNew) {
    const leaderboardProfile = [];
    const studentProfile = [];
    const leaderBoard = details[0];
    const myRank = details[1];
    const myScore = details[2];
    const totalMarks = details[3];
    const studentArr = [];
    const pointsArr = [];
    if (leaderBoard && leaderBoard[0]) {
        for (let j = 0; j < leaderBoard.length; j++) {
            if (j % 2 === 0) {
                studentArr.push(leaderBoard[j]);
            } else {
                pointsArr.push(leaderBoard[j]);
            }
        }
    }
    for (let j = 0; j < studentArr.length; j++) {
        // eslint-disable-next-line no-await-in-loop
        const studentDetails = await StudentContainer.getById(studentArr[j], db);
        if (studentDetails && studentDetails[0]) {
            const profile = gamificationHelper.getLeaderboardProfile(i, j, studentDetails, pointsArr[j], myStudentId, configNew);
            leaderboardProfile.push(profile);
        }
    }
    if (studentArr.length) {
        const page = 'leaderboard';
        const profileData = profileHelper.getStudentProfile(config, i, locale, myRank, myScore, totalMarks, null, page);
        studentProfile.push(profileData[0]);
        studentProfile.push(profileData[1]);
    }
    return [leaderboardProfile, studentProfile];
}

async function getTestLeaderboard(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { source } = req.query;
        const { student_id: studentID } = req.user;
        let { locale } = req.user;
        locale = (locale === 'hi') ? 'hi' : 'en';
        const { version_code: versionCode } = req.headers;

        let testId;
        let assortmentID;
        let responseData = {};
        let data = {};
        const widgets = [];
        const pageTitle = locale === 'hi' ? 'मेरी रैंक' : 'My Rank';
        let buttonCta;
        let deeplink;
        let bucketNames;
        const min = 0;
        const max = 24;
        let leaderboardProfile = [];
        let studentProfile = [];
        const stickyWidgets = [];
        widgets.push({
            type: 'widget_leaderboard_personal',
            data: {
                margin: true,
            },
        });
        widgets.push({
            type: 'widget_leaderboard',
            data: {
                margin: true,
            },
        });
        if (source === 'course') {
            assortmentID = req.query.assortment_id;
            const batchID = await CourseHelper.getBatchByAssortmentIdAndStudentId(db, studentID, assortmentID);
            let newId;
            if (batchID) {
                newId = `${assortmentID}_${batchID}`;
            }
            const defaultTabsEn = ['This Course', 'This Month', 'This Week'];
            const defaultTabsHi = ['ये कोर्स', 'इस महीने', 'इस सप्ताह'];
            bucketNames = ['course_leaderboard'];
            const tabDetails = gamificationHelper.getTabDetails(req.query.tab, locale, defaultTabsEn, defaultTabsHi, versionCode);
            const timeArray = [];
            if (versionCode > 942) {
                stickyWidgets.push(tabDetails);
                for (let i = 0; i < stickyWidgets[0].data.items.length; i++) {
                    if (stickyWidgets[0].data.items[i].title.includes('Course') || stickyWidgets[0].data.items[i].title.includes('कोर्स')) timeArray.push(0);
                    if (stickyWidgets[0].data.items[i].title.includes('Month') || stickyWidgets[0].data.items[i].title.includes('महीने')) timeArray.push(1);
                    if (stickyWidgets[0].data.items[i].title.includes('Week') || stickyWidgets[0].data.items[i].title.includes('सप्ताह')) timeArray.push(2);
                }
            } else {
                widgets.unshift(tabDetails);
                for (let i = 0; i < widgets[0].data.items.length; i++) {
                    if (widgets[0].data.items[i].title.includes('Course') || widgets[0].data.items[i].title.includes('कोर्स')) timeArray.push(0);
                    if (widgets[0].data.items[i].title.includes('Month') || widgets[0].data.items[i].title.includes('महीने')) timeArray.push(1);
                    if (widgets[0].data.items[i].title.includes('Week') || widgets[0].data.items[i].title.includes('सप्ताह')) timeArray.push(2);
                }
            }
            for (let i = 0; i < timeArray.length; i++) {
                // eslint-disable-next-line no-await-in-loop
                const details = await gamificationHelper.allDetails(source, db, i, assortmentID, studentID, timeArray, newId, min, max);
                // eslint-disable-next-line no-await-in-loop
                const getFinalData = await getFinalWidgetData(locale, details, i, studentID, config);
                leaderboardProfile = leaderboardProfile.concat(getFinalData[0]);
                studentProfile = studentProfile.concat(getFinalData[1]);
            }
            if (versionCode > 942) {
                widgets[1].data.items = leaderboardProfile;
                widgets[0].data.items = studentProfile;
            } else {
                widgets[2].data.items = leaderboardProfile;
                widgets[1].data.items = studentProfile;
            }
            buttonCta = locale === 'hi' ? 'टेस्ट पर जाये' : 'Go to tests';
            deeplink = `doubtnutapp://course_detail_info?tab=tests&assortment_id=${assortmentID}`;
        }
        if (source === 'test') {
            testId = req.query.test_id;
            bucketNames = ['course_leaderboard'];
            const details = await gamificationHelper.allDetails(source, db, null, null, studentID, null, testId, min, max);
            const getFinalData = await getFinalWidgetData(locale, details, null, studentID, config);
            widgets[0].data.items = getFinalData[1];
            widgets[1].data.items = getFinalData[0];
            buttonCta = locale === 'hi' ? 'टेस्ट रिपोर्ट' : 'Test report';
            deeplink = `doubtnutapp://mock_test_subscribe?id=${testId}`;
        }
        if (source === 'quiztfs') {
            bucketNames = ['quiztfs_leaderboard'];
            const details = await gamificationHelper.allDetails(source, db, null, null, studentID, null, 'quiztfs', min, -1);
            const getFinalData = await getFinalWidgetData(locale, details, null, studentID, config);
            widgets[0].data.items = getFinalData[1];
            widgets[1].data.items = getFinalData[0];
            widgets[0].data.items[1].title2 = '';
            buttonCta = locale === 'hi' ? 'खेल शुरू करो' : 'Play Quiz War';
            deeplink = 'doubtnutapp://quiz_tfs_selection';
        }
        const leaderboardHelp = await gamificationHelper.leaderboardGeneralWidget(db, config, locale, source, assortmentID, testId, { title: buttonCta, deeplink }, versionCode, bucketNames);
        data = {
            title: pageTitle,
            leaderboardHelp,
            ...(stickyWidgets.length && { sticky_widgets: stickyWidgets }),
            widgets,
            button_cta_text: buttonCta,
            deeplink,
        };

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getTestLeaderboard,
};
