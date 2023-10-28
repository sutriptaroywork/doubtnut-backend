const _ = require('lodash');

const MicroconceptContainer = require('../../../modules/containers/microconcept');
const QuestionsMetaContainer = require('../../../modules/containers/questionsMeta');
const QuestionContainer = require('../../../modules/containers/question');
const PznContainer = require('../../../modules/containers/pzn');
const AnswerRedis = require('../../../modules/redis/answer');
const AnswerContainer = require('../../../modules/containers/answer');
const StaticData = require('../../../data/data');
const Utility = require('../../../modules/utility');
const PersonalisationMysql = require('../../../modules/mysql/personalization');

async function getNextMicroConcept(mc_id, student_class, student_course, data, db) {
    let promiseResolve;
    const promise = new Promise((resolve) => {
        promiseResolve = resolve;
    });
    try {
        let nextMicroConcept;
        const microConceptOrderData = await MicroconceptContainer.getByMcCourseMappingByClassAndCourse(mc_id, student_class, student_course, db);
        const { subject } = microConceptOrderData[0];
        let {
            chapter_order,
            sub_topic_order,
            micro_concept_order,
        } = microConceptOrderData[0];
        data.question_meta = {
            chapter: microConceptOrderData[0].chapter,
            subtopic: microConceptOrderData[0].subtopic,
        };
        nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, sub_topic_order, micro_concept_order, subject, db);
        if (!nextMicroConcept.length > 0) {
            // get next micro concept using subtopic order
            sub_topic_order += 1;
            micro_concept_order = 1;
            nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, sub_topic_order, micro_concept_order, subject, db);
            if (!nextMicroConcept.length > 0) {
                // get next micro concept using chapter order
                chapter_order += 1;
                sub_topic_order = 1;
                nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, sub_topic_order, micro_concept_order, subject, db);
                data.next_microconcept = nextMicroConcept[0];
                promiseResolve(data);
                return promise;
            }
        }
        data.next_microconcept = nextMicroConcept[0];
        promiseResolve(data);
        return promise;
    } catch (e) {
        promiseResolve(data);
        return promise;
    }
}
async function getVideosLoop(db, pznResult, mcID, locale, indexPosition) {
    let list = [];
    while (list.length === 0
        && indexPosition < 2
        && typeof pznResult.aggregations.similar_videos.buckets[indexPosition] === 'undefined') {
        // code block to be executed
        const targetGroup = pznResult.aggregations.similar_videos.buckets[indexPosition].key;
        // eslint-disable-next-line no-await-in-loop
        list = await PznContainer.getVideosByPznTG(db, targetGroup, mcID, locale);
        indexPosition += 1;
    }
    if (list.length === 0) {
        list = await PznContainer.getVideos(db, mcID, locale);
    }
    return list;
}

async function addVipVideos({
    db,
    questionData,
    studentID,
    config,
    pznElasticSearchInstance,
    student_class,
    st_lang_code,
    // userLocale,
}) {
    try {
        const localeMap = {
            en: 'ENGLISH',
            hi: 'HINDI',
            'hi-en': 'ENGLISH',
        };
        const vipVideos = [];
        let list = [];
        const videosList = ['649219688', '649222202', '649221083', '649221669', '649222572', '649220455', '649220355', '649220476', '649220457', '649220475', '649220477'];
        const [results, metaInfo, studentIdPackageMappingInfo] = await Promise.all([pznElasticSearchInstance.searchTgCount(studentID), QuestionsMetaContainer.getQuestionMeta(questionData[0].question_id, db), QuestionContainer.getQuestionPackageInfo(db, questionData[0].student_id)]);
        if (!_.isEmpty(metaInfo) && !_.isEmpty(studentIdPackageMappingInfo)) {
            const mcID = metaInfo[0].microconcept;
            const videoLocale = studentIdPackageMappingInfo[0].video_language;
            const locale = (_.isEmpty(localeMap[videoLocale])) ? 'ENGLISH' : localeMap[videoLocale];
            if (!_.isEmpty(results) && !_.isEmpty(results.aggregations) && !_.isEmpty(results.aggregations.similar_videos) && !_.isEmpty(results.aggregations.similar_videos.buckets)) {
                list = await getVideosLoop(db, results, mcID, locale, 0);
            } else {
                list = await PznContainer.getVideos(db, mcID, locale);
            }
            if (_.includes([9, 10, 11, 12, 13], +student_class) && st_lang_code === 'en') {
                const videoitem = videosList[Math.floor(Math.random() * videosList.length)];
                const questionIdDetails = await PersonalisationMysql.getChapterNameandBookName(db.mysql.read, videoitem);
                const itemDetails = { question_id: videoitem };
                if (questionIdDetails.length) {
                    itemDetails.chapter = questionIdDetails[0].chapter;
                    itemDetails.matched_question = questionIdDetails[0].matched_question;
                    itemDetails.subject = questionIdDetails[0].subject;
                    list.unshift(itemDetails);
                }
            }
            for (let i = 0; i < list.length; i++) {
                const obj = {};
                obj.question_id = list[i].question_id;
                obj.question = list[i].question;
                obj.matched_question = list[i].matched_question;
                obj.chapter = list[i].chapter;
                obj.subtopic = null;
                obj.microconcept = mcID;
                obj.level = null;
                obj.target_course = null;
                obj.package = null;
                obj.type = null;
                obj.q_options = null;
                obj.q_answer = null;
                obj.thumbnail_image = `${config.staticCDN}q-thumbnail/${list[i].question_id}.webp`;
                obj.book_meta = null;
                obj.tags_list = [];
                obj.ref = null;
                obj.views_text = 'views';
                obj.resource_type = 'video';
                obj.duration = '296';
                obj.subject = list[i].subject;
                obj.is_locked = 0;
                obj.is_vip = true;
                obj.bg_color = '#F2EED9';
                obj.share = 1;
                obj.like = 1;
                obj.views = 1;
                obj.share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                obj.isLiked = false;
                vipVideos.push(obj);
            }
        }
        return vipVideos;
    } catch (e) {
        console.log(e);
        throw Error(e);
    }
}

