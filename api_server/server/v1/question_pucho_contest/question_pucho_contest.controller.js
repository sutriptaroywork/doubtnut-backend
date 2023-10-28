const moment = require('moment');
const _ = require('lodash');
const questionPuchoContestHelper = require('./question_pucho_contest.helper');
const questionPuchoContestMysql = require('../../../modules/mysql/questionPuchoContest');
const QuestionPuchoContestRedis = require('../../../modules/redis/questionPuchoContest');
const questionPuchoContestData = require('../../../data/questionPuchoContest');
const studentContainer = require('../../../modules/containers/student');

async function claimReward(req, res) {
    try {
        const db = req.app.get('db');
        const studentId = req.user.student_id;
        const { mobile } = req.user;
        const { date } = req.body;
        const day = moment(date).format('YYYY-MM-DD HH:mm:ss');
        const redisDateStr = moment(date).format('YYYY-MM-DD');
        const contestDates = await studentContainer.getDnPropertyValue(db, 'wa_qpc_date', 'lower_limit_upper_limit');
        const [contestStartDate, contestEndDate] = contestDates.split('||');
        const end = contestEndDate ? moment(`${contestEndDate}T22:00+05:30`) : moment(questionPuchoContestData.contestEndDate);
        const start = contestStartDate ? moment(`${contestStartDate}T22:00+05:30`) : moment(questionPuchoContestData.contestStartDate);
        let rank = await QuestionPuchoContestRedis.getDailyRank(db.redis.read, studentId, redisDateStr);
        if (!_.isNull(rank)) {
            rank += 1;
        }
        const reward = questionPuchoContestHelper.getRewardAmount(rank, day);
        const todaysRewards = await questionPuchoContestMysql.getIfPreviouslyClaimed(db.mysql.read, studentId, day);

        if (!(moment(date).isBefore(start) || moment(date).isAfter(end)) && todaysRewards.length === 0 && !moment().add('7', 'hours').add(30, 'minutes').isSame(day, 'day') && reward > 0) {
            questionPuchoContestMysql.insertIntoQuestionPuchoContestRewards(db.mysql.write, studentId, mobile, reward, day);
        } else {
            throw new Error('Invalid Request');
        }
        const studentData = req.user;
        let userName;
        if (studentData.student_fname !== null && studentData.student_fname.trim() !== '') {
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
        const text = `Congratulations  ${userName} you have won Rs${reward}/- in question pucho contest. We have started the process of transferring the amount in your paytm wallet.`;

        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                text: 'Claim Rewards',
                text_in_box: text,
                text_under_box: 'You will receive the prize money in your paytm wallet only if you have completed your kyc on paytm.',
            },
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

        const { date } = req.body;
        let day;
        const studentId = req.user.student_id;
        // console.log(duration, date);
        const duration = 'daily';

        if (duration === 'daily') {
            if (date) {
                day = moment(date).format('YYYY-MM-DD');
            } else {
                day = moment().add(7, 'hours').add(30, 'minutes').startOf('day');
                day = day.format('YYYY-MM-DD');
                console.log(day);
            }
        } else if (date) {
            day = moment(date).format('YYYY-MM-DD');
        }
        const contestDates = await studentContainer.getDnPropertyValue(db, 'wa_qpc_date', 'lower_limit_upper_limit');
        const [contestStartDate, contestEndDate] = contestDates.split('||');
        const end = contestEndDate ? moment(`${contestEndDate}T22:00+05:30`) : moment(questionPuchoContestData.contestEndDate);
        const start = contestStartDate ? moment(`${contestStartDate}T22:00+05:30`) : moment(questionPuchoContestData.contestStartDate);
        const studentRow = await questionPuchoContestHelper.getStudentRow(db, studentId, duration, day, req.user, start, end);
        const leaderboardArr = await questionPuchoContestHelper.getLeaderBoard(db, duration, day, start, end);
        const faqs = await questionPuchoContestHelper.getFaq(db, req.user.locale);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                contest_dates: `Contest Date: ${start.add(7, 'hours').add(30, 'minutes').format('DD MMM\'YY')} - ${end.format('DD MMM\'YY')}`,
                title: questionPuchoContestData.contestTitle,
                leaderboard_title: 'Winners Leaderboard',
                calender_text: 'Pick a date',
                share_contest_widget: questionPuchoContestHelper.shareContestWidget(),
                tabs: [
                    {
                        title: moment().add('7', 'hours').add(30, 'minutes').isSame(day, 'day') ? "Today's" : moment(day).format('DD-MM-YYYY'),
                    },
                ],
                banner: {
                    image_url: questionPuchoContestData.bannerImage,
                    banner_url: questionPuchoContestData.bannerUrl,
                },
                studentData: studentRow,
                leaderboardData: leaderboardArr,
                faqs,
                widgets: [{
                    widget_type: 'button',
                    data: {
                        button_text: 'Ask Questions Now',
                        deeplink: 'https://api.whatsapp.com/send?phone=918400400400&text=Hi',
                    },
                }],

            },
        };
        const isSameDay = moment().add('7', 'hours').add(30, 'minutes').isSame(day, 'day');
        if (studentRow.rank !== 'NA' && Number(studentRow.rank) <= 50 && !isSameDay && !(moment(day).isBefore(start) || moment(day).isAfter(end))) {
            const mysqlDate = moment(day).format('YYYY-MM-DD HH:mm:ss');
            console.log(mysqlDate);
            const todaysRewards = await questionPuchoContestMysql.getIfPreviouslyClaimed(db.mysql.read, studentId, mysqlDate);
            if (todaysRewards.length > 0) {
                let text;
                console.log(todaysRewards);
                if (todaysRewards[0].is_sent) {
                    text = 'Dear student you reward money has been transferred from our end to your paytm wallet linked with your whatsapp number.';
                } else {
                    const reward = questionPuchoContestHelper.getRewardAmount(Number(studentRow.rank), day);
                    text = `Congratulations  ${studentRow.name} you have won Rs${reward}/- in question pucho contest. We have started the process of transferring the amount in your paytm wallet.`;
                }
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

        const { date } = req.query;
        const contestDates = await studentContainer.getDnPropertyValue(db, 'wa_qpc_date', 'lower_limit_upper_limit');
        const [contestStartDate, contestEndDate] = contestDates.split('||');
        const end = contestEndDate ? moment(`${contestEndDate}T22:00+05:30`) : moment(questionPuchoContestData.contestEndDate);
        const start = contestStartDate ? moment(`${contestStartDate}T22:00+05:30`) : moment(questionPuchoContestData.contestStartDate);
        let day;
        const duration = 'daily';
        if (duration === 'daily') {
            if (date) {
                day = moment(date).format('YYYY-MM-DD');
            } else {
                day = moment().add(7, 'hours').add(30, 'minutes').format('YYYY-MM-DD');
            }
        } else {
            day = moment(date).format('YYYY-MM-DD');
        }
        console.log(duration, day);
        const leaderboardArr = await questionPuchoContestHelper.getLeaderBoard(db, duration, day, start, end);
        const faqs = await questionPuchoContestHelper.getFaq(db, 'en', start, end);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                contest_dates: `Contest Date: ${start.add(7, 'hours').add(30, 'minutes').format('DD MMM\'YY')} - ${end.format('DD MMM\'YY')}`,
                title: questionPuchoContestData.contestTitle,
                share_contest_widget: questionPuchoContestHelper.shareContestWidget(),
                leaderboard_title: 'Winners Leaderboard',
                calender_text: 'Pick a date',
                tabs: [
                    {
                        title: moment().add('7', 'hours').add(30, 'minutes').isSame(day, 'day') ? "Today's" : moment(day).format('DD-MM-YYYY'),
                    },
                ],
                banner: {
                    image_url: questionPuchoContestData.bannerImage,
                    banner_url: questionPuchoContestData.bannerUrl,
                },
                widgets: [
                    {
                        widget_type: 'button',
                        data: {
                            button_text: 'Ask Questions Now',
                            deeplink: 'https://api.whatsapp.com/send?phone=918400400400&text=Hi',
                        },
                    },
                    {
                        widget_type: 'button',
                        data: {
                            button_text: 'Check My Result',
                        },
                    },
                ],
                leaderboardData: leaderboardArr,
                faqs,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    claimReward,
    getMyHome,
    getHome,
};
