const _ = require('lodash');
// const { func } = require('joi');

const staticData = require('../../../data/data');
const LanguageContainer = require('../../../modules/containers/language');
const Utility = require('../../../modules/utility');
const QuestionContainer = require('../../../modules/containers/question');
const redisQuestionContainer = require('../../../modules/redis/question');
const studentCourseMapping = require('../../../modules/studentCourseMapping');
const libraryMysql = require('../../../modules/mysql/library');
const QuestionMysql = require('../../../modules/mysql/question');
const StudentRedis = require('../../../modules/redis/student');
const NudgeMysql = require('../../../modules/mysql/nudge');
const LiveclassData = require('../../../data/liveclass.data');
const NudgeHelper = require('../../helpers/nudge');
const AnswerContainer = require('./answer.container');
const ClassCourseMapping = require('../../../modules/containers/ClassCourseMapping')
async function advancedSearchWithFilter(staticParams, studentId, ocr, filter) {
    const chapters = filter.map((x) => x.chapter);
    const [elasticResult, languagesArrays] = await Promise.all([
        staticParams.elasticSearchInstance.findByOcrUsingIndexWithFilter(staticParams.config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, ocr, { chapters }),
        LanguageContainer.getList(staticParams.db),
    ]);
    const languagesObj = Utility.getLanguageObject(languagesArrays);
    const stLangCode = 'en';
    let language = languagesObj[stLangCode];
    if (typeof language === 'undefined') {
        language = 'english';
    }
    let matchesArray = elasticResult.hits ? elasticResult.hits.hits : [];
    matchesArray = await QuestionContainer.getQuestionStatsNew(matchesArray, staticParams.config, [staticData.color.white], language, stLangCode, {}, {}, staticParams.db, studentId, staticParams.xAuthToken, staticParams.versionCode);
    return matchesArray;
}

async function advancedSearchWithFilterV3(staticParams, studentId, ocr, filter) {
    const [elasticResult, languagesArrays] = await Promise.all([
        staticParams.elasticSearchInstance.findByOcrUsingIndexWithFilterV3(staticParams.config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, ocr, filter),
        LanguageContainer.getList(staticParams.db),
    ]);
    const languagesObj = Utility.getLanguageObject(languagesArrays);
    const stLangCode = 'en';
    let language = languagesObj[stLangCode];
    if (typeof language === 'undefined') {
        language = 'english';
    }
    let matchesArray = elasticResult.hits ? elasticResult.hits.hits : [];
    matchesArray = await QuestionContainer.getQuestionStatsNew(matchesArray, staticParams.config, [staticData.color.white], language, stLangCode, {}, {}, staticParams.db, studentId, staticParams.xAuthToken, staticParams.versionCode);
    return matchesArray;
}

function pushFacetCard(matchArray, facets, position) {
    if ((!position && position !== 0) || position < 0 || !facets) {
        return;
    }
    const card = {
        _index: null,
        _type: null,
        _id: null,
        _score: 1,
        _source: {
            ocr_text: null,
            bg_color: staticData.color.white,
            isLiked: false,
            duration: 0,
            views: null,
            share_message: null,
        },
        resource_type: 'facet',
        is_locked: 0,
        question_thumbnail: null,
        facets,
    };
    facets.sort((a, b) => a.isSelected || b.isSelected);
    matchArray.splice(position, 0, card);
}

function pushFacetCardV3(matchArray, facets, position) {
    if ((!position && position !== 0) || position < 0 || !facets) {
        return;
    }
    const card = {
        _index: null,
        _type: null,
        _id: null,
        _score: 1,
        _source: {
            ocr_text: null,
            bg_color: staticData.color.white,
            isLiked: false,
            duration: 0,
            views: null,
            share_message: null,
        },
        resource_type: 'facets_v2',
        is_locked: 0,
        question_thumbnail: null,
        facets_v2: facets,
    };
    facets.sort((a, b) => a.isSelected || b.isSelected);
    matchArray.splice(position, 0, card);
}

function pushBountyCard(matchesArray, isBounty) {
    const obj = {
        resource_type: 'bounty',
        title: 'Padhao Aur Kamao Kya Hai ?',
        text: 'Padhao Aur Kamao',
        button_text: 'Post Your Doubts',
    };
    if (isBounty == 'bounty') {
        matchesArray.splice(4, 0, obj);
    } else {
        matchesArray.push(obj);
    }
    return matchesArray;
}

async function getSimilarDataFromPlaylistRedis(db, question_id, student_class, student_id, page) {
    let finalList = [];
    let playlistId = 0;
    let redisKey = '';
    let playListName = '';
    if (page === 'SRP_PLAYLIST') {
        redisKey = 'SRP';
        playlistId = 449484;
        playListName = 'SRP_PLAYLIST';
    } else if (page === 'NON_SRP_PLAYLIST') {
        playlistId = 449483;
        redisKey = 'NON_SRP';
        playListName = 'NON_SRP_PLAYLIST';
    } else if (page === 'RECOMENDED_PLAYLIST') {
        playlistId = 119676;
    }
    if (playlistId != 0) {
        const playlistQuery = await libraryMysql.getResource(db.mysql.read, student_class, student_id, playlistId);
        if (playlistQuery.length === 1) {
            let str = playlistQuery[0].resource_path;
            if (redisKey !== '' && playListName !== '' && (page === 'SRP_PLAYLIST' || page === 'NON_SRP_PLAYLIST')) {
                const questionId = await redisQuestionContainer.getStudentLastQuestion(db.redis.read, student_id, redisKey);
                let questionList = await redisQuestionContainer.getSimilarQuestionsList(db.redis.read, questionId, playListName);
                questionList = JSON.parse(questionList);
                questionList = questionList.join();
                str = _.replace(str, /xxqidsxx/g, questionList);
            } else if (page === 'RECOMENDED_PLAYLIST') {
                const [lastWatchedVideo, studentCcmId] = await Promise.all([
                    studentCourseMapping.getLatestWatchedVideo(db.mysql.read, student_id),
                    ClassCourseMapping.getStudentCcmIds(db, student_id),
                ]);
                if (lastWatchedVideo.length && lastWatchedVideo[0].answer_id && studentCcmId.length && studentCcmId[0].ccm_id) {
                    str = _.replace(str, /xxccmxx/g, studentCcmId[0]);
                    str = _.replace(str, /xxaidxx/g, lastWatchedVideo[0].answer_id);
                }
            }
            const finalQuestionList = await db.mysql.read.query(str);
            const preVideos = [];
            const postVideos = [];
            let flag = 0;
            finalQuestionList.forEach((item) => {
                if (flag === 1) {
                    postVideos.push(item);
                }
                if (item.question_id == question_id) {
                    flag = 1;
                }
                if (flag === 0) {
                    preVideos.push(item);
                }
            });
            finalList = [...postVideos, ...preVideos];
        }
    }
    return finalList;
}