async function getLiveclassShowCount(dbRedis, redisKey, student_id) {
    try {
        let liveclassCount = 0;
        const redisResult = await AnswerRedis.getLiveclassShowCount(dbRedis.read, redisKey, student_id);
        if (redisResult != null && redisResult != 0) {
            liveclassCount = parseInt(redisResult);
        }
        return liveclassCount;
    } catch (e) {
        return 0;
    }
}

async function getSfShowCount(dbRedis, redisKey, student_id) {
    try {
        let sfCount = 0;
        const redisResult = await AnswerRedis.getSfShowCount(dbRedis.read, redisKey, student_id);
        if (redisResult != null && redisResult != 0) {
            sfCount = parseInt(redisResult);
        }
        return sfCount;
    } catch (e) {
        return 0;
    }
}

// eslint-disable-next-line no-unused-vars
async function getTotalLikesShare(db, elasticSearchResult, _student_id, _unlockStatus, versionCode, variantId = null, page = null, country = 'IN') {
    const color = versionCode > 645 ? [StaticData.color.white] : StaticData.colors;
    const motivationalStudentId = [80, 81, 82, 83, 84, 85, 86, 87, 93, 94, 95, 97, 98, 99];
    const durationPromise = [];
    const likeDislikePromise = [];
    for (let i = 0; i < elasticSearchResult.length; i++) {
        durationPromise.push(AnswerContainer.getByQuestionIdWithTextSolution(elasticSearchResult[i].question_id, db));
        likeDislikePromise.push(QuestionContainer.getTotalViewsNew(elasticSearchResult[i].question_id, db));
    }
    const videoData = await Promise.all(durationPromise);
    const likeDislikeData = await Promise.all(likeDislikePromise);

    elasticSearchResult.forEach((item, index) => {
        item.views_text = motivationalStudentId.includes(videoData[index].length ? videoData[index][0].student_id : 0) ? 'views' : 'asked';
    });

    for (let i = 0; i < elasticSearchResult.length; i++) {
        if (!videoData[i].length) {
            elasticSearchResult.splice(i, 1);
            videoData.splice(i, 1);
            likeDislikeData.splice(i, 1);
            i--;
        }
    }

    for (let i = 0; i < elasticSearchResult.length; i++) {
        elasticSearchResult[i].book_meta = null;
        elasticSearchResult[i].target_course = null;
        if (videoData[i].length && videoData[i][0].ocr_text) {
            elasticSearchResult[i].ocr_text = videoData[i][0].ocr_text;
        }
        elasticSearchResult[i] = Utility.checkThumbnail(elasticSearchResult[i], StaticData.thumbnailSid, videoData[i][0].student_id);
        if (videoData[i].length && videoData[i][0].is_text_answered == 1 && videoData[i][0].is_answered == 0) {
            elasticSearchResult[i].resource_type = 'text';
            elasticSearchResult[i].duration = 0;
            videoData[i][0].answer_id = videoData[i][0].text_solution_id;
            videoData[i][0].answer_video = 'text';
        } else {
            elasticSearchResult[i].resource_type = 'video';
            if (videoData[i].length > 0 && videoData[i][0].duration) {
                if (videoData[i][0].duration === 'NULL') {
                    elasticSearchResult[i].duration = 0;
                } else {
                    elasticSearchResult[i].duration = videoData[i][0].duration;
                }
            } else {
                elasticSearchResult[i].duration = 0;
            }
        }
        // Adding subject and lock unlock status
        if (videoData[i].length && videoData[i][0].subject) {
            elasticSearchResult[i].subject = videoData[i][0].subject;
        } else {
            elasticSearchResult[i].subject = 'MATHS';
        }

        elasticSearchResult[i].is_locked = 0;
        elasticSearchResult[i].bg_color = _.sample(color);
        if (likeDislikeData[i].length) {
            elasticSearchResult[i].share = likeDislikeData[i][0].share || 0;
            elasticSearchResult[i].like = likeDislikeData[i][0].likes || 0;
            elasticSearchResult[i].views = likeDislikeData[i][0].views || 0;
        }
        elasticSearchResult[i].share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
        if (country === 'US') {
            elasticSearchResult[i].share_message = 'Improve your SAT or ACT Score with Math, Science and solved Practice Tests Video Solutions only on Doubtnut!!';
        }
        elasticSearchResult[i].isLiked = false;
    }
    return elasticSearchResult;
}

module.exports = {
    getNextMicroConcept,
    addVipVideos,
    getLiveclassShowCount,
    getSfShowCount,
    getTotalLikesShare,
};
