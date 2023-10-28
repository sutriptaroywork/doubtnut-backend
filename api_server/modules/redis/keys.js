module.exports = {
    questionAskedCount: 'QUESTION_ASKED_COUNT', // hashtable: student wize question asked count
    waDailyCountNetcore: 'WAN_DAILY_COUNT', // hashtable
    assortment_price_details_autosales_campaign: 'apdac',
    ccm_id_with_type: 'ccmiwt',
    waConversationContextNetcore: 'WAN_CONTEXT', // hashtable
    gamificationUserData: 'USER:GAMIFICATION', // student wize hashtable
    userProfileData: 'USER:PROFILE', // student wize hashtable
    user7DayData: 'USER:7', // weekly user data
    dailyQuestionAskCount: 'QA_DAILY_COUNT', // hashtable
    branchDeeplink: 'USER:BRANCH_DEEPLINK',
    userTenRecentlyWatched: 'USER:TEN_RECENTLY_WATCHED',
    userTopIcons: 'USER:TOPICONS',
    upcoming: { key: '{COURSE_UPCOMING}:', expiry: 60 * 60, sortKey: [['live_at'], ['asc']] },
    live_now: { key: '{COURSE_LIVE}:', expiry: 60 * 60 },
    replay: { key: '{COURSE_REPLAY}:', expiry: 60 * 60 },
    recent_boards: { key: '{COURSE_BOARDS}:', expiry: 60 * 60, sortKey: [['live_at'], ['desc']] },
    recent_iit_neet: { key: '{COURSE_IIT_NEET}:', expiry: 60 * 60, sortKey: [['live_at'], ['desc']] },
    course_demo_video: 'cdv',
    subject_demo_video: 'sdv',
    course_live_section_home: { key: 'course_live_section_home', expiry: 60 * 60 },
    course_live_section: { key: 'course_live_section', expiry: 60 * 60 },
    revision_classes: { key: 'revision_class:', expiry: 60 * 60 },
    assigned_qids_public_panel: { key: 'assigned_qids_public_panel', expiry: 60 * 60 },
    userQuestionAskDetails: { keyPrefix: 'USER:QUESTION', expiry: 60 * 10 },
    examCategoryMapping: { key: 'EXAM_CAT' },
    userExpiredPackages: 'uep',
    userExpiredPackagesIncludingTrial: 'uet',
    callingCard: 'cc',
    courseContinueBuying: 'ccb',
    courseAssortmentResource: 'car',
    userVideoAdsWatchCountWeekly: 'uvw',
    latestQuestionAskHistory: 'lqh',
    referralWABranchLink: 'rblwa_',
    viserOcrBatchRequestsProcessing: {
        keyPrefix: 'VISER_OCR_BATCH',
        expiry: 60 * 10,
    },
    viserApiCallCounter: {
        keySuffix: 'VISER_OCR_API_CALL_COUNT',
        expiry: 60 * 60 * 24 * 2,
    },
    quiz_notif_default: 'qnd',
    questionsAskedRetryCounter: {
        prefix: 'questions_asked_retry_counter',
        expiry: 60 * 10,
    },
    flagIDKeysFromAssortmentId: 'fikfai',
    flagIDKeysFromAssortmentIdWithAutosalesCampaign: 'fikfaiac',
    flagIDKeysFromAssortmentIdWithReferralPackages: 'fikfairp',
    IAS_POPULAR_ON_DOUBTNUT: 'ipod',
    LIBRARY_V10_DYNAMIC_DATA_CACHE: 'LV10DDC_',
    LIBRARY_V11_STATIC_DATA_CACHE: 'LV11SDC_',

};
