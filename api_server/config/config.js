/* eslint-disable global-require */
/**
 * @Author: xesloohc
 * @Date:   2019-06-18T19:19:30+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by: Abhishek Sinha
 * @Last modified date: 2020-01-20
 */

const Joi = require('joi');

const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string().allow(['development', 'production', 'test', 'provision']).default('development'),
    PORT: Joi.number().default(3000),

    MYSQL_HOST_WRITE: Joi.string().required().description('Mysql host write'),
    MYSQL_USER_WRITE: Joi.string().required().description('Mysql username write'),
    MYSQL_DB_WRITE: Joi.string().required().description('Mysql dbname write'),
    MYSQL_PASS_WRITE: Joi.string().required().description('Mysql password write'),

    MYSQL_HOST_READ: Joi.string().required().description('Mysql host read'),
    MYSQL_USER_READ: Joi.string().required().description('Mysql username read'),
    MYSQL_DB_READ: Joi.string().required().description('Mysql sbname read'),
    MYSQL_PASS_READ: Joi.string().required().description('Mysql password write'),

    MYSQL_HOST_ANALYTICS: Joi.string().description('Mysql host ANALYTICS'),
    MYSQL_USER_ANALYTICS: Joi.string().description('Mysql username ANALYTICS'),
    MYSQL_DB_ANALYTICS: Joi.string().description('Mysql sbname ANALYTICS'),
    MYSQL_PASS_ANALYTICS: Joi.string().description('Mysql password ANALYTICS'),
    MYSQL_TIMEZONE_ANALYTICS: Joi.string().description('Mysql timezone ANALYTICS'),
    HT_OLYMPIAD_AUTH_TOKEN: Joi.string().description('HT Olympiad auth key'),

    REDIS_CLUSTER_HOSTS: Joi.string().required().description('List of comma separated hosts of redis cluster'),
    REDIS_CLUSTER_PASS: Joi.string().description('Password for redis cluster'),

    RED_SHIFT_HOST: Joi.string().description('Red Shift Host'),
    RED_SHIFT_USER: Joi.string().description('Red Shift User'),
    RED_SHIFT_DB: Joi.string().description('Red Shift Db Name'),
    RED_SHIFT_PASS: Joi.string().description('password for Red Shift'),
    RED_SHIFT_PORT: Joi.string().default('5439'),

    GOOGLE_VISION_KEY: Joi.string().required().description('root'),
    JWT_SECRET: Joi.string().required().description('root'),
    JWT_SECRET_NEW: Joi.string().description('root'),
    JWT_SECRET_REFRESH: Joi.string().description('root'),
    JWT_SECRET_TEACHER: Joi.string().description('root'),
    JWT_SECRET_TEACHER_REFRESH: Joi.string().description('root'),
    CDN_URL: Joi.string().required().description('root'),
    QUESTION_IMAGE_S3_PREFIX: Joi.string().description('root'),
    CDN_VIDEO_URL: Joi.string().required().description('root'),
    CDN_AKAMAI_VIDEO_URL: Joi.string().required().description('root'),
    BLOB_URL: Joi.string().required().description('root'),
    FIREBASE_BASE_URL: Joi.string().required().description('root'),
    FIREBASE_PROJECT_ID: Joi.string().required().description('root'),
    FIREBASE_PRIVATE_KEY: Joi.string().required().description('root'),
    FIREBASE_CLIENT_EMAIL: Joi.string().required().description('root'),
    FIREBASE_BASE_URL_NEW: Joi.string().description('root'),
    FIREBASE_PROJECT_ID_NEW: Joi.string().description('root'),
    FIREBASE_PRIVATE_KEY_NEW: Joi.string().description('root'),
    FIREBASE_CLIENT_EMAIL_NEW: Joi.string().description('root'),
    FIREBASE_BASE_URL_BIOLOGY_NEET: Joi.string().description('root'),
    FIREBASE_PROJECT_ID_BIOLOGY_NEET: Joi.string().description('root'),
    FIREBASE_PRIVATE_KEY_BIOLOGY_NEET: Joi.string().description('root'),
    FIREBASE_CLIENT_EMAIL_BIOLOGY_NEET: Joi.string().description('root'),
    FACEBOOK_APP_KEY: Joi.string().description('Facebook Auth App Key'),
    FIREBASE_BASE_URL_MATHS_IITJEE: Joi.string().description('root'),
    FIREBASE_PROJECT_ID_MATHS_IITJEE: Joi.string().description('root'),
    FIREBASE_PRIVATE_KEY_MATHS_IITJEE: Joi.string().description('root'),
    FIREBASE_CLIENT_EMAIL_MATHS_IITJEE: Joi.string().description('root'),
    FACEBOOK_APP_KEY_MATHS_IITJEE: Joi.string().description('Facebook Auth App Key'),

    MONGO_USER: Joi.string().required().description('root'),
    MONGO_PASS: Joi.string().required().description('root'),
    MONGO_URL: Joi.string().required().description('root'),
    MONGO_CRON_URL: Joi.string().description('Notification mongo url'),
    MONGO_DB_NAME: Joi.string().required().description('root'),
    CONNECT_MONGO: Joi.string().default('true').description('whether to connect to mongo or not'),
    SEARCH_SERVICE_URL: Joi.string().required().description('search service internal endpoint'),
    DOUBTNUT_LOGO_PATH: Joi.string().required().description('root'),
    SQS: Joi.string().required().description('root'),
    PROFANITY_SQS: Joi.string().required().description('root'),
    ELASTICSEARCH_SQS: Joi.string().description('root'),
    TEST_QUESTION_TABLE_SQS: Joi.string().description('sqs to insert and update new questions table in test db'),
    REGIONAL_SQS: Joi.string().description('sqs to insert and update regional questions in regional_panel_questions'),
    TOKEN_PRIVATE_KEY: Joi.string().required().description('root'),
    VDO_CIPHER: Joi.string().description('root'),
    VDOCIPHER_API_KEY: Joi.string().description('root'),
    TWO_FA_KEY: Joi.string().required().description('root'),

    PROJECT_ID: Joi.string().required().description('root'),
    INSTANCE_ID: Joi.string().required().description('root'),
    ZONE: Joi.string().required().description('root'),

    AWS_ACCESS_ID: Joi.string().description('root'),
    AWS_SECRET: Joi.string().description('root'),
    S3_BUCKET: Joi.string().required().description('root'),
    S3_IMAGE_UGCBUCKET: Joi.string().required().description('root'),
    S3_AUDIO_UGCBUCKET: Joi.string().required().description('root'),

    NEW_RELIC_KEY: Joi.string().required().description('root'),
    BRANCH_KEY: Joi.string().required().description('root'),

    WHATSAPP_LOGIN: Joi.string().required().description('root'),
    WHATSAPP_PASSWORD: Joi.string().required().description('root'),
    WHATSAPP_LOGIN_HSM: Joi.string().required().description('root'),
    WHATSAPP_PASSWORD_HSM: Joi.string().required().description('root'),

    QUESTION_ASK_SNS: Joi.string().required().description('root'),
    VIDEO_VIEW_SNS: Joi.string().required().description('root'),
    UPDATE_PARENT_ID_SNS: Joi.string().required().description('root'),

    TELEMETRY_SQS: Joi.string().description('telemetry sqs for grafana-influx'),
    WHATSAPP_SQS: Joi.string().required().description('pushing notification through lamda triger'),
    // NOTIFICATION_SQS: Joi.string().required().description('pushing notification through lamda triger'),

    FLAGR_URL: Joi.string().required().description('flagr a/b url'),

    MYSQL_CONNECTION_POOL: Joi.string().required().description('connection count of master'),
    MYSQL_CONNECTION_POOL_SLAVE: Joi.string().required().description('connection count of slave'),
    YOUTUBE_API_KEY: Joi.string().required(),
    WOLFRAM_KEY: Joi.string().required(),
    MATHPIX_DEFAULT_APP_KEY: Joi.string().required().description('connection count of slave'),
    MATHPIX_DEFAULT_APP_ID: Joi.string().required().description('connection count of slave'),
    MATHPIX_APP_KEY: Joi.string().required().description('connection count of slave'),
    MATHPIX_APP_ID: Joi.string().required().description('connection count of slave'),
    PACKAGE_SUBSCRIPTION_RENEWAL_THRESHOLD: Joi.string().description('days after which the renewal flow should trigger'),
    PACKAGE_SUBSCRIPTION_FLAGR_ID: Joi.string().description('flagr id for package a/b testing'),
    AUTH_KEY_MSG91: Joi.string().required().description('msg91 auth key'),
    TEMPLATE_NAME_2FA: Joi.string().required().description('two fa template name'),

    // LIVECLASS
    STREAM_PLAYBACK_DOMAIN: Joi.string().default('live.doubtnut.com'),
    VOD_DOMAIN: Joi.string().default('ts.doubtnut.com'),
    STREAM_PUSH_DOMAIN: Joi.string().default('94042.livepush.myqcloud.com'),
    STREAM_APPNAME: Joi.string().default('live'),
    STREAM_AUTHKEY: Joi.string().default('neil'),

    MICRO_URL: Joi.string().default('https://micro.doubtnut.com').description('microservice endpoint'),
    MICRO_URL_LEGACY: Joi.string().default('https://micro.doubtnut.com').description('microservice legacy endpoint'),
    PASCAL_URL: Joi.string().description('personlisation endpoint'),

    TENCENT_SECRET_ID: Joi.string().default('xxx').description('tencent secret id'),
    TENCENT_SECRET_KEY: Joi.string().default('ddd').description('tencent secret key'),
    PAGERDUTY_API_KEY: Joi.string().default('ppp').description('pagerduty api access key'),

    GOOGLE_OAUTH_CLIENT_ID: Joi.string().required(),
    GOOGLE_OAUTH_CLIENT_SECRET: Joi.string().required(),
    FACEBOOK_OAUTH_CLIENT_ID: Joi.string().required(),
    FACEBOOK_OAUTH_CLIENT_SECRET: Joi.string().required(),
    LEAD_CRM_KEY: Joi.string().description('Key for leads crm'),
    LEAD_CRM_URL: Joi.string().description('URL for leads crm'),
    GUPSHUP_SMS_USER_ID: Joi.string().description('user id for sending messages through guphsup'),
    GUPSHUP_SMS_PASSWORD: Joi.string().description('password for sending messages through guphsup'),

    EVENTS_MONGO_USER: Joi.string().optional().description('root'),
    EVENTS_MONGO_PASS: Joi.string().optional().description('root'),
    EVENTS_MONGO_URL: Joi.string().optional().description('root'),
    EVENTS_MONGO_DB_NAME: Joi.string().optional().description('root'),
    CONNECT_EVENTS_MONGO: Joi.string().default('false').description('whether to connect to events mongo or not'),
    KAFKA_HOSTS: Joi.string().optional(),
    KAFKA_DE_HOSTS: Joi.string().optional(),
    IAS_VANILLA_BASE_URL: Joi.string().optional(),

    VISER_SEARCH_AUTH_KEY: Joi.string().optional(),
    VISER_DIAGRAM_MATCHER_AUTH_KEY: Joi.string().optional(),
    DD_SERVICE: Joi.string().default('api-server'),
    DD_ENV: Joi.string().default('development'),
    CONVIVA_CLIENT_KEY: Joi.string().optional(),
}).unknown().required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
function getPoolConnectionLimit(slave = false) {
    if (envVars.NODE_ENV === 'production') {
        if (slave) {
            return parseInt(envVars.MYSQL_CONNECTION_POOL_SLAVE);
        }
        return parseInt(envVars.MYSQL_CONNECTION_POOL);
    }
    if (slave) {
        return 3;
    }
    return 2;
}