// async function addFilterData(db, qList) {
//     const questionDataPromise = [];
//     qList.forEach((item) => {
//         questionDataPromise.push(QuestionMysql.getByQuestionId(item.question_id, db.mysql.read));
//     });
//     const questionData = await Promise.all(questionDataPromise);

//     qList.forEach((item, index) => {
//         item.question_tag = questionData[index][0].chapter;
//         // if (!_.isNull(item.doubt) && !_.isEmpty(item.doubt)) {
//         //     const doubtArr = item.doubt.split('_');
//         //     item.filter_data = {
//         //         book: questionData[index][0].student_id,
//         //         chapter: questionData[index][0].chapter,
//         //         exercise: doubtArr[doubtArr.length - 2],
//         //     };
//         // }
//     });
//     return qList;
// }

async function getSimilarDataFromDailyDoubtRedis(db, questionId, studentId) {
    let redisQlist = await redisQuestionContainer.getTopicVideoList(db.redis.read, studentId, 'DAILY_DOUBT_LIST');
    let finalQlist = [];
    if (!_.isNull(redisQlist)) {
        redisQlist = JSON.parse(redisQlist).join();
        const qData = await QuestionMysql.getSimilarQuestionsByIds(db.mysql.read, redisQlist);
        if (qData.length > 0) {
            const postList = [];
            const preList = [];
            let flag = 0;
            qData.forEach((x) => {
                if (flag == 1) {
                    postList.push(x);
                }
                if (x.question_id == questionId) {
                    flag = 1;
                }
                if (flag == 0) {
                    preList.push(x);
                }
            });
            finalQlist = [...postList, ...preList];
        }
    }
    return finalQlist;
}
async function getQaWidgetDataFromRedis(db, questionId, studentId) {
    let redisQlist = await StudentRedis.getQaWidgetList(db.redis.read, studentId, 'QA_WIDGET_TOPIC_VIDEOS_LIST');
    let finalQlist = [];
    if (!_.isNull(redisQlist)) {
        redisQlist = JSON.parse(redisQlist).join();
        const qData = await QuestionMysql.getSimilarQuestionsByIds(db.mysql.read, redisQlist);
        if (qData.length > 0) {
            const postList = [];
            const preList = [];
            let flag = 0;
            qData.forEach((x) => {
                if (flag == 1) {
                    postList.push(x);
                }
                if (x.question_id == questionId) {
                    flag = 1;
                }
                if (flag == 0) {
                    preList.push(x);
                }
            });
            finalQlist = [...postList, ...preList];
        }
    }
    return finalQlist;
}

async function getNudgeData(db, config, studentId, studentClass, versionCode) {
    let nudgeData = null; const nudgeResource = [];
    if (versionCode > 799) {
        nudgeData = await StudentRedis.getLiveclassWatchCounter(db.redis.read, studentId);
        if (!_.isNull(nudgeData) && parseInt(nudgeData) > LiveclassData.videoWatchThreshold) {
            const event = 'data_watch_time';
            // get active nudges for homepage
            const nudges = await NudgeMysql.getByEvent(db.mysql.read, event, studentClass);
            if (nudges.length > 0) {
                const nudgeWidget = NudgeHelper.getWidget(nudges, config);
                for (let i = 0; i < nudgeWidget.data.items.length; i++) {
                    const obj = nudgeWidget.data.items[i];
                    obj.resource_type = nudgeWidget.data.items[i].type;
                    nudgeResource.push(obj);
                }
            }
        }
    }
    return nudgeResource;
}

async function getEtoosVideo(db, config, versionCode, pznSimilarFlagrResponse, resolvedPromises, pznElasticSearchInstance, studentId, studentClass, stLangCode) {
    let etoosVideos = [];
    if (resolvedPromises[0].length && resolvedPromises[0].question_id && versionCode > 728 && _.get(pznSimilarFlagrResponse, 'pzn_similar_logic_ab.payload.enabled', null)) {
        etoosVideos = await AnswerContainer.addVipVideos({
            db, questionData: resolvedPromises[0], config, pznElasticSearchInstance, studentID: studentId, student_class: studentClass, st_lang_code: stLangCode,
        });
    }
    return etoosVideos;
}

module.exports = {
    advancedSearchWithFilter,
    pushFacetCard,
    pushBountyCard,
    advancedSearchWithFilterV3,
    pushFacetCardV3,
    getSimilarDataFromPlaylistRedis,
    // addFilterData,
    getSimilarDataFromDailyDoubtRedis,
    getQaWidgetDataFromRedis,
    getNudgeData,
    getEtoosVideo,
};
