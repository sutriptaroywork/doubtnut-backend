/**
 * @Author: xesloohc
 * @Date:   2019-06-11T15:41:06+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-10-14T17:08:07+05:30
 */

const _ = require('lodash');
const moment = require('moment');
const Badges = require('../../../config/achievement_meta.json');
const Gamification = require('../../../modules/mysql/gamification');
const GamificationRedis = require('../../../modules/redis/gamification');
// const Student = require('../../../modules/student');
const DAILY_STREAK = require('../../../config/daily_streak.json');
const bl = require('./gamification.bl');
const Utility = require('../../../modules/utility');
const StudentContainer = require('../../../modules/containers/student');

let db; let config;

async function getBadge(req, res) {
    // GET
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.params;
    // get user meta
    let student_gamification_meta = Gamification.getGamificationUserMeta(db.mysql.read, student_id);
    let badges = Gamification.getBadges(db.mysql.read);
    student_gamification_meta = await student_gamification_meta;
    badges = await badges;
    if (student_gamification_meta.length < 1) {
        // let student_meta_create = await Gamification.createGamificationUserMata(db.mysql.write,student_id)
        student_gamification_meta = [{
            user_id: student_id, lvl: 0, points: 0, badges: '', daily_streak: 1, max_daily_streak: 1,
        }];
    }
    const badges_achieved = _.split(student_gamification_meta[0].badges, ',');

    const profile_badge_view = _.reverse(_.sortBy(_.map(badges, (badge) => {
        if (badges_achieved.includes(badge.id.toString())) {
            badge.is_achieved = 1;
        } else {
            badge.is_achieved = 0;
        }
        badge.share_message = `I have earned a ${badge.name} Badge on Doubtnut. Aap bhi Doubtnut download karein aur aaise mazedaar badges jeetein :)`;
        return badge;
    }), 'is_achieved'));
    // get badge data

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: profile_badge_view,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function dailyStreakJsonBuilder(badges, student_id, streak, max_streak, max, min) {
    const streak_json = [];
    const daily_streak_grouped = _.groupBy(DAILY_STREAK, 'requirement');
    for (let i = min; i <= max; i++) {
        const streak_obj = {
            title: `Day ${i}`,
            icon: '',
            is_achieved: (i <= streak) ? 1 : 0,
            type: 'NONBADGE',
        };
        if (!streak_obj.is_achieved && daily_streak_grouped[i] && i > max_streak) {
            streak_obj.icon = daily_streak_grouped[i][0].image_url;
            streak_obj.type = 'BADGE';
        }

        streak_json.push(streak_obj);
    }
    return streak_json;
}

async function getProfile(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    // let is_own_profile = 1;
    const { student_id } = req.params;
    // if (student_id !== req.user.student_id) {
    //     is_own_profile = 0;
    // }

    // ## MAKE THESE REQUEST CONCURRENT
    // const student_data = await Student.getStudentMinimal(student_id, db.mysql.read);
    const student_data = await StudentContainer.getById(student_id, db);
    let student_gamification_meta = await Gamification.getGamificationUserMeta(db.mysql.read, student_id);
    if (student_gamification_meta.length < 1) {
        // let student_meta_create = await Gamification.createGamificationUserMata(db.mysql.write,student_id)
        student_gamification_meta = [{
            user_id: student_id, lvl: 0, points: 0, badges: '', daily_streak: 1, max_daily_streak: 1,
        }];
    }
    const badges = await Gamification.getBadges(db.mysql.read);

    const badges_achieved = _.split(student_gamification_meta[0].badges, ',');

    const profile_badge_view = _.slice(_.reverse(_.sortBy(_.map(badges, (badge) => {
        if (badges_achieved.includes(badge.id.toString())) {
            badge.is_achieved = 1;
        } else {
            badge.is_achieved = 0;
        }
        return badge;
    }), 'is_achieved')), 0, 4);
    const student_daily_point = await Gamification.getDailyPointsByUserId(db.mysql.read, student_id);
    const student_point = await Gamification.getPointsByUserId(db.mysql.read, student_id);
    const daily_streak = await dailyStreakJsonBuilder(badges, student_gamification_meta[0].user_id, student_gamification_meta[0].daily_streak, student_gamification_meta[0].max_daily_streak, 7, 1);
    const toptenzrange = await GamificationRedis.getLeaderboard(db.redis.read, 0, 4);
    const topten_student_ids = [];
    const topten_student_scores = [];
    const topten_student_ranks = [];
    let rankcounter = 1;
    for (let i = 0; i < toptenzrange.length; i++) {
        if (i % 2 === 0) { // index is even
            topten_student_ids.push(toptenzrange[i]);
            topten_student_ranks.push(rankcounter);
            rankcounter++;
        } else {
            topten_student_scores.push(toptenzrange[i]);
        }
    }

    const leaderboard_data = [];
    if (topten_student_ids.length > 0) {
        console.log(topten_student_ids);
        const student_data_by_ids = await Gamification.getStudentByIds(db.mysql.read, topten_student_ids);
        const grouped_student_data_ids = _.groupBy(student_data_by_ids, 'student_id');

        console.log(grouped_student_data_ids);
        _.forEach(topten_student_ids, (topten_student_id, key) => {
            if (!grouped_student_data_ids[topten_student_id][0].img_url) {
                grouped_student_data_ids[topten_student_id][0].img_url = '';
            }
            const data = {
                user_id: grouped_student_data_ids[topten_student_id][0].student_id,
                user_name: grouped_student_data_ids[topten_student_id][0].student_username,
                rank: topten_student_ranks[key],
                profile_image: grouped_student_data_ids[topten_student_id][0].img_url,
                points: topten_student_scores[key],
                is_own: 0,
            };
            if (topten_student_id == student_id) {
                data.is_own = 1;
            }
            leaderboard_data.push(data);
        });
    }

    if (!student_data[0].student_username) {
        student_data[0].student_username = '';
    }
    if (!student_data[0].school_name) {
        student_data[0].school_name = '';
    }
    const outputformat = {
        username: student_data[0].student_username,
        profile_image: student_data[0].img_url,
        user_level: `LEVEL ${student_gamification_meta[0].lvl}`,
        user_recent_badges: profile_badge_view,
        user_lifetime_points: student_point[0].daily_point ? student_point[0].daily_point : 0,
        user_todays_point: student_daily_point[0].daily_point ? student_daily_point[0].daily_point : 0,
        daily_streak_progress: daily_streak,
        leaderboard: leaderboard_data,
        student_email: '',
        school_name: student_data[0].school_name,
        points_to_earned_with_login: 'Login and Complete Profile To Earn a Badge',
    };
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: outputformat,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getDailyStreak(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.user;
    // f student_id = 1399754
    let student_gamification_meta = await Gamification.getGamificationUserMeta(db.mysql.read, student_id);

    if (student_gamification_meta.length < 1) {
        // let student_meta_create = await Gamification.createGamificationUserMata(db.mysql.write,student_id)
        student_gamification_meta = {
            user_id: student_id, lvl: 0, points: 0, badges: '', daily_streak: 1, max_daily_streak: 1,
        };
    } else {
        student_gamification_meta = student_gamification_meta[0];
    }
    // get dailystreak badge
    // let student_badge_data = await Gamification.getStudentMilestoneByType(db.mysql.read,student_id,'DAILY_STREAK')
    // let student_badge_data_grouped = _.groupBy(student_badge_data,'milestone')
    _.map(DAILY_STREAK, (badge) => {
        if (badge.requirement <= student_gamification_meta.max_daily_streak) {
            badge.is_achieved = 1;
        } else {
            badge.is_achieved = 0;
        }
        badge.share_message = `I have earned a ${badge.name} Badge on Doubtnut. Aap bhi Doubtnut download karein aur aaise mazedaar badges jeetein :)`;
        return badge;
    });
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: DAILY_STREAK,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getPoints(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.user;
    // const student_data = await Student.getStudent(student_id, db.mysql.read);
    const student_data = await StudentContainer.getById(student_id, db);

    let student_gamification_meta = await Gamification.getGamificationUserMeta(db.mysql.read, student_id);
    if (student_gamification_meta.length < 1) {
        // let student_meta_create = await Gamification.createGamificationUserMata(db.mysql.write,student_id)
        student_gamification_meta = [{
            user_id: student_id, lvl: 0, points: 0, badges: '', daily_streak: 1, max_daily_streak: 1,
        }];
    }
    const grouped_badges = _.groupBy(Badges, 'requirement_type');
    let next_badge_raw = {};
    // let level_badges = _.orderBy(grouped_badges['LEVEL'],['requirement'],['asc'])
    // console.log(level_badges)

    for (let i = 0; i < grouped_badges.LEVEL.length; i++) {
        if (parseInt(grouped_badges.LEVEL[i].requirement) > parseInt(student_gamification_meta[0].lvl)) {
            next_badge_raw = grouped_badges.LEVEL[i];
            i = grouped_badges.LEVEL.length;
        }
    }


    console.log(next_badge_raw);
    // ## GET 5 LEVEL AROUND USER CURRENT RANGING Current-2,Current+2

    const lvl_progress = await Gamification.getLvlRange(db.mysql.read, student_gamification_meta[0].lvl);

    const lvl_action = await Gamification.getActionConfig(db.mysql.read);
    const next_badge = {
        next_text: next_badge_raw.nudge_description,
        id: 1,
        name: next_badge_raw.name,
        description: `${next_badge_raw.nudge_description} \n ${next_badge_raw.name} Badge`,
        image_url: next_badge_raw.image_url,
    };
    console.log(next_badge);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: { lvl_action, lvl_progress, next_badge },
    };
    res.status(responseData.meta.code).json(responseData);
}

async function leaderboard(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.user;
    // let student_id = 503
    const toptenzrange = await GamificationRedis.getLeaderboard(db.redis.read, 0, 9);
    const topten_student_ids = [];
    const topten_student_scores = [];
    const topten_student_ranks = [];
    let rankcounter = 1;
    for (let i = 0; i < toptenzrange.length; i++) {
        if (i % 2 === 0) { // index is even
            topten_student_ids.push(toptenzrange[i]);
            topten_student_ranks.push(rankcounter);
            rankcounter++;
        } else {
            topten_student_scores.push(toptenzrange[i]);
        }
    }
    if (!topten_student_ids.includes(student_id.toString())) {
        let student_rank = await GamificationRedis.getRankByUserId(db.redis.read, student_id);
        if (student_rank) {
            student_rank++;
            const student_score = await GamificationRedis.getScoreByUserId(db.redis.read, student_id);
            topten_student_ids.push(student_id);
            topten_student_scores.push(student_score);
            topten_student_ranks.push(student_rank);
        }
    }
    const leaderboard_data = [];
    if (topten_student_ids.length > 0) {
        console.log(topten_student_ids);
        const student_data_by_ids = await Gamification.getStudentByIds(db.mysql.read, topten_student_ids);
        const grouped_student_data_ids = _.groupBy(student_data_by_ids, 'student_id');
        console.log(grouped_student_data_ids);
        _.forEach(topten_student_ids, (topten_student_id, key) => {
            const data = {
                user_id: grouped_student_data_ids[topten_student_id][0].student_id,
                user_name: grouped_student_data_ids[topten_student_id][0].student_username,
                rank: topten_student_ranks[key],
                profile_image: grouped_student_data_ids[topten_student_id][0].img_url,
                points: topten_student_scores[key],
                is_own: 0,
            };
            if (topten_student_id == student_id) {
                data.is_own = 1;
            }
            leaderboard_data.push(data);
        });
    }

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: leaderboard_data,
    };
    res.status(responseData.meta.code).json(responseData);
    console.log('leaderboard');
}

async function updateDailyStreak(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            data: {},
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
async function simulateActionSQS(req, res) {
    config = req.app.get('config');
    const sqs = req.app.get('sqs');
    const { student_id } = req.user;
    // const { ask } = req.query;
    const params = {
        MessageBody: JSON.stringify({
            action: 'INVITE',
            user_id: student_id,
            refer_id: 503,
        }),
        QueueUrl: config.gamification_sqs,
    };
    sqs.sendMessage(params, (err, data) => {
        if (err) {
            console.log('Error', err);
        } else {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: data.MessageId,
            };
            res.status(responseData.meta.code).json(responseData);
            console.log('Success', data.MessageId);
        }
    });
}

async function sendNotification(req, res, next) {
    try {
        db = req.app.get('db');
        const student_id = parseInt(req.params.student_id);
        const { notification_type } = req.params;
        console.log(student_id);
        // const student_data = await Student.getStudent(student_id, db.mysql.read);
        const student_data = await StudentContainer.getById(student_id, db);
        console.log(student_data);
        const fcmId = student_data[0].gcm_reg_id;
        const messageTosend = {};
        if (notification_type == '1') {
            messageTosend.data = {
                notification_type: 'SILENT_GAMIFICATION',
                popup_direction: 'TOP_RIGHT',
                popup_type: 'popup_points_achieved',
                message: 'Congratulations',
                description: 'You earned 10 points',
                img_url: '',
            };
        } else if (notification_type == '2') {
            messageTosend.data = {
                notification_type: 'SILENT_GAMIFICATION',
                popup_direction: 'BOTTOM',
                popup_type: 'popup_badge_achieved',
                message: 'Congratulations',
                description: 'You Have Earned GOD',
                img_url: `${config.staticCDN}engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp`,
            };
        } else if (notification_type == '3') {
            messageTosend.data = {
                notification_type: 'SILENT_GAMIFICATION',
                popup_direction: 'BOTTOM',
                popup_type: 'popup_badge',
                message: 'Congratulations',
                description: 'You Have Earned GOD',
                img_url: `${config.staticCDN}engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp`,
            };
        } else if (notification_type == '4') {
            messageTosend.data = {
                notification_type: 'SILENT_GAMIFICATION',
                popup_direction: 'BOTTOM',
                popup_type: 'popup_levelup',
                message: 'Well Done!',
                description: 'You Reached Level 1',
                img_url: `${config.staticCDN}engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp`,
                duration: '5000',
            };
        } else if (notification_type == '5') {
            messageTosend.data = {
                notification_type: 'SILENT_GAMIFICATION',
                popup_direction: 'CENTER',
                popup_type: 'popup_unlock',
                message: 'Congratulation',
                description: 'Physics and Chemistry',
                img_url: `${config.staticCDN}engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp`,
                duration: '5000',
                action_data: JSON.stringify({
                    type: 'playlist', id: 101996, title: 'CONCEPT VIDEOS', button_text: 'EXPLORE',
                }),
            };
        } else if (notification_type == '6') {
            messageTosend.data = {
                notification_type: 'SILENT_GAMIFICATION',
                popup_direction: 'CENTER',
                popup_type: 'popup_unlock',
                message: 'Congratulation',
                description: 'Physics and Chemistry',
                img_url: `${config.staticCDN}engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp`,
                duration: '5000',
                action_data: JSON.stringify({
                    type: 'library', id: '', title: '', button_text: 'EXPLORE',
                }),
            };
        } else if (notification_type == '7') {
            messageTosend.data = {
                notification_type: 'SILENT_GAMIFICATION',
                popup_direction: 'CENTER',
                popup_type: 'popup_alert',
                message: 'Be Careful Yahan ashlil, abusive ya offensive language ka use nahi karein',
                description: JSON.stringify([' Isse aap block ho sakte hai 🚫', ' Aap pe sec. 499 IPC ke under legal action bhi ho sakta hai']),
                button_text: 'Okay, I Will Be Careful',
                img_url: '',
            };
        }
        messageTosend.token = fcmId;
        messageTosend.android = {
            priority: 'normal',
            ttl: 4500,
        };
        Utility.sendFcm(student_id, fcmId, messageTosend).then((response) => {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: {},
            };
            res.status(responseData.meta.code).json(responseData);
            console.log('Successfully sent message:', response);
        }).catch((error) => {
            const responseData = {
                meta: {
                    code: 500,
                    success: false,
                    message: 'error!',
                },
                data: error,
            };
            res.status(responseData.meta.code).json(responseData);
            console.log('Error sending message:', error);
        });
    } catch (e) {
        next(e);
    }
}

