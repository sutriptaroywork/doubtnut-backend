/**
 * This is a helper file of doubt pe charcha module,
 * built with class based architecture, used mysql as primary database
 * PRD: https://docs.google.com/document/d/1UD6f8_hfkO1FGmvZntbItA33fG1fgs3yQWgOZSepsN4
 */

const _ = require('lodash');
const moment = require('moment');
const uuid = require('uuid-random');
const logger = require('../../config/winston').winstonLogger;
const Utility = require('../../modules/utility');
const messages = require('./sendsms.handler');
const kheloJeetoData = require('../../data/khelo.jeeto.data');
const redisLibrairy = require('../../modules/redis/library');
const redisClient = require('../../config/redis');
const studentRedis = require('../../modules/redis/student');
const dexterController = require('../v1/dexter/dexter.controller');
const kheloJeetoMysql = require('../../modules/mysql/khelo.jeeto');
const kheloJeetoRedis = require('../../modules/redis/khelo.jeeto');
const WalletUtil = require('../../modules/wallet/Utility.wallet');
const Coupon = require('../../modules/containers/coupon');
const CouponMySQL = require('../../modules/mysql/coupon');
const RedisUtil = require('../../modules/redis/utility.redis');
const ReferAndEarnHelper = require('./referAndEarn.helper');
const freeLiveClassHelper = require('./freeLiveClass');
const StudentContainers = require('../../modules/containers/student');

const TOTAL_MINS_FOR_QUES_CACHE = 15 * 60;
const QUIZ_HISTORY_PAGINATED_LIMIT = 5;
const MAX_LEVEL = 100;

class KheloJeetoManager {
    /**
     * Asker can request for P2P in case she is not satisfied with any of the solutions on match page at the end of all
     * suggested videos or on pressing the back button in case user does not watch any solution from match page.
     * Basic notification based connect option for helpers to join a room for solving a doubt. Helpers once leave,
     * cannot rejoin a room later. Max 2 helpers join at a time.
     * Users would be able to access their past doubts - both as asker and helper as well as all active current doubts
     * from the the Doubt pe Charcha Page - which opens up from Top Icon, hamburger and profile icons of Doubt pe
     * charcha. Extended Room Availability: The rooms once created won't close and users would be able to enter them
     * later anytime as well / revisit solutions
     * @constructor
     */
    constructor(request) {
        console.log(request.user.student_id, ' Student id');
        this.config = request.app.get('config');
        this.db = request.app.get('db');
        this.locale = request.user.locale;
        this.mongoClient = this.db.mongo;
        this.req = request;
        this.student_id = request.user.student_id;
        this.student_class = (_.isNull(request.user.student_class) ? 12 : parseInt(request.user.student_class));
        this.rewardCollection = 'khelo_jeeto_rewards';
        this.studentRewardCollection = 'khelo_jeeto_student_rewards';
        this.availableChapterCollection = 'available_topics_quiz';
        this.resultCollection = 'khelo_jeeto_result';
        this.versionCode = request.headers.version_code;
        this.flagrVariantsArr = request.headers.flagr_variation_ids;
        this.studentName = (request.user.student_fname ? request.user.student_fname.replace(/\r?\n|\r/g, ' ').replace(/ +/g, ' ') : 'Doubtnut User');
        this.capitalize = (s) => {
            if (typeof s !== 'string') return '';
            return s.charAt(0).toUpperCase() + s.slice(1);
        };
        this.getRewardStructure = ((reward) => ({
            title: reward.title,
            info: reward.info,
            is_locked: reward.is_locked,
            coupon_code: null,
            cta_text: reward.cta_text,
            cta_deeplink: reward.cta_deeplink,
        }));
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();
    }

    // eslint-disable-next-line class-methods-use-this
    getNowAndTodayInIST() {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const today = now.format('YYYY-MM-DD');
        return { now, today };
    }

    async getRecentTopics(count) {
        const recentTopics = await kheloJeetoRedis.getRecentTopics(this.db.redis.read, this.student_id);
        return _.uniq(recentTopics).slice(0, count);
    }

