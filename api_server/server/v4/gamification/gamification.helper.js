const moment = require('moment');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const CourseRedisV2 = require('../../../modules/redis/coursev2');
const AnswerContainer = require('../../v13/answer/answer.container');
const Faq = require('../../../modules/mysql/faq');

function getLeaderboardProfile(i, j, studentDetails, points, myStudentId, config) {
    // get the details of top 25 students for leaderboard
    let phone;
    if(studentDetails[0].mobile !== null){
        const sli = studentDetails[0].mobile.slice(0, 6);
        phone = studentDetails[0].mobile.replace(sli, 'xxxxxx');
    }

    let userName;
    if (studentDetails[0].student_fname !== null) {
        if (studentDetails[0].student_lname !== null) {
            userName = `${studentDetails[0].student_fname} ${studentDetails[0].student_lname}`;
            userName = userName.replace(/\n/g, ' ');
        } else {
            userName = `${studentDetails[0].student_fname}`;
        }
    } else {
        userName = phone;
    }
    const profile = {
        rank: `${j + 1}`,
        image: studentDetails[0].img_url ? studentDetails[0].img_url : null,
        name: userName,
        marks: points || '',
        student_id: studentDetails[0].student_id,
        icon: `${config.staticCDN}/engagement_framework/9FACB6B1-B6D5-262D-0F55-7787D99F175C.webp`,
        profile_deeplink: studentDetails[0].student_id === myStudentId ? 'doubtnutapp://profile' : `doubtnutapp://profile?student_id=${studentDetails[0].student_id}&source=leaderboard`,
        elevation: 3,
        ...(i !== null && { tab: i + 1 }),

    };
    return profile;
}

function getTabDetails(tab, locale, defaultTabsEn, defaultTabsHi, versionCode) {
    // get the details of tabs
    let data;
    if (tab) {
        const tabs = tab.split(',');
        if (tabs.length) {
            const item = [];
            for (let i = 0; i < tabs.length; i++) {
                const position = parseInt(tabs[i]) - 1;
                const tabDetailEn = defaultTabsEn[position];
                const tabDetailHi = defaultTabsHi[position];
                item.push({
                    id: i + 1,
                    title: locale === 'hi' ? `${tabDetailHi}` : `${tabDetailEn}`,
                });
            }
            data = {
                type: 'widget_leaderboard_tabs',
                is_sticky: true,
                data: {
                    margin: true,
                    items: item,
                },
            };
        }
    } else {
        data = {
            type: 'widget_leaderboard_tabDetails',
            is_sticky: true,
            data: {
                margin: true,
                items: [
                    {
                        id: 1,
                        title: locale === 'hi' ? `${defaultTabsHi[0]}` : `${defaultTabsEn[0]}`,
                    },
                    {
                        id: 2,
                        title: locale === 'hi' ? `${defaultTabsHi[1]}` : `${defaultTabsEn[1]}`,
                    },
                    {
                        id: 3,
                        title: locale === 'hi' ? `${defaultTabsHi[2]}` : `${defaultTabsEn[2]}`,
                    },
                ],
            },
        };
        if (versionCode > 942) {
            data.layout_config = {
                margin_top: 0,
                margin_left: 0,
                margin_right: 0,
            };
            data.data.margin = false;
            data.data.background = '#ffffff';
            data.data.elevation = '4';
            data.data.style = 1;
        }
    }
    return data;
}

function getScoreMarks(scores) {
    // get my score and total marks of the tests given
    let myScore = 0;
    let totalMarks = 0;
    for (let j = 0; j < scores.length; j++) {
        myScore += parseInt(scores[j].totalscore);
        totalMarks += parseInt(scores[j].totalmarks);
    }
    return [myScore, totalMarks];
}

