/**
 * This is a helper file of quiz notifications module,
 * has class based architecure to get next required notifications
 * data for doubtnut android app.
 * PRD: https://docs.google.com/spreadsheets/d/1q3Kshj8HRYXHu-K748YULCq07FtoQhA4D5S32V591H8
 * @constructor
 */
const moment = require('moment');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const quizNotificationsMysql = require('../../../modules/mysql/quiz_notifications');
const redisClient = require('../../../config/redis');
const redisLibrairy = require('../../../modules/redis/library');
const logger = require('../../../config/winston').winstonLogger;
const cdnUrl = require('../../helpers/buildStaticCdnUrl');
const QuestionContainer = require('../../../modules/containers/question');
const StudentContainer = require('../../../modules/containers/student');
const quizNotificationContainer = require('../../../modules/containers/quizNotification');
const CcmContainer = require('../../../modules/containers/ClassCourseMapping');

class QuizNotifications {
    constructor(studentClass, studentId, locale, db, config, mongoClient, req, notificationData, currentDay, completeDB = null) {
        this.db = db;
        this.config = config;
        this.locale = locale;
        this.mongoClient = mongoClient;
        this.req = req;
        this.notificationData = notificationData;
        this.currentDay = currentDay;
        this.completeDB = completeDB;
        if (studentClass === '13') {
            this.student_class = '12';
        } else {
            this.student_class = studentClass;
        }
        this.getHeadingLocalized = function (index) {
            if (this.locale === 'hi') {
                return this.notificationData[index].heading_hi || this.notificationData[index].heading;
            }
            return this.notificationData[index].heading;
        };
        this.index = function (notification) {
            return this.notificationData.findIndex((p) => p.notification.trim().toLowerCase() === notification);
        };
        this.student_id = studentId;
        // doubtnut common logo to be shown on each notification popup
        this.logo = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BAB19F80-76DF-9E93-E436-E45B58A67096.webp';
        this.common_overlay_image = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1BBA82AE-C576-11B7-A9D8-B64BB7EC6E98.webp';
        this.default_avatar = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/AE3F2CA8-1307-32E6-056E-217F23E16AF3.webp';
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();
        this.expiryMillis = moment().set('hour', 23).set('minute', 59).subtract(5, 'hours')
            .subtract(30, 'minutes')
            .toDate()
            .getTime();
        this.isNewUser = (installedTime) => moment().add(5, 'hours').add(30, 'minutes').diff(moment(installedTime), 'hours') < 24;
    }

