const _ = require('lodash');
const moment = require('moment');
const Contest = require('../../../modules/contest');
const ContestContainer = require('../../../modules/containers/contest');
const StudentRedis = require('../../../modules/redis/student');

async function getActiveContests(req, res, next) {
    try {
        const db = req.app.get('db');
        const allContests = await Contest.getActiveContests(db.mysql.read);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: allContests,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getContestDetail(req, res, next) {
    try {
        const db = req.app.get('db');
        const { contest_id } = req.params;
        const { student_id } = req.user;
        const promises = []; const datas = {};
        const currentDate = moment().format('YYYY-MM-DD');
        let current_winner_flag = false; let eligibility_flag = false; let eligible = 2;
        const contest = await Contest.getContestById(contest_id, db.mysql.read);
        datas.header = {
            headline: contest[0].headline,
            amount: contest[0].amount,
            description: contest[0].description,
            bg_color: contest[0].bg_color,
            logo: contest[0].logo,
            start_date: contest[0].date_from,
            end_date: contest[0].date_till,
        };
        if (contest[0].type === 'lottery' || contest[0].type === 'streak') {
            // promises.push(Contest.checkUserEligibility(contest[0].type, contest[0].parameter, student_id, db.mysql.read));
            promises.push([]);
            eligibility_flag = true;
        } else if (contest[0].type === 'top') {
            eligible = 2;// Case when type of contest is top , in this case eligibility flag will be false
        }
        // promises.push(Contest.getCurrentStats(contest[0].type, contest[0].parameter, student_id, db.mysql.read));
        promises.push([]);
        if (contest[0].type === 'top' && (contest[0].parameter === 'max_views')) {
            console.log('testtt');
            promises.push(ContestContainer.getCurrentWinnerListFromDailyViews(db, currentDate, contest[0].winner_count, contest[0].id));
            current_winner_flag = true;
        }
        promises.push(Contest.getPreviousWinnerList(contest[0].type, contest[0].parameter, contest[0].winner_count, student_id, db.mysql.read));
        promises.push(Contest.getContestRules(contest[0].type, contest[0].parameter, db.mysql.read));
        const result = await Promise.all(promises);
        let filledFlag = false;
        for (let i = 0; i < result.length; i++) {
            if (eligibility_flag && i == 0) { // Case of check eligibility
                if (result[i].length == 0) {
                    eligible = 0; // Case when type is either lottery or streak but eligibilty check query returns 0 rows
                } else if (result[i].length > 0) {
                    eligible = result[i][0].student_eligible;
                }
            } else if (!eligibility_flag && i == 0) { // Case of current stats,here first promise will be of current stats
                if (result[i].length == 0) {
                    datas.stats = {
                        student_id: req.user.student_id,
                        student_username: req.user.student_username,
                        student_fname: (req.user.student_fname === '' || req.user.student_fname === 'undefined') ? null : req.user.student_fname,
                        profile_image: (req.user.img_url === '' || req.user.img_url === 'undefined') ? null : req.user.img_url,
                        count: 0,
                        text_string: contest[0].text_string,
                        total_engagement_time: 0,
                        eligible, // Case when type = top so eligible=2
                    };
                } else if (result[i].length > 0) {
                    datas.stats = {
                        student_id: req.user.student_id,
                        student_username: req.user.student_username,
                        student_fname: (req.user.student_fname === '' || req.user.student_fname == 'undefined') ? null : req.user.student_fname,
                        profile_image: (req.user.img_url === '' || req.user.img_url == 'undefined') ? null : req.user.img_url,
                        count: result[i][0].video_count,
                        text_string: contest[0].text_string,
                        total_engagement_time: result[i].total_engagement_time,
                        eligible, // Case when type = top so eligible=2
                    };
                }
            } else if (eligibility_flag && i == 1) { // This is the case when type is either lottery or streak
                if (result[i].length > 0) {
                    if (contest[0].type === 'lottery' && contest[0].parameter === 'min_referral') {
                        datas.stats = {
                            student_id: req.user.student_id,
                            student_username: req.user.student_username,
                            student_fname: (req.user.student_fname === '' || req.user.student_fname == 'undefined') ? null : req.user.student_fname,
                            profile_image: (req.user.img_url === '' || req.user.img_url == 'undefined') ? null : req.user.img_url,
                            count: result[i][0].total_referral,
                            total_engagement_time: 0,
                            text_string: contest[0].text_string,
                            eligible,
                        };
                    } else {
                        datas.stats = {
                            student_id: req.user.student_id,
                            student_username: req.user.student_username,
                            student_fname: (req.user.student_fname === '' || req.user.student_fname == 'undefined') ? null : req.user.student_fname,
                            profile_image: (req.user.img_url === '' || req.user.img_url == 'undefined') ? null : req.user.img_url,
                            count: result[i][0].video_count,
                            text_string: contest[0].text_string,
                            total_engagement_time: result[i][0].total_engagement_time,
                            eligible,
                        };
                    }
                } else if (result[i].length === 0) {
                    if (contest[0].type === 'lottery' && contest[0].parameter === 'min_referral') {
                        datas.stats = {
                            student_id: req.user.student_id,
                            student_username: req.user.student_username,
                            student_fname: (req.user.student_fname === '' || req.user.student_fname == 'undefined') ? null : req.user.student_fname,
                            profile_image: (req.user.img_url === '' || req.user.img_url == 'undefined') ? null : req.user.img_url,
                            count: 0,
                            total_engagement_time: 0,
                            text_string: contest[0].text_string,
                            eligible,
                        };
                    } else {
                        datas.stats = {
                            student_id: req.user.student_id,
                            student_username: req.user.student_username,
                            student_fname: (req.user.student_fname === '' || req.user.student_fname == 'undefined') ? null : req.user.student_fname,
                            profile_image: (req.user.img_url === '' || req.user.img_url == 'undefined') ? null : req.user.img_url,
                            count: 0,
                            text_string: contest[0].text_string,
                            total_engagement_time: 0,
                            eligible,
                        };
                    }
                }
            }

            // Current Winner list Case
            if (current_winner_flag) {
                if (eligibility_flag && i == 2) {
                    result[i].forEach((item) => {
                        item.amount = contest[0].amount;
                        item.type = contest[0].type;
                        item.parameter = contest[0].parameter;
                        item.contest_id = contest[0].contest_id;
                        item.date = new Date();
                    });

                    datas.current_winner_list = result[i];
                } else if (!eligibility_flag && i == 1) {
                    result[i].forEach((item) => {
                        item.amount = contest[0].amount;
                        item.type = contest[0].type;
                        item.parameter = contest[0].parameter;
                        item.contest_id = contest[0].contest_id;
                        item.date = new Date();
                    });
                    datas.current_winner_list = result[i];
                }
            } else if (!current_winner_flag) {
                if (!filledFlag && i >= 2) {
                    datas.current_winner_list = [];
                    filledFlag = true;
                }
            }
            // Previous Winner list Case
            if (current_winner_flag && eligibility_flag) {
                if (i == 3) {
                    datas.previous_winner_list = result[i];
                }
            } else if ((!current_winner_flag && eligibility_flag) || (current_winner_flag && !eligibility_flag)) {
                if (i == 2) {
                    datas.previous_winner_list = result[i];
                }
            } else if (!current_winner_flag && !eligibility_flag) {
                if (i == 1) {
                    datas.previous_winner_list = result[i];
                }
            }
            // Rules Case
            if (current_winner_flag && eligibility_flag) {
                if (i == 4) {
                    datas.rules = result[i];
                }
            } else if ((!current_winner_flag && eligibility_flag) || (current_winner_flag && !eligibility_flag)) {
                if (i == 3) {
                    datas.rules = result[i];
                }
            } else if (!current_winner_flag && !eligibility_flag) {
                if (i == 2) {
                    datas.rules = result[i];
                }
            }
        }

        if (contest[0].type == 'streak') {
            let streakCount = await StudentRedis.getUserStreakCount(student_id, db.redis.read);
            if (_.isNull(streakCount)) {
                streakCount = 0;
            } else {
                streakCount = streakCount.toString();
            }
            datas.stats.count = streakCount;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: datas,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = { getActiveContests, getContestDetail };
