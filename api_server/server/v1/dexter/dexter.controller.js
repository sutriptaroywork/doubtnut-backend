const uuid = require('uuid-random');

const _ = require('lodash');
const HomepageQuestionsMaster = require('../../../modules/homepageQuestionsMaster.js');
const Gamification = require('../../../modules/mysql/gamification');
const redisClient = require('../../../config/redis');
const redisLibrairy = require('../../../modules/redis/library');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const WalletUtil = require('../../../modules/wallet/Utility.wallet');
const studentRedis = require('../../../modules/redis/student');
const kheloJeetoData = require('../../../data/khelo.jeeto.data');
const kheloJeetoRedis = require('../../../modules/redis/khelo.jeeto');

let db;

function getRandomQuestions(arr, n) {
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    if (n > len) {
        return false;
    }
    while (n--) {
        const x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

async function createPost(studentId, questionId, chapterAlias, database, deeplink) {
    const redisKey = `TOPIC_BOOSTER_GAME_PLAYED_${studentId}`;
    const isPostCreated = await redisLibrairy.getByKey(redisKey, redisClient);
    if (!isPostCreated) {
        const data = {
            msg: `Khelo doston ke saath ${chapterAlias} ka quiz aur bano champion!`,
            type: 'dn_activity',
            student_id: studentId,
            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/025F6C99-63E4-FE1D-DC40-54A5B7EF57F3.webp',
            activity_type: 'game',
            event_name: 'games_click',
            activity_title: 'topic_booster_game',
            deeplink,
            show_button: false,
            show_play: false,
            disable_lcsf_bar: true,
            is_active: true,
            is_deleted: false,
            game_id: `topic_booster_game_${questionId}`,
        };
        await database.mongo.write.collection('tesla_games').save(data);
        await redisLibrairy.setByKey(redisKey, true, 10800, redisClient);
    }
}

function getResponseData(isAvailable, chapterAlias, locale, title, studentId, questionId) {
    const { girlNames } = kheloJeetoData;
    const { boyNames } = kheloJeetoData;
    const cdnPath = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/';
    const opponentMeta = [{
        opponent_image: `${cdnPath}F083B361-F1E9-019D-4DB9-7742A7D28D3A.webp`,
        background_color_code: '#4D8B8F',
        opponent_name: _.sample(girlNames),
    }, {
        opponent_image: `${cdnPath}8F3476B4-F6CE-359C-D08E-A52A4F7522DC.webp`,
        background_color_code: '#38A664',
        opponent_name: _.sample(boyNames),
    }, {
        opponent_image: `${cdnPath}B4E2D49B-2307-D657-8763-D5ACFE393A62.webp`,
        background_color_code: '#564D8F',
        opponent_name: _.sample(girlNames),
    }, {
        opponent_image: `${cdnPath}BDEF08C3-76D3-F2B2-BC12-8CD006A4EE25.webp`,
        background_color_code: '#8F4D4D',
        opponent_name: _.sample(boyNames),
    }, {
        opponent_image: `${cdnPath}781842DD-746F-7358-A21E-35638F0A6534.webp`,
        background_color_code: '#F18686',
        opponent_name: _.sample(girlNames),
    }, {
        opponent_image: `${cdnPath}2C147F4C-BFB1-38CD-F279-75A6EB0C0856.webp`,
        background_color_code: '#FFE81B',
        opponent_name: _.sample(boyNames),
    }];
    if (isAvailable) {
        studentRedis.setLastAvailableTopic(studentId, JSON.stringify({ chapter_alias: chapterAlias, question_id: questionId }), redisClient);
        kheloJeetoRedis.setRecentTopics(redisClient, this.student_id, chapterAlias);
        const randomCounter = (Math.random() * (9.0 - 6.0) + 6.0).toFixed(1);
        return {
            title,
            subtitle: (locale === 'hi' ? `खेलें ${chapterAlias} का क्विज एंड देखें कौन है मास्टर!` : `Khelo doston ke saath ${chapterAlias} ka quiz aur bano champion!`),
            thumbnail: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/4E66E516-E2EE-0D02-9437-0706E86330CA.webp',
            button_text: (locale === 'hi' ? 'अभी खेलें!' : 'Play Now!'),
            test_uuid: uuid(),
            chapter_alias: chapterAlias,
            counter: parseFloat(randomCounter),
            is_available: isAvailable,
            ..._.sample(opponentMeta),
        };
    }
    return {
        title: null,
        subtitle: null,
        thumbnail: null,
        button_text: null,
        test_uuid: null,
        chapter_alias: null,
        counter: null,
        opponent_image: null,
        background_color_code: null,
        opponent_name: null,
        is_available: isAvailable,
    };
}

async function getQuestions(req, res) {
    db = req.app.get('db');
    const { chapter_alias: chapterAlias } = req.body;
    const { student_id: studentId } = req.user;
    let { total_questions_quiz: totalQuestionsForQuiz, expiry } = req.body;
    if (!totalQuestionsForQuiz || !expiry) {
        // if old apps not passed total_questions_quiz or expiry, then check with flagr or default value
        totalQuestionsForQuiz = 5;
        expiry = 30;
        if (req.headers.version_code >= 905) {
            const flgrData = { body: { capabilities: { play_quiz_config_v2: {} }, entityId: studentId } };
            const flagrResp = await UtilityFlagr.getFlagrResp(flgrData);
            if (flagrResp) {
                totalQuestionsForQuiz = flagrResp.play_quiz_config_v2.payload.totalQuestionsForQuiz;
                expiry = flagrResp.play_quiz_config_v2.payload.expiry;
            }
        } else {
            const flgrData = { body: { capabilities: { play_quiz_config: {} }, entityId: studentId } };
            const flagrResp = await UtilityFlagr.getFlagrResp(flgrData);
            if (flagrResp) {
                totalQuestionsForQuiz = flagrResp.play_quiz_config.payload.totalQuestionsForQuiz;
                expiry = flagrResp.play_quiz_config.payload.expiry;
            }
        }
    }
    const { test_uuid: testUUID } = req.body;
    // checking for quiz questions from redis first
    let topicMeta = await redisLibrairy.getByKey(`KJ_TOPIC_${chapterAlias}`, redisClient);
    if (!topicMeta) {
        // not found questions from redis, querying from db
        topicMeta = await HomepageQuestionsMaster.getTopicBoosterQuestions(db.mysql.read, chapterAlias);
        if (!topicMeta.length && topicMeta.length < totalQuestionsForQuiz) {
            // No Master chapter alias found error
            const responseData = {
                meta: {
                    code: 410,
                    success: false,
                    message: 'ERROR',
                },
                data: 'No Chapter Alias Found',
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        // creating cache as questions data found from SQL
        await redisLibrairy.setByKey(`KJ_TOPIC_${chapterAlias}`, topicMeta, 30 * 86400, redisClient);
    } else {
        // redis key available, parsing json
        topicMeta = JSON.parse(topicMeta);
    }
    studentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', studentId, 0);
    const responseFormat = _.map(getRandomQuestions(topicMeta, totalQuestionsForQuiz), (question) => ({
        class: question.class,
        subject: question.subject,
        chapter: question.chapter,
        question_id: question.question_id,
        question_text: question.question_text,
        options: [question.opt_1, question.opt_2, question.opt_3, question.opt_4],
        answer: question.answer.toUpperCase(),
        score: 2,
        expire: (['mathematics', 'maths'].includes(question.subject.toLowerCase()) ? 60 : expiry),
        test_uuid: testUUID,
        solutions_playlist_id: 453978,
        bot_meta: { answer: _.sample(['A', 'B', 'C', 'D']), response_time: _.random(5, (['mathematics', 'maths'].includes(question.subject.toLowerCase()) ? 30 : expiry) - 5) },
    }));
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: responseFormat,
    };
    createPost(studentId, topicMeta[0].question_id, chapterAlias, db, `doubtnutapp://topic_booster_game?qid=${topicMeta[0].question_id}`);
    return res.status(responseData.meta.code).json(responseData);
}

async function getWidget(req, res) {
    db = req.app.get('db');
    const { questionId } = req.params;
    const { locale } = req.user;
    const { student_id: studentId } = req.user;
    let message = 'SUCCESS';
    let data;
    let totalAvailable = 0;
    const MAX_ALLOWED_VISIBILITY_FOR_TOPIC_BOOSTER = 3;
    const chapterAlias = await HomepageQuestionsMaster.getChapterAlias(db.mysql.read, questionId);
    if (!chapterAlias) {
        message = 'NO Chapter Alias Found';
        data = getResponseData(false, null, null, null, null, null);
    } else {
        console.log(chapterAlias, ' chapterAlias');
        let topicBoosterVisibilityCounter = await studentRedis.get7Day(db.redis.read, 'TOPIC_BOOSTER_VISIBILITY', studentId);
        if (topicBoosterVisibilityCounter && parseInt(topicBoosterVisibilityCounter) < 6) {
            topicBoosterVisibilityCounter = parseInt(topicBoosterVisibilityCounter) + 1;
            studentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', studentId, topicBoosterVisibilityCounter);
        } else {
            topicBoosterVisibilityCounter = 1;
            studentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', studentId, 1);
        }

        if (!topicBoosterVisibilityCounter || topicBoosterVisibilityCounter <= MAX_ALLOWED_VISIBILITY_FOR_TOPIC_BOOSTER) {
            let totalQuestionsForQuiz = 5;
            let expiry = 30;
            let isWalletReward = false;
            let variantId = -1;
            let title = 'Khelo aur Jeeto!';
            if (req.headers.version_code >= 905) {
                const flgrData = { body: { capabilities: { play_quiz_config_v2: {} }, entityId: studentId } };
                const flagrResp = await UtilityFlagr.getFlagrResp(flgrData);
                if (flagrResp) {
                    totalQuestionsForQuiz = flagrResp.play_quiz_config_v2.payload.totalQuestionsForQuiz;
                    expiry = flagrResp.play_quiz_config_v2.payload.expiry;
                    variantId = flagrResp.play_quiz_config_v2.variantId;
                    isWalletReward = flagrResp.play_quiz_config_v2.payload.is_wallet_reward;
                    title = flagrResp.play_quiz_config_v2.payload.title;
                }
            } else {
                const flgrData = { body: { capabilities: { play_quiz_config: {} }, entityId: studentId } };
                const flagrResp = await UtilityFlagr.getFlagrResp(flgrData);
                if (flagrResp) {
                    totalQuestionsForQuiz = flagrResp.play_quiz_config.payload.totalQuestionsForQuiz;
                    expiry = flagrResp.play_quiz_config.payload.expiry;
                    variantId = flagrResp.play_quiz_config.variantId;
                    isWalletReward = flagrResp.play_quiz_config.payload.is_wallet_reward;
                    title = flagrResp.play_quiz_config.payload.title;
                }
            }
            const isChapterAliasAllowed = await redisLibrairy.getByKey(`TOPIC_${chapterAlias.chapter_alias}_${totalQuestionsForQuiz}`, redisClient);
            if (!isChapterAliasAllowed) {
                console.error(`redis key not found for TOPIC_${chapterAlias.chapter_alias}_${totalQuestionsForQuiz}`);
                const totalTopicsAvailable = await HomepageQuestionsMaster.getTotalCountTopicBooster(db.mysql.read, chapterAlias.chapter_alias);
                totalAvailable = totalTopicsAvailable.total;
                if (totalAvailable < totalQuestionsForQuiz) {
                    message = `Less than ${totalQuestionsForQuiz} Questions found for this topic`;
                    data = getResponseData(false, null, null, title, null, null);
                } else {
                    data = getResponseData(true, chapterAlias.chapter_alias, locale, title, studentId, questionId);
                }
                // setting cache for 30 Days always even if topic has less questions available
                await redisLibrairy.setByKey(`TOPIC_${chapterAlias.chapter_alias}_${totalQuestionsForQuiz}`, totalAvailable, 30 * 86400, redisClient);
            } else if (parseInt(isChapterAliasAllowed) < totalQuestionsForQuiz) {
                // cache is available but minimum total ques available is less than allowed
                message = `Less than ${totalQuestionsForQuiz} Questions found for this topic`;
                data = getResponseData(false, null, null, title, null, null);
            } else {
                // cache is available and questions are also available to play quiz
                data = getResponseData(true, chapterAlias.chapter_alias, locale, title, studentId, questionId);
            }
            data.additional_details = {
                variant_id: variantId, total_questions_quiz: totalQuestionsForQuiz, expiry, is_wallet_reward: isWalletReward,
            };
        } else {
            message = `Topic Booster Banner can't shown as user has not clicked it after seeing more than ${MAX_ALLOWED_VISIBILITY_FOR_TOPIC_BOOSTER}`;
            data = getResponseData(false, null, null, null, null, null);
        }
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message,
        },
        data,
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function saveResponse(req, res) {
    db = req.app.get('db');
    const {
        test_uuid: testUUID,
        score,
        question_id: questionId,
        answer,
        is_correct,
        subject,
        chapter,
        parent_question_id: parentQid,
    } = req.body;
    const { student_id: studentId, student_class: studentClass } = req.user;

    const response = {
        test_id: testUUID,
        parent_question_id: parentQid,
        question_id: questionId,
        student_id: studentId,
        class: studentClass,
        subject,
        chapter,
        score,
        answer,
        is_correct,
    };

    await db.mongo.write.collection('dexter_responses').save(response);
    if (is_correct) {
        await db.redis.write.zadd('dexter_leaderboard', 'INCR', parseInt(score), studentId);
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: 'saved',
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function leaderboard(req, res) {
    db = req.app.get('db');
    const { student_id } = req.user;
    const topTenZrange = await db.redis.read.zrevrangeAsync('dexter_leaderboard', 0, 9, 'WITHSCORES');
    const topTenStudentIds = [];
    const topTenStudentScores = [];
    const topTenStudentRanks = [];
    let rankCounter = 1;
    for (let i = 0; i < topTenZrange.length; i++) {
        if (i % 2 === 0) { // index is even
            topTenStudentIds.push(topTenZrange[i]);
            topTenStudentRanks.push(rankCounter);
            rankCounter++;
        } else {
            topTenStudentScores.push(topTenZrange[i]);
        }
    }
    if (!topTenStudentIds.includes(student_id.toString())) {
        let studentRank = await db.redis.read.zrevrankAsync('dexter_leaderboard', student_id);
        if (studentRank) {
            studentRank++;
            const student_score = await db.redis.read.zscoreAsync('dexter_leaderboard', student_id);
            topTenStudentIds.push(student_id);
            topTenStudentScores.push(student_score);
            topTenStudentRanks.push(studentRank);
        }
    }
    const leaderboardData = [];
    if (topTenStudentIds.length > 0) {
        console.log(topTenStudentIds);
        const student_data_by_ids = await Gamification.getStudentByIds(db.mysql.read, topTenStudentIds);
        const grouped_student_data_ids = _.groupBy(student_data_by_ids, 'student_id');
        console.log(grouped_student_data_ids);
        _.forEach(topTenStudentIds, (topten_student_id, key) => {
            const data = {
                user_id: grouped_student_data_ids[topten_student_id][0].student_id,
                user_name: grouped_student_data_ids[topten_student_id][0].student_username,
                rank: topTenStudentRanks[key],
                profile_image: grouped_student_data_ids[topten_student_id][0].img_url,
                points: topTenStudentScores[key],
                is_own: 0,
            };
            if (topten_student_id == student_id) {
                data.is_own = 1;
            }
            leaderboardData.push(data);
        });
    }

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: leaderboardData,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function result(req, res, next) {
    try {
        db = req.app.get('db');
        const { game_result, is_wallet_reward } = req.body;
        const { locale, student_id: studentId } = req.user;
        let rewardMessage = null;
        let message;
        let minAmount = 1;
        let maxAmount = 10;
        let maxWinAmount = 1000;
        let noRewardMessage = 'Rewards are currently on hold. Keep playing and learning!';
        if (req.headers.version_code >= 905) {
            const flgrData = { body: { capabilities: { khelo_jeeto_sid_max_prize_v2: {} }, entityId: studentId } };
            const flagrResp = await UtilityFlagr.getFlagrResp(flgrData);
            if (flagrResp && flagrResp.khelo_jeeto_sid_max_prize_v2.enabled === true) {
                maxAmount = flagrResp.khelo_jeeto_sid_max_prize_v2.payload.max_prize;
                minAmount = flagrResp.khelo_jeeto_sid_max_prize_v2.payload.min_prize;
                maxWinAmount = flagrResp.khelo_jeeto_sid_max_prize_v2.payload.max_win_amount;
                noRewardMessage = flagrResp.khelo_jeeto_sid_max_prize_v2.payload.no_reward_message;
            }
        } else {
            const flgrData = { body: { capabilities: { khelo_jeeto_sid_max_prize: {} }, entityId: studentId } };
            const flagrResp = await UtilityFlagr.getFlagrResp(flgrData);
            if (flagrResp && flagrResp.khelo_jeeto_sid_max_prize.enabled === true) {
                maxAmount = flagrResp.khelo_jeeto_sid_max_prize.payload.max_prize;
                minAmount = flagrResp.khelo_jeeto_sid_max_prize.payload.min_prize;
                maxWinAmount = flagrResp.khelo_jeeto_sid_max_prize.payload.max_win_amount;
                noRewardMessage = flagrResp.khelo_jeeto_sid_max_prize.payload.no_reward_message;
            }
        }
        const amount = parseInt((Math.random() * (maxAmount - minAmount) + minAmount).toFixed());
        if (game_result === '0') {
            message = 'Match Lost, Not credited';
        } else if (game_result === '1') {
            message = 'Match won & credited successfully';
            const totalCredited = await HomepageQuestionsMaster.getTotalCredited(db.mysql.read, studentId, 30);
            if (is_wallet_reward !== '1') {
                message = 'Amount can not be credited as per flagr response';
                rewardMessage = noRewardMessage;
            } else if (totalCredited && totalCredited[0].total > maxWinAmount) {
                message = 'user has earned more than allowed limit in a month';
            } else {
                await WalletUtil.makeWalletTransaction({
                    student_id: req.user.student_id,
                    reward_amount: amount,
                    type: 'CREDIT',
                    payment_info_id: 'dedsorupiyadega',
                    reason: 'add_topic_booster_reward',
                    expiry: null,
                });
                rewardMessage = (locale === 'hi' ? `आपकी जीत पर डीएन वॉलेट में ${amount} रु जोड़ दिया गया है!` : `Rs ${amount} added in DN Wallet for your win.`);
            }
        } else {
            message = 'Match draw, not credited';
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message,
            },
            data: {
                reward_message: rewardMessage,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getQuestions,
    getWidget,
    saveResponse,
    leaderboard,
    result,
    createPost,
    getRandomQuestions,
    getResponseData,
};