    async getSecondaryResponse(topic) {
        try {
            let secondaryCta = this.locale === 'hi' ? kheloJeetoData.result.askQuestion.hi : kheloJeetoData.result.askQuestion.en;
            let secondaryCtaDeeplink = kheloJeetoData.result.askQuestionDeeplink;
            if (this.req.headers.version_code >= 940) {
                let randomTopic = topic;
                const topics = await this.mongoClient.read.collection(this.availableChapterCollection).aggregate([{ $sample: { size: 1 } }]).toArray();
                if (!_.isEmpty(topics)) {
                    randomTopic = topics[0].chapter;
                }
                secondaryCta = this.locale === 'hi' ? kheloJeetoData.result.playAgainRandomTopic.hi : kheloJeetoData.result.playAgainRandomTopic.en;
                secondaryCtaDeeplink = kheloJeetoData.result.playAgainRandomTopicDeeplink.replace('{chapterAlias}', encodeURIComponent(randomTopic)).replace('{inviterId}', this.student_id);
            }
            return { secondaryCta, secondaryCtaDeeplink };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'previousResult', error: errorLog });
            throw (e);
        }
    }

    async getInviteBranchLink(gameId, topic) {
        try {
            let inviteUrl = '';
            const inviteLink = await Utility.generateDeeplinkFromAppDeeplinkWithNewSession(this.config.branch_key, 'khelojeeto',
                'invite_players', `doubtnutapp://khelo_jeeto/wait?game_id=${gameId}&inviter=${this.student_id}&chapter_alias=${topic}`);
            if (inviteLink && inviteLink.url) {
                inviteUrl = inviteLink.url;
            }
            return inviteUrl;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'getInviteBranchLink', error: errorLog });
            throw (e);
        }
    }

    getRandomOpponentData() {
        const { girlNames } = kheloJeetoData;
        const { boyNames } = kheloJeetoData;
        const cdnPath = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/';
        const opponentMeta = [{
            image: `${cdnPath}F083B361-F1E9-019D-4DB9-7742A7D28D3A.webp`,
            background_color: '#4D8B8F',
            name: _.sample(girlNames),
        }, {
            image: `${cdnPath}8F3476B4-F6CE-359C-D08E-A52A4F7522DC.webp`,
            background_color: '#38A664',
            name: _.sample(boyNames),
        }, {
            image: `${cdnPath}B4E2D49B-2307-D657-8763-D5ACFE393A62.webp`,
            background_color: '#564D8F',
            name: _.sample(girlNames),
        }, {
            image: `${cdnPath}BDEF08C3-76D3-F2B2-BC12-8CD006A4EE25.webp`,
            background_color: '#8F4D4D',
            name: _.sample(boyNames),
        }, {
            image: `${cdnPath}781842DD-746F-7358-A21E-35638F0A6534.webp`,
            background_color: '#F18686',
            name: _.sample(girlNames),
        }, {
            image: `${cdnPath}2C147F4C-BFB1-38CD-F279-75A6EB0C0856.webp`,
            background_color: '#FFE81B',
            name: _.sample(boyNames),
        }];
        const randomCounter = (Math.random() * (9.0 - 6.0) + 6.0).toFixed(1);
        return {
            counter: `${parseFloat(randomCounter)}K users online`,
            ..._.sample(opponentMeta),
        };
    }

    getWidgetResponseData(isAvailable, chapter, subject) {
        if (isAvailable && !Utility.isDnBrainlyPackageCloneAppRequestOrigin(this.req.headers)) {
            let deeplink = `doubtnutapp://khelo_jeeto/wait?chapter_alias=${chapter}&is_opponent_bot=true&inviter=${this.student_id}&is_inviter=true`;
            if (this.req.headers.version_code >= 922) {
                deeplink = `doubtnutapp://khelo_jeeto/chapter?subject=${subject}&chapter_alias=${chapter}`;
            }
            return {
                title: this.locale === 'hi' ? kheloJeetoData.widget.title.hi : kheloJeetoData.widget.title.en,
                subtitle: (this.locale === 'hi' ? kheloJeetoData.widget.subtitle.hi : kheloJeetoData.widget.subtitle.en).replace('{chapter}', chapter),
                thumbnail: kheloJeetoData.widget.thumbnail,
                button_text: this.locale === 'hi' ? kheloJeetoData.widget.ctaText.hi : kheloJeetoData.widget.ctaText.en,
                deeplink,
                is_available: isAvailable,
            };
        }
        return {
            title: null,
            subtitle: null,
            thumbnail: null,
            button_text: null,
            deeplink: null,
            is_available: isAvailable,
        };
    }

    // for setting range of scores of bot
    setScoreRangeWithCurrentLevel(level) {
        switch (true) {
            case (level >= 0 && level <= 10): {
                this.minBotScore = 10;
                this.maxBotScore = 20;
                break;
            }
            case (level >= 11 && level <= 20): {
                this.minBotScore = 20;
                this.maxBotScore = 30;
                break;
            }
            case (level >= 21 && level <= 35): {
                this.minBotScore = 30;
                this.maxBotScore = 40;
                break;
            } case (level >= 36 && level <= 50): {
                this.minBotScore = 40;
                this.maxBotScore = 50;
                break;
            } case (level >= 51 && level <= 65): {
                this.minBotScore = 50;
                this.maxBotScore = 60;
                break;
            } case (level >= 66 && level <= 80): {
                this.minBotScore = 60;
                this.maxBotScore = 70;
                break;
            } case (level >= 81 && level <= 90): {
                this.minBotScore = 70;
                this.maxBotScore = 80;
                break;
            } case (level >= 91 && level <= 95): {
                this.minBotScore = 80;
                this.maxBotScore = 90;
                break;
            } case (level >= 96 && level <= 100): {
                this.minBotScore = 80;
                this.maxBotScore = 100;
                break;
            }
            case (level >= 101): {
                this.minBotScore = 50;
                this.maxBotScore = 100;
                break;
            }
            default: {
                this.minBotScore = 10;
                this.maxBotScore = 20;
                break;
            }
        }
    }

    // basically for initialising bot's answers in each question while mapping random questions in questions() function
    getWrongBotAnswers(question, expiry) {
        const response_time = _.random(5, (['mathematics', 'maths'].includes(question.subject.toLowerCase()) ? 35 : expiry) - 5);
        const wrongAnsArr = _.filter(['A', 'B', 'C', 'D'], (res) => res != question.answer.toUpperCase());
        const wrongAns = _.sample(wrongAnsArr);
        return { answer: wrongAns, response_time };
    }

    // for adding required number right bot answers to response
    setBotCorrectAnswers(responseFormat, correctAns, botScores, fraction, multiplier) {
        let timeReq;
        const maxTimeRange = fraction - 1; // max time to be added in timeReq to maintain the score
        for (let i = 0; i < correctAns; i++) {
            timeReq = ((this.maxScorePerQues - botScores[i]) * fraction) / multiplier;
            responseFormat[i].bot_meta.answer = responseFormat[i].answer;
            if (botScores[i] == 20) {
                responseFormat[i].bot_meta.response_time = _.random(timeReq + 2, timeReq + maxTimeRange);//  +2 so that bot doesnt make ans at 0 sec
            } else {
                responseFormat[i].bot_meta.response_time = _.random(timeReq, timeReq + maxTimeRange);
            }
        }
        return responseFormat;
    }

    // to calculate number of correct ans bot must make for getting the target score
    getNumberOfCorrectAns(targetScore) {
        let correctAns = 0;
        if (targetScore % this.maxScorePerQues == 0) {
            correctAns = targetScore / this.maxScorePerQues; // calculation number of right answer bot have to make
        } else {
            correctAns = Math.floor(targetScore / this.maxScorePerQues);
            correctAns++;
        }
        return correctAns;
    }

    // for dividing bot's scores basis of targetScore and number of correct answers
    getBotScoresArray(targetScore, correctAns) {
        const score = [];
        let sumofScore = 0;
        const lastScoreIndex = correctAns - 1;
        const min = Math.floor((targetScore / correctAns));
        for (let i = 0; i < lastScoreIndex; i++) {
            if (min == this.maxScorePerQues) {
                score[i] = this.maxScorePerQues;
            } else {
                score[i] = _.random(min, this.maxScorePerQues);
            }
            if (score[i] % 2 != 0) { // to confirm that the score is even number
                score[i]++;
            }
            sumofScore += score[i];
        }
        score[lastScoreIndex] = targetScore - sumofScore;
        const lastScore = score[lastScoreIndex];
        let diff;
        if (lastScore < this.minScorePerQues) { // score cannot be less than min score i.e 10
            diff = this.minScorePerQues - lastScore;
            score[lastScoreIndex] = this.minScorePerQues;
            score[_.random(0, lastScoreIndex - 1)] -= diff;
        }
        return score;
    }

    // for shuffling bot's answers
    shuffleBotAnswers(responseFormat) {
        let shuffleNumber;
        let temp;
        if (!_.isEmpty(responseFormat)) {
            for (let i = responseFormat.length - 1; i >= 0; i--) { // for shuffling right answers by bot
                shuffleNumber = _.random(0, responseFormat.length - 1);
                temp = responseFormat[shuffleNumber];
                responseFormat[shuffleNumber] = responseFormat[i];
                responseFormat[i] = temp;
            }
        }
        return responseFormat;
    }

    getRandomMessagesAndEmoji(key, questionTime) {
        const msg = [];
        const randomMsg = this.locale === 'hi' ? _.sample(kheloJeetoData.chatActions.botMessages.hi) : _.sample(kheloJeetoData.chatActions.botMessages.en);
        const randomEmoji = _.sample(kheloJeetoData.chatActions.emoji);
        const randomTime = Math.floor((Math.random() * questionTime));
        if (key === 'message') {
            msg.push({ message: randomMsg, time: randomTime });
        } else {
            msg.push({ message: randomEmoji, time: randomTime });
        }
        return msg;
    }

    async home() {
        try {
            // topics
            let isRecentAvailable = true;
            // fetched unique topics from redis of length count
            const recentTopics = _.map(await this.getRecentTopics(5), (item) => ({
                title: item.length > 15 ? `${item.slice(0, 15)}...` : item,
                chapter_alias: item,
            }));
            if (_.isEmpty(recentTopics)) {
                isRecentAvailable = false;
            }
            const recentTitle = this.locale === 'hi' ? kheloJeetoData.recentTopicTitle.hi : kheloJeetoData.recentTopicTitle.en;
            const recentContainer = { recent_title: recentTitle, recent_topics: recentTopics };

            // subject
            const isSubjectAvailable = true;
            const subjectContainerTitle = this.locale === 'hi' ? kheloJeetoData.subjectTitle.hi : kheloJeetoData.subjectTitle.en;
            const subjects = this.locale === 'hi' ? kheloJeetoData.subjects.hi : kheloJeetoData.subjects.en;

            // quiz history
            let isQuizHistoryAvailable = false;
            let showViewMore = false;
            let quizHistoryTitle = null;
            let quizHistorySubtitle = null;
            const quizPlayedHistory = await this.getQuizData(0, QUIZ_HISTORY_PAGINATED_LIMIT);
            if (quizPlayedHistory) {
                quizHistoryTitle = this.locale === 'hi' ? kheloJeetoData.quizPerformance.title.hi : kheloJeetoData.quizPerformance.title.en;
                quizHistorySubtitle = this.locale === 'hi' ? kheloJeetoData.quizPerformance.subtitle.hi : kheloJeetoData.quizPerformance.subtitle.en;
                isQuizHistoryAvailable = true;
                showViewMore = Boolean(quizPlayedHistory.length >= QUIZ_HISTORY_PAGINATED_LIMIT);
            }

            // games
            let levelTitle = `${(this.locale === 'hi' ? kheloJeetoData.levelTitle.hi : kheloJeetoData.levelTitle.hien)} 1`;
            let levelDescription = (this.locale === 'hi' ? kheloJeetoData.levelDescription.hi : kheloJeetoData.levelDescription.hien).replace('<>', '2').replace('[]', '5');
            let totalGames = 5;
            let totalWon = 0;
            let currentLevel = 1;
            const studentData = await this.mongoClient.read.collection(this.studentRewardCollection).findOne({ student_id: this.student_id });
            if (studentData) {
                totalGames = studentData.current_total_games;
                totalWon = studentData.current_level_wins;
                currentLevel = studentData.level;
                levelTitle = `${(this.locale === 'hi' ? kheloJeetoData.levelTitle.hi : kheloJeetoData.levelTitle.hien)} ${currentLevel}`;
                if (currentLevel < MAX_LEVEL) {
                    levelDescription = (this.locale === 'hi' ? kheloJeetoData.levelDescription.hi : kheloJeetoData.levelDescription.hien).replace('<>', currentLevel + 1).replace('[]', `${totalGames - totalWon}`);
                } else {
                    levelDescription = (this.locale === 'hi' ? kheloJeetoData.maxLevelDescription.hi : kheloJeetoData.maxLevelDescription.hien).replace('<>', MAX_LEVEL);
                }
            }

            // leaderboard
            const isLeaderboardAvailable = true;
            const tabs = this.locale === 'hi' ? kheloJeetoData.leaderboard.tabs.hi : kheloJeetoData.leaderboard.tabs.en;
            const activeTab = tabs[0].id;
            const leaderboardTitle = this.locale === 'hi' ? kheloJeetoData.leaderboard.dailyTitle.hi : kheloJeetoData.leaderboard.dailyTitle.en;
            const leaderboardSubtitle = this.locale === 'hi' ? kheloJeetoData.leaderboard.dailySubtitle.hi : kheloJeetoData.leaderboard.dailySubtitle.en;
            const winners = await this.getLeaderboardList(1, 0, 2);
            let studentRank = null;
            const leaderboardDeeplink = 'doubtnutapp://khelo_jeeto/leaderboard?active_tab_id=1';
            let rankText = null;
            let isRankAvailble = false;
            if (_.has(winners, 'logged_in_student_data.rank') && winners.logged_in_student_data.rank) {
                studentRank = `${winners.logged_in_student_data.rank}`;
                rankText = this.locale === 'hi' ? kheloJeetoData.rank.hi : kheloJeetoData.rank.en;
                isRankAvailble = true;
            }

            let cta = {};
            if (this.req.headers.version_code >= 940) {
                // play again with random topic
                let randomTopic = null;
                const topics = await this.mongoClient.read.collection(this.availableChapterCollection).aggregate([{ $sample: { size: 1 } }]).toArray();
                if (!_.isEmpty(topics)) {
                    randomTopic = topics[0].chapter;
                }
                cta = {
                    primary_cta: this.locale === 'hi' ? kheloJeetoData.randomTopicCta.hi : kheloJeetoData.randomTopicCta.en,
                    primary_cta_deeplink: kheloJeetoData.result.playAgainRandomTopicDeeplink.replace('{chapterAlias}', encodeURIComponent(randomTopic)).replace('{inviterId}', this.student_id),
                };
            }
            let faq;
            if (this.req.headers.version_code >= 943) {
                faq = (this.locale === 'hi' ? kheloJeetoData.newFaq.hi : kheloJeetoData.newFaq.en);
            } else {
                faq = (this.locale === 'hi' ? kheloJeetoData.faq.hi : kheloJeetoData.faq.en);
            }

            return {
                total_game_won: totalWon,
                total_game: totalGames,
                level_title: levelTitle,
                current_level: currentLevel,
                level_description: levelDescription,
                is_recent_available: isRecentAvailable,
                recent_container: recentContainer,
                is_subject_available: isSubjectAvailable,
                subject_container: { title: subjectContainerTitle, subjects },
                is_quiz_history_available: isQuizHistoryAvailable,
                quiz_history_container: {
                    title: quizHistoryTitle, subtitle: quizHistorySubtitle, quiz_played_history: quizPlayedHistory, show_view_more: showViewMore,
                },
                is_leaderboard_available: isLeaderboardAvailable,
                leaderboard_container: {
                    title: leaderboardTitle,
                    subtitle: leaderboardSubtitle,
                    tabs,
                    active_tab: activeTab,
                    winners: winners.leaderboard_data,
                    rank: studentRank,
                    rank_text: rankText,
                    leaderboard_deeplink: leaderboardDeeplink,
                    is_rank_available: isRankAvailble,
                },
                bottom_banner: kheloJeetoData.bottomBannerImage,
                faq,
                ...cta,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'home', error: errorLog });
            throw (e);
        }
    }

    async levels() {
        try {
            let completedText = null;
            const studentData = await this.mongoClient.read.collection(this.studentRewardCollection).findOne({ student_id: this.student_id });
            const studentAchievedRewards = studentData ? studentData.rewards : [];
            const rewards = [];
            let currentReward;
            const currentStudentLevel = studentData ? studentData.level : 0;
            if (studentAchievedRewards && studentAchievedRewards.length) {
                // first appending students achieved rewards - this condition is for levels, which the user has completed
                for (let i = 0; i < studentAchievedRewards.length; i++) {
                    studentAchievedRewards[i].is_locked = false;
                    studentAchievedRewards[i].cta_text = this.locale === 'hi' ? kheloJeetoData.levelCta.hi : kheloJeetoData.levelCta.en;
                    studentAchievedRewards[i].cta_deeplink = kheloJeetoData.levelDeeplink;
                    studentAchievedRewards[i].title = this.locale === 'hi' ? `${kheloJeetoData.levelTitle.hi} ${studentAchievedRewards[i].level}` : `${kheloJeetoData.levelTitle.hien} ${studentAchievedRewards[i].level}`;
                    studentAchievedRewards[i].info = this.locale === 'hi' ? studentAchievedRewards[i].unlocked_message_hi : studentAchievedRewards[i].unlocked_message_hien;
                    currentReward = this.getRewardStructure(studentAchievedRewards[i]);
                    currentReward.coupon_code = studentAchievedRewards[i].coupon_code;
                    rewards.push(currentReward);
                }
            }
            const allLevels = await this.mongoClient.read.collection(this.rewardCollection).find({ level: { $gte: currentStudentLevel } }).sort({ level: 1 }).toArray();
            if (allLevels && allLevels.length) {
                // this condition is for ongoing as well as upcoming level
                for (let j = 0; j < allLevels.length; j++) {
                    allLevels[j].is_locked = true;
                    allLevels[j].info = this.locale === 'hi' ? allLevels[j].locked_message_hi : allLevels[j].locked_message_hien;
                    allLevels[j].title = this.locale === 'hi' ? `${kheloJeetoData.levelTitle.hi} ${allLevels[j].level}` : `${kheloJeetoData.levelTitle.hien} ${allLevels[j].level}`;
                    allLevels[j].cta_text = this.locale === 'hi' ? kheloJeetoData.levelCta.hi : kheloJeetoData.levelCta.en;
                    allLevels[j].cta_deeplink = kheloJeetoData.levelDeeplink;
                    currentReward = this.getRewardStructure(allLevels[j]);
                    rewards.push(currentReward);
                }
            } else {
                completedText = this.locale === 'hi' ? kheloJeetoData.completedLevelMessage.hi : kheloJeetoData.completedLevelMessage.hien;
            }
            return {
                levels: rewards, completed_text: completedText,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'levels', error: errorLog });
            throw (e);
        }
    }

    async notificationToInvitee(inviteeId, topic, gameId) {
        try {
            // const inviteeData = await kheloJeetoMysql.getStudentData(inviteeId, this.db.mysql.read);
            const inviteeData = await StudentContainers.getById(inviteeId, this.db);
            if (_.isEmpty(inviteeData) && !inviteeData[0].gcm_reg_id) {
                return false;
            }

            inviteeData[0].name = inviteeData[0].student_fname;
            inviteeData[0].image = inviteeData[0].img_url;
            delete inviteeData[0].student_fname;
            delete inviteeData[0].img_url;

            const locale = inviteeData[0].locale || 'en';
            const notificationData = {
                event: 'khelo_jeeto',
                title: (locale === 'hi' ? kheloJeetoData.inviteNotification.title.hi : kheloJeetoData.inviteNotification.title.hien).replace('{name}', this.studentName),
                message: (locale === 'hi' ? kheloJeetoData.inviteNotification.description.hi : kheloJeetoData.inviteNotification.description.hien).replace('{topic}', topic),
                image: null,
                firebase_eventtag: 'khelo_jeeto_invite',
                path: 'wait',
                data: {
                    game_id: gameId, inviter: this.student_id, chapter_alias: topic,
                },
            };
            Utility.sendFcm(inviteeId, inviteeData[0].gcm_reg_id, notificationData, null, null);
            return true;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'notificationToInvitee', error: errorLog });
            throw (e);
        }
    }

    async smsToInvitee(mobile, topic, gameId) {
        try {
            const inviteUrl = await this.getInviteBranchLink(gameId, topic);
            const message = this.locale === 'hi' ? kheloJeetoData.smsShareText.hi : kheloJeetoData.smsShareText.en;
            messages.sendSms({
                mobile,
                msg: message.replace('{name}', this.studentName).replace('{topic}', topic).replace('{link}', inviteUrl),
                msg_type: 'Unicode_Text',
            });
            return true;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'smsToInvitee', error: errorLog });
            throw (e);
        }
    }

    async questions() {
        try {
            let gameId = `kj-${uuid()}`;
            const { chapter_alias: chapterAlias } = this.req.body;
            const { invitee_ids: inviteeIds } = this.req.body;
            let { is_whatsapp: isWhatsapp } = this.req.body;
            if (_.isNull(isWhatsapp)) {
                isWhatsapp = 0;
            }
            const totalQuestionsForQuiz = 5;
            const expiry = 30;
            this.maxScorePerQues = 20;
            this.minScorePerQues = 10;
            let botData = null;
            const botMessages = null;
            const botEmoji = null;
            /** flagr call commented
            const flgrData = { body: { capabilities: { play_quiz_config_v2: {} }, entityId: this.student_id } };
            const flagrResp = await UtilityFlagr.getFlagrResp(flgrData);
            if (flagrResp) {
                totalQuestionsForQuiz = flagrResp.play_quiz_config_v2.payload.totalQuestionsForQuiz;
                expiry = flagrResp.play_quiz_config_v2.payload.expiry;
            }
             * */
            // checking for quiz questions from redis first
            let questionData = await redisLibrairy.getByKey(`KJ_TOPIC_${chapterAlias}`, redisClient);
            if (questionData) {
                // redis key available, parsing json
                questionData = JSON.parse(questionData);
            } else {
                // not found questions from redis, querying from db
                questionData = await kheloJeetoMysql.getQuestionsByChapter(this.db.mysql.read, chapterAlias);
                if (!questionData.length && questionData.length < totalQuestionsForQuiz) {
                    // No Master chapter alias found error
                    return { message: 'No Chapter Alias Found' };
                }
                const uniqueQuestionData = _.uniqBy(questionData, 'question_text');
                if (uniqueQuestionData.length >= totalQuestionsForQuiz) {
                    questionData = uniqueQuestionData;
                }
                // creating cache as questions data found from SQL
                await redisLibrairy.setByKey(`KJ_TOPIC_${chapterAlias}`, questionData, 30 * 86400, redisClient);
            }
            studentRedis.set7Day(this.db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', this.student_id, 0);
            const studentData = await this.mongoClient.read.collection(this.studentRewardCollection).findOne({ student_id: this.student_id });
            let level;
            if (studentData) {
                level = studentData.level;
                if (studentData.level === 100 && studentData.current_level_wins >= studentData.current_total_games) {
                    level = 101;
                }
            }
            this.setScoreRangeWithCurrentLevel(level);
            let targetScore = _.random(this.minBotScore, this.maxBotScore);
            if (targetScore % 2 != 0) { // target score cannot be odd
                ++targetScore;
            }
            const correctAns = this.getNumberOfCorrectAns(targetScore);
            const multiplier = 2;

            let responseFormat = _.map(dexterController.getRandomQuestions(questionData, totalQuestionsForQuiz), (question) => ({
                class: question.class,
                subject: question.subject,
                chapter: question.chapter,
                question_id: question.question_id,
                question_text: question.question_text,
                options: [question.opt_1, question.opt_2, question.opt_3, question.opt_4],
                answer: question.answer.toUpperCase(),
                base_score: 10,
                max_score: 20,
                expire: (['mathematics', 'maths'].includes(question.subject.toLowerCase()) ? 60 : expiry),
                solutions_playlist_id: 453978,
                bot_meta: this.getWrongBotAnswers(question, expiry, targetScore),
                multiplier,
                fraction: ['mathematics', 'maths'].includes(question.subject.toLowerCase()) ? 10 : 5,
                bot_messages: this.getRandomMessagesAndEmoji('message', 30),
                bot_emoji: this.getRandomMessagesAndEmoji('emoji', 30),
            }));
            const botScores = this.getBotScoresArray(targetScore, correctAns);
            const fraction = ['mathematics', 'maths'].includes(responseFormat[0].subject.toLowerCase()) ? 10 : 5;
            if (!_.isEmpty(botScores)) {
                responseFormat = this.setBotCorrectAnswers(responseFormat, correctAns, botScores, fraction, multiplier);
            }

            responseFormat = this.shuffleBotAnswers(responseFormat);
            const chatActions = {
                messages: this.locale === 'hi' ? kheloJeetoData.chatActions.messages.hi : kheloJeetoData.chatActions.messages.hien,
                emoji: kheloJeetoData.chatActions.emoji,
            };

            let waitStatus;
            let opponentFound;
            // real user is invited
            if (_.isEmpty(inviteeIds) && parseInt(isWhatsapp) === 0) {
                // playing with a bot
                botData = this.getRandomOpponentData();
                waitStatus = this.locale === 'hi' ? kheloJeetoData.loadingScreen.botStatus.hi : kheloJeetoData.loadingScreen.botStatus.en;
                opponentFound = this.locale === 'hi' ? kheloJeetoData.loadingScreen.botFoundTitle.hi : kheloJeetoData.loadingScreen.botFoundTitle.en;
            } else {
                gameId = this.req.body.game_id;
                for (let i = 0; i < inviteeIds.length; i++) {
                    this.notificationToInvitee(inviteeIds[i], chapterAlias, gameId);
                }
                const cachedData = { questions: responseFormat, topic: chapterAlias };
                await redisLibrairy.setByKey(gameId, cachedData, TOTAL_MINS_FOR_QUES_CACHE, redisClient);
                waitStatus = this.locale === 'hi' ? kheloJeetoData.loadingScreen.status.hi : kheloJeetoData.loadingScreen.status.en;
                opponentFound = this.locale === 'hi' ? kheloJeetoData.loadingScreen.foundTitle.hi : kheloJeetoData.loadingScreen.foundTitle.en;
            }
            kheloJeetoRedis.setRecentTopics(redisClient, this.student_id, chapterAlias);
            // dexterController.createPost(this.student_id, questionData[0].question_id, chapterAlias, this.db, `doubtnutapp://khelo_jeeto_game?qid=${questionData[0].question_id}`);
            const unavailableTitle = (this.locale === 'hi' ? kheloJeetoData.acceptInvite.inviteeNotJoined.title.hi : kheloJeetoData.acceptInvite.inviteeNotJoined.title.en);
            const unavailableCtaText = this.locale === 'hi' ? kheloJeetoData.acceptInvite.inviteeNotJoined.cta.hi : kheloJeetoData.acceptInvite.inviteeNotJoined.cta.en;
            const unavailableDeeplink = kheloJeetoData.unavailable.ctaDeeplink.replace('{chapterAlias}', chapterAlias).replace('{inviterId}', this.student_id);
            if (_.isEmpty(gameId)) {
                gameId = `kj-${uuid()}`;
            }
            return {
                game_id: gameId,
                questions: responseFormat,
                chat_actions: chatActions,
                message: 'successful',
                topic: chapterAlias,
                bot_data: botData,
                bot_messages: botMessages,
                bot_emoji: botEmoji,
                music_url: kheloJeetoData.musicUrl,
                loading_screen_container: {
                    wait_title: this.locale === 'hi' ? kheloJeetoData.loadingScreen.title.hi : kheloJeetoData.loadingScreen.title.en,
                    status_text: waitStatus,
                    waiting_time: 60000,
                    opponent_found: opponentFound,
                },
                unavailable_container: {
                    title: unavailableTitle, cta_text: unavailableCtaText, deeplink: unavailableDeeplink,
                },
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'questions', error: errorLog });
            throw (e);
        }
    }

    async getWidget() {
        try {
            let message = 'SUCCESS';
            let isAvailable = true;
            let subject = null;
            const chapter = (this.req.body.chapter).toUpperCase().trim();
            const maxContinousVisibility = 3;
            const isWidgetEnabled = false;
            if (isWidgetEnabled) {
                // banner visibilty checks
                let topicBoosterVisibilityCounter = await studentRedis.get7Day(this.db.redis.read, 'TOPIC_BOOSTER_VISIBILITY', this.student_id);
                if (topicBoosterVisibilityCounter && parseInt(topicBoosterVisibilityCounter) < 6) {
                    topicBoosterVisibilityCounter = parseInt(topicBoosterVisibilityCounter) + 1;
                    studentRedis.set7Day(this.db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', this.student_id, topicBoosterVisibilityCounter);
                } else {
                    topicBoosterVisibilityCounter = 1;
                    studentRedis.set7Day(this.db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', this.student_id, 1);
                }

                if (!topicBoosterVisibilityCounter || topicBoosterVisibilityCounter <= maxContinousVisibility) {
                    // checking from available topics mongo collection
                    const isChapterAliasAllowed = await this.mongoClient.read.collection(this.availableChapterCollection).find({ chapter }).limit(1).toArray();
                    if (_.isEmpty(isChapterAliasAllowed)) {
                        isAvailable = false;
                        message = `we have no questions available for this chapter: ${chapter}`;
                    } else {
                        subject = isChapterAliasAllowed[0].subject.toLowerCase();
                    }
                } else {
                    isAvailable = false;
                    message = `Topic Booster Banner can't shown as user has not clicked it after seeing more than ${maxContinousVisibility}`;
                }
            } else {
                message = 'Khelo Jeeto Widget is not enabled from backend';
                isAvailable = false;
            }
            return { message, widget: this.getWidgetResponseData(isAvailable, chapter, subject) };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'getWidget', error: errorLog });
            return { message: 'Some Error Occurred', widget: null };
        }
    }

    async getStudentLeaderboardRank(id) {
        // fetch current student detail if he/she is not in top 10, only in case of leaderboard page
        let rank = null;
        let subtitle = null;
        const studentRank = await kheloJeetoRedis.getStudentLeaderboardRank(this.db.redis.read, id, this.student_id);
        if (!_.isNull(studentRank)) {
            rank = studentRank + 1;
            subtitle = `${await kheloJeetoRedis.getStudentLeaderboardScore(this.db.redis.read, id, this.student_id)} Wins`;
        }
        return { rank, score: subtitle };
    }

    async getLeaderboardList(id, start, end) {
        try {
            // leaderboard list from redis
            let loggedInStudentData = null;
            const leaderboardList = await kheloJeetoRedis.getLeaderboardList(this.db.redis.read, id, start, end);
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
                const studentList = await kheloJeetoMysql.getStudentDataList(studentIds, this.db.mysql.read);
                const groupedStudentList = _.groupBy(studentList, 'student_id');
                _.forEach(studentIds, (studentId, key) => {
                    const data = {
                        student_id: groupedStudentList[studentId][0].student_id,
                        name: groupedStudentList[studentId][0].name || kheloJeetoData.userName,
                        image: groupedStudentList[studentId][0].image || kheloJeetoData.userImage,
                        rank: studentRanks[key],
                        subtitle: `${studentWins[key]} Wins`,
                        label: null,
                        is_own: parseInt(studentId) === this.student_id ? 1 : 0,
                    };
                    leaderboardData.push(data);
                });
                leaderboardData = _.orderBy(leaderboardData, ['rank'], ['asc']);
                if (start === 0) {
                    loggedInStudentData = await this.getStudentLeaderboardRank(id);
                    // adding label of prize won based on rank
                    if (leaderboardData.length) {
                        for (let i = 0; i < 3; i++) {
                            if (leaderboardData[i]) {
                                let amount;
                                if (id === 1) {
                                    amount = kheloJeetoData.leaderboard.studentTitle.dailyPrizes[i];
                                } else {
                                    amount = kheloJeetoData.leaderboard.studentTitle.weeklyPrizes[i];
                                }
                                leaderboardData[i].label = (this.locale === 'hi' ? kheloJeetoData.leaderboard.studentTitle.title.hi : kheloJeetoData.leaderboard.studentTitle.title.en).replace('<>', `${amount}`);
                            }
                        }
                    }
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
            logger.error({ tag: 'KheloJeetoHelper', source: 'getLeaderboardList', error: errorLog });
            throw (e);
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
            } else {
                leaderboardData.logged_in_student_data = null;
            }
            let title; let subtitle;
            if (id === 1) {
                title = this.locale === 'hi' ? kheloJeetoData.leaderboard.dailyTitle.hi : kheloJeetoData.leaderboard.dailyTitle.en;
                subtitle = this.locale === 'hi' ? kheloJeetoData.leaderboard.dailySubtitle.hi : kheloJeetoData.leaderboard.dailySubtitle.en;
                leaderboardDeeplink = kheloJeetoData.leaderboard.dailyLeaderboardDeeplink;
            } else {
                title = this.locale === 'hi' ? kheloJeetoData.leaderboard.weeklyTitle.hi : kheloJeetoData.leaderboard.weeklyTitle.en;
                subtitle = this.locale === 'hi' ? kheloJeetoData.leaderboard.weeklySubtitle.hi : kheloJeetoData.leaderboard.weeklySubtitle.en;
                leaderboardDeeplink = kheloJeetoData.leaderboard.weeklyLeaderboardDeeplink;
            }

            return {
                page: page + 1,
                title,
                subtitle,
                leaderboard_data: leaderboardData.leaderboard_data,
                student_data: leaderboardData.logged_in_student_data,
                is_rank_available: isRankAvailable,
                rank_text: this.locale === 'hi' ? kheloJeetoData.rank.hi : kheloJeetoData.rank.en,
                rank,
                leaderboard_deeplink: leaderboardDeeplink,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'leaderboard', error: errorLog });
            throw (e);
        }
    }

    async friendsTabs() {
        try {
            const { topic } = this.req.body;
            const gameId = `kj-${uuid()}`;

            const inviteUrl = await this.getInviteBranchLink(gameId, topic);
            let whatsappCta = this.locale === 'hi' ? kheloJeetoData.friendList.whatsappButton.hi : kheloJeetoData.friendList.whatsappButton.hien;
            if (_.isEmpty(inviteUrl)) {
                whatsappCta = null;
            }
            const whatsappShareText = this.locale === 'hi' ? kheloJeetoData.whatsappShareText.hi : kheloJeetoData.whatsappShareText.en;
            const multipleInviteMessage = this.locale === 'hi' ? kheloJeetoData.friendList.multipleInvite.hi : kheloJeetoData.friendList.multipleInvite.hien;
            const multipleInviteSecondaryCta = this.locale === 'hi' ? kheloJeetoData.friendList.cta_single.hi : kheloJeetoData.friendList.cta_single.hien;
            const multipleInviteCta = this.locale === 'hi' ? kheloJeetoData.friendList.cta_multiple.hi : kheloJeetoData.friendList.cta_multiple.hien;
            return {
                title: this.locale === 'hi' ? kheloJeetoData.friendList.title.hi : kheloJeetoData.friendList.title.hien,
                subtitle: this.locale === 'hi' ? kheloJeetoData.friendList.subTitle.hi : kheloJeetoData.friendList.subTitle.hien,
                send_invite_text: this.locale === 'hi' ? 'संदेश' : 'Send',
                number_invite: this.locale === 'hi' ? kheloJeetoData.friendList.numberInvite.hi : kheloJeetoData.friendList.numberInvite.hien,
                search_placeholder: this.locale === 'hi' ? kheloJeetoData.friendList.searchPlaceholder.hi : kheloJeetoData.friendList.searchPlaceholder.hien,
                cta: this.locale === 'hi' ? kheloJeetoData.friendList.cta.hi : kheloJeetoData.friendList.cta.en,
                tabs: this.locale === 'hi' ? kheloJeetoData.friendList.tabs.hi : kheloJeetoData.friendList.tabs.hien,
                active_tab: 1,
                game_id: gameId,
                multiple_invite: { message: multipleInviteMessage, primary_cta: multipleInviteCta, secondary_cta: multipleInviteSecondaryCta },
                whatsapp_cta: whatsappCta,
                whatsapp_share_text: whatsappShareText.replace('{name}', this.studentName).replace('{topic}', topic).replace('{link}', inviteUrl),
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'friendsTabs', error: errorLog });
            throw (e);
        }
    }

    async friends() {
        try {
            const { id } = this.req.body;
            let noFriendTitle; let noFriendSubtitle;
            let userList;
            // id = 1 (following) | id = 2 (followers)
            // fetch the list of followers/following based on id
            if (id === 1) {
                userList = await kheloJeetoMysql.getFollowingList(this.student_id, this.db.mysql.read);
                noFriendTitle = this.locale === 'hi' ? kheloJeetoData.friendList.noFollowingTitle.hi : kheloJeetoData.friendList.noFollowingTitle.hien;
                noFriendSubtitle = this.locale === 'hi' ? kheloJeetoData.friendList.noFollowingSubtitle.hi : kheloJeetoData.friendList.noFollowingSubtitle.hien;
            } else {
                userList = await kheloJeetoMysql.getFollowersList(this.student_id, this.db.mysql.read);
                noFriendTitle = this.locale === 'hi' ? kheloJeetoData.friendList.noFollowersTitle.hi : kheloJeetoData.friendList.noFollowersTitle.hien;
                noFriendSubtitle = this.locale === 'hi' ? kheloJeetoData.friendList.noFollowersSubtitle.hi : kheloJeetoData.friendList.noFollowersSubtitle.hien;
            }

            const friendList = userList.map((item) => {
                item.name = item.name || kheloJeetoData.userName;
                item.image = item.image || kheloJeetoData.userImage;
                return item;
            });

            return {
                no_members_title: noFriendTitle,
                no_members_subtitle: noFriendSubtitle,
                user_data: friendList,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'friends', error: errorLog });
            throw (e);
        }
    }

    async topics() {
        try {
            const { subject } = this.req.body;
            const topics = [];
            const data = await this.mongoClient.read.collection(this.availableChapterCollection).find({ subject: subject.toUpperCase().trim() }).sort({ class: 1 }).toArray();
            for (let i = 0; i < data.length; i++) {
                if (!_.isEmpty(data[i].chapter)) {
                    topics.push(data[i].chapter);
                }
            }
            let isRecentAvailable = true;
            // fetched unique topics from redis of length count
            const recentTopics = _.map(await this.getRecentTopics(5), (item) => ({
                title: item,
                chapter_alias: item,
            }));
            if (_.isEmpty(recentTopics)) {
                isRecentAvailable = false;
            }
            const recentTitle = this.locale === 'hi' ? kheloJeetoData.recentTopicTitle.hi : kheloJeetoData.recentTopicTitle.en;
            const recentContainer = { recent_title: recentTitle, recent_topics: recentTopics };
            const heading = this.locale === 'hi' ? kheloJeetoData.subjectSelection.heading.hi : kheloJeetoData.subjectSelection.heading.hien;
            const description = this.locale === 'hi' ? kheloJeetoData.subjectSelection.description.hi : kheloJeetoData.subjectSelection.description.hien;
            const randomOpponent = this.locale === 'hi' ? kheloJeetoData.subjectSelection.randomOpponent.hi : kheloJeetoData.subjectSelection.randomOpponent.en;
            const primaryCta = this.locale === 'hi' ? kheloJeetoData.subjectSelection.primaryCta.hi : kheloJeetoData.subjectSelection.primaryCta.en;
            const selectChapters = this.locale === 'hi' ? kheloJeetoData.subjectSelection.selectChapters.hi : kheloJeetoData.subjectSelection.selectChapters.hien;
            const chooseSubject = this.locale === 'hi' ? kheloJeetoData.subjectSelection.chooseSubject.hi : kheloJeetoData.subjectSelection.chooseSubject.hien;
            const selectChapterForGame = this.locale === 'hi' ? kheloJeetoData.subjectSelection.selectChapterForGame.hi : kheloJeetoData.subjectSelection.selectChapterForGame.hien;
            const searchPlaceholder = this.locale === 'hi' ? kheloJeetoData.subjectSelection.searchPlaceholder.hi : kheloJeetoData.subjectSelection.searchPlaceholder.hien;
            let secondaryCta = this.locale === 'hi' ? kheloJeetoData.subjectSelection.secondaryCta.hi : kheloJeetoData.subjectSelection.secondaryCta.en;
            if (this.req.headers.version_code >= 920) {
                secondaryCta = this.locale === 'hi' ? kheloJeetoData.subjectSelection.secondaryCta920.hi : kheloJeetoData.subjectSelection.secondaryCta920.en;
            }
            return {
                topics,
                random_topic: _.sample(topics),
                is_recent_available: isRecentAvailable,
                recent_container: recentContainer,
                subjects: this.locale === 'hi' ? kheloJeetoData.subjects.hi : kheloJeetoData.subjects.en,
                content: {
                    heading,
                    description,
                    random_opponent: randomOpponent,
                    primary_cta: primaryCta,
                    secondary_cta: secondaryCta,
                    select_chapters: selectChapters,
                    choose_subject: chooseSubject,
                    select_chapter_for_game: selectChapterForGame,
                    search_placeholder: searchPlaceholder,
                },
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'topics', error: errorLog });
            throw (e);
        }
    }

    async numberInvite() {
        try {
            const { mobile, topic, game_id: gameId } = this.req.body;
            let isUserExist = false;
            let inviteeId = null;
            // check if number exist in our databases - if available: send inviteeId
            const studentData = await kheloJeetoMysql.getStudentIdByMobile(mobile, this.db.mysql.read);
            if (!_.isEmpty(studentData) && studentData[0].student_id) {
                isUserExist = true;
                inviteeId = studentData[0].student_id;
            }
            this.smsToInvitee(mobile, topic, gameId);
            // if exist = false, has to show this message
            const title = this.locale === 'hi' ? kheloJeetoData.userNotExist.title.hi : kheloJeetoData.userNotExist.title.hien;
            const secondaryCta = this.locale === 'hi' ? kheloJeetoData.userNotExist.cta_change.hi : kheloJeetoData.userNotExist.cta_change.hien;
            const primaryCta = this.locale === 'hi' ? kheloJeetoData.userNotExist.cta_invite.hi : kheloJeetoData.userNotExist.cta_invite.hien;
            return { user_exist: isUserExist, invitee_id: inviteeId, widget_data: { title, secondary_cta: secondaryCta, primary_cta: primaryCta } };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'numberInvite', error: errorLog });
            throw (e);
        }
    }

    async acceptInvite() {
        try {
            const { game_id: gameId } = this.req.body;
            const { inviter_id: inviterId, is_inviter_online: isInviterOnline } = this.req.body;
            let title = null;
            let ctaText = null;
            let message = 'successful';
            let canGameStart = false;
            let topic = null;
            let questions = null;
            let ctaDeeplink = null;
            // let inviterData = await kheloJeetoMysql.getStudentData(inviterId, this.db.mysql.read);
            let inviterData = await StudentContainers.getById(inviterId, this.db);

            inviterData[0].name = inviterData[0].student_fname;
            inviterData[0].image = inviterData[0].img_url;
            delete inviterData[0].student_fname;
            delete inviterData[0].img_url;

            inviterData = inviterData[0];
            let questionData = await redisLibrairy.getByKey(gameId, redisClient);
            const unavailableTitle = (this.locale === 'hi' ? kheloJeetoData.acceptInvite.inviteePlaying.title.hi : kheloJeetoData.acceptInvite.inviteePlaying.title.en).replace('{name}', inviterData.name || 'Doubtnut User');
            const unavailableCtaText = this.locale === 'hi' ? kheloJeetoData.acceptInvite.inviteePlaying.cta.hi : kheloJeetoData.acceptInvite.inviteePlaying.cta.en;
            const unavailableDeeplink = kheloJeetoData.unavailable.ctaDeeplink.replace('{chapterAlias}', this.req.body.chapter_alias).replace('{inviterId}', this.student_id);

            if (_.isEmpty(questionData) || isInviterOnline === 0) {
                message = 'This game is not valid anymore!';
                title = (this.locale === 'hi' ? kheloJeetoData.acceptInvite.inviterLeft.title.hi : kheloJeetoData.acceptInvite.inviterLeft.title.en).replace('{name}', inviterData.name || 'Doubtnut User');
                ctaText = this.locale === 'hi' ? kheloJeetoData.acceptInvite.inviterLeft.cta.hi : kheloJeetoData.acceptInvite.inviterLeft.cta.en;
                ctaDeeplink = kheloJeetoData.unavailable.ctaDeeplink.replace('{chapterAlias}', this.req.body.chapter_alias).replace('{inviterId}', this.student_id);
            } else {
                // del redis so that no other user joins the same game
                await redisLibrairy.delByKey(gameId, redisClient);
                questionData = JSON.parse(questionData);
                questions = questionData.questions;
                topic = questionData.topic;
                canGameStart = true;
                kheloJeetoRedis.setRecentTopics(redisClient, this.student_id, topic);
            }

            const chatActions = {
                messages: this.locale === 'hi' ? kheloJeetoData.chatActions.messages.hi : kheloJeetoData.chatActions.messages.hien,
                emoji: kheloJeetoData.chatActions.emoji,
            };

            return {
                message,
                title,
                cta_text: ctaText,
                cta_deeplink: ctaDeeplink,
                questions,
                topic,
                inviter_data: inviterData,
                chat_actions: chatActions,
                can_game_start: canGameStart,
                game_id: gameId,
                music_url: kheloJeetoData.musicUrl,
                loading_screen_container: {
                    wait_title: this.locale === 'hi' ? kheloJeetoData.loadingScreen.title.hi : kheloJeetoData.loadingScreen.title.en,
                    status_text: this.locale === 'hi' ? kheloJeetoData.loadingScreen.status.hi : kheloJeetoData.loadingScreen.status.en,
                    waiting_time: 60000,
                    opponent_found: this.locale === 'hi' ? kheloJeetoData.loadingScreen.foundTitle.hi : kheloJeetoData.loadingScreen.foundTitle.en,
                },
                unavailable_container: {
                    title: unavailableTitle, cta_text: unavailableCtaText, deeplink: unavailableDeeplink,
                },
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'acceptInvite', error: errorLog });
            throw (e);
        }
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

    async levelCheck() {
        try {
            let isLevelUp = false;
            let unlockedLevel = null;
            let title = null;
            let description = null;
            let couponCode = null;
            let cta = null;
            let pageDescription;
            const studentData = await this.mongoClient.read.collection(this.studentRewardCollection).findOne({ student_id: this.student_id });
            if (studentData) {
                studentData.current_level_wins++;
                if (studentData.current_level_wins % studentData.current_total_games === 0) {
                    // give prize - level up
                    const rewardData = await this.mongoClient.read.collection(this.rewardCollection).find({ level: { $gte: studentData.level } }).sort({ level: 1 }).limit(2)
                        .toArray();
                    const expiry = await Utility.getRewardExpiry(this.req.headers['x-auth-token']);
                    // pushing wallet reward as per reward amount
                    WalletUtil.makeWalletTransaction({
                        student_id: this.student_id,
                        reward_amount: rewardData[0].wallet_amount,
                        type: 'CREDIT',
                        payment_info_id: 'dedsorupiyadega',
                        reason: 'khelo_jeeto_reward',
                        expiry,
                    });
                    // generating coupon
                    couponCode = await this.getRandomCoupon();
                    Coupon.createKheloJeetoCoupon(this.db, this.student_id, couponCode, rewardData[0].coupon_reward_percent, 30, rewardData[0].max_coupon_discount);

                    studentData.rewards.push({
                        level: studentData.level,
                        total_games: studentData.current_total_games,
                        unlocked_message_hi: rewardData[0].unlocked_message_hi,
                        unlocked_message_hien: rewardData[0].unlocked_message_hien,
                        coupon_code: couponCode,
                        created_at: this.currentDate,
                    });

                    pageDescription = (this.locale === 'hi' ? kheloJeetoData.result.description.levelUp.hi : kheloJeetoData.result.description.levelUp.en)
                        .replace('{currLevel}', studentData.level)
                        .replace('{win}', studentData.current_total_games)
                        .replace('{nextLevel}', studentData.level + 1);

                    if (studentData.level === MAX_LEVEL) {
                        this.mongoClient.write.collection(this.studentRewardCollection).updateOne(
                            { student_id: this.student_id }, {
                                $set: {
                                    level: studentData.level,
                                    current_total_games: 5,
                                    current_level_wins: 5,
                                    rewards: studentData.rewards,
                                    updated_at: this.currentDate,
                                },
                            },
                        );
                    } else {
                        studentData.level++;
                        this.mongoClient.write.collection(this.studentRewardCollection).updateOne(
                            { student_id: this.student_id }, {
                                $set: {
                                    level: studentData.level,
                                    current_total_games: rewardData[1].total_games,
                                    current_level_wins: 0,
                                    rewards: studentData.rewards,
                                    updated_at: this.currentDate,
                                },
                            },
                        );
                    }
                    isLevelUp = true;
                    unlockedLevel = studentData.level;
                    title = (this.locale === 'hi' ? kheloJeetoData.levelUp.title.hi : kheloJeetoData.levelUp.title.en).replace('{name}', this.studentName);
                    description = this.locale === 'hi' ? rewardData[0].unlocked_message_hi : rewardData[0].unlocked_message_hien;
                    cta = this.locale === 'hi' ? kheloJeetoData.levelUp.playAgain.hi : kheloJeetoData.levelUp.playAgain.hien;
                } else {
                    // no level up - increase current level wins
                    this.mongoClient.write.collection(this.studentRewardCollection).update(
                        { student_id: this.student_id }, {
                            $inc: { current_level_wins: 1 },
                            $set: { updated_at: this.currentDate },
                        },
                    );
                    if (studentData.level < MAX_LEVEL) {
                        pageDescription = (this.locale === 'hi' ? kheloJeetoData.result.description.win.hi : kheloJeetoData.result.description.win.en)
                            .replace('{currLevel}', studentData.level)
                            .replace('{win}', studentData.current_level_wins)
                            .replace('{nextLevel}', studentData.level + 1)
                            .replace('{winsLeft}', studentData.current_total_games - studentData.current_level_wins);
                    } else {
                        pageDescription = (this.locale === 'hi' ? kheloJeetoData.result.previousDescription.win.hi : kheloJeetoData.result.previousDescription.win.en);
                    }
                }
            } else {
                // if user is playing for the first time
                const rewardData = await this.mongoClient.read.collection(this.rewardCollection).findOne({ level: 1 });
                if (!_.isEmpty(rewardData)) {
                    this.mongoClient.write.collection(this.studentRewardCollection).insertOne({
                        student_id: this.student_id,
                        level: 1,
                        current_total_games: rewardData.total_games,
                        current_level_wins: 1,
                        rewards: [],
                        created_at: this.currentDate,
                        updated_at: this.currentDate,
                    });
                }
                pageDescription = (this.locale === 'hi' ? kheloJeetoData.result.description.win.hi : kheloJeetoData.result.description.win.en)
                    .replace('{currLevel}', 1)
                    .replace('{win}', 1)
                    .replace('{nextLevel}', 2)
                    .replace('{winsLeft}', 4);
            }
            return {
                is_level_up: isLevelUp, unlocked_level: unlockedLevel, title, description, cta, coupon_code: couponCode, page_description: pageDescription,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'levelCheck', error: errorLog });
            throw (e);
        }
    }

    async resultSupport(levelData, topic) {
        // this function is to create response structure - so that there would not be any repetition of code
        let studentRank = null;
        let leaderboardDeeplink = null;
        let rankText = null;
        let isRankAvailable = false;
        const rank = await kheloJeetoRedis.getStudentLeaderboardRank(this.db.redis.read, 1, this.student_id);
        if (rank !== null) {
            studentRank = `${rank + 1}`;
            rankText = this.locale === 'hi' ? kheloJeetoData.rank.hi : kheloJeetoData.rank.en;
            leaderboardDeeplink = 'doubtnutapp://khelo_jeeto/leaderboard?active_tab_id=1';
            isRankAvailable = true;
        }
        let isLevelUp = false;
        let unlockedLevel = null; let levelTitle = null;
        let levelDescription = null; let couponCode = null; let levelCta = null;
        let description = null; let levelCtaDeeplink = null;
        let levelImage = null;
        if (levelData) {
            isLevelUp = levelData.is_level_up;
            unlockedLevel = levelData.unlocked_level;
            levelTitle = levelData.title;
            levelDescription = levelData.description;
            couponCode = levelData.coupon_code;
            levelCta = levelData.cta;
            description = levelData.page_description;
            levelCtaDeeplink = kheloJeetoData.result.playAgainDeeplink.replace('{chapterAlias}', topic).replace('{inviterId}', this.student_id);
            levelImage = kheloJeetoData.levelUp.image;
        }

        const levelUpContainer = {
            unlocked_level: unlockedLevel,
            title: levelTitle,
            description:
            levelDescription,
            cta: levelCta,
            coupon_code: couponCode,
            image: levelImage,
            cta_deeplink: levelCtaDeeplink,
        };
        return {
            name: this.locale === 'hi' ? kheloJeetoData.result.name.hi : kheloJeetoData.result.name.en,
            opponent_name: this.locale === 'hi' ? kheloJeetoData.result.opponent_name.hi : kheloJeetoData.result.opponent_name.en,
            is_rank_available: isRankAvailable,
            rank_text: rankText,
            rank: studentRank,
            rank_deeplink: leaderboardDeeplink,
            description,
            is_level_up: isLevelUp,
            level_up_container: levelUpContainer,
        };
    }

    async result() {
        try {
            let {
                inviter_score: inviterScore, invitee_score: inviteeScore, inviter_correct_questions: inviterCorrectQuestions,
                invitee_correct_questions: inviteeCorrectQuestions,
            } = this.req.body;
            const {
                game_id: gameId, inviter_id: inviterId, topic, all_questions: allQuestions, total_score: totalScore,
            } = this.req.body;
            let { invitee_id: inviteeId, is_quit: isQuit } = this.req.body;
            if (inviteeId) {
                inviteeId = parseInt(inviteeId);
            } else {
                inviteeId = null;
            }
            let quitPlayerId = null;
            if (isQuit) {
                quitPlayerId = this.student_id;
            }
            const isResultAvailable = true;
            const unavailableTitle = null;
            const unavailableSubtitle = null;
            const unavailableCta = null;
            const unavailableDeeplink = null;
            const isAlreadyAdded = await this.mongoClient.read.collection(this.resultCollection).findOne({ game_id: gameId });
            if (_.isEmpty(isAlreadyAdded)) {
                this.mongoClient.write.collection(this.resultCollection).insertOne({
                    game_id: gameId,
                    inviter_id: inviterId,
                    invitee_id: inviteeId,
                    total_score: totalScore,
                    inviter_score: inviterScore,
                    invitee_score: inviteeScore,
                    is_quit: isQuit,
                    quit_player_id: quitPlayerId,
                    total_questions: allQuestions.length,
                    inviter_correct_questions: inviterCorrectQuestions,
                    invitee_correct_questions: inviteeCorrectQuestions,
                    created_at: this.currentDate,
                    topic,
                    all_questions: allQuestions,
                });
            } else {
                inviterScore = isAlreadyAdded.inviter_score;
                inviteeScore = isAlreadyAdded.invitee_score;
                inviterCorrectQuestions = isAlreadyAdded.inviter_correct_questions;
                inviteeCorrectQuestions = isAlreadyAdded.invitee_correct_questions;
                isQuit = isAlreadyAdded.is_quit;
                quitPlayerId = isAlreadyAdded.quit_player_id;
            }
            let data;
            if (this.student_id === inviterId) {
                let resultText;
                let levelData = null;
                if (isQuit) {
                    if (this.student_id === quitPlayerId) {
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.left.hi : kheloJeetoData.result.left.en;
                    } else {
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.winLeft.hi : kheloJeetoData.result.winLeft.en;
                        await kheloJeetoRedis.setStudentLeaderboardScore(this.db.redis.write, 1, 1, this.student_id);
                        await kheloJeetoRedis.setStudentLeaderboardScore(this.db.redis.write, 2, 1, this.student_id);
                        levelData = await this.levelCheck();
                    }
                } else if (inviterScore > inviteeScore) {
                    // inviter won
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.win.hi : kheloJeetoData.result.win.en;
                    await kheloJeetoRedis.setStudentLeaderboardScore(this.db.redis.write, 1, 1, this.student_id);
                    await kheloJeetoRedis.setStudentLeaderboardScore(this.db.redis.write, 2, 1, this.student_id);
                    levelData = await this.levelCheck();
                } else if (inviterScore < inviteeScore) {
                    // invitee won
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.lost.hi : kheloJeetoData.result.lost.en;
                } else if (inviterScore === inviteeScore) {
                    // quiz draw
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.draw.hi : kheloJeetoData.result.draw.en;
                }
                // getting response structure
                const resultData = await this.resultSupport(levelData, topic);

                data = {
                    result_text: resultText,
                    score: inviterScore,
                    opponent_score: inviteeScore,
                    total_correct: inviterCorrectQuestions.length,
                    total_opponent_correct: inviteeCorrectQuestions.length,
                    correct_question_ids: inviterCorrectQuestions,
                    score_text: `${inviterScore}/${totalScore}`,
                    opponent_score_text: `${inviteeScore}/${totalScore}`,
                    total_correct_text: `${inviterCorrectQuestions.length}/${allQuestions.length}`,
                    opponent_total_correct_text: `${inviteeCorrectQuestions.length}/${allQuestions.length}`,
                    ...resultData,
                };
            } else {
                let resultText;
                let levelData = null;
                if (isQuit) {
                    if (this.student_id === quitPlayerId) {
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.left.hi : kheloJeetoData.result.left.en;
                    } else {
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.winLeft.hi : kheloJeetoData.result.winLeft.en;
                        await kheloJeetoRedis.setStudentLeaderboardScore(this.db.redis.write, 1, 1, this.student_id);
                        await kheloJeetoRedis.setStudentLeaderboardScore(this.db.redis.write, 2, 1, this.student_id);
                        levelData = await this.levelCheck();
                    }
                } else if (inviterScore < inviteeScore) {
                    // invitee won
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.win.hi : kheloJeetoData.result.win.en;
                    await kheloJeetoRedis.setStudentLeaderboardScore(this.db.redis.write, 1, 1, this.student_id);
                    await kheloJeetoRedis.setStudentLeaderboardScore(this.db.redis.write, 2, 1, this.student_id);
                    levelData = await this.levelCheck();
                } else if (inviterScore > inviteeScore) {
                    // inviter won
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.lost.hi : kheloJeetoData.result.lost.en;
                } else if (inviterScore === inviteeScore) {
                    // quiz draw
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.draw.hi : kheloJeetoData.result.draw.en;
                }
                // getting response structure
                const resultData = await this.resultSupport(levelData, topic);

                data = {
                    result_text: resultText,
                    score: inviteeScore,
                    opponent_score: inviterScore,
                    total_correct: inviteeCorrectQuestions.length,
                    total_opponent_correct: inviterCorrectQuestions.length,
                    correct_question_ids: inviteeCorrectQuestions,
                    score_text: `${inviteeScore}/${totalScore}`,
                    opponent_score_text: `${inviterScore}/${totalScore}`,
                    total_correct_text: `${inviteeCorrectQuestions.length}/${allQuestions.length}`,
                    opponent_total_correct_text: `${inviterCorrectQuestions.length}/${allQuestions.length}`,
                    ...resultData,
                };
            }
            const { secondaryCta, secondaryCtaDeeplink } = await this.getSecondaryResponse(topic);

            const common = {
                topic,
                total_score: totalScore,
                total_questions: allQuestions.length,
                solutions_title: this.locale === 'hi' ? kheloJeetoData.result.solutions.hi : kheloJeetoData.result.solutions.en,
                primary_cta: this.locale === 'hi' ? kheloJeetoData.result.playAgain.hi : kheloJeetoData.result.playAgain.en,
                primary_cta_deeplink: kheloJeetoData.result.playAgainDeeplink.replace('{chapterAlias}', encodeURIComponent(topic)).replace('{inviterId}', this.student_id),
                secondary_cta_1: secondaryCta,
                secondary_cta_1_deeplink: secondaryCtaDeeplink,
                secondary_cta_2: this.locale === 'hi' ? kheloJeetoData.result.goHome.hi : kheloJeetoData.result.goHome.en,
                secondary_cta_2_deeplink: kheloJeetoData.unavailable.homeCtaDeeplink,
                all_question_ids: allQuestions,
                solutions_playlist_id: kheloJeetoData.result.solutionsPlaylistId,
                correct_subtitle: this.locale === 'hi' ? kheloJeetoData.result.accuracy.hi : kheloJeetoData.result.accuracy.en,
                opponent_correct_subtitle: this.locale === 'hi' ? kheloJeetoData.result.accuracy.hi : kheloJeetoData.result.accuracy.en,
                is_result_available: isResultAvailable,
                unavailable_title: unavailableTitle,
                unavailableS_subtitle: unavailableSubtitle,
                unavailable_cta: unavailableCta,
                unavailable_deeplink: unavailableDeeplink,
            };
            return { ...common, ...data };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'result', error: errorLog });
            throw (e);
        }
    }

    async getQuizData(start, limit) {
        try {
            // get quiz history list
            const quizData = await this.mongoClient.read.collection(this.resultCollection)
                .find({ $or: [{ inviter_id: this.student_id }, { invitee_id: this.student_id }] })
                .sort({ created_at: -1 }).skip(start)
                .limit(limit)
                .toArray();
            const quizList = [];
            for (const quiz of quizData) {
                let result = null;
                let resultText = null;
                // result => 0 (lost) | 1 (won) | 2 (draw)
                if (quiz.inviter_id === this.student_id) {
                    if (quiz.is_quit) {
                        if (this.student_id === quiz.quit_player_id) {
                            result = 0;
                            resultText = this.locale === 'hi' ? kheloJeetoData.result.status.loss.hi : kheloJeetoData.result.status.loss.en;
                        } else {
                            result = 1;
                            resultText = this.locale === 'hi' ? kheloJeetoData.result.status.won.hi : kheloJeetoData.result.status.won.en;
                        }
                    } else if (quiz.inviter_score > quiz.invitee_score) {
                        result = 1;
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.status.won.hi : kheloJeetoData.result.status.won.en;
                    } else if (quiz.inviter_score < quiz.invitee_score) {
                        result = 0;
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.status.loss.hi : kheloJeetoData.result.status.loss.en;
                    } else {
                        result = 2;
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.status.draw.hi : kheloJeetoData.result.status.draw.en;
                    }
                } else {
                    console.log('Student is invitee');
                    if (quiz.is_quit) {
                        if (this.student_id === quiz.quit_player_id) {
                            result = 0;
                            resultText = this.locale === 'hi' ? kheloJeetoData.result.status.loss.hi : kheloJeetoData.result.status.loss.en;
                        } else {
                            result = 1;
                            resultText = this.locale === 'hi' ? kheloJeetoData.result.status.won.hi : kheloJeetoData.result.status.won.en;
                        }
                    } else if (quiz.invitee_score > quiz.inviter_score) {
                        result = 1;
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.status.won.hi : kheloJeetoData.result.status.won.en;
                    } else if (quiz.invitee_score < quiz.inviter_score) {
                        result = 0;
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.status.loss.hi : kheloJeetoData.result.status.loss.en;
                    } else {
                        result = 2;
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.status.draw.hi : kheloJeetoData.result.status.draw.en;
                    }
                }
                const data = {
                    title: quiz.topic,
                    result,
                    result_text: resultText,
                    deeplink: `doubtnutapp://khelo_jeeto/result?game_id=${quiz.game_id}`,
                };
                quizList.push(data);
            }
            return quizList.length ? quizList : null;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'getQuizData', error: errorLog });
            throw (e);
        }
    }

    async quizHistory() {
        try {
            const { page } = this.req.body;
            const start = page * QUIZ_HISTORY_PAGINATED_LIMIT;

            let isQuizHistoryAvailable = false;
            const quizPlayedHistory = await this.getQuizData(start, QUIZ_HISTORY_PAGINATED_LIMIT);
            if (quizPlayedHistory) {
                isQuizHistoryAvailable = true;
            }
            return {
                page: page + 1,
                is_quiz_history_available: isQuizHistoryAvailable,
                quiz_played_history: quizPlayedHistory,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'quizHistory', error: errorLog });
            throw (e);
        }
    }

    async previousResult() {
        try {
            const { game_id: gameId } = this.req.body;
            let isResultAvailable = true;
            let unavailableTitle = null;
            let unavailableSubtitle = null;
            let unavailableCta = null;
            let unavailableDeeplink = null;
            let studentRank = 0;
            let rankText = null;
            let leaderboardDeeplink = null;
            let isRankAvailable = false;
            const gameData = await this.mongoClient.read.collection(this.resultCollection).findOne({ game_id: gameId });
            if (_.isEmpty(gameData)) {
                // if game data not available, showing unavailable text
                isResultAvailable = false;
                unavailableTitle = this.locale === 'hi' ? kheloJeetoData.unavailable.title.hi : kheloJeetoData.unavailable.title.en;
                unavailableSubtitle = this.locale === 'hi' ? kheloJeetoData.unavailable.subtitle.hi : kheloJeetoData.unavailable.subtitle.en;
                unavailableCta = this.locale === 'hi' ? kheloJeetoData.unavailable.ctaText.hi : kheloJeetoData.unavailable.ctaText.en;
                unavailableDeeplink = kheloJeetoData.unavailable.homeCtaDeeplink;
            }
            const rank = await kheloJeetoRedis.getStudentLeaderboardRank(this.db.redis.read, 1, this.student_id);
            if (rank !== null) {
                studentRank = `${rank + 1}`;
                rankText = this.locale === 'hi' ? kheloJeetoData.rank.hi : kheloJeetoData.rank.en;
                leaderboardDeeplink = 'doubtnutapp://khelo_jeeto/leaderboard?active_tab_id=1';
                isRankAvailable = true;
            }
            let data;
            if (this.student_id === gameData.inviter_id) {
                let resultText;
                let description = null;
                if (gameData.is_quit) {
                    if (this.student_id === gameData.quit_player_id) {
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.lost.hi : kheloJeetoData.result.lost.en;
                        description = this.locale === 'hi' ? kheloJeetoData.result.left.hi : kheloJeetoData.result.left.en;
                    } else {
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.win.hi : kheloJeetoData.result.win.en;
                        description = this.locale === 'hi' ? kheloJeetoData.result.previousDescription.win.hi : kheloJeetoData.result.previousDescription.win.en;
                    }
                } else if (gameData.inviter_score > gameData.invitee_score) {
                    // inviter won
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.win.hi : kheloJeetoData.result.win.en;
                    description = this.locale === 'hi' ? kheloJeetoData.result.previousDescription.win.hi : kheloJeetoData.result.previousDescription.win.en;
                } else if (gameData.inviter_score < gameData.invitee_score) {
                    // invitee lost
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.lost.hi : kheloJeetoData.result.lost.en;
                    description = this.locale === 'hi' ? kheloJeetoData.result.previousDescription.lost.hi : kheloJeetoData.result.previousDescription.lost.en;
                } else if (gameData.inviter_score === gameData.invitee_score) {
                    // quiz draw
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.draw.hi : kheloJeetoData.result.draw.en;
                    description = this.locale === 'hi' ? kheloJeetoData.result.previousDescription.draw.hi : kheloJeetoData.result.previousDescription.draw.en;
                }
                data = {
                    result_text: resultText,
                    description,
                    score: gameData.inviter_score,
                    opponent_score: gameData.invitee_score,
                    name: this.locale === 'hi' ? kheloJeetoData.result.name.hi : kheloJeetoData.result.name.en,
                    opponent_name: this.locale === 'hi' ? kheloJeetoData.result.opponent_name.hi : kheloJeetoData.result.opponent_name.en,
                    total_correct: gameData.inviter_correct_questions.length,
                    total_opponent_correct: gameData.invitee_correct_questions.length,
                    rank_text: rankText,
                    rank: studentRank,
                    is_rank_available: isRankAvailable,
                    rank_deeplink: leaderboardDeeplink,
                    correct_question_ids: gameData.inviter_correct_questions,
                    score_text: `${gameData.inviter_score}/${gameData.total_score}`,
                    opponent_score_text: `${gameData.invitee_score}/${gameData.total_score}`,
                    total_correct_text: `${gameData.inviter_correct_questions.length}/${gameData.all_questions.length}`,
                    opponent_total_correct_text: `${gameData.invitee_correct_questions.length}/${gameData.all_questions.length}`,
                };
            } else {
                let resultText;
                let description = null;
                if (gameData.is_quit) {
                    if (this.student_id === gameData.quit_player_id) {
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.lost.hi : kheloJeetoData.result.lost.en;
                        description = this.locale === 'hi' ? kheloJeetoData.result.left.hi : kheloJeetoData.result.left.en;
                    } else {
                        resultText = this.locale === 'hi' ? kheloJeetoData.result.win.hi : kheloJeetoData.result.win.en;
                        description = this.locale === 'hi' ? kheloJeetoData.result.previousDescription.win.hi : kheloJeetoData.result.previousDescription.win.en;
                    }
                } else if (gameData.inviter_score < gameData.invitee_score) {
                    // invitee won
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.win.hi : kheloJeetoData.result.win.en;
                    description = this.locale === 'hi' ? kheloJeetoData.result.previousDescription.win.hi : kheloJeetoData.result.previousDescription.win.en;
                } else if (gameData.inviter_score > gameData.invitee_score) {
                    // inviter won
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.lost.hi : kheloJeetoData.result.lost.en;
                    description = this.locale === 'hi' ? kheloJeetoData.result.previousDescription.lost.hi : kheloJeetoData.result.previousDescription.lost.en;
                } else if (gameData.inviter_score === gameData.invitee_score) {
                    // quiz draw
                    resultText = this.locale === 'hi' ? kheloJeetoData.result.draw.hi : kheloJeetoData.result.draw.en;
                    description = this.locale === 'hi' ? kheloJeetoData.result.previousDescription.draw.hi : kheloJeetoData.result.previousDescription.draw.en;
                }
                data = {
                    result_text: resultText,
                    description,
                    score: gameData.invitee_score,
                    opponent_score: gameData.inviter_score,
                    name: this.locale === 'hi' ? kheloJeetoData.result.name.hi : kheloJeetoData.result.name.en,
                    opponent_name: this.locale === 'hi' ? kheloJeetoData.result.opponent_name.hi : kheloJeetoData.result.opponent_name.en,
                    total_correct: gameData.invitee_correct_questions.length,
                    total_opponent_correct: gameData.inviter_correct_questions.length,
                    rank_text: rankText,
                    rank: studentRank,
                    is_rank_available: isRankAvailable,
                    rank_deeplink: leaderboardDeeplink,
                    correct_question_ids: gameData.invitee_correct_questions,
                    score_text: `${gameData.invitee_score}/${gameData.total_score}`,
                    opponent_score_text: `${gameData.inviter_score}/${gameData.total_score}`,
                    total_correct_text: `${gameData.invitee_correct_questions.length}/${gameData.all_questions.length}`,
                    opponent_total_correct_text: `${gameData.inviter_correct_questions.length}/${gameData.all_questions.length}`,
                };
            }

            const { secondaryCta, secondaryCtaDeeplink } = await this.getSecondaryResponse(gameData.topic);
            const common = {
                topic: gameData.topic,
                total_score: gameData.total_score,
                total_questions: gameData.all_questions.length,
                solutions_title: this.locale === 'hi' ? kheloJeetoData.result.solutions.hi : kheloJeetoData.result.solutions.en,
                primary_cta: this.locale === 'hi' ? kheloJeetoData.result.playAgain.hi : kheloJeetoData.result.playAgain.en,
                primary_cta_deeplink: kheloJeetoData.result.playAgainDeeplink.replace('{chapterAlias}', encodeURIComponent(gameData.topic)).replace('{inviterId}', this.student_id),
                secondary_cta_1: secondaryCta,
                secondary_cta_1_deeplink: secondaryCtaDeeplink,
                secondary_cta_2: this.locale === 'hi' ? kheloJeetoData.result.goHome.hi : kheloJeetoData.result.goHome.en,
                secondary_cta_2_deeplink: kheloJeetoData.unavailable.homeCtaDeeplink,
                all_question_ids: gameData.all_questions,
                solutions_playlist_id: kheloJeetoData.result.solutionsPlaylistId,
                correct_subtitle: this.locale === 'hi' ? kheloJeetoData.result.accuracy.hi : kheloJeetoData.result.accuracy.en,
                opponent_correct_subtitle: this.locale === 'hi' ? kheloJeetoData.result.accuracy.hi : kheloJeetoData.result.accuracy.en,
                is_result_available: isResultAvailable,
                unavailable_title: unavailableTitle,
                unavailableS_subtitle: unavailableSubtitle,
                unavailable_cta: unavailableCta,
                unavailable_deeplink: unavailableDeeplink,
            };
            return { ...common, ...data };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'previousResult', error: errorLog });
            throw (e);
        }
    }

    async getRandomTopic() {
        let randomTopic = null;
        const topics = await this.mongoClient.read.collection(this.availableChapterCollection).aggregate([{ $sample: { size: 1 } }]).toArray();
        if (!_.isEmpty(topics)) {
            randomTopic = topics[0].chapter;
        }
        return randomTopic;
    }

    async generateGameId() {
        try {
            const gameId = `kjsg-${uuid()}`;
            const chapterAlias = await this.getRandomTopic();
            if (!chapterAlias) {
                // No Master chapter alias found error
                return { message: 'No Chapter Alias Found', game_id: null, can_game_start: false };
            }
            const { invitee_id: inviteeId } = this.req.body;
            const totalQuestionsForQuiz = 5;
            const expiry = 30;
            this.maxScorePerQues = 20;
            this.minScorePerQues = 10;
            const botData = null;
            const botMessages = null;
            const botEmoji = null;
            // checking for quiz questions from redis first
            let questionData = await redisLibrairy.getByKey(`KJ_TOPIC_${chapterAlias}`, redisClient);
            if (questionData) {
                // redis key available, parsing json
                questionData = JSON.parse(questionData);
            } else {
                // not found questions from redis, querying from db
                questionData = await kheloJeetoMysql.getQuestionsByChapter(this.db.mysql.read, chapterAlias);
                if (!questionData.length && questionData.length < totalQuestionsForQuiz) {
                    // No Master chapter alias found error
                    return { message: 'No Chapter Alias Found', game_id: null, can_game_start: false };
                }
                const uniqueQuestionData = _.uniqBy(questionData, 'question_text');
                if (uniqueQuestionData.length >= totalQuestionsForQuiz) {
                    questionData = uniqueQuestionData;
                }
                // creating cache as questions data found from SQL
                await redisLibrairy.setByKey(`KJ_TOPIC_${chapterAlias}`, questionData, 30 * 86400, redisClient);
            }
            RedisUtil.sadd(this.db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', this.student_id);
            const studentData = await this.mongoClient.read.collection(this.studentRewardCollection).findOne({ student_id: this.student_id });
            let level;
            if (studentData) {
                level = studentData.level;
                if (studentData.level === 100 && studentData.current_level_wins >= studentData.current_total_games) {
                    level = 101;
                }
            }
            this.setScoreRangeWithCurrentLevel(level);
            let targetScore = _.random(this.minBotScore, this.maxBotScore);
            if (targetScore % 2 != 0) { // target score cannot be odd
                ++targetScore;
            }
            const correctAns = this.getNumberOfCorrectAns(targetScore);
            const multiplier = 2;

            let responseFormat = _.map(dexterController.getRandomQuestions(questionData, totalQuestionsForQuiz), (question) => ({
                class: question.class,
                subject: question.subject,
                chapter: question.chapter,
                question_id: question.question_id,
                question_text: question.question_text,
                options: [question.opt_1, question.opt_2, question.opt_3, question.opt_4],
                answer: question.answer.toUpperCase(),
                base_score: 10,
                max_score: 20,
                expire: (['mathematics', 'maths'].includes(question.subject.toLowerCase()) ? 60 : expiry),
                solutions_playlist_id: 453978,
                bot_meta: this.getWrongBotAnswers(question, expiry, targetScore),
                multiplier,
                fraction: ['mathematics', 'maths'].includes(question.subject.toLowerCase()) ? 10 : 5,
                bot_messages: this.getRandomMessagesAndEmoji('message', 30),
                bot_emoji: this.getRandomMessagesAndEmoji('emoji', 30),
            }));
            const botScores = this.getBotScoresArray(targetScore, correctAns);
            const fraction = ['mathematics', 'maths'].includes(responseFormat[0].subject.toLowerCase()) ? 10 : 5;
            if (!_.isEmpty(botScores)) {
                responseFormat = this.setBotCorrectAnswers(responseFormat, correctAns, botScores, fraction, multiplier);
            }

            responseFormat = this.shuffleBotAnswers(responseFormat);
            const chatActions = {
                messages: this.locale === 'hi' ? kheloJeetoData.chatActions.messages.hi : kheloJeetoData.chatActions.messages.hien,
                emoji: kheloJeetoData.chatActions.emoji,
            };

            // real user is invited
            this.notificationToInvitee(inviteeId, chapterAlias, gameId);
            const cachedData = { questions: responseFormat, topic: chapterAlias };
            await redisLibrairy.setByKey(gameId, cachedData, TOTAL_MINS_FOR_QUES_CACHE, redisClient);
            const waitStatus = this.locale === 'hi' ? kheloJeetoData.loadingScreen.status.hi : kheloJeetoData.loadingScreen.status.en;
            const opponentFound = this.locale === 'hi' ? kheloJeetoData.loadingScreen.foundTitle.hi : kheloJeetoData.loadingScreen.foundTitle.en;
            kheloJeetoRedis.setRecentTopics(redisClient, this.student_id, chapterAlias);
            // dexterController.createPost(this.student_id, questionData[0].question_id, chapterAlias, this.db, `doubtnutapp://khelo_jeeto_game?qid=${questionData[0].question_id}`);
            const unavailableTitle = (this.locale === 'hi' ? kheloJeetoData.acceptInvite.inviteeNotJoined.title.hi : kheloJeetoData.acceptInvite.inviteeNotJoined.title.en);
            const unavailableCtaText = this.locale === 'hi' ? kheloJeetoData.acceptInvite.inviteeNotJoined.cta.hi : kheloJeetoData.acceptInvite.inviteeNotJoined.cta.en;
            const unavailableDeeplink = kheloJeetoData.unavailable.ctaDeeplink.replace('{chapterAlias}', chapterAlias).replace('{inviterId}', this.student_id);
            return {
                game_id: gameId,
                questions: responseFormat,
                chat_actions: chatActions,
                message: 'successful',
                topic: chapterAlias,
                bot_data: botData,
                bot_messages: botMessages,
                bot_emoji: botEmoji,
                music_url: kheloJeetoData.musicUrl,
                loading_screen_container: {
                    wait_title: this.locale === 'hi' ? kheloJeetoData.loadingScreen.title.hi : kheloJeetoData.loadingScreen.title.en,
                    status_text: waitStatus,
                    waiting_time: 60000,
                    opponent_found: opponentFound,
                },
                unavailable_container: {
                    title: unavailableTitle, cta_text: unavailableCtaText, deeplink: unavailableDeeplink,
                },
                deeplink_for_invitee: `doubtnutapp://khelo_jeeto/wait?game_id=${gameId}&inviter=${this.student_id}&chapter_alias=${chapterAlias}`,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'KheloJeetoHelper', source: 'generateGameId', error: errorLog });
            throw (e);
        }
    }
}

module.exports = KheloJeetoManager;
