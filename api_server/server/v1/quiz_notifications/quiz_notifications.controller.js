const _ = require('lodash');
const moment = require('moment');
const logger = require('../../../config/winston').winstonLogger;

const QuizHelper = require('./quiz_helper.js');
const PopupHelper = require('./popup_helper.js');
const quizNotificationsMysql = require('../../../modules/mysql/quiz_notifications');

const isReferAndEarnEnabled = false;

async function getUpcomingQuizzes(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const { timestamp: installedTime } = req.user;
        const quizData = [];
        let currentDay = req.body.current_day;
        let prioritizedData;
        // Working with array, we have to start with 0
        // When the currentDay is 1, it should be 0 for the array, so for that I have subtracted current Date with 1
        let currentIndex = currentDay - 1;
        const notificationData = await quizNotificationsMysql.getQuizNotificationData(db.mysql.read);
        if (currentDay <= 0) {
            currentDay = 1;
            currentIndex = 0;
        }
        if (currentIndex >= notificationData.length) {
            currentIndex %= notificationData.length;
        }

        const quizObj = new QuizHelper(studentClass, studentId, locale, db.mysql.read, config, db.mongo.read, req, notificationData, currentDay, db);
        if ((studentId % 2 == 0 && (studentClass <= 14 && studentClass >= 9)) || currentDay != 1) {
            prioritizedData = await quizObj.getQuizKheleNotification();
        } else {
            prioritizedData = await quizObj.getDNRQuizNotification();
        // } else if (currentDay === 2 && quizObj.isNewUser(installedTime)) {
        //     prioritizedData = await quizObj.getWhatsappQuizNotification();
        // } else if (currentDay === 3 && quizObj.isNewUser(installedTime)) {
        //     prioritizedData = await quizObj.getAttendanceReward();
        // } else if (isReferAndEarnEnabled && (currentDay === 4 || currentDay === 6)) {
        //     prioritizedData = await quizObj.referAndEarn();
        }
        if (prioritizedData) {
            prioritizedData.day = currentDay + 1;
            quizData.push(prioritizedData);
        } else {
            let data;
            let dayCounter = currentDay + 1;

            for (let days = currentIndex; days < currentIndex + 1; days++) {
                // eslint-disable-next-line no-use-before-define,no-await-in-loop
                data = await getDataByDay(notificationData[days].notification.trim().toLowerCase(), quizObj);
                // possibility of not having data for that user in some days, so looking for next available
                while (!data && days < notificationData.length) {
                    days += 1;
                    // eslint-disable-next-line no-use-before-define,no-await-in-loop
                    data = await getDataByDay(notificationData[days].notification.trim().toLowerCase(), quizObj);
                    dayCounter += 1;
                }
                if (data) {
                    data.day = dayCounter;
                    data.expiry_millis = moment().set('hour', 23).set('minute', 59).subtract(5, 'hours')
                        .subtract(30, 'minutes')
                        .toDate()
                        .getTime();
                    quizData.push(data);
                }
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                quiz_data: quizData.filter(Boolean),
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'quiz_notifications', source: 'getUpcomingQuizzes', error: errorLog });
        next({
            meta: {
                code: 400,
                success: false,
                message: 'No page',
            },
            data: null,
        });
    }
}

async function popupNotifications(req, res, next) {
    try {
        const popupObj = new PopupHelper(req);
        let responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                quiz_data: null,
            },
        };
        if (req.method === 'POST') {
            if (req.body.id) {
                responseData = await popupObj.updateNotification();
            } else {
                responseData = await popupObj.createNotification();
            }
        } else if (req.method === 'GET') {
            responseData = await popupObj.getNotifications();
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getDataByDay(notificationName, quizObj) {
    let data;
    switch (notificationName) {
        case 'getwhatsappquiznotification':
            data = await quizObj.getWhatsappQuizNotification();
            break;
        case 'getdnrquiznotification':
            data = await quizObj.getDNRQuizNotification();
            break;
        case 'getquizkhelenotification':
            data = await quizObj.getQuizKheleNotification();
            break;
        case 'gettrendingvideo':
            data = await quizObj.getTrendingVideo();
            break;
        case 'getquizwinners':
            data = await quizObj.getQuizWinners();
            break;
        case 'gettrendingquestion':
            data = await quizObj.getTrendingQuestion();
            break;
        case 'gettrendinggame':
            data = await quizObj.getTrendingGame();
            break;
        case 'gettrendingword':
            data = await quizObj.getTrendingWord();
            break;
        case 'gettrendingfeedpost':
            data = await quizObj.getTrendingFeedPost();
            break;
        case 'getmissedtrendingliveclass':
            data = await quizObj.getMissedTrendingLiveClass();
            break;
        case 'getplaylistbasislastwatched':
            data = await quizObj.getPlaylistBasisLastWatched();
            break;
        case 'getncertplaylistofclass':
            data = await quizObj.getNCERTPlaylistOfClass();
            break;
        case 'getfirstquesfromquiz':
            data = await quizObj.getFirstQuesFromQuiz();
            break;
        case 'getmotivationalvideoofday':
            data = await quizObj.getMotivationalVideoOfDay();
            break;
        case 'getpreparetargetexam':
            data = await quizObj.getPrepareTargetExam();
            break;
        case 'getaskquestion':
            data = await quizObj.getAskQuestion();
            break;
        case 'gettrickyvideoofday':
            data = await quizObj.getTrickyVideoOfDay();
            break;
        case 'getdailyattendancereward':
            data = await quizObj.getAttendanceReward();
            break;
        case 'getrecommendedcourse':
            data = await quizObj.getRecommendedCourse();
            break;
        default:
            console.log('nothing found');
    }
    return data;
}

module.exports = {
    getUpcomingQuizzes,
    popupNotifications,
};
