/**
 * This is a helper file of daily goal v2 module,
 * built with class based architecture, used no-sql as primary database
 * PRD: https://docs.google.com/document/d/1KzcbEB2rYMO-5igpONDVabdPlXnYmnaavtXEg_ir2NY
 */

const _ = require('lodash');
const moment = require('moment');
const logger = require('../../config/winston').winstonLogger;
const redisClient = require('../../config/redis');
const redisLibrary = require('../../modules/redis/library');
const WalletUtil = require('../../modules/wallet/Utility.wallet');
const CouponMySQL = require('../../modules/mysql/coupon');
const Coupon = require('../../modules/containers/coupon');
const rewardMysql = require('../../modules/mysql/rewards');
const dailyGoalData = require('../../data/dailygoal.data');
const dailyGoalRedis = require('../../modules/redis/daily.goal');
const dailyGoalMysql = require('../../modules/mysql/doubtfeed');
const AnswerMysql = require('../../modules/mysql/answer');
const DoubtfeedMysql = require('../../modules/mysql/doubtfeed');
const Utility = require('../../modules/utility');
const LiveClassMysql = require('../../modules/mysql/liveclass');
const QuestionRedis = require('../../modules/redis/question');
const QuestionMysql = require('../../modules/mysql/question');
const StudentBl = require('../v1/student/student.bl');
const StudentRedis = require('../../modules/redis/student');
const doubtfeedHelper = require('./doubtfeed.helper');
const homepageQuestionsMaster = require('../../modules/homepageQuestionsMaster');
const FreeLiveClass = require('./freeLiveClass');

class DailyGoalManager {
    /**
     * Daily Goal V2 is a new feature which have internally 2 major features
     * Streak and Reward system
     * Leaderboard
     * There will be 3 levels of this reward system in which
     * users will get scratch cards.
     * @constructor
     */
    constructor(request) {
        this.config = request.app.get('config');
        this.db = request.app.get('db');
        this.locale = request.user.locale;
        this.mongoClient = this.db.mongo;
        this.req = request;
        this.student_id = request.user.student_id;
        this.student_class = (_.isNull(request.user.student_class) ? 12 : parseInt(request.user.student_class));
        this.studentStreakCollection = 'daily_goal_student_rewards';
        this.rewardsCollection = 'daily_goal_rewards';
        this.message = 'SUCCESS';
        this.is_streak_break = false;
        this.isReward = false;
        this.studentName = (this.req.user.student_fname ? this.req.user.student_fname : 'Doubtnut User');
        // eslint-disable-next-line no-mixed-operators
        this.daysDifferenceFromCurrent = (d) => {
            const current = moment().add(5, 'hours').add(30, 'minutes');
            d = moment(d);
            return moment(`${current.format('DD-MM-YYYY')}`, 'DD-MM-YYYY').diff(moment(`${d.format('DD-MM-YYYY')}`, 'DD-MM-YYYY'), 'days');
        };
        this.safeTrim = (content) => (_.isEmpty(content) ? content : content.trim());
        this.safeTrimAndReplace = (content, replacedText) => (_.isEmpty(content) ? content : content.trim().replace('<>', replacedText));
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();
        this.isToday = (time) => moment().add(5, 'hours').add(30, 'minutes').isSame(moment(time), 'day');
    }

    getNowAndTodayInIST() {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const today = now.format('YYYY-MM-DD');
        return { now, today };
    }

    getUnachivedReward(reward) {
        return {
            level: reward.level,
            day: reward.day,
            reward_type: null,
            is_unlocked: false,
            is_scratched: false,
            scratch_desc: null,
            short_desc: (this.locale === 'hi' ? reward.short_desc_hi : reward.short_desc),
            locked_desc: (this.locale === 'hi' ? reward.locked_desc_hi : reward.locked_desc),
            locked_short_desc: (this.locale === 'hi' ? reward.locked_short_desc_hi : reward.locked_short_desc_en),
            locked_subtitle: (this.locale === 'hi' ? dailyGoalData.lockedSubtitleHi : dailyGoalData.lockedSubtitleEn),
            deeplink: null,
            cta_text: null,
            secondary_cta_text: null,
            scratch_image_link: null,
            unlocked_at: null,
            is_share_enabled: false,
        };
    }

    getAchievedReward(reward) {
        return {
            level: reward.level,
            day: reward.day,
            reward_type: reward.reward_type,
            is_unlocked: reward.is_unlocked,
            is_scratched: reward.is_scratched,
            scratch_desc: (this.locale === 'hi' ? reward.scratch_desc_hi : reward.scratch_desc),
            short_desc: (this.locale === 'hi' ? reward.short_desc_hi : reward.short_desc),
            locked_desc: null,
            locked_short_desc: null,
            locked_subtitle: null,
            deeplink: reward.deeplink,
            cta_text: (this.locale === 'hi' ? reward.cta_text_hi : reward.cta_text),
            secondary_cta_text: (this.locale === 'hi' ? reward.secondary_cta_text_hi : reward.secondary_cta_text),
            scratch_image_link: reward.scratch_image_link,
            unlocked_at: reward.unlocked_at,
            is_share_enabled: reward.is_share_enabled,
        };
    }