const apiConfig = {
    env: process.env.NODE_ENV || envVars.NODE_ENV,
    port: envVars.PORT,
    dd_service: envVars.DD_SERVICE,
    dd_env: envVars.DD_ENV,
    caching: true,
    handle_question_ask_retry_logic: true,
    flagrMysql: true,
    overide_caching: true,		// change to 1 if 0
    staticCDN: 'https://d10lpgp6xz60nq.cloudfront.net/',
    service_switch: {
        library_translation: 1,
    },
    flagr: {
        baseUrl: envVars.FLAGR_URL,
        enabled: true,
        evaluation: `${envVars.FLAGR_URL}api/v1/evaluation`,
        batchEvaluation: `${envVars.FLAGR_URL}api/v1/evaluation/batch`,
    },
    write_mysql: {
        host: envVars.MYSQL_HOST_WRITE,
        user: envVars.MYSQL_USER_WRITE,
        password: envVars.MYSQL_PASS_WRITE,
        database: envVars.MYSQL_DB_WRITE,
        connectionLimit: getPoolConnectionLimit(),
        connectTimeout: 600000,		// 60 * 60 * 1000
        aquireTimeout: 600000,			// 60 * 60 * 1000
        timeout: 600000,				// 60 * 60 * 1000
    },
    read_mysql: {
        host: envVars.MYSQL_HOST_READ,
        user: envVars.MYSQL_USER_READ,
        password: envVars.MYSQL_PASS_READ,
        database: envVars.MYSQL_DB_READ,
        connectionLimit: getPoolConnectionLimit(true),
        connectTimeout: 600000,		// 60 * 60 * 1000
        aquireTimeout: 600000,			// 60 * 60 * 1000
        timeout: 600000,				// 60 * 60 * 1000
        charset: 'utf8mb4',
    },
    redis: {
        hosts: envVars.REDIS_CLUSTER_HOSTS.split(','),
        password: envVars.REDIS_CLUSTER_PASS,
        db: envVars.REDIS_CLUSTER_DATABASE || 0,
    },
    mongo: {
        database_url: envVars.MONGO_URL,
        database_cron_url: envVars.MONGO_CRON_URL,
        database_name: envVars.MONGO_DB_NAME,
        database_user: envVars.MONGO_USER,
        database_pass: envVars.MONGO_PASS,
        connect: envVars.CONNECT_MONGO.toLowerCase() !== 'false',
    },
    elastic: {
        ELASTIC_HOST: envVars.ELASTIC_HOST,
        TEST_ELASTIC_HOST: envVars.TEST_ELASTIC_HOST,
        WEB_ELASTIC_HOST: envVars.WEB_ELASTIC_HOST,
        ELASTIC_LTR_HOST: envVars.ELASTIC_LTR_HOST,
        INAPP_ELASTIC_HOST: envVars.INAPP_ELASTIC_HOST,
        ELASTIC_USER_QUESTIONS_HOST: envVars.ELASTIC_USER_QUESTIONS_HOST,
        REPO_INDEX: 'doubtnut_new',
        REPO_INDEX_WITH_SINGLE_SHARD: 'question_bank_single_shard',
        REPO_INDEX_WITH_SYNONYMS: 'question_bank_synonyms',
        REPO_INDEX_LTR_USER_QUESTIONS: 'user_questions_vvs_et_gt_80_v2',
        REPO_INDEX1: 'question_bank_deprecated',
        REPO_INDEX_PHYSICS: 'doubtnut_physics',
        REPO_INDEX_CHEMISTRY: 'doubtnut_chemistry',
        REPO_INDEX_BIOLOGY: 'doubtnut_biology',
        REPO_INDEX_NEW: 'doubtnut_external_questions',
        REPO_INDEX_WITH_TEXT_SOLUTION: 'question_bank',
        REPO_INDEX_ITER_HOMO: 'doubtnut_questions_pcm_v1_1',
        REPO_INDEX_INAPP_SEARCH: 'in_app_search',
        REPO_INDEX_MICRO_INAPP_SEARCH: 'micro_ias',
        REPO_INDEX_INAPP_SEARCH_SUGGESTER: 'in_app_search_suggester',
        REPO_INDEX_TYPE_INAPP_SEARCH: 'meta_library_search',
        REPO_INDEX_TYPE: 'repository',
        REPO_INDEX_WITH_META: 'questions_meta',
        REPO_INDEX_WITH_CHAPTER_ALIAS: 'advance_search_v1.1',
        REPO_INDEX_WITH_OPTIONS: 'question_bank_global_index_with_options_new',
        REPO_INDEX_GLOBAL_FIELDS: 'question_bank_stem_stop_synonyms_v7',
        REPO_INDEX_USA: 'question_bank_global_index_usa',
        BOOK_FUZZY_INDEX: 'book_fuzzy_index_with_class',
        REPO_INDEX_KATEX_OCRS: 'question_bank_katex_ocrs_new',
        LOG_MATHPIX_RESPONSE: 'mathpix_responses',
        ELASTIC_RESULT_SIZE: '20',
        ELASTIC_RESULT_SIZE_NEW: '40',
        PZN_ELASTIC_HOST: envVars.PZN_ELASTIC_HOST,
        ELASTIC_DAILY_GOAL_INSTANCE: {
            host: envVars.ELASTIC_DAILY_GOAL_INSTANCE,
            username: envVars.ELASTIC_DAILY_GOAL_USERNAME,
            password: envVars.ELASTIC_DAILY_GOAL_PASSWORD,
            liveClassRepoIndex: envVars.LIVE_CLASS_REPO_INDEX,
            videoRepoIndex: envVars.VIDEO_REPO_INDEX,
            pdfRepoIndex: envVars.PDF_REPO_INDEX,
        },
        ELASTIC_ALL_DOUBTS_INSTANCE: {
            host: envVars.ELASTIC_ALL_DOUBTS_INSTANCE,
            username: envVars.ELASTIC_ALL_DOUBTS_USERNAME,
            password: envVars.ELASTIC_ALL_DOUBTS_PASSWORD,
        },
    },
    redshift: {
        user: envVars.RED_SHIFT_USER,
        database: envVars.RED_SHIFT_DB,
        password: envVars.RED_SHIFT_PASS,
        port: envVars.RED_SHIFT_PORT,
        host: envVars.RED_SHIFT_HOST,
    },
    firebase: {
        base_url: envVars.FIREBASE_BASE_URL,
        project_id: envVars.FIREBASE_PROJECT_ID,
        private_key: envVars.FIREBASE_PRIVATE_KEY,
        client_email: envVars.FIREBASE_CLIENT_EMAIL,
        facebook_app_key: envVars.FACEBOOK_APP_KEY,
    },
    firebase_new: {
        base_url: envVars.FIREBASE_BASE_URL_NEW,
        project_id: envVars.FIREBASE_PROJECT_ID_NEW,
        private_key: envVars.FIREBASE_PRIVATE_KEY_NEW,
        client_email: envVars.FIREBASE_CLIENT_EMAIL_NEW,
        facebook_app_key: envVars.FACEBOOK_APP_KEY_NEW,
    },
    firebase_biology_neet: {
        base_url: envVars.FIREBASE_BASE_URL_BIOLOGY_NEET,
        project_id: envVars.FIREBASE_PROJECT_ID_BIOLOGY_NEET,
        private_key: envVars.FIREBASE_PRIVATE_KEY_BIOLOGY_NEET,
        client_email: envVars.FIREBASE_CLIENT_EMAIL_BIOLOGY_NEET,
        facebook_app_key: envVars.FACEBOOK_APP_KEY_BIOLOGY_NEET,
    },
    firebase_maths_iitjee: {
        base_url: envVars.FIREBASE_BASE_URL_MATHS_IITJEE,
        project_id: envVars.FIREBASE_PROJECT_ID_MATHS_IITJEE,
        private_key: envVars.FIREBASE_PRIVATE_KEY_MATHS_IITJEE,
        client_email: envVars.FIREBASE_CLIENT_EMAIL_MATHS_IITJEE,
        facebook_app_key: envVars.FACEBOOK_APP_KEY_MATHS_IITJEE,
    },
    whatsapp: {
        login: envVars.WHATSAPP_LOGIN,
        password: envVars.WHATSAPP_PASSWORD,
        netcore: {
            source: envVars.WHATSAPP_SOURCE_NETCORE,
            auth: `Bearer ${envVars.NETCORE_AUTH_KEY}`,
            api: {
                getMedia: 'https://waapi.pepipost.com/api/v2/media/{mediaId}',
                addMedia: 'https://waapi.pepipost.com/api/v2/media/upload/',
                sendMsg: 'https://waapi.pepipost.com/api/v2/message/',
                sendTemplate: 'https://waapi.pepipost.com/api/v2/consent/manage/',
            },
        },
    },
    whatsapp_fact: {
        host: envVars.NEWTON_FACTS_HOST,
    },
    optIn: {
        login: envVars.WHATSAPP_LOGIN_HSM,
        password: envVars.WHATSAPP_PASSWORD_HSM,
    },
    social_logins: {
        google: {
            clientId: envVars.GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: envVars.GOOGLE_OAUTH_CLIENT_SECRET,
        },
        facebook: {
            clientId: envVars.FACEBOOK_OAUTH_CLIENT_ID,
            clientSecret: envVars.FACEBOOK_OAUTH_CLIENT_SECRET,
        },
    },
    vdo_secret: envVars.VDO_CIPHER,
    vdocipherApikey: envVars.VDOCIPHER_API_KEY,
    versions: {
        'Version 1': '/v1', 'Version 2': '/v2', 'Version 3': '/v3', 'Version 4': '/v4', 'Version 5': '/v5', 'Version 6': '/v6', 'Version 7': '/v7', 'Version 8': '/v8', 'Version 9': '/v9', 'Version 10': '/v10', 'Version 11': '/v11', 'Version 12': '/v12', 'Version 13': '/v13', 'Test apis version': '/test', graphql: '/api',
    },
    ht_olympiad_auth: envVars.HT_OLYMPIAD_AUTH_TOKEN,
    two_fa_key: envVars.TWO_FA_KEY,
    VISER_SEARCH_AUTH_KEY: envVars.VISER_SEARCH_AUTH_KEY,
    VISER_DIAGRAM_MATCHER_AUTH_KEY: envVars.VISER_DIAGRAM_MATCHER_AUTH_KEY,
    GOOGLE_VISION_KEY: envVars.GOOGLE_VISION_KEY,
    YOUTUBE_API_KEY: envVars.YOUTUBE_API_KEY,
    WOLFRAM_KEY: envVars.WOLFRAM_KEY,
    mathpix_app_key: (envVars.MATHPIX_APP_KEY) ? envVars.MATHPIX_APP_KEY : envVars.MATHPIX_DEFAULT_APP_KEY,
    mathpix_app_id: (envVars.MATHPIX_APP_ID) ? envVars.MATHPIX_APP_ID : envVars.MATHPIX_DEFAULT_APP_ID,
    jwt_secret: envVars.JWT_SECRET,
    jwt_secret_new: envVars.JWT_SECRET_NEW || envVars.JWT_SECRET,
    jwt_secret_refresh: envVars.JWT_SECRET_REFRESH || envVars.JWT_SECRET_NEW || envVars.JWT_SECRET,
    jwt_secret_teacher: envVars.JWT_SECRET_TEACHER,
    jwt_secret_teacher_refresh: envVars.JWT_SECRET__TEACHER_REFRESH || envVars.JWT_SECRET_TEACHER,
    cdn_url: envVars.CDN_URL,
    question_image_s3_prefix: envVars.QUESTION_IMAGE_S3_PREFIX,
    search_service_url: envVars.SEARCH_SERVICE_URL,
    cdn_video_url: envVars.CDN_VIDEO_URL,
    cdn_akamai_video_url: envVars.CDN_AKAMAI_VIDEO_URL,
    blob_url: envVars.BLOB_URL,
    logo_path: envVars.DOUBTNUT_LOGO_PATH,
    aws_bucket_bounty_video: envVars.S3_BOUNTY_BUCKET,
    hash_key: 'doubtnut',
    bounty_mod_factor: 4,
    aws_access_id: envVars.AWS_ACCESS_ID,
    aws_secret: envVars.AWS_SECRET,
    aws_region: 'ap-south-1',
    aws_signature_version: 'v4',
    aws_bucket: envVars.S3_BUCKET,
    aws_ugc_image_bucket: envVars.S3_IMAGE_UGCBUCKET,
    aws_ugc_audio_bucket: envVars.S3_AUDIO_UGCBUCKET,
    branch_key: envVars.BRANCH_KEY,
    whatsapp_private_key: envVars.TOKEN_PRIVATE_KEY,
    send_grid_key: envVars.SEND_GRID_KEY,
    project_id: envVars.PROJECT_ID,
    instance_id: envVars.INSTANCE_ID,
    server_zone: envVars.ZONE,
    gamification_sqs: envVars.SQS,
    profanity_sqs: envVars.PROFANITY_SQS,
    elasticsearch_sqs: envVars.ELASTICSEARCH_SQS,
    test_question_table_sqs: envVars.TEST_QUESTION_TABLE_SQS,
    telemetry_sqs: envVars.TELEMETRY_SQS,
    whatsapp_sqs: envVars.WHATSAPP_SQS,
    notification_sqs: envVars.NOTIFICATION_SQS,
    class_change_sqs: `https://sqs.ap-south-1.amazonaws.com/942682721582/student_profile_update_${envVars.NODE_ENV}.fifo`,
    regional_sqs: envVars.REGIONAL_SQS,
    question_ask_sns: envVars.QUESTION_ASK_SNS,
    video_view_sns: envVars.VIDEO_VIEW_SNS,
    update_parent_id_sns: envVars.UPDATE_PARENT_ID_SNS,
    search_service_user_percent: envVars.SEARCH_SERVICE_USER_PERCENT,
    search_service_user_list: (envVars.SEARCH_SERVICE_USER_LIST) ? envVars.SEARCH_SERVICE_USER_LIST.split(',').map(Number) : envVars.SEARCH_SERVICE_USER_LIST,
    lead_crm_url: envVars.LEAD_CRM_URL,
    lead_crm_key: envVars.LEAD_CRM_KEY,

    // IP rate limit
    OTPLimitPerDay: 50, // 20,
    OTPLimitMobileNo: 50,
    deepLinkPerDay: 5,
    OTPLimitPerMinute: 100, // 14,
    OTPRetryDelay: {
        mobile: 120,
        email_id: 300,
    },
    // payment related
    RAZORPAY_KEY_ID: envVars.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: envVars.RAZORPAY_KEY_SECRET,

    PAYTM: {
        BASE_URL: envVars.PAYTM_BASE_URL || 'https://securegw-stage.paytm.in',
        MID: envVars.PAYTM_MID || 'YdRTlv14200785527533',
        WEBSITE_NAME: envVars.PAYTM_WEBSITE_NAME || 'WEBSTAGING',
        KEY: envVars.PAYTM_KEY || '!Z!E_YhFMkg@Oqg&',
    },

    PAYTM_DISBURSEMENT: {
        BASE_URL: envVars.PAYTM_DISBURSEMENT_URL || 'https://staging-dashboard.paytm.com',
        MID: envVars.PAYTM_DISBURSEMENT_MID || 'Class216195656176686',
        KEY: envVars.PAYTM_DISBURSEMENT_KEY || 'DLxBeOV1MmveD4MP',
        SUB_WALLET_GUID: envVars.SUB_WALLET_GUID || 'e1cb80db-0424-11e9-9527-fa163e429e83',
    },
    PAYPAL_US: {
        BASE_URL: envVars.PAYPAL_BASE_URL || 'https://api.sandbox.paypal.com',
        AUTH: envVars.PAYPAL_AUTH || 'QVJQXy1SOS1NVUN0WGprVThPa1lBajkyZ3ZPczd3cnRWUm5Md0dkWUx1cFAyVlVLY19kNTJTT2ZJY2Y4LUdGaHY2RXgyWHFKS3o1SkdFNm46RU9kYkpxQ2F1aGlnZWFGR2ZOOVhiLXRaX2duZ0hwd19EYm9CTzFJc3d2X0QyLVUwUy1POGllY2ZDUzFVVTdWblp2Vy1YTEwzTnUwckpvZFo=',
    },
    SHIPROCKET: {
        BASE_URL: envVars.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in',
        EMAIL: envVars.SHIPROCKET_API_USER_EMAIL || 'prashant.gupta@doubtnut.com',
        PASSWORD: envVars.SHIPROCKET_API_USER_PASSWORD || 'doubtnut',
    },
    GRAYQUEST: {
        API_KEY: envVars.GRAYQUEST_API_KEY || '3268d893f74558e36bbc79d209a0daad1af502a2',
        SECRET: envVars.GRAYQUEST_SECRET || '752ea5d7573c27b713b46789085722c44d7712c3',
        CLIENT_ID: envVars.GRAYQUEST_CLIENT_ID || '22c48aaf-6841-4a74-a4bc-440177fba685',
        BASE_URL: envVars.GRAYQUEST_BASE_URL || 'https://erp-api.graydev.tech',
        WEBHOOK_SECRET: envVars.GRAYQUEST_WEBHOOK_SECRET || 'ABCDe@1234',
    },
    SHOPSE: {
        BASE_URL: envVars.SHOPSE_BASE_URL || 'https://staging.getshopse.com',
        RESPONSE_KEY: envVars.SHOPSE_RESPONSE_KEY || '6tsv77n6oi666apc3bjygqmnzayyfn',
        API_TOKEN: `Basic ${envVars.SHOPSE_API_TOKEN}` || 'Basic MDcyMDA6YjRmOGRlOGItMzM4ZS00N2NmLTkxMTMtNDJlMjVmMDk5MjNl',
        IV_KEY: envVars.SHOPSE_IV_KEY || 'dJRIW9WyAK2O4t4JDbbHTA==',
        SECRET_KEY: envVars.SHOPSE_ENCRYPTION_KEY || 'zTeDwTh34F69rJY+eiAatYR1kyj6Kxh9eXieJVsplIs=',
        RETURN_URL: envVars.SHOPSE_RETURN_URL || 'https://pay.doubtnut.com/static/shopse_complete.html',
        WEBHOOK_URL: envVars.SHOPSE_WEBHOOK_URL || 'https://api.doubtnut.com/v1/payment/shopse/webhook',
    },
    PAYU: {
        BASE_URL: envVars.PAYU_BASE_URL || 'https://test.payu.in',
        FORM_BASE_URL: envVars.PAYU_FORM_BASE_URL || 'https://test.payu.in',
        MID: envVars.PAYU_MID || '115703',
        KEY: envVars.PAYU_KEY || '7MFZy1',
        SALT: envVars.PAYU_SALT || 'T3jHctSGBvwoYeZOpJOew8VYKhkr9ZgK',
    },
    pznUrl: envVars.PZN_URL,
    ocrServiceUrl: envVars.OCR_SERVICE_URL,
    preprocessServiceUrl: envVars.PREPROCESS_SERVICE_URL,
    questionAskPersonalizationElasticHost: envVars.QUESTION_ASK_PERSONALIZATION_ELASTIC_HOST,
    viserOcrEndpoint: envVars.VISER_OCR_ENDPOINT,
    mathpixOcrEndpoint: envVars.MATHPIX_OCR_ENDPOINT,
    viserSearchEndpoint: envVars.VISER_SEARCH_ENDPOINT,
    viserDiagramMatchEndpoint: envVars.VISER_DIAGRAM_MATCHER_API,
    couponServiceUrl: envVars.COUPON_SERVICE_URL,
    searchServiceStagingApiUrl: envVars.SEARCH_SERVICE_STAGING_API_URL,
    searchServiceApiUrl: envVars.SEARCH_SERVICE_API_URL,
    searchServiceApiEKSUrl: envVars.SEARCH_SERVICE_API_EKS,
    searchServiceUtilsApiEKSUrl: envVars.SEARCH_SERVICE_UTILS_API_EKS,
    simpsonServiceUrl: envVars.SIMSPON_SERVICE_URL,
    // package related
    subscription_threshold: (typeof envVars.PACKAGE_SUBSCRIPTION_RENEWAL_THRESHOLD !== 'undefined') ? parseInt(envVars.PACKAGE_SUBSCRIPTION_RENEWAL_THRESHOLD) : 5,
    package_subscription_flagr_id: (typeof envVars.PACKAGE_SUBSCRIPTION_FLAGR_ID !== 'undefined') ? parseInt(envVars.PACKAGE_SUBSCRIPTION_FLAGR_ID) : 15,
    package_subscription_liveclass_flagr_id: (typeof envVars.PACKAGE_SUBSCRIPTION_LIVECLASS_FLAGR_ID !== 'undefined') ? parseInt(envVars.PACKAGE_SUBSCRIPTION_LIVECLASS_FLAGR_ID) : 49,
    package_subscription_emi_flagr_id: (typeof envVars.PACKAGE_SUBSCRIPTION_LIVECLASS_FLAGR_ID !== 'undefined') ? parseInt(envVars.PACKAGE_SUBSCRIPTION_LIVECLASS_FLAGR_ID) : 80,
    package_subscription_liveclass_emi_flagr_id: (typeof envVars.PACKAGE_SUBSCRIPTION_LIVECLASS_FLAGR_ID !== 'undefined') ? parseInt(envVars.PACKAGE_SUBSCRIPTION_LIVECLASS_FLAGR_ID) : 82,
    default_package_duration_list: (typeof envVars.DEFAULT_PACKAGE_DURATION_LIST !== 'undefined') ? envVars.DEFAULT_PACKAGE_DURATION_LIST.split(',') : [30, 90, 180],
    show_vip_question_interval: 9,
    MSG91_AUTH_KEY: envVars.AUTH_KEY_MSG91,
    MSG91_TEMPLATE_ID: envVars.MSG91_TEMPLATE_ID,
    TWO_FA_TEMPLATE_NAME: envVars.TEMPLATE_NAME_2FA,
    liveclass: {
        playbackDomainName: envVars.STREAM_PLAYBACK_DOMAIN,
        pushDomainName: envVars.STREAM_PUSH_DOMAIN,
        appName: envVars.STREAM_APPNAME,
        authKey: envVars.STREAM_AUTHKEY,
        vodDomain: envVars.VOD_DOMAIN,
    },
    microUrl: envVars.MICRO_URL,
    microUrlLegacy: envVars.MICRO_URL_LEGACY,
    PASCAL_URL: envVars.PASCAL_URL,
    appKey: envVars.appKey,
    tencent_secret_id: envVars.TENCENT_SECRET_ID,
    tencent_secret_key: envVars.TENCENT_SECRET_KEY,
    tencent_app_id: envVars.TENCENT_APP_ID,
    tencent_app_key: envVars.TENCENT_APP_KEY,
    tencent_app_template_id: envVars.TENCENT_APP_TEMPLATE_ID,
    pagerduty_api_key: envVars.PAGERDUTY_API_KEY,
    gupshup: {
        userid: envVars.GUPSHUP_SMS_USER_ID,
        password: envVars.GUPSHUP_SMS_PASSWORD,
    },
    events_mongo: {
        database_url: envVars.EVENTS_MONGO_URL,
        database_name: envVars.EVENTS_MONGO_DB_NAME,
        database_user: envVars.EVENTS_MONGO_USER,
        database_pass: envVars.EVENTS_MONGO_PASS,
        connect: envVars.CONNECT_EVENTS_MONGO.toLowerCase() !== 'false',
    },
    kafka: {
        hosts: envVars.KAFKA_HOSTS ? envVars.KAFKA_HOSTS.split(',') : [],
        de_hosts: envVars.KAFKA_DE_HOSTS ? envVars.KAFKA_DE_HOSTS.split(',') : [],

    },
    WEBAUTH: {
        WEB_AUTH_KEY: envVars.WEB_AUTH_KEY || 'ZG91YnRudXQld2ViYXV0aA==bw67ebd3',
        WEB_AUTH_IV: envVars.WEB_AUTH_IV || 'd2ViaXYlZGRudXQ=',
    },
    IAS_VANILLA_BASE_URL: envVars.IAS_VANILLA_BASE_URL,
    CONVIVA_CLIENT_KEY: envVars.CONVIVA_CLIENT_KEY,
    NEWTON_NOTIFICATION_URL: `${envVars.MICRO_URL}/api/newton/notification/send`,
    MYSQL_MAX_EXECUTION_TIME_IN_MILLISECONDS: (typeof envVars.MYSQL_MAX_EXECUTION_TIME_IN_MILLISECONDS !== 'undefined') ? parseInt(envVars.MYSQL_MAX_EXECUTION_TIME_IN_MILLISECONDS) : 4 * 60 * 1000, // default is 4 min
};

const scriptsConfig = {
    mysql_analytics: {
        host: envVars.MYSQL_HOST_ANALYTICS,
        user: envVars.MYSQL_USER_ANALYTICS,
        password: envVars.MYSQL_PASS_ANALYTICS,
        database: envVars.MYSQL_DB_ANALYTICS,
        timezone: envVars.MYSQL_TIMEZONE_ANALYTICS,
    },
    mysql_write: {
        host: envVars.MYSQL_HOST_WRITE,
        user: envVars.MYSQL_USER_WRITE,
        password: envVars.MYSQL_PASS_WRITE,
        database: envVars.MYSQL_DB_WRITE,
        timezone: envVars.MYSQL_TIMEZONE_ANALYTICS,
    },
};
module.exports = { ...apiConfig, ...scriptsConfig };
