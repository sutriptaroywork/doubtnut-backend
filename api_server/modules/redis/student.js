const moment = require('moment');
const keys = require('./keys');

const hash_expiry = 60 * 60 * 24 * 30;
const dailyExpiry = 60 * 60 * 24;
const rating_popup_expiry = 60 * 60 * 4;
const getSecsToDayEnd = () => Math.floor(moment().endOf('d').diff(moment()) / 1000);

module.exports = class Student {
    static get30Day(client, field, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, field);
    }

    static set30Day(client, field, studentId, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, field, JSON.stringify(data))
            .expire(`${keys.userProfileData}:${studentId}`, dailyExpiry * 30)
            .execAsync();
    }

    static get7Day(client, field, studentId) {
        return client.hgetAsync(`${keys.user7DayData}:${studentId}`, field);
    }

    static set7Day(client, field, studentId, data) {
        return client.multi()
            .hset(`${keys.user7DayData}:${studentId}`, field, JSON.stringify(data))
            .expire(`${keys.user7DayData}:${studentId}`, dailyExpiry * 7)
            .execAsync();
    }

    static setPracticeEnglishLastBottomsheetTime(client, studentId, time) {
        return this.set30Day(client, 'practice_english_last_sent_time', studentId, time);
    }

    static getPracticeEnglishLastBottomsheetTime(client, studentId) {
        return this.get30Day(client, 'practice_english_last_sent_time', studentId);
    }

    static del7Day(studentId, field, client) {
        return client.hdelAsync(`${keys.user7DayData}:${studentId}`, field);
    }

    static getById(studentId, client) {
        client.expire(`${keys.userProfileData}:${studentId}`, dailyExpiry * 30);
        return this.get30Day(client, 'USER', studentId);
    }

    static setById(studentId, data, client) {
        return this.set30Day(client, 'USER', studentId, data);
    }

    static delById(client, studentId) {
        return client.hdelAsync(`${keys.userProfileData}:${studentId}`, 'USER');
    }

    static getInviteBySclass(sclass, client) {
        return client.hgetAsync('student_invite', sclass);
    }

    static getInviteVIPBySclass(sclass, client) {
        return client.hgetAsync('student_invite_vip', sclass);
    }

    static setInviteBySclass(sclass, data, client) {
        console.log('set invite in redis');
        return client.hsetAsync('student_invite', sclass, JSON.stringify(data));
    }

    static setInviteVIPBySclass(sclass, data, client) {
        console.log('set invite in redis');
        return client.hsetAsync('student_invite_vip', sclass, JSON.stringify(data));
    }

    static subscribedStudentHistory(student_id, flag, limit, client) {
        return client.hgetAsync('similarquestions', `${student_id}_${flag}_${limit}`);
    }

    static setsubscribedStudentHistory(student_id, flag, limit, data, client) {
        console.log('set question in redis');
        return client.hsetAsync('similarquestions', `${student_id}_${flag}_${limit}`, JSON.stringify(data));
    }

    static getStudentQuestionHistoryList(student_id, limit, client) {
        return client.hgetAsync('similarquestions', `${student_id}_${limit}`);
    }

    static setStudentQuestionHistoryList(student_id, limit, data, client) {
        console.log('set question in redis');
        return client.hsetAsync('similarquestions', `${student_id}_${limit}`, JSON.stringify(data));
    }

    static getUserStreakCount(student_id, client) {
        return client.hgetAsync('video_view_streak_', student_id);
    }

    static getSrpViewCount() {
        return 0;
        // return this.get30Day(client, 'srp_count', studentId);
    }

    static setSrpViewCount(studentId, _count, client) {
        return this.set30Day(client, 'srp_count', studentId, 0);
    }

    static delSrpViewCount(studentId, client) {
        return client.hdelAsync(`${keys.userProfileData}:${studentId}`, 'srp_count');
    }

    static setStudentVerifiedResponse(client, sessionId, otp, response) {
        return client.setAsync(`${sessionId}_${otp}`, JSON.stringify(response), 'EX', 30);
    }

    static getStudentVerifiedResponse(client, sessionId, otp) {
        return client.getAsync(`${sessionId}_${otp}`);
    }

    static getRatingDone(studentId, client) {
        return this.get30Day(client, 'rating_done', studentId);
    }

    static setRatingDone(studentId, client) {
        return this.set30Day(client, 'rating_done', studentId, 1);
    }

    static getCrossPress(studentId, client) {
        return this.get30Day(client, 'cross_pressed', studentId);
    }

    static setCrossPress(studentId, crossData, client) {
        return this.set30Day(client, 'cross_pressed', studentId, crossData);
    }

    static getParentIds(studentId, client) {
        return this.get30Day(client, 'parent_ids', studentId);
    }

    static setParentIds(studentId, parentIds, client) {
        return this.set30Day(client, 'parent_ids', studentId, parentIds);
    }

    static delParentIds(studentId, client) {
        return client.hdelAsync(`${keys.userProfileData}:${studentId}`, 'parent_ids');
    }

    static getExamDetails(client, studentClass) {
        return client.getAsync(`exam_list_${studentClass}`);
    }

    static setExamDetails(client, studentClass, data) {
        return client.setAsync(`exam_list_${studentClass}`, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getExamsBoardsDetails(client, studentClass, type) {
        return client.getAsync(`boards_exams_list_${studentClass}_${type}`);
    }

    static setExamsBoardsDetails(client, studentClass, type, data) {
        return client.setAsync(`boards_exams_list_${studentClass}_${type}`, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getExamsBoardsDetailsLocalised(client, studentClass, type, lang, examOrdering) {
        let key = `boards_exams_list_${studentClass}_${type}_${lang}`;
        if (examOrdering === 'Commerce') {
            key = `boards_exams_list_${studentClass}_${type}_${lang}_${examOrdering}`;
        }
        return client.getAsync(key);
    }

    static setExamsBoardsDetailsLocalised(client, studentClass, type, lang, examOrdering, data) {
        let key = `boards_exams_list_${studentClass}_${type}_${lang}`;
        if (examOrdering === 'Commerce') {
            key = `boards_exams_list_${studentClass}_${type}_${lang}_${examOrdering}`;
        }
        return client.setAsync(key, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getLiveClassData(client, type) {
        return client.getAsync(type);
    }

    static setLiveClassData(client, type, diff, data) {
        return client.setAsync(type, JSON.stringify(data), 'Ex', diff);
    }

    static setDailySrpViewCount(client, student_id, counter) {
        return client.setAsync(`srp_view_daily_counter_${student_id}`, counter, 'EX', dailyExpiry);
    }

    static setDailySrpViewLog(client, student_id, parent_id) {
        return client.setAsync(`srp_daily_view_${student_id}_${parent_id}`, 1, 'EX', dailyExpiry);
    }

    static getDailySrpViewCount(client, student_id) {
        return client.getAsync(`srp_view_daily_counter_${student_id}`);
    }

    static getUserBlockedForRatingPopup(client, student_id) {
        return client.getAsync(`user_popup_ban_${student_id}`);
    }

    static setUserBlockedForRatingPopup(client, student_id) {
        return client.setAsync(`user_popup_ban_${student_id}`, 1, 'EX', rating_popup_expiry);
    }

    static incrementMatchedQuestionCountByUser(client, student_id) {
        // logic for inc ye to be decided , keeping 1 for now
        const currentTime = new Date();
        return client.hincrbyAsync(`user_questions_matched_counter_${currentTime.getDate()}`, student_id, 1);
    }

    static setDailyUserMatchedQuestionsCounter(client, student_id, expiry) {
        const currentTime = new Date();
        return client.multi()
            .hset(`user_questions_matched_counter_${currentTime.getDate()}`, student_id, 1)
            .expireat(`user_questions_matched_counter_${currentTime.getDate()}`, expiry)
            .execAsync();
    }

    static getDailyUserMatchedQuestionsCounter(client, student_id, rating_flag = 0) {
        const currentTime = new Date();
        if (rating_flag) {
            return client.hgetAsync(`user_questions_matched_counter_${currentTime.getDate() - 1}`, student_id);
        }
        return client.hgetAsync(`user_questions_matched_counter_${currentTime.getDate()}`, student_id);
    }

    static getPinBlockedUserRedisData(client, mobile) {
        return client.getAsync(`user_pin_block_${mobile}`);
    }

    static setPinBlockedUserRedisData(client, pinExpiry, mobile) {
        return client.setAsync(`user_pin_block_${mobile}`, 1, 'EX', pinExpiry);
    }

    static getLiveclassWatchCounter(client, studentID) {
        return client.hgetAsync(`${keys.user7DayData}:${studentID}`, 'LC_WATCH_COUNT');
    }

    static setLiveclassWatchCounter(client, studentID) {
        return client.hincrby(`${keys.user7DayData}:${studentID}`, 'LC_WATCH_COUNT', 1);
    }

    static getEMiReminderCounter(client, studentID) {
        return client.getAsync(`user_emi_reminder_count:${studentID}`);
    }

    static setEMiReminderCounter(client, studentID) {
        return client.setAsync(`user_emi_reminder_count:${studentID}`, '1', 'EX', 60 * 60 * 2);
    }

    static getVideoAdsWatchCounter(client, studentID, adID) {
        return client.getAsync(`user_video_ads_watch_count:${studentID}_${adID}`);
    }

    static setVideoAdsWatchCounter(client, studentID, adID) {
        return client.setAsync(`user_video_ads_watch_count:${studentID}_${adID}`, 1, 'EX', 60 * 60 * 24);
    }

    static updateVideoAdsWatchCounter(client, studentID, adID) {
        return client.incrAsync(`user_video_ads_watch_count:${studentID}_${adID}`);
    }

    static setActiveDeviceIds(client, studentId, deviceIds) {
        // return client.setAsync(`user_active_device_id_${studentID}`, deviceID);
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'user_active_device_ids', deviceIds)
            .expire(`${keys.userProfileData}:${studentId}`, dailyExpiry * 30)
            .execAsync();
    }

    static getActiveDeviceIds(client, studentId) {
        // return client.getAsync(`user_active_device_id_${studentID}`);
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'user_active_device_ids');
    }

    static getChannelData(client, redisKey) {
        return client.getAsync(redisKey);
    }

    static getLatestViewID(client, studentId) {
        return this.get7Day(client, 'LATEST_VIEW_ID', studentId);
    }

    static setLatestViewID(client, studentId, viewID) {
        return this.set7Day(client, 'LATEST_VIEW_ID', studentId, viewID.toString());
    }

    static getVideoViewByStudentId(client, studentID) {
        return client.getAsync(`user_video_view_count:${studentID}`);
    }

    static setVideoViewByStudentId(client, studentID) {
        return client.setAsync(`user_video_view_count:${studentID}`, 1, 'EX', 60 * 60 * 24);
    }

    static incrVideoViewByStudentId(client, studentID) {
        return client.incrAsync(`user_video_view_count:${studentID}`);
    }

    static setUserGooglePlaystoreRatingActivity(client, field, studentId, data) {
        return this.set30Day(client, field, studentId, data);
    }

    static getUserGooglePlaystoreRatingActivity(client, field, studentId) {
        return this.get30Day(client, field, studentId);
    }

    static setAdIdForStudent(client, studentID, adID) {
        return client.setAsync(`user_recent_watch_ad_id:${studentID}`, `${adID}`, 'EX', 60 * 5);
    }

    static getAdIdForStudent(client, studentID) {
        return client.getAsync(`user_recent_watch_ad_id:${studentID}`);
    }

    static deleteAdIdForStudent(client, studentID) {
        return client.delAsync(`user_recent_watch_ad_id:${studentID}`);
    }

    static getBranchDeeplink(client, studentID) {
        return client.getAsync(`${keys.branchDeeplink}:${studentID}`);
    }

    static setBranchDeeplink(client, studentID, data) {
        return client.setAsync(`${keys.branchDeeplink}:${studentID}`, JSON.stringify(data), 'EX', dailyExpiry * 2);
    }

    static getVideoAdsWatchCounterThree(client, studentID, adID) {
        return client.getAsync(`user_video_ads_watch_count_3days:${studentID}_${adID}`);
    }

    static setVideoAdsWatchCounterThree(client, studentID, adID) {
        return client.setAsync(`user_video_ads_watch_count_3days:${studentID}_${adID}`, 1, 'EX', 60 * 60 * 24 * 3);
    }

    static updateVideoAdsWatchCounterThree(client, studentID, adID) {
        return client.incrAsync(`user_video_ads_watch_count_3days:${studentID}_${adID}`);
    }

    static getVideoAdsWatchCounterWeekly(client, studentID, adID) {
        return client.getAsync(`user_video_ads_watch_count_weekly:${studentID}_${adID}`);
    }

    static setVideoAdsWatchCounterWeekly(client, studentID, adID) {
        client.setAsync(`${keys.userVideoAdsWatchCountWeekly}:${studentID}_${adID}`, 1, 'EX', 60 * 60 * 24 * 7);
        return client.setAsync(`user_video_ads_watch_count_weekly:${studentID}_${adID}`, 1, 'EX', 60 * 60 * 24 * 7);
    }

    static updateVideoAdsWatchCounterWeekly(client, studentID, adID) {
        client.incrAsync(`${keys.userVideoAdsWatchCountWeekly}:${studentID}_${adID}`);
        return client.incrAsync(`user_video_ads_watch_count_weekly:${studentID}_${adID}`);
    }

    static setAdIdForStudentDaily(client, studentID, adID) {
        return client.setAsync(`user_recent_watch_ad_id_daily:${studentID}`, `${adID}`, 'EX', 60 * 60 * 24);
    }

    static getAdIdForStudentDaily(client, studentID) {
        return client.getAsync(`user_recent_watch_ad_id_daily:${studentID}`);
    }

    static setAdIdForStudentThree(client, studentID, adID) {
        return client.setAsync(`user_recent_watch_ad_id_3days:${studentID}`, `${adID}`, 'EX', 60 * 60 * 24 * 3);
    }

    static getAdIdForStudentThree(client, studentID) {
        return client.getAsync(`user_recent_watch_ad_id_3days:${studentID}`);
    }

    static setAdIdForStudentWeekly(client, studentID, adID) {
        return client.setAsync(`user_recent_watch_ad_id_weekly:${studentID}`, `${adID}`, 'EX', 60 * 60 * 24 * 7);
    }

    static getAdIdForStudentWeekly(client, studentID) {
        return client.getAsync(`user_recent_watch_ad_id_weekly:${studentID}`);
    }

    static setUserTenRecentlyWatchedDetails(client, studentID, data) {
        return client.multi()
            .hset(`${keys.user7DayData}:${studentID}`, 'TEN_RECENTLY_WATCHED', JSON.stringify(data))
            .expire(`${keys.user7DayData}:${studentID}`, dailyExpiry * 7)
            .execAsync();
    }

    static getUserTenRecentlyWatchedDetails(client, studentID) {
        return client.hgetAsync(`${keys.user7DayData}:${studentID}`, 'TEN_RECENTLY_WATCHED');
    }

    static setPaidUserLandingDeeplink(client, studentID, flagr) {
        return client.setAsync(`paid_user_landing_deeplink:${studentID}`, `${flagr}`, 'EX', 60 * 60 * 6);
    }

    static getPaidUserLandingDeeplink(client, studentID) {
        return client.getAsync(`paid_user_landing_deeplink:${studentID}`);
    }

    static deletePaidUserLandingDeeplink(client, studentID) {
        return client.delAsync(`paid_user_landing_deeplink:${studentID}`);
    }

    static deleteUserRedis(client, studentId) {
        return client.hdelAsync(`USER:PROFILE:${studentId}`, 'USER');
    }

    static getVideoViewEngagetimeByStudentId(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'user_video_view_engagetime');
    }

    static setVideoViewEngagetimeByStudentId(client, studentId, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'user_video_view_engagetime', JSON.stringify(data))
            .execAsync();
    }

    static deleteVideoViewEngagetimeByStudentId(client, studentId) {
        return client.hdelAsync(`${keys.userProfileData}:${studentId}`, 'user_video_view_engagetime');
    }

    static getLastAvailableTopic(studentId, client) {
        return this.get30Day(client, 'LAST_AVAILABLE_TOPIC', studentId);
    }

    static setLastAvailableTopic(studentId, topicName, client) {
        return this.set30Day(client, 'LAST_AVAILABLE_TOPIC', studentId, topicName);
    }

    static resetActivityDetails(client, studentId) {
        return client.hdelAsync(`${keys.userProfileData}:${studentId}`, 'nudge_pop_up');
    }

    static inc7DayCount(client, studentId, count) {
        return client.multi()
            .hincrby(`${keys.user7DayData}:${studentId}`, 'app_open_nudge', count)
            .expire(`${keys.user7DayData}:${studentId}`, dailyExpiry * 7)
            .execAsync();
    }

    static resetAppOpen(client, studentId) {
        return client.hdelAsync(`${keys.user7DayData}:${studentId}`, 'app_open_nudge');
    }

    static getStudentScholarshipRegistered(client, studentId) {
        return client.getAsync(`USER:SCHOLARSHIP:${studentId}`);
    }

    static setStudentScholarshipRegistered(client, studentId, data) {
        return client.setAsync(`USER:SCHOLARSHIP:${studentId}`, JSON.stringify(data), 'Ex', 60 * 15); // * 15 min
    }

    static getSurveyStudentId(studentIds, client) {
        return client.hgetAsync('NPS6', studentIds);
    }

    static getLFAdsWatchCounter(client, studentID, adID) {
        return client.hgetAsync(`${keys.user7DayData}:${studentID}`, `LF_ads_COUNT_${adID}`);
    }

    static setLFAdsWatchCounter(client, studentID, adID) {
        return client.hincrby(`${keys.user7DayData}:${studentID}`, `LF_ads_COUNT_${adID}`, 1);
    }

    static setUserTopIcons(client, studentID, field, data) {
        return client.multi()
            .hset(`${keys.userTopIcons}:${studentID}`, field, JSON.stringify(data))
            .expire(`${keys.userTopIcons}:${studentID}`, 60 * 15)
            .execAsync();
    }

    static setNoticeData(client, studentID, field, data) {
        return client.multi()
            .hset(`NOTICE:${studentID}`, field, JSON.stringify(data))
            .expire(`NOTICE:${studentID}`, 60 * 30)
            .execAsync();
    }

    static getNoticeData(client, studentID, noticehash) {
        return client.hgetAsync(`NOTICE:${studentID}`, noticehash);
    }

    static delUserTopIcons(client, studentID) {
        return client.hdelAsync(`${keys.userTopIcons}:${studentID}`, `${keys.userTopIcons}:${studentID}`);
    }

    static getUserTopIcons(client, studentID, subscriptionHash) {
        return client.hgetAsync(`${keys.userTopIcons}:${studentID}`, subscriptionHash);
    }

    static getTestSeriesData(client, studentId, testId) {
        return client.getAsync(`USER:TEST:${studentId}:${testId}`);
    }

    static setTestSeriesData(client, studentId, data, testId) {
        return client.setAsync(`USER:TEST:${studentId}:${testId}`, JSON.stringify(data), 'Ex', 60 * 15); // * 15 min
    }

    // hash to store student's active ccm_id
    static getStudentCcmIds(client, studentId) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, 'ccmId');
    }

    static delStudentCcmIds(client, studentId) {
        return client.hdelAsync(`USER:PROFILE:${studentId}`, 'ccmId');
    }

    static setStudentCcmIds(client, studentId, ccmIds) {
        return client.hsetAsync(`USER:PROFILE:${studentId}`, 'ccmId', JSON.stringify(ccmIds));
    }

    static getStudentCcmIdsWithType(client, studentId) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, keys.ccm_id_with_type);
    }

    static delStudentCcmIdsWithType(client, studentId) {
        return client.hdelAsync(`USER:PROFILE:${studentId}`, keys.ccm_id_with_type);
    }

    static setStudentCcmIdsWithType(client, studentId, ccmIds) {
        return client.hsetAsync(`USER:PROFILE:${studentId}`, keys.ccm_id_with_type, JSON.stringify(ccmIds));
    }

    static setExamCornerArticleAvailableByClass(client, articleClass, value) {
        return client.setAsync(`exam_corner_article_by_class:${articleClass}`, value, 'Ex', 60 * 60);// 1 hour
    }

    static setExamCornerArticleAvailableByCcmId(client, ccmId, value) {
        return client.setAsync(`exam_corner_article_by_ccm_id:${ccmId}`, value, 'Ex', 60 * 60);
    }

    static getExamCornerArticleAvailableByClass(client, articleClass) {
        return client.getAsync(`exam_corner_article_by_class:${articleClass}`);
    }

    static getExamCornerArticleAvailableByCcmId(client, ccmId) {
        return client.getAsync(`exam_corner_article_by_ccm_id:${ccmId}`);
    }

    static getExamCornerBookmarks(client, studentId) {
        return this.get30Day(client, 'exam_corner_bookmarks', studentId);
    }

    static setExamCornerBookmarks(client, studentId, bookmarkIds) {
        return this.set30Day(client, 'exam_corner_bookmarks', studentId, bookmarkIds);
    }

    static updateWrongOTPCount(client, expiry, sessionId) {
        return client.pipeline()
            .incr(`wrong_otp_count:${sessionId}`)
            .expire(`wrong_otp_count:${sessionId}`, expiry)
            .execAsync();
    }

    static getWrongOTPCount(client, sessionId) {
        return client.getAsync(`wrong_otp_count:${sessionId}`);
    }

    static delWrongOTPCount(client, sessionId) {
        return client.delAsync(`wrong_otp_count:${sessionId}`);
    }

    static setBookFlowData(client, redisKey, studentId, data) {
        const key = `USER:PROFILE:${studentId}`;
        return client.hsetAsync(key, redisKey, data);
    }

    static getBookFlowData(client, redisKey, studentId) {
        const key = `USER:PROFILE:${studentId}`;
        return client.hgetAsync(key, redisKey);
    }

    static getUserFeedbackTriggerParams(client, student_id, redisKey) {
        return client.hgetAsync(`USER:PROFILE:${student_id}`, redisKey);
    }

    static setUserFeedbackTriggerParams(client, student_id, redisKey, data) {
        return client.hsetAsync(`USER:PROFILE:${student_id}`, redisKey, JSON.stringify(data));
    }

    static deleteUserFeedbackTriggerKey(client, student_id, redisKey) {
        return client.hdelAsync(`USER:PROFILE:${student_id}`, redisKey);
    }

    static setFavoriteCategories(client, studentId, data) {
        return client.hsetAsync(`USER:PROFILE:${studentId}`, 'icons_count', JSON.stringify(data));
    }

    static getFavoriteCategories(client, studentId) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, 'icons_count');
    }

    static getNewHomepageCount(client, studentId) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, 'homepage_sessions_count');
    }

    static incrementNewHomepageCount(client, studentId) {
        return client.hincrbyAsync(`USER:PROFILE:${studentId}`, 'homepage_sessions_count', 1);
    }

    static setUserHomepageVisitCount(client, studentId, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'user_homepage_impression_count', data)
            .expire(`${keys.userProfileData}:${studentId}`, dailyExpiry * 30)
            .execAsync();
    }

    static updateUserHomepageVisitCount(client, studentId) {
        return client.hincrbyAsync(`${keys.userProfileData}:${studentId}`, 'user_homepage_impression_count', 1);
    }

    static getUserHomepageVisitCount(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'user_homepage_impression_count');
    }

    static getQuestionAskedWidgetPosition(client, studentID) {
        return client.hgetAsync(`USER:PROFILE:${studentID}`, 'QA_WIDGET_POSITION');
    }

    static setQuestionAskedWidgetPosition(client, studentID, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentID}`, 'QA_WIDGET_POSITION', data)
            .expire(`${keys.userProfileData}:${studentID}`, dailyExpiry)
            .execAsync();
    }

    static setUserFreeLiveclassET(client, studentId, data) {
        return client.setAsync(`user_free_liveclass_et:${studentId}`, data, 'Ex', 60 * 60 * 30);
    }

    static setUserFreeLiveclassETNew(client, studentId, data) {
        return client.setAsync(`ufle:${studentId}`, data, 'Ex', 60 * 60 * 30);
    }

    static getUserFreeLiveclassET(client, studentId) {
        return client.getAsync(`user_free_liveclass_et:${studentId}`);
    }

    static getUserFreeLiveclassETNew(client, studentId) {
        return client.getAsync(`ufle:${studentId}`);
    }

    static getUserETForFreeTrial(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'engage_time_for_free_trial');
    }

    static setUserETForFreeTrial(client, studentId, time) {
        return client.hsetAsync(`${keys.userProfileData}:${studentId}`, 'engage_time_for_free_trial', JSON.stringify(time));
    }

    static getUserETForFreeTrialNew(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'etfft');
    }

    static setUserETForFreeTrialNew(client, studentId, time) {
        return client.hsetAsync(`${keys.userProfileData}:${studentId}`, 'etfft', JSON.stringify(time));
    }

    static deleteUserFreeLiveclassET(client, studentId) {
        return client.delAsync(`user_free_liveclass_et:${studentId}`);
    }

    static deleteUserFreeLiveclassETNew(client, studentId) {
        return client.delAsync(`ufle:${studentId}`);
    }

    static getMpvpKeyCount(client, field, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, field);
    }

    static updateMpvpKeyCount(client, field, studentId, interval) {
        return client.hincrbyAsync(`${keys.userProfileData}:${studentId}`, field, interval);
    }

    static getTopWidgetFlow(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'mpvp_top_widget_flow');
    }

    static setTopWidgetFlow(client, studentId, data) {
        return client.hsetAsync(`${keys.userProfileData}:${studentId}`, 'mpvp_top_widget_flow', data);
    }

    static setRecommendedLiveIds(client, studentId, chapter, subject, classVal, data) {
        return client.hsetAsync(`${keys.userProfileData}:${studentId}`, `${subject}_${chapter}_${classVal}`, data);
    }

    static getRecommendedLiveIds(client, studentId, chapter, subject, classVal) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, `${subject}_${chapter}_${classVal}`);
    }

    static getSubscribedTeachersData(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'teachers_subscribed_list');
    }

    static setSubscribedTeachersData(client, studentId, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'teachers_subscribed_list', JSON.stringify(data))
            .execAsync();
    }

    static delSubscribedTeachers(client, studentId) {
        return client.hdelAsync(`${keys.userProfileData}:${studentId}`, 'teachers_subscribed_list');
    }

    static getQaWidgetList(client, studentId, redisKey) {
        const key = `USER:PROFILE:${studentId}`;
        return client.hgetAsync(key, redisKey);
    }

    static setQaWidgetList(client, studentId, redisKey, data) {
        return client.multi()
            .hset(`USER:PROFILE:${studentId}`, redisKey, JSON.stringify(data))
            .expire(`USER:PROFILE:${studentId}`, 60 * 60 * 24 * 30)
            .execAsync();
    }

    static setQaWidgetData(client, studentId, redisKey, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, redisKey, JSON.stringify(data))
            .execAsync();
    }

    static delQaWidgetData(client, studentId, redisKey) {
        return client.hdelAsync(`${keys.userProfileData}:${studentId}`, redisKey);
    }

    static getQaWidgetData(client, studentId, redisKey) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, redisKey);
    }

    static getQaWidgetFlagrData(client, studentId, redisKey) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, redisKey);
    }

    static setQaWidgetFlagrData(client, studentId, redisKey, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, redisKey, JSON.stringify(data))
            .execAsync();
    }

    static getAskedQuestionNo(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'QA_NO');
    }

    static setAskedQuestionNo(client, studentId, noOfQuestionsAsked) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'QA_NO', noOfQuestionsAsked)
            .expire(`${keys.userProfileData}:${studentId}`, hash_expiry)
            .execAsync();
    }

    static getSrpFlow(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'QA_FLOW');
    }

    static setSrpFlow(client, studentId, flow) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'QA_FLOW', flow)
            .expire(`${keys.userProfileData}:${studentId}`, hash_expiry)
            .execAsync();
    }

    static getSrpSession(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'QA_SESSION');
    }

    static setSrpSession(client, studentId, sessionNo) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'QA_SESSION', sessionNo)
            .expire(`${keys.userProfileData}:${studentId}`, hash_expiry)
            .execAsync();
    }

    static getUserTydSuggestionsVersion(client, studentId, redisKey) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, redisKey);
    }

    static setUserTydSuggestionsVersion(client, studentId, redisKey, version) {
        return client.hsetAsync(`USER:PROFILE:${studentId}`, redisKey, version);
    }

    static getSubscribedInternalTeachersData(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'internal_teachers_subscribed');
    }

    static setSubscribedInternalTeachersData(client, studentId, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'internal_teachers_subscribed', JSON.stringify(data))
            .execAsync();
    }

    static delSubscribedInternalTeachers(client, studentId) {
        return client.hdelAsync(`${keys.userProfileData}:${studentId}`, 'internal_teachers_subscribed');
    }

    static getUserProfile(client, studentId) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, 'USER');
    }

    static getR2V2status(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'r2v2');
    }

    static setR2V2status(client, studentId, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'r2v2', JSON.stringify(data))
            .execAsync();
    }

    static setUpActiveCCMData(client, data) {
        return client.setAsync('UP:CCMID', JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getUpActiveCCMData(client) {
        return client.getAsync('UP:CCMID');
    }

    static setBiharUpActiveCCMData(client, data) {
        return client.setAsync('BIHAR:UP:CCMID', JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getBiharUpActiveCCMData(client) {
        return client.getAsync('BIHAR:UP:CCMID');
    }

    static setWhatsAppLastDNRData(client, studentId, data) {
        return this.set30Day(client, 'WHATSAPP_DNR', studentId, data);
    }

    static getWhatsAppLastDNRData(client, studentId) {
        return this.get30Day(client, 'WHATSAPP_DNR', studentId);
    }

    static getUserFreePdfAccessedCount(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'free_pdf_access_count');
    }

    static setUserFreePdfAccessedCount(client, studentId) {
        return client.hincrbyAsync(`${keys.userProfileData}:${studentId}`, 'free_pdf_access_count', 1);
    }

    static getDNRHomeWidget(client, studentId) {
        return client.getAsync(`DNR_HOME_WIDGET:${studentId}`);
    }

    static setDNRHomeWidget(client, studentId, data) {
        return client.setAsync(`DNR_HOME_WIDGET:${studentId}`, JSON.stringify(data), 'Ex', getSecsToDayEnd());
    }

    static setFreeClassListingPageBannerLastShownDate(client, studentId, data) {
        return this.set7Day(client, 'FCLP_BANNER_DATE', studentId, data);
    }

    static getFreeClassListingPageBannerLastShownDate(client, studentId) {
        return this.get7Day(client, 'FCLP_BANNER_DATE', studentId);
    }

    static increaseDoubtnutPaywallStudentCount(client) {
        return client.incr('DOUBTNUT_PAYWALL_USER_COUNT');
    }

    static setStudentTrueCountry(client, studentId, trueCountry) {
        return client.setAsync(`DOUBT_PAYWALL_TRUE_LOCATION_SID:${studentId}`, JSON.stringify(trueCountry), 'Ex', 60 * 60 * 24 * 2); // cache for 2 days
    }

    static getStudentTrueCountry(client, studentId) {
        return client.getAsync(`DOUBT_PAYWALL_TRUE_LOCATION_SID:${studentId}`);
    }

    static getUserQuestionAskCountForDoubtnutPaywallFromRedis(client, studentId) {
        return client.getAsync(`doubtnut_paywall_question_ask_count:${studentId}`);
    }

    static setLoginWithoutOtpCount(client, mobile, udid, data) {
        return client.multi()
            .hset(`USER:PROFILE:${mobile}:${udid}`, 'LOGIN_WITHOUT_OTP', data)
            .expire(`USER:PROFILE:${mobile}:${udid}`, hash_expiry) // 1 month
            .execAsync();
    }

    static getLoginWithoutOtpCount(client, mobile, udid) {
        return client.hgetAsync(`USER:PROFILE:${mobile}:${udid}`, 'LOGIN_WITHOUT_OTP');
    }

    static incrementLoginWithoutOtpCount(client, mobile, udid) {
        return client.hincrbyAsync(`USER:PROFILE:${mobile}:${udid}`, 'LOGIN_WITHOUT_OTP', 1);
    }

    static setCampaignData(client, studentId, data) {
        return this.set30Day(client, 'CAMPAIGN_DATA', studentId, data);
    }

    static getCampaignData(client, studentId) {
        return this.get30Day(client, 'CAMPAIGN_DATA', studentId).then((data) => JSON.parse(data));
    }

    static setReferralPopUpseen(client, studentId, data) {
        return this.set30Day(client, 'referral_popup_shown', studentId, data);
    }

    static getReferralPopUpseen(client, studentId) {
        return this.get30Day(client, 'referral_popup_shown', studentId).then((data) => JSON.parse(data));
    }

    static getHomeCarousels(client, studentId, cacheKey) {
        return client.getAsync(`HOME_CAROUSELS:${studentId}:${cacheKey}`);
    }

    static setHomeCarousels(client, studentId, cacheKey, data) {
        return client.setAsync(`HOME_CAROUSELS:${studentId}:${cacheKey}`, JSON.stringify(data), 'Ex', 60 * 15);
    }

    static setLastSrpQidAnsId(client, sid, data) {
        return client.multi()
            .hset(`USER:PROFILE:${sid}`, 'LAST_SRP_DETAILS', data)
            .expire(`USER:PROFILE:${sid}`, hash_expiry) // 1 month
            .execAsync();
    }

    static getLastSrpQidAnsId(client, sid) {
        return client.hgetAsync(`USER:PROFILE:${sid}`, 'LAST_SRP_DETAILS');
    }

    static setP2pCommunityVisitCount(client, studentId, data) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentId}`, 'P2P_COMMUNITY_VISIT', data)
            .expire(`${keys.userProfileData}:${studentId}`, dailyExpiry * 30)
            .execAsync();
    }

    static updateP2pCommunityVisitCount(client, studentId) {
        return client.hincrbyAsync(`${keys.userProfileData}:${studentId}`, 'P2P_COMMUNITY_VISIT', 1);
    }

    static getP2pCommunityVisitCount(client, studentId) {
        return client.hgetAsync(`${keys.userProfileData}:${studentId}`, 'P2P_COMMUNITY_VISIT');
    }

    static getTeacherData(client, teacherId) {
        return client.getAsync(`teacherData:${teacherId}`);
    }

    static setTeacherData(client, teacherId, data) {
        return client.setAsync(`teacherData:${teacherId}`, JSON.stringify(data), 'Ex', 60 * 60 * 1); // 1 hr
    }

    static getGoogleAdsData(client, page) {
        return client.getAsync(`google_ads:${page}`);
    }

    static setGoogleAdsData(client, page, data) {
        return client.setAsync(`google_ads:${page}`, JSON.stringify(data), 'Ex', 60 * 60 * 1); // 1 hr
    }
};
