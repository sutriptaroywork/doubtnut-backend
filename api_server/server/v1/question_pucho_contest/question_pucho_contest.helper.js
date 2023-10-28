const moment = require('moment');
const _ = require('lodash');
const QuestionPuchoContestRedis = require('../../../modules/redis/questionPuchoContest');
const StudentContainer = require('../../../modules/containers/student');
const Faq = require('../../../modules/mysql/faq');
const AnswerContainer = require('../../v13/answer/answer.container');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const questionPuchoContestData = require('../../../data/questionPuchoContest');

function shareContestWidget() {
    return {
        shareTextOnPage: questionPuchoContestData.shareOnPageText,
        whatsappShareIcon: 'whatsapp icon',
        telegramShareIcon: 'telegram icon',
        shareLink: questionPuchoContestData.shareWithFriendsLink,
        shareImage: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
    };
}

function getRewardAmount(rank, resultDate) {
    if (_.isNull(rank)) {
        return 0;
    }
    if (moment(resultDate).isBefore(moment('2021-12-12T22:00+05:30'))) {
        if (rank >= 1 && rank <= 10) {
            return 100;
        }
        return 0;
    }
    if (moment(resultDate).isBefore(moment('2022-07-20T22:00+05:30'))) {
        if (rank >= 1 && rank <= 10) {
            return 150;
        }
        if (rank >= 11 && rank <= 20) {
            return 125;
        }
        if (rank >= 21 && rank <= 30) {
            return 100;
        }
        if (rank >= 31 && rank <= 40) {
            return 75;
        }
        if (rank >= 41 && rank <= 50) {
            return 50;
        }
        return 0;
    }
    if (rank == 1) {
        return 125;
    }
    if (rank > 1 && rank <= 3) {
        return 100;
    }
    if (rank >= 4 && rank <= 6) {
        return 75;
    }
    if (rank >= 7 && rank <= 11) {
        return 50;
    }
    if (rank >= 12 && rank <= 20) {
        return 25;
    }
    return 0;
}

async function videoResource(db, config, questionId) {
    const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, questionId);
    let videoResources;
    if (answerData.length) {
        videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, questionId, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE']);
    }
    return videoResources;
}

async function getStudentRow(db, studentId, duration, date, studentData, start, end) {
    let questionsAsked;
    let rank;
    if (duration === 'daily') {
        questionsAsked = await QuestionPuchoContestRedis.getQuestionPuchoContestDailyScore(db.redis.read, date, studentId);
        rank = await QuestionPuchoContestRedis.getDailyRank(db.redis.read, studentId, date);
    } else {
        questionsAsked = await QuestionPuchoContestRedis.getQuestionPuchoContestLifetimeScore(db.redis.read, 0, 10);
        rank = await QuestionPuchoContestRedis.getAllTimeRank(db.redis.read, studentId);
    }
    if (_.isNull(rank)) {
        rank = 'NA';
        questionsAsked = 0;
    } else {
        rank += 1;
    }
    let userName;
    if (studentData.student_fname !== null && studentData.student_fname.trim()) {
        if (studentData.student_lname !== null) {
            userName = `${studentData.student_fname} ${studentData.student_lname}`;
            userName = userName.replace(/\n/g, ' ');
        } else {
            userName = `${studentData.student_fname}`;
        }
    } else if (studentData.mobile) {
        const sli = studentData.mobile.slice(0, 6);
        const phone = studentData.mobile.replace(sli, 'xxxxxx');
        userName = phone;
    }
    return {
        rank,
        image: studentData.img_url ? studentData.img_url : null,
        name: userName,
        reward: duration === 'daily' && !(moment(date).isBefore(start) || moment(date).isAfter(end)) && !moment().add('7', 'hours').add(30, 'minutes').isSame(moment(date), 'day') ? `Won ₹${getRewardAmount(rank, date)}` : `${questionsAsked}`,
        questionsAsked: duration === 'daily' && !(moment(date).isBefore(start) || moment(date).isAfter(end)) && !moment().add('7', 'hours').add(30, 'minutes').isSame(moment(date), 'day') ? `${questionsAsked} Questions Asked.` : 'Questions Asked',
    };
}
async function getLeaderBoard(db, duration, date, start, end) {
    const day = moment(date).format('YYYY-MM-DD');
    let leaderBoardData;
    if (duration === 'daily') {
        leaderBoardData = await QuestionPuchoContestRedis.getQuestionPuchoContestDailyLeaderboard(db.redis.read, day, 0, 9);
    } else {
        leaderBoardData = await QuestionPuchoContestRedis.getQuestionPuchoContestLifetimeLeaderboard(db.redis.read, 0, 9);
    }

    const studentIds = [];
    const questionAsked = [];
    const studentDataPromise = [];
    for (let i = 0; i < leaderBoardData.length; i++) {
        if (i % 2 === 0) {
            studentIds.push(leaderBoardData[i]);
            studentDataPromise.push(StudentContainer.getById(leaderBoardData[i], db));
        } else {
            questionAsked.push(leaderBoardData[i]);
        }
    }
    const studentDataArr = await Promise.all(studentDataPromise);

    const leaderboardArr = [];

    for (let i = 0; i < studentIds.length; i++) {
        let userName;
        const sli = studentDataArr[i][0].mobile.slice(0, 6);

        const phone = studentDataArr[i][0].mobile.replace(sli, 'xxxxxx');

        if (studentDataArr[i][0].student_fname !== null && studentDataArr[i][0].student_fname.trim() !== '') {
            if (studentDataArr[i][0].student_lname !== null) {
                userName = `${studentDataArr[i][0].student_fname} ${studentDataArr[i][0].student_lname}`;
                userName = userName.replace(/\n/g, ' ');
            } else {
                userName = `${studentDataArr[i][0].student_fname}`;
            }
        } else {
            userName = phone;
        }
        leaderboardArr.push(
            {
                rank: i + 1,
                image: studentDataArr[i][0].img_url ? studentDataArr[i][0].img_url : null,
                name: userName,
                reward: duration === 'daily' && !(moment(date).isBefore(start) || moment(date).isAfter(end)) && !moment().add('7', 'hours').add(30, 'minutes').isSame(moment(date), 'day') ? `Won ₹${getRewardAmount(i + 1, date)}` : `${questionAsked[i]}`,
                questionsAsked: duration === 'daily' && !(moment(date).isBefore(start) || moment(date).isAfter(end)) && !moment().add('7', 'hours').add(30, 'minutes').isSame(moment(date), 'day') ? `${questionAsked[i]} Questions Asked.` : 'Questions Asked',
            },
        );
    }

    return leaderboardArr;
}

async function getFaq(db, locale) {
    const bucketNames = ['question_pucho_contest'];

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

module.exports = {
    getLeaderBoard,
    getFaq,
    getStudentRow,
    shareContestWidget,
    videoResource,
    getRewardAmount,
};
