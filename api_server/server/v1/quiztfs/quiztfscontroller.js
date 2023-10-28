const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');

const QuizTfsRedis = require('../../../modules/redis/QuizTfs');
const QuizTfsMysql = require('../../../modules/mysql/QuizTfs');
const config = require('./config');
require('../../../modules/mongo/QuizTfs');
const Reward = require('./reward.helper');
const NotificationsController = require('./quiztfsnotifications');
// change DAYOFQUIZSTART
// const DAYOFQUIZSTART = '2021-08-17 00:00:00';
// const practiceEnglishUtils = require('../practiceEnglish/practiceEnglish.utils');
const PracticeEnglishMySql = require('../../../modules/mysql/practiceEnglish');
const QuiztfsUtility = require('./quiztfs.utility');

async function saveStudentSpecificCoupon(db, student_id, coupon_code, value) {
    const couponData1 = ['24x7 Quiz Reward', `${value}% off from Quiz War`, coupon_code, 'percent', value, 3, 1, 'rewards', 754, 10000, 1, 1, 5000, 0];
    const sql = 'INSERT INTO `coupons_new`(`title`, `description`, `coupon_code`, `start_date`, `value_type`, `value`, `is_show`, `is_active`,`created_by`, `min_version_code`, `max_version_code`, `limit_per_student`, `claim_limit`, `max_limit`, `ignore_min_limit`,`end_date`) VALUES (?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,DATE_ADD(CURRENT_TIME,INTERVAL 7 day))';
    db.mysql.write.query(sql, couponData1);

    const sql2 = 'INSERT INTO coupon_applicability(`coupon_code`,`type`,`value`) VALUES(?,?,?) ';
    db.mysql.write.query(sql2, [coupon_code, 'specific', student_id]);
}

