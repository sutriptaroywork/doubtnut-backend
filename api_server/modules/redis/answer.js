const _ = require('lodash');
const Data = require('../../data/data');
const { getRandomCDNUrl } = require('../../server/helpers/buildStaticCdnUrl');

const hashExpiry = 60 * 60 * 24; // 1 day
const cdnList = Data.cdns;
const cdnUrlMapping = Data.cdn_url_mapping;

module.exports = class Answer {
    static getByQuestionId(question_id, client) {
        return client.hgetAsync(`QUESTION:${question_id}`, 'ANSWER');
    }

    static setByQuestionId(answer, client) {
        return client.multi()
            .hset(`QUESTION:${answer[0].question_id}`, 'ANSWER', JSON.stringify(answer))
            .expire(`QUESTION:${answer[0].question_id}`, hashExpiry * 30)
            .execAsync();
    }

    static getByMcId(mc_id, client) {
        return client.hgetAsync('answers_mc', mc_id);
    }

    static setByMcId(answer, client) {
        console.log('set question in redis');
        return client.hsetAsync('answers_mc', answer[0].doubt, JSON.stringify(answer));
    }

    static getByMcIdWithTextSolution(mc_id, client) {
        return client.hgetAsync('answers_mc_with_text_solution', mc_id);
    }

    static setByMcIdWithTextSolution(answer, client) {
        console.log('set question in redis');
        return client.hsetAsync('answers_mc_with_text_solution', answer[0].doubt, JSON.stringify(answer));
    }

    static deleteByMcIdWithTextSolution(mc_id, client) {
        return client.hdelAsync('answers_mc_with_text_solution', mc_id);
    }

    static async getByQuestionIdWithTextSolution(question_id, client) {
        return client.hgetAsync(`QUESTION:${question_id}`, 'ANSWER');
    }

    static setByQuestionIdWithTextSolution(answer, client) {
        return client.multi()
            .hset(`QUESTION:${answer[0].question_id}`, 'ANSWER', JSON.stringify(answer))
            .expire(`QUESTION:${answer[0].question_id}`, hashExpiry * 30)
            .execAsync();
    }

    static deleteByQuestionIdWithTextSolution(question_id, client) {
        return client.hdelAsync(`QUESTION:${question_id}`, 'ANSWER');
    }

    static getByQuestionIdWithLanguage(question_id, language, client) {
        return client.hgetAsync('answers', `${question_id}_${language}`);
    }

    static setByQuestionIdWithLanguage(answer, language, client) {
        console.log('set question in redis');
        return client.hsetAsync('answers', `${answer[0].question_id}_${language}`, JSON.stringify(answer));
    }

    static getByMcIdWithLanguage(mc_id, language, client) {
        return client.hgetAsync('answers_mc', `${mc_id}_${language}`);
    }

    static setByMcIdWithLanguage(answer, language, client) {
        console.log('set question in redis');
        return client.hsetAsync('answers_mc', `${answer[0].doubt}_${language}`, JSON.stringify(answer));
    }

    static getPackagesDetail(is_web, student_class, client) {
        return client.hgetAsync('pdf', `${is_web}_${student_class}`);
    }

    static setPackagesDetail(is_web, student_class, data, client) {
        return client.hsetAsync('pdf', `${is_web}_${student_class}`, JSON.stringify(data));
    }

    static deletePackagesDetail(student_class, data, client) {
        return client.hdelAsync('pdf', `${student_class}_${data}`);
    }

    static getLevelOneWithLocation(is_web, class1, package_type, client) {
        return client.hgetAsync('pdf_location', `${is_web}_${class1}_${package_type}`);
    }

    static setLevelOneWithLocation(is_web, class1, package_type, data, client) {
        return client.hsetAsync('pdf_location', `${is_web}_${class1}_${package_type}`, JSON.stringify(data));
    }

    static deleteLevelOne(package_type, data, client) {
        return client.hdelAsync('pdf', `${package_type}_${data}`);
    }

    static getLevelOne(is_web, class1, package_type, client) {
        return client.hgetAsync('pdf', `${is_web}_${class1}_${package_type}`);
    }

    static setLevelOne(is_web, class1, package_type, data, client) {
        return client.hsetAsync('pdf', `${is_web}_${class1}_${package_type}`, JSON.stringify(data));
    }

    static getLevelTwo(is_web, class1, package_type, level1, client) {
        return client.hgetAsync('pdf', `${is_web}_${class1}_${package_type}_${level1}`);
    }

    static setLevelTwo(is_web, class1, package_type, level1, data, client) {
        return client.hsetAsync('pdf', `${is_web}_${class1}_${package_type}_${level1}`, JSON.stringify(data));
    }

    static deleteLevelTwo(package_type, data, client) {
        return client.hdelAsync('pdf', `${package_type}_${data}`);
    }

    static getAllPackages(client) {
        return client.hgetAsync('pdf_download_links', 'packages');
    }

    static setAllPackages(data, client) {
        console.log('set question in redis');
        return client.hsetAsync('pdf_download_links', 'packages', JSON.stringify(data));
    }

    static getFirstLevel(package_name, client) {
        return client.hgetAsync('pdf_download_links', package_name);
    }

    static setFirstLevel(package_name, data, client) {
        console.log('set question in redis');
        return client.hsetAsync('pdf_download_links', package_name, JSON.stringify(data));
    }

    static getSecondLevel(package_name, level1, client) {
        return client.hgetAsync('pdf_download_links', `${package_name}_${level1}`);
    }

    static setSecondLevel(package_name, level1, data, client) {
        console.log('set question in redis');
        return client.hsetAsync('pdf_download_links', `${package_name}_${level1}`, JSON.stringify(data));
    }

    static getDownloadLinks(package_name, level1, level2, client) {
        if (!_.isNull(level2)) { return client.hgetAsync('pdf_download_links', `${package_name}_${level1}_${level2}`); }
        return client.hgetAsync('pdf_download_links', `${package_name}_${level1}`);
    }

    static setDownloadLinks(package_name, level1, level2, data, client) {
        console.log('set question in redis');
        if (!_.isNull(level2)) { return client.hsetAsync('pdf_download_links', `${package_name}_${level1}_${level2}`, JSON.stringify(data)); }
        return client.hsetAsync('pdf_download_links', `${package_name}_${level1}`, JSON.stringify(data));
    }

    static getFirstLevelWeb(package_name, client) {
        return client.hgetAsync('pdf_download_links_web', package_name);
    }

    static setFirstLevelWeb(package_name, data, client) {
        console.log('set question in redis');
        return client.hsetAsync('pdf_download_links_web', package_name, JSON.stringify(data));
    }

    static getSecondLevelWeb(package_name, level1, client) {
        return client.hgetAsync('pdf_download_links_web', `${package_name}_${level1}`);
    }

    static setSecondLevelWeb(package_name, level1, data, client) {
        console.log('set question in redis');
        return client.hsetAsync('pdf_download_links_web', `${package_name}_${level1}`, JSON.stringify(data));
    }

    static getSimilarQuestionsByMcId(mc_id, limit, client) {
        return client.hgetAsync('similarquestion', mc_id);
    }

    static setSimilarQuestionsByMcId(mc_id, limit, data, client) {
        console.log('set question in redis');
        return client.hsetAsync('similarquestion', mc_id, JSON.stringify(data));
    }

    static getList(client) {
        return client.hgetAsync('similarquestion', 'getlist');
    }

    static setList(data, client) {
        return client.hsetAsync('similarquestion', 'getlist', JSON.stringify(data));
    }

    static getJeeAdvanceSimilarVideos(doubt, language, client) {
        return client.hgetAsync('similarquestion', `${doubt}_${language}_jeeadvance_similar_videos`);
    }

    static setJeeAdvanceSimilarVideos(doubt, language, data, client) {
        return client.hsetAsync('similarquestion', `${doubt}_${language}_jeeadvance_similar_videos`, JSON.stringify(data));
    }

    static getJeeMainsSimilarVideos(doubt, language, client) {
        return client.hgetAsync('similarquestion', `${doubt}_${language}_jeemains_similar_videos`);
    }

    static setJeeMainsSimilarVideos(doubt, language, data, client) {
        return client.hsetAsync('similarquestion', `${doubt}_${language}_jeemains_similar_videos`, JSON.stringify(data));
    }

    static getXSimilarVideos(doubt, language, client) {
        return client.hgetAsync('similarquestion', `${doubt}_${language}_X_similar_videos`);
    }

    static setXSimilarVideos(doubt, language, data, client) {
        return client.hsetAsync('similarquestion', `${doubt}_${language}_X_similar_videos`, JSON.stringify(data));
    }

    static getXIISimilarVideos(doubt, language, client) {
        return client.hgetAsync('similarquestion', `${doubt}_${language}_XII_similar_videos`);
    }

    static setXIISimilarVideos(doubt, language, data, client) {
        return client.hsetAsync('similarquestion', `${doubt}_${language}_XII_similar_videos`, JSON.stringify(data));
    }

    static getNcertSimilarVideos(doubt, language, client) {
        return client.hgetAsync('similarquestion', `${doubt}_${language}_ncert_similar_videos`);
    }

    static setNcertSimilarVideos(doubt, language, data, client) {
        return client.hsetAsync('similarquestion', `${doubt}_${language}_ncert_similar_videos`, JSON.stringify(data));
    }

    // Ad methods_________________________________________________________________________________________________________
    static setPreAds(data, client) {
        return client.hsetAsync('video_ads_pre', 'PRE_AD', JSON.stringify(data));
    }

    static getPreAds(client) {
        return client.hgetAsync('video_ads_pre', 'PRE_AD');
    }

    static setPostAds(data, client) {
        return client.hsetAsync('video_ads_post', 'POST_AD', JSON.stringify(data));
    }

    static getPostAds(client) {
        return client.hgetAsync('video_ads_post', 'POST_AD');
    }

    static getEngagementId(class1, question_id, client) {
        return client.hgetAsync('viral_video_engagement_mapping', `${class1}_${question_id}`);
    }

    static setEngagementId(class1, question_id, data, client) {
        return client.hsetAsync('viral_video_engagement_mapping', `${class1}_${question_id}`, JSON.stringify(data));
    }

    static getPinnedPostId(class1, question_id, client) {
        return client.hgetAsync('pinned_post_mapping', `${class1}_${question_id}`);
    }

    static setPinnedPostId(class1, question_id, data, client) {
        return client.hsetAsync('pinned_post_mapping', `${class1}_${question_id}`, JSON.stringify(data));
    }

    // __________________________________________________________________________________________________________________

    // Total Likes
    static setTotLikes(question_id, data, client) {
        return client.setAsync(`total_likes_${question_id}`, JSON.stringify(data));
        // return client.hsetAsync("total_video_likes", question_id, JSON.stringify(data));
    }

    static getTotLikes(question_id, client) {
        return client.getAsync(`total_likes_${question_id}`);
        // return client.hgetAsync("total_video_likes", question_id);
    }

    static setTotLikesWeb(question_id, data, client) {
        // return client.setAsync("total_likes_"+ question_id, JSON.stringify(data));
        return client.hsetAsync('total_video_likes', question_id, JSON.stringify(data));
    }

    static getTotLikesWeb(question_id, client) {
        // return client.getAsync("total_likes_"+ question_id);
        return client.hgetAsync('total_video_likes', question_id);
    }

    static getAnswerTitleAndDescription(answerData, client) {
        // return client.hgetAsync('answer_meta2', answerData.question_id);
        return client.hgetAsync(`QUESTION:${answerData.question_id}`, 'WEB_URL');
    }

    static setAnswerTitleAndDescription(answerData, data, client) {
        // return client.hsetAsync('answer_meta2', answerData.question_id, JSON.stringify(data));
        return client.multi()
            .hset(`QUESTION:${answerData.question_id}`, 'WEB_URL', data)
            .expire(`QUESTION:${answerData.question_id}`, hashExpiry * 30)
            .execAsync();
    }

    static deleteTotLikes(question_id, client) {
        return client.delAsync(`total_likes_${question_id}`);
    }

    static getByQuestionIdLocalised(locale_val, version, question_id, client) {
        let redisKey = `${question_id}_${version}`;
        if (locale_val != '') {
            redisKey += `_${locale_val}`;
        }
        return client.hgetAsync('answers_v7', redisKey);
    }

    static setByQuestionIdLocalised(locale_val, version, answer, client) {
        let redisKey = `${answer[0].question_id}_${version}`;
        if (locale_val != '') {
            redisKey += `_${locale_val}`;
        }
        return client.hsetAsync('answers_v7', redisKey, JSON.stringify(answer));
    }

    static setPreviousHistory(student_id, question_id, client) {
        return client.setAsync(`student_history_${student_id}`, JSON.stringify(question_id), 'Ex', hashExpiry * 7);
    }

    static getPreviousHistory(student_id, client) {
        return client.getAsync(`student_history_${student_id}`);
    }

    static setLikeDislikeStats(stats, question_id, client) {
        // return client.setAsync("answer_dislikes_"+ question_id, (typeof dislikes === "number") ? dislikes.toString():dislikes)
        return client.hsetAsync('answer_likes_dislikes', question_id, JSON.stringify(stats));
        // .expireat("answer_dislikes_"+ question_id, parseInt((+new Date) / 1000) + hash_expiry)
    }

    static getLikeDislikeStats(question_id, client) {
        return client.hgetAsync('answer_likes_dislikes', question_id);
    }

    static getWhatsAppShareStats(question_id, client) {
        return client.hgetAsync('total_whatsapp_share_stats', question_id);
    }

    static setWhatsAppShareStats(question_id, share_count, client) {
        return client.hsetAsync('total_whatsapp_share_stats', question_id, JSON.stringify(share_count));
    }

    static getDetailsMulti(questionsArray, client) {
        return Promise.all([...questionsArray.map((x) => this.getByQuestionId(x._id, client))]);
    }

    static getDetailsMultiWithTextSolution(questionsArray, client) {
        return Promise.all([...questionsArray.map((x) => this.getByQuestionIdWithTextSolution(x._id, client))]);
    }

    static getDetailsTextSolutionWithMget(client, questionsArray) {
        return Promise.all([...questionsArray.map((x) => this.getByQuestionIdWithTextSolution(x._id, client))]);
    }

    static getTagList(questionId, client) {
        return client.hgetAsync(`QUESTION:${questionId}`, 'TAG');
    }

    static setTagList(questionId, data, client) {
        return client.multi()
            .hset(`QUESTION:${questionId}`, 'TAG', JSON.stringify(data))
            .expire(`QUESTION:${questionId}`, hashExpiry * 30)
            .execAsync();
    }

    static getImageSummary(client, questionId) {
        return client.getAsync(`question_summary_image_${questionId}`);
    }

    static setImageSummary(client, questionId, data) {
        return client.setAsync(`question_summary_image_ ${questionId}`, JSON.stringify(data), 'Ex', hashExpiry * 30);
    }

    static setNCERTLatestWatchedVideo(client, answer, student_id, qSid) {
        return client.hsetAsync(`LIBRARY_NCERT_BOOKS_${qSid}_${answer.subject}_${answer.class}`, student_id, JSON.stringify(answer));
    }

    static getNCERTLatestWatchedVideo(client, subject, studentClass, student_id, description) {
        return client.hgetAsync(`LIBRARY_NCERT_${description}_${subject}_${studentClass}`, student_id);
    }

    static setNCERTPlaylistData(client, answer, student_id) {
        return client.setAsync(`LIBRARY_NCERT_PLAYLIST_DATA_${student_id}`, JSON.stringify(answer), 'Ex', hashExpiry);
    }

    static getNCERTPlaylistData(client, student_id) {
        return client.getAsync(`LIBRARY_NCERT_PLAYLIST_DATA_${student_id}`);
    }

    static getNCERTDataByQid(client, questionId) {
        return client.hgetAsync('LIBRARY_NCERT_BOOK_INDEX_NEXT_DATA', questionId);
    }

    static setNCERTDataByQid(client, questionId, data) {
        return client.hsetAsync('LIBRARY_NCERT_BOOK_INDEX_NEXT_DATA', questionId, JSON.stringify(data));
    }

    static getQidSimilar(client, qid) {
        return client.hgetAsync('question_ask_similar', qid);
    }

    static setQidSimilar(client, qid, data) {
        return client.hsetAsync('question_ask_similar', qid, JSON.stringify(data));
    }

    static getDataByChapterAlias(client, chapterAlias, sClass) {
        return client.getAsync(`chapter_alias_data_new_${chapterAlias}_${sClass}`);
    }

    static setDataByChapterAlias(client, data, chapterAlias, sClass) {
        return client.setAsync(`chapter_alias_data_new_${chapterAlias}_${sClass}`, JSON.stringify(data), 'Ex', hashExpiry * 30);
    }

    static getViewData(client, qid) {
        return client.getAsync(`question_view_data_${qid}`);
    }

    static setViewData(client, qid, data) {
        return client.setAsync(`question_view_data_${qid}`, data.toString(), 'Ex', 60 * 60 * 2);
    }

    static getVideoLocale(client, studentID) {
        return client.getAsync(`video_locale:${studentID}`);
    }

    static setVideoLocale(client, studentID, data) {
        return client.setAsync(`video_locale:${studentID}`, JSON.stringify(data), 'Ex', hashExpiry);
    }

    static getAnswerVideoResource(client, answerID) {
        return client.getAsync(`answer_video_resources:${answerID}`);
    }

    static setAnswerVideoResource(client, answerID, data) {
        return client.setAsync(`answer_video_resources:${answerID}`, JSON.stringify(data), 'Ex', hashExpiry * 30);
    }

    static deleteAnswerVideoResource(client, answerID) {
        return client.delAsync(`answer_video_resources:${answerID}`);
    }

    // lf-sf redis operations starts ---

    static setLiveclassShowCount(client, redisKey, student_id, count) {
        const hashKey = `USER:PROFILE:${student_id}`;
        return client.hsetAsync(hashKey, redisKey, count);
    }

    static getLiveclassShowCount(client, redisKey, student_id) {
        const hashKey = `USER:PROFILE:${student_id}`;
        return client.hgetAsync(hashKey, redisKey);
    }

    static setSfShowCount(client, redisKey, student_id, count) {
        const hashKey = `USER:PROFILE:${student_id}`;
        return client.hsetAsync(hashKey, redisKey, count);
    }

    static getSfShowCount(client, redisKey, student_id) {
        const hashKey = `USER:PROFILE:${student_id}`;
        return client.hgetAsync(hashKey, redisKey);
    }

    static setLiveClassShowDetails(client, redisKey, student_id, data) {
        const hashKey = `USER:PROFILE:${student_id}`;
        return client.hsetAsync(hashKey, redisKey, data);
    }

    static getLiveClassShowDetails(client, redisKey, student_id) {
        const hashKey = `USER:PROFILE:${student_id}`;
        return client.hgetAsync(hashKey, redisKey);
    }

    static delLiveClassShowDetails(client, redisKey, student_id) {
        const hashKey = `USER:PROFILE:${student_id}`;
        return client.hdelAsync(hashKey, redisKey);
    }

    static setLiveclassExp(client, redisKey, student_id, data) {
        const hashKey = `USER:PROFILE:${student_id}`;
        return client.hsetAsync(hashKey, redisKey, data);
    }

    static getLiveclassExp(client, redisKey, student_id) {
        const hashKey = `USER:PROFILE:${student_id}`;
        return client.hgetAsync(hashKey, redisKey);
    }

    // lf-sf redis operations ends ---

    static getUsExam(client, redisKey) {
        return client.getAsync(redisKey);
    }

    static setUsExam(client, redisKey, data) {
        return client.setAsync(redisKey, JSON.stringify(data));
    }

    static getAnswerComments(client, key) {
        return client.getAsync(key);
    }

    static setAnswerComments(client, key, data) {
        return client.setAsync(key, data, 'EX', 60 * 60 * 4);
    }

    static getHistoryData(client, studentId) {
        const key = `USER:PROFILE:${studentId}`;
        return client.hgetAsync(key, 'HISTORY');
    }

    static setHistoryData(client, studentId, questionsList) {
        const key = `USER:PROFILE:${studentId}`;
        return client.hsetAsync(key, 'HISTORY', JSON.stringify(questionsList));
    }

    static getCdnRedisPromises(client, answerId) {
        const cdnPromises = [];
        for (let i = 0; i < cdnList.length; i++) {
            cdnPromises.push(client.sismemberAsync(`${cdnList[i]}_answer_ids`, answerId));
        }
        return cdnPromises;
    }

    static async getCdnForAnswerId(client, answerId) {
        const answerIdCdnExistenceList = await Promise.all(this.getCdnRedisPromises(client, answerId));
        for (let i = 0; i < answerIdCdnExistenceList.length; i++) {
            if (answerIdCdnExistenceList[i] === 1) {
                return cdnUrlMapping[i].cdn_video_url;
            }
        }
        return getRandomCDNUrl(true); // * Param to send video cdn url
    }

    static getUserLiveClassWatchedVideo(client, studentId, hashField) {
        const key = `USER:PROFILE:${studentId}`;
        return client.hgetAsync(key, hashField);
    }

    static setUserLiveClassWatchedVideo(client, studentId, questionsList, hashField) {
        const key = `USER:PROFILE:${studentId}`;
        return client.hsetAsync(key, hashField, JSON.stringify(questionsList));
    }

    static deleteUserLiveClassWatchedVideo(client, studentId, hashField) {
        const key = `USER:PROFILE:${studentId}`;
        return client.hdelAsync(key, hashField);
    }
};