    async getStudentStreak() {
        try {
            const studentData = await this.mongoClient.read.collection(this.studentStreakCollection).findOne({ studentId: this.student_id });
            const versionCode = parseInt(this.req.headers.version_code);
            let allRewards = await this.mongoClient.read.collection(this.rewardsCollection).find({
                min_app_version: { $lte: versionCode }, max_app_version: { $gte: versionCode },
            }).sort({ level: 1 }).toArray();
            const studentAchievedRewards = (studentData ? studentData.scratch_cards : []);
            const rewards = [];
            const lastMarkedStreak = (studentData ? studentData.last_marked_streak : 0);
            const lastStreakTimestamp = (studentData ? studentData.last_streak_timestamp : null);
            let currentReward;
            let level;
            const knowMore = [];
            if (studentData && studentAchievedRewards.length) {
                // first appending students achieved rewards
                for (let i = 0; i < studentAchievedRewards.length; i++) {
                    currentReward = this.getAchievedReward(studentAchievedRewards[i]);
                    if (currentReward.reward_type === 'wallet') {
                        currentReward.wallet_amount = studentAchievedRewards[i].wallet_amount;
                    } else if (currentReward.reward_type === 'coupon') {
                        currentReward.coupon_code = studentAchievedRewards[i].coupon_code;
                    }
                    rewards.push(currentReward);
                    level = studentAchievedRewards[i].level;
                    knowMore.push({
                        title: `${(this.locale === 'hi' ? 'स्क्रैच कार्ड ' : 'Scratch card ')}${level}`,
                        description: (this.locale === 'hi' ? allRewards[i].know_more_hi : allRewards[i].know_more_en),
                    });
                }
                allRewards = _.filter(allRewards, (r) => r.level > level);
            }

            const rewardsDays = await this.getAllRewardDays();
            let i = 0;
            let previousRewardDay;
            while (i < rewardsDays.length) {
                if (rewardsDays[i] > lastMarkedStreak) {
                    previousRewardDay = rewardsDays[i - 1];
                    break;
                }
                i++;
            }

            // appending non-achieved levels
            /* eslint-disable no-await-in-loop */
            for (let j = 0; j < allRewards.length; j++) {
                if (allRewards[j].day === previousRewardDay) {
                    console.log('User is eligible to achieve this level');
                    this.day = previousRewardDay;
                    const scratchCard = await this.getApplicableScratchCards();
                    if (scratchCard) {
                        await this.mongoClient.write.collection(this.studentStreakCollection).updateOne({ studentId: this.student_id }, {
                            $set: {
                                updated_at: this.currentDate,
                            },
                            $push: {
                                scratch_cards: scratchCard,
                            },
                        }, { upsert: true }, (err) => {
                            if (err) {
                                console.error(err);
                                let errorLog = err;
                                if (!_.isObject(errorLog)) {
                                    errorLog = JSON.stringify(errorLog);
                                }
                                logger.error({ tag: 'dailyGoalHelper', source: 'processAttendance', error: errorLog });
                            }
                        });
                        currentReward = this.getAchievedReward(scratchCard);
                        if (currentReward.reward_type === 'wallet') {
                            currentReward.wallet_amount = scratchCard.wallet_amount;
                        } else if (currentReward.reward_type === 'coupon') {
                            currentReward.coupon_code = scratchCard.coupon_code;
                        }
                        rewards.push(currentReward);
                        level = scratchCard.level;
                        knowMore.push({
                            title: `${(this.locale === 'hi' ? 'स्क्रैच कार्ड ' : 'Scratch card ')}${level}`,
                            description: (this.locale === 'hi' ? scratchCard.know_more_hi : scratchCard.know_more_en),
                        });
                    }
                } else {
                    currentReward = this.getUnachivedReward(allRewards[j]);
                    rewards.push(currentReward);
                    knowMore.push({
                        title: `${(this.locale === 'hi' ? 'स्क्रैच कार्ड ' : 'Scratch card ')}${allRewards[j].level}`,
                        description: (this.locale === 'hi' ? allRewards[j].know_more_hi : allRewards[j].know_more_en),
                    });
                }
            }

            return {
                rewards,
                last_marked_streak: lastMarkedStreak,
                last_streak_timestamp: lastStreakTimestamp,
                knowMore,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'getStudentStreak', error: errorLog });
            throw new Error(e);
        }
    }

    async getRewards() {
        try {
            const studentStreak = await this.getStudentStreak();
            studentStreak.know_more = (this.locale === 'hi' ? dailyGoalData.knowMoreHi : dailyGoalData.knowMoreEn);
            studentStreak.reward_title = (this.locale === 'hi' ? dailyGoalData.reward.scratch_title.hi : dailyGoalData.reward.scratch_title.en);
            studentStreak.know_more.content = studentStreak.knowMore;
            studentStreak.share_text = (this.locale === 'hi' ? dailyGoalData.shareTextHi : dailyGoalData.shareTextEn);
            studentStreak.info_title = (this.locale === 'hi' ? dailyGoalData.reward.info.title.hi : dailyGoalData.reward.info.title.en);
            studentStreak.info_description = (this.locale === 'hi' ? dailyGoalData.reward.info.description.hi : dailyGoalData.reward.info.description.en);
            studentStreak.title = (this.locale === 'hi' ? dailyGoalData.reward.title.hi : dailyGoalData.reward.title.en);
            let streakDay = 1;
            if (studentStreak.last_streak_timestamp) {
                streakDay = this.isToday(studentStreak.last_streak_timestamp) ? studentStreak.last_marked_streak : studentStreak.last_marked_streak + 1;
            }
            studentStreak.subtitle = (this.locale === 'hi' ? dailyGoalData.reward.subtitle.hi : dailyGoalData.reward.subtitle.en).replace('<>', streakDay.toString());
            studentStreak.incomplete_day_text = this.locale === 'hi' ? dailyGoalData.reward.incomplete.hi : dailyGoalData.reward.incomplete.en;
            delete studentStreak.knowMore;
            return studentStreak;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'getRewards', error: errorLog });
            throw new Error(e);
        }
    }

    async markDailyGoalComplete() {
        /**
         * In case of any gap in between, streak will start again from last reward day.
         */
        try {
            console.log('daily goal complete for ', this.student_id, this.currentDate);
            const lastMarkedStreak = await this.getLastMarkedStreak();
            let totalDayDifference;
            if (lastMarkedStreak) {
                this.day = lastMarkedStreak.last_marked_streak + 1;
                const lastStreakTimestamp = lastMarkedStreak.last_streak_timestamp;
                totalDayDifference = this.daysDifferenceFromCurrent(lastStreakTimestamp);
                this.lastStreak = [lastMarkedStreak];
                if (totalDayDifference === 0) {
                    // Mark streak requested on same day
                    console.log('can not update the streak');
                    this.message = 'Streak has already been marked for the day';
                    this.day = lastMarkedStreak.last_marked_streak;
                } else if (totalDayDifference === 1) {
                    // eligible to update streak
                    console.log('eligible to update streak');
                    await this.processStreak();
                } else if (totalDayDifference > 1) {
                    // days difference more than one
                    console.log('found more than one days difference, streak break!!');
                    const rewardsDays = await this.getAllRewardDays();
                    let i = 0;
                    let previousRewardDay;
                    while (i < rewardsDays.length) {
                        if (rewardsDays[i] > lastMarkedStreak.last_marked_streak) {
                            previousRewardDay = rewardsDays[i - 1];
                            break;
                        }
                        i++;
                    }
                    if (!_.isNull(previousRewardDay)) {
                        previousRewardDay = 1;
                    }
                    this.day = previousRewardDay;
                    await this.breakStreak();
                    this.is_streak_break = true;
                    this.message = 'Found more than one day difference, streak break!!';
                }
            } else {
                console.log('student came first time');
                this.day = 1;
                if (await this.createNewStudentEntry()) {
                    this.message = 'First streak marked successfully!';
                    this.day = 1;
                    totalDayDifference = 1;
                }
            }
            let scratchCard = null;
            let notificationData = null;
            if (this.scratchCard && totalDayDifference) {
                scratchCard = this.scratchCard[0];
            }
            if (this.topic && this.description) {
                notificationData = { topic: this.topic, description: this.description };
            }
            return {
                message: this.message,
                data: {
                    notification_data: notificationData,
                    scratch_card: scratchCard,
                    is_reward: this.isReward,
                    is_streak_break: this.is_streak_break,
                    day: this.day,
                },
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'markDailyGoalComplete', error: errorLog });
            throw new Error(e);
        }
    }

    async getLastMarkedStreak() {
        try {
            return await this.mongoClient.read.collection(this.studentStreakCollection).findOne({
                studentId: this.student_id,
            });
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'getLastMarkedStreak', error: errorLog });
            throw new Error(e);
        }
    }

    async createNewStudentEntry() {
        try {
            const scratchCard = await this.getApplicableScratchCards();
            console.log('creating new entry');
            const studentAttendanceDetails = {
                studentId: this.student_id,
                last_streak_timestamp: this.currentDate,
                last_marked_streak: 1,
                is_notification_opted: true,
                total_streak_break: 0,
                created_at: this.currentDate,
            };
            studentAttendanceDetails.scratch_cards = [];
            if (scratchCard) {
                this.isReward = true;
                // scratch card found for requested day
                studentAttendanceDetails.scratch_cards = [scratchCard];
                const commonFormattedScratchCard = this.getAchievedReward(scratchCard);
                if (commonFormattedScratchCard.reward_type === 'wallet') {
                    commonFormattedScratchCard.wallet_amount = scratchCard.wallet_amount;
                } else if (commonFormattedScratchCard.reward_type === 'coupon') {
                    commonFormattedScratchCard.coupon_code = scratchCard.coupon_code;
                    commonFormattedScratchCard.discount = scratchCard.discount;
                }
                this.topic = 'It\'s Streak Reward Time';
                this.description = 'Scratch card waiting for you. Click to see what you won';
                this.scratchCard = [commonFormattedScratchCard];
            }
            await this.mongoClient.write.collection(this.studentStreakCollection).insertOne(studentAttendanceDetails);
            return true;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'markDailyGoalComplete', error: errorLog });
            throw new Error(e);
        }
    }

    async breakStreak() {
        await this.mongoClient.write.collection(this.studentStreakCollection).updateOne({ studentId: this.student_id }, {
            $set: {
                updated_at: this.currentDate,
                last_streak_timestamp: this.currentDate,
                last_marked_streak: this.day,
            },
            $inc: { total_streak_break: 1 },
        }, { upsert: true }, (err) => {
            if (err) {
                console.error(err);
                let errorLog = err;
                if (!_.isObject(errorLog)) {
                    errorLog = JSON.stringify(errorLog);
                }
                logger.error({ tag: 'dailyGoalHelper', source: 'breakStreak', error: errorLog });
                return false;
            }
            return true;
        });
    }

    async processStreak() {
        /**
         * Process Streak method does update the streak
         * and push new rewards if applicable.
         */
        const scratchCard = await this.getApplicableScratchCards();
        const studentAchievedLevels = [];
        this.lastStreak[0].scratch_cards.forEach((value) => {
            studentAchievedLevels.push(value.level);
        });
        if (scratchCard && !studentAchievedLevels.includes(scratchCard.level)) {
            // push rewards only if it's achieved first time.
            const commonFormattedScratchCard = this.getAchievedReward(scratchCard);
            if (commonFormattedScratchCard.reward_type === 'wallet') {
                commonFormattedScratchCard.wallet_amount = scratchCard.wallet_amount;
            } else if (commonFormattedScratchCard.reward_type === 'coupon') {
                commonFormattedScratchCard.coupon_code = scratchCard.coupon_code;
            }
            this.scratchCard = [commonFormattedScratchCard];
            this.isReward = true;
            this.topic = 'It\'s Streak Reward Time';
            this.description = 'Scratch card waiting for you. Click to see what you won';
            await this.mongoClient.write.collection(this.studentStreakCollection).updateOne({ studentId: this.student_id }, {
                $set: {
                    updated_at: this.currentDate,
                    last_streak_timestamp: this.currentDate,
                },
                $inc: { last_marked_streak: 1 },
                $push: {
                    scratch_cards: scratchCard,
                },
            }, { upsert: true }, (err) => {
                if (err) {
                    console.error(err);
                    let errorLog = err;
                    if (!_.isObject(errorLog)) {
                        errorLog = JSON.stringify(errorLog);
                    }
                    logger.error({ tag: 'dailyGoalHelper', source: 'processAttendance', error: errorLog });
                    return false;
                }
                this.message = 'Streak updated with a new reward';
                return true;
            });
        } else {
            this.isReward = false;
            await this.mongoClient.write.collection(this.studentStreakCollection).updateOne({ studentId: this.student_id }, {
                $set: {
                    updated_at: this.currentDate,
                    last_streak_timestamp: this.currentDate,
                },
                $inc: { last_marked_streak: 1 },
            }, { upsert: true }, (err) => {
                if (err) {
                    console.error(err);
                    let errorLog = err;
                    if (!_.isObject(errorLog)) {
                        errorLog = JSON.stringify(errorLog);
                    }
                    logger.error({ tag: 'dailyGoalHelper', source: 'processAttendance', error: errorLog });
                    return false;
                }
                this.message = 'Streak updated without any rewards';
                return true;
            });
        }
    }

    async getApplicableScratchCards() {
        /**
         * whatever rewards he has got through scratch card,
         * for example paid video unlocked or game unlocked,
         * that scratch will be linked to that particular
         * game or paid video and on clicking he will be
         * able to view or play that game.
         */
        try {
            const versionCode = parseInt(this.req.headers.version_code);
            const rewards = await this.mongoClient.read.collection(this.rewardsCollection).findOne({
                day: this.day, min_app_version: { $lte: versionCode }, max_app_version: { $gte: versionCode },
            });
            let scratchCard;
            if (rewards) {
                let randomRewardFound = false;
                let rewardsData;
                while (!randomRewardFound) {
                    rewardsData = [_.sample(_.filter(rewards.rewards, (d) => d.is_active === 1))];
                    if (_.includes(rewardsData[0].applicable_classes, parseInt(this.student_class))) {
                        randomRewardFound = true;
                    }
                }
                this.rewardLevel = rewards.level;
                for (let i = 0; i < rewardsData.length; i++) {
                    const rewardType = rewardsData[i].reward_type;
                    if (rewardType === 'coupon') {
                        console.log('coupon type reward');
                        // eslint-disable-next-line no-await-in-loop
                        const couponCode = await this.getRandomCoupon();
                        scratchCard = this.getCommonScratchContent(rewardsData[i], couponCode, rewards);
                        scratchCard.coupon_code = couponCode;
                        scratchCard.discount = rewardsData[i].discount;
                        break;
                    } else if (rewardType === 'wallet') {
                        console.log('wallet type reward');
                        const rewardWallet = Math.floor(Math.random() * (rewardsData[i].wallet_max_amount - rewardsData[i].wallet_min_amount + 1) + rewardsData[i].wallet_min_amount);
                        scratchCard = this.getCommonScratchContent(rewardsData[i], rewardWallet, rewards);
                        scratchCard.wallet_amount = rewardWallet;
                        break;
                    } else {
                        logger.error({ tag: 'dailyGoalHelper', source: 'getApplicableScratchCards', error: 'unknown reward found during scratch!' });
                        throw new Error('Uh oh! unknown reward found.');
                    }
                }
                return scratchCard;
            }
            return false;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'getApplicableScratchCards', error: errorLog });
            throw new Error(e);
        }
    }

    getCommonScratchContent(rewardsData, replaceText, parentReward) {
        return {
            day: this.day,
            level: this.rewardLevel,
            is_scratched: false,
            is_unlocked: true,
            reward_type: rewardsData.reward_type,
            scratch_desc: this.safeTrimAndReplace(rewardsData.scratch_desc, replaceText),
            scratch_desc_hi: this.safeTrimAndReplace(rewardsData.scratch_desc_hi, replaceText),
            short_desc: this.safeTrimAndReplace(parentReward.short_desc, replaceText),
            short_desc_hi: this.safeTrimAndReplace(parentReward.short_desc_hi, replaceText),
            scratch_image_link: this.safeTrim(rewardsData.scratch_image_link),
            cta_text: this.safeTrimAndReplace(rewardsData.cta_text, replaceText),
            cta_text_hi: this.safeTrimAndReplace(rewardsData.cta_text_hi, replaceText),
            secondary_cta_text: this.safeTrimAndReplace(rewardsData.secondary_cta_text, replaceText),
            secondary_cta_text_hi: this.safeTrimAndReplace(rewardsData.secondary_cta_text_hi, replaceText),
            deeplink: this.safeTrim(rewardsData.deeplink),
            unlocked_at: this.currentDate,
            is_share_enabled: rewardsData.is_share_enabled,
        };
    }

    async getAllRewardDays() {
        try {
            const versionCode = parseInt(this.req.headers.version_code);
            let rewardsDays = await redisLibrary.getByKey('DG_REWARD_DAYS', redisClient);
            if (!rewardsDays) {
                console.error('redis key not found for DG_REWARD_DAYS');
                rewardsDays = [];
                const allRewards = await this.mongoClient.read.collection(this.rewardsCollection).find({
                    min_app_version: { $lte: versionCode }, max_app_version: { $gte: versionCode },
                }).sort({ level: 1 }).toArray();
                for (let j = 0; j < allRewards.length; j++) {
                    rewardsDays.push(allRewards[j].day);
                }
                redisLibrary.setByKey('DG_REWARD_DAYS', rewardsDays, 86400, redisClient);
            }
            if (typeof rewardsDays === 'string') {
                rewardsDays = JSON.parse(rewardsDays);
            }
            return rewardsDays;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'getAllRewardDays', error: errorLog });
            throw new Error(e);
        }
    }

    async scratchCard() {
        /**
         * Scrach card is already decided on mark attendance, this method will only execute/process the reward.
         */

        const { level } = this.req.body;
        this.message = 'Scratch card not found or already scratched';
        const isReward = await this.mongoClient.read.collection(this.studentStreakCollection).findOne(
            {
                studentId: this.student_id,
                scratch_cards: { $elemMatch: { level, is_unlocked: true, is_scratched: false } },
            },
        );
        if (isReward && isReward.scratch_cards) {
            const expiry = await Utility.getRewardExpiry(this.req.headers['x-auth-token']);
            const rewards = _.filter(isReward.scratch_cards, (p) => p.level === level);
            const { reward_type: rewardType } = rewards[0];
            if (rewardType === 'wallet') {
                const rewardWallet = rewards[0].wallet_amount;
                await WalletUtil.makeWalletTransaction({
                    student_id: this.student_id,
                    reward_amount: rewardWallet,
                    type: 'CREDIT',
                    payment_info_id: 'dedsorupiyadega',
                    reason: 'daily_goal_reward',
                    expiry,
                });
                this.message = 'wallet reward successfully processed';
            } else if (rewardType === 'ncert') {
                const randomVideo = await rewardMysql.getRandomPaidVideo(this.student_id, this.student_class, this.db.mysql.read);
                const packageId = randomVideo[0].new_package_id;
                const { now } = this.getNowAndTodayInIST();
                const startDate = moment(now).startOf('day').format('YYYY-MM-DD HH:mm:ss');
                const endDate = moment(now).add(3, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
                await rewardMysql.createSPS(this.student_id, packageId, startDate, endDate, this.db.mysql.write);
                this.message = 'ncert reward successfully processed';
            } else if (rewardType === 'coupon') {
                const couponCode = rewards[0].coupon_code;
                const { discount } = rewards[0];
                await Coupon.createRewardCoupon(this.db, this.student_id, couponCode, discount, 30);
                this.message = 'coupon reward successfully processed';
            } else if (rewardType === 'better') {
                this.message = 'better luck reward successfully processed';
            } else {
                logger.error({ tag: 'dailyGoalHelper', source: 'scratchCard', error: 'unknown reward found during scratch!' });
                throw new Error('Uh oh! unknown reward found.');
            }
            await this.mongoClient.read.collection(this.studentStreakCollection).updateOne(
                {
                    studentId: this.student_id,
                    scratch_cards: { $elemMatch: { level, is_unlocked: true, is_scratched: false } },
                },
                {
                    $set: {
                        'scratch_cards.$.is_scratched': true,
                        'scratch_cards.$.scratched_at': this.currentDate,
                        updated_at: this.currentDate,
                    },
                },
                (err) => {
                    if (err) {
                        console.error(err, ' ERROR');
                        let errorLog = err;
                        if (!_.isObject(errorLog)) {
                            errorLog = JSON.stringify(errorLog);
                        }
                        logger.error({ tag: 'dailyGoalHelper', source: 'scratchCard', error: errorLog });
                    }
                },
            );
        }
        return { message: this.message };
    }

    async getRandomCoupon() {
        let referralCoupon;
        let doesCouponAlreadyExist;
        do {
            referralCoupon = Coupon.makeSomeRandom(10);
            // eslint-disable-next-line no-await-in-loop
            doesCouponAlreadyExist = await CouponMySQL.getInfoByStudentReferalCoupons(this.db.mysql.read, referralCoupon);
        } while (doesCouponAlreadyExist.length);
        return referralCoupon;
    }

    async getStudentLeaderboardRank(leaderboardType) {
        // fetch current student detail if he/she is not in top 10, only in case of leaderboard page
        let rank = null;
        let subtitle = null;
        const studentRank = await dailyGoalRedis.getStudentLeaderboardRank(this.db.redis.read, leaderboardType, this.student_id);
        if (!_.isNull(studentRank)) {
            rank = studentRank + 1;
            subtitle = `${await dailyGoalRedis.getStudentLeaderboardScore(this.db.redis.read, leaderboardType, this.student_id)} Topics`;
        }
        return { rank, score: subtitle };
    }

    async getLeaderboardList(leaderboardType, start, end) {
        try {
            // leaderboard list from redis
            let loggedInStudentData = null;
            const leaderboardList = await dailyGoalRedis.getLeaderboardList(this.db.redis.read, leaderboardType, start, end);
            const studentIds = [];
            const studentWins = [];
            const studentRanks = [];
            let rankCounter = 1;
            for (let i = 0; i < leaderboardList.length; i++) {
                // Even index contains student_id and odd index contains score
                if (i % 2 === 0) {
                    studentIds.push(leaderboardList[i]);
                    studentRanks.push(rankCounter);
                    rankCounter++;
                } else {
                    studentWins.push(leaderboardList[i]);
                }
            }

            let leaderboardData = [];
            if (studentIds.length > 0) {
                // fetching all the student details
                const studentList = await dailyGoalMysql.getStudentDataList(studentIds, this.db.mysql.read);
                const groupedStudentList = _.groupBy(studentList, 'student_id');
                _.forEach(studentIds, (studentId, key) => {
                    const data = {
                        student_id: groupedStudentList[studentId][0].student_id,
                        name: groupedStudentList[studentId][0].name || dailyGoalData.userName,
                        image: groupedStudentList[studentId][0].image || dailyGoalData.userImage,
                        rank: studentRanks[key],
                        subtitle: `${studentWins[key]} Topics`,
                        label: null,
                        is_own: parseInt(studentId) === this.student_id ? 1 : 0,
                    };
                    leaderboardData.push(data);
                });
                leaderboardData = _.orderBy(leaderboardData, ['rank'], ['asc']);
                if (start === 0) {
                    loggedInStudentData = await this.getStudentLeaderboardRank(leaderboardType);
                }
            }
            // returning the final array of objects in order of rank
            return { leaderboard_data: leaderboardData, logged_in_student_data: loggedInStudentData };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'getLeaderboardList', error: errorLog });
            throw new Error(e);
        }
    }

    async leaderboard() {
        try {
            const { page, id } = this.req.body;
            const start = page * 10;
            const end = start + 9;
            let rank = null;
            let leaderboardDeeplink = null;
            // get leaderboard list from redis
            const leaderboardData = await this.getLeaderboardList(id, start, end);
            let isRankAvailable = false;
            // handling current student leaderboard data
            if (_.has(leaderboardData, 'logged_in_student_data.rank') && leaderboardData.logged_in_student_data.rank) {
                leaderboardData.logged_in_student_data.rank = `${leaderboardData.logged_in_student_data.rank}`;
                leaderboardData.logged_in_student_data.name = this.studentName;
                leaderboardData.logged_in_student_data.image = this.req.user.img_url;
                isRankAvailable = true;
                rank = leaderboardData.logged_in_student_data.rank;
                leaderboardDeeplink = dailyGoalData.leaderboard.deeplink;
            } else {
                leaderboardData.logged_in_student_data = null;
            }
            let title;
            if (id === 1) {
                title = this.locale === 'hi' ? dailyGoalData.leaderboard.weeklyTitle.hi : dailyGoalData.leaderboard.weeklyTitle.en;
            } else {
                title = this.locale === 'hi' ? dailyGoalData.leaderboard.monthlyTitle.hi : dailyGoalData.leaderboard.monthlyTitle.en;
            }

            return {
                page: page + 1,
                title,
                leaderboard_data: leaderboardData.leaderboard_data,
                student_data: leaderboardData.logged_in_student_data,
                is_rank_available: isRankAvailable,
                rank_text: this.locale === 'hi' ? dailyGoalData.leaderboard.rank.hi : dailyGoalData.leaderboard.rank.en,
                rank,
                leaderboard_deeplink: leaderboardDeeplink,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'leaderboard', error: errorLog });
            throw new Error(e);
        }
    }

    async submitDailyGoal() {
        try {
            const { type_id: typeId } = this.req.body;
            const promise = [
                AnswerMysql.markAsCompleted(this.db.mysql.write, typeId),
                AnswerMysql.getTypeDetails(this.db.mysql.read, typeId),
            ];
            const promiseDetails = await Promise.all(promise);

            const typeDetails = promiseDetails[1];
            if (typeDetails.length > 0) {
                this.message = 'Your daily goal has not been completed yet';
                const typeMainId = typeDetails[0].topic_reference;
                const allTypes = await AnswerMysql.getAllTypesByDate(this.db.mysql.read, typeMainId);
                if (allTypes.length > 0) {
                    const allCompletedTypes = allTypes.filter((x) => x.is_viewed === 1 || x.id == typeId);
                    /** Here we are checking for the type_id, because after making is_viewed = 1 through db write call,
                     * we are fetching that data through db read.
                     * So for db read and db write sync up latency, we are not getting the immediate reflected data on read call. */
                    const numberOfAllTasks = allTypes.length;
                    const numberOfCompletedTasks = allCompletedTypes.length;

                    let data = {
                        show_popup: false,
                    };
                    if (numberOfAllTasks == numberOfCompletedTasks) {
                        await dailyGoalRedis.setStudentLeaderboardScore(this.db.redis.write, 1, 1, this.student_id);
                        await dailyGoalRedis.setStudentLeaderboardScore(this.db.redis.write, 2, 1, this.student_id);
                        data = {
                            show_popup: true,
                            popup_data: {
                                title: this.locale === 'hi' ? dailyGoalData.submit.title.hi : dailyGoalData.submit.title.en,
                                description: this.locale === 'hi' ? dailyGoalData.submit.description.hi : dailyGoalData.submit.description.en,
                                image_url: dailyGoalData.submit.allTaskCompletedImage,
                                main_cta: this.locale === 'hi' ? dailyGoalData.submit.buttonText.hi : dailyGoalData.submit.buttonText.en,
                                main_deeplink: dailyGoalData.leaderboard.deeplink,
                            },
                        };
                        this.message = 'Your daily goal has successfully been completed';
                    }

                    return {
                        code: 200, message: this.message, success: true, data,
                    };
                }
            }
            return {
                code: 403, message: 'Type Not Found', success: false, data: null,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'submitDailyGoal', error: errorLog });
            throw new Error(e);
        }
    }

    async benefits() {
        return {
            title: this.locale === 'hi' ? dailyGoalData.benefits.title.hi : dailyGoalData.benefits.title.en,
            info_items: this.locale === 'hi' ? dailyGoalData.benefits.dataHi : dailyGoalData.benefits.dataEn,
        };
    }

    async createGoal() {
        return {
            title: this.locale === 'hi' ? dailyGoalData.createGoal.title.hi : dailyGoalData.createGoal.title.en,
            info_items: this.locale === 'hi' ? dailyGoalData.createGoal.dataHi : dailyGoalData.createGoal.dataEn,
        };
    }

    async getDoubtFeedDetails() {
        /** This function gets the data of main page of daily goal */
        try {
            const xAuthToken = this.req.headers['x-auth-token'];
            const versionCode = parseInt(this.req.headers.version_code);

            let topicId = '';
            if (this.req.body.topic_id !== undefined) {
                topicId = parseInt(this.req.body.topic_id);
            }
            const widget = [];
            let topicDetail;
            const finalData = {
                title: this.locale === 'hi' ? dailyGoalData.todayGoal.title.hi : dailyGoalData.todayGoal.title.en,
            };

            // To get latest topic list
            const topicList = await DoubtfeedMysql.getTopicByDate(this.db.mysql.read, this.student_id);
            if (topicList.length === 0) {
                // For first time visitors
                finalData.type = 'first_time';
                finalData.top_pane = {
                    type: 'yesterdays_top',
                    heading_image: dailyGoalData.noFeedImage,
                    heading_text: this.locale === 'hi' ? dailyGoalData.setGoal.title.hi : dailyGoalData.setGoal.title.en,
                    description: this.locale === 'hi' ? dailyGoalData.createGoal.subTitle.hi : dailyGoalData.createGoal.subTitle.en,
                    button_text: this.locale === 'hi' ? dailyGoalData.progressButton.hi : dailyGoalData.progressButton.en,
                    button_bg_color: '#ea532c',
                    button_deeplink: dailyGoalData.cameraDeeplink,
                    total_tasks: -1,
                    completed_tasks_count: -1,
                };
                finalData.widget_info_data = await this.createGoal();
                finalData.widget_benefits_data = await this.benefits();
                return finalData;
            }

            // previous doubts
            finalData.previous_doubts_text = this.locale === 'hi' ? dailyGoalData.previousDoubt.hi : dailyGoalData.previousDoubt.en;
            finalData.previous_doubts_deeplink = dailyGoalData.previousDoubtDeeplink;

            // leaderboard data
            const { rank } = await this.getStudentLeaderboardRank(1);
            let rankText = null;
            let isRankAvailable = false;
            if (!_.isNull(rank)) {
                isRankAvailable = true;
                rankText = this.locale === 'hi' ? dailyGoalData.leaderboard.rank.hi : dailyGoalData.leaderboard.rank.en;
            }

            finalData.is_rank_available = isRankAvailable;
            finalData.rank_data = {
                rank_text: rankText,
                rank,
            };
            finalData.leaderboard_deeplink = dailyGoalData.leaderboard.deeplink;
            finalData.view_leaderboard_text = this.locale === 'hi' ? dailyGoalData.leaderboard.view_all.hi : dailyGoalData.leaderboard.view_all.en;
            finalData.leaderboard_image = dailyGoalData.leaderboard.icon_url;

            const isLeaderboardAvailable = true;
            const activeTab = 1;
            const leaderboardTitle = this.locale === 'hi' ? dailyGoalData.leaderboard.homeTitle.hi : dailyGoalData.leaderboard.homeTitle.en;
            const leaderboardSubtitle = this.locale === 'hi' ? dailyGoalData.leaderboard.homeSubtitle.hi : dailyGoalData.leaderboard.homeSubtitle.en;
            const winners = await this.getLeaderboardList(1, 0, 2);
            finalData.leaderboard_container = {
                title: leaderboardTitle,
                subtitle: leaderboardSubtitle,
                active_tab: activeTab,
                leaderboard_data: winners.leaderboard_data,
                is_rank_available: isRankAvailable,
                rank,
                rank_text: rankText,
                leaderboard_deeplink: dailyGoalData.leaderboard.deeplink,
            };
            finalData.is_leaderboard_available = isLeaderboardAvailable;

            // streak data
            const studentData = await this.mongoClient.read.collection(this.studentStreakCollection).findOne({ studentId: this.student_id });
            let lastMarkedStreak = 1;
            const lastStreakTimestamp = (studentData ? studentData.last_streak_timestamp : null);
            if (lastStreakTimestamp) {
                lastMarkedStreak = this.isToday(lastStreakTimestamp) ? studentData.last_marked_streak : studentData.last_marked_streak + 1;
            }

            finalData.streak_container = {
                title: (this.locale === 'hi' ? dailyGoalData.reward.subtitle.hi : dailyGoalData.reward.subtitle.en).replace('<>', lastMarkedStreak),
                subtitle: (this.locale === 'hi' ? dailyGoalData.reward.title.hi : dailyGoalData.reward.title.en),
                know_more: (this.locale === 'hi' ? dailyGoalData.reward.knowMore.hi : dailyGoalData.reward.knowMore.en),
                deeplink: dailyGoalData.reward.deeplink,
            };

            finalData.type = 'on_going';
            finalData.widget_info_data = await this.createGoal();
            finalData.widget_benefits_data = await this.benefits();

            if (topicId === '') {
                topicDetail = topicList[0];
            } else {
                topicDetail = topicList.filter((x) => x.id === topicId);
                topicDetail = topicDetail[0];
            }
            let topicName = topicDetail.topic;
            let topicSubject = topicDetail.subject;

            // when user have completed today's all daily goals
            const todayTopics = await DoubtfeedMysql.getTodaysTopics(this.db.mysql.read, this.student_id);
            let promise = [];
            let isGoalCompleted = false;
            const incompleteTopicList = [];

            if (todayTopics.length > 0) {
                // User has active daily goal
                todayTopics.map(async (x) => {
                    promise.push(DoubtfeedMysql.getActiveTopicData(this.db.mysql.read, x.id));
                });
                const promiseArr = await Promise.all(promise);
                let topicsCompleted = 0;
                todayTopics.forEach((x, i) => {
                    let count = 0;
                    if (promiseArr[i].length > 0) {
                        promiseArr[i].forEach((y) => {
                            if (y.is_viewed === 1)count++;
                        });
                        if (count == promiseArr[i].length) {
                            topicsCompleted++;
                        } else {
                            incompleteTopicList.unshift({
                                title: `${x.topic}`,
                                key: `${x.id}`,
                                is_selected: Boolean(x.id === topicDetail.id),
                                subject: `${x.subject}`,
                            });
                        }
                    } else {
                        incompleteTopicList.unshift({
                            title: `${x.topic}`,
                            key: `${x.id}`,
                            is_selected: Boolean(x.id === topicDetail.id),
                            subject: `${x.subject}`,
                        });
                    }
                });
                if (todayTopics.length === topicsCompleted) isGoalCompleted = true;
            }
            if (todayTopics.length === 0 || isGoalCompleted) {
                finalData.type = 'no_current_goal';
                finalData.top_pane = {
                    type: 'yesterdays_top',
                    heading_image: `${this.config.staticCDN}daily_feed_resources/no-daily-feed-heading.webp`,
                    heading_text: this.locale === 'hi' ? dailyGoalData.completedTodayGoal.title.hi : dailyGoalData.completedTodayGoal.title.en,
                    button_text: this.locale === 'hi' ? dailyGoalData.progressButton.hi : dailyGoalData.progressButton.en,
                    button_bg_color: '#ea532c',
                    button_deeplink: dailyGoalData.cameraDeeplink,
                    description: this.locale === 'hi' ? dailyGoalData.rankWarning.hi : dailyGoalData.rankWarning.en,
                };
                return finalData;
            }

            let isPrevious = false;
            let heading = this.locale === 'hi' ? dailyGoalData.mainheading.hi : dailyGoalData.mainheading.en;

            const currDate = moment();
            const offset = new Date().getTimezoneOffset();
            if (offset === 0) {
                currDate.add(5, 'hours').add(30, 'minutes');
            }
            if (moment(topicList[0].date).isSame(currDate)) {
                isPrevious = true;
                heading = this.locale === 'hi' ? dailyGoalData.mainheadingOld.hi : dailyGoalData.mainheadingOld.en;
            }
            finalData.is_previous = isPrevious;
            if (topicId === '') {
                incompleteTopicList[0].is_selected = true;
                finalData.topics = incompleteTopicList;
                topicDetail = incompleteTopicList[0];
                topicDetail.topic = topicDetail.title; // because during pdfdata making topicDetail.topic is needed
                topicName = topicDetail.title;
                topicSubject = topicDetail.subject;
                topicDetail.id = topicDetail.key;
            }

            const activeTopicData = await DoubtfeedMysql.getActiveTopicData(this.db.mysql.read, topicDetail.id);
            if (activeTopicData.length > 0) {
                promise = [];
                const topicVideoPromise = [];
                const resourceList = [];
                const resourceId = [];

                const allCompleted = activeTopicData.filter((x) => x.is_viewed === 1);
                if (allCompleted.length === activeTopicData.length) {
                    heading = this.locale === 'hi' ? dailyGoalData.mainCompletedheading.hi : dailyGoalData.mainCompletedheading.en;
                }

                for (let i = 0; i < activeTopicData.length; i++) {
                    if (activeTopicData[i].type === 'LIVE_VIDEO') {
                        promise.push(LiveClassMysql.getLiveVideoByQid(this.db.mysql.read, activeTopicData[i].data_list));
                        resourceList.push('LIVE_VIDEO');
                    } else if (activeTopicData[i].type === 'TOPIC_VIDEO') {
                        promise.push(DoubtfeedMysql.getSimilarQuestionsByIds(this.db.mysql.read, activeTopicData[i].data_list));
                        topicVideoPromise.push(QuestionRedis.getTopicVideoQuestion(this.db.redis.write, this.student_id, 'DAILY_DOUBT'));
                        resourceList.push('TOPIC_VIDEO');
                    } else if (activeTopicData[i].type === 'TOPIC_MCQ') {
                        promise.push(DoubtfeedMysql.getTopicBoosterGameId(this.db.mysql.read, activeTopicData[i].id));
                        resourceList.push('TOPIC_MCQ');
                    } else if (activeTopicData[i].type === 'PDF') {
                        const dailyGoalObj = {
                            type: 'pdf',
                            subject: topicSubject,
                            chapter: topicName,
                            class: (this.student_class).toString(),
                            student_id: this.student_id,
                            locale: this.locale,
                        };
                        promise.push(FreeLiveClass.getDataForDailyGoal(dailyGoalObj));
                        resourceList.push('PDF');
                    } else if (activeTopicData[i].type === 'FORMULA_SHEET') {
                        promise.push(DoubtfeedMysql.getFormulaById(this.db.mysql.read, activeTopicData[i].data_list));
                        resourceList.push('FORMULA_SHEET');
                    }
                    resourceId.push(activeTopicData[i].id);
                }

                const promiseDetails = await Promise.all(promise);
                const topicVideo = await Promise.all(topicVideoPromise);
                let itemObj;
                let totalItem = 0;
                let response;
                for (let i = 0; i < promiseDetails.length; i++) {
                    if (resourceList[i] === 'LIVE_VIDEO') {
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatLcData(this.db, this.config, promiseDetails[i], resourceId[i], totalItem, this.locale, versionCode);
                    } else if (resourceList[i] === 'TOPIC_VIDEO') {
                        let currentVideo = promiseDetails[i][0];
                        if (!_.isNull(topicVideo[0])) {
                            let flag = 0;
                            const storedVideoId = topicVideo[0];
                            promiseDetails[i].forEach((x) => {
                                if (flag === 1) {
                                    currentVideo = x;
                                }
                                if (x.question_id === storedVideoId) {
                                    flag = 1;
                                }
                            });
                        }
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatTopicVideoData(this.db, promiseDetails[i], resourceId[i], totalItem, this.locale, currentVideo, this.config.cdn_url);
                    } else if (resourceList[i] === 'TOPIC_MCQ') {
                        StudentRedis.set7Day(this.db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', this.student_id, 1);
                        const chapterAlias = await homepageQuestionsMaster.getChapterAlias(this.db.mysql.read, promiseDetails[i][0].data_list);
                        response = await StudentBl.formatKJData(this.db, promiseDetails[i][0].data_list, chapterAlias.chapter_alias, this.student_id, topicName, resourceId[i], totalItem, this.locale, this.config.staticCDN);
                    } else if (resourceList[i] === 'PDF') {
                        if (promiseDetails[i] && Object.keys(promiseDetails[i]).length !== 0 && promiseDetails[i].pdf && promiseDetails[i].pdf.sugg && promiseDetails[i].pdf.sugg.length !== 0) {
                            if (promiseDetails[i].pdf.sugg.length > 2) {
                                promiseDetails[i].pdf.sugg.forEach((x) => {
                                    x._source = {
                                        id: x.srcId,
                                        subject: x._extras.subject,
                                        resource_path: x._extras.resource_path,
                                    };
                                });
                                // eslint-disable-next-line no-await-in-loop
                                response = await StudentBl.formatPdfData(this.db, promiseDetails[i].pdf.sugg, resourceId[i], topicDetail, totalItem, this.locale);
                            } else {
                                response = {};
                            }
                        }
                    } else if (resourceList[i] === 'FORMULA_SHEET') {
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatFsData(this.db, promiseDetails[i], this.config.staticCDN, resourceId[i], topicDetail, totalItem, this.locale);
                    }

                    if (response && Object.keys(response).length !== 0) {
                        itemObj = response;
                        totalItem++;
                        const isViewedRes = activeTopicData.filter((x) => x.type === resourceList[i]);
                        if (isViewedRes.length > 0 && isViewedRes[0].is_viewed === 1) {
                            itemObj.widget_data.is_done = true;
                        }

                        widget.push(itemObj);
                    }
                }
            } else {
                const dateToBePassed = Utility.getDateFromMysqlDate(topicDetail.date);
                let previousTopic = await DoubtfeedMysql.getPreviousTopicByDate(this.db.mysql.read, this.student_id, topicName, dateToBePassed);
                const topicExist = previousTopic.length > 0;

                let previousResources = [];
                if (topicExist) {
                    previousTopic = previousTopic[0];
                    previousResources = await DoubtfeedMysql.getQuestionList(this.db.mysql.read, previousTopic.id);
                }

                let totalItem = 0;

                const dailyGoalObj = {
                    type: 'live',
                    subject: topicSubject,
                    chapter: topicName,
                    class: (this.student_class).toString(),
                    student_id: this.student_id,
                    locale: this.locale,
                };
                let doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
                doubtfeedData = doubtfeedData.liveClass;
                if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                    doubtfeedData.sugg.forEach((x) => {
                        x._source = {
                            id: x.srcId,
                        };
                    });
                    const elasticData = [{ list: doubtfeedData.sugg }];
                    let liveVideoData = await doubtfeedHelper.checkLcData(previousResources, elasticData);
                    if (liveVideoData.length > 0) {
                        liveVideoData = await StudentBl.makeLcData(this.db, this.config, topicDetail, totalItem, this.locale, versionCode, liveVideoData);
                        if (liveVideoData && Object.keys(liveVideoData).length != 0) {
                            totalItem++;
                            widget.push(liveVideoData);
                        }
                    }
                }

                dailyGoalObj.type = 'video';
                doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
                doubtfeedData = doubtfeedData.video;
                if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                    doubtfeedData.sugg.forEach((x) => {
                        x._source = {
                            id: x.srcId,
                        };
                    });
                    const elasticData = [{ list: doubtfeedData.sugg }];
                    let topicVideoData = await doubtfeedHelper.checkTopicVideoData(previousResources, elasticData);
                    if (topicVideoData.length > 0) {
                        topicVideoData = await StudentBl.makeTopicVideoData(this.db, topicDetail, this.student_id, this.config.cdn_url, totalItem, this.locale, topicVideoData);
                        if (topicVideoData && Object.keys(topicVideoData).length != 0) {
                            totalItem++;
                            widget.push(topicVideoData);
                        }
                    }
                }

                const topicBoosterData = await StudentBl.makeTopicBoosterData(this.db, this.config, topicDetail, previousResources, this.student_id, this.student_class, this.config.staticCDN, totalItem, this.locale);
                if (topicBoosterData && Object.keys(topicBoosterData).length !== 0) {
                    StudentRedis.set7Day(this.db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', this.student_id, 1);
                    totalItem++;
                    widget.push(topicBoosterData);
                }

                dailyGoalObj.type = 'pdf';
                doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
                doubtfeedData = doubtfeedData.pdf;
                if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                    doubtfeedData.sugg.forEach((x) => {
                        x._source = {
                            id: x.srcId,
                            subject: x._extras.subject,
                            resource_path: x._extras.resource_path,
                        };
                    });
                    const elasticData = [{ list: doubtfeedData.sugg }];
                    let pdfData = await doubtfeedHelper.checkPdfData(previousResources, elasticData);
                    if (pdfData.length > 0) {
                        pdfData = await StudentBl.makePdfData(this.db, topicDetail, totalItem, this.locale, pdfData);
                        if (pdfData && Object.keys(pdfData).length != 0) {
                            totalItem++;
                            widget.push(pdfData);
                        }
                    }
                }

                const fsData = await StudentBl.makeFsData(this.db, topicDetail, previousResources, this.student_class, this.config.staticCDN, totalItem, this.locale);
                if (fsData && Object.keys(fsData).length != 0) {
                    totalItem++;
                    widget.push(fsData);
                }
            }

            widget[widget.length - 1].widget_data.is_last = true;
            const booksData = await this.booksLibrary(topicName);
            if (!_.isEmpty(booksData.widget_data)) {
                widget.push(booksData);
            }
            finalData.type = 'on_going';
            finalData.heading = heading;
            finalData.carousels = widget;

            finalData.back_press_popup_data = {
                image_url: `${this.config.staticCDN}daily_feed_resources/sad-face.webp`,
                description: (this.locale === 'hi' ? dailyGoalData.notInterested.hi : dailyGoalData.notInterested.en).replace('{topic}', topicName),
                main_cta: this.locale === 'hi' ? dailyGoalData.progressButton.hi : dailyGoalData.progressButton.en,
                main_deeplink: dailyGoalData.cameraDeeplink,
                secondary_cta: this.locale === 'hi' ? dailyGoalData.backpressBottomLine.hi : dailyGoalData.backpressBottomLine.en,
            };
            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'getDoubtFeedDetails', error: errorLog });
            throw new Error(e);
        }
    }

    async getPreviousDoubts() {
        try {
            let finalData = {};
            const xAuthToken = this.req.headers['x-auth-token'];
            const versionCode = parseInt(this.req.headers.version_code);
            let topicId = '';
            let topicDetail;

            if (this.req.body.topic_id !== undefined) {
                topicId = parseInt(this.req.body.topic_id);
            }

            let topicsToBeShown = [];
            let promise = [];
            const todaysTopics = await DoubtfeedMysql.getTodaysTopics(this.db.mysql.read, this.student_id);
            if (todaysTopics.length > 0) {
                todaysTopics.map(async (x) => {
                    promise.push(DoubtfeedMysql.getActiveTopicData(this.db.mysql.read, x.id));
                });
                const promiseArr = await Promise.all(promise);
                todaysTopics.forEach((x, i) => {
                    let count = 0;
                    if (promiseArr[i].length > 0) {
                        promiseArr[i].forEach((y) => {
                            if (y.is_viewed === 1)count++;
                        });
                        if (count == promiseArr[i].length) topicsToBeShown.unshift(x);
                    }
                });
            }
            if (topicsToBeShown.length > 10) {
                topicsToBeShown = topicsToBeShown.slice(0, 10);
            } else if (topicsToBeShown.length < 10) {
                const size = 10 - topicsToBeShown.length;
                const prevTopicsToBeAdded = await DoubtfeedMysql.getPreviousDaysTopics(this.db.mysql.read, this.student_id, size);
                topicsToBeShown = [...topicsToBeShown, ...prevTopicsToBeAdded];
            }
            if (topicId === '') {
                topicDetail = topicsToBeShown[0];
                finalData.topics = topicsToBeShown.map((x) => ({
                    title: `${x.topic}`,
                    key: `${x.id}`,
                    is_selected: Boolean(x.id === topicDetail.id),
                    subject: `${x.subject}`,
                }));
            } else {
                topicDetail = topicsToBeShown.filter((x) => x.id === topicId);
                topicDetail = topicDetail[0];
            }

            if (topicsToBeShown.length === 0) {
                finalData = {};
                finalData.is_available = false;
                return finalData;
            }
            const topicName = topicDetail.topic;
            const topicSubject = topicDetail.subject;
            const widget = [];
            const activeTopicData = await DoubtfeedMysql.getActiveTopicData(this.db.mysql.read, topicDetail.id);
            if (activeTopicData.length > 0) {
                promise = [];
                const topicVideoPromise = [];
                const resourceList = [];
                const resourceId = [];

                for (let i = 0; i < activeTopicData.length; i++) {
                    if (activeTopicData[i].type === 'LIVE_VIDEO') {
                        promise.push(LiveClassMysql.getLiveVideoByQid(this.db.mysql.read, activeTopicData[i].data_list));
                        resourceList.push('LIVE_VIDEO');
                    } else if (activeTopicData[i].type === 'TOPIC_VIDEO') {
                        promise.push(DoubtfeedMysql.getSimilarQuestionsByIds(this.db.mysql.read, activeTopicData[i].data_list));
                        topicVideoPromise.push(QuestionRedis.getTopicVideoQuestion(this.db.redis.write, this.student_id, 'DAILY_DOUBT'));
                        resourceList.push('TOPIC_VIDEO');
                    } else if (activeTopicData[i].type === 'TOPIC_MCQ') {
                        promise.push(DoubtfeedMysql.getTopicBoosterGameId(this.db.mysql.read, activeTopicData[i].id));
                        resourceList.push('TOPIC_MCQ');
                    } else if (activeTopicData[i].type === 'PDF') {
                        const dailyGoalObj = {
                            type: 'pdf',
                            subject: topicSubject,
                            chapter: topicName,
                            class: (this.student_class).toString(),
                            student_id: this.student_id,
                            locale: this.locale,
                        };
                        promise.push(FreeLiveClass.getDataForDailyGoal(dailyGoalObj));
                        resourceList.push('PDF');
                    } else if (activeTopicData[i].type === 'FORMULA_SHEET') {
                        promise.push(DoubtfeedMysql.getFormulaById(this.db.mysql.read, activeTopicData[i].data_list));
                        resourceList.push('FORMULA_SHEET');
                    }
                    resourceId.push(activeTopicData[i].id);
                }

                const promiseDetails = await Promise.all(promise);
                const topicVideo = await Promise.all(topicVideoPromise);
                let itemObj;
                let totalItem = 0;
                let response;
                for (let i = 0; i < promiseDetails.length; i++) {
                    if (resourceList[i] === 'LIVE_VIDEO') {
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatLcData(this.db, this.config, promiseDetails[i], resourceId[i], totalItem, this.locale, versionCode);
                    } else if (resourceList[i] === 'TOPIC_VIDEO') {
                        let currentVideo = promiseDetails[i][0];
                        if (!_.isNull(topicVideo[0])) {
                            let flag = 0;
                            const storedVideoId = topicVideo[0];
                            promiseDetails[i].forEach((x) => {
                                if (flag === 1) {
                                    currentVideo = x;
                                }
                                if (x.question_id === storedVideoId) {
                                    flag = 1;
                                }
                            });
                        }
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatTopicVideoData(this.db, promiseDetails[i], resourceId[i], totalItem, this.locale, currentVideo, this.config.cdn_url);
                    } else if (resourceList[i] === 'TOPIC_MCQ') {
                        StudentRedis.set7Day(this.db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', this.student_id, 1);
                        const chapterAlias = await homepageQuestionsMaster.getChapterAlias(this.db.mysql.read, promiseDetails[i][0].data_list);
                        response = await StudentBl.formatKJData(this.db, promiseDetails[i][0].data_list, chapterAlias.chapter_alias, this.student_id, topicName, resourceId[i], totalItem, this.locale, this.config.staticCDN);
                    } else if (resourceList[i] === 'PDF') {
                        if (promiseDetails[i] && Object.keys(promiseDetails[i]).length !== 0 && promiseDetails[i].pdf && promiseDetails[i].pdf.sugg && promiseDetails[i].pdf.sugg.length !== 0) {
                            if (promiseDetails[i].pdf.sugg.length > 2) {
                                promiseDetails[i].pdf.sugg.forEach((x) => {
                                    x._source = {
                                        id: x.srcId,
                                        subject: x._extras.subject,
                                        resource_path: x._extras.resource_path,
                                    };
                                });
                                // eslint-disable-next-line no-await-in-loop
                                response = await StudentBl.formatPdfData(this.db, promiseDetails[i].pdf.sugg, resourceId[i], topicDetail, totalItem, this.locale);
                            } else {
                                response = {};
                            }
                        }
                    } else if (resourceList[i] === 'FORMULA_SHEET') {
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatFsData(this.db, promiseDetails[i], this.config.staticCDN, resourceId[i], topicDetail, totalItem, this.locale);
                    }

                    if (response && Object.keys(response).length !== 0) {
                        itemObj = response;
                        totalItem++;
                        const isViewedRes = activeTopicData.filter((x) => x.type === resourceList[i]);
                        if (isViewedRes.length > 0 && isViewedRes[0].is_viewed === 1) {
                            itemObj.widget_data.is_done = true;
                        }

                        widget.push(itemObj);
                    }
                }
            } else {
                const dateToBePassed = Utility.getDateFromMysqlDate(topicDetail.date);
                let previousTopic = await DoubtfeedMysql.getPreviousTopicByDate(this.db.mysql.read, this.student_id, topicName, dateToBePassed);
                const topicExist = previousTopic.length > 0;

                let previousResources = [];
                if (topicExist) {
                    previousTopic = previousTopic[0];
                    previousResources = await DoubtfeedMysql.getQuestionList(this.db.mysql.read, previousTopic.id);
                }

                let totalItem = 0;

                const dailyGoalObj = {
                    type: 'live',
                    subject: topicSubject,
                    chapter: topicName,
                    class: (this.student_class).toString(),
                    student_id: this.student_id,
                    locale: this.locale,
                };
                let doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
                doubtfeedData = doubtfeedData.liveClass;
                if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                    doubtfeedData.sugg.forEach((x) => {
                        x._source = {
                            id: x.srcId,
                        };
                    });
                    const elasticData = [{ list: doubtfeedData.sugg }];
                    let liveVideoData = await doubtfeedHelper.checkLcData(previousResources, elasticData);
                    if (liveVideoData.length > 0) {
                        liveVideoData = await StudentBl.makeLcData(this.db, this.config, topicDetail, totalItem, this.locale, versionCode, liveVideoData);
                        if (liveVideoData && Object.keys(liveVideoData).length != 0) {
                            totalItem++;
                            widget.push(liveVideoData);
                        }
                    }
                }

                dailyGoalObj.type = 'video';
                doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
                doubtfeedData = doubtfeedData.video;
                if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                    doubtfeedData.sugg.forEach((x) => {
                        x._source = {
                            id: x.srcId,
                        };
                    });
                    const elasticData = [{ list: doubtfeedData.sugg }];
                    let topicVideoData = await doubtfeedHelper.checkTopicVideoData(previousResources, elasticData);
                    if (topicVideoData.length > 0) {
                        topicVideoData = await StudentBl.makeTopicVideoData(this.db, topicDetail, this.student_id, this.config.cdn_url, totalItem, this.locale, topicVideoData);
                        if (topicVideoData && Object.keys(topicVideoData).length != 0) {
                            totalItem++;
                            widget.push(topicVideoData);
                        }
                    }
                }

                const topicBoosterData = await StudentBl.makeTopicBoosterData(this.db, this.config, topicDetail, previousResources, this.student_id, this.student_class, this.config.staticCDN, totalItem, this.locale);
                if (topicBoosterData && Object.keys(topicBoosterData).length !== 0) {
                    StudentRedis.set7Day(this.db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', this.student_id, 1);
                    totalItem++;
                    widget.push(topicBoosterData);
                }

                dailyGoalObj.type = 'pdf';
                doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
                doubtfeedData = doubtfeedData.pdf;
                if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                    doubtfeedData.sugg.forEach((x) => {
                        x._source = {
                            id: x.srcId,
                            subject: x._extras.subject,
                            resource_path: x._extras.resource_path,
                        };
                    });
                    const elasticData = [{ list: doubtfeedData.sugg }];
                    let pdfData = await doubtfeedHelper.checkPdfData(previousResources, elasticData);
                    if (pdfData.length > 0) {
                        pdfData = await StudentBl.makePdfData(this.db, topicDetail, totalItem, this.locale, pdfData);
                        if (pdfData && Object.keys(pdfData).length != 0) {
                            totalItem++;
                            widget.push(pdfData);
                        }
                    }
                }

                const fsData = await StudentBl.makeFsData(this.db, topicDetail, previousResources, this.student_class, this.config.staticCDN, totalItem, this.locale);
                if (fsData && Object.keys(fsData).length != 0) {
                    totalItem++;
                    widget.push(fsData);
                }
            }
            finalData.is_available = true;
            widget[widget.length - 1].widget_data.is_last = true;
            finalData.type = 'previous_doubts';
            finalData.heading = this.locale === 'hi' ? dailyGoalData.prevDoubtsHeading.hi : dailyGoalData.prevDoubtsHeading.en;
            finalData.carousels = widget;
            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'getPreviousDoubts', error: errorLog });
            throw new Error(e);
        }
    }

    async booksLibrary(topicName) {
        try {
            const libraryData = await DoubtfeedMysql.getBooksLibraryData(this.db.mysql.read, topicName);
            const widget_data = {};
            if (!_.isEmpty(libraryData)) {
                const promise = [];
                libraryData.forEach((x) => {
                    promise.push(QuestionMysql.getFirstVideoOfPlaylist(this.db.mysql.read, x.id));
                });
                const questionData = await Promise.all(promise);
                widget_data.title = `Books you can refer for ${topicName}`;
                widget_data.items = libraryData.map((item, i) => ({
                    title: item.name,
                    subtitle: '',
                    show_whatsapp: true,
                    show_video: false,
                    card_width: '2.5x',
                    aspect_ratio: '',
                    deeplink: `doubtnutapp://video?qid=${questionData[i][0].question_id}&page=NCERT`,
                    image_url: item.image_url,
                    id: item.id,
                }));
            }
            return {
                widget_type: 'horizontal_list',
                widget_data,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'booksLibrary', error: errorLog });
            throw new Error(e);
        }
    }

    async submitPreviousTask() {
        try {
            const { type_id: typeId } = this.req.body;
            AnswerMysql.previousMarkAsCompleted(this.db.mysql.write, typeId);
            return {
                code: 200, message: this.message, success: true, data: 'Success',
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'dailyGoalHelper', source: 'submitDailyGoal', error: errorLog });
            throw new Error(e);
        }
    }
}

module.exports = DailyGoalManager;