async function getLandingDetails(req, res) {
    try {
        const db = req.app.get('db');
        const studentId = req.user.student_id;
        const appConfig = req.app.get('config');
        const { locale } = req.user;
        const { version_code } = req.headers;
        const { type } = req.query;

        let returnWidgetData = {};
        if (version_code >= 977) {
            returnWidgetData = await QuiztfsUtility.getLandingScreenWidget(db, type, studentId, locale, version_code, appConfig);
        } else {
            // const remainingAttempts = await practiceEnglishUtils.getRemainingAttempts(db, studentId);
            // const { CONTEST_START_DATE } = practiceEnglishUtils.dailyContestConstants;
            // const tomorrowsDate = practiceEnglishUtils.getDateString(1);
            // const allSessions = await PracticeEnglishMySql.getSessionsByTimeRange(db.mysql.read, studentId, CONTEST_START_DATE, tomorrowsDate);

            // const studentRank = await QuizTfsRedis.getTestLeaderboardAllRank(db.redis.read, studentId);
            // const studentScore = await QuizTfsRedis.getTestLeaderboardScore(db.redis.read, studentId);
            const faqLocale = locale === 'hi' ? locale : 'en';
            const faqData = await QuizTfsMysql.getFaqs(db.mysql.read, faqLocale, 'practice_english_contest');
            const faqs = [];
            faqData.forEach((item) => {
                const faq = {
                    title: item.question,
                    description: item.answer,
                };
                faqs.push(faq);
            });

            const introVideoType = 'intro_video_long';
            // const attemptedSess = _.get(allSessions[0], 'attempted_sessions', 0) || (100 - remainingAttempts);
            // console.log(attemptedSess);
            // if (attemptedSess < 4) {
            // introVideoType = 'intro_video_long';
            // }
            const dnPropSql = 'select name, value, answer_video, duration from dn_property dnp left join answers an on dnp.value = an.question_id where bucket = "quiztfs" and name in (?,"testimonial_videos") and dnp.is_active = 1';
            const dnPropData = await db.mysql.read.query(dnPropSql, [introVideoType]);
            // const quiztfsData = {
            //     page_title: locale === 'hi' ? 'DOUBTNUT प्रीमियर लीग' : 'DOUBTNUT PREMIER LEAGUE',
            //     widgets: [
            //         {
            //             data: {
            //                 title: locale === 'hi' ? ' खेल शुरू करो' : 'Play Quiz War',
            //                 sub_title: locale === 'hi' ? 'खेलोगे, तभी जीतोगे!' : 'Kheloge, tabhi jeetoge',
            //                 deeplink: 'doubtnutapp://quiz_tfs_selection',
            //                 image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/069B0138-7F75-8BDE-D81C-DA4412270A93.webp',
            //             },
            //             type: 'widget_24x7',
            //         },
            //         {
            //             data: {
            //                 title: locale === 'hi' ? 'लाइव लीडरबोर्ड' : 'Live Leaderboard',
            //                 sub_title: locale === 'hi' ? 'आपके आज के अंक और रैंक' : 'Apki aaj ki rank & points',
            //                 deeplink: 'doubtnutapp://leaderboard?source=quiztfs',
            //                 student_rank: studentRank !== null ? parseInt(studentRank) + 1 : '--',
            //                 student_score: studentScore || 0,
            //                 image_url_rank: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1CACECC5-E4B1-C5F5-06F9-C54F2231971A.webp',
            //                 image_url_points: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5012E796-75DF-3C74-1045-C1D047C5BE7A.webp',
            //                 title_rank: locale === 'hi' ? 'मेरी रैंक' : 'My Rank',
            //                 title_point: locale === 'hi' ? 'मेरा स्कोर' : 'My Points',
            //             },
            //             type: 'widget_24x7_rank',
            //         },
            //         {
            //             data: {
            //                 title: locale === 'hi' ? 'पुरस्कार' : 'Rewards',
            //                 sub_title: locale === 'hi' ? 'फ्री कोर्स जीतने का मौका' : 'Chance to win FREE course',
            //                 deeplink: 'doubtnutapp://quiz_tfs_rewards',
            //                 image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B5D00D20-29CB-FDE3-BFFC-931AE684ECFB.webp',
            //             },
            //             type: 'widget_24x7',
            //         },
            //         {
            //             data: {
            //                 title: locale === 'hi' ? 'प्रदर्शन रिपोर्ट' : 'Performance Report',
            //                 sub_title: locale === 'hi' ? 'अपने जवाब और सोलूशन्स देखें ' : 'Apne answers aur solutions dekhein',
            //                 deeplink: 'doubtnutapp://quiz_tfs_history',
            //                 image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B603C403-8012-326C-359C-4B5867A8B43B.webp',
            //             },
            //             type: 'widget_24x7',
            //         },
            //         {
            //             data: {
            //                 title: locale === 'hi' ? 'दोस्त को न्योता' : 'Invite friend',
            //                 sub_title: locale === 'hi' ? 'अपने दोस्तों को भी DPL का हिस्सा बनाओ' : 'Apne dosto ko bhi DPL ka hissa banao',
            //                 deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DJ sir ne challenge diya hai.. Mujhse jeet sakte ho? Aajao saath mil kar DOUBTNUT PREMIER LEAGUE khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/fyFxC9ro6jb')}`,
            //                 image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/58801CAE-BD83-A5CF-A3B7-81C82928603E.webp',
            //             },
            //             type: 'widget_24x7',
            //         },
            //         {
            //             data: {
            //                 title: locale === 'hi' ? 'फीडबैक दें' : 'Give feedback',
            //                 sub_title: locale === 'hi' ? 'मज़ा आ रहा है? जो भी है, हमें बताओ' : 'Maza aa raha hai? Jo bhi hai, humein batao',
            //                 deeplink: 'doubtnutapp://app_survey?survey_id=13',
            //                 image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5D7C76DB-026F-C0B7-7EFA-DBC3274368EF.webp',
            //             },
            //             type: 'widget_24x7',
            //         },
            //         {
            //             data: {
            //                 title: locale === 'hi' ? 'और जानकारी' : 'FAQs',
            //                 items: faqs,
            //             },
            //             type: 'widget_faq',
            //         },
            //     ],
            // }

            const WPSql = 'select name, value from dn_property where bucket = "quiztfs" and name = "whatsapp_share" and is_active = 1';
            const WPSqlData = await db.mysql.read.query(WPSql, []);

            // console.log(WPSqlData);
            let wpMsg = 'Doubtnut par chal raha hai India ka sabse bada English Quiz Contest! 😍 \nJahan daily Bumper inaam mein ek Phone diyaa raha hai!! 🤳🏻 \nYahi nahi, iske alaava 10 Lucky winners ko milega ₹10,000 tak ka Paytm cash prize! 🤑 \n\nMazze ki baat hai ye aap ek nahi, 2 nahi poore 100 baar quiz attempt kar sakte hain \nYaani jitna jaada aapka score unte hi jaada mauka aapke jeetne ka. 💰💸 \n\nAao jung shuru kari jaaye! ⚔️ - https://doubtnut.app.link/fyFxC9ro6jb';
            if (WPSqlData.length > 0) {
                wpMsg = WPSqlData[0].value;
            }

            const isOlderVersion = version_code < 964;

            let titleHindi = 'शुरू करो !!!';
            let titleEnglish = 'START NOW !!!';
            let subtitleHindi = '';
            let subtitleEnglish = '';
            let quizDeeplink = 'doubtnutapp://practice_english';
            let quizStartEventId = 'pe_start_quiz';

            // const isAnyQuesAttempted = await PracticeEnglishMySql.getPreviousAttemptedQuesCountByDate(db.mysql.read, studentId, CONTEST_START_DATE);
            // if (isAnyQuesAttempted[0].attempted_questions < 1) {
            //     subtitleHindi = '';
            //     subtitleEnglish = '';
            // }
            if (isOlderVersion) {
                titleHindi = 'Doubtnut एप अपडेट करें';
                titleEnglish = 'Update Doubtnut to Play';
                subtitleHindi = 'गूगल प्ले स्टोर पर जाएं';
                subtitleEnglish = 'Click to go to Google play store';
                quizDeeplink = 'doubtnutapp://external_url?url=https://play.google.com/store/apps/details?id=com.doubtnutapp';
                quizStartEventId = 'pe_update_app';
            }
            const practiceEnglishData = {
                page_title: 'English Bolna Seekho',
                widgets: [
                    {
                        data: {
                            title: locale === 'hi' ? titleHindi : titleEnglish,
                            sub_title: locale === 'hi' ? subtitleHindi : subtitleEnglish,
                            deeplink: quizDeeplink,
                            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/069B0138-7F75-8BDE-D81C-DA4412270A93.webp',
                        },
                        type: 'widget_24x7',
                        extra_params: {
                            id: quizStartEventId,
                        },
                    },
                    {
                        data: {
                            title: locale === 'hi' ? 'प्रतियोगिता के विजेता' : 'Contest Winners',
                            sub_title: locale === 'hi' ? 'देखो पुरस्कार किसने जीती' : 'Dekho prizes kisne jeete!',
                            deeplink: 'doubtnutapp://quiz_tfs_rewards',
                            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B5D00D20-29CB-FDE3-BFFC-931AE684ECFB.webp',
                        },
                        type: 'widget_24x7',
                        extra_params: {
                            id: 'pe_winners',
                        },
                    },
                    {
                        data: {
                            title: locale === 'hi' ? 'दोस्त को न्योता' : 'Invite friend',
                            sub_title: locale === 'hi' ? 'अपने दोस्तों को भी इस कांटेस्ट का हिस्सा बनाओ' : 'Apne dosto ko bhi is contest ka hissa banao',
                            deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI(wpMsg)}`,
                            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/58801CAE-BD83-A5CF-A3B7-81C82928603E.webp',
                        },
                        type: 'widget_24x7',
                        extra_params: {
                            id: 'pe_invite',
                        },
                    },

                ],
            };

            if (faqs.length > 0) {
                practiceEnglishData.widgets.push({
                    data: {
                        title: locale === 'hi' ? 'और जानकारी' : 'FAQs',
                        items: faqs,
                    },
                    type: 'widget_faq',
                });
            }
            if (dnPropData.length > 0) {
                const videoItems = dnPropData.map((eachVid, i) => {
                    const {
                        answer_video: resource, duration, value,
                    } = eachVid;
                    const [qid, thumbnail] = value.split('|||');
                    const videothumbnail = thumbnail || 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/images/2022/02/13/18-57-03-291-PM_Entry%20Banner%20Correct.webp';

                    // if (name === 'intro_video_short') {
                    //     return {
                    //         type: 'video_banner_autoplay_child',
                    //         data: {
                    //             id: i,
                    //             image_url: videothumbnail.replace('https://doubtnut-static.s3.ap-south-1.amazonaws.com/', cdnUrl),
                    //             deeplink: `doubtnutapp://video?qid=${qid}`,
                    //             video_resource: {
                    //                 resource: `${'https://d3cvwyf9ksu0h5.cloudfront.net/'}${resource}-bak`,
                    //                 auto_play_duration: 5000,
                    //             },
                    //             auto_play: false,
                    //             default_mute: false,
                    //         },
                    //     };
                    // }
                    return {
                        type: 'video_banner_autoplay_child',
                        data: {
                            id: i,
                            image_url: videothumbnail.replace('https://doubtnut-static.s3.ap-south-1.amazonaws.com/', appConfig.cdn_url),
                            deeplink: `doubtnutapp://video?qid=${qid}`,
                            video_resource: {
                                resource: `${'https://d3cvwyf9ksu0h5.cloudfront.net/'}${resource}`,
                                auto_play_duration: duration * 1000,
                            },
                            default_mute: false,
                        },
                    };
                });
                practiceEnglishData.widgets.unshift({
                    widget_data: {
                        // title: 'What\'s New on Doubtnut!',
                        full_width_cards: true,
                        items: videoItems,
                        default_mute: false,
                        auto_play: true,
                        id: 1110,
                    },
                    widget_type: 'widget_autoplay',
                });
            }

            returnWidgetData = practiceEnglishData;
            // session with status -1;
            const newSessionId = uuidv4();
            await PracticeEnglishMySql.saveStudentSession(db.mysql.write, studentId, newSessionId, -1);
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: returnWidgetData,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                message: 'internal server error',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function getQuizDetails(req, res) {
    try {
        const db = req.app.get('db');
        const { locale } = req.user;
        const studentClass = req.query.class ? req.query.class : req.user.student_class;
        const languageCheck = req.query.language ? req.query.language : req.user.locale;
        const language = config.availablelabguageforclasses[studentClass].indexOf(languageCheck) === -1 ? 'en' : languageCheck;
        const { subject } = req.query;

        // get all the subjects based on class and language
        const allAvailableSubjects = await db.mongo.read.collection('QuizTfs').aggregate([
            { $match: { class: studentClass, language, isActive: 1 } },
            { $group: { _id: '$subject' } },
        ]).toArray();
        const subjects = [];
        const date = new Date();
        const getLastWinner = await QuizTfsMysql.getLastRewardWinner(db.mysql.read, date);
        let flag = 0;
        allAvailableSubjects.forEach((item) => {
            if (item._id === subject) flag = 1;
            const subjectItem = {
                title: item._id,
                key: item._id,
                image_url: config.subjectIconMapping[item._id] ? config.subjectIconMapping[item._id] : config.subjectIconMapping.DEFAULT,
                is_selected: item._id === subject,
            };
            subjects.push(subjectItem);
        });
        if (subjects.length > 0 && flag === 0) subjects[0].is_selected = true;

        // get all the available classes
        const availableClassesForLanguage = config.availableclassesforlangauge[language];
        const classes = [];
        availableClassesForLanguage.forEach((item) => {
            const classItem = {
                title: item === '14' ? 'Government Exams' : `Class ${item}`,
                key: item,
                is_selected: item === studentClass,
            };
            classes.push(classItem);
        });

        // get all the available Languages
        const availableLanguagesForClass = studentClass ? config.availablelabguageforclasses[studentClass] : ['en', 'bn', 'gu', 'hi', 'kn', 'ta', 'te'];
        const languages = [];
        availableLanguagesForClass.forEach((item) => {
            const languageItem = {
                title: config.languageMapping[item],
                key: item,
                is_selected: item === language,
            };
            languages.push(languageItem);
        });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                page_title: locale === 'hi' ? ' बनो खिलाडियों का खिलाड़ी' : 'Bano khiladiyon ka khiladi',
                title: locale === 'hi' ? 'अपना अखाड़ा चुनो' : 'Apna akhada select karo',
                class_list: classes,
                medium_list: languages,
                subject_data: {
                    title: locale === 'hi' ? 'विषय चुनो' : 'Select Subject',
                    list: subjects,
                },
                bottom_btn_title: locale === 'hi' ? 'मैदान में घुसो' : 'Enter the ground',
                footer_text: getLastWinner.length ? config.winner(getLastWinner) : config.noWinner(),
                footer_deeplink: 'doubtnutapp://quiz_tfs_rewards',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                message: 'internal server error',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function getQuestionForQuizTfs(req, res) {
    try {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        // get request so query
        const db = req.app.get('db');
        const {
            studentClass,
            language,
            subject,
            isFirst,
        } = req.query;
        // get question
        const { student_id } = req.user;
        const { locale } = req.user;
        const reqTime = new Date();
        const questionData = await db.mongo.read.collection('QuizTfs').find({
            class: studentClass, language, subject, endTime: { $gt: reqTime.valueOf() }, isActive: 1,
        }).limit(1)
            .toArray();
        const questionDetails = questionData[0];
        const current = new Date();
        const end = questionDetails.endTime;
        const difference = end - current.valueOf();
        const diffInSeconds = (difference / 1000);
        const points = await QuizTfsRedis.getTestLeaderboardScore(db.redis.read, student_id);
        responseData.data.timeToNext = Math.floor(diffInSeconds) + 1;
        responseData.data.timeToRespond = responseData.data.timeToNext - 10;
        if (isFirst == 'true') {
            responseData.data.timeToWait = responseData.data.timeToNext < 10 ? responseData.data.timeToNext : 3;

            responseData.data.waitData = {
                title: config.waitTitle,
                subTitle: config.waitSubTitle,
            };
            responseData.data.sessionId = questionDetails.sessionId;
        }
        if (diffInSeconds < 10 || isFirst == 'true') return res.status(responseData.meta.code).json(responseData);
        responseData.data.pageTitle = locale === 'hi' ? config.hindiPageTitle(studentClass, questionDetails.subject) : config.pageTitle(studentClass, questionDetails.subject);
        responseData.data.data = {};
        responseData.data.data.type = questionDetails.correctOption.trim().includes('::') ? 'MULTIPLE' : 'SINGLE';
        responseData.data.data.questionDetails = {
            questionID: questionDetails.questionID,
            questionText: questionDetails.questionText,
            optionA: questionDetails.optionA,
            optionB: questionDetails.optionB,
            optionC: questionDetails.optionC,
            optionD: questionDetails.optionD,
        };
        responseData.data.data.streak = await QuizTfsRedis.getStreakBySessionIdAndStudentId(db.redis.read, questionDetails.sessionId, student_id);
        const streakMultiplierCheck = Math.min(9, Math.floor((responseData.data.data.streak / 5) + 1));
        const streakMultiplier = config.streakMultiplier[streakMultiplierCheck];
        responseData.data.data.multiplier = streakMultiplierCheck === 9 ? 20 : streakMultiplier;
        responseData.data.data.streakText = `STREAK ${responseData.data.data.multiplier}X`;
        responseData.data.data.streakColor = config.quizColors[responseData.data.data.multiplier][0];
        responseData.data.data.questionTypeTitle = `${responseData.data.data.type === 'SINGLE' ? 'Single' : 'Multiple'} Select (+1,0)`;
        responseData.data.data.point = `${points || 0} ${points > 1 ? 'Points' : 'Point'}`;
        responseData.data.data.progressColor = config.quizColors[streakMultiplier][0];
        responseData.data.data.progressBgColor = config.quizColors[streakMultiplier][1];
        responseData.data.data.studentClass = questionDetails.class;
        responseData.data.data.language = questionDetails.language;
        responseData.data.data.subject = questionDetails.subject;

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                message: 'internal server error',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
function dateFormatter(today) {
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    day = day.toString();
    day = day.length === 2 ? day : `0${day}`;
    month = month.toString();
    month = month.length === 2 ? month : `0${month}`;
    year = year.toString();
    const dateFormatted = `${year}-${month}-${day} 00:00:00`;
    return dateFormatted;
}
async function submitAnswer(req, res) {
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        const studentId = typeof (student_id) === 'number' ? student_id : parseInt(student_id);
        const { locale } = req.user;
        const {
            studentClass,
            language,
            subject,
            answerSelected,
            sessionType,
        } = req.body;
        let { testQuestionId } = req.body;
        const date = new Date();
        const sessionID = await QuizTfsRedis.getSessionID(db.redis.read, language, subject, studentClass);

        const answerSelectedSorted = answerSelected.sort();
        const answer = !answerSelected.length ? ['SKIPPED'] : answerSelectedSorted;
        const questionDetails = await db.mongo.read.collection('QuizTfs').findOne({ questionID: testQuestionId, isActive: 1 });
        let actualAnswer = questionDetails.correctOption.indexOf(',') === -1 ? questionDetails.correctOption.split('::') : questionDetails.correctOption.split(',');
        const optMap = {
            1: 'A', 2: 'B', 3: 'C', 4: 'D',
        };
        actualAnswer = actualAnswer.map((opt) => {
            if (optMap[opt]) return optMap[opt];
            return opt;
        });
        let streak = await QuizTfsRedis.getStreakBySessionIdAndStudentId(db.redis.read, sessionID, studentId);
        streak = streak ? parseInt(streak) : 0;
        const streakMultiplierCheck = Math.min(9, Math.floor((streak / 5) + 1));
        const streakMultiplier = streakMultiplierCheck === 9 ? 20 : config.streakMultiplier[streakMultiplierCheck];
        const correctAnswer = actualAnswer.sort();
        const ptsReceived = _.isEqual(answerSelectedSorted, correctAnswer) ? streakMultiplier : 0;
        testQuestionId = typeof (testQuestionId) === 'number' ? testQuestionId : parseInt(testQuestionId);

        // update session table
        const answerSubmitData = await QuizTfsMysql.insertIntoSessionsTable(db.mysql.write, questionDetails.sessionId, studentId, testQuestionId, date, studentClass, subject, language, answer, ptsReceived, questionDetails.correctOption, sessionType);
        // update redis leaderboard
        if (answerSubmitData.affectedRows == 0) {
            const responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: 'Ek Sawaal Par Kitne Point Loge !! Yeh Sawaal Aap Pehle Submit Kar Chuke Hai. #NoFreePoints',
                },
                data: {
                    status: 'FAILURE',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        let ptsBefore = await QuizTfsRedis.getTestLeaderboardScore(db.redis.read, student_id);

        ptsBefore = ptsBefore ? parseInt(ptsBefore) : 0;
        const ptsnow = ptsBefore ? ptsReceived + ptsBefore : ptsReceived;
        if (ptsReceived) streak = streak ? parseInt(streak) + 1 : 1;
        else streak = 0;
        await QuizTfsRedis.setStreakForSessionIdAndStudentId(db.redis.read, sessionID, studentId, streak);
        await QuizTfsRedis.setLeaderboard(db.redis.read, studentId, ptsnow);
        NotificationsController.firstSubmitNotification(db, studentId, sessionID, locale);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                correctAnswers: correctAnswer || [],
                points: ptsReceived,
                totalPoints: `${ptsnow} ${ptsnow > 1 ? 'Points' : 'Point'}`,
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                message: 'internal server error',
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    }
}
async function checkDailyStreak(req, res) {
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        const studentID = student_id;
        let today = new Date();
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        today = dateFormatter(today);
        yesterday = dateFormatter(yesterday);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { streak: '😔 No Streak points today' },
        };
        const numberOfQuestions = await QuizTfsMysql.getAttemptedCount(db.mysql.read, yesterday, today, studentID);
        if (numberOfQuestions >= 10) {
            responseData.data.streak = '50 daily streak points credited';
            const ptsBefore = QuizTfsRedis.getTestLeaderboardScore(db.redis.read, studentID);
            // if streak set studentID points with +50
            const ptsnow = ptsBefore + 50;
            await QuizTfsRedis.setLeaderboard(db.redis.read, studentID, ptsnow);
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                message: 'internal server error',
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    }
}
function formatDateForPastSession(dateval) {
    let timeval = new Date(dateval);
    timeval = timeval.toString().split(' ');
    const day = timeval[2];
    const month = timeval[1];
    const year = timeval[3].substring(2, 4);
    return `${day} ${month} ${year}`;
}
async function getPastSessions(req, res) {
    try {
        const db = req.app.get('db');
        const studentId = req.user.student_id;
        const { page } = req.query;
        const limit = 10;
        const { locale } = req.user;
        const allPreviousSessionData = await QuizTfsMysql.getAllAttemptedDatesForStudent(db.mysql.read, studentId, limit, page);
        if (allPreviousSessionData.length === 0 && page === '1') {
            const responseData = config.emptyDataWidget;

            return res.status(responseData.meta.code).json(responseData);
        }
        const dateData = [];
        for (const item of allPreviousSessionData) {
            const widgetData = {
                type: 'widget_course_test',
                data: {
                    title: formatDateForPastSession(item.date),
                    questions_count: `${item.totalQuestions} ${locale === 'hi' ? 'सवाल प्रयास किये' : 'questions attempted'}`,
                    action_text: locale === 'hi' ? 'परिणाम देखें' : 'See Result',
                    status: 'Completed',
                    bottom_text: '',
                    is_completed: true,
                    margin: true,
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/412F4DB4-5FAB-D69F-1C6F-47C7251640C6.webp',
                    deeplink: `doubtnutapp://quiz_tfs_analysis?date=${formatDateForPastSession(item.date)}`,
                },
                extra_params: {
                    source: 'course_page_test_card',
                },
            };
            dateData.push(widgetData);
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: {
                title: locale === 'hi' ? 'प्रदर्शन रिपोर्ट' : 'Performance Report',
                widgets: dateData,
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                message: 'internal server error',
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    }
}

async function getPastSessionDetailsForDate(req, res) {
    try {
        const db = req.app.get('db');
        const studentId = req.user.student_id;
        const title = req.query.date;
        const date = new Date(req.query.date);
        const { page, filter } = req.query;
        const limit = 10;
        const { locale } = req.user;
        const allSubmissionData = await QuizTfsMysql.getAllQuestionsAttemptedForDate(db.mysql.read, studentId, date, limit, page);
        const responseData = {
            meta:
            {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data:
            {
                title: `${locale === 'hi' ? 'प्रदर्शन रिपोर्ट' : 'Performance Report'} - ${title}`,
                widgets: [],
            },
        };
        if (allSubmissionData.length === 0) return res.status(responseData.meta.code).json(responseData);
        const groupedSubmissionData = _.groupBy(allSubmissionData, 'testQuestionId');
        const questionIdlist = _.keys(groupedSubmissionData);
        const getAnswerVideoData = await QuizTfsMysql.getAnswerData(db.mysql.read, questionIdlist);
        const answerVideoDataGrouped = _.groupBy(getAnswerVideoData, 'questionId');
        const widgets = [];
        if (page <= 1) {
            const filterWidget = config.pastSessionFilter(filter, locale);
            widgets.push(filterWidget);
        }

        allSubmissionData.forEach((item) => {
            // strength -> correct
            if (answerVideoDataGrouped[item.testQuestionId]) {
                const dateval = formatDateForPastSession(item.date);
                let wrong = item.answerSelected === 'SKIPPED' ? 'SKIPPED' : 'WRONG';
                let status = item.ptsReceived > 0 ? 'CORRECT' : wrong;
                if (locale === 'hi') {
                    wrong = item.answerSelected === 'SKIPPED' ? 'छोड़ा हुआ' : 'गलत';
                    status = item.ptsReceived > 0 ? 'सही' : wrong;
                }
                const flag = filter ? status === filter : true;
                const obj = {
                    type: 'widget_tfs_analysis',
                    data: {
                        title: `Q :  ${answerVideoDataGrouped[item.testQuestionId][0].question}`,
                        subtitle: '',
                        tag_one: item.subject,
                        tag_one_color: config.subjectColorMappingDetails[item.subject],
                        tag_two: status,
                        tag_two_color: config.tagColor[status],
                        deeplink: `doubtnutapp://quiz_tfs_solution?id=${item.testQuestionId}&date=${dateval}`,
                        icon_url: answerVideoDataGrouped[item.testQuestionId][0].isAnswered ? 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6BAB6A0F-75B6-7FE4-5387-D1DA5AA9CC63.webp' : 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/AB518B9C-8E59-16A8-279B-59F2005CDDDF.webp',
                        deeplink_icon: `doubtnutapp://video?qid=${item.testQuestionId}&page=QUIZTFS_PAST${answerVideoDataGrouped[item.testQuestionId][0].isAnswered ? '' : '&resource_type=text'}`,
                    },
                };
                if (flag) widgets.push(obj);
            }
        });
        responseData.data.widgets = widgets;
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                message: 'internal server error',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function getQuestionSubmissionDetails(req, res) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId } = req.user;
        const date = new Date(req.query.date);
        const { questionID } = req.query;
        const testQuestionData = await db.mongo.read.collection('QuizTfs').find({
            questionID,
        }).toArray();
        const submittedData = await QuizTfsMysql.getQuestionAttemptedForDateById(db.mysql.read, studentId, date, questionID);
        const questionDetails = submittedData[submittedData.length - 1];
        questionDetails.questionText = testQuestionData[0].questionText;
        questionDetails.answerSelected = questionDetails.answerSelected.split(',');
        questionDetails.answerSelected = questionDetails.answerSelected[0] === 'SKIPPED' ? [] : questionDetails.answerSelected;
        questionDetails.actualAnswer = questionDetails.actualAnswer.split('::');
        questionDetails.optionA = testQuestionData[0].optionA;
        questionDetails.optionB = testQuestionData[0].optionB;
        questionDetails.optionC = testQuestionData[0].optionC;
        questionDetails.optionD = testQuestionData[0].optionD;
        const streak = questionDetails.ptsReceived ? questionDetails.ptsReceived : questionDetails.ptsReceived + 1;
        const responseData = {
            meta:
            {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                type: questionDetails.actualAnswer.length > 1 ? 'MULTIPLE' : 'SINGLE',
                questionDetails,
                streak,
                multiplier: streak,
                streakText: `STREAK ${streak}X`,
                questionTypeTitle: `${questionDetails.actualAnswer.length > 1 ? 'Multiple' : 'Single'} Select (+1,0)`,
                point: questionDetails.ptsReceived,
                progressColor: config.quizColors[questionDetails.ptsReceived][0],
                progressBgColor: config.quizColors[questionDetails.ptsReceived][1],
                studentClass: questionDetails.class,
                language: questionDetails.language,
                subject: questionDetails.subject,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                message: 'internal server error',
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    }
}

async function getRewards(req, res) {
    try {
        const db = req.app.get('db');
        const cdnUrl = req.app.get('config').cdn_url;

        // const { student_id: studentId } = req.user;
        const { page } = req.query;

        // const myScoreWidget = {};
        // const myRewardWidget = {};
        // const limit = 10;
        // Get Student Score
        // const score = await QuizTfsRedis.getTestLeaderboardScore(db.redis.read, studentId);
        // const myScore = score ? parseInt(score) : 0;
        // const myReward = new Reward(myScore);
        const widgets = [];
        const { locale } = req.user;

        const dnPropSql = 'select name, value, dnp.priority from dn_property dnp left join answers an on dnp.value = an.question_id where bucket = "quiztfs" and name = ? and dnp.is_active = 1 order by dnp.priority';
        const dnPropData = await db.mysql.read.query(dnPropSql, ['winners_banner']);

        // if (page <= 1 || !page) {
        //     const redeemedCoupons = await QuizTfsMysql.getRedeemedCoupons(db.mysql.read, studentId);
        //     const groupedRedeemedCoupons = _.groupBy(redeemedCoupons, 'coupon_code');
        //     const coupons = _.keys(groupedRedeemedCoupons);
        //     for (const coupon of coupons) {
        //         const redeemedCount = groupedRedeemedCoupons[coupon].length;
        //         QuizTfsMysql.updateRedeemedCoupons(db.mysql.write, studentId, coupon, redeemedCount);
        //     }
        //     myScoreWidget.data = { title: `${myScore || 0} Points`, items: myReward.pointWidget() };
        //     myScoreWidget.type = 'my_rewards_points_widget';
        //     myRewardWidget.data = { title: locale === 'hi' ? 'आज के इनाम' : 'Daily Rewards', items: await myReward.rewardWidget(db.mysql.read, studentId, locale) };
        //     myRewardWidget.type = 'my_rewards_scratch_card_widget';
        //     if (myScoreWidget.data) widgets.push(myScoreWidget);
        //     if (myRewardWidget.data) widgets.push(myRewardWidget);
        // }

        // PAST REWARD From quiztfs_reward by T-1 now() -1  by student_id
        // const previouslyAchievedRewards = await QuizTfsMysql.getPreviousAchievedRewards(db.mysql.read, studentId, page, limit);
        // const pastRewards = {
        //     data: {
        //         title: locale === 'hi' ? 'मेरे जीते हुए इनाम' : 'My Rewards',
        //         items: await myReward.redeemedRewardsWidget(previouslyAchievedRewards, locale),
        //     },
        //     type: 'my_rewards_scratch_card_widget',
        // };

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        if (page > 1) {
            responseData.data = {
                // page_title: locale === 'hi' ? 'पुरस्कार' : 'Rewards',
                page_title: locale === 'hi' ? 'प्रतियोगिता के विजेता' : 'Contest Winners',
                widgets: [],
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        if (dnPropData.length > 0) {
            const imageBanners = dnPropData.map((eachBanner, i) => {
                const { value, priority } = eachBanner;

                return {
                    type: 'banner_image',
                    data: {
                        // widget_type: 'banner_image',
                        // widget_data: {
                        _id: i,
                        // image_url: `${config.staticCDN}images/2021/12/24/05-20-26-182-AM_frame_16.webp`,
                        image_url: value.replace('https://doubtnut-static.s3.ap-south-1.amazonaws.com/', cdnUrl),
                        // deeplink: 'doubtnutapp://practice_english',
                        card_ratio: '16:9',
                        card_width: '1.0',
                    },
                    order: priority,
                    // },
                };
            });
            widgets.push(...imageBanners);
        }
        // if (pastRewards.data.items.length > 0) widgets.push(pastRewards);
        responseData.data = {
            // page_title: locale === 'hi' ? 'पुरस्कार' : 'Rewards',
            page_title: locale === 'hi' ? 'प्रतियोगिता के विजेता' : 'Contest Winners',
            widgets,
        };

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                message: e,
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    }
}

async function scratchCard(req, res) {
    try {
        const { student_id: studentId } = req.user;
        const db = req.app.get('db');
        const redeemValue = req.query.redeem_value;
        const score = await QuizTfsRedis.getTestLeaderboardScore(db.redis.read, studentId);
        const myScore = score ? parseInt(score) : 0;
        const { locale } = req.user;
        const myReward = new Reward(myScore);
        const myCoupon = await myReward.getCoupon(redeemValue, locale);
        const couponData = JSON.parse(JSON.stringify(myCoupon.dialog_data));
        const coupon_code = `QTFS_${(Math.random() + 1).toString(36).substring(7).toUpperCase()}`;

        if (myCoupon) {
            const sql = 'INSERT IGNORE INTO `quiztfs_rewards`(`student_id`, `milestone_score`, `coupon_code`, `scratch_date`, `valid_till`) VALUES (?,?,?,NOW(),DATE_ADD(NOW(),interval 7 day))';
            const data = await db.mysql.write.query(sql, [studentId, redeemValue, _.isInteger(myCoupon.dialog_data.coupon_code) ? coupon_code : myCoupon.dialog_data.coupon_code]);

            if (data.affectedRows === 1) {
                if (_.isInteger(myCoupon.dialog_data.coupon_code)) {
                    await saveStudentSpecificCoupon(db, studentId, coupon_code, myCoupon.dialog_data.coupon_code);
                }
            }
        }
        couponData.coupon_code = _.isInteger(myCoupon.dialog_data.coupon_code) ? coupon_code : myCoupon.dialog_data.coupon_code;

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: couponData,
        };

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                message: 'Internal Server Error',
            },

        };

        return res.status(responseData.meta.code).json(responseData);
    }
}

async function questionLeader(req, res) {
    try {
        const db = req.app.get('db');
        const {
            sessionId,
        } = req.query;
        const { student_id: studentId } = req.user;

        const reqTime = new Date();
        const questionData = await db.mongo.read.collection('QuizTfs').find({ sessionId, endTime: { $gt: reqTime.valueOf() }, isActive: 1 }).sort({ _id: 1 }).limit(1)
            .toArray();

        const currentQuestionId = questionData[0].questionID;

        // Top From Main LeaderBoard!!
        let currentStats = QuizTfsMysql.getSubmitStatOnQuestionId(db.mysql.read, currentQuestionId, sessionId, studentId);

        let topThreeSubmitters = QuizTfsMysql.getFastestCorrectSubmitterBySessionId(db.mysql.read, +currentQuestionId, sessionId);
        let lastQuestionId = QuizTfsMysql.getLastQuestionFromSessionAndQuestionId(db.mysql.read, sessionId, currentQuestionId);

        const globalLeaders = await QuizTfsRedis.getTestLeaderboardAll(db.redis.read, 0, 2);

        const globalLeaderItemWidgets = [];
        if (globalLeaders.length == 6) {
            const globalLeaderStudentDataPromise = [];
            globalLeaderStudentDataPromise.push(QuizTfsRedis.getUserDataById(db.redis.read, globalLeaders[0]));
            globalLeaderStudentDataPromise.push(QuizTfsRedis.getUserDataById(db.redis.read, globalLeaders[2]));
            globalLeaderStudentDataPromise.push(QuizTfsRedis.getUserDataById(db.redis.read, globalLeaders[4]));
            const resolvedGlobalLeaderStudentData = await Promise.all(globalLeaderStudentDataPromise);
            resolvedGlobalLeaderStudentData.forEach((leaderprofile, index) => {
                const profileData = JSON.parse(leaderprofile)[0];
                const item = {
                    rank: index + 1, image: profileData.img_url ? profileData.img_url : '', name: profileData.student_fname ? `${profileData.student_fname} ${profileData.student_lname}` : `${profileData.student_username}`, marks: globalLeaders[index * 2 + 1], student_id: profileData.student_id, icon: 'https://d10lpgp6xz60nq.cloudfront.net//engagement_framework/9FACB6B1-B6D5-262D-0F55-7787D99F175C.webp', profile_deeplink: `doubtnutapp://profile?student_id=${profileData.student_id}&source=qtfs`, elevation: 3,
                };

                globalLeaderItemWidgets.push(item);
            });
        }
        currentStats = await currentStats;

        topThreeSubmitters = await topThreeSubmitters;
        lastQuestionId = await lastQuestionId;

        const leaderBoardItems = topThreeSubmitters.length > 0 ? config.transitionResponseCreator(topThreeSubmitters) : [];

        // no of current Submits of Current
        // No of ppl Submit Last Question , Correct Incorrect Skipped
        const pastStats = await QuizTfsMysql.getSubmitStatOnQuestionId(db.mysql.read, lastQuestionId[0].testQuestionId, sessionId, studentId);

        const incorrects = pastStats[0].submits - pastStats[0].corrects - pastStats[0].skipped;

        pastStats[0].answer_submitted_by_user = _.isNull(pastStats[0].answer_submitted_by_user) ? 'SKIPPED' : pastStats[0].answer_submitted_by_user;
        let message1 = '--- Pichle Question Ki Kahani ---\n';
        // eslint-disable-next-line no-nested-ternary
        message1 += pastStats[0].user_point_received > 0 ? `🥳 Yay! Aapka jawab (Option ${pastStats[0].answer_submitted_by_user}) sahi tha.. Lage raho!! \n` : pastStats[0].answer_submitted_by_user != 'SKIPPED' ? `Oh NO!!! ☹️ Option ${pastStats[0].answer_submitted_by_user} galat jawaab tha.. Keep trying.. \n` : '❗❗ Aapne koi answer nahi diya.. Koi na, ab dedena!!\n';
        message1 += '✅';
        message1 += pastStats[0].corrects ? `${pastStats[0].corrects} users ne sahi jawaaab (Option ${pastStats[0].actual_answer}) diya..\n` : `Kisi ne bhi sahi jawab (Option ${pastStats[0].actual_answer}) nahi diya..\n`;
        if (incorrects) {
            message1 += `❌ ${incorrects} users ne try kiya par galat jawab..\n`;
        }
        if (pastStats[0].skipped) {
            message1 += `💀 ${pastStats[0].skipped} users se solve hi nahi hua!!\n`;
        }

        const message2 = '\n Ye hain aaj ke TOP 3 users 🥇 (AB TAK)👇🏻';

        const leaderboardTemplate = {
            type: 3,
            widget_data: {
                widget: {
                    type: 'widget_leaderboard_top_three',
                    data: {
                        margin: true,
                        items: [],
                    },
                },
            },

            student_displayname: 'Quiz Master',
            student_img_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/upload_3258590_1573710604.png',
            cdn_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/',
        };

        const message3 = _.cloneDeep(leaderboardTemplate);
        message3.widget_data.widget.data.items = globalLeaderItemWidgets;
        const message4 = '\n Or ye rahe is question ke 🏃🏻SABSE TEZ users 👇🏻';

        currentStats[0].answer_submitted_by_user = _.isNull(currentStats[0].answer_submitted_by_user) ? 'SKIPPED' : currentStats[0].answer_submitted_by_user;

        const qtfsWidgets = [];
        if (message1) {
            qtfsWidgets.push({ message: message1, type: 'join_text' });
        }
        if (globalLeaderItemWidgets.length) {
            qtfsWidgets.push({ message: message2, type: 'join_text' });
            qtfsWidgets.push({ message: message3, type: 'join_widget' });
        }
        if (leaderBoardItems.length) {
            qtfsWidgets.push({ message: message4, type: 'join_text' });
            const message5 = _.cloneDeep(leaderboardTemplate);
            message5.widget_data.widget.data.items = leaderBoardItems;
            qtfsWidgets.push({ message: message5, type: 'join_widget' });
        }

        const message6 = currentStats[0].answer_submitted_by_user == 'SKIPPED' ? `${currentStats[0].submits} aur users ne jawaab de diya..  Hurry up ⏱️ !! \n` : `Aapne aur ${currentStats[0].submits} users ne jawaab de diya hai.. Good job 👏🏻 \nBUT don't relax, get ready for next question! 💪🏻 \nIs question ka result time khatam hone ke baad chat par dikhega..\n`;
        if (currentStats[0].submits) {
            qtfsWidgets.push({ message: message6, type: 'join_text' });
        } else {
            qtfsWidgets.push({ message: 'Chat nahi Sawaal Dekho !! Time is Ticking ', type: 'join_text' });
        }

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
                success: true,
            },
            data: qtfsWidgets,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        //* * Sending 200 Only To the Socket Server  */
        console.log(e);
        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
                success: true,
            },
            data: [],
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = {
    getQuizDetails, getQuestionForQuizTfs, submitAnswer, checkDailyStreak, getLandingDetails, getPastSessions, getPastSessionDetailsForDate, getQuestionSubmissionDetails, getRewards, scratchCard, questionLeader,
};
