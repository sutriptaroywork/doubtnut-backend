const _ = require('lodash');

const UtilityV2 = require('../utilityQuestionV2');
const keys = require('./keys');

const hash_expiry = 60 * 60 * 24; // 24 hour
const flash_expiry = 60 * 10;
const trending_expiry = 60 * 60 * 12; // 24 hour

module.exports = class Question {
    static getVideoType(client, questionId) {
        return client.hgetAsync(`QUESTION:${questionId}`, 'TYPE');
    }

    static setVideoType(client, questionId, videoType) {
        return client.multi()
            .hset(`QUESTION:${questionId}`, 'TYPE', videoType)
            .expire(`QUESTION:${questionId}`, hash_expiry * 30)
            .execAsync();
    }

    static getDistinctClass(client) {
        return client.getAsync('pdf_assignment_class');
    }

    static setDistinctClass(client, stdClass) {
        return client.multi()
            .set(`pdf_assignment_class_${stdClass}`, JSON.stringify(stdClass))
            .expireat(`pdf_assignment_class_${stdClass}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 24)
            .execAsync();
    }

    static setUserLastAskedQId(client, student_id, question_id) {
        const key = `${keys.userProfileData}:${student_id}`;
        return client.hsetAsync(key, 'lastQId', question_id);
    }

    static getUserLastAskedQId(client, student_id) {
        const key = `${keys.userProfileData}:${student_id}`;
        return client.hgetAsync(key, 'lastQId');
    }

    static setUserAskedQuestionData(client, questionId, data) {
        const {
            keyPrefix, expiry,
        } = keys.userQuestionAskDetails;
        return client.multi()
            .hset(`${keyPrefix}:${questionId}`, ...Object.entries(data))
            .expire(`${keyPrefix}:${questionId}`, expiry)
            .execAsync();
    }

    static getUserAskedQuestionData(client, questionId, columnName) {
        const {
            keyPrefix,
        } = keys.userQuestionAskDetails;
        return client.hgetAsync(`${keyPrefix}:${questionId}`, columnName);
    }

    static mgetUserAskedQuestionData(client, questionId, columnNames) {
        const {
            keyPrefix,
        } = keys.userQuestionAskDetails;
        return client.hmgetAsync(`${keyPrefix}:${questionId}`, [...columnNames]);
    }

    static setMatchesForAdvanceSearchById(client, question_id, data) {
        return client.multi()
            .set(`advance_search_matches_array_${question_id}`, JSON.stringify(data))
            .expireat(`advance_search_matches_array_${question_id}`, parseInt(new Date().getTime() / 1000) + flash_expiry)
            .execAsync();
    }

    static getMatchesForAdvanceSearchById(client, question_id) {
        return client.getAsync(`advance_search_matches_array_${question_id}`);
    }

    static getAdvanceSearchFacets(client, question_id) {
        return client.getAsync(`advance_search_facets_${question_id}`);
    }

    static setAdvanceSearchFacets(client, question_id, data) {
        return client.setAsync(`advance_search_facets_${question_id}`, data, 'EX', flash_expiry);
    }

    static setActiveAdvanceSearchFilter(client, question_id, data) {
        return client.setAsync(`ADVANCE_SEARCH_USER_SELECTION_${question_id}`, data, 'EX', flash_expiry);
    }

    static getActiveAdvanceSearchFilter(client, question_id) {
        return client.getAsync(`ADVANCE_SEARCH_USER_SELECTION_${question_id}`);
    }

    static getDistinctSubject(client, studentClass) {
        return client.getAsync(`pdf_assignment_subject_${studentClass}`);
    }

    static setDistinctSubject(client, subject, studentClass) {
        return client.multi()
            .set(`pdf_assignment_subject_${studentClass}`, JSON.stringify(subject))
            .expireat(`pdf_assignment_subject_${studentClass}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 24)
            .execAsync();
    }

    static getDistinctChapter(client, studentClass, stuSubject, bookName, limit, page) {
        return client.getAsync(`pdf_assignment_chapter_${studentClass}_${stuSubject}_${bookName}_${limit}_${page}`);
    }

    static setDistinctChapter(client, chapter, studentClass, stuSubject, bookName, limit, page) {
        return client.multi()
            .set(`pdf_assignment_chapter_${studentClass}_${stuSubject}_${bookName}_${limit}_${page}`, JSON.stringify(chapter))
            .expireat(`pdf_assignment_chapter_${studentClass}_${stuSubject}_${bookName}_${limit}_${page}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 24)
            .execAsync();
    }

    static getDistinctBook(client, studentClass, stuSubject, limit, page) {
        return client.getAsync(`pdf_assignment_book_${studentClass}_${stuSubject}_${limit}_${page}`);
    }

    static setDistinctBook(client, book, studentClass, stuSubject, limit, page) {
        return client.multi()
            .set(`pdf_assignment_book_${studentClass}_${stuSubject}_${limit}_${page}`, JSON.stringify(book))
            .expireat(`pdf_assignment_book_${studentClass}_${stuSubject}_${limit}_${page}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 24)
            .execAsync();
    }

    static getStockWordList(client) {
        return client.hgetAsync('meta_info', 'stock_word_list');
    }

    static setPreviousHistory(studentId, data, client) {
        client.multi()
            .set(`${keys.latestQuestionAskHistory}${studentId}`, JSON.stringify(data))
            .expireat(`${keys.latestQuestionAskHistory}${studentId}`, parseInt(new Date().getTime() / 1000) + hash_expiry * 7) // 7days cache
            .execAsync();
        return client.multi()
            .set(`latest_question_ask_history_${studentId}`, JSON.stringify(data))
            .expireat(`latest_question_ask_history_${studentId}`, parseInt(new Date().getTime() / 1000) + hash_expiry * 7) // 7days cache
            .execAsync();
    }

    static getPreviousHistory(student_id, client) {
        return client.getAsync(`latest_question_ask_history_${student_id}`);
    }

    static getLibraryVideos(type1, student_class, id, client) {
        return client.getAsync(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}_${id}`);
    }

    static setLibraryVideos(type1, student_class, id, data, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'EX', 2 * set_expiry)
        return client.multi()
            .set(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}_${id}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}_${id}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 24)
            .execAsync();
    }

    static getVikramSinghCarousel(type1, student_class, id, client) {
        return client.getAsync(`VIKRAM_SIR_CAROUSEL_${type1}_${student_class}_${id}`);
    }

    static setVikramSinghCarousel(type1, student_class, id, data, client) {
        return client.multi()
            .set(`VIKRAM_SIR_CAROUSEL_${type1}_${student_class}_${id}`, JSON.stringify(data))
            .expire(`VIKRAM_SIR_CAROUSEL_${type1}_${student_class}_${id}`, 60 * 10)// 10 minutes
            .execAsync();
    }

    static getByQuestionId(question_id, client) {
        // return client.hgetAsync('questions', question_id);
        return client.hgetAsync(`QUESTION:${question_id}`, 'ANSWER');
    }

    static getByQuestionIdForCatalogQuestions(client, questionId) {
        return client.hgetAsync(`QUESTION:${questionId}`, 'ANSWER');
    }

    static setByQuestionIdForCatalogQuestions(client, questionId, data) {
        return client.hsetAsync(`QUESTION:${questionId}`, 'ANSWER', JSON.stringify(data));
    }

    static getBookMetaData(client, questionId) {
        return client.hgetAsync(`QUESTION:${questionId}`, 'BOOK_META_DOUBT');
    }

    static setBookMetaData(client, questionId, data) {
        return client.hsetAsync(`QUESTION:${questionId}`, 'BOOK_META_DOUBT', data);
    }

    static getQuestionPersonalisationData(client, questionId) {
        return client.hgetAsync(`QUESTION:${questionId}`, 'PERSONALISATION_DATA');
    }

    static setQuestionPersonalisationData(client, questionId, data) {
        return client.hsetAsync(`QUESTION:${questionId}`, 'PERSONALISATION_DATA', JSON.stringify(data));
    }

    static getQuestionOptions(client, questionId) {
        return client.hgetAsync(`QUESTION:${questionId}`, 'OPTIONS');
    }

    static setQuestionOptions(client, questionId, data) {
        return client.hsetAsync(`QUESTION:${questionId}`, 'OPTIONS', JSON.stringify(data));
    }

    static async getQuestionArrOptions(client, questionIdsArray) {
        return Promise.all([...questionIdsArray.map((x) => this.getQuestionOptions(client, x))]);
    }

    static setQuestionArrOptions(client, questionIdsArray, data) {
        const Promises = [];
        for (let index = 0; index < questionIdsArray.length; index++) {
            const question_id = questionIdsArray[index];
            Promises.push(this.setQuestionOptions(client, question_id, data[index]));
        }
        return Promise.all(Promises);
    }

    static setByQuestionId(question, client) {
        console.log('set question in redis');
        // question = question[0]
        // return client.hsetAsync('questions', question[0].question_id, JSON.stringify(question));
        return client.multi()
            .hset(`QUESTION:${question[0].question_id}`, 'QUESTION', JSON.stringify(question))
            .expire(`QUESTION:${question[0].question_id}`, hash_expiry * 30)
            .execAsync();
    }

    static async getByQuestionIdWithUrl(question_id, client) {
        return client.hgetAsync(`QUESTION:${question_id}`, 'URL');
    }

    static setByQuestionIdWithUrl(question, client) {
        return client.multi()
            .hset(`QUESTION:${question[0].question_id}`, 'URL', JSON.stringify(question))
            .expire(`QUESTION:${question[0].question_id}`, hash_expiry * 30)
            .execAsync();
    }

    static getFilteredQuestions(params, client) {
        const redisKey = UtilityV2.getRedisKey(params);
        return client.hgetAsync('web_filter_questions', redisKey);
    }

    static setFilteredQuestions(params, count, client) {
        const redisKey = UtilityV2.getRedisKey(params);
        return client.hsetAsync('web_filter_questions', redisKey, JSON.stringify(count));
    }

    static async getQuestionStatsMultiForHomepage(questionsArray, client) {
        // return await Promise.all(...questionsArray.map((x) => this.getQuestionStats(x, client)));
        const c = client.multi();
        for (let i = 0; i < questionsArray.length; i++) {
            c.get(`{question_stats}:${questionsArray[i].id}`);
            this.getQuestionStats(questionsArray[i]._id, client);
        }
        return c.execAsync();
    }

    static setQuestionsStats(question_id, data, client) {
        return client.multi()
            .hset(`QUESTION:${question_id}`, 'STATS', JSON.stringify(data))
            .expire(`QUESTION:${question_id}`, hash_expiry * 30)
            .execAsync();
    }

    static getQuestionVideoViews(question_id, client) {
        return client.hgetAsync('total_video_views', question_id);
    }

    static setQuestionVideoViews(question_id, v_count, client) {
        return client.hsetAsync('total_video_views', question_id, JSON.stringify(v_count));
    }

    static setUpdatedVideoViews(question_id, new_view, client) {
        return client.hsetAsync('total_video_views', question_id, JSON.stringify(new_view));
    }

    static getQuestionVideoViewsWeb(question_id, client) {
        return client.hgetAsync('total_video_views_web', question_id);
    }

    static setQuestionVideoViewsWeb(question_id, v_count, client) {
        return client.hsetAsync('total_video_views_web', question_id, JSON.stringify(v_count));
    }

    static setUpdatedVideoViewsWeb(question_id, new_view, client) {
        return client.hsetAsync('total_video_views_web', question_id, JSON.stringify(new_view));
    }

    static setUpdatedVideoLikes(question_id, new_view, client) {
        return client.hsetAsync('total_video_likes', question_id, JSON.stringify(new_view));
    }

    static getTotalQuestionsCount(params, client) {
        const redisKey = UtilityV2.getRedisKey(params);
        return client.hgetAsync('web_filter_questions', `${redisKey}_count`);
    }

    static setTotalQuestionsCount(params, count, client) {
        const redisKey = UtilityV2.getRedisKey(params);
        return client.hsetAsync('web_filter_questions', `${redisKey}_count`, JSON.stringify(count));
    }

    static getMcQuestions(mc_id, client) {
        return client.hgetAsync('mc_questions', mc_id);
    }

    static setMcQuestions(mc_id, mcRes, client) {
        return client.hsetAsync('mc_questions', mc_id, JSON.stringify(mcRes));
    }

    static getPackagesByQid(redisKey, client) {
        return client.hgetAsync('packages_byqid', `${redisKey}_packages`);
    }

    static setPackagesByQid(redisKey, data, client) {
        return client.hsetAsync('packages_byqid', `${redisKey}_packages`, JSON.stringify(data));
    }

    static getClassandChapterFromMeta(redisKey, client) {
        return client.hgetAsync('classandchapter_frommeta', `${redisKey}_classandchapter`);
    }

    static setClassandChapterFromMeta(redisKey, data, client) {
        return client.hsetAsync('classandchapter_frommeta', `${redisKey}_classandchapter`, JSON.stringify(data));
    }

    static getClassByQid(qid, table_name, client) {
        return client.hgetAsync('class_byqid', `${qid}_${table_name}_classbyqid`);
    }

    static setClassByQid(qid, table_name, data, client) {
        return client.hsetAsync('class_byqid', `${qid}_${table_name}_classbyqid`, JSON.stringify(data));
    }

    static getMicroconceptsBySubtopics(sclass, chapter, client) {
        return client.hgetAsync('microconcept_bysubtopics', `${sclass}_${chapter}_microconceptbysubtopics`);
    }

    static setMicroconceptsBySubtopics(sclass, chapter, data, client) {
        return client.hsetAsync('microconcept_bysubtopics', `${sclass}_${chapter}_microconceptbysubtopics`, JSON.stringify(data));
    }

    static getDistChapters(course, sclass, client) {
        return client.hgetAsync('dist_chapters', `${course}_${sclass}_distchapters`);
    }

    static setDistChapters(course, sclass, data, client) {
        return client.hsetAsync('dist_chapters', `${course}_${sclass}_distchapters`, JSON.stringify(data));
    }

    static getTrendingVideos(student_class, limit, client) {
        return client.hgetAsync('similarquestion', `${student_class}_${limit}_trending_videos`);
    }

    static setTrendingVideos(student_class, limit, data, client) {
        return client.hsetAsync('similarquestion', `${student_class}_${limit}_trending_videos`, JSON.stringify(data));
    }

    //
    static getTrendingVideoDataType(type1, student_class, client) {
        return client.getAsync(`HOMEPAGE_${type1}_${student_class}`);
    }

    static setTrendingVideoDataType(type1, student_class, data, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'Ex', 24 * set_expiry)
        return client.multi()
            .set(`HOMEPAGE_${type1}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_${type1}_${student_class}`, parseInt(new Date().getTime() / 1000) + trending_expiry / 6)
            .execAsync();
    }

    static getTrendingVideoDataTypeWithTextSolutions(type1, student_class, client) {
        return client.getAsync(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`);
    }

    static setTrendingVideoDataTypeWithTextSolutions(type1, student_class, data, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'Ex', 24 * set_expiry)
        return client.multi()
            .set(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`, parseInt(new Date().getTime() / 1000) + trending_expiry / 6)
            .execAsync();
    }

    static getTipsAndTricksDataType(type1, student_class, client) {
        return client.getAsync(`HOMEPAGE_${type1}_${student_class}`);
    }

    static setTipsAndTricksDataType(type1, student_class, data, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'EX', 6 * set_expiry)
        return client.multi()
            .set(`HOMEPAGE_${type1}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_${type1}_${student_class}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 12)
            .execAsync();
    }

    static getTipsAndTricksDataTypeWithTextSolutions(type1, student_class, client) {
        return client.getAsync(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`);
    }

    static setTipsAndTricksDataTypeWithTextSolutions(type1, student_class, data, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'EX', 6 * set_expiry)
        return client.multi()
            .set(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 12)
            .execAsync();
    }

    static getGeneralKnowledgeDataType(student_class, client) {
        return client.getAsync(`general_knowledge_video_type_${student_class}`);
    }

    static setGeneralKnowledgeDataType(student_class, data, client) {
        return client.set(`general_knowledge_video_type_${student_class}`, JSON.stringify(data), 'EX');
    }

    static getLatestFromDoubtnutDataType(type1, student_class, client) {
        return client.getAsync(`HOMEPAGE_${type1}_${student_class}`);
    }

    static setLatestFromDoubtnutDataType(type1, student_class, data, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'EX', 2 * set_expiry)
        return client.multi()
            .set(`HOMEPAGE_${type1}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_${type1}_${student_class}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 24)
            .execAsync();
    }

    static getLatestFromDoubtnutDataTypeWithTextSolutions(type1, student_class, client) {
        return client.getAsync(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`);
    }

    static setLatestFromDoubtnutDataTypeWithTextSolutions(type1, student_class, data, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'EX', 2 * set_expiry)
        return client.multi()
            .set(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 24)
            .execAsync();
    }

    static getTrickyQuestionsSolutions(type1, student_class, client) {
        return client.getAsync(`HOMEPAGE_${type1}_${student_class}`);
    }

    static setTrickyQuestionsSolutions(type1, student_class, data, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'EX', 2 * set_expiry)
        return client.multi()
            .set(`HOMEPAGE_${type1}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_${type1}_${student_class}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 24)
            .execAsync();
    }

    static getCrashCourseDataType(type1, student_class, client) {
        return client.getAsync(`HOMEPAGE_${type1}_${student_class}`);
    }

    static setCrashCourseDataType(type1, data, student_class, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'EX', 2 * 60 * 60)
        return client.multi()
            .set(`HOMEPAGE_${type1}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_${type1}_${student_class}`, parseInt(new Date().getTime() / 1000) + hash_expiry)
            .execAsync();
    }

    static getCrashCourseDataTypeWithTextSolutions(type1, student_class, client) {
        return client.getAsync(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`);
    }

    static setCrashCourseDataTypeWithTextSolutions(type1, data, student_class, client) {
        // return client.set("HOMEPAGE_" + type1 + "_" + student_class, JSON.stringify(data), 'EX', 2 * 60 * 60)
        return client.multi()
            .set(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_WITH_TEXT_${type1}_${student_class}`, parseInt(new Date().getTime() / 1000) + hash_expiry / 12)
            .execAsync();
    }

    //
    static getVLSVideos(student_class, limit, client) {
        return client.hgetAsync('similarquestion', `${student_class}_${limit}_vls_videos`);
    }

    static setVLSVideos(student_class, limit, data, client) {
        return client.hsetAsync('similarquestion', `${student_class}_${limit}_vls_videos`, JSON.stringify(data));
    }

    static getRecommendedQuestionsList(student_class, limit, client) {
        return client.hgetAsync('similarquestion', `${student_class}_${limit}_recommended_qlist`);
    }

    static setRecommendedQuestionsList(student_class, limit, data, client) {
        return client.hsetAsync('similarquestion', `${student_class}_${limit}_recommended_qlist`, JSON.stringify(data));
    }

    static viralVideos(limit, client) {
        return client.hgetAsync('similarquestion', `${limit}_viral_videos`);
    }

    static setviralVideos(limit, data, client) {
        return client.hsetAsync('similarquestion', `${limit}_viral_videos`, JSON.stringify(data));
    }

    static getViralVideoByForFeed(limit, page, client) {
        return client.hgetAsync('homefeed', `${limit}_${page}_viral_videos`);
    }

    static setViralVideoByForFeed(limit, page, data, client) {
        return client.multi()
            .hset('homefeed', `${limit}_${page}_viral_videos`, JSON.stringify(data))
            .expireat(`${limit}_${page}_viral_videos`, parseInt(new Date().getTime() / 1000) + hash_expiry)
            .execAsync();
    }

    static getDistinctDate(client) {
        const redisKey = 'jee_mains_2019_date_list';
        return client.hgetAsync('jee_mains_2019_dates', redisKey);
    }

    static setDistinctDate(dateList, client) {
        const redisKey = 'jee_mains_2019_date_list';
        return client.hsetAsync('jee_mains_2019_dates', redisKey, JSON.stringify(dateList));
    }

    static getDistinctShift(dateVal, client) {
        const redisKey = `${dateVal}_shifts`;
        return client.hgetAsync('jee_mains_2019_shift', redisKey);
    }

    static setDistinctShift(dateVal, shiftList, client) {
        const redisKey = `${dateVal}_shifts`;
        return client.hsetAsync('jee_mains_2019_shift', redisKey, JSON.stringify(shiftList));
    }

    static getQuestionsList(dateVal, shiftVal, page, client) {
        let redisKey = 'question_list';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        redisKey += `_${page}`;
        return client.hgetAsync('jee_mains_2019_questions', redisKey);
    }

    static setQuestionsList(dateVal, shiftVal, questionList, page, client) {
        let redisKey = 'question_list';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        redisKey += `_${page}`;
        return client.hsetAsync('jee_mains_2019_questions', redisKey, JSON.stringify(questionList));
    }

    static getDistinctDateAnswer(client) {
        const redisKey = 'jee_mains_2019_date_list';
        return client.hgetAsync('jee_mains_2019_dates_answer', redisKey);
    }

    static setDistinctDateAnswer(dateList, client) {
        const redisKey = 'jee_mains_2019_date_list';
        return client.hsetAsync('jee_mains_2019_dates_answer', redisKey, JSON.stringify(dateList));
    }

    static getDistinctShiftAnswer(dateVal, client) {
        const redisKey = `${dateVal}_shifts`;
        return client.hgetAsync('jee_mains_2019_shift_answer', redisKey);
    }

    static setDistinctShiftAnswer(dateVal, shiftList, client) {
        const redisKey = `${dateVal}_shifts`;
        return client.hsetAsync('jee_mains_2019_shift_answer', redisKey, JSON.stringify(shiftList));
    }

    static getQuestionsListAnswer(dateVal, shiftVal, page, client) {
        let redisKey = 'question_list';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        redisKey += `_${page}`;
        return client.hgetAsync('jee_mains_2019_questions_answer', redisKey);
    }

    static setQuestionsListAnswer(dateVal, shiftVal, questionList, page, client) {
        let redisKey = 'question_list';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        redisKey += `_${page}`;
        return client.hsetAsync('jee_mains_2019_questions_answer', redisKey, JSON.stringify(questionList));
    }

    static getDistMicroClasses(client) {
        const redisKey = 'distinct_classes';
        return client.hgetAsync('microconcept_class', redisKey);
    }

    static setDistMicroClasses(distClasses, client) {
        const redisKey = 'distinct_classes';
        return client.hsetAsync('microconcept_class', redisKey, JSON.stringify(distClasses));
    }

    static getDistMicroCourses(class_id, client) {
        const redisKey = `distinct_courses_${class_id}`;
        return client.hgetAsync('microconcept_course', redisKey);
    }

    static setDistMicroCourses(class_id, distCourses, client) {
        const redisKey = `distinct_courses_${class_id}`;
        return client.hsetAsync('microconcept_course', redisKey, JSON.stringify(distCourses));
    }

    static getDistMicroChapters(class_id, course, client) {
        const redisKey = `distinct_chapters_${class_id}_${course}`;
        return client.hgetAsync('microconcept_chapter', redisKey);
    }

    static setDistMicroChapters(class_id, course, distChapters, client) {
        const redisKey = `distinct_chapters_${class_id}_${course}`;
        return client.hsetAsync('microconcept_chapter', redisKey, JSON.stringify(distChapters));
    }

    static getDistMicroSubtopics(class_id, course, chapter, client) {
        const redisKey = `distinct_subtopics_${class_id}_${course}_${chapter}`;
        return client.hgetAsync('microconcept_subtpic', redisKey);
    }

    static setDistMicroSubtopics(class_id, course, chapter, distSubtopics, client) {
        const redisKey = `distinct_subtopics_${class_id}_${course}_${chapter}`;
        return client.hsetAsync('microconcept_subtpic', redisKey, JSON.stringify(distSubtopics));
    }

    static getMicroQuestions(class_id, course, chapter, subtopic, page, client) {
        let redisKey = 'qlist';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            redisKey += `_${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                redisKey += `_${course}`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    redisKey += `_${chapter}`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        redisKey += `_${subtopic}`;
                    }
                }
            }
        }
        redisKey += `_${page}`;
        return client.hgetAsync('microconcept_qdata', redisKey);
    }

    static setMicroQuestions(class_id, course, chapter, subtopic, page, microQuestionsList, client) {
        let redisKey = 'qlist';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            redisKey += `_${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                redisKey += `_${course}`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    redisKey += `_${chapter}`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        redisKey += `_${subtopic}`;
                    }
                }
            }
        }
        redisKey += `_${page}`;
        return client.hsetAsync('microconcept_qdata', redisKey, JSON.stringify(microQuestionsList));
    }

    static getMicroQuestionsCount(class_id, course, chapter, subtopic, client) {
        let redisKey = 'qListCount';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            redisKey += `_${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                redisKey += `_${course}`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    redisKey += `_${chapter}`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        redisKey += `_${subtopic}`;
                    }
                }
            }
        }
        return client.hgetAsync('microconcept_qdata_count', redisKey);
    }

    static setMicroQuestionsCount(class_id, course, chapter, subtopic, microQuestionsCount, client) {
        let redisKey = 'qListCount';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            redisKey += `_${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                redisKey += `_${course}`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    redisKey += `_${chapter}`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        redisKey += `_${subtopic}`;
                    }
                }
            }
        }
        return client.hsetAsync('microconcept_qdata_count', redisKey, JSON.stringify(microQuestionsCount));
    }

    static getViralVideoByForFeedLocalisation(version, limit, page, client) {
        console.log(`${limit}_${page}_viral_videos_${version}`);
        return client.hgetAsync('homefeed', `${limit}_${page}_viral_videos_${version}`);
    }

    static setViralVideoByForFeedLocalisation(version, limit, page, data, client) {
        return client.multi()
            .hset('homefeed', `${limit}_${page}_viral_videos_${version}`, JSON.stringify(data))
            .expireat(`${limit}_${page}_viral_videos_${version}`, parseInt(new Date().getTime() / 1000) + hash_expiry)
            .execAsync();
    }

    static getViralVideoByForFeedLocalisationV4(version, limit, page, client) {
        console.log(`${limit}_${page}_viral_videos_${version}`);
        return client.hgetAsync('homefeed_v4', `${limit}_${page}_viral_videos_${version}`);
    }

    static setViralVideoByForFeedLocalisationV4(version, limit, page, data, client) {
        return client.multi()
            .hset('homefeed_v4', `${limit}_${page}_viral_videos_${version}`, JSON.stringify(data))
            .expireat(`${limit}_${page}_viral_videos_${version}`, parseInt(new Date().getTime() / 1000) + hash_expiry)
            .execAsync();
    }

    static getViralVideoWeb(limit, client) {
        return client.hgetAsync('video_viral_web', `viral_videos_${limit}`);
    }

    static setViralVideoWeb(limit, data, client) {
        return client.multi()
            .hset('video_viral_web', `viral_videos_${limit}`, JSON.stringify(data))
            .expireat(`viral_videos_${limit}`, parseInt(new Date().getTime() / 1000) + hash_expiry)
            .execAsync();
    }

    static getQuestionByIdWebLocalised(qid, client) {
        return client.hgetAsync('matched_details', qid);
    }

    static setQuestionByIdWebLocalised(qid, data, client) {
        return client.hsetAsync('matched_details', qid, JSON.stringify(data));
    }

    static getFilteredQuestionsLocalised(locale_val, version, params, client) {
        const redisKey = `${UtilityV2.getRedisKey(params)}_${version}`;
        // if (locale_val != '') {
        //     rediskey += `_${locale_val}`;
        // }
        return client.hgetAsync('web_filter_questions', redisKey);
    }

    static setFilteredQuestionsLocalised(locale_val, version, params, count, client) {
        const redisKey = `${UtilityV2.getRedisKey(params)}_${version}`;
        // if (locale_val != '') {
        //     rediskey += `_${locale_val}`;
        // }
        return client.hsetAsync('web_filter_questions', redisKey, JSON.stringify(count));
    }

    static getTotalQuestionsCountLocalised(locale_val, version, params, client) {
        const redisKey = `${UtilityV2.getRedisKey(params)}_${version}`;
        // if (locale_val != '') {
        //     rediskey += `_${locale_val}`;
        // }
        return client.hgetAsync('web_filter_questions', `${redisKey}_count`);
    }

    static setTotalQuestionsCountLocalised(locale_val, version, params, count, client) {
        const redisKey = `${UtilityV2.getRedisKey(params)}_${version}`;
        // if (locale_val != '') {
        //     rediskey += `_${locale_val}`;
        // }
        return client.hsetAsync('web_filter_questions', `${redisKey}_count`, JSON.stringify(count));
    }

    static getByQuestionIdLocalised(locale_val, version, question_id, client) {
        let redisKey = `${question_id}_${version}`;
        if (locale_val == 'hindi') {
            redisKey += `_${locale_val}`;
        }
        return client.hgetAsync('questions', redisKey);
    }

    static setByQuestionIdLocalised(locale_val, version, question, client) {
        let redisKey = `${question[0].question_id}_${version}`;
        if (locale_val == 'hindi') {
            redisKey += `_${locale_val}`;
        }
        return client.hsetAsync('questions', redisKey, JSON.stringify(question));
    }

    static getMicroconceptsBySubtopicsLocalised(locale_val, version, sclass, chapter, client) {
        let redisKey = `${sclass}_${chapter}_microconceptbysubtopics_${version}`;
        if (locale_val == 'hindi') {
            redisKey += `_${locale_val}`;
        }
        return client.hgetAsync('microconcept_bysubtopics', redisKey);
    }

    static setMicroconceptsBySubtopicsLocalised(locale_val, version, sclass, chapter, data, client) {
        let redisKey = `${sclass}_${chapter}_microconceptbysubtopics_${version}`;
        if (locale_val == 'hindi') {
            redisKey += `_${locale_val}`;
        }
        return client.hsetAsync('microconcept_bysubtopics', redisKey, JSON.stringify(data));
    }

    static getMicroQuestionsV3(class_id, course, chapter, subtopic, page, client) {
        let redisKey = 'qlist';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            redisKey += `_${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                redisKey += `_${course}`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    redisKey += `_${chapter}`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        redisKey += `_${subtopic}`;
                    }
                }
            }
        }
        redisKey += `_${page}`;
        return client.hgetAsync('microconcept_qdata_v3', redisKey);
    }

    static setMicroQuestionsV3(class_id, course, chapter, subtopic, page, microQuestionsList, client) {
        let redisKey = 'qlist';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            redisKey += `_${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                redisKey += `_${course}`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    redisKey += `_${chapter}`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        redisKey += `_${subtopic}`;
                    }
                }
            }
        }
        redisKey += `_${page}`;
        return client.hsetAsync('microconcept_qdata_v3', redisKey, JSON.stringify(microQuestionsList));
    }

    static getMicroQuestionsCountV3(class_id, course, chapter, subtopic, client) {
        let redisKey = 'qListCount';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            redisKey += `_${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                redisKey += `_${course}`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    redisKey += `_${chapter}`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        redisKey += `_${subtopic}`;
                    }
                }
            }
        }
        return client.hgetAsync('microconcept_qdata_count_v3', redisKey);
    }

    static setMicroQuestionsCountV3(class_id, course, chapter, subtopic, microQuestionsCount, client) {
        let redisKey = 'qListCount';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            redisKey += `_${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                redisKey += `_${course}`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    redisKey += `_${chapter}`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        redisKey += `_${subtopic}`;
                    }
                }
            }
        }
        return client.hsetAsync('microconcept_qdata_count_v3', redisKey, JSON.stringify(microQuestionsCount));
    }

    static getDistinctDateNew(client) {
        const redisKey = 'jee_mains_2019_date_list';
        return client.hgetAsync('jee_mains_2019_dates_v3', redisKey);
    }

    static setDistinctDateNew(dateList, client) {
        const redisKey = 'jee_mains_2019_date_list';
        return client.hsetAsync('jee_mains_2019_dates_v3', redisKey, JSON.stringify(dateList));
    }

    static getDistinctShiftNew(dateVal, client) {
        const redisKey = `${dateVal}_shifts`;
        return client.hgetAsync('jee_mains_2019_shift_v3', redisKey);
    }

    static setDistinctShiftNew(dateVal, shiftList, client) {
        const redisKey = `${dateVal}_shifts`;
        return client.hsetAsync('jee_mains_2019_shift_v3', redisKey, JSON.stringify(shiftList));
    }

    static getQuestionsListNew(dateVal, shiftVal, page, client) {
        let redisKey = 'question_list';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        redisKey += `_${page}`;
        return client.hgetAsync('jee_mains_2019_questions_v3', redisKey);
    }

    static setQuestionsListNew(dateVal, shiftVal, questionList, page, client) {
        let redisKey = 'question_list';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        redisKey += `_${page}`;
        return client.hsetAsync('jee_mains_2019_questions_v3', redisKey, JSON.stringify(questionList));
    }

    static getTotalQuestionsCountRedisNew(dateVal, shiftVal, client) {
        let redisKey = 'question_list_count';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        console.log(redisKey);
        return client.hgetAsync('jee_mains_2019_questions_count_v3', redisKey);
    }

    static setTotalQuestionsCountRedisNew(dateVal, shiftVal, questionListCount, client) {
        let redisKey = 'question_list_count';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        console.log(redisKey);
        return client.hsetAsync('jee_mains_2019_questions_count_v3', redisKey, JSON.stringify(questionListCount));
    }

    static getDistinctShiftAnswerNew(dateVal, client) {
        const redisKey = `${dateVal}_shifts`;
        return client.hgetAsync('jee_mains_2019_shift_answer_v3', redisKey);
    }

    static setDistinctShiftAnswerNew(dateVal, shiftList, client) {
        const redisKey = `${dateVal}_shifts`;
        return client.hsetAsync('jee_mains_2019_shift_answer_v3', redisKey, JSON.stringify(shiftList));
    }

    static getQuestionsListAnswerNew(dateVal, shiftVal, page, client) {
        let redisKey = 'question_list';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        redisKey += `_${page}`;
        return client.hgetAsync('jee_mains_2019_questions_answer_v3', redisKey);
    }

    static setQuestionsListAnswerNew(dateVal, shiftVal, questionList, page, client) {
        let redisKey = 'question_list';
        if (dateVal != '' && shiftVal != '') {
            redisKey += `_${dateVal}_${shiftVal}`;
        } else if (dateVal != '' && shiftVal == '') {
            redisKey += `_${dateVal}`;
        }
        redisKey += `_${page}`;
        return client.hsetAsync('jee_mains_2019_questions_answer_v3', redisKey, JSON.stringify(questionList));
    }

    static getTextSolution(qid, client) {
        return client.hgetAsync('text_solution', qid);
    }

    static setTextSolution(qid, textSolution, client) {
        return client.hsetAsync('text_solution', qid, JSON.stringify(textSolution));
    }

    static getPageContent(locale_val, version, params, client) {
        const redisKey = `${UtilityV2.getRedisKey(params)}_${version}`;
        // if (locale_val != '') {
        //     rediskey += `_${locale_val}`;
        // }
        return client.hgetAsync('web_filter_content', redisKey);
    }

    static setPageContent(locale_val, version, params, count, client) {
        const redisKey = `${UtilityV2.getRedisKey(params)}_${version}`;
        // if (locale_val != '') {
        //     rediskey += `_${locale_val}`;
        // }
        return client.hsetAsync('web_filter_content', redisKey, JSON.stringify(count));
    }

    static getQuestionAskMeta(question_id, client) {
        return client.hgetAsync('question_ask_meta', question_id);
    }

    static setQuestionAskMeta(question_id, data, client) {
        return client.hsetAsync('question_ask_meta', question_id, JSON.stringify(data));
    }

    static async getLocalisedQuestion(question_id, language, client) {
        return client.hgetAsync(`QUESTION:${question_id}`, `Q:${language}`);
    }

    static setLocalisedQuestion(question_id, language, data, client) {
        return client.multi()
            .hset(`QUESTION:${question_id}`, `Q:${language}`, JSON.stringify(data))
            .expire(`QUESTION:${question_id}`, hash_expiry * 30)
            .execAsync();
    }

    static getChapterOrder(className, chapter, client) {
        return client.hgetAsync('chapter_order', `${className} ${chapter}`);
    }

    static setChapterOrder(className, chapter, order, client) {
        return client.hsetAsync('chapter_order', `${className} ${chapter}`, JSON.stringify(order));
    }

    static async getLocalisedQuestionMulti(questionsArray, language, client) {
        return Promise.all([...questionsArray.map((x) => this.getLocalisedQuestion(x._id, language, client))]);
    }

    static getLocalisedQuestionMget(client, questionsArray, language) {
        return Promise.all([...questionsArray.map((x) => this.getLocalisedQuestion(x._id, language, client))]);
    }

    static async getQuestionHtml(client, questionId) {
        return client.hgetAsync(`QUESTION:${questionId}`, 'HTML');
    }

    static getQuestionHtmlMget(client, questionsArray) {
        return Promise.all([...questionsArray.map((x) => this.getQuestionHtml(client, x))]);
    }

    static setQuestionHtml(client, questionId, data) {
        return client.multi()
            .hset(`QUESTION:${questionId}`, 'HTML', JSON.stringify(data))
            .expire(`QUESTION:${questionId}`, hash_expiry * 30)
            .execAsync();
    }

    static getQuestionStatsMulti(questionsArray, client) {
        return Promise.all([...questionsArray.map((x) => this.getQuestionStats(x._id, client))]);
    }

    static getQuestionStatsMget(client, questionsArray) {
        return Promise.all([...questionsArray.map((x) => this.getQuestionStats(x._id, client))]);
    }

    static getQuestionStats(questionId, client) {
        return client.hgetAsync(`QUESTION:${questionId}`, 'STATS');
    }

    static getStudentQuestion(student_id, filename, client) {
        console.log(`${student_id}_${filename}`);
        return client.hgetAsync('student_question_ask', `${student_id}_${filename}`);
    }

    static setStudentQuestion(file_name, ocr_data, student_id, client) {
        // get student_id
        return client.hsetAsync('student_question_ask', `${student_id}_${file_name}`, JSON.stringify(ocr_data));
    }

    static getRelatedConceptVideo(question_id, client) {
        return client.hgetAsync(`QUESTION:${question_id}`, 'related_concepts1');
    }

    static setRelatedConceptVideo(question_id, answer, client) {
        return client.hsetAsync(`QUESTION:${question_id}`, 'related_concepts1', JSON.stringify(answer));
    }

    static getTagList(question_id, client) {
        return client.hgetAsync('structured_tags', question_id);
    }

    static setTagList(question_id, taglist, client) {
        return client.hsetAsync('structured_tags', question_id, JSON.stringify(taglist));
    }

    static getTotalViewsMulti(questionsArray, client) {
        return Promise.all([...questionsArray.map((x) => this.getQuestionStats(client, x._id))]);
    }

    static setSimilarQuestionFromBookMeta(client, doubt, data) {
        client.setAsync(`QUESTION_SIMILAR:${doubt}`, JSON.stringify(data), 'Ex', hash_expiry * 30);
        return client.hsetAsync('question_similar', doubt, JSON.stringify(data));
    }

    static async getSimilarQuestionFromBookMeta(client, doubt) {
        let data = await client.getAsync(`QUESTION_SIMILAR:${doubt}`);
        if (data) {
            return data;
        }
        data = await client.hgetAsync('question_similar', doubt);
        if (data) {
            client.setAsync(`QUESTION_SIMILAR:${doubt}`, data, 'Ex', hash_expiry * 30);
        }
        return data;
    }

    static setQuestionAskedCount(client, studentId, count) {
        return client.hsetAsync(keys.questionAskedCount, studentId, count);
    }

    static incQuestionAskedCount(client, studentId, incBy = 1) {
        return client.hincrbyAsync(keys.questionAskedCount, studentId, incBy);
    }

    static incSearchServiceRequestsCount(client, key, incBy = 1) {
        return client.multi()
            .hincrby(key, 'requests_sent', incBy)
            .expire(key, flash_expiry)
            .execAsync();
    }

    static incSearchServiceResolvedCount(client, key, incBy = 1) {
        return client.multi()
            .hincrby(key, 'requests_resolved', incBy)
            .expire(key, flash_expiry)
            .execAsync();
    }

    static incSearchServiceRejectedCount(client, key, incBy = 1) {
        return client.multi()
            .hincrby(key, 'requests_rejected', incBy)
            .expire(key, flash_expiry)
            .execAsync();
    }

    static getSearchServiceRequestsCounter(client, key) {
        return client.hgetAsync(key, 'requests_sent');
    }

    static getSearchServiceResolvedRequestsCounter(client, key) {
        return client.hgetAsync(key, 'requests_resolved');
    }

    static getSearchServiceRequestsMetrics(client, key) {
        return client.hgetallAsync(key);
    }

    static getSearchServiceTripFlag(client, key) {
        return client.getAsync(key);
    }

    static setSearchServiceTripFlag(client, key, flag, duration) {
        return client.setAsync(key, flag, 'EX', duration);
    }

    static getQuestionAskedCount(client, studentId) {
        return client.hgetAsync(keys.questionAskedCount, studentId);
    }

    static getEtoosQuestionsByMcID(client, mcID) {
        return client.getAsync(`etoos_mc_${mcID}`);
    }

    static setEtoosQuestionsByMcID(client, mcID, data) {
        return client.setAsync(`etoos_mc_${mcID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24);
    }

    static getStudentArrayPackageLang(client, studentIdArr) {
        const c = client.multi();
        for (let i = 0; i < studentIdArr.length; i++) {
            c.hget('package_mapping', studentIdArr[i]);
        }
        return c.execAsync();
    }

    static setStudentArrayPackageLang(client, results) {
        const c = client.multi();
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            c.hset('package_mapping', result.student_id, result.package_language);
        }
        return c.execAsync();
    }

    static getChapterDataByQid(client, qId) {
        return client.getAsync(`QUESTIONS_CHAPTER_DATA_${qId}`);
    }

    static setChapterDataByQid(client, qId, data) {
        return client.set(`QUESTIONS_CHAPTER_DATA_${qId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 2);
    }

    static getPersonalizedMicroconcepts(client, studentId) {
        return client.getAsync(`QUESTIONS_PERSONALIZATION_LIVE_CLASS_${studentId}`);
    }

    static setPersonalizedMicroconcepts(client, studentId, data) {
        return client.set(`QUESTIONS_PERSONALIZATION_LIVE_CLASS_${studentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 4);
    }

    static getPersonalizedBooks(client, studentId) {
        return client.getAsync(`QUESTIONS_PERSONALIZATION_BOOKS_${studentId}`);
    }

    static setPersonalizedBooks(client, studentId, data) {
        return client.set(`QUESTIONS_PERSONALIZATION_LIVE_BOOKS_${studentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 4);
    }

    static getUserRecentAskedQuestions(client, student_id) {
        return client.lrangeAsync(`questions_asked_by_${student_id}`, 0, -1);
    }

    static setUserRecentAskedQuestions(client, student_id, questions) {
        return client.multi()
            .del(`questions_asked_by_${student_id}`)
            .lpush(`questions_asked_by_${student_id}`, ...questions.map((obj) => JSON.stringify(obj)))
            .execAsync();
    }

    static populateQuestionAskedPersonalisationData(client, student_id, data) {
        return client.multi()
            .lpush(`questions_asked_by_${student_id}`, JSON.stringify(data))
            .ltrim(`questions_asked_by_${student_id}`, 0, 10)
            .execAsync();
    }

    static populateVideosWatchedPersonalisationData(client, student_id, data, data_limit) {
        return client.multi()
            .lpush(`videos_watched_by_${student_id}`, JSON.stringify(data))
            .ltrim(`videos_watched_by_${student_id}`, 0, data_limit)
            .execAsync();
    }

    static setUserRecentVideosWatched(client, student_id, data) {
        return client.multi()
            .del(`videos_watched_by_${student_id}`)
            .lpush(`videos_watched_by_${student_id}`, ...data.map((obj) => JSON.stringify(obj)))
            .execAsync();
    }

    static getUserRecentVideosWatched(client, student_id) {
        return client.lrangeAsync(`videos_watched_by_${student_id}`, 0, -1);
    }

    // playlist in homepage redis starts ===

    static getSimilarQuestionsList(client, question_id, keyName) {
        const redisKey = `QUESTION:${question_id}`;
        return client.hgetAsync(redisKey, keyName);
    }

    static setSimilarQuestionsList(client, question_id, keyName, data) {
        const redisKey = `QUESTION:${question_id}`;
        return client.hsetAsync(redisKey, keyName, JSON.stringify(data));
    }

    static getStudentLastQuestion(client, student_id, redisKey) {
        const key = `USER:PROFILE:${student_id}`;
        return client.hgetAsync(key, redisKey);
    }

    static setStudentLastQuestion(client, student_id, redisKey, data) {
        const key = `USER:PROFILE:${student_id}`;
        return client.hsetAsync(key, redisKey, data);
    }

    static getStudentLastViewedQuestion(client, student_id, redisKey) {
        const key = `USER:PROFILE:${student_id}`;
        return client.hgetAsync(key, redisKey);
    }

    static setStudentLastViewedQuestion(client, student_id, redisKey, data) {
        const key = `USER:PROFILE:${student_id}`;
        return client.hsetAsync(key, redisKey, JSON.stringify(data));
    }

    // playlist in homepage redis ends ===

    static getSimilarSuggestions(client, question_id) {
        const redisKey = `SIMILAR_ELASTIC_SUGG_${question_id}`;
        return client.getAsync(redisKey);
    }

    static setSimilarSuggestions(client, question_id, data) {
        const redisKey = `SIMILAR_ELASTIC_SUGG_${question_id}`;
        return client.setAsync(redisKey, JSON.stringify(data), 'Ex', 60 * 60 * 24);
    }

    static getNcertLastWatchedDetails(client, redisKey, student_id) {
        const key = `USER:PROFILE:${student_id}`;
        return client.hgetAsync(key, redisKey);
    }

    static setNcertLastWatchedDetails(client, redisKey, student_id, data) {
        const key = `USER:PROFILE:${student_id}`;
        return client.hsetAsync(key, redisKey, data);
    }

    static getQuestionIDInTopFreeClasses(client, questionID) {
        return client.hgetAsync(`QUESTION:${questionID}`, 'TOP_FREE_CLASS');
    }

    static setQuestionIDInTopFreeClasses(client, questionID, data) {
        const redisData = (data && data.length > 0) ? 1 : 0;
        return client.hsetAsync(`QUESTION:${questionID}`, 'TOP_FREE_CLASS', JSON.stringify(redisData));
    }

    static getPlaylistIdClassWise(client, studentClass) {
        return client.getAsync(`NCERT_PLAYLIST_ID:${studentClass}`);
    }

    static setPlaylistIdClassWise(client, studentClass, playlistId) {
        return client.setAsync(`NCERT_PLAYLIST_ID:${studentClass}`, playlistId, 'Ex', hash_expiry * 7);
    }

    // daily feed starts =========

    static getTopicVideoQuestion(client, student_id, redisKey) {
        const key = `DDF:${student_id}`;
        return client.hgetAsync(key, redisKey);
    }

    static setTopicVideoQuestion(client, student_id, redisKey, data) {
        return client.multi()
            .hset(`DDF:${student_id}`, redisKey, data)
            .expire(`DDF:${student_id}`, UtilityV2.getTimeDiff())
            .execAsync();
    }

    static getTopicVideoList(client, student_id, redisKey) {
        const key = `DDF:${student_id}`;
        return client.hgetAsync(key, redisKey);
    }

    static setTopicVideoList(client, student_id, redisKey, data) {
        return client.multi()
            .hset(`DDF:${student_id}`, redisKey, JSON.stringify(data))
            .expire(`DDF:${student_id}`, UtilityV2.getTimeDiff())
            .execAsync();
    }

    static getCompletedTopicList(client, student_id, redisKey) {
        const key = `DDF:${student_id}`;
        return client.hgetAsync(key, redisKey);
    }

    static setCompletedTopicList(client, student_id, redisKey, data) {
        const key = `DDF:${student_id}`;
        return client.multi()
            .hset(key, redisKey, JSON.stringify(data))
            .expire(key, UtilityV2.getTimeDiff())
            .execAsync();
    }

    // daily feed ends =========

    // NCERT playlist redis data starts ==========

    static getFirstVideoOfPlaylist(client, playlistId) {
        const redisKey = `NCERT_QUESTION_DETAILS:${playlistId}`;
        return client.getAsync(redisKey);
    }

    static setFirstVideoOfPlaylist(client, playlistId, data) {
        const redisKey = `NCERT_QUESTION_DETAILS:${playlistId}`;
        return client.multi()
            .set(redisKey, JSON.stringify(data))
            .expire(redisKey, hash_expiry * 7)
            .execAsync();
    }

    // NCERT playlist redis data ends ==========

    static getVideoPageBranchDeeplinkFromAppDeeplink(client, questionID) {
        return client.hgetAsync(`QUESTION:${questionID}`, 'BRANCH_VIDEO_PAGE_DEEPLINK');
    }

    static setVideoPageBranchDeeplinkFromAppDeeplink(client, questionID, data) {
        return client.hsetAsync(`QUESTION:${questionID}`, 'BRANCH_VIDEO_PAGE_DEEPLINK', JSON.stringify(data));
    }

    static getLanguageBreadcrumbs(client) {
        return client.getAsync('WEB_BREADCRUMBS_LANGUAGES');
    }

    static getClassesBreadcrumbsUsingLanguage(client, language) {
        return client.getAsync(`WEB_BREADCRUMBS_LANGUAGE_CLASSES:${language}`);
    }

    static getSubjectBreadcrumbsFromLanguageClass(client, language, studentClass) {
        return client.getAsync(`WEB_BREADCRUMBS_CLASSES_SUBJECTS:${language}:${studentClass}`);
    }

    static getChapterBreadcrumbsFromLanguageClassSubject(client, language, studentClass, subject) {
        return client.getAsync(`WEB_BREADCRUMBS_SUBJECT_CHAPTERS:${language}:${studentClass}:${subject}`);
    }

    static getQuestionIDsFromLanguageClassSubjectChapter(client, language, studentClass, subject, chapter) {
        return client.getAsync(`WEB_BREADCRUMBS_CHAPTER_VIDEOS:${language}:${studentClass}:${subject}:${chapter}`);
    }

    static getQuestionIDsFromLanguageClassSubjectChapterTrans(client, language, studentClass, subject, chapter) {
        return client.getAsync(`WEB_BREADCRUMBS_CHAPTER_TRANS_VIDEOS:${language}:${studentClass}:${subject}:${chapter}`);
    }

    static setLanguageMapping(client, data) {
        return client.multi()
            .set('LANG_MAPPING', JSON.stringify(data))
            .expire('LANG_MAPPING', parseInt(hash_expiry * 30))
            .execAsync();
    }

    static getLanguageMapping(client) {
        return client.getAsync('LANG_MAPPING');
    }

    static getQuestionPackageInfo(client, studentId) {
        return client.getAsync(`STUDENTID_PACKAGE_MAPPING_NEW:${studentId}`);
    }

    static setQuestionPackageInfo(client, studentId, data) {
        return client.setAsync(`STUDENTID_PACKAGE_MAPPING_NEW:${studentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 7); // 7 days
    }

    static getChapterAlias(client, chapter) {
        chapter = chapter.split(' ').join('_');
        return client.getAsync(chapter);
    }

    static setChapterAlias(client, chapter, chapterAlias) {
        chapter = chapter.split(' ').join('_');
        return client.multi()
            .set(chapter, chapterAlias)
            .expire(chapter, parseInt(hash_expiry * 7))
            .execAsync();
    }

    static getSrpCache(client, key) {
        return client.getAsync(key);
    }

    static setSrpCache(client, key, data) {
        return client.multi()
            .set(key, JSON.stringify(data))
            .expire(key, 60 * 45)
            .execAsync();
    }

    static getLiveDataByplaylistId(client, playlistId) {
        return client.getAsync(`jee_foundation_${playlistId}`);
    }

    static setLiveDataByplaylistId(client, playlistId, dataList) {
        return client.multi()
            .set(`jee_foundation_${playlistId}`, JSON.stringify(dataList))
            .expire(`jee_foundation_${playlistId}`, 60 * 60)
            .execAsync();
    }

    static getAssignedDuplicateQidsPublicPanel(client) {
        const { key } = keys.assigned_qids_public_panel;
        return client.lrangeAsync(key, 0, -1);
    }

    static setAssignedDuplicateQidsPublicPanel(client, qid) {
        const { key, expiry } = keys.assigned_qids_public_panel;
        return client.multi()
            .lpush(key, qid)
            .expire(key, expiry)
            .execAsync();
    }

    static deleteAssignedDuplicateQidsPublicPanel(client, qid) {
        const { key } = keys.assigned_qids_public_panel;
        return client.lrem(key, 1, qid);
    }

    static getVideoPageQidsByTableId(client, id) {
        return client.getAsync(`videopage:table:${id}`);
    }

    static getQidThumbnailExperimentData(client, qid) {
        return client.hgetAsync(`QUESTION:${qid}`, 'NEW_THUMBNAIL_EXP_DATA');
    }

    static setQidThumbnailExperimentData(client, qid, data) {
        return client.hsetAsync(`QUESTION:${qid}`, 'NEW_THUMBNAIL_EXP_DATA', JSON.stringify(data));
    }

    static getViserBatchRequestDetails(client, hashKey) {
        return client.hgetallAsync(hashKey);
    }

    static hsetBatchApiRequestDetails(client, hashKey, details) {
        return client.multi()
            .hset(hashKey, ...Object.entries(details))
            .expire(hashKey, keys.viserOcrBatchRequestsProcessing.expiry)
            .execAsync();
    }

    // TESTING .. seq flow
    static getQuestionAskRequestsIdTracker(client) {
        return client.getAsync('QUESTION_ID_REQUESTS_TRACKER');
    }

    // TESTING .. seq flow
    static setQuestionAskRequestsIdTracker(client, counter) {
        return client.setAsync('QUESTION_ID_REQUESTS_TRACKER', counter, 'EX', 60 * 60);
    }

    // TESTING .. seq flow
    static increaseQuestionAskRequestsIdTracker(client, incrVal = 1) {
        return client.incrby('QUESTION_ID_REQUESTS_TRACKER', incrVal);
    }

    static registerOcrRequestInRedis(client, hashKey, details) {
        return client.multi()
            .hset(hashKey, ...Object.entries(details))
            .hincrby(hashKey, 'poolCount', 1)
            .expire(hashKey, keys.viserOcrBatchRequestsProcessing.expiry)
            .execAsync();
    }

    static incrementViserApiCallCount(client, date) {
        const hashKey = `${date}:${keys.viserApiCallCounter.keySuffix}`;
        return client.multi()
            .incrby(hashKey, 1)
            .expire(hashKey, keys.viserApiCallCounter.expiry)
            .execAsync();
    }
};