async function unlockinfo(req, res) {
    config = req.app.get('config');
    db = req.app.get('db');

    const { student_id } = req.user;
    const invite_progress = await Gamification.getActivityCountByType(db.mysql.read, 'INVITE', student_id);
    let student_gamification_meta = await Gamification.getGamificationUserMeta(db.mysql.read, student_id);
    if (student_gamification_meta.length < 1) {
        // let student_meta_create = await Gamification.createGamificationUserMata(db.mysql.write,student_id)
        student_gamification_meta = [{
            user_id: student_id, lvl: 0, points: 0, badges: '', daily_streak: 1, max_daily_streak: 1,
        }];
    }
    const pc_unlock_count = await GamificationRedis.getUnlockCount(db.redis.read);
    const pc_unlock_images = await GamificationRedis.getUnlockImage(db.redis.read);
    console.log(invite_progress);
    // get redis data from keys
    // cluster.incrby("pc_unlock_count",100);
    // cluster.lpush("pc_unlock_images",user_data[0].img_url)
    // cluster.ltrim("pc_unlock_images",0,9)
    // cluster.set("unlock_"+user_data[0].student_id+"_physics_chemistry", "1")
    //
    const data = {
        heading: 'Physics and Chemistry ko karein unlock',
        subheading: 'Jaaniye Kaise?',
        badge_required: [
            {
                id: 19,
                name: 'Earn 75 points',
                description: 'Level 3',
                nudge_description: 'Reach Level 3 to unlock physics and chemistry',
                requirement_type: 'LEVEL',
                requirement: 3,
                image_url: `${config.staticCDN}engagement_framework/DFCEB044-392F-53F6-C294-E874BEE57CE2.webp`,
                current_progress: student_gamification_meta[0].lvl,
                button_text: 'Earn Points',
            },
            {
                id: 11,
                name: 'Invite karein 1 dost',
                description: 'and they join for first time with new mobile',
                nudge_description: 'Invite 1 more Friend on Doubtnut to earn',
                requirement_type: 'INVITE',
                requirement: 1,
                image_url: `${config.staticCDN}engagement_framework/CF379C71-B81E-6BC0-73DF-64A5B5DB9EAC.webp`,
                current_progress: invite_progress[0].count,
                button_text: 'Invite Now',
            },
        ],
        user_images: pc_unlock_images,
        footer_text: `${pc_unlock_count}+ Students already unlocked `,
    };
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getSRPBanner(req, _res, next) {
    try {
        let data;
        if(Utility.isUsRegion(req.headers.country)){
            data = { content: '' };
        }else{
            data = bl.getSRPBanner(req.user.locale, req.headers.version_code);
        }
        // if (data && data.dn_cash) {
        //     // async
        //     bl.addXP(req.app.get('sqs'), req.app.get('config').gamification_sqs, req.user.student_id, data.dn_cash * 2);
        // }
        next({ data });
    } catch (err) {
        next({ err });
    }
}

module.exports = {
    getBadge, getProfile, getDailyStreak, getPoints, leaderboard, updateDailyStreak, simulateActionSQS, sendNotification, unlockinfo, getSRPBanner,
};
