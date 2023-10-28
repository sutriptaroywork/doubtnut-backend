const moment = require('moment');
const sevenPmQuizHelper = require('./seven_pm_quiz.helper');
const sevenPmQuizMysql = require('../../../modules/mysql/sevenPmQuiz');
const sevenPmQuizData = require('../../../data/sevenPmQuiz');
const sevenPmQuizRedis = require('../../../modules/redis/sevenPmQuiz');

async function claimReward(req, res) {
    try {
        const db = req.app.get('db');
        const studentId = req.user.student_id;
        const { mobile } = req.user;
        const {
            duration, date, name, pincode, flat_number: flatNumber, street, landmark,
        } = req.body;
        const weekNumber = moment(date).isoWeek();
        let mysqlDate = moment(date).format('YYYY-MM-DD HH:mm:ss');
        const dateString = moment(date).format('YYYY-MM-DD');
        let rank;
        if (duration === 'daily') {
            rank = await sevenPmQuizRedis.getDailyRank(db.redis.read, studentId, dateString);
        } else {
            rank = await sevenPmQuizRedis.getWeeklyRank(db.redis.read, weekNumber, studentId);
        }
        const description = duration === 'daily' ? '7pm_quiz_contest_daily' : '7pm_quiz_contest_weekly';
        let reward;
        if (duration === 'daily') {
            if (rank === '1') {
                reward = '2500';
            } else if (rank === '2') {
                reward = '1500';
            } else if (rank === '3') {
                reward = '1000';
            }
        } else if (duration === 'weekly' && sevenPmQuizHelper.checkIfShowWeeklyClaimReward(dateString)) {
            if (rank === '1') {
                reward = 'mobile';
            }
            mysqlDate = moment(date).startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
        }
        const claimedRewards = await sevenPmQuizMysql.getIfPreviouslyClaimed(db.mysql.read, studentId, mysqlDate, description);
        if ((duration === 'daily' || (duration === 'weekly' && sevenPmQuizHelper.checkIfShowWeeklyClaimReward(dateString))) && claimedRewards.length === 0 && reward) {
            sevenPmQuizMysql.claimRewards(db.mysql.write, studentId, mobile, reward, mysqlDate, description, name, pincode, flatNumber, street, landmark);
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

        const { duration, date } = req.body;
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
        const end = moment(sevenPmQuizData.contestEndDate);
        const start = moment(sevenPmQuizData.contestStartDate);
        const studentRow = await sevenPmQuizHelper.getStudentRow(db, studentId, duration, day, req.user);
        const leaderboardArr = await sevenPmQuizHelper.getLeaderBoard(db, duration, day, start, end);
        const faqs = await sevenPmQuizHelper.getFaq(db, req.user.locale);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                contest_dates: `Contest Date: ${start.add(5, 'hours').add(30, 'minutes').format('DD MMM\'YY')} - ${end.format('DD MMM\'YY')}`,
                contest_time: '7PM daily',
                videoDetails: {
                    thumbnail: sevenPmQuizData.getVideoThumbnail(config),
                    video_resources: await sevenPmQuizHelper.videoResource(db, config, sevenPmQuizData.videoQuestionId),
                },
                title: sevenPmQuizData.contestTitle,
                leaderboard_title: 'Winners Leaderboard',
                calender_text: 'Pick a date',
                share_contest_widget: sevenPmQuizHelper.shareContestWidget(),
                tabs: [
                    {
                        title: moment().add(5, 'hours').add(30, 'minutes').isSame(day, 'day') ? "Today's" : moment(day).format('DD MMM\'YY'),
                    },
                    {
                        title: 'Weekly',
                    },
                ],
                banner: {
                    image_url: sevenPmQuizData.bannerImage,
                    banner_url: sevenPmQuizData.bannerUrl,
                },
                message: sevenPmQuizHelper.getDisplayMessage(duration, day),
                ...(sevenPmQuizHelper.getDisplayMessage(duration, day) === '' && { studentData: studentRow }),
                leaderboardData: sevenPmQuizHelper.getDisplayMessage(duration, day) === '' ? leaderboardArr : [],
                faqs,
                widgets: [{
                    widget_type: 'sticky_button',
                    data: {
                        button_text: 'Register for Whatsapp Daily Quiz Contest',
                        deeplink: 'https://api.whatsapp.com/send?phone=918400400400&text=Muje%207PM%20Quiz%20Contest%20ke%20liye%20Register%20Karna%20hai',
                    },
                }],

            },
        };
        if (studentRow.rank !== 'NA' && studentRow.rank && ((studentRow.rank <= 3 && duration === 'daily') || (studentRow.rank <= 1 && duration === 'weekly' && sevenPmQuizHelper.checkIfShowWeeklyClaimReward(day)))) {
            const { rank } = studentRow;
            let reward;
            let mysqlDate = moment(day).format('YYYY-MM-DD HH:mm:ss');

            if (duration === 'daily') {
                if (rank === '1') {
                    reward = '2500';
                } else if (rank === '2') {
                    reward = '1500';
                } else if (rank === '3') {
                    reward = '1000';
                }
            } else if (duration === 'weekly') {
                if (rank === '1') {
                    reward = 'mobile';
                }
                mysqlDate = moment(date).startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
            }

            const description = duration === 'daily' ? '7pm_quiz_contest_daily' : '7pm_quiz_contest_weekly';
            const claimedRewards = await sevenPmQuizMysql.getIfPreviouslyClaimed(db.mysql.read, studentId, mysqlDate, description);
            if (claimedRewards.length > 0) {
                let address = '';
                if (duration === 'weekly') {
                    address = `Name: ${claimedRewards[0].name}<br>Flat Number ${claimedRewards[0].flat_number}<br>Street: ${claimedRewards[0].street}<br> Landmark: ${claimedRewards[0].landmark}<br> Pincode ${claimedRewards[0].pincode}`;
                }
                const text = duration === 'daily' ? `Congratulations  ${studentRow.name}. You have won Rs${reward}/- in 7PM Quiz Contest. We have started the process of transferring the amount in your paytm wallet.
                    Your reward will be transferred to your paytm wallet in 15 Days.` : `Congratulations ${studentRow.name}. You have won a mobile in 7PM Quiz Contest. We have started the process of Delivering the mobile phone to the address submitted by you.
                    <br><br>Your submitted address-<br>${address}`;
                responseData.data.widgets.push({
                    widget_type: 'button',
                    data: {
                        text: 'Claim Rewards',
                        text_in_box: text,
                        text_under_box: duration === 'daily' ? 'You will receive the prize money in your paytm wallet only if you have completed your kyc on paytm.' : '',
                    },
                    is_claimed: 1,
                });
            } else {
                responseData.data.widgets.push(
                    {
                        widget_type: 'button',
                        data: {
                            button_text: 'Claim Rewards',
                            ...((duration === 'weekly') && {
                                text: 'Update Address',
                                sub_text: 'Add your address details',
                                name: 'Full Name',
                                pincode: 'PIN CODE',
                                addressline1: 'FLAT, House No., Building, Apartment',
                                addressline2: 'Area, colony, street, sector, village',
                                landmark: 'LANDMARK',
                                save_my_address: 'Save My Address',
                            }),
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

        const { duration, date } = req.query;
        const end = moment(sevenPmQuizData.contestEndDate);
        const start = moment(sevenPmQuizData.contestStartDate);

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
        const leaderboardArr = await sevenPmQuizHelper.getLeaderBoard(db, duration, day, start, end);
        const faqs = await sevenPmQuizHelper.getFaq(db, 'en', start, end);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                contest_dates: `Contest Date: ${start.add(5, 'hours').add(30, 'minutes').format('DD MMM\'YY')} - ${end.format('DD MMM\'YY')}`,
                title: sevenPmQuizData.contestTitle,
                videoDetails: {
                    thumbnail: sevenPmQuizData.getVideoThumbnail(config),
                    video_resources: await sevenPmQuizHelper.videoResource(db, config, sevenPmQuizData.videoQuestionId),
                },
                share_contest_widget: sevenPmQuizHelper.shareContestWidget(),
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
                    image_url: sevenPmQuizData.bannerImage,
                    banner_url: sevenPmQuizData.bannerUrl,
                },
                message: sevenPmQuizHelper.getDisplayMessage(duration, day),
                widgets: [{
                    widget_type: 'sticky_button',
                    data: {
                        button_text: 'Register for Whatsapp Daily Quiz Contest',
                        deeplink: 'https://api.whatsapp.com/send?phone=918400400400&text=Muje%207PM%20Quiz%20Contest%20ke%20liye%20Register%20Karna%20hai',
                    },
                },
                {
                    widget_type: 'button',
                    data: {
                        button_text: 'Check My Result',
                    },
                },
                ],
                leaderboardData: sevenPmQuizHelper.getDisplayMessage(duration, day) === '' ? leaderboardArr : [],
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
