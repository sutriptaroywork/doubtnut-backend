const moment = require('moment');
const _ = require('lodash');
const twentyFourSevenQuizHelper = require('./twenty_four_seven_quiz_contest.helper');
const sevenPmQuizMysql = require('../../../modules/mysql/sevenPmQuiz');
const twentyFourSevenQuizData = require('../../../data/twenty_four_seven_quiz');
const twentyFourSevenQuizRedis = require('../../../modules/redis/twenty_four_seven_quiz');

async function claimReward(req, res) {
    try {
        const db = req.app.get('db');
        const studentId = req.user.student_id;
        const { mobile } = req.user;
        const {
            duration, date, class: studentClass,
        } = req.body;
        const weekNumber = moment(date).isoWeek();
        let mysqlDate = moment(date).format('YYYY-MM-DD HH:mm:ss');
        const dateString = moment(date).format('YYYY-MM-DD');
        const isSameDay = moment().add(5, 'hours').add(30, 'minutes').isSame(dateString, 'day');
        let rank;
        if (duration === 'daily') {
            rank = await twentyFourSevenQuizRedis.getDailyRank(db.redis.read, studentId, studentClass, dateString);
        } else {
            rank = await twentyFourSevenQuizRedis.getWeeklyRank(db.redis.read, weekNumber, studentClass, studentId);
        }
        if (_.isNull(rank)) {
            rank = 1000;
        }
        const description = duration === 'daily' ? `24_7_quiz_contest_daily_class_${studentClass}` : `24_7_quiz_contest_weekly_class_${studentClass}`;
        const reward = twentyFourSevenQuizHelper.getRewardAmount(rank, duration);
        if (duration === 'weekly') {
            mysqlDate = moment(date).startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
        }

        const claimedRewards = await sevenPmQuizMysql.getIfPreviouslyClaimed(db.mysql.read, studentId, mysqlDate, description);
        if (((duration === 'daily' && !isSameDay) || (duration === 'weekly' && twentyFourSevenQuizHelper.checkIfShowWeeklyClaimReward(dateString))) && claimedRewards.length === 0 && reward > 0) {
            sevenPmQuizMysql.claimRewards(db.mysql.write, studentId, mobile, reward, mysqlDate, description, '', '', '', '', '');
        } else {
            throw new Error('Invalid Request');
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {},
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(403).json(responseData);
    }
}

async function getMyHome(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');

        const { duration, date, class: studentClass } = req.body;
        let day;
        const studentId = req.user.student_id;
        if (duration === 'daily') {
            if (date) {
                day = moment(date).format('YYYY-MM-DD');
            } else {
                day = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
                day = day.format('YYYY-MM-DD');
            }
        } else if (date) {
            day = moment(date).format('YYYY-MM-DD');
        }
        const end = moment(twentyFourSevenQuizData.contestEndDate);
        const start = moment(twentyFourSevenQuizData.contestStartDate);
        const studentRow = await twentyFourSevenQuizHelper.getStudentRow(db, studentId, duration, day, req.user, studentClass);
        const leaderboardArr = await twentyFourSevenQuizHelper.getLeaderBoard(db, duration, studentClass, day);
        const faqs = await twentyFourSevenQuizHelper.getFaq(db, req.user.locale);
        console.log('here');
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                contest_dates: `Contest Date: ${start.add(5, 'hours').add(30, 'minutes').format('DD MMM\'YY')} - ${end.format('DD MMM\'YY')}`,
                contest_time: '7PM daily',
                videoDetails: {
                    thumbnail: twentyFourSevenQuizData.getVideoThumbnail(config),
                    video_resources: await twentyFourSevenQuizHelper.videoResource(db, config, twentyFourSevenQuizData.videoQuestionId),
                },
                title: twentyFourSevenQuizData.contestTitle,
                leaderboard_title: 'Winners Leaderboard',
                calender_text: 'Pick a date',
                share_contest_widget: twentyFourSevenQuizHelper.shareContestWidget(),
                tabs: [
                    {
                        title: moment().add(5, 'hours').add(30, 'minutes').isSame(day, 'day') ? "Today's" : moment(day).format('DD MMM\'YY'),
                    },
                    {
                        title: 'Weekly',
                    },
                ],
                banner: {
                    image_url: twentyFourSevenQuizData.bannerImage,
                    banner_url: twentyFourSevenQuizData.bannerUrl,
                },
                message: (await twentyFourSevenQuizHelper.getDisplayMessage(duration, day, studentClass, db)),
                ...((await twentyFourSevenQuizHelper.getDisplayMessage(duration, day, studentClass, db)) === '' && { studentData: studentRow }),
                leaderboardData: (await twentyFourSevenQuizHelper.getDisplayMessage(duration, day, studentClass, db)) === '' ? leaderboardArr : [],
                faqs,
                widgets: [{
                    widget_type: 'sticky_button',
                    data: {
                        button_text: 'Play 24*7 Quiz Contest',
                        deeplink: twentyFourSevenQuizData.stickyButtonLink,
                    },
                }],

            },
        };
        const isSameDay = moment().add(5, 'hours').add(30, 'minutes').isSame(day, 'day');

        if (studentRow.rank !== 'NA' && studentRow.rank && ((studentRow.rank <= 3 && duration === 'daily' && !isSameDay) || (studentRow.rank <= 3 && duration === 'weekly' && twentyFourSevenQuizHelper.checkIfShowWeeklyClaimReward(day)))) {
            const { rank } = studentRow;
            let mysqlDate = moment(day).format('YYYY-MM-DD HH:mm:ss');

            const reward = twentyFourSevenQuizHelper.getRewardAmount(rank, duration);
            if (duration === 'weekly') {
                mysqlDate = moment(date).startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
            }

            const description = duration === 'daily' ? `24_7_quiz_contest_daily_class_${studentClass}` : `24_7_quiz_contest_weekly_class_${studentClass}`;
            const claimedRewards = await sevenPmQuizMysql.getIfPreviouslyClaimed(db.mysql.read, studentId, mysqlDate, description);
            if (claimedRewards.length > 0) {
                const text = `Congratulations  ${studentRow.name}. You have won Rs${reward}/- in 7PM Quiz Contest. We have started the process of transferring the amount in your paytm wallet.`;
                responseData.data.widgets.push({
                    widget_type: 'button',
                    data: {
                        text: 'Claim Rewards',
                        text_in_box: text,
                        text_under_box: 'You will receive the prize money in your paytm wallet only if you have completed your kyc on paytm.',
                    },
                    is_claimed: 1,
                });
            } else {
                responseData.data.widgets.push(
                    {
                        widget_type: 'button',
                        data: {
                            button_text: 'Claim Rewards',
                        },
                        is_claimed: 0,
                    },
                );
            }
        } else {
            responseData.data.widgets.push([]);
        }

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getHome(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');

        const { duration, date, class: studentClass } = req.query;
        const end = moment(twentyFourSevenQuizData.contestEndDate);
        const start = moment(twentyFourSevenQuizData.contestStartDate);
        let day;
        if (duration === 'daily') {
            if (date) {
                day = moment(date).format('YYYY-MM-DD');
            } else {
                day = moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD');
            }
        } else {
            day = moment(date).format('YYYY-MM-DD');
        }
        const leaderboardArr = await twentyFourSevenQuizHelper.getLeaderBoard(db, duration, studentClass, day);
        const faqs = await twentyFourSevenQuizHelper.getFaq(db, 'en', start, end);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                contest_dates: `Contest Date: ${start.add(5, 'hours').add(30, 'minutes').format('DD MMM\'YY')} - ${end.format('DD MMM\'YY')}`,
                title: twentyFourSevenQuizData.contestTitle,
                videoDetails: {
                    thumbnail: twentyFourSevenQuizData.getVideoThumbnail(config),
                    video_resources: await twentyFourSevenQuizHelper.videoResource(db, config, twentyFourSevenQuizData.videoQuestionId),
                },
                share_contest_widget: twentyFourSevenQuizHelper.shareContestWidget(),
                leaderboard_title: 'Winners Leaderboard',
                calender_text: 'Pick a date',
                tabs: [
                    {
                        title: moment().add(5, 'hours').add(30, 'minutes').isSame(day, 'day') ? "Today's" : moment(day).format('DD MMM\'YY'),
                    },
                    {
                        title: 'Weekly',
                    },

                ],
                banner: {
                    image_url: twentyFourSevenQuizData.bannerImage,
                    banner_url: twentyFourSevenQuizData.bannerUrl,
                },
                message: (await twentyFourSevenQuizHelper.getDisplayMessage(duration, day, studentClass, db)),
                widgets: [{
                    widget_type: 'sticky_button',
                    data: {
                        button_text: 'Play 24*7 Quiz Contest',
                        deeplink: twentyFourSevenQuizData.stickyButtonLink,
                    },
                },
                {
                    widget_type: 'button',
                    data: {
                        button_text: 'Check My Result',
                    },
                },
                ],
                leaderboardData: (await twentyFourSevenQuizHelper.getDisplayMessage(duration, day, studentClass, db)) === '' ? leaderboardArr : [],
                faqs,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getHome,
    getMyHome,
    claimReward,
};
