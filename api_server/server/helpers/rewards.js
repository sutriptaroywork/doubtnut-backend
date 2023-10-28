/**
 * This is a helper file of student rewards module,
 * built with class based architecture, used no-sql as primary database
 * PRD: https://docs.google.com/document/d/1IpWMIPNUi9EyIciisMSLb9Tgu8GQVtqDig4Wd_e3ASs
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
const constants = require('../../data/rewards.data');
const Utility = require('../../modules/utility');
const TrialMysql = require('../../modules/mysql/trail');
const PackageContainer = require('../../modules/containers/package');
const Data = require('../../data/data');
const StudentMongo = require('../../modules/mongo/student');
const microService = require('../../modules/microservice');
const BranchContainer = require('../../modules/containers/branch');

class RewardsManager {
    /**
     * Reward system is a new feature where students can mark their attendance,
     * and basis their attendance marked and  being consistent on the app will
     * give them rewards. There will be 7 levels of this reward system in which
     * users will get scratch cards.
     * @constructor
     */
    constructor(req, studentClass, studentId, locale, db, config, mongoClient) {
        this.db = db;
        this.config = config;
        this.locale = locale;
        this.mongoClient = mongoClient;
        this.req = req;
        this.student_class = studentClass;
        this.student_id = studentId;
        this.studentStreakCollection = 'student_rewards';
        this.rewardsCollection = 'rewards_temp';
        this.message = 'SUCCESS';
        this.popupHeading = null;
        this.popupDescription = null;
        this.toggleContent = null;
        this.is_streak_break = false;
        this.isReward = false;
        this.name = (this.req.user.student_fname ? this.req.user.student_fname : 'Doubtnut User');
        this.datesAreOnSameDay = (first, second) => first.getFullYear() === second.getFullYear()
            && first.getMonth() === second.getMonth()
            && first.getDate() === second.getDate();
        // eslint-disable-next-line no-mixed-operators
        this.daysDifferenceFromCurrent = (d) => {
            const current = moment().add(5, 'hours').add(30, 'minutes');
            d = moment(d);
            return moment(`${current.format('DD-MM-YYYY')}`, 'DD-MM-YYYY').diff(moment(`${d.format('DD-MM-YYYY')}`, 'DD-MM-YYYY'), 'days');
        };
        this.safeTrim = (content) => (_.isEmpty(content) ? content : content.trim());
        this.safeTrimAndReplace = (content, replacedText) => (_.isEmpty(content) ? content : content.trim().replace('<>', replacedText));
        this.capitalize = (s) => {
            if (typeof s !== 'string') return '';
            return s.charAt(0).toUpperCase() + s.slice(1);
        };
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();
        this.inWords = (num) => {
            num = num.toString();
            const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ',
                'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
            const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
            if (num.length > 9) return '';
            const n = (`000000000${num}`).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return;
            let str = '';
            str += (parseInt(n[1]) !== 0) ? `${a[Number(n[1])] || `${b[n[1][0]]} ${a[n[1][1]]}`}crore ` : '';
            str += (parseInt(n[2]) !== 0) ? `${a[Number(n[2])] || `${b[n[2][0]]} ${a[n[2][1]]}`}lakh ` : '';
            str += (parseInt(n[3]) !== 0) ? `${a[Number(n[3])] || `${b[n[3][0]]} ${a[n[3][1]]}`}thousand ` : '';
            str += (parseInt(n[4]) !== 0) ? `${a[Number(n[4])] || `${b[n[4][0]]} ${a[n[4][1]]}`}hundred ` : '';
            str += (parseInt(n[5]) !== 0) ? `${((str !== '') ? 'and ' : '') + (a[Number(n[5])] || `${b[n[5][0]]} ${a[n[5][1]]}`)}` : '';
            return str;
        };
        this.ordinalSuffixOf = (i) => {
            const j = i % 10;
            const k = i % 100;
            if (j === 1 && k !== 11) {
                return `${i}st`;
            }
            if (j === 2 && k !== 12) {
                return `${i}nd`;
            }
            if (j === 3 && k !== 13) {
                return `${i}rd`;
            }
            return `${i}th`;
        };
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
            locked_short_desc: (this.locale === 'hi' ? reward.locked_short_desc_hi : reward.locked_short_desc),
            locked_subtitle: (this.locale === 'hi' ? constants.lockedSubtitleHi : constants.lockedSubtitleEn),
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
        /**
         * This feature is designed to improve the retention and average time spent
         * of our users on our app. Keeping in mind the core drives of gamification
         * we have designed this reward system to improve the retention rate.
         */
        try {
            const studentData = await this.mongoClient.read.collection(this.studentStreakCollection).findOne({ studentId: this.student_id });
            const versionCode = parseInt(this.req.headers.version_code);
            let allRewards = await this.mongoClient.read.collection(this.rewardsCollection).find({
                min_app_version: { $lte: versionCode }, max_app_version: { $gte: versionCode },
            }).sort({ level: 1 }).toArray();
            const studentAchievedRewards = (studentData ? studentData.scratch_cards : []);
            const rewards = [];
            const lastMarkedAttendance = (studentData ? studentData.last_marked_attendance : 0);
            const lastAttendanceTimestamp = (studentData ? studentData.last_attendance_timestamp : null);
            const isNotificationOpted = (studentData ? studentData.is_notification_opted : true);
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
                        title: `${(this.locale === 'hi' ? 'लेवल ' : 'Level ')}${level}`,
                        description: (this.locale === 'hi' ? allRewards[i].know_more_hi : allRewards[i].know_more_en),
                    });
                }
                allRewards = _.filter(allRewards, (r) => r.level > level);
            }

            const rewardsDays = await this.getAllRewardDays();
            let i = 0;
            let nextGreaterRewardDay;
            let previousRewardDay;
            while (i < rewardsDays.length) {
                if (rewardsDays[i] > lastMarkedAttendance) {
                    nextGreaterRewardDay = rewardsDays[i];
                    previousRewardDay = rewardsDays[i - 1];
                    break;
                }
                i++;
            }

            // appending non-achieved levels
            /* eslint-disable no-await-in-loop */
            for (let j = 0; j < allRewards.length; j++) {
                if (versionCode >= 882 && allRewards[j].day === previousRewardDay) {
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
                                logger.error({ tag: 'rewards', source: 'processAttendance', error: errorLog });
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
                            title: `${(this.locale === 'hi' ? 'लेवल ' : 'Level ')}${level}`,
                            description: (this.locale === 'hi' ? scratchCard.know_more_hi : scratchCard.know_more_en),
                        });
                    }
                } else {
                    currentReward = this.getUnachivedReward(allRewards[j]);
                    rewards.push(currentReward);
                    knowMore.push({
                        title: `${(this.locale === 'hi' ? 'लेवल ' : 'Level ')}${allRewards[j].level}`,
                        description: (this.locale === 'hi' ? allRewards[j].know_more_hi : allRewards[j].know_more_en),
                    });
                }
            }
            /* eslint-enable no-await-in-loop */

            const nextGreaterRewardDayIn = nextGreaterRewardDay - lastMarkedAttendance;
            let backpressPopupText;
            let randomReward = null;
            let notificationTopic = null;
            let notificationDescription = null;
            let backpressPopupCtaText = (this.locale === 'hi' ? constants.backpressPopupCtaTextHi : constants.backpressPopupCtaTextEn);
            if (!allRewards.length) {
                // user has reached last level
                console.log('No notifications at last day :)');
            } else {
                while (!randomReward) {
                    randomReward = _.sample((this.locale === 'hi' ? allRewards[0].locked_desc_hi : allRewards[0].locked_desc).split('• ')).replace(/\n/g, '');
                }
                notificationTopic = (this.locale === 'hi' ? `${randomReward} हो सक्ता है आप का!` : `${randomReward} ho sakta hai aapka!`);
                notificationDescription = (this.locale === 'hi' ? constants.notificationDescriptionHi : constants.notificationDescriptionEn);
            }
            if (nextGreaterRewardDayIn === 1 && allRewards.length) {
                this.toggleContent = (this.locale === 'hi' ? constants.notificationMessageRewardHi : constants.notificationMessageRewardEn);
                backpressPopupText = (this.locale === 'hi' ? `${constants.backpressPopupTextRewardHi}${allRewards[0].locked_desc_hi}` : `${constants.backpressPopupTextRewardEn}${allRewards[0].locked_desc}`);
            } else if (allRewards.length) {
                this.toggleContent = (this.locale === 'hi' ? constants.notificationMessageNoRewardHi : constants.notificationMessageNoRewardEn);
                backpressPopupText = (this.locale === 'hi' ? constants.backpressPopupTextHi : constants.backpressPopupTextEn);
            } else {
                this.toggleContent = null;
                backpressPopupText = null;
                backpressPopupCtaText = null;
            }
            let backPressPopup = { backpress_popup_text: backpressPopupText, backpress_popup_cta_text: backpressPopupCtaText };
            if (!backpressPopupText || !backpressPopupCtaText) {
                backPressPopup = null;
            }
            const eveningNotification = { topic: notificationTopic, description: notificationDescription };
            return {
                rewards,
                last_marked_attendance: lastMarkedAttendance,
                last_attendance_timestamp: lastAttendanceTimestamp,
                is_notification_opted: isNotificationOpted,
                knowMore,
                backpress_popup: backPressPopup,
                evening_notification: eveningNotification,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'rewards', source: 'getStudentStreak', error: errorLog });
            return {};
        }
    }

    async main() {
        // const bottomDeeplinks = [{
        //     cta_text: 'Ask a question',
        //     is_background_filled: true,
        //     deeplink: 'doubtnutapp://camera',
        // },
        // { cta_text: 'Post a status', is_background_filled: false, deeplink: 'doubtnutapp://group_chat' }];
        const bottomDeeplinks = [];
        const versionCode = parseInt(this.req.headers.version_code);
        const studentStreak = await this.getStudentStreak();
        studentStreak.toggle_content = this.toggleContent;
        studentStreak.know_more = (this.locale === 'hi' ? constants.knowMoreHi : constants.knowMoreEn);
        studentStreak.know_more.content = studentStreak.knowMore;
        studentStreak.bottom_deeplinks = bottomDeeplinks;
        studentStreak.share_text = (this.locale === 'hi' ? constants.shareTextHi : constants.shareTextEn);
        studentStreak.thumbnail_url = constants.thumbnailUrl;
        studentStreak.video_url = constants.videoUrl;
        studentStreak.question_id = constants.questionId;
        if (versionCode >= 882) {
            studentStreak.video_url = constants.thumbnailUrlQid;
        }
        delete studentStreak.knowMore;
        return studentStreak;
    }

    async markAttendance() {
        /**
         * In case of any gap in between, attendance will start again from day 1.
         */
        try {
            console.log('marking attendance for ', this.student_id, this.currentDate);
            const lastMarkedAttendance = await this.getLastMarkedAttendance();
            if (this.req.method === 'GET') {
                console.log('get method called, needs to check if attendance is marked today');
                const isMarked = await this.isAttendanceMarked(lastMarkedAttendance);
                return isMarked;
            }
            let totalDayDifference;
            if (lastMarkedAttendance) {
                this.day = lastMarkedAttendance.last_marked_attendance + 1;
                const lastAttendanceAt = lastMarkedAttendance.last_attendance_timestamp;
                totalDayDifference = this.daysDifferenceFromCurrent(lastAttendanceAt);
                this.lastAttendance = [lastMarkedAttendance];
                if (totalDayDifference === 0) {
                    // Mark attendance requested on same day
                    console.log('can not update the attendance');
                    this.message = 'Attendance has already been marked for the day';
                    this.day = lastMarkedAttendance.last_marked_attendance;
                } else if (totalDayDifference === 1) {
                    // eligible to update attendance
                    console.log('eligible to update attendance');
                    await this.processAttendance();
                } else if (totalDayDifference > 1) {
                    // days difference more than one
                    console.log('found more than one days difference, streak break!!');
                    const rewardsDays = await this.getAllRewardDays();
                    let i = 0;
                    let previousRewardDay;
                    while (i < rewardsDays.length) {
                        if (rewardsDays[i] > lastMarkedAttendance.last_marked_attendance) {
                            previousRewardDay = rewardsDays[i - 1];
                            break;
                        }
                        i++;
                    }
                    this.day = previousRewardDay;
                    await this.breakStreak();
                    this.is_streak_break = true;
                    this.message = 'Found more than one day difference, streak break!!';
                    this.popupHeading = (this.locale === 'hi' ? constants.streakBreakHeadingHi : constants.streakBreakHeadingEn);
                    this.popupDescription = (this.locale === 'hi' ? constants.streakBreakDescriptionHi : constants.streakBreakDescriptionEn).replace('?', this.capitalize(this.name)).replace('<>', this.day);
                }
            } else {
                console.log('student came first time');
                this.day = 1;
                if (await this.createNewStudentEntry()) {
                    this.message = 'First attendance marked successfully!';
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
            const popupData = {
                popup_heading: this.popupHeading,
                popup_description: this.popupDescription,
                popup_timeout: this.popup_timeout,
            };
            return {
                message: this.message,
                data: {
                    notification_data: notificationData,
                    scratch_card: scratchCard,
                    is_reward: this.isReward,
                    popup_data: popupData,
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
            logger.error({ tag: 'rewards', source: 'markAttendance', error: errorLog });
            throw (e);
        }
    }

    async getLastMarkedAttendance() {
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
            logger.error({ tag: 'rewards', source: 'markAttendance', error: errorLog });
            return false;
        }
    }

    async createNewStudentEntry() {
        try {
            const scratchCard = await this.getApplicableScratchCards();
            console.log('creating new entry');
            const studentAttendanceDetails = {
                studentId: this.student_id,
                last_attendance_timestamp: this.currentDate,
                last_marked_attendance: 1,
                is_notification_opted: true,
                total_streak_break: 0,
                created_at: this.currentDate,
            };
            this.popupHeading = `${(this.locale === 'hi' ? 'हैलो' : 'Hello')} ${this.capitalize(this.name)}`;
            this.popupDescription = (this.locale === 'hi' ? constants.NoRewardPopupDescriptionHi : constants.NoRewardPopupDescriptionEn).replace('?', '1');
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
                this.topic = 'It\'s Attendance Reward Time';
                this.description = 'Scratch card waiting for you. Click to see what you won';
                this.scratchCard = [commonFormattedScratchCard];
                this.popupHeading = (this.locale === 'hi' ? constants.rewardWonPopupHeadingHi : constants.rewardWonPopupHeadingEn);
                this.popupDescription = (this.locale === 'hi' ? constants.rewardWonPopupDescriptionFirstDayHi : constants.rewardWonPopupDescriptionFirstDayEn);
            }
            await this.mongoClient.write.collection(this.studentStreakCollection).insertOne(studentAttendanceDetails);
            return true;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'rewards', source: 'markAttendance', error: errorLog });
            return false;
        }
    }

    async breakStreak() {
        await this.mongoClient.write.collection(this.studentStreakCollection).updateOne({ studentId: this.student_id }, {
            $set: {
                updated_at: this.currentDate,
                last_attendance_timestamp: this.currentDate,
                last_marked_attendance: this.day,
            },
            $inc: { total_streak_break: 1 },
        }, { upsert: true }, (err) => {
            if (err) {
                console.error(err);
                let errorLog = err;
                if (!_.isObject(errorLog)) {
                    errorLog = JSON.stringify(errorLog);
                }
                logger.error({ tag: 'rewards', source: 'breakStreak', error: errorLog });
                return false;
            }
            return true;
        });
    }

    async processAttendance() {
        /**
         * Process Attendance method does update the attendance
         * and push new rewards if applicable.
         */
        const scratchCard = await this.getApplicableScratchCards();
        const studentAchievedLevels = [];
        this.lastAttendance[0].scratch_cards.forEach((value) => {
            studentAchievedLevels.push(value.level);
        });
        this.popupHeading = `${(this.locale === 'hi' ? 'हैलो' : 'Hello')} ${this.capitalize(this.name)}`;
        this.popupDescription = (this.locale === 'hi' ? constants.NoRewardPopupDescriptionHi : constants.NoRewardPopupDescriptionEn).replace('?', this.day);
        if (scratchCard && !studentAchievedLevels.includes(scratchCard.level)) {
            const commonFormattedScratchCard = this.getAchievedReward(scratchCard);
            if (commonFormattedScratchCard.reward_type === 'wallet') {
                commonFormattedScratchCard.wallet_amount = scratchCard.wallet_amount;
            } else if (commonFormattedScratchCard.reward_type === 'coupon') {
                commonFormattedScratchCard.coupon_code = scratchCard.coupon_code;
            }
            this.scratchCard = [commonFormattedScratchCard];
            this.isReward = true;
            this.popupHeading = (this.locale === 'hi' ? constants.rewardWonPopupHeadingHi : constants.rewardWonPopupHeadingEn);
            this.popupDescription = (this.locale === 'hi' ? constants.rewardWonPopupDescriptionOtherDayHi : constants.rewardWonPopupDescriptionOtherDayEn).replace('?', this.day);
            // push rewards only if it's achieved first time.
            await this.mongoClient.write.collection(this.studentStreakCollection).updateOne({ studentId: this.student_id }, {
                $set: {
                    updated_at: this.currentDate,
                    last_attendance_timestamp: this.currentDate,
                },
                $inc: { last_marked_attendance: 1 },
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
                    logger.error({ tag: 'rewards', source: 'processAttendance', error: errorLog });
                    return false;
                }
                this.message = 'Attendance updated with a new reward';
                return true;
            });
        } else {
            this.isReward = false;
            if (studentAchievedLevels.includes(scratchCard.level)) {
                this.popupHeading = (this.locale === 'hi' ? constants.notificationRevisitSameLevelHeadingHi : constants.notificationRevisitSameLevelHeadingEn);
                this.popupDescription = (this.locale === 'hi' ? constants.notificationRevisitSameLevelDescriptionHi : constants.notificationRevisitSameLevelDescriptionEn).replace('?', this.day);
            } else {
                this.popupHeading = `${(this.locale === 'hi' ? 'हैलो' : 'Hello')} ${this.capitalize(this.name)}`;
                this.popupDescription = (this.locale === 'hi' ? constants.NoRewardPopupDescriptionHi : constants.NoRewardPopupDescriptionEn).replace('?', this.day);
            }
            await this.mongoClient.write.collection(this.studentStreakCollection).updateOne({ studentId: this.student_id }, {
                $set: {
                    updated_at: this.currentDate,
                    last_attendance_timestamp: this.currentDate,
                },
                $inc: { last_marked_attendance: 1 },
            }, { upsert: true }, (err) => {
                if (err) {
                    console.error(err);
                    let errorLog = err;
                    if (!_.isObject(errorLog)) {
                        errorLog = JSON.stringify(errorLog);
                    }
                    logger.error({ tag: 'rewards', source: 'processAttendance', error: errorLog });
                    return false;
                }
                this.message = 'Attendance updated without any rewards';
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
                // const userActions = await redisLibrary.getByKey(`nudge_pop_up_${this.student_id}`, redisClient);
                // console.log(userActions, ' user actions');
                for (let i = 0; i < rewardsData.length; i++) {
                    const rewardType = rewardsData[i].reward_type;
                    if (rewardType === 'ncert') {
                        console.log('ncert type reward');
                        scratchCard = this.getCommonScratchContent(rewardsData[i], '', rewards);
                        break;
                    } else if (rewardType === 'game') {
                        console.log('game type reward');
                        scratchCard = this.getCommonScratchContent(rewardsData[i], '', rewards);
                        break;
                    } else if (rewardType === 'coupon') {
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
                    } else if (rewardType === 'better') {
                        console.log('better luck');
                        scratchCard = this.getCommonScratchContent(rewardsData[i], '', rewards);
                        break;
                    } else {
                        console.error('unknown reward found');
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
            logger.error({ tag: 'rewards', source: 'getApplicableScratchCards', error: errorLog });
            return false;
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

    async isAttendanceMarked(lastMarkedAttendance) {
        this.message = 'Attendance is already marked';
        this.popupHeading = `${(this.locale === 'hi' ? 'हैलो' : 'Hello')} ${this.capitalize(this.name)}`;
        let isAttendanceMarked = true;
        const rewardDays = await this.getAllRewardDays();
        if (!lastMarkedAttendance) {
            this.message = 'No Attendance found';
            if (rewardDays.includes(1)) {
                this.popupDescription = (this.locale === 'hi' ? 'कृप्या अपनी उपस्तिथि दर्ज करके अपना आज कि उपहार पाएं!' : 'Please mark your attendance to collect your exciting reward now.');
            } else {
                this.popupDescription = (this.locale === 'hi' ? 'अपनी रोजाना उपस्तिथि जारी रखने के लिए कृप्या पहले दिन कि उपस्तिथि दर्ज करें' : 'Please mark your attendance for day 1 to keep your daily streak and win exciting rewards.');
            }
            isAttendanceMarked = false;
        } else {
            const lastAttendanceAt = lastMarkedAttendance.last_attendance_timestamp;
            const nextAttendanceDay = lastMarkedAttendance.last_marked_attendance + 1;
            const totalDayDifference = this.daysDifferenceFromCurrent(lastAttendanceAt);
            if (totalDayDifference === 1) {
                if (rewardDays.includes(nextAttendanceDay)) {
                    this.popupDescription = (this.locale === 'hi' ? 'कृप्या अपनी उपस्तिथि दर्ज करके अपना आज कि उपहार पाएं!' : 'Please mark your attendance to collect your exciting reward now.');
                } else {
                    this.popupDescription = (this.locale === 'hi' ? `अपनी रोजाना उपस्तिथि जारी रखने के लिए कृप्या ${this.ordinalSuffixOf(nextAttendanceDay)} day कि उपस्तिथि दर्ज करें` : `Please mark your attendance for day ${nextAttendanceDay} to keep your daily streak and win exciting rewards.`);
                }
                isAttendanceMarked = false;
                this.message = 'Attendance not marked today';
            } else if (totalDayDifference >= 1) {
                this.message = 'Attendance streak break';
                this.popupDescription = (this.locale === 'hi' ? 'ओह! आप अपनी उपस्तिथि दर्ज करना भूल गए, दोबारा शुरुआत करने के लिए कृप्या आज की उपस्तिथि दर्ज करे और उपहार पाते रहे।' : 'Oops! You\'ve missed your last attendance, you can start your daily streak again to keep receiving exciting rewards.');
                isAttendanceMarked = false;
            }
        }
        let popupData = null;
        if (this.popupHeading && this.popupDescription) {
            popupData = { popup_heading: this.popupHeading, popup_description: this.popupDescription };
        }
        return { message: this.message, data: { is_attendance_marked: isAttendanceMarked, popup_data: popupData } };
    }

    async getAllRewardDays() {
        try {
            const versionCode = parseInt(this.req.headers.version_code);
            let rewardsDays = await redisLibrary.getByKey(`ALL_REWARD_DAYS_${versionCode}`, redisClient);
            if (!rewardsDays) {
                console.error('redis key not found for ALL_REWARD_DAYS');
                rewardsDays = [];
                const allRewards = await this.mongoClient.read.collection(this.rewardsCollection).find({
                    min_app_version: { $lte: versionCode }, max_app_version: { $gte: versionCode },
                }).sort({ level: 1 }).toArray();
                for (let j = 0; j < allRewards.length; j++) {
                    rewardsDays.push(allRewards[j].day);
                }
                redisLibrary.setByKey(`ALL_REWARD_DAYS_${versionCode}`, rewardsDays, 86400, redisClient);
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
            logger.error({ tag: 'rewards', source: 'getAllRewardDays', error: errorLog });
            return false;
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
            const rewards = _.filter(isReward.scratch_cards, (p) => p.level === level);
            const { reward_type: rewardType } = rewards[0];
            if (rewardType === 'wallet') {
                const expiry = await Utility.getRewardExpiry(this.req.headers['x-auth-token']);
                const rewardWallet = rewards[0].wallet_amount;
                await WalletUtil.makeWalletTransaction({
                    student_id: this.student_id,
                    reward_amount: rewardWallet,
                    type: 'CREDIT',
                    payment_info_id: 'dedsorupiyadega',
                    reason: 'add_attendance_reward',
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
                logger.error({ tag: 'rewards', source: 'scratchCard', error: 'unknown reward found during scratch!' });
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
                        logger.error({ tag: 'rewards', source: 'scratchCard', error: errorLog });
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

    static async sendReinstallRewardEarnedNotification(obj, type, notificationContent) {
        try {
            let notificationData = {};
            if (type === 'dnr_reward') {
                notificationData = {
                    event: 'dnr',
                    title: notificationContent.title,
                    message: notificationContent.message,
                    image: null,
                    firebase_eventtag: 'reinstall_reward_dnr',
                    data: {},
                };
            } else if (type === 'course_reward') {
                notificationData = {
                    event: 'course_details',
                    title: notificationContent.title,
                    message: notificationContent.message,
                    image: null,
                    firebase_eventtag: 'reinstall_reward_course',
                    data: {},
                };
            }

            Utility.sendFcm(obj.studentId, obj.gcmRegId, notificationData, null, null);
            return true;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async dnrRewardForReinstallStudent(db, obj) {
        try {
            // checking if user is eligible for dnr relogin reward
            const hasUserReceivedSms = await StudentMongo.isEligibleForDnrReinstallReward(db.mongo.read, obj.studentId);
            if (!_.isEmpty(hasUserReceivedSms)) {
                const data = { reward_type: 'reinstall_after_120_days' };
                const postUrl = '/api/dnr/adding-money-to-wallet';
                const isDnrAwardedAlready = await StudentMongo.isDnrAlreadyAwarded(db.mongo.read, obj.studentId);
                if (_.isEmpty(isDnrAwardedAlready)) {
                    microService.requestMicroServer(postUrl, data, obj.xAuthToken, obj.versionCode);
                    StudentMongo.addingDnrReinstallRewardedStudent(db.mongo.read, obj.studentId);

                    const notificationData = {
                        title: Data.reinstall_reward_dnr_notification.title[obj.locale],
                        message: Data.reinstall_reward_dnr_notification.message[obj.locale],
                    };
                    this.sendReinstallRewardEarnedNotification(obj, 'dnr_reward', notificationData);
                }
            }
            return true;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async freeCourseRewardForReinstallStudent(db, obj) {
        try {
            // checking if user is eligible for course trial relogin reward
            const hasUserReceivedSms = await StudentMongo.isEligibleForCourseReinstallnReward(db.mongo.read, obj.studentId);
            if (!_.isEmpty(hasUserReceivedSms)) {
                const isCourseAwardedAlready = await StudentMongo.isCourseAlreadyAwarded(db.mongo.read, obj.studentId);
                if (_.isEmpty(isCourseAwardedAlready)) {
                    // awarding course
                    const courseData = await TrialMysql.getAssortmentForStudent(db.mysql.read, obj.studentId, obj.studentClass);
                    if (!_.isEmpty(courseData)) {
                        const result = await PackageContainer.createSubscriptionEntryForTrialV1(db, obj.studentId, courseData[0].assortment_id, -1, Data.reinstall_reward_trial_duration);
                        if (!_.isEmpty(result)) {
                            StudentMongo.addingCourseReinstallRewardedStudent(db.mongo.read, obj.studentId);
                            const message = Data.reinstall_reward_course_notification.message[obj.locale].replace('xx-course-xx', courseData[0].display_name);
                            const notificationData = {
                                title: Data.reinstall_reward_course_notification.title[obj.locale],
                                message,
                            };
                            this.sendReinstallRewardEarnedNotification(obj, 'course_reward', notificationData);
                        }
                    }
                }
            }
            return true;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async creditInDNR(req, data) {
        try {
            /** data must have:
                reward_type

            Optional keys in data objects:
                deeplink
                event
                course_id
             */
            const xAuthToken = req.headers['x-auth-token'];
            const versionCode = req.headers.version_code;
            await microService.requestMicroServer('/api/dnr/adding-money-to-wallet', data, xAuthToken, versionCode);
            return true;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async isBNBCampaignEnabledForDNR(req) {
        try {
            const campaignDetails = await BranchContainer.getByCampaign(req.app.get('db'), req.user.campaign);
            return !_.isEmpty(campaignDetails) && campaignDetails[0].dnr_wallet === 1;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    static async dnrRewardForReferral(db, obj) {
        const data = { reward_type: 'referral_reward', referral_data: obj };
        const postUrl = '/api/dnr/referral-rewarding';
        microService.requestMicroServerWithoutAuthToken(postUrl, data, obj.version_code);
    }
}

module.exports = RewardsManager;