async function allDetails(source, db, i, assortmentID, studentID, timeArray, newId, min, max) {
    // get my score, my total marks, leaderboard, myrank
    let leaderBoard;
    let myRank;
    let myScore = 0;
    let totalMarks = 0;
    if (source === 'course') {
        if (timeArray[i] === 2) {
            leaderBoard = await CourseRedisV2.getCourseLeaderboardWeekly(db.redis.read, newId, min, max);
            myRank = await CourseRedisV2.getUserCourseLeaderboardWeeklyRank(db.redis.read, newId, studentID);
            const startOfWeek = moment().add(5, 'hours').add(30, 'minutes').startOf('week')
                .format();
            const scores = await CourseMysqlV2.getStudentScoreWeekly(db.mysql.read, assortmentID, studentID, startOfWeek);
            if (scores && scores[0]) {
                const scoreTotalMarks = getScoreMarks(scores);
                myScore = scoreTotalMarks[0];
                totalMarks = scoreTotalMarks[1];
            }
        }
        if (timeArray[i] === 1) {
            leaderBoard = await CourseRedisV2.getCourseLeaderboardMonthly(db.redis.read, newId, min, max);
            myRank = await CourseRedisV2.getUserCourseLeaderboardMonthlyRank(db.redis.read, newId, studentID);
            const startOfMonth = moment().add(5, 'hours').add(30, 'minutes').startOf('month')
                .format();
            const scores = await CourseMysqlV2.getStudentScoreMonthly(db.mysql.read, assortmentID, studentID, startOfMonth);
            if (scores && scores[0]) {
                const scoreTotalMarks = getScoreMarks(scores);
                myScore = scoreTotalMarks[0];
                totalMarks = scoreTotalMarks[1];
            }
        }
        if (timeArray[i] === 0) {
            leaderBoard = await CourseRedisV2.getCourseLeaderboardAll(db.redis.read, newId, min, max);
            myRank = await CourseRedisV2.getUserCourseLeaderboardAllRank(db.redis.read, newId, studentID);
            const scores = await CourseMysqlV2.getStudentScoreAll(db.mysql.read, assortmentID, studentID);
            if (scores && scores[0]) {
                const scoreTotalMarks = getScoreMarks(scores);
                myScore = scoreTotalMarks[0];
                totalMarks = scoreTotalMarks[1];
            }
        }
    } else if (source === 'test') {
        leaderBoard = await CourseRedisV2.getTestLeaderboardAll(db.redis.read, newId, min, max);
        myRank = await CourseRedisV2.getTestLeaderboardAllRank(db.redis.read, newId, studentID);
        const score = await CourseMysqlV2.getTestScore(db.mysql.read, newId, studentID);
        if (score && score[0]) {
            myScore = score[0].totalscore;
            totalMarks = score[0].totalmarks;
        }
    } else if (source === 'quiztfs') {
        leaderBoard = await CourseRedisV2.getTestLeaderboardAll(db.redis.read, newId, min, max);
        myRank = await CourseRedisV2.getTestLeaderboardAllRank(db.redis.read, newId, studentID);
        const score = await CourseRedisV2.getTestLeaderboardAllScore(db.redis.read, newId, studentID);
        myScore = parseInt(score);
        totalMarks = parseInt(score);
    }
    return [leaderBoard, myRank, myScore, totalMarks];
}

async function leaderboardGeneralWidget(db, config, locale, source, assortmentID, testId, buttonCta, versionCode, bucketNames) {
    const leaderboardHelp = {
        title: locale === 'hi' ? 'यह कैसे होता है?' : 'How is this done',
        button_cta_text: buttonCta.title,
        deeplink: buttonCta.deeplink,
        icon: `${config.staticCDN}/engagement_framework/059F9808-9822-8FB5-560A-DA25A942FB8A.webp`,
        video_button_cta_text: locale === 'hi' ? 'रैंक कैसे बढ़ाये' : 'Rank kaise badhayei?',
        heading_image: `${config.staticCDN}/engagement_framework/AAF76CB1-37B9-4E82-EC0F-111D94D098D2.webp`,
        items: [],
    };
    const qid = 0;
    if (qid) {
        const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, qid);
        let videoResources;
        if (answerData.length) {
            videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, qid, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true);
        }
        leaderboardHelp.video_button_cta_text = locale === 'hi' ? 'रैंक कैसे बढ़ाये' : 'Rank kaise badhayei?';
        leaderboardHelp.video_info = {
            qid: '642851713',
            page: 'COURSE_DETAIL',
            text: 'Play Video for this',
        };
        leaderboardHelp.video_info.video_resources = [...videoResources];
    } else {
        leaderboardHelp.video_button_cta_text = '';
        leaderboardHelp.video_info = {
            qid: '642851713',
            page: 'COURSE_DETAIL',
            text: 'Play Video for this',
            video_resources: [],
        };
    }
    const faqData = await Faq.getByLocale(db.mysql.read, bucketNames, locale, versionCode);
    if (faqData && faqData[0]) {
        for (let i = 0; i < faqData.length; i++) {
            if (faqData[i].priority == 0) {
                leaderboardHelp.heading = faqData[i].answer;
            } else {
                leaderboardHelp.items.push({
                    title: faqData[i].answer,
                });
            }
        }
    }
    return leaderboardHelp;
}

module.exports = {
    getLeaderboardProfile,
    getTabDetails,
    getScoreMarks,
    allDetails,
    leaderboardGeneralWidget,
};