    async referAndEarn() {
        try {
            const type = 'quiz_post';
            let heading;
            let thumbnailLink;
            let buttonText;
            let deeplink;
            const headingIcon = this.logo;
            const isSkipable = true;
            const ocrText = '';
            const getReferEarnData = await quizNotificationsMysql.getReferEarnData(this.student_id, this.db);
            if (getReferEarnData.length && !getReferEarnData[0].payment_info_id && getReferEarnData[0].referrer_student_id && getReferEarnData[0].referrer_student_id % 2 == 0) {
                heading = (this.locale === 'hi' ? '₹150 रूपए की तत्काल छूट आपके पसंदीदा कोर्स पे।' : 'Rs 150 ka tatkal discount apke pasandeeda course pe!');
                thumbnailLink = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/paytm_referral_home_page_new.webp';
                buttonText = 'COURSES DEKHE';
                deeplink = 'doubtnutapp://course_details?id=xxxx';
            } else {
                heading = (this.locale === 'hi' ? 'दोस्त लाओ पैसे कमाओ' : 'Dost lao, Paise kamao');
                thumbnailLink = this.student_id % 2 == 0 ? 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/paytm_referral_cash_prize_banner.webp' : '   https://d10lpgp6xz60nq.cloudfront.net/images/share_20210308.webp';
                buttonText = 'SHARE';
                deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://doubtnut.com/referral?sid=${this.student_id}`;
            }
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                ocr_text: ocrText,
                deeplink,
                overlay_image: this.common_overlay_image,
                expiry_millis: this.expiryMillis,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'referAndEarn', error: errorLog });
            return false;
        }
    }

    async checkCronData() {
        try {
            const dt = moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD');
            const notificationDate = new Date(`${dt}T00:00:00.000+00:00`);
            let parsedData = await this.mongoClient.collection('temp_popup_notification').findOne({ student_id: this.student_id, notification_date: notificationDate });
            if (!parsedData) {
                const ccm = await CcmContainer.getStudentCcmIds(this.completeDB, this.student_id);
                if (ccm.length) {
                    parsedData = await this.mongoClient.collection('temp_popup_notification').findOne({ ccm_id: ccm[0], notification_date: notificationDate });
                }
                // in case if still no campaigns set, look for class based campaign (major level)
                if (!parsedData) {
                    parsedData = await this.mongoClient.collection('temp_popup_notification').findOne({ student_class: parseInt(this.student_class), notification_date: notificationDate });
                }
            }
            return await this.getCronData(parsedData);
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'checkCronData', error: errorLog });
            return false;
        }
    }

    async getCronData(data) {
        try {
            if (!data) {
                return false;
            }
            const popupData = await this.mongoClient.collection('popup_notification').findOne({ _id: ObjectID(data.popup_id) });
            return {
                type: 'quiz_post',
                heading: (this.locale === 'hi' ? popupData.heading_hi : popupData.heading),
                heading_icon: popupData.logo_url,
                thumbnail_link: popupData.thumbnail_url,
                button_text: popupData.cta_text,
                title: '',
                is_skipable: true,
                ocr_text: '',
                subtitle: '',
                deeplink: popupData.deeplink,
                overlay_image: this.common_overlay_image,
                expiry_millis: this.expiryMillis,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getCronData', error: errorLog });
            return false;
        }
    }

    async getTrendingVideo() {
        /**
         * This method provides most trending video for the student.
         * @param {student_id} [integer]
         * @return json of the result of most trending video.
         */
        try {
            const ccm = await CcmContainer.getStudentCcmIds(this.completeDB, this.student_id);
            const trendingVideoQuesId = await redisLibrairy.getByKey(`trending_video_for_${ccm[0]}`, redisClient);
            if (!trendingVideoQuesId) {
                console.error(`redis key not found for trending_video_for_${ccm[0]}`);
                return false;
            }
            const index = this.index('gettrendingvideo');
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(trendingVideoQuesId, 'webp');
            const buttonText = this.notificationData[index].button_text;
            const { title } = this.notificationData[index];
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = QuizNotifications.getDeeplinkForQuestion(trendingVideoQuesId);
            // let ocrText = await quizNotificationsMysql.getOcrText(trendingVideoQuesId, this.db);
            let ocrText;
            if (this.completeDB) {
                ocrText = await QuestionContainer.getByQuestionId(trendingVideoQuesId, this.completeDB);
            } else {
                ocrText = await quizNotificationsMysql.getOcrText(trendingVideoQuesId, this.db);
            }
            ocrText = ocrText[0].ocr_text;
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                title,
                is_skipable: isSkipable,
                ocr_text: ocrText,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getTrendingVideo', error: errorLog });
            return false;
        }
    }

    async getTrendingQuestion() {
        /**
         * This method provides most trending question video for the student.
         * @param {student_id} [integer]
         * @return json of the result of most trending question video.
         */
        try {
            const ccm = await CcmContainer.getStudentCcmIds(this.completeDB, this.student_id);

            const trendingQuesId = await redisLibrairy.getByKey(`trending_ques_for_${ccm[0]}`, redisClient);
            if (!trendingQuesId) {
                console.error(`redis key not found for trending_ques_for_${ccm[0]}`);
                return false;
            }
            const index = this.notificationData.findIndex((p) => p.notification.trim().toLowerCase() === 'gettrendingquestion');
            const type = this.notificationData[index].notification_type;
            const heading = (this.locale === 'hi' ? this.notificationData[index].heading_hi : this.notificationData[index].heading);
            const headingIcon = this.logo;
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(trendingQuesId, 'webp');
            const buttonText = this.notificationData[index].button_text;
            const { title } = this.notificationData[index];
            const { subtitle } = this.notificationData[index];
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            // let ocrText = await quizNotificationsMysql.getOcrText(trendingQuesId, this.db);
            let ocrText;
            if (this.completeDB) {
                ocrText = await QuestionContainer.getByQuestionId(trendingQuesId, this.completeDB);
            } else {
                ocrText = await quizNotificationsMysql.getOcrText(trendingQuesId, this.db);
            }
            ocrText = ocrText[0].ocr_text;
            const deeplink = QuizNotifications.getDeeplinkForQuestion(trendingQuesId);
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                title,
                subtitle,
                ocr_text: ocrText,
                is_skipable: isSkipable,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getTrendingQuestion', error: errorLog });
            return false;
        }
    }

    async getQuizWinners() {
        try {
            const yesterdayDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
            const fromTime = `${yesterdayDate} 20:00:00`;
            const toTime = `${yesterdayDate} 20:30:00`;
            const getQuizWinners = await quizNotificationsMysql.getQuizWinners(this.student_class, fromTime, toTime, this.db);
            const totalWinnersFound = getQuizWinners.length;
            if (totalWinnersFound < 3) {
                console.error('get quiz winners can not be completed for ', this.student_class, fromTime, toTime);
                return false;
            }
            const index = this.notificationData.findIndex((p) => p.notification.trim().toLowerCase() === 'getquizwinners');
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = 'https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/66073170.webp';
            const buttonText = this.notificationData[index].button_text;
            const { title } = this.notificationData[index];
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = 'doubtnutapp://quiz';
            const profiles = [];
            for (let i = 0; i < totalWinnersFound; i++) {
                profiles.push({
                    profile_url: (getQuizWinners[i].img_url == null ? this.default_avatar : getQuizWinners[i].img_url),
                    name: `${getQuizWinners[i].student_fname} ${getQuizWinners[i].student_lname}`.replace(/\n/g, '').trim(),
                    points: getQuizWinners[i].eligiblescore,
                });
            }
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                title,
                is_skipable: isSkipable,
                deeplink,
                profiles,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getQuizWinners', error: errorLog });
            return false;
        }
    }

    async getTrendingGame() {
        try {
            const index = this.index('gettrendinggame');
            const type = this.notificationData[index].notification_type;
            const getTrendingGame = await quizNotificationsMysql.getTrendingGame(this.db);
            const thumbnailLink = getTrendingGame[0].profile_image;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const buttonText = this.notificationData[index].button_text;
            const { title } = getTrendingGame[0];
            const { subtitle } = this.notificationData[index];
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = `doubtnutapp://games?game_title=${getTrendingGame[0].title}&game_url=${getTrendingGame[0].fallback_url}`;
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                title,
                subtitle,
                is_skipable: isSkipable,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getTrendingGame', error: errorLog });
            return false;
        }
    }

    getTrendingWord() {
        try {
            const index = this.index('gettrendingword');
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/A765757E-AD9B-A3BF-67A0-85D51B65559D.webp';
            const buttonText = this.notificationData[index].button_text;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = 'doubtnutapp://quiz';
            const { title } = this.notificationData[index];
            const secondaryDeeplink = QuizNotifications.getDeeplinkForQuestion(355416426);
            const ocrText = '';
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                deeplink,
                title,
                secondary_deeplink: secondaryDeeplink,
                ocr_text: ocrText,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getTrendingWord', error: errorLog });
            return false;
        }
    }

    async getTrendingFeedPost() {
        try {
            const index = this.index('gettrendingfeedpost');
            const type = this.notificationData[index].notification_type;
            const postDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
            const getFeedPost = await quizNotificationsMysql.getTrendingFeedPost(postDate, this.student_class, this.db);
            if (!getFeedPost.length) {
                return false;
            }
            // let ocrText = await quizNotificationsMysql.getOcrText(getFeedPost[0].question_id, this.db);
            let ocrText;
            if (this.completeDB) {
                ocrText = await QuestionContainer.getByQuestionId(getFeedPost[0].question_id, this.completeDB);
            } else {
                ocrText = await quizNotificationsMysql.getOcrText(getFeedPost[0].question_id, this.db);
            }
            ocrText = ocrText[0].ocr_text;
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(getFeedPost[0].question_id, 'webp');
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const buttonText = this.notificationData[index].button_text;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = QuizNotifications.getDeeplinkForQuestion(getFeedPost[0].question_id);
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                ocr_text: ocrText,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getTrendingFeedPost', error: errorLog });
            return false;
        }
    }

    async getMissedTrendingLiveClass() {
        try {
            const index = this.index('getmissedtrendingliveclass');
            const postDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
            const trendingLiveClass = await quizNotificationsMysql.getTrendingLiveClass(this.student_class, postDate, this.db);
            const isWatched = await quizNotificationsMysql.isTrendingClassMissed(trendingLiveClass[0].question_id, this.student_id, this.db);
            if (isWatched[0].watched === 1) {
                return false;
            }
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(trendingLiveClass[0].question_id, 'webp');
            const buttonText = this.notificationData[index].button_text;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            // let ocrText = await quizNotificationsMysql.getOcrText(trendingLiveClass[0].question_id, this.db);
            let ocrText;
            if (this.completeDB) {
                ocrText = await QuestionContainer.getByQuestionId(trendingLiveClass[0].question_id, this.completeDB);
            } else {
                ocrText = await quizNotificationsMysql.getOcrText(trendingLiveClass[0].question_id, this.db);
            }
            ocrText = ocrText[0].ocr_text;
            const deeplink = QuizNotifications.getDeeplinkForQuestion(trendingLiveClass[0].question_id);
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                deeplink,
                ocr_text: ocrText,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getMissedTrendingLiveClass', error: errorLog });
            return false;
        }
    }

    async getPlaylistBasisLastWatched() {
        try {
            const index = this.index('getplaylistbasislastwatched');
            const type = this.notificationData[index].notification_type;
            const lastWatchedVideo = await quizNotificationsMysql.getLastWatchedVideo(this.student_id, this.db);
            if (!lastWatchedVideo.length) {
                console.log(`user ${this.student_id} has no watch history`);
                return false;
            }
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(lastWatchedVideo[0].question_id, 'webp');
            const buttonText = this.notificationData[index].button_text;
            const { title } = this.notificationData[index];
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            // let ocrText = await quizNotificationsMysql.getOcrText(lastWatchedVideo[0].question_id, this.db);
            let ocrText;
            if (this.completeDB) {
                ocrText = await QuestionContainer.getByQuestionId(lastWatchedVideo[0].question_id, this.completeDB);
            } else {
                ocrText = await quizNotificationsMysql.getOcrText(lastWatchedVideo[0].question_id, this.db);
            }
            ocrText = ocrText[0].ocr_text;
            const deeplink = QuizNotifications.getDeeplinkForQuestion(lastWatchedVideo[0].question_id);
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                title,
                is_skipable: isSkipable,
                deeplink,
                ocr_text: ocrText,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getPlaylistBasisLastWatched', error: errorLog });
            return false;
        }
    }

    async getNCERTPlaylistOfClass() {
        try {
            const index = this.index('getncertplaylistofclass');
            const type = this.notificationData[index].notification_type;
            const key = `ncert_playlist_for_${this.student_class}`;
            const ncertPlaylistQuesData = await redisLibrairy.getByKey(key, redisClient);
            const ncertParsedData = JSON.parse(ncertPlaylistQuesData);
            if (!ncertPlaylistQuesData) {
                console.error('redis key not found for ncert quiz ', this.student_class);
                return false;
            }
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(ncertParsedData.question_id, 'png');
            const buttonText = this.notificationData[index].button_text;
            const title = ncertParsedData.chapter;
            const subtitle = ncertParsedData.subject;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            // let ocrText = await quizNotificationsMysql.getOcrText(ncertParsedData.question_id, this.db);
            let ocrText;
            if (this.completeDB) {
                ocrText = await QuestionContainer.getByQuestionId(ncertParsedData.question_id, this.completeDB);
            } else {
                ocrText = await quizNotificationsMysql.getOcrText(ncertParsedData.question_id, this.db);
            }
            ocrText = ocrText[0].ocr_text;
            const overlayImage = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BCCDEAD9-3DF0-4866-8F74-1CCFBA729959.webp';
            const deeplink = QuizNotifications.getDeeplinkForQuestion(ncertParsedData.question_id);
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                title,
                subtitle,
                is_skipable: isSkipable,
                deeplink,
                ocr_text: ocrText,
                overlay_image: overlayImage,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getNCERTPlaylistOfClass', error: errorLog });
            return false;
        }
    }

    async getFirstQuesFromQuiz() {
        try {
            const index = this.index('getfirstquesfromquiz');
            const type = this.notificationData[index].notification_type;
            const upcomingTestId = await quizNotificationsMysql.getUpcomingTestId(this.student_class, this.db);
            const questionBank = await quizNotificationsMysql.getQuestionByTestId(upcomingTestId[0].test_id, this.db);
            const optionsData = await quizNotificationsMysql.getQuizOptions(questionBank[0].questionbank_id, this.db);
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const buttonText = this.notificationData[index].button_text;
            const question = questionBank[0].question_text;
            const options = [];
            optionsData.forEach((value) => {
                options.push(value.title);
            });
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = 'doubtnutapp://quiz';
            return {
                type,
                heading,
                heading_icon: headingIcon,
                button_text: buttonText,
                question,
                options,
                is_skipable: isSkipable,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getFirstQuesFromQuiz', error: errorLog });
            return false;
        }
    }

    async getMotivationalVideoOfDay() {
        try {
            const index = this.index('getmotivationalvideoofday');
            const getMotivationalVideo = await quizNotificationsMysql.getMotivationalVideo(this.db);
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(getMotivationalVideo[0].question_id, 'webp');
            const deeplink = QuizNotifications.getDeeplinkForQuestion(getMotivationalVideo[0].question_id);
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const buttonText = this.notificationData[index].button_text;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const ocrText = getMotivationalVideo[0].ocr_text;
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                ocr_text: ocrText,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getMotivationalVideoOfDay', error: errorLog });
            return false;
        }
    }

    async getLatestFromDN() {
        try {
            const getLwd = await quizNotificationsMysql.getLFD(this.student_class, this.db);
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(getLwd[0].question_id, 'webp');
            const type = 'quiz_explore';
            const heading = 'Ye nya aya hai app me';
            const headingIcon = this.logo;
            const buttonText = 'EXPLORE NOW';
            const title = 'Ab ap kr skte apne dosto se discuss apne doubts, doubtnut chat k sath';
            const isSkipable = true;
            const ocrText = getLwd[0].ocr_text;
            const deeplink = 'doubtnutapp://group_chat';
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                title,
                ocr_text: ocrText,
                is_skipable: isSkipable,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getLatestFromDN', error: errorLog });
            return false;
        }
    }

    async getPrepareTargetExam() {
        try {
            let targetExamQuestionId;
            if (parseInt(this.student_class) >= 6 <= 10) {
                targetExamQuestionId = await quizNotificationsMysql.getToppersVideo(this.db);
            } else {
                const jeeId = (this.locale === 'hi' ? '-69' : '3');
                targetExamQuestionId = await quizNotificationsMysql.getJeeVideo(jeeId, this.db);
            }
            const index = this.index('getpreparetargetexam');
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(targetExamQuestionId[0].question_id, 'webp');
            const deeplink = QuizNotifications.getDeeplinkForQuestion(targetExamQuestionId[0].question_id);
            const type = this.notificationData[index].notification_type;
            const ocrText = targetExamQuestionId[0].ocr_text;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const buttonText = this.notificationData[index].button_text;
            const { title } = this.notificationData[index];
            const { subtitle } = this.notificationData[index];
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                title,
                ocr_text: ocrText,
                subtitle,
                is_skipable: isSkipable,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getPrepareTargetExam', error: errorLog });
            return false;
        }
    }

    getAskQuestion() {
        try {
            const index = this.index('getaskquestion');
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const buttonText = this.notificationData[index].button_text;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const title = (this.locale === 'hi' ? this.notificationData[index].title_hi : this.notificationData[index].title);
            const { subtitle } = this.notificationData[index];
            const deeplink = 'doubtnutapp://camera';
            const images = [cdnUrl.buildStaticCdnUrl('https://d10lpgp6xz60nq.cloudfront.net/images/upload_5168_1605332167.png'), cdnUrl.buildStaticCdnUrl('https://d10lpgp6xz60nq.cloudfront.net/images/upload_5773_1597579238.png'), cdnUrl.buildStaticCdnUrl('https://d10lpgp6xz60nq.cloudfront.net/images/upload_5520_1615299853.png'), cdnUrl.buildStaticCdnUrl('https://d10lpgp6xz60nq.cloudfront.net/images/upload_66450637_1612864668.png'), cdnUrl.buildStaticCdnUrl('https://d10lpgp6xz60nq.cloudfront.net/images/upload_66449601_1612864977.png')];
            return {
                type,
                heading,
                heading_icon: headingIcon,
                button_text: buttonText,
                is_skipable: isSkipable,
                title,
                subtitle,
                deeplink,
                images,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getAskQuestion', error: errorLog });
            return false;
        }
    }

    downloadPreviousPapers() {
        const type = 'quiz_subject';
        const heading = 'Download Previous Year Papers';
        const headingIcon = this.logo;
        const thumbnailLink = 'https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/66073170.webp';
        const buttonText = 'Watch now';
        const title = 'Download Previous Year Papers';
        const subtitle = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai';
        const isSkipable = true;
        const deeplink = 'https://doubtnut.app.link/1BZZfkBdcdb';
        const subjectArray = [
            {
                icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/upload_66272205_1612803078.png',
                name: 'English',
            },
            {
                icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/upload_66272205_1612803078.png',
                name: 'Hindi',
            },
            {
                icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/upload_66272205_1612803078.png',
                name: 'Maths',
            },
        ];
        return {
            type,
            heading,
            heading_icon: headingIcon,
            thumbnail_link: thumbnailLink,
            button_text: buttonText,
            title,
            subtitle,
            is_skipable: isSkipable,
            deeplink,
            subject_array: subjectArray,
        };
    }

    async getTrickyVideoOfDay() {
        try {
            const index = this.index('gettrickyvideoofday');
            const trickyVideo = await quizNotificationsMysql.getTrickyVideo(this.student_class, this.db);
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = QuizNotifications.getThumbnailOfQuestion(trickyVideo[0].matched_question, 'webp');
            const buttonText = this.notificationData[index].button_text;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const ocrText = trickyVideo[0].ocr_text;
            const deeplink = QuizNotifications.getDeeplinkForQuestion(trickyVideo[0].question_id);
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                ocr_text: ocrText,
                is_skipable: isSkipable,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getTrickyVideoOfDay', error: errorLog });
            return false;
        }
    }

    async getAttendanceReward() {
        try {
            const index = this.index('getdailyattendancereward');
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CFF9F34C-7081-9ACE-AD93-8514D891F2AC.webp';
            const buttonText = this.notificationData[index].button_text;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = 'doubtnutapp://rewards';
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getAttendanceReward', error: errorLog });
            return false;
        }
    }

    async getWhatsappQuizNotification() {
        try {
            const index = this.index('getwhatsappquiznotification');
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = this.locale === 'hi' ? 'https://d10lpgp6xz60nq.cloudfront.net/images/2021_11_13_wa_QA_publicity_hi.webp' : 'https://d10lpgp6xz60nq.cloudfront.net/images/2021_11_13_wa_QA_publicity_en.webp';
            const buttonText = this.locale === 'hi' ? 'एक प्रश्न पूछेंं' : this.notificationData[index].button_text;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = 'doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=Hi';
            const title = this.locale === 'hi' ? this.notificationData[index].title_hi : this.notificationData[index].title;
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                title,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getWhatsappQuizNotification', error: errorLog });
            return false;
        }
    }

    async getDNRQuizNotification() {
        try {
            const index = this.index('getdnrquiznotification');
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B1A1149D-F004-6FBD-CAD2-88215E16C158.webp';
            const buttonText = 'Explore DNR';
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = 'doubtnutapp://dnr/home';
            const title = 'Doubtnut Rupya aka DNR';
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                title,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getDNRQuizNotification', error: errorLog });
            return false;
        }
    }

    async getRecommendedCourse() {
        try {
            const index = this.index('getrecommendedcourse');
            const type = this.notificationData[index].notification_type;
            const heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            const thumbnailLink = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BD52C056-1DA4-96E5-759C-B5AE34A27B28.webp';
            const buttonText = this.notificationData[index].button_text;
            const isSkipable = Boolean(this.notificationData[index].is_skipable);
            const deeplink = 'doubtnutapp://course_explore';
            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getRecommendedCourse', error: errorLog });
            return false;
        }
    }

    async getQuizKheleNotification() {
        try {
            const index = this.index('getquizkhelenotification');
            const type = this.notificationData[index].notification_type;
            let heading = this.getHeadingLocalized(index);
            const headingIcon = this.logo;
            let isSkipable = Boolean(this.notificationData[index].is_skipable);
            let thumbnailLink = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/822530B1-B768-353B-5DEE-4F519F12D8AC.webp';
            let buttonText = 'Abhi Quiz Khelen!';
            let deeplink = 'doubtnutapp://library_tab?tag=daily_quiz';
            let title = 'Daily Quiz';
            let notificationData = null;
            if (this.student_id % 2 == 0 && this.student_class <= 14 && this.student_class >= 9) {
                const ccmIds = await StudentContainer.getStudentCcmIds(this.completeDB, this.student_id);
                notificationData = await quizNotificationContainer.getNotificationData(this.completeDB, ccmIds, 12);
                if (!_.isEmpty(notificationData)) {
                    const extraParams = JSON.parse(notificationData.extra_params);
                    thumbnailLink = `${notificationData.banner_url}?sid=${this.student_id}&screen=quiz_popup&campaign=oswal_adv_campaign`;
                    buttonText = extraParams.button_text ? extraParams.button_text : 'Abhi Quiz Khelen!';
                    heading = extraParams.title ? extraParams.title : 'Daily Quiz';
                    deeplink = notificationData.deeplink;
                    isSkipable = false;
                    title = heading;
                }
            }
            if (this.student_id % 2 == 1 || _.isEmpty(notificationData)) {
                this.currentDay -= 2;
                notificationData = await quizNotificationContainer.getNotificationDefaultData(this.completeDB, this.currentDay);
                if (!_.isEmpty(notificationData)) {
                    thumbnailLink = notificationData.thumbnail;
                    buttonText = notificationData.button_text;
                    heading = notificationData.title;
                    title = heading;
                    deeplink = notificationData.deeplink;
                    isSkipable = notificationData.is_skippable;
                }
            }

            return {
                type,
                heading,
                heading_icon: headingIcon,
                thumbnail_link: thumbnailLink,
                button_text: buttonText,
                is_skipable: isSkipable,
                title,
                deeplink,
                overlay_image: this.common_overlay_image,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'quiz_notifications', source: 'getquizkhelenotification', error: errorLog });
            return false;
        }
    }

    static getThumbnailOfQuestion(questionId, format) {
        return `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${questionId}.${format}`;
    }

    static getDeeplinkForQuestion(questionId) {
        return `doubtnutapp://video?qid=${questionId}&page=QUIZ_NOTIFICATION`;
    }
}

module.exports = QuizNotifications;
