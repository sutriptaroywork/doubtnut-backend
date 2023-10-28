const config = require('../config/config');

const colors = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
const messageForOptIn = ['#hl', '#asknow', '#1', '#2', '#askanydoubt', '#askadoubtnow', '#answermyquestion', '#askaquestionnow', 'solve my doubt', '#askaquestion', '#solveadoubt', '#solvemydoubts', '#solvemyquestion', '#solvemydoubt', '#askdoubtnow', '#cleardoubt', '#askquestionnow', 'how to ask doubt?', '#solvedoubt', 'doubt ka solution kaise milega?', '#askquestion', '#askadoubt', '#clearmydoubt', 'how to ask a doubt?', 'apna sawaal kaise poochun?', 'solve', "type 'solve' and click enter to solve your doubts", 'apna sawaal kaise poochun?', 'how to ask my doubt?', 'sawaal puchhna shuru kaise karein?', 'doubt kaise solve hoga?', 'kaise milega solution?', 'doubt solve kaise hoga?', 'apna question kaise poochu?', 'doubt kaise solve karu?', 'how to ask maths question ?', 'question poochne ke steps?', 'answer kaise milega?', 'question kaise poochna hai?', 'solution kaise milega?', 'sawal poochne ka tareeka kya hai?', 'shuruat kaise karein?', 'how to get solution to my question?', 'kaise pooche sawal?', 'sawaal kaise poochna hai?', 'how to begin?', 'how to start?', 'sawaal kaise pooche?', 'sawaal kaise pooche', 'how to ask a question', 'how to ask a question?', 'how to ask a doubt?', 'how to ask a doubt', 'how to ask maths question?', 'how to ask maths doubt ?', '#start', '#answermydoubt', '#askdoubt', 'i saw this on facebook...', 'i saw this on instagram...'];
const elasticIndexes = ['doubtnut_new', 'mathpix_v2', 'google_vision_ocr', 'mathpix_v1'];
const salutations = ['hey', 'hello', 'hlo', 'good morning', 'good afternoon', 'good evening', 'good night', '#vmc', 'hi'];
const loginAskMessage = ['doubtnut par log in karein'];
module.exports = {
    topic_tab: [
        { subject: 'all', display: 'All' },
        { subject: 'MATHS', display: 'Mathematics' },
        { subject: 'CHEMISTRY', display: 'Chemistry' },
        { subject: 'PHYSICS', display: 'Physics' },
        { subject: 'BIOLOGY', display: 'Biology' },
    ],
    platform_tabs: [
        { key: 'doubtnut', display: 'Doubtnut' },
        { key: 'google', display: 'Google' },
        { key: 'cymath', display: 'CyMath' },
        { key: 'quora', display: 'Quora' },
        { key: 'yahoo', display: 'Yahoo' },
        { key: 'youtube', display: 'Youtube' },
    ],
    match_page_feedback: {
        feedback_text: 'Happy with the Solutions',
        is_show: 1,
        bg_color: '#e0eaff',
    },
    colors,
    color: {
        white: '#ffffff',
    },
    question_logging: {
        question_v10: 'askV10',
        question_v10_small_ocr: 'askV10_sm',
        question_v10_ias: 'askV10_ias',
        question_text: '',
        subject: 'Mathematics',
        chapter: 'DEFAULT',
        question: 'about to only mathematics',
        class: 12,
        studentId: 0,
        language: 'english',
        limit: 20,
        metadata: true,
        image_angle: 0,
        locale: 'en',
    },
    search_service_cb: {
        mail: {
            sender_email: 'autobot@doubtnut.com',
            client_email: 'search-eco-alerts-aaaagb64ti2dk7wcpr2xocoxoi@doubtnut-app.slack.com',
            subject: {
                rq_max_limit: 'MAX REQUESTS THRESHOLD CROSSED',
                rq_resolve_threshold: 'REQUESTS RESOLVE % LOW',
            },
            body: {
                rq_max_limit: 'diverting traffic to viser search for next 5 mins due to huge requests, \n val =',
                rq_resolve_threshold: 'diverting traffic to viser search for next 5 mins due to high latency, \n val =',
            },
        },
    },
    web_ask_values: ['WEB', 'mweb', 'desktop'],
    // added just now for testing
    whitelisted_student_ids_QA: [0, 588226, 3636340],
    messageForOptIn,
    unhandledMessageReply: 'I am still a learning robot 🤖 \n\n✅ Abhi sirf *Maths*, *Physics*, *Chemistry* & *Biology* question ki *photo* send karein \n\n❌ Handwritten question nahi bheje',
    salutations,
    loginAskMessage,
    questionAskUrlPrefix: 'https://d10lpgp6xz60nq.cloudfront.net/images/',
    questionThumbnailPrefix: `${config.staticCDN}q-thumbnail/`,
    facts: ['#fact', '#facts'],
    urlPrefixNonAmp: 'https://doubtnut.com',
    urlPrefixAmp: 'https://amp.doubtnut.com',
    pznUrl: `${config.pznUrl}api/`,
    whatsapp_login_msg_one: 'Samjho ho gya 🙂 \n Login karne ke liye iss link pe click karein 👉 ',
    whatsapp_login_msg_two: '  \n   Simple hai naa?\n \n   Bas Dhyaan rahe ⚠ \n \n   📌  Ye link sirf 1 hour ⏱ tak valid hai  \n 📌  Iss link ko kisi ke saath share naa karein 🤫 \n \n  Aur hum aapki privacy secured rakhenge 🔐',
    hetro_elastic_indexes: elasticIndexes,
    whatsapp_login_msg_optin: 'Hi! I am a robot  \n\nI can answer your Physics, Chemistry & Maths doubts.\n\nHow?  \n\nStep  - Click  photo of your question from the book\n\nStep  - Crop to one question   \n\n No handwritten questions\n\nSend question photo now  !',
    ocr_text_min_length: 10,
    current_ask_question_iteration: 'Mathpix Confidence',
    currentQuestionAskMetaIndex: 'doubtnut_new_physics_chemistry_maths_v3_test_decoouple_meta',
    widgetSelectionSubmitUrls: {
        exam: 'v7/homepage/submit-selected-widget-data',
        board: 'v7/homepage/submit-selected-widget-data',
        SUBJECT: 'v7/homepage/submit-subject-widget-choice',
        TOPIC_BOOSTER: 'v7/homepage/submit-widget-question-answer',
        CHALLENGE_OF_THE_DAY: 'v7/homepage/submit-widget-question-answer',
        BOARD_EXAM_BOOSTER: 'v7/homepage/submit-widget-question-answer',
    },
    // "board": "v7/homepage/submit-selected-widget-data"
    // },
    /* ------------IMAGE SERVICE--------------*/
    // IMAGE_SERVICE_API: `${config.preprocessServiceUrl}api/v1/preprocess-image-service`,
    IMAGE_SERVICE_API_OCR: `${config.ocrServiceUrl}api/v1/preprocess-image-service`,
    IMAGE_SERVICE_API_MATCH: `${config.ocrServiceUrl}api/v1/organic-image-service`,
    PREPROCESS_SERVICE_API_META_DATA: `${config.preprocessServiceUrl}api/v1/detect-ocr-topic`,
    BLUR_URL: `${config.preprocessServiceUrl}api/v1/detect-blur`,
    PREPROCESS_SERVICE_MULTIPLE_IMAGE_SPLIT: `${config.ocrServiceUrl}api/v1/multiple-image-split`,
    ORGANIC_CLASSIFICATION_ENDPOINT: '/api/v1/classify-organic-diagrams',
    COMPUTATIONAL_BASIC_ENDPOINT: '/api/v1/compute-basic',
    /* ------------SEARCH SERVICE--------------*/
    SEARCH_SERVICE_API_STAGING: `${config.searchServiceStagingApiUrl}`,
    SEARCH_SERVICE_API_FINAL: `${config.searchServiceApiUrl}`,
    SEARCH_SERVICE_API_EKS: `${config.searchServiceApiEKSUrl}`,
    SEARCH_UTILS_API_EKS: `${config.searchServiceUtilsApiEKSUrl}`,
    COMPUTATIONAL_QUESTIONS_SIMPSON_API_EKS: `${config.simpsonServiceUrl}`,
    SEARCH_SERVICE_DEFAULT_VERSION: {
        activeStringDiffSubjects: [
            'MATHS',
        ],
        apiUrl: '/api/vexp/search',
        bumpLanguage: true,
        bumpThreshold: 90,
        debug: true,
        defaultSuggestionCount: 40,
        donnotTranslate: true,
        elasticIndexName: 'question_bank_v1.1',
        getComputeQues: true,
        getComputeQues2: true,
        hideFromPanel: true,
        includeOnHindiPanel: true,
        isReorderSuggestions: true,
        optionsRemovalStrategyGoogle: 'v4',
        optionsRemovalStrategyMathpix: 'v8',
        preProcessor: [
            {
                arg: [
                    'log,ln',
                    'cosec,csc',
                    'rarr0,raar 0',
                    'times,xx',
                    'sin, si n',
                    'lt,lim',
                ],
                type: 'synonyms',
            },
            {
                googleOcrStrategy: 'v4',
                mathpixOcrStrategy: 'v8',
                type: 'strip_options',
            },
            {
                googleOcrStrategy: 'v2',
                mathpixOcrStrategy: 'v2',
                type: 'strip_question_number',
            },
            {
                type: 'replace_quad_only',
            },
        ],
        queryConfig: {
            maxTokensSize: 70,
            minimumShouldMatchPercent: 30,
            queryType: 'hybrid_slop',
            slop: 3,
        },
        searchImplVersion: 'v20',
        subjectWiseStringDiff: true,
        suggestionCount: 100,
        synonymDelimiters: [
            'log,ln',
            'cosec,csc',
            'rarr0,raar 0',
            'times,xx',
            'sin, si n',
            'lt,lim',
        ],
        useViserMathsOcr: true,
        version: 'v_viser_math_seq_google_v1.1',
        versionSuffix: 'fallback',
    },
    HINDI_BUMP_THRESHOLD: 90,
    // auto scroll time for banner and promolist
    autoScrollTime: 3,
    NO_TRANSLATION_LANGUAGE_CODES: ['en', 'es', 'gl', 'ca', 'cy', 'it', 'gd', 'sv', 'da', 'ro', 'fil', 'mt', 'pt-PT', 'hi', 'und'],
    VISER_SEARCH_API: `${config.viserSearchEndpoint}cosmosmatch`,
    VISER_DIAGRAM_MATCHER_API: `${config.viserDiagramMatchEndpoint}cosmosdiagram`,
    VISER_DIAGRAM_SCORE_MULTIPLIER: 1.12,
    // SEARCH_SERVICE_API_FINAL: 'http://35.154.79.161',
    SEARCH_SERVICE_API_VERSION: 'v1',
    SEARCH_SERVICE_RESULT_COUNT: 20,
    searchServiceComposerApiUrl: '/api/search-composer',
    FLAGR_HOST: config.flagr.baseUrl,
    FLAGR_GET_VARIANTS: '/api/v1/flags/3/variants',
    ASK_IMAGE_SIZE: 300000, // 0.3 MP area of image
    meta_data_indexes: 'questions_meta',
    topicTabsImplVersion: 'v11',
    topicTabsCount: 4,
    topicTabMinShowCount: 5,
    minimumElasticTokenLength: 70,
    iasKeyWords: ['class', 'exercise'],
    validTabTypes: ['video', 'live_class'],
    cameraTooltipAnimationDuration: 1500,
    cameraTooltip: ['Question ki photo khicho aur turant solution paao', 'No Handwritten Question'],
    cameraTooltipNew(locale) {
        return {
            in: [global.t8[locale].t('Question ki photo Kheechen, Solution Payen!'), global.t8[locale].t('Sirf Question ki Photo Bhejen!'), global.t8[locale].t('Question ki Clear Image Lein!'), global.t8[locale].t('Crop only 1 Questions!'), global.t8[locale].t('Crop the Question without options')],
            us: ['Click a Clear Image', 'Crop the Question Correctly', 'Don\'t Click Random Images'],
        };
    },
    // cameraTooltipNew: ['Question ki photo Kheechen, Solution Payen!', 'Sirf Question ki Photo Bhejen!', 'Question ki Clear Image Lein!', 'Crop only 1 Questions!', 'Crop the Question without options'],
    // cameraTooltipNew: ['Question ki photo Kheechen, Solution Payen!', 'Sirf Question ki Photo Bhejen!', 'Question ki Clear Image Lein!'],
    // cameraTooltipNewHindi: ['Question की फ़ोटो खींचे, सॉल्यूशन पायें!', 'सिर्फ question की फ़ोटो भेजें!', 'Question की साफ-साफ फ़ोटो लें!'],
    sampleQuestionsForCamera: {
        maths: {
            6: `${config.staticCDN}engagement_framework/EF56141D-8620-C7B9-AF4E-340311DB06D6.webp`,
            7: `${config.staticCDN}engagement_framework/3E6A9C1E-CA62-BA7C-9CFE-6102C024CB81.webp`,
            8: `${config.staticCDN}engagement_framework/0CA5B562-065E-2456-EE71-ABFDC938A936.webp`,
            9: `${config.staticCDN}engagement_framework/E104A7E2-826B-ABBE-DBB7-3AD4A2F8155C.webp`,
            10: `${config.staticCDN}engagement_framework/FB9A62FB-5434-7B48-C2F3-DDB699DAAF3F.webp`,
            11: `${config.staticCDN}engagement_framework/46003BC2-4AAF-DD77-196E-3794286DAE0F.webp`,
            12: `${config.staticCDN}engagement_framework/A20A5751-98C0-68C2-A9E9-F41A31E2512C.webp`,
            14: `${config.staticCDN}engagement_framework/3E6A9C1E-CA62-BA7C-9CFE-6102C024CB81.webp`,
        },
        physics: {
            9: `${config.staticCDN}engagement_framework/D23C391F-E323-3234-2B08-E81B12AFA1B9.webp`,
            10: `${config.staticCDN}engagement_framework/787FD263-99B6-2920-D052-978323F17A85.webp`,
            11: `${config.staticCDN}engagement_framework/47C2C892-7917-6997-3AD2-574CC5A1C03C.webp`,
            12: `${config.staticCDN}engagement_framework/51E2AA3B-D496-2F25-D9D3-4187DD8E895F.webp`,
        },
        chemistry: {
            9: `${config.staticCDN}engagement_framework/8B7D303D-C7EF-E16C-D20D-72F95398CD8E.webp`,
            10: `${config.staticCDN}engagement_framework/84DF91A7-2716-369B-2E5F-613D46F4F434.webp`,
            11: `${config.staticCDN}engagement_framework/68D5C662-30F6-3C27-6E48-B06D47D8150B.webp`,
            12: `${config.staticCDN}engagement_framework/DB78B4CF-A2EE-FDF8-8ACE-0F2032DC1AA9.webp`,
        },
        biology: {
            9: `${config.staticCDN}engagement_framework/A95DE8F7-8C98-1182-5F43-EF3DFF8FC71C.webp`,
            10: `${config.staticCDN}engagement_framework/8947AA51-3DA2-8E47-D9CA-F6EADB7844F4.webp`,
            11: `${config.staticCDN}engagement_framework/EE1D02E4-6F0E-3AC7-FB84-60B85C8FB6C2.webp`,
            12: `${config.staticCDN}engagement_framework/06E49E48-7339-BAC9-280F-658B12A16BA2.webp`,
        },
    },
    sampleQuestionsForCameraNew: {
        en: {
            6: ['q-thumbnail-localized/4760/english.webp', 'q-thumbnail-localized/4549/english.webp'],
            7: ['q-thumbnail-localized/5633/english.webp', 'q-thumbnail-localized/5812/english.webp'],
            8: ['q-thumbnail-localized/5194/english.webp', 'q-thumbnail-localized/4882/english.webp'],
            9: ['q-thumbnail-localized/3826/english.webp', 'q-thumbnail-localized/11757936/english.webp', 'q-thumbnail-localized/26292094/english.webp', 'q-thumbnail-localized/26291459/english.webp'],
            10: ['q-thumbnail-localized/3184/english.webp', 'q-thumbnail-localized/26296776/english.webp', 'q-thumbnail-localized/26296666/english.webp', 'q-thumbnail-localized/26776230/english.webp'],
            11: ['q-thumbnail-localized/50/english.webp', 'q-thumbnail-localized/20479066/english.webp', 'q-thumbnail-localized/20477055/english.webp', 'q-thumbnail-localized/52329833/english.webp'],
            '11_IIT_JEE': ['q-thumbnail-localized/69046642/english.webp', 'q-thumbnail-localized/11309598/english.webp', 'q-thumbnail-localized/19380476/english.webp'],
            '11_NEET': ['q-thumbnail-localized/15836237/english.webp', 'q-thumbnail-localized/12225874/english.webp', 'q-thumbnail-localized/16599310/english.webp'],
            12: ['q-thumbnail-localized/1531/english.webp', 'q-thumbnail-localized/20692911/english.webp', 'q-thumbnail-localized/20866717/english.webp', 'q-thumbnail-localized/52304538/english.webp'],
            '12_IIT_JEE': ['q-thumbnail-localized/114770874/english.webp', 'q-thumbnail-localized/12306722/english.webp', 'q-thumbnail-localized/15602864/english.webp'],
            '12_NEET': ['q-thumbnail-localized/11747854/english.webp', 'q-thumbnail-localized/12226343/english.webp', 'q-thumbnail-localized/26854994/english.webp'],
            '13_IIT_JEE': ['q-thumbnail-localized/114770874/english.webp', 'q-thumbnail-localized/12306722/english.webp', 'q-thumbnail-localized/15602864/english.webp'],
            '13_NEET': ['q-thumbnail-localized/11747854/english.webp', 'q-thumbnail-localized/12226343/english.webp', 'q-thumbnail-localized/26854994/english.webp'],
            14: ['q-thumbnail-localized/22546282/english.webp', 'q-thumbnail-localized/22545640/english.webp'],
            21: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            22: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            23: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            24: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            25: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            26: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            27: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
        },
        hi: {
            6: ['q-thumbnail-localized/4500/hindi.webp', 'q-thumbnail-localized/4649/hindi.webp'],
            7: ['q-thumbnail-localized/5529/hindi.webp', 'q-thumbnail-localized/5773/hindi.webp'],
            8: ['q-thumbnail-localized/4935/hindi.webp', 'q-thumbnail-localized/5233/hindi.webp'],
            9: ['q-thumbnail-localized/30617085/hindi.webp', 'q-thumbnail-localized/31584459/hindi.webp', 'q-thumbnail-localized/28392904/hindi.webp', 'q-thumbnail-localized/94512887/hindi.webp'],
            10: ['q-thumbnail-localized/119414574/hindi.webp', 'q-thumbnail-localized/31586124/hindi.webp', 'q-thumbnail-localized/28395131/hindi.webp', 'q-thumbnail-localized/121334881/hindi.webp'],
            11: ['q-thumbnail-localized/26871150/hindi.webp', 'q-thumbnail-localized/26299982/hindi.webp', 'q-thumbnail-localized/26297361/hindi.webp', 'q-thumbnail-localized/153650178/hindi.webp'],
            '11_IIT_JEE': ['q-thumbnail-localized/320186357/hindi.webp', 'q-thumbnail-localized/9515241/hindi.webp', 'q-thumbnail-localized/11467268/hindi.webp'],
            '11_NEET': ['q-thumbnail-localized/53090662/hindi.webp', 'q-thumbnail-localized/15716711/hindi.webp', 'q-thumbnail-localized/12226009/hindi.webp', 'q-thumbnail-localized/341475023/hindi.webp'],
            12: ['q-thumbnail-localized/30519588/hindi.webp', 'q-thumbnail-localized/28212785/hindi.webp', 'q-thumbnail-localized/26299346/hindi.webp', 'q-thumbnail-localized/177250439/hindi.webp'],
            '12_IIT_JEE': ['q-thumbnail-localized/320185727/hindi.webp', 'q-thumbnail-localized/10964389/hindi.webp', 'q-thumbnail-localized/12004718/hindi.webp'],
            '12_NEET': ['q-thumbnail-localized/16266399/hindi.webp', 'q-thumbnail-localized/12659781/hindi.webp', 'q-thumbnail-localized/95094621/hindi.webp'],
            '13_IIT_JEE': ['q-thumbnail-localized/320185840/hindi.webp', 'q-thumbnail-localized/10964389/hindi.webp', 'q-thumbnail-localized/12004718/hindi.webp'],
            '13_NEET': ['q-thumbnail-localized/16266399/hindi.webp', 'q-thumbnail-localized/12659781/hindi.webp', 'q-thumbnail-localized/372958878/hindi.webp'],
            14: ['q-thumbnail-localized/4500/hindi.webp', 'q-thumbnail-localized/4649/hindi.webp'],
            21: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            22: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            23: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            24: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            25: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            26: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
            27: ['q-thumbnail-localized/153285023/english.png', 'q-thumbnail-localized/153284714/english.png', 'q-thumbnail-localized/153285016/english.png'],
        },
    },
    sampleQuestionsSubject: {
        en: {
            6: ['Maths', 'Maths'],
            7: ['Maths', 'Maths'],
            8: ['Maths', 'Maths'],
            9: ['Maths', 'Physics', 'Cheimstry', 'Biology'],
            10: ['Maths', 'Physics', 'Cheimstry', 'Biology'],
            11: ['Maths', 'Physics', 'Cheimstry', 'Biology'],
            '11_IIT_JEE': ['Maths', 'Physics', 'Cheimstry'],
            '11_NEET': ['Physics', 'Cheimstry', 'Biology'],
            12: ['Maths', 'Physics', 'Cheimstry', 'Biology'],
            '12_IIT_JEE': ['Maths', 'Physics', 'Cheimstry'],
            '12_NEET': ['Physics', 'Cheimstry', 'Biology'],
            '13_IIT_JEE': ['Maths', 'Physics', 'Cheimstry'],
            '13_NEET': ['Physics', 'Cheimstry', 'Biology'],
            14: ['Maths', 'Maths'],
            21: ['Maths', 'Maths', 'Maths'],
            22: ['Maths', 'Maths', 'Maths'],
            23: ['Maths', 'Maths', 'Maths'],
            24: ['Maths', 'Maths', 'Maths'],
            25: ['Maths', 'Maths', 'Maths'],
            26: ['Maths', 'Maths', 'Maths'],
            27: ['Maths', 'Maths', 'Maths'],
        },
        hi: {
            6: ['Maths', 'Maths'],
            7: ['Maths', 'Maths'],
            8: ['Maths', 'Maths'],
            9: ['Maths', 'Physics', 'Cheimstry', 'Biology'],
            10: ['Maths', 'Physics', 'Cheimstry', 'Biology'],
            11: ['Maths', 'Physics', 'Cheimstry', 'Biology'],
            '11_IIT_JEE': ['Maths', 'Physics', 'Cheimstry'],
            '11_NEET': ['Maths', 'Physics', 'Cheimstry', 'Biology'],
            12: ['Maths', 'Physics', 'Cheimstry', 'Biology'],
            '12_IIT_JEE': ['Maths', 'Physics', 'Cheimstry'],
            '12_NEET': ['Physics', 'Cheimstry', 'Biology'],
            '13_IIT_JEE': ['Maths', 'Physics', 'Cheimstry'],
            '13_NEET': ['Physics', 'Cheimstry', 'Biology'],
            14: ['Maths', 'Maths'],
            21: ['Maths', 'Maths', 'Maths'],
            22: ['Maths', 'Maths', 'Maths'],
            23: ['Maths', 'Maths', 'Maths'],
            24: ['Maths', 'Maths', 'Maths'],
            25: ['Maths', 'Maths', 'Maths'],
            26: ['Maths', 'Maths', 'Maths'],
            27: ['Maths', 'Maths', 'Maths'],
        },
    },
    srpBannerTxt: {
        6: [
            'NCERT questions milenge ab Doubtnut par',
            'Topic Videos se samjho concepts jaldi se',
            'Daily test se karo ab apni taiyaari pakki',
            'RD Sharma Solutions paao ab Doubtnut par',
        ],
        7: [
            'NCERT questions milenge ab Doubtnut par',
            'Topic Videos se samjho concepts jaldi se',
            'Daily test se karo ab apni taiyaari pakki',
            'RD Sharma Solutions paao ab Doubtnut par',
        ],
        8: [
            'NCERT questions milenge ab Doubtnut par',
            'Topic Videos se samjho concepts jaldi se',
            'Daily test se karo ab apni taiyaari pakki',
            'RD Sharma Solutions paao ab Doubtnut par',
        ],
        9: [
            'NCERT questions milenge ab Doubtnut par',
            'Topic Videos se samjho concepts jaldi se',
            'Daily test se karo ab apni taiyaari pakki',
            'Foundation Course se karo Ek dumdaar shuruvat',
            'Physics, Chemistry, Biology, Maths sabhi subjects se karo dosti',
        ],
        10: [
            'NCERT questions milenge ab Doubtnut par',
            'Topic Videos se samjho concepts jaldi se',
            'Daily test se karo ab apni taiyaari pakki',
            'Doubtnut ab UP board ke liye bhi',
            'Board topics se karo boards ki pakki taiyaari',
            'Sample papers ke sath ho jaao taiyaar',
            'Physics, Chemistry, Biology, Maths sabhi subjects se karo dosti',
        ],
        11: [
            'Important Exams ki taiyaari ab banaao asaan',
            'Mock test se karo taiyaari pakki',
            'JEE Previous year solutions se karo taiyaari non-stop',
            'HC Verma, DC pandey ab sabhi ke solutions paao',
            'Physics, Chemistry, Biology, Maths sabhi subjects se karo dosti',
        ],
        12: [
            'Important Exams ki taiyaari ab banaao asaan',
            'Mock test se karo taiyaari pakki',
            'JEE Previous year solutions se karo taiyaari non-stop',
            'HC Verma, DC pandey ab sabhi ke solutions paao',
            'Physics, Chemistry, Biology, Maths sabhi subjects se karo dosti',
        ],
        14: [
            'NCERT questions milenge ab Doubtnut par',
            'Topic Videos se samjho concepts jaldi se',
            'Daily test se karo ab apni taiyaari pakki',
            'RD Sharma Solutions paao ab Doubtnut par',
        ],
    },
    languageObject: {
        hi: 'hindi',
        en: 'english',
        bn: 'bengali',
        gu: 'gujarati',
        kn: 'kannada',
        ml: 'malayalam',
        mr: 'marathi',
        ne: 'nepali',
        pa: 'punjabi',
        ta: 'Tamil',
        te: 'Telugu',
        ur: 'Urdu',
        pu: 'punjabi',
        '': 'english',
        null: 'english',
        undefined: 'english',
    },
    languageObjectNew: {
        hindi: 'hi',
        english: 'en',
        bengali: 'bn',
        gujarati: 'gu',
        kannada: 'kn',
        malayalam: 'ml',
        marathi: 'mr',
        nepali: 'ne',
        punjabi: 'pa',
        tamil: 'ta',
        telugu: 'te',
        urdu: 'ur',
    },
    languageObjectElasticMapping: {
        hindi: 'हिंदी',
        english: 'English',
        bangali: 'বাঙালি',
        bengali: 'বাঙালি',
        kannada: 'ಕನ್ನಡ',
        tamil: 'தமிழ்',
        telugu: 'తెలుగు',
        gujarati: 'ગુજરાતી',
        assamese: 'অসমীয়া',
        punjabi: 'ਪੰਜਾਬੀ',
        marathi: 'मराठी',
        odiya: 'ଓଡିଆ',
        malyalam: 'മല്യാലം',
    },
    askWhatsappData: {
        id: 13,
        key_name: 'whatsapp_ask',
        key_value: {
            image_url: `${config.staticCDN}images/whatsapp_1.png`,
            description: 'Ab clear karein apne doubts WhatsApp 8400400400 par bhi. Try it now.',
            button_text: 'CLICK HERE!',
            button_bg_color: '#ea532c',
            action_activity: 'external_url',
            action_data: {
                url: 'http://bit.ly/2xTwWBy',
            },
        },
        class: 'all',
        created_at: '2019-06-26T19:46:38.000Z',
        updated_at: '2019-07-22T06:07:38.000Z',
        is_active: 1,
    },
    topicVideoOrder: ['JEE', 'BOARD', 'NCERT', 'UP_BOARDS', 'NEET', 'FOUNDATION'],
    preProcessService: 'http://172.31.28.79:9000',
    questionInitSqsUrl: 'https://sqs.ap-south-1.amazonaws.com/942682721582/question-init',
    userQuestionSqsUrl: 'https://sqs.ap-south-1.amazonaws.com/942682721582/user-question',
    matchedQuestionSqsUrl: 'https://sqs.ap-south-1.amazonaws.com/942682721582/user-matched-questions',
    questionInitSnsUrl: 'arn:aws:sns:ap-south-1:942682721582:question-init',
    userQuestionSnsUrl: 'arn:aws:sns:ap-south-1:942682721582:user-questions',
    matchedQuestionSnsUrl: 'arn:aws:sns:ap-south-1:942682721582:user-questions-matched',
    communityQuestionSnsUrl: 'arn:aws:sns:ap-south-1:942682721582:user-questions-community',
    testQuestionInitSnsUrl: 'arn:aws:sns:ap-south-1:942682721582:question-init-test',
    testUserQuestionSnsUrl: 'arn:aws:sns:ap-south-1:942682721582:user-questions-test',
    testMatchedQuestionSnsUrl: 'arn:aws:sns:ap-south-1:942682721582:user-questions-matched-test',
    testCommunityQuestionSnsUrl: 'arn:aws:sns:ap-south-1:942682721582:user-questions-community-test',
    commentLength: 1000,
    cameraGuideNotificationData: {
        event: 'camera_guide',
        title: 'Koi bhi ho doubt, jawaab milega?',
        message: 'Doubtnut par sawaal dhoondhne ki Master Trick✌️',
        image: `${config.staticCDN}engagement_framework/DF44C8DF-2AF2-D883-FB7F-143494B9E6F5.webp`,
        data: '{"qid":2169870,"page":"NOTIFICATION","resource_type":"video"}',
    },
    camera_animation(locale) {
        return {
            settings: {
                in: [
                    {
                        title: global.t8[locale].t('Question ki Clear Image Len'),
                        footer: global.t8[locale].t('Apne questions ka sahi solution pane ke liye maximum possible clear image len'),
                    },
                    {
                        title: global.t8[locale].t('Crop Question Correctly'),
                        footer: global.t8[locale].t('Poora Question Sahi se crop karen sahi solution paane ke liye'),
                    },
                    {
                        title: global.t8[locale].t('Choose Correct Image'),
                        footer: global.t8[locale].t('Sahi jawaab pane ke liye, sahi sawal ki photo bhejen'),
                    },
                ],
                us: [
                    {
                        title: 'Click a Clear Image',
                        footer: 'To get the right solution, ensure you click a clear image of your question',
                    },
                    {
                        title: 'Crop the Question Correctly',
                        footer: 'Crop the question only!  Do not crop with options or question number.',
                    },
                    {
                        title: "Don't Click Random Images",
                        footer: 'To get the right video solution share valid question images',
                    },
                ],
            },
        };
    },
    whatsappCardPosition: 3,
    yt_student_id: [94, 80, -3, -24, -55],
    thumbnailSid: [80, 81, 82, 83, 84, 85, 86, 87, 93, 94, 95, 96, 97, 98, -3, -24, -55, -447],
    // srpBannerTxtNew: [
    //     'Hatho ko Saaf rakhe.\nDoubtnut ❤ Students #FightCorona',
    //     'Khaasne waalon se door rahe.\nDoubtnut ❤ Students #FightCorona',
    //     'Don\'t touch Eyes, Mouth,Nose.\nDoubtnut ❤ Students #FightCorona',
    //     'Bheed se door rahe.\nDoubtnut ❤ Students #FightCorona',
    // ],
    srpBannerTxtNew(locale) {
        return global.t8[locale].t('DN pe padho, DNR kamao aur Akarshak Paytm/flipkart vouchers aur anya coupons jeeto');
    },
    // srpBannerTxtNew2: {
    //     en: ['Ab Doubtnut roz de rha 1.5 lakh tak jeetne ka mauka!\nDein live class ke dauran quiz and jeeten ₹10000 tak roz!'],
    //     hi: ['हर रोज Doubtnut 1.5lakh + तक का पुरस्कार दे रहा है!\nलाइव क्लास के दौरान आयोजित quiz दें और 10,000 रुपये तक कमाने का मौका पाएं।'],
    // },
    etoos_version: 675,
    et_student_id: [-20],
    left_tag_background_color: '#FF0000',
    left_tag_text_color: '#000000',
    left_tag_text: 'Trending',
    right_tag_background_color: '#ffff00',
    right_tag_text_color: '#000000',
    right_tag_text: 'VIP',
    whatsappShareMessage: 'Hi share this please',
    neverVipAndTrialMessage: {
        text: 'Learn from VMC Top Faculty',
        button_text: 'START FREE TRIAL',
    },
    neverVipAndTrialMessageFn(trialDuration) {
        return {
            text: 'Learn from VMC Top Faculty',
            button_text: `START ${trialDuration}-day FREE TRIAL`,
        };
    },
    trialMessage(remainingDays) {
        return {
            text: (remainingDays === 0) ? 'Your Free Trial will expire today' : `Your Free Trial will expire in ${remainingDays} days`,
            button_text: 'Buy Now',
        };
    },
    everTrialUsedNoVipMessage: {
        text: 'Your Free Trial has expired ',
        button_text: 'Buy VIP Now',
    },
    vipMessage: {
        text: 'You are now a vip member',
        button_text: 'Check Your Plan',
    },
    lastFiveDaysVipMessage(remainingDays) {
        return {
            text: (remainingDays === 0) ? 'Your Vip Plan will expire today' : `Your Vip Plan will expire ${remainingDays} days`,
            button_text: 'Renew Now',
        };
    },
    expiredVipMessage: {
        text: 'Your Vip Plan has Expired ',
        button_text: 'Buy Now',
    },
    etoos_questions_prefix: 'https://d10lpgp6xz60nq.cloudfront.net/etoos/lecture/',
    etoos_video_prefix: 'http://acdn.etoosindia.com/',
    nonCachedLibIDs: [119469, 119470, 119471, 119472, 100780, 100782, 101270, 114227, 114226, 116569, 116570, 116571, 116572, 119676, 132975, 132976, 132977, 132978, 132979, 132980, 132981, 132982, 133234, 133238, 133239, 133240, 133242, 133246, 133247, 133248, 133255, 133256, 133257, 133258, 133259, 133260, 133249, 133250, 133251, 133252, 133253, 133254, 133261, 133262, 133263, 133264, 133265, 133266, 133267, 133268, 133269, 133270, 133271, 133272, 133273, 133274, 133275, 133276, 133277, 133278, 133279, 133280, 133281, 133282, 133283, 133284, 133285, 133286, 133287, 133288, 133289, 133290, 133291, 133292, 133293, 133294, 133295, 133296, 133297, 133298, 133299, 133300, 133301, 133302, 449483, 449484],
    libNotificationIds: [119676],

    onBoardinglanguageHeading: 'Aap App Kis Language Mein Use Karna chahte hein?\nDoubtnut App आप कौन सी भाषा में चलाना चाहते हैं?',
    onBoardinglanguageOldHeading: 'Select your preferred language',

    onBoardingClassHeading(locale) {
        return global.t8[locale].t('Aap Kaunsi Class Mein Padh Rhe Hein?');
    },
    onBoardingClassOldHeading: 'Select Your Class',

    onBoardingBoardHeading(locale) {
        return global.t8[locale].t('Aap Kaunse Board Se Padhai Kar Rhe hein?');
    },
    onBoardingBoardOldHeading: 'Select your Board',
    onBoardingStreamHeading(locale) {
        return global.t8[locale].t('Aap Kaunse Stream Pe Padhai Kar Rhe hein?');
    },
    onBoardingStreamOldHeading: 'Select your Stream',
    onBoardingExamHeading(locale) {
        return global.t8[locale].t('Aap Kis Kis Exam(s) ki Preparation Kar Rhe Hein?');
    },
    onBoardingExamOldHeading: 'Select your Exam',
    ncertSid: [1, 69],
    ncertLastWatchedTitle: {
        en: 'Continue studying from here',
        hi: 'यहां से पढ़ाई जारी रखें',
        hinglish: 'Yahaan se padhaayi jaari rakhen',
    },
    cdnUrl: 'https://d10lpgp6xz60nq.cloudfront.net',
    cdnUrlLimeLight: 'https://d3cvwyf9ksu0h5.cloudfront.net',
    cdnHostLimelightStatic: 'https://d10lpgp6xz60nq.cloudfront.net',
    cdnHostLimelightStaticWithPrefix: 'https://d10lpgp6xz60nq.cloudfront.net/',
    cdnHostLimelightStaticDONOTCHANGE: 'https://doubtnut-static.s.llnwi.net',

    askButtonText(locale) {
        return global.t8[locale].t('Ask Question');
    },

    askButtonActiveMessage(locale) {
        return global.t8[locale].t('Select all the answers to ask first Question');
    },
    askButtonInactiveMessage(locale) {
        global.t8[locale].t('Select all the answers to ask first Question');
    },

    classErrorMsg(locale) {
        return global.t8[locale].t('Please select your class to continue');
    },

    langErrorMsg(locale) {
        return global.t8[locale].t('Please select your language, board and exam to continue');
    },

    langErrorMsg910(locale) {
        return global.t8[locale].t('Please select your language and board to continue');
    },

    langErrorMsgHindi14: 'जारी रखने के लिए कृपया अपना भाषा और परीक्षा चुनें',

    boardErrorMsg(locale) {
        return global.t8[locale].t('Please select your board to continue');
    },

    boardErrorMsgFor910(locale) {
        return global.t8[locale].t('Please Select Your Board to continue');
    },

    streamErrorMsg(locale) {
        return global.t8[locale].t('Please select your stream to continue');
    },
    examErrorMsg(locale) {
        return global.t8[locale].t('Please select your exam to continue');
    },

    paymentCardMessage: 'Access lessons from all the teachers of VMC with VIP PASS',
    etoosSharingMessage: 'VMC top teachers NV sir, NKC Sir, MC sir, PS sir now on DoubtNut!! Start your JEE, NEET, Foundation preperation  today on DoubtNut App',
    classLocalised: {
        english: {
            13: 'Drop Yr',
            14: 'Govt Ex',
        },
        hindi: {
            13: 'ड्रॉपर',
            14: 'सरकारी परीक्षा',
        },
    },
    etoosGradient: {
        start: '#80FFFFFF',
        mid: '#80263238',
        end: '#80ffffff',
    },

    delayNotification(locale) {
        return {
            title: global.t8[locale].t('One doubt solved is one marks earned! 😍😍'),
            message: global.t8[locale].t('Jaldi se dekho apne doubt ka solution! 🤩🤩'),
            image: global.t8[locale].t('{{staticCDN}}engagement_framework/5E044ABD-C29B-BCAE-C9F5-6F0CB33A2A51.webp', { ns: 'asset', staticCDN: config.staticCDN }),
        };
    },
    defaultFlagVariantsForHomepage: -1,
    flagIdNameMap: {
        108: {
            key: 'liveclass-similar',
            default: {
                variantID: 385,
                flagID: 108,
                variantAttachment: {
                    enable: false,
                },
            },
        },
        49: {
            key: 'liveclass-pricing',
            default: {
                variantID: 208,
                flagID: 49,
                isDefault: true,
                variantAttachment: {
                    final_price: [900, 2200, 9000],
                    package_duration: [30, 90, 365],
                },
            },
        },
        15: {
            key: 'etoos-pricing',
            default: {
                variantID: 119,
                flagID: 15,
                isDefault: true,
                variantAttachment: {
                    final_price: [900, 2200, 7500],
                    package_duration: [30, 90, 365],
                    trial_duration: 3,
                },
            },
        },
        80: {
            key: 'emi_payment',
            default: {
                variantID: 308,
                flagID: 80,
                isDefault: true,
                variantAttachment: {
                    final_price: [15000, 20000, 9000, 20000],
                    package_duration: [365, 730],
                    trial_duration: 1,
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [2000, 3750, 3750],
                            duration: [60, 60],
                            intervals: 3,
                            package_duration: 365,
                            price: 10000,
                        },
                        {
                            downpayment: [3000, 6000, 6000],
                            duration: [60, 60],
                            intervals: 3,
                            package_duration: 730,
                            price: 15000,
                        },
                        {
                            downpayment: [1500, 2250, 2250],
                            duration: [30, 60],
                            intervals: 3,
                            package_duration: 180,
                            price: 7000,
                        },
                    ],
                },
            },
        },
        82: {
            key: 'liveclass_emi_pricing',
            default: {
                variantID: 319,
                flagID: 82,
                isDefault: true,
                variantAttachment: {
                    final_price: [900, 2200, 9000, 9000],
                    package_duration: [30, 90, 365],
                    trial_duration: 1,
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [5000, 2000, 2000],
                            duration: [30, 30],
                            intervals: 3,
                            package_duration: 365,
                        },
                    ],
                },
            },
        },
        102: {
            key: 'iit-neet-pricing',
            default: {
                variantID: 369,
                flagID: 102,
                isDefault: true,
                variantAttachment: {
                    is_new: true,
                    course: {
                        final_price: [18000],
                        package_duration: [730],
                        trial_duration: 7,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                        ],
                    },
                    vod: {
                        final_price: [1200, 9000, 13000, 6000],
                        package_duration: [30, 365, 730, 180],
                        trial_duration: 7,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2500, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [2000, 2500, 2500],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    all: {
                        final_price: [15000, 20000, 9000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 7,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    trial_duration: 3,
                },
            },
        },
        103: {
            key: 'boards-pricing',
            default: {
                variantID: 370,
                flagID: 103,
                isDefault: true,
                variantAttachment: {
                    is_new: true,
                    course: {
                        final_price: [15000, 20000, 9000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    vod: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    all: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    trial_duration: 3,
                },
            },
        },
        131: {
            key: 'boards-pricing',
            default: {
                variantID: 370,
                flagID: 103,
                isDefault: true,
                variantAttachment: {
                    is_new: true,
                    course: {
                        final_price: [15000, 20000, 9000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            // {
                            //     downpayment: [2000, 3750, 3750],
                            //     duration: [60, 60],
                            //     intervals: 3,
                            //     package_duration: 365,
                            //     price: 10000,
                            // },
                            // {
                            //     downpayment: [3000, 6000, 6000],
                            //     duration: [60, 60],
                            //     intervals: 3,
                            //     package_duration: 730,
                            //     price: 15000,
                            // },
                        ],
                    },
                    vod: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    all: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    trial_duration: 3,
                },
            },
        },
        132: {
            key: 'boards-X-pricing-English',
            default: {
                variantID: 465,
                flagID: 132,
                isDefault: true,
                variantAttachment: {
                    is_new: true,
                    course: {
                        final_price: [10000],
                        package_duration: [365],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                        ],
                    },
                    vod: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    all: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    trial_duration: 3,
                },
            },
        },
        133: {
            key: 'boards-X-pricing-Hindi',
            default: {
                variantID: 466,
                flagID: 133,
                isDefault: true,
                variantAttachment: {
                    is_new: true,
                    course: {
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [600, 600, 600, 600, 600, 600],
                                duration: [30, 30, 30, 30, 30],
                                intervals: 6,
                                package_duration: 180,
                                price: 3600,
                            },
                        ],
                        final_price: [2800],
                        package_duration: [180],
                        trial_duration: -1,
                    },
                    vod: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    all: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    trial_duration: -1,
                },
            },
        },
        135: {
            key: 'boards-XII-pricing-Hindi',
            default: {
                variantID: 476,
                flagID: 135,
                isDefault: true,
                variantAttachment: {
                    is_new: true,
                    course: {
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [800, 800, 800, 800, 800, 800],
                                duration: [30, 30, 30, 30, 30],
                                intervals: 6,
                                package_duration: 180,
                                price: 4800,
                            },
                        ],
                        final_price: [4800],
                        package_duration: [180],
                        trial_duration: -1,
                    },
                    vod: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    all: {
                        final_price: [15000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 1,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    trial_duration: -1,
                },
            },
        },
        146: {
            key: 'jee2020_september_batch',
            default: {
                variantID: 369,
                flagID: 102,
                isDefault: true,
                variantAttachment: {
                    is_new: true,
                    course: {
                        final_price: [18000],
                        package_duration: [730],
                        trial_duration: 7,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                        ],
                    },
                    vod: {
                        final_price: [1200, 9000, 13000, 6000],
                        package_duration: [30, 365, 730, 180],
                        trial_duration: 7,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2500, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [2000, 2500, 2500],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    all: {
                        final_price: [15000, 20000, 9000, 20000],
                        package_duration: [365, 730],
                        trial_duration: 7,
                        emi: true,
                        emi_details: [
                            {
                                downpayment: [2000, 3750, 3750],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 365,
                                price: 10000,
                            },
                            {
                                downpayment: [3000, 6000, 6000],
                                duration: [60, 60],
                                intervals: 3,
                                package_duration: 730,
                                price: 15000,
                            },
                            {
                                downpayment: [1500, 2250, 2250],
                                duration: [30, 60],
                                intervals: 3,
                                package_duration: 180,
                                price: 7000,
                            },
                        ],
                    },
                    trial_duration: 3,
                },
            },
        },
        151: {
            key: 'boards-IX-pricing-Hindi',
            default: {
                all: {
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [
                                4000,
                                9000,
                                9000,
                            ],
                            duration: [
                                60,
                                60,
                            ],
                            intervals: 3,
                            package_duration: 730,
                            price: 22000,
                        },
                    ],
                    final_price: [
                        18000,
                    ],
                    package_duration: [
                        730,
                    ],
                },
                course: {
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [
                                600,
                                600,
                                600,
                                600,
                                600,
                                600,
                            ],
                            duration: [
                                30,
                                30,
                                30,
                                30,
                                30,
                            ],
                            intervals: 6,
                            package_duration: 180,
                            price: 3600,
                        },
                    ],
                    final_price: [
                        1500,
                        2800,
                    ],
                    package_duration: [
                        90,
                        180,
                    ],
                    trial_duration: -1,
                },
                is_new: true,
                trial_duration: -1,
            },
        },
        152: {
            key: 'boards-XI-pricing-Hindi',
            default: {
                all: {
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [
                                4000,
                                9000,
                                9000,
                            ],
                            duration: [
                                60,
                                60,
                            ],
                            intervals: 3,
                            package_duration: 730,
                            price: 22000,
                        },
                    ],
                    final_price: [
                        18000,
                    ],
                    package_duration: [
                        730,
                    ],
                },
                course: {
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [
                                800,
                                800,
                                800,
                                800,
                                800,
                                800,
                            ],
                            duration: [
                                30,
                                30,
                                30,
                                30,
                                30,
                            ],
                            intervals: 6,
                            package_duration: 180,
                            price: 4800,
                        },
                    ],
                    final_price: [
                        2000,
                        3600,
                    ],
                    package_duration: [
                        90,
                        180,
                    ],
                    trial_duration: -1,
                },
                is_new: true,
                trial_duration: -1,
            },
        },
        182: {
            key: 'Boards_English_Medium_class_10',
            default: {
                all: {
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [
                                4000,
                                9000,
                                9000,
                            ],
                            duration: [
                                60,
                                60,
                            ],
                            intervals: 3,
                            package_duration: 730,
                            price: 22000,
                        },
                    ],
                    final_price: [
                        18000,
                    ],
                    package_duration: [
                        730,
                    ],
                },
                course: {
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [
                                1200,
                                1200,
                                1200,
                                1200,
                                1200,
                                1200,
                            ],
                            duration: [
                                30,
                                30,
                                30,
                                30,
                                30,
                            ],
                            intervals: 6,
                            package_duration: 180,
                            price: 7200,
                        },
                    ],
                    final_price: [
                        6000,
                    ],
                    package_duration: [
                        180,
                    ],
                    trial_duration: -1,
                },
                is_new: true,
                trial_duration: -1,
            },
        },
        184: {
            key: 'Boards_English_Medium_class_12',
            default: {
                all: {
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [
                                4000,
                                9000,
                                9000,
                            ],
                            duration: [
                                60,
                                60,
                            ],
                            intervals: 3,
                            package_duration: 730,
                            price: 22000,
                        },
                    ],
                    final_price: [
                        18000,
                    ],
                    package_duration: [
                        730,
                    ],
                },
                course: {
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [
                                1000,
                                1000,
                                1000,
                                1000,
                                1000,
                                1000,
                            ],
                            duration: [
                                30,
                                30,
                                30,
                                30,
                                30,
                            ],
                            intervals: 6,
                            package_duration: 180,
                            price: 6000,
                        },
                    ],
                    final_price: [
                        4800,
                    ],
                    package_duration: [
                        180,
                    ],
                    trial_duration: -1,
                },
                is_new: true,
                trial_duration: -1,
            },
        },
        185: {
            key: 'Jee_crash_course',
            default: {
                all: {
                    emi: true,
                    emi_details: [
                        {
                            downpayment: [
                                4000,
                                9000,
                                9000,
                            ],
                            duration: [
                                60,
                                60,
                            ],
                            intervals: 3,
                            package_duration: 730,
                            price: 22000,
                        },
                    ],
                    final_price: [
                        18000,
                    ],
                    package_duration: [
                        730,
                    ],
                },
                course: {
                    emi: false,
                    final_price: [
                        5000,
                    ],
                    package_duration: [
                        100,
                    ],
                    trial_duration: -1,
                },
                is_new: true,
                trial_duration: -1,
            },
        },
        201: {
            key: 'vip_bundle',
            default: {
                variantID: 639,
                flagID: 201,
                variantAttachment: {
                    enabled: false,
                    title: false,
                },
            },
        },
        229: {
            key: 'lc_top_icon_paid',
            default: {
                variantID: 721,
                flagID: 229,
                variantAttachment: {
                    enabled: false,
                },
            },
        },
        230: {
            key: 'lc_course_bg',
            default: {
                variantID: 724,
                flagID: 230,
                variantAttachment: {
                    free_bg: `${config.staticCDN}liveclass/COURSE_FREE.png`,
                    paid_bg: `${config.staticCDN}liveclass/COURSE_VIP.png`,
                },
            },
        },
        236: {
            key: 'lc_bundle',
            default: {
                variantID: 752,
                flagID: 236,
                variantAttachment: {
                    enabled: false,
                },
            },
        },
    },
    fuzzy_title: 'Books Related to Your Feedback on Doubtnut',
    inAppTopicsTabs: [
        { key: 'all', description: 'All', size: 4 },
        { key: 'pdf', description: 'PDFs', size: 4 },
        { key: 'video', description: 'Videos', size: 4 },
        { key: 'etoos_faculty_chapter', description: 'VMC Classes', size: 2 },
        { key: 'etoos_course', description: 'Courses', size: 2 },
        { key: 'ncert', description: 'NCERT', size: 4 },
        { key: 'topic', description: 'Topic Videos', size: 4 },
        { key: 'book', description: 'Books', size: 4 },
        { key: 'playlist', description: 'Playlist', size: 4 },
    ],
    colorCodeInApp: ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'],

    iasHowItWorksTitle(locale) {
        return global.t8[locale].t('Type karo ya Bol ke search karo');
    },

    iasHowItWorksOptions(locale) {
        return {
            1: global.t8[locale].t('Say'),
            2: global.t8[locale].t('Type'),
            3: global.t8[locale].t('Type'),
        };
    },
    iasHowItWorksOptionsData: {
        6: ['Algebra', 'Ratio And Proportion', 'Decimals', 'Integers', 'Topic PDF'],
        7: ['Real Numbers', 'Photosynthesis', 'Fractions And Decimals', 'Integers', 'Rational Numbers'],
        8: ['Pythagoras Theorem', 'Maths Ex 6.2', 'Data Handling', 'Factorisation', 'Mensuration'],
        9: ['Polynomials', 'Maths Ex 3.2', 'Motion', 'Circle', 'Sound'],
        10: ['Triangles	Surface Areas', 'Sources Of Energy', 'Arithmetic Progressions', 'Periodic Classification Of Element'],
        11: ['Gravitation', 'Differentiation', 'Electrostatics', 'Thermodynamics', 'Equilibrium'],
        12: ['IIT PDF/ NEET 2020', 'Current Electricity', 'Determinants', 'Atoms', 'Maths Exercise 4.1'],
        13: ['IIT PDF/ NEET 2020', 'Current Electricity', 'Determinants', 'Atoms', 'Maths Exercise 4.1'],
        14: ['NCERT class 10', 'Rakesh Yadav', 'IBPS exam', 'NCERT class 10', 'Rakesh Yadav'],
    },
    iasCoachMarkImage: `${config.staticCDN}images/ias_coacmark.png`,
    // userDefaultPic: 'images/user-default.webp',
    userDefaultPic: 'images/user-default-doubtnut.png',
    topMsg(locale) {
        return global.t8[locale].t('Welcome to Doubtnut');
    },
    classNextImage: 'images/class-next-screen.png',
    classNextMessage: 'Now you can solve unlimited questions from # for free!',
    classNextHindiMessage: 'अब आप मुफ्त में # से असीमित प्रश्नों को हल कर सकते हैं!',
    langNextImage: 'images/lang-next-screen.png',
    langNextMessage: 'Now you can watch 10 lakh+ video solutions from Physics, Chemistry, Maths and Biology!',
    // langNextMessage: 'Now you can watch 10 lakh+ video solutions from Physics, Chemistry, Maths and Biology in English!',
    langNextHindiMessage: 'अब आप भौतिकी, रसायन विज्ञान, गणित और जीवविज्ञान से 10 लाख + वीडियो समाधान देख सकते हैं!',
    langNextMathsImage: 'images/lang-next-maths-screen.png',
    langNextMathsMessage: 'Now you have free access to best content specifically curated for your target exam!',
    langNextMathsHindiMessage: 'अब आप गणित से # में 10 लाख + वीडियो समाधान देख सकते हैं!',
    boardNextImage: 'images/board-next-screen.png',

    boardNextMessage(locale) {
        return global.t8[locale].t('Now you can interact with million other students from #!');
    },

    langNameByCode: {
        en: 'English', hi: 'हिंदी', 'bn-en': 'বাঙালি', 'ta-en': 'தமிழ்', 'te-en': 'తెలుగు', 'kn-en': 'ಕನ್ನಡ', 'hi-en': 'English',
    },
    englishLangNameByCode: {
        en: 'English', hi: 'हिंदी', 'bn-en': 'English Medium in Bengali', 'ta-en': 'English Medium in Tamil', 'te-en': 'English Medium in Telugu', 'kn-en': 'English Medium in Kannada', 'hi-en': 'English',
    },
    langCodeByCode: {
        en: 'en',
        hi: 'hi',
        'bn-en': 'bn',
        'ta-en': 'ta',
        'te-en': 'te',
        'Kn-en': 'kn',
        'kn-en': 'kn',
        'hi-en': 'en',
        bn: 'bn',
        ta: 'ta',
        te: 'te',
        kn: 'kn',
    },
    viralVideoStudentIDS: [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 98],
    motionVersionCode: 724,
    advanceEmptyMsg(locale) {
        return global.t8[locale].t('No result found with this combination');
    },

    // subjectHindi: {
    //     MATHS: 'गणित',
    //     Mathematics: 'गणित',
    //     PHYSICS: 'भौतिकी',
    //     CHEMISTRY: 'रसायन विज्ञान',
    //     BIOLOGY: 'जीव विज्ञान',
    //     HISTORY: 'इतिहास',
    //     GEOGRAPHY: 'भूगोल',
    // },

    subjectHindi: {
        Mathematics: 'गणित',
        ALL: 'सब',
        'TOPPERS TALK': 'टॉपर्स टैल्क',
        ACCOUNTS: 'हिसाब किताब',
        'ADVANCED MATH': 'उन्नत गणित',
        AGRICULTURE: 'कृषि',
        'ARITHMETIC MATH': 'अंकगणित गणित',
        BIOLOGY: 'जीव विज्ञान',
        BOTANY: 'वनस्पति विज्ञान',
        'BUSINESS STUDIES': 'बिजनेस स्टडीज',
        'C.A': 'सामयिकी',
        CDP: 'बाल विकास एवं शिक्षा',
        CHEMISTRY: 'रसायन विज्ञान',
        'CHILD DEVELOPMENT AND PEDAGOGY': 'बाल विकास एवं शिक्षा',
        COMPUTER: 'कंप्यूटर',
        CONTEST: 'प्रतियोगिता',
        'CURRENT AFFAIRS': 'सामयिकी',
        'CURRENT AFFAIRS/STATIC GK': 'सामयिकी / सामान्य ज्ञान',
        ECONOMICS: 'अर्थशास्त्र',
        EDUCATION: 'शिक्षा',
        'ENGLISH GRAMMAR': 'अंग्रेज़ी व्याकरण',
        ENGLISH: 'अंग्रेज़ी',
        'ENVIRONMENTAL STUDIE': 'वातावरण का अध्ययन',
        'ENVIRONMENTAL STUDIES': 'वातावरण का अध्ययन',
        'ENVIRONMENT STUDIES': 'वातावरण का अध्ययन',
        'EVS AND BIOLOGY': 'वातावरण और जीवविज्ञान का अध्ययन',
        'GENERAL BIOLOGY': 'जीवविज्ञान',
        'GENERAL KNOWLEDGE AND APTITUDE': 'सामान्य ज्ञान और योग्यता',
        'GENERAL KNOWLEDGE': 'सामान्य ज्ञान',
        'GENERAL POLITY': 'राजनीति',
        'GENERAL SCIENCE': 'सामान्य विज्ञान',
        GEOGRAPHY: 'भूगोल',
        GUIDANCE: 'दिशा निर्देश',
        HINDI: 'हिन्दी',
        HISTORY: 'इतिहास',
        'IMPORTANT INFORMATION': 'महत्वपूर्ण सूचना',
        'IMPORTANT MESSAGE': 'महत्वपूर्ण संदेश',
        INTRODUCTION: 'परिचय',
        MATHEMATICS: 'गणित',
        'MATHS PAPER 1': 'गणित 1',
        'MATHS PAPER 2': 'गणित 2',
        MATHS: 'गणित',
        'MOTIVATIONAL VIDEOS': 'विविध वीडियो',
        NCERT_NEET_VIDEOS: 'एनसीईआरटीनीटवीडियो',
        PHYSICS: 'भौतिक विज्ञान',
        'POLITICAL SCIENCE': 'राजनीति विज्ञान',
        POLITY: 'सामान्य राजनीति',
        REASONING: 'तर्कशक्ति',
        SANSKRIT: 'संस्कृत',
        SCIENCE: 'विज्ञान',
        'SOCIAL SCIENCE': 'सामाजिक विज्ञान',
        SOCIOLOGY: 'नागरिक सास्त्र',
        'STATIC GK': 'स्थिर सामान्य ज्ञान',
        STRATEGY: 'रणनीति',
        'TECHNICAL MATHS': 'तकनीकी गणित',
        TEST: 'परीक्षा',
        'UP GK': 'यू.पी. सामान्य ज्ञान',
        'UP SPECIAL': 'यू.पी. स्पेशल',
        मूलविधि: 'मूलविधि',
        biology: 'जीवविज्ञान',
        Physics: 'भौतिक विज्ञान',
        Maths: 'गणित',
        chEMISTRY: 'रसायन विज्ञान',
        'WEEKLY TEST': 'साप्ताहिक टेस्ट',
    },

    iasSuggestionTitleLocalisation(locale) {
        return {
            trending: global.t8[locale].t('Trending Searches'),
            subject: global.t8[locale].t('Popular Subjects'),
            subject_live: global.t8[locale].t('Popular Live Classes'),
            recent: global.t8[locale].t('Recent Searches'),
            recent_video: global.t8[locale].t('Recent Doubt Solved'),
            recent_live_video: global.t8[locale].t('Live Class Videos'),
            book: global.t8[locale].t('Popular Books Solutions'),
            course: global.t8[locale].t('Courses for you'),
            exams: global.t8[locale].t('Previous Year Papers'),
            extra_marks: global.t8[locale].t('Courses for Extra Marks'),
            course_for_you: global.t8[locale].t('Popular Courses For You'),
            popular_on_doubtnut: global.t8[locale].t('Popular on Doubnut'),
            popular_on_mission_buniyad: global.t8[locale].t('Popular On Mission Buniyaad'),
        };
    },
    iasLandinBgColor: ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'],
    userGetChaptersUrl: `${config.PASCAL_URL}api/chapter/type/recent-views`,
    emi_options: {
        title1: 'Starting from',
        title2: '',
        subTitle1: 'Total Payable',
        subTitle2: 'EMI Duration and Details',
        titleColor: '#',
        bottomTitle: 'Pay with Part Fee EMI with 0% interest.',
        endTitle1: "- ALL EMI's cleared",
        middleTitle1: 'Next Payment of',
        middleBottomTitle: 'You are missing out on new lectures! Clear your payment to unlock now.',
    },
    vmcRankers() {
        return {
            type: 'rankers',
            data: {
                title: 'RANKERS TRAINED BY OUR FACULTY',
                subtitle: '',
                items: [
                    {
                        image_url: `${config.staticCDN}vmc/group.png`,
                        student_name: 'Harshit Gupta',
                        rank: 'AIR 26',
                    },
                    {
                        image_url: `${config.staticCDN}vmc/group_2.png`,
                        student_name: 'Pradipta P.Bora',
                        rank: 'AIR 28',
                    },
                    {
                        image_url: `${config.staticCDN}vmc/group_3.png`,
                        student_name: 'Pranay Gupta',
                        rank: 'AIR 82',
                    },
                    {
                        image_url: `${config.staticCDN}vmc/group_4.png`,
                        student_name: 'Snehinsh Sen',
                        rank: 'AIR 98',
                    },
                    {
                        image_url: `${config.staticCDN}vmc/group_5.png`,
                        student_name: 'Divyanshu Aggarwal',
                        rank: 'MAINS - 99.7%ILE',
                    },
                    {
                        image_url: `${config.staticCDN}vmc/group_6.png`,
                        student_name: 'Shubh Kumar',
                        rank: 'MAINS - 99.9%ILE',
                    },
                ],
            },
        };
    },
    vmcInfo: {
        type: 'info',
        data: {
            title: 'WHY VIDYA MANDIR CLASSES?',
            items: [
                '10000+ Selections in JEE MAIN in last 5 Years ',
                '1033 selections in JEE Advanced 2019',
                'Scientifically designed study material',
                'Highest success rate for NEET',
                'Learn from the best teachers with 33+ years experience',
            ],
        },
    },
    vmcDescriptionLive: {
        type: 'description_card',
        data: {
            title: 'What you get in DAILY CLASSES',
            items: [
                {
                    bg_color: '#152838',
                    image_url: '',
                    title: 'Full structured course for JEE and NEET by Vidya Mandir Classes',
                },
                {
                    bg_color: '#152838',
                    image_url: '',
                    title: 'Study Materials, Workbooks',
                },
                {
                    bg_color: '#152838',
                    image_url: '',
                    title: 'Weekly Quizzes, Full length Mock Test',
                },
            ],
        },
    },
    vmcDescriptionRecorded: {
        type: 'description_card',
        data: {
            title: 'What you get in RECORDED CLASSES',
            items: [
                {
                    bg_color: '#152838',
                    image_url: '',
                    title: 'Full syllabus lectures available at once',
                },
                // {
                //     bg_color: '#152838',
                //     image_url: '',
                //     title: 'Study Materials, Workbooks',
                // },
                // {
                //     bg_color: '#152838',
                //     image_url: '',
                //     title: 'Full length Mock Tests',
                // },
            ],
        },
    },
    paymentMessage: {
        text: 'Master your topics for JEE/NEET with Vidya Mandir Classes',
        sub_text: '',
        button_text: 'START FREE TRIAL',
    },
    vmcTeachersSpeak: {
        type: 'teachers_speak',
        data: {
            title: 'TEACHERS SPEAK',
            items: [
                {
                    title: 'Manmohan Gupta',
                    sub_title: 'VMC Founder',
                    text: '',
                },
                {
                    title: 'Brijmohan Gupta',
                    sub_title: 'VMC Founder',
                    text: '',
                },
                {
                    title: 'Saurabh Kumar',
                    sub_title: 'VMC Founder',
                    text: '',
                },
            ],
        },
    },
    video_url: 'https://d3cvwyf9ksu0h5.cloudfront.net/',
    collapseCount: 4,
    EXCLUDED_YOUTUBE_CHANNELS: [
        'UCMY7ZvLB6-DnuSis_2s37_A',
        'UC71RosNdDGdDyV83axFLj6A',
        'UC3hMRd0hcCWRV1vFjezuefA',
        'UC6CH6dNZQn1QPRY9LMnSYvw',
        'UCWpu39FQotegqCfp2WljWEw',
        'UClq8N3W4XxR-Ss8_bJsFajQ',
        'UCG8eg2aeXrKOpcr6fvMX-lQ',
        'UCv-eiTFy1ywefD8__raJ98Q',
        'UCi-J9CCaQ8w427GPHmoQGHA',
        'UCqaq3Cwa7m_EsqlvfZh6uyw',
        'UC82ObtDCmUuWwrWhpQsX-HQ',
        'UC1pfsmDBnMQB8sOuQvmTvRQ',
        'UCdQwYksctqqiRwqp3PiJMWA',
        'UCR3F3TPXHqXpotvmpyqXeQg',
        'UC4SUQzurYVmGwgmfdn0yEVg',
        'UCvs8v1B4G9NNWyiZSkPPsXQ',
        'UC9RPlhB_vNQMSJJSQhSDe3Q',
        'UCDeZmaLaH_9r7fhikdb9SFA',
        'UCV1lbzgZNcYFAT3VHKOb7Cg',
        'UCPhY4iS6NNoQwlRLcUYu_tw',
        'UCKdHDoMmKjcSOYHXIvCWQ0w',
        'UCgM9qPLv7R-hTRQIGa4wgKA',
        'UCuWuAvEnKWez5BUr29VpwqA',
    ],
    EXCLUDED_YOUTUBE_USERS: [
        'Vedantu Class 9 & 10',
        'BYJU\'S',
        'Unacademy JEE',
        'Let\'s Crack UPSC CSE',
        'Meritnation',
        'TOPPER\'S CLASSES',
        'Khan Academy',
    ],
    categoryIDFlagrMap: {
        1: 102,
        2: 103,
        3: 131,
        4: 135,
        5: 133,
        6: 146,
        7: 151,
        8: 152,
        9: 182,
        10: 184,
        11: 185,
    },
    liveClassInfoIIT: {
        get: [
            'Daily Classes based on course plan',
            'Study Materials, workbooks and tests',
        ],
        dontGet: [
            'Live Class',
            'Teacher interaction',
        ],
    },
    recordedClassInfoIIT: {
        get: [
            'All syllabus lectures available at once',
            'Study Materials, Workbooks',
        ],
        dontGet: [
            'Live Class',
            'Live Doubt Clearing Session',
        ],
    },
    getInfoWidgetForPaymentByCategory(category, course) {
        const obj = {
            1: {
                vod: {
                    get: {
                        title: 'Get unlimited access to all teachers, courses and material',
                        items: [
                            'All syllabus lectures available at once',
                            'Study Materials, Workbooks',
                        ],
                    },
                    dontGet: {
                        title: 'Get unlimited access to all teachers, courses and material',
                        items: [
                            'Live Class',
                            'Live Doubt Clearing Session',
                        ],
                    },
                },
                course: {
                    get: {
                        title: 'WHAT YOU GET IN THIS?',
                        items: [
                            'Daily Classes based on course plan',
                            'Study Materials, workbooks and tests',
                        ],
                    },
                    dontGet: {
                        title: 'WHAT YOU DON\'T GET IN THIS?',
                        items: [
                            'Live Class',
                            'Teacher interaction',
                        ],
                    },
                },
            },
            5: {
                course: {
                    get: {
                        title: 'आपको इस कोर्स में क्या मिलेगा',
                        items: [
                            'Live class के आखिर में क्लास में आये हुए डाउट  पूछ सकते हैं ',
                            'आपके State Boards Exam के लिए स्पेशल क्लासेज होंगी',
                            'हर हफ्ते और महीने Tests होंगे',
                            'Teachers द्वारा बनाये गए नोट्स मिलेंगे',
                            'Homework दिया जाएगा',
                            'NCERT discussion होगा',
                            'बोर्ड परीक्षा में पूछे गए विगत वर्षों के सवालों का जवाब',
                            'Revision, Motivation, Exam खबर, Guidance की क्लासेज',
                            'क्लास की रिकॉर्डिंग देखें कभी भी 24x7',
                            'टीचर द्वारा बनाये Notes टाइप करके दिए जायेंगे, Handwritten नहीं होंगे',
                            'कक्षा का समय 6:00 PM-9:00 PM होगा',
                        ],
                    },
                    dontGet: {
                        title: 'आपको इस कोर्स में क्या नहीं मिलेगा',
                        items: [
                            'सामाजिक विज्ञान और हिंदी विषय अभी नहीं पढ़ाये जायेंगे',
                            'लाइव क्लास के दौरान टीचर्स बच्चों से बातचीत नहीं करेंगे, सिर्फ स्पेशल क्लासेज में बातचीत होगी',
                            'छपे हुए नोट्स नहीं मिलेंगे, App पर नोट्स मिलेंगे',
                        ],
                    },
                },
            },
            4: {
                course: {
                    get: {
                        title: 'आपको इस कोर्स में क्या मिलेगा',
                        items: [
                            'Live class के आखिर में क्लास में आये हुए डाउट  पूछ सकते हैं ',
                            'आपके State Boards Exam के लिए स्पेशल क्लासेज होंगी',
                            'हर हफ्ते और महीने Tests होंगे',
                            'Teachers द्वारा बनाये गए नोट्स मिलेंगे',
                            'Homework दिया जाएगा',
                            'NCERT discussion होगा',
                            'बोर्ड परीक्षा में पूछे गए विगत वर्षों के सवालों का जवाब',
                            'Revision, Motivation, Exam खबर, Guidance की क्लासेज',
                            'क्लास की रिकॉर्डिंग देखें कभी भी 24x7',
                            'टीचर द्वारा बनाये Notes टाइप करके दिए जायेंगे, Handwritten नहीं होंगे',
                            'कक्षा का समय 4:00 PM-9:00 PM होगा',
                        ],
                    },
                    dontGet: {
                        title: 'आपको इस कोर्स में क्या नहीं मिलेगा',
                        items: [
                            'सामाजिक विज्ञान और हिंदी विषय अभी नहीं पढ़ाये जायेंगे',
                            'लाइव क्लास के दौरान टीचर्स बच्चों से बातचीत नहीं करेंगे, सिर्फ स्पेशल क्लासेज में बातचीत होगी',
                            'छपे हुए नोट्स नहीं मिलेंगे, App पर नोट्स मिलेंगे',
                        ],
                    },
                },
            },
            7: {
                course: {
                    get: {
                        title: 'आपको इस कोर्स में क्या मिलेगा',
                        items: [
                            'Live class के आखिर में क्लास में आये हुए डाउट  पूछ सकते हैं ',
                            'आपके State Boards Exam के लिए स्पेशल क्लासेज होंगी',
                            'हर हफ्ते और महीने Tests होंगे',
                            'Teachers द्वारा बनाये गए नोट्स मिलेंगे',
                            'Homework दिया जाएगा',
                            'NCERT discussion होगा',
                            'बोर्ड परीक्षा में पूछे गए विगत वर्षों के सवालों का जवाब',
                            'Revision, Motivation, Exam खबर, Guidance की क्लासेज',
                            'क्लास की रिकॉर्डिंग देखें कभी भी 24x7',
                            'टीचर द्वारा बनाये Notes टाइप करके दिए जायेंगे, Handwritten नहीं होंगे',
                            'कक्षा का समय 6:00 PM-9:00 PM होगा',
                        ],
                    },
                    dontGet: {
                        title: 'आपको इस कोर्स में क्या नहीं मिलेगा',
                        items: [
                            'सामाजिक विज्ञान और हिंदी विषय अभी नहीं पढ़ाये जायेंगे',
                            'लाइव क्लास के दौरान टीचर्स बच्चों से बातचीत नहीं करेंगे, सिर्फ स्पेशल क्लासेज में बातचीत होगी',
                            'छपे हुए नोट्स नहीं मिलेंगे, App पर नोट्स मिलेंगे',
                        ],
                    },
                },
            },
            8: {
                course: {
                    get: {
                        title: 'आपको इस कोर्स में क्या मिलेगा',
                        items: [
                            'Live class के आखिर में क्लास में आये हुए डाउट  पूछ सकते हैं ',
                            'आपके State Boards Exam के लिए स्पेशल क्लासेज होंगी',
                            'हर हफ्ते और महीने Tests होंगे',
                            'Teachers द्वारा बनाये गए नोट्स मिलेंगे',
                            'Homework दिया जाएगा',
                            'NCERT discussion होगा',
                            'बोर्ड परीक्षा में पूछे गए विगत वर्षों के सवालों का जवाब',
                            'Revision, Motivation, Exam खबर, Guidance की क्लासेज',
                            'क्लास की रिकॉर्डिंग देखें कभी भी 24x7',
                            'टीचर द्वारा बनाये Notes टाइप करके दिए जायेंगे, Handwritten नहीं होंगे',
                            'कक्षा का समय 4:00 PM-9:00 PM होगा',
                        ],
                    },
                    dontGet: {
                        title: 'आपको इस कोर्स में क्या नहीं मिलेगा',
                        items: [
                            'सामाजिक विज्ञान और हिंदी विषय अभी नहीं पढ़ाये जायेंगे',
                            'लाइव क्लास के दौरान टीचर्स बच्चों से बातचीत नहीं करेंगे, सिर्फ स्पेशल क्लासेज में बातचीत होगी',
                            'छपे हुए नोट्स नहीं मिलेंगे, App पर नोट्स मिलेंगे',
                        ],
                    },
                },
            },
            9: {
                course: {
                    get: {
                        title: 'What is included?',
                        items: [
                            'Teachers will Try their best to cover all the doubts asked during the class',
                            'Weekly/Monthly Tests',
                            'Typed Notes prepared by Teachers',
                            'Assignment/Practice Questions will be given',
                            'No need to buy any reference books',
                            'Homework will be given',
                            'NCERT Exercises will be discussed',
                            'Previous Year Questions from Board Exams',
                            'Sessions for Revision, Motivation, Exam News, Guidance',
                            'Recordings of the classes can be watched anytime',
                            'Classes will be held from 6:00 PM-9:00 PM',
                        ],
                    },
                    dontGet: {
                        title: 'What is not included?',
                        items: [
                            'Hindi will not start right away',
                            'No verbal interaction with teachers during the class, you can send your comments or reply to polls',
                            'Notes will be provided on the app and will not be printed',
                        ],
                    },
                },
            },
            10: {
                course: {
                    get: {
                        title: 'What is included?',
                        items: [
                            'Teachers will Try their best to cover all the doubts asked during the class',
                            'Weekly/Monthly Tests',
                            'Typed Notes prepared by Teachers',
                            'Assignment/Practice Questions will be given',
                            'No need to buy any reference books',
                            'Homework will be given',
                            'NCERT Exercises will be discussed',
                            'Previous Year Questions from Board Exams',
                            'Sessions for Revision, Motivation, Exam News, Guidance',
                            'Recordings of the classes can be watched anytime',
                            'Classes will be held from 4:00 PM-9:00 PM',
                        ],
                    },
                    dontGet: {
                        title: 'What is not included?',
                        items: [
                            'Hindi will not start right away',
                            'No verbal interaction with teachers during the class, you can send your comments or reply to polls',
                            'Notes will be provided on the app and will not be printed',
                        ],
                    },
                },
            },
            11: {
                course: {
                    get: {
                        title: 'What is included?',
                        items: [
                            '70 days power packed course to boost rank in JEE Main 2021 (January Exam)',
                            'Special Tricks Sessions on how to attack different types of problem',
                            'Teachers will Try their best to cover all the doubts asked during the class',
                            '5000+ most important questions to practice for JEE Exam',
                            'Weekly/Monthly Tests',
                            'No need to buy any reference books',
                            'Previous Year Questions from JEE Mains',
                            'Sessions for Revision, Motivation, Exam News, Guidance',
                            'Recordings of the classes can be watched anytime',
                            'Classes will be held from 9:00 AM - 2:00 PM',
                        ],
                    },
                    dontGet: {
                        title: 'What is not included?',
                        items: [
                            'No verbal interaction with teachers during the class, you can send your comments or reply to polls',
                            'Notes will be provided on the app and will not be printed',
                        ],
                    },
                },
            },
            6: {
                vod: {
                    get: {
                        title: 'Get unlimited access to all teachers, courses and material',
                        items: [
                            'All syllabus lectures available at once',
                            'Study Materials, Workbooks',
                        ],
                    },
                    dontGet: {
                        title: 'Get unlimited access to all teachers, courses and material',
                        items: [
                            'Live Class',
                            'Live Doubt Clearing Session',
                        ],
                    },
                },
                course: {
                    get: {
                        title: 'WHAT YOU GET IN THIS?',
                        items: [
                            'Daily Classes based on course plan',
                            'Study Materials, workbooks and tests',
                        ],
                    },
                    dontGet: {
                        title: 'WHAT YOU DON\'T GET IN THIS?',
                        items: [
                            'Live Class',
                            'Teacher interaction',
                        ],
                    },
                },
            },
        };
        return obj[category][course];
    },
    userGetMostClickedWidget: `${config.PASCAL_URL}api/widget/most-clicked-home-widget`,
    paymentV2AppVersionCode: 753,
    neetCCMIds: [10603, 10703, 10803, 10903, 11003, 11103, 11203, 11303, 11420],
    iitCCMIds: [10601, 10701, 10801, 10901, 11001, 11101, 11201, 11301, 11418],
    neetFilerId: 14,
    liveClassSimilarExperiment: 108,
    livePlaylist: {
        en: {
            class9: {
                playlistId: 132979,
                title: 'Live Class - English Medium',
            },
            class10: {
                playlistId: 132978,
                title: 'Live Class - English Medium',
            },
            class11: {
                playlistId: 132980,
                title: 'Live Class - English Medium',
            },
            class12: {
                playlistId: 132977,
                title: 'Live Class - English Medium',
            },
        },
        hi: {
            class9: {
                playlistId: 132981,
                title: 'Live Class - हिन्दी माध्यम',
            },
            class10: {
                playlistId: 132976,
                title: 'Live Class - हिन्दी माध्यम',
            },
            class11: {
                playlistId: 132982,
                title: 'Live Class - हिन्दी माध्यम',
            },
            class12: {
                playlistId: 132975,
                title: 'Live Class - हिन्दी माध्यम',
            },
        },
    },
    livClass: ['9', '10', '11', '12'],
    live_class_smart_skip_secs: 30,
    live_class_smart_skip_secs_short_video: 5,
    smart_play_button_text: 'Play Now',
    smart_page_button_text: 'Check Now!',
    iasSimilarVideoPageData: {
        resource_type: 'ias_search_bar',
        position: 2,
        description: 'clear karo apne sare doubts and concepts',
        image_url: `${config.staticCDN}images/ias_icon_book_open.png`,
        button_text: 'Search Now',
        button_bg_color: '#ff4001',
    },
    feed_post: {
        live_class: {
            msg: ['Yahoo, maine India ke best classes ka access khareeda!', 'Isse badhiya course aur teachers nahi!', 'Hurray! Doubtnut VIP pass ke saath mere toh main pukka topper!'],
            image_url: [
                `${config.staticCDN}images/user_buy_live_class_feed_post_1.webp`,
                `${config.staticCDN}images/user_buy_live_class_feed_post_2.webp`,
                `${config.staticCDN}images/user_buy_live_class_feed_post_3.webp`,
                `${config.staticCDN}images/user_buy_live_class_feed_post_4.webp`,
            ],
            deeplink_url: 'doubtnutapp://live_class_home',
        },
        live_class_video_watch: {
            msg: ['Maine poori class dekhi, saare funde clear ho gaye is topic ke! Maine suna hai ke VIP user ban ke saari Live Classes kabhi bhi dekh sakte hai'],
            image_url: [
                `${config.staticCDN}images/live_class_video_watch_1.webp`,
                `${config.staticCDN}images/live_class_video_watch_2.webp`,
                `${config.staticCDN}images/live_class_video_watch_3.webp`,
                `${config.staticCDN}images/live_class_video_watch_4.webp`,
            ],
            deeplink_url: 'doubtnutapp://live_class_home',
        },
    },
    user_language_video_heading(locale) {
        return global.t8[locale].t('Solution Videos in {{language}}', { language: global.t8[locale].t(this.languageObject[locale].toUpperCase(), this.languageObject[locale]) });
    },
    other_language_video_heading(locale) {
        return global.t8[locale].t('Solution Videos in {{language}} language', { language: global.t8[locale].t(this.languageObject[locale].toUpperCase(), this.languageObject[locale]) });
    },
    show_more_user_language_videos_text_hindi: 'और वीडियो दिखाएं',
    fermiTencent: 'https://sqs.ap-south-1.amazonaws.com/942682721582/FERMI_TENCENT_LC',
    iasTopTagLiveClass: {
        display: 'Live Now',
        image_url: `${config.staticCDN}images/ias_live_class_top_tag.png`,
        live_tag: true,
        tab_type: 'live_class',
        live_order: true,
    },

    similarTabHeading(locale) {
        return global.t8[locale].t('Similar Videos');
    },
    matchTabHeading(locale) {
        return global.t8[locale].t('Other Match Videos');
    },
    topicTabHeading(locale) {
        return global.t8[locale].t('Topic Booster');
    },
    topicQuestionHeading(locale) {
        return global.t8[locale].t('Practice Question');
    },
    liveClassHeading(locale) {
        return global.t8[locale].t('Live Class');
    },
    similarLiveClassHeading(locale) {
        return global.t8[locale].t('Related Live Class Videos');
    },

    bookArray: ['-64', '-63', '-62', '-60', '-59', '-58', '-57', '-56', '-54', '-48', '-44', '-42', '-40', '-39', '-38', '-37', '-36', '-35', '-34', '-33', '-32', '-31', '-30', '-26', '-23', '-11', '-9', '-8', '-7', '-6', '-5', '-3', '11', '12', '13', '15', '16', '17', '18', '20', '22', '25', '26', '27', '28', '29', '32', '33', '35', '36', '37', '38', '49', '50', '52', '54', '55', '56', '57', '59', '66', '67', '69', '70', '72', '73', '74', '76', '77', '78', '79', '87', '91', '92', '93', '94', '95', '97', '98', '99'],
    iasTopTags: {
        MATHS: {
            display: 'Maths Live Class',
            hindi_display: 'गणित लाइव क्लास',
            image_url: `${config.staticCDN}images/ias_subject_maths.png`,
            tab_type: 'live_class',
        },
        PHYSICS: {
            display: 'Physics Live Class',
            hindi_display: 'भौतिक विज्ञान लाइव क्लास',
            image_url: `${config.staticCDN}images/ias_subject_physics.png`,
            tab_type: 'live_class',
        },
        CHEMISTRY: {
            display: 'Chemistry Live Class',
            hindi_display: 'रसायन विज्ञान लाइव क्लास',
            image_url: `${config.staticCDN}images/ias_subject_chemistry.png`,
            tab_type: 'live_class',
        },
        BIOLOGY: {
            display: 'Biology Live Class',
            hindi_display: 'जीवविज्ञान लाइव क्लास',
            image_url: `${config.staticCDN}images/ias_subject_biology.png`,
            tab_type: 'live_class',
        },
        ENGLISH: {
            display: 'English Live Class',
            image_url: `${config.staticCDN}engagement_framework/D73DF6B8-58A1-A82D-0071-D202937151BB.webp`,
            tab_type: 'live_class',
        },
        SCIENCE: {
            display: 'Science Live Class',
            hindi_display: 'विज्ञान लाइव क्लास',
            image_url: `${config.staticCDN}images/ias_subject_science.png`,
            tab_type: 'live_class',
        },
        'SOCIAL SCIENCE': {
            display: 'Social Science Live Class',
            hindi_display: 'सामाजिक विज्ञान लाइव क्लास',
            image_url: `${config.staticCDN}images/ias_subject_science.png`,
            tab_type: 'live_class',
        },
    },
    iasTopTagExternalUrl: 'http://172.31.89.44/api/v1/recommend',
    doubtPayWallMaxUsers: 2600,
    doubtPayWallQuestionThreshold: 10,
    doubtPayWallReminderThreshold: 5,
    doubtPayWallDefaultPackageDurationList: [30, 180, 365],
    videoPersonalisationProperties: {
        propertiesToStore: ['view_id', 'question_id', 'parent_id', 'subject', 'chapter', 'class', 'video_time', 'engage_time', 'video_locale'],
    },
    questionAskPersonalisation: {
        questionsLimit: 10,
        propertiesToStore: ['question_id', 'ocr_text', 'subject', 'topic', 'class', 'video_time', 'engage_time', 'video_locale'],
        juniorClasses: [6, 7, 8],
        varaintAttachmentStructure: {
            apiUrl: '/api/search-composer',
            bumpLanguage: true,
            bumpThreshold: 90,
            debug: true,
            elasticHostName: `${config.questionAskPersonalizationElasticHost}`,
            elasticIndexName: 'question_bank_global_index',
            getComputeQues: true,
            getComputeQues2: true,
            hideFromPanel: false,
            imageServiceVersion: 'vi10',
            includeOnHindiPanel: true,
            isLanguageFilterCompatible: true,
            isReorderSuggestions: true,
            optionsRemovalStrategyGoogle: 'v4',
            optionsRemovalStrategyMathpix: 'v8',
            preProcessor: [
                {
                    arg: [
                        'log,ln',
                        'cosec,csc',
                        'rarr0,raar 0',
                        'times,xx',
                        'sin, si n',
                        'lt,lim',
                    ],
                    type: 'synonyms',
                },
                {
                    googleOcrStrategy: 'v4',
                    mathpixOcrStrategy: 'v8',
                    type: 'strip_options',
                },
                {
                    googleOcrStrategy: 'v2',
                    mathpixOcrStrategy: 'v2',
                    type: 'strip_question_number',
                },
                {
                    type: 'replace_quad_only',
                },
            ],
            queryConfig: {
                maxTokensSize: 70,
                minimumShouldMatchPercent: 30,
                queryType: 'user_personalisation_boost',
                searchFieldName: 'ocr_text',
                slop: 3,
            },
            useComposerApi: true,
            searchImplVersion: 'v43',
            suggestionCount: 40,
            synonymDelimiters: [
                'log,ln',
                'cosec,csc',
                'rarr0,raar 0',
                'times,xx',
                'sin, si n',
                'lt,lim',
            ],
            version: 'v_repeat_question',
        },
    },
    stateArr: ['Uttar Pradesh', 'Bihar', 'Delhi', 'Chhattisgarh', 'Gujarat', 'Jharkhand', 'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh', 'West Bengal'],
    stateArrHindi: ['उतार प्रदेश', 'बिहार', 'दिल्ली', 'छत्तीसगढ', 'गुजरात', 'झारखंड', 'कर्नाटक', 'मध्य प्रदेश', 'महाराष्ट्र', 'पंजाब', 'राजस्थान', 'तमिलनाडु', 'तेलंगाना', 'आंध्र प्रदेश', 'पश्चिम बंगाल'],
    stateCodeArr: ['UP', 'BR', 'DL', 'CT', 'GJ', 'JH', 'KA', 'MP', 'MH', 'PB', 'RJ', 'TN', 'TS', 'AP', 'WB'],
    stateDbNameIdArr: [2, 3, 1, 21, 13, 22, 11, 7, 5, 24, 4, 10, 9, 8, 6],
    HOMEPAGE_USA: {
        active_classes: [
            {
                class: 9,
                display: '9th',
                caraousel_title: 'Grade 9 Solutions',
                priority: 4,

            },
            {
                class: 10,
                display: '10th',
                caraousel_title: 'Grade 10 Solutions',
                priority: 3,

            },
            {
                class: 11,
                display: '11th',
                caraousel_title: 'Grade 11 Solutions',
                priority: 2,

            },
            {
                class: 12,
                display: '12th',
                caraousel_title: 'Grade 12 Solutions',
                priority: 1,

            },
            // {
            //     class : 21,
            //     display: 'SAT',
            //     caraousel_title : 'SAT Solutions',
            //     priority : 0

            // }
        ],
        active_subjects: ['Maths', 'Physics', 'Cheimstry', 'Biology', 'English'],
    },
    allNudgeActivity: {
        all: ['question_ask', 'ncert_video_watch', 'live_class_video_watch', 'game_open', 'feed_seen'],
        govt: ['question_ask', 'live_class_video_watch', 'game_open', 'feed_seen'],
    },
    noSolutionFeedbackData: {
        us: {
            en: {
                title: "Didn't find a solution?",
                content: 'Which study material did you use to ask this question?',
                hint: '',
                placeholder: 'SAT/ACT Study guide book name',
            },
            default: {
                title: "Didn't find a solution?",
                content: 'Which study material did you use to ask this question?',
                hint: '',
                placeholder: 'SAT/ACT Study guide book name',
            },
        },
        in: {
            default: {
                title: 'Kya apko solution nahi mila',
                content: 'Puche gaye sawal ke Book/Study material ka naam batayen',
                hint: 'eg: Concept of Physics H C Verma',
                placeholder: 'Book ka naam likhe',
            },
            hi: {
                title: 'क्या आपको समाधान नहीं मिला',
                content: 'पूछे गए सवाल के किताब/अध्ययन सामग्री का नाम बताए',
                hint: 'उदा. कॉन्सेप्ट्स ऑफ़ फिजिक्स ',
                placeholder: 'किताब का नाम लिखे ',
            },
            en: {
                title: 'Didn\'t you find the solution',
                content: 'Name the book/study material related to the question asked',
                hint: 'eg. concepts of physics',
                placeholder: 'Write the book name',
            },
            te: {
                title: 'మీరు పరిష్కారం కనుగొనలేదు',
                content: 'అడిగిన ప్రశ్నకు సంబంధించిన పుస్తకం/స్టడీ మెటీరియల్‌కు పేరు పెట్టండి',
                hint: 'ఉదా. VGS పబ్లికేషన్స్',
                placeholder: 'పుస్తకం పేరు వ్రాయండి',
            },
            kn: {
                title: 'ನಿಮಗೆ ಪರಿಹಾರ ಸಿಗಲಿಲ್ಲ',
                content: 'ಕೇಳಿದ ಪ್ರಶ್ನೆಯ ಪುಸ್ತಕ/ಅಧ್ಯಯನ ಸಾಮಗ್ರಿಯನ್ನು ಹೆಸರಿಸಿ',
                hint: 'ಉದಾ. ಸುಭಾಷ್ ಪ್ರಕಟಣೆ',
                placeholder: 'ಪುಸ್ತಕದ ಹೆಸರನ್ನು ಬರೆಯಿರಿ',
            },
            bn: {
                title: 'আপনি কি আপনার প্রশ্নের উত্তর পাননি ? ',
                content: 'প্রশ্নটি যে বই বা স্টাডি মেটেরিয়ালের তার নাম  বলুন ।',
                hint: 'যেমন ছায়া পাবলিকেশন',
                placeholder: 'বইয়ের নাম লিখুন। ',
            },
            ta: {
                title: 'உங்களுக்கு தீர்வு கிடைக்கவில்லையா',
                content: 'கேட்கப்பட்ட கேள்வியின் புத்தகம்/படிப்புப் பொருளைக் குறிப்பிடவும்',
                hint: 'எ.கா. சுரா வெளியீடு',
                placeholder: 'புத்தகத்தின் பெயரை எழுதுங்கள்',
            },
            gu: {
                title: 'શુ તમને ઉકેલ મળ્યો નથી.',
                content: 'પૂછેલા પ્રશ્નો સાથ પુસ્તક નુ નામ બતાઓ',
                hint: 'દા.ત. કુમાર પ્રકાશન',
                placeholder: 'પુસ્તક નુ નામ લાખો',
            },
            pu: {
                title: 'ਕਿਆ ਆਪਕੋ ਹਲ ਨ ਮਿਲੈ॥',
                content: 'ਪੁਛੇ ਸਾਂਵਲ ਦੀ ਕਿਤਾਬ/ਅਧਿਐਨ ਸਮੱਗਰੀ ਕਾ ਨਾਮ ਬਤਾਏਂ',
                hint: 'ਜਿਵੇਂ ਕਿ MBD',
                placeholder: 'ਕਿਤਾਬ ਕਾ ਨਾਮ ਲਿਖੇ',
            },
            od: {
                title: 'ତୁମେ ସମାଧାନ ପାଇଲ ନାହିଁ',
                content: 'ପଚରାଯାଇଥିବା ପ୍ରଶ୍ନର ପୁସ୍ତକ / ଅଧ୍ୟୟନ ସାମଗ୍ରୀର ନାମ ଦିଅ |',
                hint: 'ଯଥା MBD',
                placeholder: 'ପୁସ୍ତକ ନାମ ଲେଖ |',
            },
            mr: {
                title: 'तुम्हाला उपाय मिळाला नाही',
                content: 'विचारलेल्या प्रश्नाच्या पुस्तकाचे/अभ्यास साहित्याचे नाव द्या',
                hint: 'उदा. चेतना पब्लिकेशन',
                placeholder: 'पुस्तकाचे नाव लिहा',
            },
            ml: {
                title: 'ക്യാ അപ്കോ പരിഹാരം നഹി മിലാ',
                content: 'പുച്ചേ ഗയേ സവൽ കേ ബുക്ക്/സ്റ്റഡി മെറ്റീരിയൽ കാ നാം ബതയേൻ',
                hint: 'ഉദാ. ഉജ്ജ്വലമായ പ്രസിദ്ധീകരണം',
                placeholder: 'ബുക്ക് കാ നാം ലൈക്കെ',
            },
            as: {
                title: 'সমাধান বিচাৰি নাপালে নেকি',
                content: 'সোধা প্ৰশ্নৰ কিতাপ/অধ্যয়ন সামগ্ৰীৰ নাম লিখা',
                hint: 'যেনে- R G প্ৰকাশন',
                placeholder: 'কিতাপৰ নাম লিখা',
            },
        },
    },
    answerFeedback: {
        in: {
            text: [{
                content: 'Iska Video Solution Hona Chahiye',
            }, {
                content: 'Explanation Proper Nahi Tha',
            }, {
                content: 'Sirf Answer Mention Tha',
            },
            ],
            video: [{
                content: 'Incorrect Answer',
            }, {
                content: 'Poor Explaination',
            }, {
                content: 'Unclear Voice',
            }],
        },
        us: {
            text: [{
                content: 'This should have been a Video Solution',
            }, {
                content: 'Step by Step Explanation was Poor',
            }, {
                content: 'Only the Answer was mentioned',
            }],
            video: [{
                content: 'Incorrect Answer',
            }, {
                content: 'Poor Explanation',
            }, {
                content: 'Unclear Voice/Accent',
            }],
        },
    },
    socialLoginPassport: {
        web: {
            active: ['google', 'facebook'],
            callBackRedirectionBaseUrl: {
                us: {
                    prod: 'https://doubtnut.app/',
                    staging: 'https://preprod.doubtnut.app/',
                },
                in: {
                    prod: 'https://doubtnut.com/',
                    staging: 'https://preprod.doubtnut.com/',
                },
            },
        },
    },

    ncertStudentIds: [1, 69, -111, -107, -100, -98, -97, -78, -39, 77],

    nudgePopUpTitle(locale) {
        return global.t8[locale].t('Not found what you looking for?\nWe have something for you');
    },

    askHeadText(locale) {
        return global.t8[locale].t('Ask your first question');
    },

    askTitleText(locale) {
        return global.t8[locale].t('Ask Doubt');
    },

    ncertHeadText(locale) {
        return global.t8[locale].t('NCERT Book Solutions for you');
    },

    feedHeadText(locale) {
        return global.t8[locale].t('Friends');
    },

    feedBannerText(locale) {
        return global.t8[locale].t('Join other students on Doubtnut and learn together');
    },

    feedButtonText(locale) {
        return global.t8[locale].t('Join Now');
    },

    liveClassHeadText(locale) {
        return global.t8[locale].t('Trending Live Class For You');
    },

    gamesHeadText(locale) {
        return global.t8[locale].t('Play Games');
    },

    viewAllTopIconNewLink: `${config.cdn_url}images/icons/view-all.webp`,
    search_service_tyd_versions_default_variant: {
        apiUrl: '/api/search-composer',
        elasticHostName: 'https://es-search.internal.doubtnut.com/',
        elasticIndexName: 'question_bank_global_index',
        enabled: true,
        isReorderSuggestions: true,
        isTyped: true,
        preProcessor: [
            {
                type: 'hinglish_checker',
            },
        ],
        queryConfig: {
            maxTokensSize: 70,
            minimumShouldMatchPercent: 30,
            queryType: 'hybrid_slop',
            searchFieldName: 'ocr_text',
            slop: 3,
        },
        suggestionCount: 40,
        suggestionImplVersion: 't2',
        useComposerApi: true,
        version: 't2',
    },
    categoriesHindi: {
        'State Boards': 'स्टेट बोर्ड्स',
    },
    country_currency_mapping: {
        US: '$',
        IN: '₹',
    },
    homePlaylistHeading: {
        en: 'Playlist For you',
        hi: 'आपके लिए प्लेलिस्ट',
    },
    playListTitle: {
        en: 'Recommended%20Playlists%20for%20You',
        hi: 'आप%20के%20लिए%20अनुशंसित%20प्लेलिस्ट',
    },
    playListShowMore(locale) {
        return global.t8[locale].t('More');
    },

    peopleWatchSubTitle(locale) {
        return global.t8[locale].t('What students similar to you watch after watching your last played video');
    },

    playListPlayText(locale) {
        return global.t8[locale].t('Play');
    },

    upiCheckout(locale) {
        return {
            payment_status: 'INITIATED',
            ttl: 60 * 60 * 24 * 7,
            title: global.t8[locale].t('Scan the QR Code to make payment'),
            description: global.t8[locale].t('Apne gharvalon ya local shopkeeper ke UPI App se ye QR Code scan kara ke payment karein'),
            cta_text: global.t8[locale].t('Share QR Code'),
            payment_count_text: global.t8[locale].t('Make only One Payment to this QR'),
        };
    },

    singleDeviceLoginAppConfig: {
        active: true,
        infoVideoIds: {
            en: 647997339,
            hi: 647997339,
        },
    },
    referralInfo: {
        couponData: {
            title: 'Referral Coupon',
            type: 'instant',
            coupon_code: '',
            start_date: '',
            end_date: '',
            value_type: 'amount',
            value: 500,
            created_by: 'referral',
            min_version_code: 754,
            max_version_code: 2000,
            limit_per_student: 1,
            claim_limit: 100,
            max_limit: 100,
        },
        invite_message: '₹<amount> discount paao Doubtnut ke kisi bhi course pe, mera code <referral_code> istemaal karke.🥳 Courses dekho! <link_to_explore>',
        deeplink_to_explore: 'doubtnutapp://library_tab?library_screen_selected_Tab=0',
        deeplink_to_explore_url: 'https://doubtnut.app.link/kwkqsiBxndb?source=referral',
    },
    rewardCouponInfo: {
        couponData: {
            title: 'Reward Coupon',
            type: 'instant',
            coupon_code: '',
            start_date: '',
            end_date: '',
            value_type: 'percent',
            value: '',
            created_by: 'rewards',
            min_version_code: 754,
            max_version_code: 2000,
            limit_per_student: 1,
            claim_limit: 1,
            max_limit: 500,
        },
    },
    rewardKJCouponInfo: {
        couponData: {
            title: 'Khelo Jeeto Coupon',
            type: 'instant',
            coupon_code: '',
            start_date: '',
            end_date: '',
            value_type: 'percent',
            value: '',
            created_by: 'rewards',
            min_version_code: 915,
            max_version_code: 2000,
            limit_per_student: 1,
            claim_limit: 1,
            max_limit: 500,
        },
    },
    channelsTitle: {
        en: 'Channels for You',
        hi: 'आपके लिए चैनल',
    },
    gamesTitle: {
        en: 'Play and Learn',
        hi: 'खेलो और सीखो',
    },
    videoAdTitle: {
        en: 'What\'s New on Doubtnut!',
        hi: 'आप के लिए नया क्या है!',
    },
    feedTitle: {
        en: 'Trending on Doubtnut!',
        hi: 'Doubtnut पे  ट्रेंडिंग',
    },
    ccmIdsQuestionLangFilterMapping: {
        6: {
            601: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en', 'bn', 'bn-en', 'gu-en'],
            602: ['en', 'hi-en', 'hi'],
            603: ['en', 'hi-en', 'hi'],
            604: ['en', 'hi-en'],
            605: ['en', 'hi-en'],
            606: ['en', 'hi-en', 'bn', 'bn-en'],
            607: ['en', 'hi-en'],
            608: ['en', 'hi-en'],
            609: ['en', 'hi-en', 'te', 'te-en'],
            610: ['en', 'hi-en', 'gu-en'],
            611: ['en', 'hi-en'],
            612: ['en', 'hi-en'],
            11440: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en'],
            11432: ['en', 'hi-en', 'kn', 'kn-en'],
            11439: ['en', 'hi-en'],
            11453: ['en', 'hi-en', 'ta', 'ta-en'],
        },
        7: {
            701: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en', 'bn', 'bn-en', 'gu-en'],
            702: ['en', 'hi-en', 'hi'],
            703: ['en', 'hi-en', 'hi'],
            704: ['en', 'hi-en'],
            705: ['en', 'hi-en'],
            706: ['en', 'hi-en', 'bn', 'bn-en'],
            707: ['en', 'hi-en'],
            708: ['en', 'hi-en'],
            709: ['en', 'hi-en', 'te', 'te-en'],
            710: ['en', 'hi-en', 'gu-en'],
            711: ['en', 'hi-en'],
            712: ['en', 'hi-en'],
            11441: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en'],
            11431: ['en', 'hi-en', 'kn', 'kn-en'],
            11438: ['en', 'hi-en'],
            11452: ['en', 'hi-en', 'ta', 'ta-en'],
        },
        8: {
            801: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en', 'bn', 'bn-en', 'gu-en'],
            802: ['en', 'hi-en', 'hi'],
            803: ['en', 'hi-en', 'hi'],
            804: ['en', 'hi-en'],
            805: ['en', 'hi-en'],
            806: ['en', 'hi-en', 'bn', 'bn-en'],
            807: ['en', 'hi-en'],
            808: ['en', 'hi-en'],
            809: ['en', 'hi-en', 'te', 'te-en'],
            810: ['en', 'hi-en', 'gu-en'],
            811: ['en', 'hi-en'],
            812: ['en', 'hi-en'],
            11442: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en'],
            11430: ['en', 'hi-en', 'kn', 'kn-en'],
            11437: ['en', 'hi-en'],
            11451: ['en', 'hi-en', 'ta', 'ta-en'],
        },
        9: {
            901: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en', 'bn', 'bn-en', 'gu-en'],
            902: ['en', 'hi-en', 'hi'],
            903: ['en', 'hi-en', 'hi'],
            904: ['en', 'hi-en'],
            905: ['en', 'hi-en'],
            906: ['en', 'hi-en', 'bn', 'bn-en'],
            907: ['en', 'hi-en'],
            908: ['en', 'hi-en'],
            909: ['en', 'hi-en', 'te', 'te-en'],
            910: ['en', 'hi-en', 'gu-en'],
            911: ['en', 'hi-en'],
            912: ['en', 'hi-en'],
            913: ['en', 'hi-en'],
            914: ['en', 'hi-en'],
            915: ['en', 'hi-en', 'hi'],
            916: ['en', 'hi-en', 'hi'],
            917: ['en', 'hi-en'],
            918: ['en', 'hi-en'],
            919: ['en', 'hi-en'],
            11443: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en'],
            11429: ['en', 'hi-en', 'kn', 'kn-en'],
            11436: ['en', 'hi-en'],
            11450: ['en', 'hi-en', 'ta', 'ta-en'],
        },
        10: {
            1001: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en', 'bn', 'bn-en', 'gu-en'],
            1002: ['en', 'hi-en', 'hi'],
            1003: ['en', 'hi-en', 'hi'],
            1004: ['en', 'hi-en'],
            1005: ['en', 'hi-en'],
            1006: ['en', 'hi-en', 'bn', 'bn-en'],
            1007: ['en', 'hi-en'],
            1008: ['en', 'hi-en'],
            1009: ['en', 'hi-en', 'te', 'te-en'],
            1010: ['en', 'hi-en', 'gu-en'],
            1011: ['en', 'hi-en'],
            1012: ['en', 'hi-en'],
            1013: ['en', 'hi-en'],
            1014: ['en', 'hi-en'],
            1015: ['en', 'hi-en', 'hi'],
            1016: ['en', 'hi-en', 'hi'],
            1017: ['en', 'hi-en'],
            1018: ['en', 'hi-en'],
            1019: ['en', 'hi-en'],
            11444: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en'],
            11428: ['en', 'hi-en', 'kn', 'kn-en'],
            11435: ['en', 'hi-en'],
            11449: ['en', 'hi-en', 'ta', 'ta-en'],
        },
        11: {
            1101: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en', 'bn', 'bn-en', 'gu-en'],
            1102: ['en', 'hi-en', 'hi'],
            1103: ['en', 'hi-en', 'hi'],
            1104: ['en', 'hi-en'],
            1105: ['en', 'hi-en'],
            1106: ['en', 'hi-en', 'bn', 'bn-en'],
            1107: ['en', 'hi-en'],
            1108: ['en', 'hi-en'],
            1109: ['en', 'hi-en', 'te', 'te-en'],
            1110: ['en', 'hi-en', 'gu-en'],
            1111: ['en', 'hi-en'],
            1112: ['en', 'hi-en'],
            1113: ['en', 'hi-en'],
            1114: ['en', 'hi-en'],
            1115: ['en', 'hi-en', 'hi'],
            1116: ['en', 'hi-en', 'hi'],
            1117: ['en', 'hi-en'],
            1118: ['en', 'hi-en'],
            1119: ['en', 'hi-en'],
            11445: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en'],
            11427: ['en', 'hi-en', 'kn', 'kn-en'],
            11434: ['en', 'hi-en'],
            11448: ['en', 'hi-en', 'ta', 'ta-en'],
        },
        12: {
            1201: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en', 'bn', 'bn-en', 'gu-en'],
            1202: ['en', 'hi-en', 'hi'],
            1203: ['en', 'hi-en', 'hi'],
            1204: ['en', 'hi-en'],
            1205: ['en', 'hi-en'],
            1206: ['en', 'hi-en', 'bn', 'bn-en'],
            1207: ['en', 'hi-en'],
            1208: ['en', 'hi-en'],
            1209: ['en', 'hi-en', 'te', 'te-en'],
            1210: ['en', 'hi-en', 'gu-en'],
            1211: ['en', 'hi-en'],
            1212: ['en', 'hi-en'],
            1213: ['en', 'hi-en'],
            1214: ['en', 'hi-en'],
            1215: ['en', 'hi-en', 'hi'],
            1216: ['en', 'hi-en', 'hi'],
            1217: ['en', 'hi-en'],
            1218: ['en', 'hi-en'],
            1219: ['en', 'hi-en'],
            11446: ['en', 'hi', 'hi-en', 'kn', 'ta', 'te', 'kn-en', 'ta-en', 'te-en'],
            11426: ['en', 'hi-en', 'kn', 'kn-en'],
            11433: ['en', 'hi-en'],
            11447: ['en', 'hi-en', 'ta', 'ta-en'],
        },
        14: {
            11412: ['en', 'hi-en', 'hi'],
            11415: ['en', 'hi-en'],
            11413: ['en', 'hi-en'],
            11416: ['en', 'hi-en'],
            11411: ['en', 'hi-en', 'hi'],
            11414: ['en', 'hi-en', 'bn', 'bn-en'],
        },
    },
    channelsTitles: {
        lfd: {
            en: 'Latest From Doubtnut',
            hi: 'DOUBTNUT के नए वीडियो',
        },
        tricky: {
            en: 'Tricky Question',
            hi: 'ट्रिकी सवाल',
        },
        motivational: {
            en: 'Motivational Videos',
            hi: 'प्रेरक वीडियो',
        },
        topper: {
            en: 'Topper\'s Talk',
            hi: 'टॉपर्स टॉक',
        },
        prevYears: {
            en: 'Previous Year Question Papers',
            hi: 'पिछले साल का प्रश्नपत्र',
        },
        jee2020: {
            en: 'JEE 2020 - 30 DAY REVISION',
            hi: 'JEE 2020 -30 दिन का रिवीजन',
        },
        formulaSheet: {
            en: 'Formula Sheet',
            hi: 'फॉर्मूला शीट',
        },
        neetForNcert: {
            en: 'NCERT Revision for NEET',
            hi: 'NEET के लिए NCERT रिवीजन',
        },
        neet2020Revision: {
            en: 'NEET 2020 - Revision',
            hi: 'NEET 2020 - रिवीजन',
        },
        neetRevisionSeries: {
            en: 'NEET Revision Series',
            hi: 'NEET रिवीजन सीरीज',
        },
    },
    prevYearsExam: {
        en: 'Previous Year Solution',
        hi: 'पिछले साल के पेपर का हल',
    },
    colorDetails: [
        {
            colorStart: '#462774',
            colorMid: '#8233c5',
            colorEnd: '#e963fd',
        },
        {
            colorStart: '#5b2b88',
            colorMid: '#2e5dd1',
            colorEnd: '#5977ff',
        },
        {
            colorStart: '#4e335e',
            colorMid: '#a42e7a',
            colorEnd: '#f22c89',
        },
    ],
    getCourseMediumByLocale(locale) {
        return {
            HINDI: global.t8[locale].t('Hindi Medium'),
            ENGLISH: global.t8[locale].t('English Medium'),
            HINGLISH: global.t8[locale].t('English + Hindi Medium'),
        };
    },
    newBoardExamName: {
        en: 'SCHOOL EXAMS',
        hi: 'स्कूल की परीक्षा',
    },
    boardExamsImage: {
        'Chattisgarh Board': 'images/ias_chattisgadh_board.webp',
        'Gujarat Board': 'images/ias_gujrat_board.webp',
        'Haryana Board': 'images/ias_haryana_board.webp',
        'Himachal Board': 'images/ias_himachal_pradesh_board.webp',
        'Jharkhand Board': 'images/ias_jharkhand_board.webp',
        'Maharashtra Board': 'images/ias_maharastra_board.webp',
        'MP Board': 'images/ias_mp_board.webp',
        'Rajasthan Board': 'images/ias_rajasthan_board.webp',
        'UP Board': 'images/ias_up_board.webp',
        'Uttarakhand Board': 'images/ias_uttranchal_board.webp',
        NDA: 'images/ias_nda_exam.webp',
    },
    scholarshipTestDetails: [
        {
            testName: 'IIT JEE 2023', testTime: '2:00 - 3:00 PM', testDate: '30 May 2021', test_id: 6107,
        },
        {
            testName: 'NEET 2023', testTime: '2:00 - 3:00 PM', testDate: '30 May 2021', test_id: 6117,
        },
        {
            testName: 'IIT JEE 2022', testTime: '2:00 - 3:00 PM', testDate: '30 May 2021', test_id: 6108,
        },
        {
            testName: 'NEET 2022', testTime: '2:00 - 3:00 PM', testDate: '30 May 2021', test_id: 6118,
        },
        {
            testName: '11th Boards', testTime: '2:00 - 3:00 PM', testDate: '30 May 2021', test_id: 6097,
        },
        {
            testName: '12th Boards', testTime: '2:00 - 3:00 PM', testDate: '30 May 2021', test_id: 6098,
        },
    ],
    ncertTitleArr: ['NCERT Books Solutions', 'NCERT किताबों का हल', 'NCERT and Popular Books Solutions', 'NCERT एवं लोकप्रिय किताबों का हल'],
    ncertNewFlowTitleArr: ['NCERT', 'NCERT किताबो का हल'],
    classListTitle1: 'Select App Language',
    classListTitle2: 'Aap kis medium ke school mein padhai karte hein?',
    classListTitle2_en: 'Select Your Language',
    classListSubTitle1: 'ऐप भाषा का चयन करें',
    classListSubTitle2: 'आप किस माध्यम के स्कूल में पढाई करते हैं?',
    classListSubTitle2_en: '',
    explainerVideo: {
        deeplink: {
            en: 'doubtnutapp://video_dialog?question_id=643551500&orientation=portrait&page=WHATS_NEW_HOME',
            hi: 'doubtnutapp://video_dialog?question_id=643551485&orientation=portrait&page=WHATS_NEW_HOME',
        },
        image_url: {
            hi: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/C201E74F-D374-A6FD-B2EF-15E6FDE3E10F.webp',
            en: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5336AC9E-4A38-E6F1-6A26-8A83E7462310.webp',
        },
    },
    ncertIconsTitles: ['NCERT Solutions', 'एनसीईआरटी की किताबें', 'NCERT किताबो का हल', 'NCERT Books', 'NCERT की किताबें'],
    referralDetails: {
        referral_paytm: {
            en: {
                header: 'Dost ko lao aur ₹150 apne Paytm Wallet mein pao!',
                description: 'Share this Invite Code with your friends.\nYour friends will get ₹150 off on their next purchase and you get ₹150 in your Paytm wallet. Offer valid only on Courses worth ₹1500 or more!',
                video_url: 'referral_paytm_c.mp4',
                title: 'Share & Earn',
            },
            hi: {
                header: 'दोस्त को लाओ और ₹150 अपने Paytm वॉलेट में पाओ!',
                description: 'शेयर करो ये Invite कोड अपने दोस्तों के साथ और पाओ ₹150 अपने Paytm वॉलेट में, साथ ही आपके दोस्त को मिलेगी ₹150 की छूट अपना कोर्स ख़रीदने पर! ऑफ़र केवल ₹1500 या उससे ऊपर के कोर्सेज़ पर ही!',
                video_url: 'referral_paytm_c.mp4',
                title: 'Share & Earn',
            },
            referral_amount: 150,
            image: '/images/icon_small_gift.webp',
        },
        referral_course: {
            en: {
                header: 'Get ₹500 off apne agle purchase pe!',
                description: 'Share karo invite code doston ke saath aur aap dono ko milenge ₹500 off apne agle purchase pe. ',
                video_url: 'referral_install.mp4',
                title: 'Share & Earn',
            },
            hi: {
                header: 'Get ₹500 off apne agle purchase pe!',
                description: 'Share karo invite code doston ke saath aur aap dono ko milenge ₹500 off apne agle purchase pe',
                video_url: 'referral_install.mp4',
                title: 'Share & Earn',

            },
            referral_amount: 500,
            image: '/images/icon_small_gift.webp',
        },
        referral_doubt: {
            en: {
                header: 'Doston ko lao ₹100 pao!',
                description: 'Share karo invite link doston ke saath aur har naye download par pao  ₹100 apne Doubtnut wallet mein.',
                video_url: 'referral_install.mp4',
                title: 'Share & Earn',
            },
            hi: {
                header: 'Doston ko lao ₹100 pao!',
                description: 'Share karo invite link doston ke saath aur har naye download par pao  ₹100 apne Doubtnut wallet mein.',
                video_url: 'referral_install.mp4',
                title: 'Share & Earn',
            },
            referral_amount: 100,
            image: '/images/icon_small_gift.webp',
        },
        referral_ceo: {
            en: {
                header: 'New CEO Program - New Prizes !',
                description: 'Jeeto Rs. 1000 cashback har dost ke admission pe, boat airdopes 3 dost ke admission pe, bluetooth speakers 6 dost ke admission pe aur Redmi Phone 10 dost ke admission pe!',
                video_url: 'answer-1647501813.mp4',
                title: 'CEO Refer & Earn',
            },
            hi: {
                header: 'नया CEO प्रोग्राम - नए इनाम !',
                description: 'जीतो Rs. 1000 का इनाम हर दोस्त के एडमिशन पे, Boat Airdopes 3 दोस्त के एडमिशन पे, Bluetooth Speakers 6 दोस्त के एडमिशन पे और Redmi Phone 10 दोस्त के एडमिशन पे !',
                video_url: 'answer-1647501813.mp4',
                title: 'CEO Refer & Earn',
            },
            referral_amount: 1000,
            pdf: `${config.staticCDN}engagement_framework/referral_ceo_v1.pdf`,
            image: '/images/2022/01/19/16-24-01-581-PM_referral_image_landing.webp',
        },
    },
    ceoReferralProgram: {
        couponData: {
            value_type: 'percent',
            value: 30,
            limit_per_student: 2,
            max_limit: 20000,
        },
        claim_no: {
            1: {
                referral_amount: 1000,
            },
            2: {
                referral_amount: 1000,
            },
            3: {
                referral_amount: 1500,
            },
            4: {
                referral_amount: 1500,
            },
        },
    },
    premiumVideoBlockContentMetaData: {
        default_description: 'इससे पूरा देखने के लिए कोर्स अभी खरीदे',
        course_details_button_text_color: '#eb532c',
        course_purchase_button_text_color: '#ffffff',
        course_details_button_bg_color: '#000000',
        course_purchase_button_bg_color: '#eb532c',
        course_details_button_corner_color: '#eb532c',
    },
    postPurchaseCommunication: {
        trialStart: {
            notification: {
                en: {
                    title: 'Aapke course ka free demo start hogaya hai! 😎 ',
                    message: 'Apne course ki padhai karne ke liye yahan click karein ',
                    firebaseTag: 'TRIAL_ACTIVATE_EN',
                },
                hi: {
                    title: 'आपके कोर्स का फ़्री डेमो शुरू होगया है! 😎 ',
                    message: 'अपने कोर्स की पढ़ाई करने के लिए यहाँ क्लिक करें',
                    firebaseTag: 'TRIAL_ACTIVATE_HI',
                },
            },
            SMS: {
                en: {
                    message: 'Doubtnut par aapke "{1}" course ka free demo start hogaya hai!\n\nCourse ki padhai karne ke liye click - {2}\n\nApp kaise use karna hai? Jaaniye - {3}',
                },
                hi: {
                    message: 'Doubtnut पर आपके ""{1}"" कोर्स का फ़्री डेमो शुरू होगया है!\n\nकोर्स की पढ़ाई करने के लिए क्लिक - {2}\n\nऐप कैसे यूज़ करना है? जानिये - {3}',
                },
            },
            whatsapp: {
                en: {
                    message: 'Your free demo for {1} course has started.\n\nTo study from this course, click on this link.\n{2}\n\nTo know How to use the App, click here.\n{3}',
                },
                hi: {
                    message: 'आपके {1}  कोर्स का  फ़्री डेमो शुरू होगया है!\n\nअपने कोर्स की पढ़ाई करने के लिए इस लिंक पर क्लिक करें | \n{2}\n\nऐप कैसे यूज़ करना है जानने के लिए यहाँ क्लिक करें !\n{3}',
                },
                courseDeeplinkCampaign: 'TRIAL_ACTIVATE',
                courseDeeplinkChannel: 'whatsapp',
            },
        },
        trialStartWithTimeTable: {
            notification: {
                en: {
                    title: 'Aapke course ka time-table! 😎 ',
                    message: 'Time-table Download karne ke liye yahan click karein ',
                    firebaseTag: 'TRIAL_ACTIVATE_TIMETABLE_EN',
                },
                hi: {
                    title: 'आपके कोर्स का टाइम-टेबल! 😎',
                    message: 'टाइम-टेबल डाउनलोड करने के लिए यहाँ क्लिक करें',
                    firebaseTag: 'TRIAL_ACTIVATE_TIMETABLE_HI',
                },
            },
            SMS: {
                en: {
                    message: 'Doubtnut par aapke {1} course ka free demo start ho gaya hai!\n\nCourse ki padhai karne ke liye click - {2}\n\nApp kaise use karna hai? Jaaniye - {3}\n\nTimetable - {4}',
                },
                hi: {
                    message: 'आपके ""{1}"" कोर्स का फ़्री डेमो शुरू हो गया है!\n\nकोर्स की पढ़ाई करने के लिए क्लिक - {2}\n\nऐप कैसे यूज़ करना है? जानिये - {3}\n\nटाईमटेबल - {4}',
                },
            },
            whatsapp: {
                en: {
                    message: 'Your free demo for {1} course has started.Here is your timetable.\n\nTo study from this course, click on this link .\n{2}\n\nTo know How to use the App, click here.\n{3}',
                },
                hi: {
                    message: 'आपके {1}  कोर्स का  फ़्री डेमो शुरू होगया है! यह रहा आपका टाईमटेबल|\n\nअपने कोर्स की पढ़ाई करने के लिए इस लिंक पर क्लिक करें !\n{2}ऐप कैसे यूज़ करना है जानने के लिए यहाँ क्लिक करें !\n{3}',
                },
                courseDeeplinkCampaign: 'TRIAL_ACTIVATE',
                courseDeeplinkChannel: 'whatsapp',
            },
        },
        freeCourseStart: {
            notification: {
                title: 'Badhai Ho!🥳',
                message: 'Aapka free English Grammer coure active ho gaya hai🎉',
                firebaseTag: 'OFFER_CAMPAIGN',
            },
        },
        courseStart: {
            notification: {
                en: {
                    title: 'Ab aap Doubtnut ke VIP member hain! 😎',
                    message: 'Apne course ki padhai karne ke liye yahan click karein',
                    firebaseTag: 'POST_PURCHASE_EN',
                },
                hi: {
                    title: 'अब आप Doubtnut के VIP सदस्य हैं! 😎',
                    message: 'अपने कोर्स की पढ़ाई करने के लिए यहाँ क्लिक करें',
                    firebaseTag: 'POST_PURCHASE_HI',
                },
            },
            SMS: {
                en: {
                    message: 'Doubtnut par ""{1}"" course khareedne ke liye badhai!\n\nCourse ki padhai karne ke liye click - {2}\n\nApp kaise use karna hai? Jaaniye - {3}',
                },
                hi: {
                    message: 'Doubtnut पर "{1}" कोर्स खरीदने पर बधाई हो!\n\nकोर्स की पढ़ाई करने के लिए क्लिक - {2}\n\nऐप कैसे यूज़ करना है? जानिये - {3}',
                },
            },
            whatsapp: {
                en: {
                    message: 'Congratulations on buying {1} course from Doubtnut!\n\nTo study from this course, click on this link and save it for future.\n{2}\n\nTo know How to use the App, click here.\n{3}',
                },
                hi: {
                    message: 'आपके {1}  कोर्स का  फ़्री डेमो शुरू होगया है!\n\nअपने कोर्स की पढ़ाई करने के लिए इस लिंक पर क्लिक करें | \n{2}\n\nऐप कैसे यूज़ करना है जानने के लिए यहाँ क्लिक करें !\n{3}',
                },
                courseDeeplinkCampaign: 'POST_PURCHASE',
            },
        },
        courseStartTimeTable: {
            notification: {
                en: {
                    title: 'Aapke course ka timetable! 😎',
                    message: 'Download karne ke liye yahan click karein ',
                    firebaseTag: 'POST_PURCHASE_TIMETABLE_EN',
                },
                hi: {
                    title: 'आपके कोर्स का टाइमटेबल! 😎 ',
                    message: 'डाउनलोड करने के लिए यहाँ क्लिक करेंरें',
                    firebaseTag: 'POST_PURCHASE_TIMETABLE_HI',
                },
            },
            SMS: {
                en: {
                    message: 'Doubtnut par ""{1}"" course khareedne ke liye badhai ho!\n\nCourse ki padhai karne ke liye click - {2}\n\nApp kaise use karna hai? Jaaniye - {3}\n\nTimetable - {4}',
                },
                hi: {
                    message: 'Doubtnut पर ""{1}"" कोर्स खरीदने पर बधाई हो!\n\nकोर्स की पढ़ाई करने के लिए क्लिक - {2}\n\nऐप कैसे यूज़ करना है? जानिये - {3}\n\nटाईमटेबल - {4}',
                },
            },
            whatsapp: {
                en: {
                    message: 'Congratulations on buying {1} course from Doubtnut!\n\nTo study from this course, click on this link and save it for future.\n{2}\n\nTo know How to use the App, click here.\n{3}',
                },
                hi: {
                    message: 'आपके {1}  कोर्स का  फ़्री डेमो शुरू होगया है!\n\nअपने कोर्स की पढ़ाई करने के लिए इस लिंक पर क्लिक करें | \n{2}\n\nऐप कैसे यूज़ करना है जानने के लिए यहाँ क्लिक करें !\n{3}',
                },
                courseDeeplinkCampaign: 'POST_PURCHASE_TIMETABLE',
            },
        },
        paidUserChampionship: {
            notification: {
                title: 'Padho aur jeeto',
                firebaseTag: 'PADHO_AUR_JEETO_POST_PURCHASE_NOTIFICATION',
                image_url: `${config.staticCDN}engagement_framework/4CC67CAD-9B47-C41A-F990-32F6A2552AF5.webp`,
            },
        },
    },

    'APPLY COUPON': {
        hi: 'कूपन लगाएं',
    },
    'COPY COUPON': {
        hi: 'कूपन कॉपी करें',
    },
    'COUPON CODE': {
        hi: 'कूपन कोड',
    },
    'HINT : APPLY COUPON CODE HERE': {
        hi: 'हिंट : यहां कूपन कोड डाले',
    },
    APPLY: {
        hi: 'लगाएं',
    },
    'APPLICABLE COUPONS': {
        hi: 'वैध कूपन',
    },
    'SELECT A COUPON': {
        hi: 'कूपन चुनें',
    },
    'APNE COURSE KE LIYE BEST COUPON CHUNIYE': {
        hi: 'अपने कोर्स के लिए बेस्ट कूपन चुनिए',
        uk_en: 'SELECT BEST COUPON FOR YOUR COURSE',
    },
    'ENTER COUPON CODE': {
        hi: 'कूपन कोड दर्ज करें',
    },
    BACHAO: {
        hi: 'बचाए',
    },
    'BACHAO MAXIMUM': {
        hi: 'बचाए अधिकतम',
    },
    'VALID TILL': {
        hi: 'वैध सीमा',
    },
    'INVALID COUPON': {
        hi: 'अवैध कूपन',
    },
    'YOUR COUPON HAS EXPIRED': {
        hi: 'कूपन की वैधता समाप्त हो गई है',
    },
    'COUPON CLAIM LIMIT REACHED': {
        hi: 'कूपन पर्याप्त बार लागू कर लिया गया है',
    },
    'COUPON ALREADY CLAIMED': {
        hi: 'कूपन पहले ही प्रयोग कर लिया गया है',
    },
    'COUPON SUCCESSFULLY APPLIED': {
        hi: 'कूपन लागू है',
    },
    specialThumbnailIds: [-194, -55, -53, -20, -24, 0, 80, 81, 93, 94, -447],
    localeValues: ['en', 'hi', 'bn', 'gu', 'kn', 'ml', 'mr', 'ne', 'pa', 'ta', 'te', 'ur'],
    languageValues: ['english', 'hindi', 'bengali', 'gujarati', 'kannada', 'malayalam', 'marathi', 'nepali', 'punjabi', 'Tamil', 'Telugu', 'Urdu'],
    surveyTestingIds: [416006, 8306072, 60385821, 66170703, 19211105, 62298148, 24593286, 62298148],
    examUpdateClass: [11, 12, 13],
    boardUpdateClass: [9, 10, 11, 12],
    cdns: ['limelight', 'cloudfront'],
    cdn_url_mapping: [
        {
            cdn: 'limelight',
            url: 'https://doubtnut-static.s.llnwi.net/static-imagekit/',
            weight: 0,
            origin: 'https://doubtnut-static.s.llnwi.net',
            cdn_video_url: 'https://doubtnut.s.llnwi.net/',
            cdn_video_origin: 'https://doubtnut.s.llnwi.net',
        },
        {
            cdn: 'cloudfront',
            url: 'https://d10lpgp6xz60nq.cloudfront.net/',
            weight: 1,
            origin: 'https://d10lpgp6xz60nq.cloudfront.net',
            cdn_video_url: 'https://d3cvwyf9ksu0h5.cloudfront.net/',
            cdn_video_origin: 'https://d3cvwyf9ksu0h5.cloudfront.net',
        },
    ],
    panelCourseMessages: {
        SMS: {
            payment_link: {
                en: 'Please use this link to pay Rs {1} to buy {2} On Doubtnut App - {3}',
                hi: 'Doubtnut App की {1} क्लासेज की फीस {2} रुपये भरने के लिए इस लिंक पर क्लिक करें - {3}',
            },
            course_link: {
                hi: 'फीस भरने के बाद Doubtnut App पर अपनी {1} क्लासेज की पढाई इस लिंक पर क्लिक करके शुरू करें -{2}',
            },
        },
    },
    viser: {
        ocrEndpoint: `${config.viserOcrEndpoint}cosmos`,
        authKey: 'Basic ZG91YnRudXQ6ZG4yMDIxQDU0MzIx',
    },
    mathpix: {
        latexOcrEndpoint: `${config.mathpixOcrEndpoint}v3/latex`,
        textOcrEndpoint: `${config.mathpixOcrEndpoint}v3/text`,
    },
    doubtfeed(locale) {
        return {
            mainheading: global.t8[locale].t('Your Doubts'),
            mainCompletedheading: global.t8[locale].t('Your Completed Doubts'),
            mainheadingOld: global.t8[locale].t('Previous Doubts'),
            studentSection: {
                heading: global.t8[locale].t('Start your practice'),
                subHeading: global.t8[locale].t('students studying now'),
            },
            pdf: {
                title: global.t8[locale].t('Notes on'),
                subTitle: global.t8[locale].t('Notes are the master keys to revise the whole chapter in one go and get better results in exam'),
            },
            formulaSheet: {
                title: global.t8[locale].t('Formula Sheet'),
                subTitle: global.t8[locale].t('All formulas in one place, take a quick look, revise and see yourself as a topper in your exams'),
            },
            topicVideos: {
                title: global.t8[locale].t('Topic Videos'),
                subTitle: global.t8[locale].t('Get all the video solutions for {{topic_name}}'),
            },
            liveClass: {
                title: global.t8[locale].t('Recommended Live Class'),
                subTitle: global.t8[locale].t('Live classes clears the concepts & helps you solve exam solutions of up to 15 marks'),
            },
            topicBooster: {
                title: global.t8[locale].t('Khelo Aur Jeeto'),
                subTitle: global.t8[locale].t('Will take up to 5 minutes'),
            },
            yesterdayGoal: {
                title: global.t8[locale].t('No Daily Goal'),
                subTitle: global.t8[locale].t('Ask a question to set goal for the day and start studying'),
            },
            todayGoal: {
                title: global.t8[locale].t('Daily Goal'),
                completedTitle: global.t8[locale].t('Daily Goal Completed'),
                subTitle: global.t8[locale].t('Introducing daily task habits to help you get ready for your goal'),
                completedSubTitle: global.t8[locale].t('Congratulations. You completed all your task for today’s goal. If you want to regenerate your feed with a new topic ask a question'),
            },
            progressButton: global.t8[locale].t('Ask Question'),

            backpressBottomLine: global.t8[locale].t('I don’t want to study'),

            completedTaskButtonText: global.t8[locale].t('Start Next Task'),

            allCompletedTaskButtonText: global.t8[locale].t('Done'),

            noDoubtBackpressHeding: global.t8[locale].t('Get a new feed by asking question from the topic you want to study'),

            defaultTopicTitle: global.t8[locale].t('No Daily Goal Set'),
        };
    },
    hindiNumbers: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
    scholarshipStartBanner: {
        6107: {
            en: `${config.staticCDN}engagement_framework/833041D3-3EEB-9F81-C218-395DD2A6CF3F.webp`,
            hi: `${config.staticCDN}engagement_framework/ED29645C-A0E3-1259-BC85-C636F2529C9E.webp`,
        },
        6117: {
            en: `${config.staticCDN}engagement_framework/463C674A-DA3F-16AC-DD45-03D94748157D.webp`,
            hi: `${config.staticCDN}engagement_framework/49EB8A55-698D-C91D-8181-DE96F9F97B59.webp`,
        },
        6108: {
            en: `${config.staticCDN}engagement_framework/85CD6042-5A26-1567-4C28-F319419730B6.webp`,
            hi: `${config.staticCDN}engagement_framework/7F4C50CC-A43C-B54E-29E7-53523DDC0EC5.webp`,
        },
        6118: {
            en: `${config.staticCDN}engagement_framework/CBFB4880-A6A1-5CF5-4632-90A6CC441053.webp`,
            hi: `${config.staticCDN}engagement_framework/CFFF5D8F-74F6-6EEF-9F7E-0FA670D1010A.webp`,
        },
        6097: {
            en: `${config.staticCDN}engagement_framework/BA23ADDE-533A-2ABD-5D05-216188C43D82.webp`,
            hi: `${config.staticCDN}engagement_framework/53EB0185-0618-DB7E-6654-80E15C4FF2FE.webp`,
        },
        6098: {
            en: `${config.staticCDN}engagement_framework/21D26D6E-258C-C602-66D8-08DEE748256E.webp`,
            hi: `${config.staticCDN}engagement_framework/C431478A-E856-A0E8-7E7D-CA642E1985FB.webp`,
        },
    },
    scholarshipFaq: {
        hi: '•रैंक 1 लाने वालों को 100% स्कॉलरशिप मिलेगी।\n•रैंक 2-3 वालों को 90% स्कॉलरशिप प्राप्त होगी।\n•रैंक 4-10 लाने वालों को 75% तक की स्कॉलरशिप मिलेगी।\n•रैंक 11-20 वालों को 50% स्कॉलरशिप प्राप्त होगी।\n•रैंक 21-100 लाने वाले 30% तक की स्कॉलरशिप पाएंगे।\n•रैंक 101-1000 लाने वालों को 20% स्कॉलरशिप मिलेगी।\n•बाकी सभी छात्रों को 10% तक की स्कॉलरशिप मिलेगी।',
        en: '•Rank 1 laane walon ko 100% scholarship milegi.b. Rank 2-3 waalon ko 90% scholarship milegi.\n•Rank 4-10 laane walon ko 75% tak ki scholarship milegi.\n•Rank 11-20 waalon ko 50% scholarship milegi.\n•Rank 21-100 waalon ko 30% taki ki scholarship payenge.\n•Rank 101-1000 laane waalon ko 20% scholarship milegi.\n•Baaki sabhi candidates ko 10% tak ki scholarship payenge',
    },
    bnbClickers: {
        notification: {
            en: {
                title: 'Hamare CEO se aapke Mata-Pita ko ek sandesh! 💌',
                message: 'IIT JEE AIR 211 Aditya Shankar ka sandesh abhi dekhein!\nSaath hi coupon code: CEO apply karke paaye 10% discount🏷️',
                firebaseTag: 'BNB_CLICKERS',
            },
            hi: {
                title: 'हमारे CEO से आपके माता - पिता को एक special संदेश ! 💌',
                message: 'IIT JEE AIR 211 आदित्य शंकर का संदेश अभी देखें!\nसाथ ही कूपन कोड: CEO इस्तेमाल कर के पाएं 10% डिस्काउंट🏷️',
                firebaseTag: 'BNB_CLICKERS',
            },
        },
    },
    scholarshipBanner: {
        hi: {
            image_url: `${config.staticCDN}engagement_framework/B40FCF3D-D2DB-8708-2A4C-270D9E15B951.webp`,
        },
        en: {
            image_url: `${config.staticCDN}engagement_framework/96362D12-F331-86DD-8FA9-99BB1AD1C9DE.webp`,
        },
    },
    scholarshipWaitBanner: {
        6107: {
            en: `${config.staticCDN}engagement_framework/0CBE917D-D006-1100-28F5-B1F69C31878B.webp`,
            hi: `${config.staticCDN}engagement_framework/70F8CCEB-77C6-1388-817E-805749F7AF46.webp`,
        },
        6117: {
            en: `${config.staticCDN}engagement_framework/8785F83E-41EF-5216-3025-A28F0AFDC214.webp`,
            hi: `${config.staticCDN}engagement_framework/9E521052-BA76-B904-9093-139A574D3E86.webp`,
        },
        6108: {
            en: `${config.staticCDN}engagement_framework/CBC62AB4-E1CF-505D-9401-CD5326BBDC9A.webp`,
            hi: `${config.staticCDN}engagement_framework/E5CF1E01-92B3-D32B-7176-B3F99FF5DA37.webp`,
        },
        6118: {
            en: `${config.staticCDN}engagement_framework/E554F195-1177-EBC5-4CA6-A6669A67B910.webp`,
            hi: `${config.staticCDN}engagement_framework/FA4477FF-E379-03E2-C2D9-47C071E86261.webp`,
        },
        6097: {
            en: `${config.staticCDN}engagement_framework/86DC7918-2772-4FE7-922E-FF81570D181F.webp`,
            hi: `${config.staticCDN}engagement_framework/37C37F05-C984-ECEF-72DC-DB6E47AA439D.webp`,
        },
        6098: {
            en: `${config.staticCDN}engagement_framework/29686F2B-4347-68D2-C067-7278E1423C4C.webp`,
            hi: `${config.staticCDN}engagement_framework/B668324F-C012-0F37-079E-907F7047BF48.webp`,
        },
    },
    scholarshipResultBanner: {
        en: `${config.staticCDN}engagement_framework/37720759-1747-C4C0-5B3E-AB17E4194F83.webp`,
        hi: `${config.staticCDN}engagement_framework/FF2593B8-053C-A0A5-51BA-A6F53A15F915.webp`,
    },
    scholarshipRegMissedTime: '2021-05-30 08:30:00',
    scholarshipAssortment: {
        6107: {
            en: ['194562', '194558'],
            hi: ['194558', '194562'],
            class: '11',
        },
        6117: {
            en: ['194564', '194560'],
            hi: ['194560', '194564'],
            class: '11',
        },
        6108: {
            en: ['194561', '194557'],
            hi: ['194557', '194561'],
            class: '12',
        },
        6118: {
            en: ['194563', '194559'],
            hi: ['194559', '194563'],
            class: '12',
        },
    },
    boards: ['CBSE', 'UP Board', 'Bihar Board', 'Maharashtra Board', 'Madhya Pradesh Board', 'Rajasthan Board', 'Gujarat Board', 'Himachal Pradesh Board', 'Uttarakhand Board', 'Jharkhand Board', 'Chhattisgarh Board', 'Haryana Board'],
    scholarshipTestMissBanner: {
        en: `${config.staticCDN}engagement_framework/0F21FFCA-2142-106D-FF05-C2A05F54F825.webp`,
        hi: `${config.staticCDN}engagement_framework/B3F94103-AB37-6F04-C125-AE45B9A1217F.webp`,
    },
    scholarshipRegMissBanner: {
        en: `${config.staticCDN}engagement_framework/6D65837F-2294-DF67-10CA-FBDB3584F015.webp`,
        hi: `${config.staticCDN}engagement_framework/8682048B-6FF4-EEBB-8B71-80F459048038.webp`,
    },
    blacklisted_displayNames: ['Default', 'default', 'DEFAULT', 'NONE', 'None', 'ARCHIVE'],
    noticeBoardContents: {
        name: {
            whatsNew: 'नया क्या है',
            todays: 'आज के लिए ख़ास',
        },
        cta: {
            downloadNow: 'अभी डाउनलोड करे',
            viewNow: 'अभी देखो',
            joinNow: 'अभी जुड़े',
        },
        empty(locale) {
            return global.t8[locale].t('No Latest Suggested Content Found! Please check back later!');
        },
    },
    doubtfeedBanner: {
        title: {
            en: `${Math.floor(Math.random() * (15000 - 5000 + 1) + 5000)} students have completed there Daily Goal on`,
        },
        subTitle(locale) {
            return global.t8[locale].t('Aap bhi Karo aur pao 10% extra marks!');
        },
        cta_text(locale) {
            global.t8[locale].t('Check Now');
        },
        homepage(locale) {
            return {
                beforeAsk: global.t8[locale].t('{{random}} students have set their Daily Goal today.\nAapne kiya?', { random: Math.floor(Math.random() * (500000 - 200000 + 1) + 200000) }),

                beforeTask: global.t8[locale].t('ka Daily Goal is ready!\nStart Practice and Payen 10% Tak extra marks!'),

                afterCompletion: global.t8[locale].t('{{random}}% students ne kare 2 se zyada topics practice aaj.\nKaren naya goal set turant!', { random: Math.floor(Math.random() * (98 - 80 + 1) + 80) }),
            };
        },
        button(locale) {
            return {
                ask: global.t8[locale].t('Ask Question'),
                check: global.t8[locale].t('Check Now'),
                resume: global.t8[locale].t('Resume Your Practice'),
            };
        },
    },
    dailygoal(locale) {
        return {
            homepage: {
                beforeAsk: global.t8[locale].t('Apna Daily goal complete karo aur jeeto dher saare rewards!'),
            },
            button: {
                ask: global.t8[locale].t('Complete Now!'),
            },
        };
    },
    textSolutionBanner(locale) {
        return {
            mainText: global.t8[locale].t('Humare paas Iss Question ka kewal Text Solution hai'),
            buttonText: global.t8[locale].t('I Need Video Solution'),
            successText: global.t8[locale].t('Thanks for the feedback Video solution aane par hum aapko notify karenge'),
            imageLink: 'images/text-solution-banner-pic-1.png',
            successImageLink: 'images/text-solution-banner-pic-2.png',
        };
    },
    salesCRM: {
        SMS: {
            // en: 'Dear Student,\nHello! Thanks a lot for speaking with Doubtnut - you can get all the details of this course - {1} - here - {2} - Thanks!\nRegards,\nTeam Doubtnut',
            // hi: 'Dear Student,\nNamaste! Doubtnut se baat karne ke liye aapka hardik dhanyawad - aap is link par jakar - {1} - is course ke saari jaankari prapt kar sakte hain - {2} - Dhanyawad!\nFrom ,\nTeam Doubtnut',
            en: 'Hello! Thanks a lot for speaking with Doubtnut - you can get all the details of this course - {1} - here - {2} . For any query regarding Courses or App , please message on {3}. Thanks!\nRegards,\nTeam Doubtnut',
            hi: 'Namaste Student! Doubtnut se baat karne ke liye aapka hardik dhanyawad - aap is link par jakar - {1} - is course ke saari jaankari prapt kar sakte hain - {2} . Courses ya App se jude sawalo, or anya kisi sahayta ke liye app {3} pe whatsapp kare. Doubt ho toh Doubtnut Karo! Dhanyawad! From, Team Doubtnut',
        },
    },

    updateProfileSectionInHomepage(locale) {
        return global.t8[locale].t('Apni latest info update karen!');
    },

    breadcrumbs_web: {
        languageMapping: {
            en: 'ENGLISH',
            hi: 'HINDI',
            te: 'TELUGU',
            bn: 'BENGALI',
            pu: 'PUNJABI',
            ta: 'TAMIL',
            mr: 'MARATI',
            gu: 'GUJARATI',
            od: 'ODIA',
            kn: 'KANNADA',
            'bn-en': 'BENGALI ENGLISH',
            'gu-en': 'GUJRATI ENGLISH',
            'hi-en': 'HINGLISH',
            'kn-en': 'KANNADA ENGLISH',
            'pu-en': 'PUNJABI ENGLISH',
            'ta-en': 'TAMIL ENGLISH',
            'te-en': 'TELUGU ENGLISH',
            'mr-en': 'MARATI ENGLISH',
            'mi-en': 'MALAYALAM ENGLISH',
            'od-en': 'ODIA ENGLISH',
            'as-en': 'ASSAMESE ENGLISH',
        },
        subjectIconMapping: {
            MATHS: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5014F1E7-09BD-EB97-175A-771BAD6BE0DC.webp',
            CHEMISTRY: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/E8D91397-AEF9-84A5-4E6F-19D8EAC74DFD.webp',
            PHYSICS: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1D248886-9CD2-149A-1C8A-BB210DA66053.webp',
            BIOLOGY: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/DA947CF1-2DEF-BF2C-2D06-1F0831CD4999.webp',
            ENGLISH: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/66EB34A6-CC90-EB7C-3784-BD28183518E1.webp',
            ECONOMICS: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B8EEFCC1-3FC1-7E87-4F1F-EA2C3D11324A.webp',
            ACCOUNTS: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CF734CD4-F24D-6164-E09B-AB45694EE17B.webp',
            HINDI: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/E96513B9-E702-1243-7EE8-1CB505A99FE8.webp',
            'BUSINESS STUDIES': 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/E7467DDE-F71D-A867-57DD-1E48AA67E869.webp',
            GEOGRAPHY: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1ADF884A-7540-9917-0330-AE2C0D7E2E73.webp',
            'SOCIAL SCIENCE': 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/DD927DC9-B65E-48A9-0509-ADD661BBA912.webp',
            HISTORY: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/D00D8685-7AAB-9CF1-CF6B-BDB6E9C503F6.webp',
            'POLITICAL SCIENCE': 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/54876BBC-D6FD-5CC3-3307-EF62A979217E.webp',
            'GENERAL KNOWLEDGE': 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/AF02E8FF-0997-AD66-FAF9-596150B2598D.webp',
            SOCIOLOGY: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56963A57-7443-F7FE-7D15-5F1CEB7B02D8.webp',
        },
    },
    pznLanguagesToLocaleMapping: {
        ENGLISH: 'en',
        HINDI: 'hi',
        TELUGU: 'te',
        BENGALI: 'bn',
        PUNJABI: 'pu',
        TAMIL: 'ta',
        MARATI: 'mr',
        GUJARATI: 'gu',
        ODIA: 'od',
        KANNADA: 'kn',
        'bn-en': 'bn',
        'gu-en': 'gu',
        'hi-en': 'hi',
        'kn-en': 'kn',
        'pu-en': 'pu',
        'ta-en': 'ta',
        'te-en': 'te',
        'mr-en': 'mr',
        'mi-en': 'mi',
        'od-en': 'od',
        'as-en': 'as',
        hi: 'hi',
        en: 'en',
        kn: 'kn',
        te: 'te',
        ta: 'ta',
        bn: 'bn',
        pu: 'pu',
        mr: 'mr',
        gu: 'gu',
        od: 'od',
    },
    kheloJeetoBanner: {
        title: {
            en: 'Naya Khelo aur Jeeto Game',
            hi: 'नया खेलो और जीतो गेम',
        },
        subtitile: {
            en: 'Friends ke saath bhi khelo aur jeeto rewards.',
            hi: 'दोस्तों के साथ भी खेलो और जीतो इनाम',
        },
        cta_text: {
            en: 'Play Now',
            hi: 'अभी खेले',
        },
        img_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/F2A79909-1274-31D0-A1CF-BC0CBC7D7E72.webp',
        gif_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/khelo_jeeto_home_banner.gif',
        deeplink: 'doubtnutapp://khelo_jeeto/home',
    },
    getDurationColor(position) {
        const obj = {
            0: '#54138a',
            1: '#4ca4e3',
            2: '#075606',
        };
        return obj[position] || '#273de9';
    },
    web: {
        course_cards: {
            image_bg: {
                recent: '#e2e2e2',
                books: '#db00ff',
                tests: '#0e788f',
                notes: '#0057ff',
                ncert: '#d20000',
                upcoming: '#b24719',
                homework: '#ff4d00',
                previousYears: '#9e00ff',
                upcoming_tests: '#b24719',
                previous_tests: '#e2e2e2',
                timetable: '#00a167',
            },
            title_color: {
                recent: '#000000',
                books: '#ffffff',
                tests: '#ffffff',
                notes: '#ffffff',
                ncert: '#ffffff',
                upcoming: '#ffffff',
                homework: '#ffffff',
                previousYears: '#ffffff',
                upcoming_tests: '#ffffff',
                previous_tests: '#000000',
                timetable: '#000000',
            },
        },
    },
    popular_course_discount_banners: [
        {
            date_from: '2021-07-25 00:00:00',
            date_to: '2021-07-25 23:59:59',
            banner: `${config.staticCDN}engagement_framework/765AEDB3-EAB6-2C68-0B45-6E1D4A953146.webp`,
            deeplink: 'doubtnutapp://library_tab?library_screen_selected_Tab=0',
        },
        {
            date_from: '2021-07-26 00:00:00',
            date_to: '2021-07-26 23:59:59',
            banner: `${config.staticCDN}engagement_framework/7AB98E62-67B7-DE56-3382-96E6978D0F8F.webp`,
            deeplink: 'doubtnutapp://library_tab?library_screen_selected_Tab=0',
        },
        {
            date_from: '2021-07-27 00:00:00',
            date_to: '2021-07-27 23:59:59',
            banner: `${config.staticCDN}engagement_framework/63C496A7-B3DF-D34A-A49E-024D165DDA45.webp`,
            deeplink: 'doubtnutapp://library_tab?library_screen_selected_Tab=0',
        },
        {
            date_from: '2021-07-28 00:00:00',
            date_to: '2021-07-28 23:59:59',
            banner: `${config.staticCDN}engagement_framework/84053BE6-F665-1AAB-125C-34AAE0AF48D4.webp`,
            deeplink: 'doubtnutapp://library_tab?library_screen_selected_Tab=0',
        },
        {
            date_from: '2021-07-29 00:00:00',
            date_to: '2021-07-29 23:59:59',
            banner: `${config.staticCDN}engagement_framework/BE33FE96-A855-886B-E44B-5EA8AC19AA99.webp`,
            deeplink: 'doubtnutapp://library_tab?library_screen_selected_Tab=0',
        },
        {
            date_from: '2021-07-30 00:00:00',
            date_to: '2021-07-30 23:59:59',
            banner: `${config.staticCDN}engagement_framework/8D54DF38-6F0C-6392-459D-CA5C448E3F45.webp`,
            deeplink: 'doubtnutapp://library_tab?library_screen_selected_Tab=0',
        },
        {
            date_from: '2021-07-31 00:00:00',
            date_to: '2021-07-31 23:59:59',
            banner: `${config.staticCDN}engagement_framework/0FA9B2D4-3967-381E-4AD0-C73F18BAF8B7.webp`,
            deeplink: 'doubtnutapp://library_tab?library_screen_selected_Tab=0',
        },
    ],
    popular_courses_carousel: {
        auto_scroll_time_in_sec: 2,
        delay_in_sec: 5,
    },
    video_language_personification_obj: {
        boards_lang_pref_mapping: {
            CBSE: 'hi',
            'UP Board': 'hi',
            'Bihar Board': 'hi',
            'Maharashtra Board': 'mr',
            'West Bengal Board': 'bn',
            'Madhya Pradesh Board': 'hi',
            'Rajasthan Board': 'hi',
            'Telangana Board': 'te',
            'Gujarat Board': 'gu',
            ICSE: 'hi',
            'Himachal Pradesh Board': 'hi',
            'Uttarakhand Board': 'hi',
            'Chhattisgarh Board': 'hi',
            'Jharkhand Board': 'hi',
            'Delhi Board': 'hi',
            'Punjab Board': 'pu',
            'Nepal Board': 'ne',
            'Karnataka Board': 'kn',
            'Odisha Board': 'od',
            'Andhra Pradesh Board': 'te',
            'Tamil Nadu Board': 'ta',
            'Haryana Board': '',
            'Kerala Board': 'ml',
        },
        sample_attachment: {
            en: {
                question_locale: {
                    en: {
                        board: {
                            'state-board': {
                                genre: 'stateLocale',
                                order: [
                                    'en',
                                    'xx-en',
                                    'xx',
                                ],
                            },
                            'general-board': {
                                order: [
                                    'hi-en',
                                    'en',
                                ],
                            },
                        },
                        'no-board': {
                            order: [
                                'hi-en',
                                'en',
                            ],
                        },
                    },
                    'non-en': {
                        board: {
                            'state-board': {
                                genre: 'stateLocale',
                                order: [
                                    'xx-en',
                                    'en',
                                    'xx',
                                    'hi-en',
                                ],
                            },
                            'general-board': {
                                order: [
                                    'hi-en',
                                    'en',
                                ],
                            },
                        },
                        'no-board': {
                            genre: 'questionLocale',
                            order: [
                                'xx-en',
                                'en',
                                'xx',
                                'hi-en',
                            ],
                        },
                    },
                },
            },
            hi: {
                order: [
                    'hi',
                    'hi-en',
                    'en',
                ],
            },
            others: {
                genre: 'appLocale',
                order: [
                    'xx',
                    'xx-en',
                    'en',
                ],
            },
        },
    },
    quiz_web_default_values: {
        class: 'Eg. Class 12',
        subject: 'Eg. Physics',
        chapter: 'Eg. Gravitation',
        language: 'Eg. English',
    },
    quiz_web: {
        languages: {
            en: 'ENGLISH',
            hi: 'HINDI',
            te: 'TELUGU',
            ta: 'TAMIL',
            bn: 'BENGALI',
            gu: 'GUJARTI',
            kn: 'KANNADA',
            ml: 'MALAYALAM',
            mr: 'MARATI',
            od: 'ODIA',
            pu: 'PUNJABI',
        },
        answer_mapping: {
            1: 'A',
            2: 'B',
            3: 'C',
            4: 'D',
        },
    },
    testimonialData: {
        hashTitle: '#dnresults',
        title: 'Doubtnut students shine in Board & Competitive  Exams!',
        subtitle: 'Hardwork of students pays off',
        button_text: 'Our Toppers',
        banner_data: [
            [
                '30% students',
                'scored more than',
                '95% marks',
            ],
            [
                '50% students',
                'scored more than',
                '90% marks',
            ],
        ],
        testimonials_title: 'See what students said',
        bottom_button: {
            title: 'Check All courses of Doubtnut',
            deeplink: 'doubtnutapp://course_explore',
        },
    },
    branch_campaign_signup_credit: 100,
    landing_page_data: {
        title: 'India ka #1 Study App',
        subTitle: 'Maths, Physics, Chemistry aur Biology ke doubts turant solve kariye',
        surveyWidgetTitle: 'Apna special 20% Discount code paane ke liye contact karein!',
        callButtontext: 'Call Us',
        successMsgs: {
            default: 'Doubtnut Team aapko contact karegi. Thank You!',
            swiggy: 'SWIGGY20 Code use kare aur paaye 20% Discount sabhi courses pe!',
            ola: 'OLA20 Code use kare aur paaye 20% Discount sabhi courses pe!',
            urbancompany: 'UC20 Code use kare aur paaye 20% Discount sabhi courses pe!',
        },
        errorMsgs: {
            default: 'Some error occured. Please try again',
            swiggy: 'Some error occured. Please try again',
            ola: 'Some error occured. Please try again',
            urbancompany: 'Some error occured. Please try again',
        },
        couponCodes: {
            swiggy: 'SWIGGY20',
            ola: 'OLA20',
            urbancompany: 'UC20',
        },
    },
    cpn_url: `${config.couponServiceUrl}`,
    unmatched_questions_post_solution_notifications_config: {
        hi: {
            title: 'Doubnut ko yaad hai apka sawal 🤩',
            message: 'Sirf apke liye banaya video solution 👍🏻',
            tag: 'USER_ASKED_HIEN_2',
        },
        en: {
            title: 'We remember your doubts ✍🏻',
            message: 'Watch the detailed solution video of your question ✌🏻',
            tag: 'USER_ASKED_EN_2',
        },
    },
    scholarshipShareMessage(obj) {
        return {
            DNST: global.t8[obj.locale].t('Aap bhi aaj hi Doubtnut scholarship test ke liye Register karein aur 100% tak ki scholarship jeetne ka mauka payein. \nAaj hi iss link par Register karein : {{shareLink}} \nAur {{testDate}} ko test dena na bhulen!', { shareLink: obj.shareLink, testDate: obj.testDate }),
            TALENT: global.t8[obj.locale].t('Hey Dost!\nDoubtnut super 💯 batch mein selection👩‍🎓👨‍🎓 ke liye aur ₹3,00,000 tak ke 💵💵cash prizes jeetne ke liye maine toh register kar liya!\nTum bhi jaldi se register kar lo is link par click karke: \n{{shareLink}} \n\nTest: {{testDate}}\nInterview: {{interviewDate}}\nBatch Starts: {{batchDate}}', { shareLink: obj.shareLink, testDate: obj.testDate, interviewDate: obj.interviewDate, batchDate: obj.batchDate }),
            OTHER: global.t8[obj.locale].t('Aap bhi aaj hi Doubtnut SSC scholarship test ke liye Register karein aur 100% tak ki scholarship jeetne ka mauka payein. \nAaj hi iss link par Register karein : {{shareLink}} \nAur {{testDate}} ko test dena na bhulen!', { shareLink: obj.shareLink, testDate: obj.testDate }),
            NKC: global.t8[obj.locale].t("Register Now!!! for Target JEE 2023 Scholarship Test and Get a chance to Win upto 100% Scholarship. \nClick on link for Register: {{shareLink}} \nDon't forget to take Test on {{testDate}}", { shareLink: obj.shareLink, testDate: obj.testDate }),
        };
    },

    scholarshipShareSMS(locale, testName, date, url) {
        return global.t8[locale].t('Aapne {{testName}} scholarship test ke liye Doubtnut par register kiya hai.\nAapka test {{date}} ko hai.\nTest link :{{url}}', { testName, date, url });
    },

    scholarshipshareTextOnPage(locale) {
        return {
            DNST: global.t8[locale].t('Apne doston ko bhi banaaye is Scholarship Test ka hissa.'),
            TALENT: global.t8[locale].t('Apne doston ko bhi banaaye is Doubtnut Super 100 Test ka hissa.'),
        };
    },
    scholarship1registrationText(locale) {
        return {
            DNST: global.t8[locale].t('Registration closed. Register kar test de aur paaye 10% ki scholarship'),
            TALENT: global.t8[locale].t('Test window close hogai hai, ab aap test de sakte hain par aapke marks doubtnut super 100 admission process ke liye manya nahi honge.'),
        };
    },
    scholarship2head(locale, testName) {
        return {
            DNST: global.t8[locale].t('Aapne {{testName}} scholarship test ke liye register kiya hai.', { testName }),
            TALENT: global.t8[locale].t('Aapne {{testName}} Doubtnut Super 100 test ke liye register kiya hai.', { testName }),
        };
    },

    scholarship2msg(locale, date) {
        return global.t8[locale].t('Aapka test {{date}} ko hai.', { date });
    },

    scholarship3registeredText1(locale) {
        return {
            DNST: global.t8[locale].t('Test de aur paaye 10% ki scholarship'),
            TALENT: global.t8[locale].t('Registration window close hogai hai, ab aap register kar test de sakte hain par aapke marks Doubtnut Super 100 admission process ke liye manya nahi honge'),
        };
    },
    scholarship3registeredText2(locale, testName) {
        return {
            DNST: global.t8[locale].t('Aap {{testName}} Scholarship Test ke liye successfully register hai', { testName }),
            TALENT: global.t8[locale].t('Aap {{testName}} Doubtnut Super 100 Test ke liye successfully register hai', { testName }),
        };
    },
    scholarship4completionText(locale, testName) {
        return {
            DNST: global.t8[locale].t('Aapne {{testName}} Scholarship Test successfully complete kiya !', { testName }),
            TALENT: global.t8[locale].t('Aapne {{testName}} Doubtnut Super 100 Test successfully complete kiya !', { testName }),
        };
    },
    backPressMatchesConfig: {
        user_questions_index: 'user-questions',
        question_bank_index: 'question_bank_v1.1',
        minimum_should_match: '80%',
        engage_time: 100,
        activeVariantIds: [3],
    },
    scholarshipcourseText(locale, testName) {
        return {
            DNST: global.t8[locale].t('Aapne {{testName}} Scholarship Test successfully complete kar liya hai', { testName }),
            TALENT: global.t8[locale].t('Aapne {{testName}} Doubtnut Super 100 Test successfully complete kar liya hai', { testName }),
        };
    },
    round2page1(locale) {
        return {
            common: {
                end: global.t8[locale].t('Oops!!<br/>Registration time ab khatam ho chuka hai.<br/>Ab aap round 2 ke liye register nahi kar sakte hain'),
                start: global.t8[locale].t('Congratualtion !<br/>Aap Doubtnut Super 100 ke Round 2 ke liye select ho gaye hain<br/><br/>Fill details button par click karke round 2 ke liye register karein'),
            },
            button: global.t8[locale].t('Fill details for round 2'),
        };
    },
    round2page2(obj) {
        return {
            reg: {
                end: global.t8[obj.locale].t('Aap Doubtnut super 100 ke round 2 se bahar hogae hai'),
                mid: global.t8[obj.locale].t('Doubtnut Super 100 ka round 2 start ho gaya hai'),
                start: global.t8[obj.locale].t('Aap round 2 ke liye successfully registered hain'),
            },
            text: {
                end: global.t8[obj.locale].t('You have missed your interview slot'),
                mid: global.t8[obj.locale].t('Your interview slot has started'),
                start: global.t8[obj.locale].t('Your interview will start in'),
            },
            common: {
                end: global.t8[obj.locale].t('Aapke interview slot ka time khatam hogaya hai.<br/>Ab aap interview nahi dae sakte hai'),
                mid: global.t8[obj.locale].t('Doubtnut ke teachers aapko interview ke liye call karenge.'),
                start: global.t8[obj.locale].t('Aapko <u>{{slot}}</u>  interview slot allot kiya gaya hai.<br/>Best of luck for the interview.', { slot: obj.slot }),
            },
        };
    },
    round2page3(locale) {
        return {
            common: global.t8[locale].t('Congratulations ! aapka interview round successfully complete ho gaya hai'),
            timerText: global.t8[locale].t('Round 2 results will be declared in'),
        };
    },
    round2page4(locale) {
        return {
            common: global.t8[locale].t('Congratulation!!!!!<br/>Aap <u>Doubtnut Super 100</u> batch mein select ho gaye hain<br/><br/>Aapke doubtnut registered mobile number par aapka prize money paytm kar diya jayega'),
            button: global.t8[locale].t('Claim Reward'),
        };
    },
    userFeedbackPopupData: {
        retry_counter: -3,
        cancel_retry_counter: -5,
        feedback: {
            positive: ['high_engage_time', 'liked_the_solution'],
            negative: ['no_video_watched', 'disliked_the_solution'],
        },
        prefrencesToBeCapturedAgainstFeedback: [1],
        // get_popup_button_text: {
        //     en: ['Not appropriate solution', 'blank page', 'video language wrong'],
        //     hi: ['galat solution', 'khali page', 'galat video language'],
        // },
        submit_button_text: {
            en: 'SUBMIT',
            hi: 'SUBMIT',
        },
    },
    languageDetectionRegex: {
        hi: '[\u0900-\u097F]',
        te: '[\u0C00-\u0C7F]',
        ta: '[\u0B80-\u0BFF]',
        bn: '[\u0980-\u09FF]',
        gu: '[\u0A80-\u0AFF]',
        kn: '[\u0C80-\u0CFF]',
        ml: '[\u0D00-\u0D7F]',
        pa: '[\u0A00-\u0A7F]',
    },
    dcPandeyMainId: [108191, 108192],
    dcPandeyBooks: [108193, 108194, 108195, 108196, 108197, 108198, 108199, 108200, 108201, 108202],
    spclBooksWithExtraStep: [106960, 106963, 110514, 110517],
    dcPandeyBooksImagesMapping: {
        108193: 'engagement_framework/730E0331-43EA-78AF-56E2-98FAB23F2425.webp',
        108194: 'engagement_framework/A7F518A2-1CFC-DA81-CD91-D47A93D4422C.webp',
        108195: 'engagement_framework/2493B84A-696F-D4B8-F64C-CED3B8AC7EC7.webp',
        108196: 'engagement_framework/D6B9124B-92DC-4A05-FFAC-6C0780D3AE06.webp',
        108197: 'engagement_framework/DA3B1E50-B46F-ACCE-9062-4B9ACD87C3B8.webp',
        108198: 'engagement_framework/730E0331-43EA-78AF-56E2-98FAB23F2425.webp',
        108199: 'engagement_framework/A7F518A2-1CFC-DA81-CD91-D47A93D4422C.webp',
        108200: 'engagement_framework/2493B84A-696F-D4B8-F64C-CED3B8AC7EC7.webp',
        108201: 'engagement_framework/D6B9124B-92DC-4A05-FFAC-6C0780D3AE06.webp',
        108202: 'engagement_framework/DA3B1E50-B46F-ACCE-9062-4B9ACD87C3B8.webp',
    },
    notActiveBooks: [125001, 106225, 112395, 121053, 121408, 106964, 122724],
    exceptionBooks: [108191, 108192],
    subjectBookFlowIds: ['108858', '108859', '108860', '110500', '108855', '108856', '108857', '110496', '108864', '108863', '108862', '108861', '108868', '108867', '108866', '108865'],
    leaderboardImage: `${config.staticCDN}engagement_framework/81BEC94F-0176-0E17-9686-66C5019227F7.webp`,
    scholarshipReferralFriends: `${config.staticCDN}engagement_framework/F8AB9E51-17EA-8341-D40B-5837F6C21329.webp`,
    scholarshipReferralWhatsapp: `${config.staticCDN}engagement_framework/0EB051B5-ABA4-CFA2-7D9B-E60792A7EF69.webp`,
    scholarshipReferralTelegram: `${config.staticCDN}engagement_framework/6026EEAF-E748-3E85-B204-3E5219CD1033.webp`,
    scholarshipPracticeLocked: `${config.staticCDN}engagement_framework/04390A08-4FF1-9ECF-6FEE-FFFA8F1281A4.webp`,
    scholarshipPracticeUnlocked: `${config.staticCDN}engagement_framework/8D2D343E-9CB0-0C6B-7B9C-0A928B52EEC7.webp`,
    LC: {
        USER_LOCATION_LANGUAGE_MAPPING: {
            UP: ['hi'], // Uttar Pradesh
            WB: ['bn'], // West Bengal
            ML: ['as', 'hi'], // Meghalaya
            NL: ['as', 'hi'], // Nagaland
            CG: ['hi'], // Chhattisgarh
            AS: ['as'], // Assam
            KA: ['kn'], // Karnataka
            HP: ['hi'], // Himachal Pradesh
            PB: ['pu'], // Punjab
            MZ: ['as', 'hi'], // Mizoram
            DL: ['hi'], // Delhi
            BR: ['hi'], // Bihar
            OD: ['od'], // Odisha
            PY: ['ta'], // Puducherry
            TS: ['te'], // Telangana
            TR: ['as', 'hi'], // Tripura
            AN: ['hi'], // Andaman and Nicobar Islands
            MH: ['mr'], // Maharashtra
            CH: ['hi', 'pu'], // Chandigarh
            RJ: ['hi'], // Rajasthan
            MP: ['hi'], // Madhya Pradesh
            JH: ['hi'], // Jharkhand
            GJ: ['gu'], // Gujarat
            MN: ['as', 'hi'], // Manipur
            HR: ['hi'], // Haryana
            JK: ['hi'], // Jammu and Kashmir
            AR: ['as', 'hi'], // Arunachal Pradesh
            AD: ['te'], // Andhra Pradesh
            TN: ['ta'], // Tamil Nadu
            UK: ['hi'], // Uttarakhand
            KL: ['ml'],
        }, // Kerala
        USER_BOARD_LANGUAGE_MAPPING: {
            CBSE: ['en'],
            'UP Board': ['hi'],
            'Bihar Board': ['hi'],
            'Maharashtra Board': ['mr'],
            'West Bengal Board': ['bn'],
            'Madhya Pradesh Board': ['hi'],
            'Rajasthan Board': ['hi'],
            'Telangana Board': ['te'],
            'Gujarat Board': ['gu'],
            ICSE: ['en'],
            'Himachal Pradesh Board': ['hi'],
            'Uttarakhand Board': ['hi'],
            'Chhattisgarh Board': ['hi'],
            'Jharkhand Board': ['hi'],
            'Delhi Board': ['hi'],
            'Punjab Board': ['pu'],
            'Nepal Board': ['hi'],
            'Karnataka Board': ['kn'],
            'Odisha Board': ['od'],
            'Andhra Pradesh Board': ['te'],
            'Tamil Nadu Board': ['ta'],
            'Haryana Board': ['hi'],
            'Kerala Board': ['ml'],
        },
        VIDEO_LANGUAGE_SET: ['en', 'hi', 'ta', 'bn', 'te', 'gu', 'kn', 'ml', 'mr', 'od', 'pu', 'as'],
    },
    teacherChannelAnnouncementArr: [
        `${config.staticCDN}engagement_framework/2A748318-C608-2156-B3F8-839B1E04232E.webp`,
        `${config.staticCDN}engagement_framework/98CF536C-0DBC-8CEB-994A-E0856E81370A.webp`,
        `${config.staticCDN}engagement_framework/BD394862-0DB9-D112-0F96-2132644AAF72.webp`,
        `${config.staticCDN}engagement_framework/00046A3D-AD7A-365F-7D7C-5D66344479C1.webp`,
    ],
    teacherChannelVideoBackgroundArr: [
        '#FFC5B2',
        '#FFE0B2',
        '#CCDDFF',
        '#B2FFB6',
        '#B2FAFF',
    ],
    teacherChannelVideoBackgroundArrCircle: [
        '#FB9676',
        '#F4C378',
        '#9BB3E1',
        '#88EA8D',
        '#75D9DF',
    ],
    teacherChannelVideoIcon: `${config.staticCDN}engagement_framework/F39E24A4-5450-9FC7-0CE5-9704DC162296.webp`,
    teacherChannelPdf1Icon: `${config.staticCDN}engagement_framework/DFF818C4-0CCC-097E-DCFE-EF78305B1BDB.webp`,
    teacherChannelPdf2Icon: `${config.staticCDN}engagement_framework/D1E447F4-E3A7-834E-EC32-BA9C600975E7.webp`,
    teacherChannelAnnouncementIcon: `${config.staticCDN}engagement_framework/EB486B1F-9A7C-5AA6-B89F-7FFF6A9BEA1C.webp`,
    teacherChannelMockIcon: `${config.staticCDN}engagement_framework/D09127E6-69D7-8D50-F055-D7696425932A.webp`,
    teacherDefaultImage: `${config.staticCDN}engagement_framework/E9F16D21-A0BC-C5AC-77D3-678C95588DFD.webp`,
    iasTabsMapping: {
        live_class: {
            key: 'live_class',
            value: 'Live Class',
        },
        book: {
            key: 'book',
            value: 'Books',
        },
        pdf: {
            key: 'pdf',
            value: 'PDFs',
        },
        course: {
            key: 'course',
            value: 'Course/Subjects',
        },
    },
    cloudfront_video_url: 'https://d3cvwyf9ksu0h5.cloudfront.net/',
    limelight_video_url: 'https://d3cvwyf9ksu0h5.cloudfront.net/',
    tencent_video_url: 'https://tcdn.doubtnut.com/',
    other_video_url: 'https://doubtnutvideo.picocdn.net/',
    iasAdFilterDataList: [{
        key: 'class',
        display: 'Select class',
        value: 'What class are you studying?',
        list: [],
    },
    {
        key: 'language',
        display: 'Select language',
        value: 'What is your preferred language?',
        list: [],
    },
    {
        key: 'board',
        display: 'Select Board',
        value: 'Which Board are you looking for?',
        list: [],
    },
    {
        key: 'exam',
        display: 'Select Exam',
        value: 'Which Exam are you looking for?',
        list: [],
    },
    {
        key: 'subject',
        display: 'Select subject',
        value: 'Which subject are you looking for?',
        list: [],
    },
    {
        key: 'chapter',
        display: 'Select chapter',
        value: 'Which chapter are you looking for?',
        list: [],
    },
    {
        key: 'expert',
        display: 'Select teacher',
        value: 'Which teacher are you looking for?',
        list: [],
    },
    {
        key: 'author',
        display: 'Select Author',
        value: 'Which Author are you looking for?',
        list: [],
    },
    {
        key: 'publication',
        display: 'Select Publication',
        value: 'Which Publication are you looking for?',
        list: [],
    }],
    social_auth_profile_page_display_count_max: 3,
    dnr(locale) {
        return {
            title: global.t8[locale].t('This is Doubtnut Rupya also known as DNR'),
            title1: global.t8[locale].t('DNR'),
            description: global.t8[locale].t('• By doing activities on app you can earn DNR \n\n• You can use these DNR to redeem vouchers, coupons, recharges and many more things through the app. \n\n• To know more visit the DNR page'),
            cta_text: global.t8[locale].t('Check Now'),
        };
    },
    ccmIdArrayForExams: [11101, 11102, 11202, 11302, 11103, 11107, 11108, 11201, 11203, 11207, 11208, 11301, 11303, 13360, 13370],
    ccmIdExamNameMapping: {
        11401: { name: 'SSC', type: 'SSC' },
        11402: { name: 'BANKING', type: 'BANKING' },
        11403: { name: 'TEACHING', type: 'CTET' },
        11404: { name: 'RAILWAY', type: 'RAILWAY' },
        11405: { name: 'DEFENCE', type: 'DEFENCE/NDA/NAVY' },
        11517: { name: 'State Police', type: 'DEFENCE/NDA/NAVY' },
        11518: { name: 'Civil Services', type: 'SSC' },
        11519: { name: 'IT', type: 'IT' },
    },
    newPDFIcons: {
        // *********** mock PDFs start ***********
        104567: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/902BDDD5-C230-FCDD-C48A-A245D5AC0CA4.webp',
        104568: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/902BDDD5-C230-FCDD-C48A-A245D5AC0CA4.webp',
        // *********** mock PDFs End ***********

        // *********** IIT PDFs start ***********
        109374: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/32200623-01A2-BA11-12A0-52318B380A92.webp',
        109375: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/32200623-01A2-BA11-12A0-52318B380A92.webp',
        116587: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/32200623-01A2-BA11-12A0-52318B380A92.webp',
        116594: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/32200623-01A2-BA11-12A0-52318B380A92.webp',
        // *********** IIT PDFs End ***********

        // *********** NCERT PDFs start ***********
        104605: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/994CDCB5-A459-7D7C-F573-8DE37BF08649.webp',
        104607: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/994CDCB5-A459-7D7C-F573-8DE37BF08649.webp',
        104608: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/994CDCB5-A459-7D7C-F573-8DE37BF08649.webp',
        104614: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/994CDCB5-A459-7D7C-F573-8DE37BF08649.webp',
        104615: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/994CDCB5-A459-7D7C-F573-8DE37BF08649.webp',
        104616: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/994CDCB5-A459-7D7C-F573-8DE37BF08649.webp',
        104617: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/994CDCB5-A459-7D7C-F573-8DE37BF08649.webp',
        104618: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/994CDCB5-A459-7D7C-F573-8DE37BF08649.webp',
        // *********** NCERT PDFs start ***********

        // default PDFs Icon
        default: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/758C5D37-F55C-0F9E-4ABC-E85933E6B190.webp',
    },
    'CONTINUE WATCHING': {
        hi: 'देखना जारी रखें',
    },
    'VIEW HISTORY': {
        hi: 'हिस्ट्री देखें',
    },
    'GO TO VIDEO': {
        hi: 'वीडियो पर जाएं',
    },
    'GO TO': {
        hi: 'गो टू',
    },
    'YOU WERE WATCHING': {
        hi: 'आप देख रहे थे',
    },
    'MINUTES AGO': {
        hi: 'कुछ देर पहले',
    },
    'HOURS AGO': {
        hi: 'घंटो पहले',
    },
    'BOARD EXAM RESULTS - 2021': {
        hi: 'बोर्ड एग्जाम रिजल्ट - 2021',
    },
    'TOPICS SUGGESTED FOR YOU': {
        hi: 'आपके लिए सुझाए गए टॉपिक / सजेस्टेड टॉपिक',
    },
    'BASED ON YOUR QUESTION ASKED HISTORY': {
        hi: 'पूछे गए प्रश्नों की हिस्ट्री के आधार पर',
    },
    'BASED ON LAST 1 HOUR': {
        hi: 'पिछले / आखिरी 1 घंटे के आधार पर ',
    },
    VIDEOS: {
        hi: 'वीडियोज़',
    },
    BOOKS: {
        hi: 'बुक',
    },
    PDFS: {
        hi: 'पीडीएफ',
    },
    'SEE ALL VIDEOS': {
        hi: 'सभी वीडियो देखें',
    },
    'WHAT YOUR FRIENDS ARE WATCHING': {
        hi: 'आपके दोस्त क्या देख रहे हैं',
    },
    'IN MOST RECENT 24 HOURS': {
        hi: 'हाल के 24 घंटों में',
    },
    'NCERT BOOK SOLUTIONS': {
        hi: 'एनसीआरटी बुक सॉल्यूशन',
    },
    'POPULAR BOOK SOLUTIONS': {
        hi: 'लोकप्रिय बुक सॉल्यूशन',
    },

    library_v957_subjects: {
        physics: {
            text: {
                hi: 'फिजिक्स',
                en: 'Physics',
            },
            image: {
                even: {
                    hi: `${config.staticCDN}engagement_framework/6BF640E5-6A55-CC8A-2463-5818A5F8F13E.webp`,
                    en: `${config.staticCDN}engagement_framework/D2CBA80C-48D7-28C5-D7F8-0ACA629F14C3.webp`,
                },
                odd: {
                    hi: `${config.staticCDN}engagement_framework/5F7D8D04-C4AB-6E32-914A-1676C331286A.webp`,
                    en: `${config.staticCDN}engagement_framework/E0E4A1E1-A464-30D4-0AF1-DC0412D1B717.webp`,
                },
            },
            ocr_text_color_code: '#DFCCFF',
        },
        chemistry: {
            text: {
                hi: 'केमिस्ट्री',
                en: 'Chemistry',
            },
            image: {
                even: {
                    hi: `${config.staticCDN}engagement_framework/22EA477A-5D16-FED0-2715-AD5D848DCCF4.webp`,
                    en: `${config.staticCDN}engagement_framework/9E393612-E1CB-D841-1FAF-DC92823C2519.webp`,
                },
                odd: {
                    hi: `${config.staticCDN}engagement_framework/B38F5AED-66A1-C435-43F4-389E40D5A142.webp`,
                    en: `${config.staticCDN}engagement_framework/500699F6-975A-7363-CDF4-3D8044911BEE.webp`,
                },
            },
            ocr_text_color_code: '#FCCBBC',
        },
        maths: {
            text: {
                hi: 'मैथ्स',
                en: 'Maths',
            },
            image: {
                even: {
                    hi: `${config.staticCDN}engagement_framework/7022A3A9-55F1-405D-417A-217E7C996CA1.webp`,
                    en: `${config.staticCDN}engagement_framework/AF67CE9D-7DFD-7B7A-F07B-AB1B02EEB337.webp`,
                },
                odd: {
                    hi: `${config.staticCDN}engagement_framework/E2A0569E-FA22-4ADE-D9D3-DE8E4F53AC58.webp`,
                    en: `${config.staticCDN}engagement_framework/13961531-503B-0A6E-B0C1-C1E9437E10E2.webp`,
                },
            },
            ocr_text_color_code: '#D5EDFF',
        },
        biology: {
            text: {
                hi: 'बायोलॉजी',
                en: 'Biology',
            },
            image: {
                even: {
                    hi: `${config.staticCDN}engagement_framework/4A82D2B8-2788-5DF0-39AD-2FAADD4CD5E2.webp`,
                    en: `${config.staticCDN}engagement_framework/9527D548-645B-2F4F-49DC-AB3608C33902.webp`,
                },
                odd: {
                    hi: `${config.staticCDN}engagement_framework/5EB29199-D8EE-CF94-9C06-44796A57532E.webp`,
                    en: `${config.staticCDN}engagement_framework/842C9D56-2071-CAB4-B8AF-A6EAE1DEA66B.webp`,
                },
            },
            ocr_text_color_code: '#DAFFF2',
        },
        history: {
            image: `${config.staticCDN}engagement_framework/72A34417-CF1B-F731-01FF-7B07F8394DF4.webp`,
            deeplink: 'doubtnutapp://history',
        },
        watch_later: {
            image: `${config.staticCDN}engagement_framework/22ECCC1E-1D55-005B-C7C1-F815D7DF9804.webp`,
            deeplink: 'doubtnutapp://playlist?playlist_id=1&playlist_title=Watch Later',
        },
        science: {
            ocr_text_color_code: '#C7F7F3',
        },
        english: {
            text: {
                hi: 'अंग्रेज़ी',
                en: 'English',
            },
            ocr_text_color_code: '#FDCCFF',
        },
        social_science: {
            ocr_text_color_code: '#B0D2FF',
        },
        english_grammar: {
            ocr_text_color_code: '#FFD5C0',
        },
    },
    'MOST POPULAR': {
        hi: 'सबसे पोपुलर',
    },
    'RECOMMENDED FOR YOU': {
        hi: 'आपके लिए सुझाया गया',
    },
    EXAMS: {
        hi: 'एग्जाम',
    },
    'EXPLORE LIBRARY': {
        hi: 'लाइब्रेरी देखें',
    },
    'YOU HAVE SELECTED IIT JEE': {
        hi: 'आपने आईआईटी जेईई सलेक्ट किया है',
    },
    SUBMIT: {
        hi: 'सबमिट',
    },
    'EXPLORE OTHER EXAMS': {
        hi: 'अन्य एग्जाम खोजें ',
    },
    'PREVIOUS YEAR PAPERS': {
        hi: 'पिछले साल के पेपर',
    },
    'SUPER 40 SERIES': {
        hi: 'सुपर 40 सिरीज़',
    },
    'JEE 2020 - 30 DAYS REVISION': {
        hi: 'जेईई 2020 - 30 दिन का रिवीजन',
    },
    'SCORE 180+ IN JEE MAINS 2020': {
        hi: 'जेईई मेन्स 2020 में 180+ स्कोर करें',
    },
    'JEE 2020 DAILY REVISION PROBLEMS': {
        hi: 'जेईई 2020 डेली रिवीज़न प्रॉब्लम',
    },
    'CHECK SUBJECT WISE TOPIC VIDEOS': {
        hi: 'सब्जेक्ट के अनुसार टॉपिक वीडियो देखें',
    },
    'CHECK TOPIC VIDEOS': {
        hi: 'टॉपिक वीडियो देखें',
    },
    'DOWNLOAD UNLIMITED PDFS': {
        hi: 'अनलिमिटेड पीडीएफ डाउनलोड करें',
    },
    'VIEW MORE': {
        hi: 'और देखें',
    },
    'BOARD EXAM RESULTS': {
        hi: 'बोर्ड एग्जाम रिजल्ट',
    },
    'LATEST FROM DOUBTNUT': {
        hi: 'डाउटनट से लेटेस्ट',
    },
    'SEE ALL': {
        hi: 'सभी देखें',
    },
    'LISTEN DIRECTLY FROM TOPPERS': {
        hi: 'सीधे टॉपर से सुनें',
    },
    'MOTIVATIONAL VIDEOS': {
        hi: 'मोटिवेशनल वीडियो',
    },
    HISTORY: {
        hi: 'हिस्ट्री',
    },
    'WATCH LATER': {
        hi: 'बाद में देखें',
    },
    'LEARN WITH DEAR SIR': {
        hi: 'डिअर सर से सीखें',
    },
    'BY YEAR': {
        hi: 'वर्ष के अनुसार',
    },
    'BY CHAPTER': {
        hi: 'चैप्टर के अनुसार',
    },
    'SEARCH WATCH HISTORY': {
        hi: 'वॉच हिस्ट्री खोजें',
    },
    LIBRARY: {
        hi: 'लाइब्रेरी',
    },
    classSubjectMapping: {
        en_6: ['MATHS', 'SCIENCE'],
        en_7: ['MATHS', 'SCIENCE'],
        en_8: ['MATHS', 'SCIENCE'],
        en_9: ['MATHS', 'SCIENCE', 'ENGLISH', 'SOCIAL SCIENCE', 'ENGLISH GRAMMAR'],
        en_10: ['MATHS', 'SCIENCE', 'ENGLISH', 'SOCIAL SCIENCE', 'ENGLISH GRAMMAR'],
        en_11: ['PHYSICS', 'CHEMISTRY', 'MATHS', 'BIOLOGY', 'ENGLISH', 'ENGLISH GRAMMAR', 'COMPUTER SCIENCE'],
        en_12: ['PHYSICS', 'CHEMISTRY', 'MATHS', 'BIOLOGY', 'ENGLISH', 'ENGLISH GRAMMAR', 'COMPUTER SCIENCE'],
        hi_6: ['MATHS', 'SCIENCE'],
        hi_7: ['MATHS', 'SCIENCE'],
        hi_8: ['MATHS', 'SCIENCE'],
        hi_9: ['MATHS', 'SCIENCE', 'ENGLISH', 'SOCIAL SCIENCE', 'ENGLISH GRAMMAR'],
        hi_10: ['MATHS', 'SCIENCE', 'ENGLISH', 'SOCIAL SCIENCE', 'ENGLISH GRAMMAR'],
        hi_11: ['PHYSICS', 'CHEMISTRY', 'MATHS', 'BIOLOGY', 'ENGLISH', 'ENGLISH GRAMMAR'],
        hi_12: ['PHYSICS', 'CHEMISTRY', 'MATHS', 'BIOLOGY', 'ENGLISH', 'ENGLISH GRAMMAR'],
    },
    assortmentIdLocaleClassMapiing: {
        en_9: 159772,
        hi_9: 159773,
        en_10: 159774,
        hi_10: 159775,
        en_11: 165055,
        hi_11: 165056,
        en_12: 165057,
        hi_12: 165058,
    },
    mpvp_recommended_backgrounds: {
        one: 'engagement_framework/3C02B56B-A0EE-814D-5495-0644AD983922.webp',
        two: 'engagement_framework/D8937627-35F4-2357-5F3E-621C17D9C7E0.webp',
        three: 'engagement_framework/CE90CD7D-BED8-1253-F841-AA92F9EF31C2.webp',
    },
    mpvp_recommended_background_colors: {
        one: '#fda589',
        two: '#ffd089',
        three: '#9fbefc',
    },
    no_solution_pane: {
        title: {
            en: 'Kya Aapko Solution Nahi Mila?',
            hi: 'क्या आपको उत्तर नहीं मिला?',
            other: 'Did you not get the solution?',
        },
        subtitle: {
            en: 'Solution dusre students se discuss karne ke liye unse jude',
            hi: 'दूसरे छात्रों से उत्तर पे चर्चा करने के लिए, उनसे जुड़े',
            other: 'To discuss solution with other students, join them',
        },
        cta_text: {
            en: 'Connect Now',
            hi: 'अभी जुड़िये',
            other: 'Connect Now',
        },
        feedback: {
            title: {
                en: 'Solution nhi mila kya, hme apne book ya sample paper ya previous year paper ka nam btae',
                hi: 'समाधान नहीं मिला क्या, हम अपने बुक, पिछले साल के पेपर या सैंपल पेपर का नाम बताएं',
                other: 'Didn\'t get the solution? Share your book name, sample paper name or even previous year paper  exam name.',
            },
            cta: {
                en: 'Submit Feedback',
                hi: 'फीडबैक सबमिट करें',
                other: 'Submit Feedback',
            },
        },
    },
    explore_app: {
        en: 'App explore karein',
        hi: 'ऍप एक्स्प्लोर करें',
        other: 'Explore our app',
    },
    match_live_tab(locale) {
        return {
            title: global.t8[locale].t('Watch $$ Related to this Topic'),
            color_title: global.t8[locale].t('Free Classes'),
        };
    },
    check_free_classes: {
        title(locale) {
            return global.t8[locale].t('Check All Free Classes');
        },
        deeplink: 'doubtnutapp://library_tab?library_screen_selected_Tab=1&source=match_page_related_classes',
        deeplink_paid: 'doubtnutapp://library_tab?tag=free_classes',
    },
    check_all_courses: {
        title(locale) {
            return global.t8[locale].t('Check All Courses');
        },
        deeplink: 'doubtnutapp://library_tab?tag=check_all_courses',
        deeplink_paid: 'doubtnutapp://library_tab?tag=my_courses',
    },
    check_all_live_classes: {
        title(locale) {
            return global.t8[locale].t('Check All Live Classes');
        },
        deeplink: 'doubtnutapp://library_tab?tag=check_all_courses',
        deeplink_paid: 'doubtnutapp://library_tab?tag=my_courses',
    },
    mpvp_top_widget: {
        title(locale) {
            return global.t8[locale].t('Recommended Free Classes');
        },
        view_all: {
            cta_text(locale) {
                return global.t8[locale].t('View All');
            },
            deeplink: 'doubtnutapp://library_tab?library_screen_selected_Tab=1&source=mpvp_classes_carousel_viewall',
        },
    },
    live_now_bg_for_live_tab: {
        biology: 'engagement_framework/B128A51A-6093-986A-B955-3A30640BB730.webp',
        botany: 'engagement_framework/CC318456-A292-46AA-BE40-B7BC4069F9AD.webp',
        chemistry: 'engagement_framework/04299465-B3B8-4DCD-1D4C-5D984AD989CF.webp',
        child_development_and_pedagogy: 'engagement_framework/109446C1-F07D-140B-3C34-3881376BB450.webp',
        child_development_and_pedagogy1: 'engagement_framework/C9BF1EFB-7338-F259-C5A7-0B933A03BD22.webp',
        english_grammar: 'engagement_framework/83A0D753-F723-C29A-4C10-06409AA37C3F.webp',
        english: 'engagement_framework/1372A484-3EF4-F831-BCCA-6AC81EB13D17.webp',
        environmental_studies: 'engagement_framework/10215883-E327-F777-9125-69B8AD451551.webp',
        geography: 'engagement_framework/FA091DD6-2DD2-1E5F-FADE-78D9DC343FE6.webp',
        guidance: 'engagement_framework/5F264B82-DCCF-1EA0-F096-44DCF93D0EEE.webp',
        history: 'engagement_framework/1297ABB4-D163-A1D0-41B8-8E21376E38BD.webp',
        maths: 'engagement_framework/152C1DFF-0DC6-52BD-3809-19C36C5925DD.webp',
        physics: 'engagement_framework/5EF641EB-3545-EAD3-2F24-32AC07402186.webp',
        political_science: 'engagement_framework/2B2ABD6C-E9B9-01D7-FA0F-DF3C56BFD91A.webp',
        reasoning: 'engagement_framework/F0BEF98A-AB68-2F5A-EBBB-3AFD8779E22A.webp',
        science: 'engagement_framework/2B3018C6-3713-D917-8D34-932C9BD243BD.webp',
        social_science: 'engagement_framework/66DF8F45-FE69-71E1-0B79-B3D7A40ECF25.webp',
    },
    vip_live_tab_title(locale) {
        return global.t8[locale].t('Check Popular Courses on Doubtnut');
    },

    dnCloneBrainlyAppPackageName: 'com.brainly.ncert.solutions.class9_12',
    dnCloneBiologyNeetPackageName: 'com.doubtnut.neet.biology.ncert',
    dnCloneIITJEEPackageName: 'com.doubtnut.iit.jee.maths',
    userEngagementURL: `${config.pznUrl}`,
    ask_vvs: {
        insert_question: 'ASK_INSERT',
        update_question: 'ASK_UPDATE',
        insert_view: 'VIEW_INSERT',
        update_view: 'VIEW_UPDATE',
    },
    freeLiveClassTab: {
        cardColor: ['#ffe0b2', '#e34c4c', '#ffe0b2', '#99c8ff', '#ffc5b2', '#ccddff', '#4ca4e3'],
        you_were_watching_v2: {
            items_extra_data: {
                text_one_size: '16',
                text_one_color: '#031269',
                text_two_size: '20',
                text_two_color: '#1a29a9',
                text_three_size: '16',
                text_three_color: '#031269',
                icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/video_play_button.webp',
            },
            widget_extra_data: {
                text_one_size: '16',
                text_one_color: '#000000',
            },
            layout_config: {
                margin_top: 20,
                margin_right: 0,
                margin_left: 12,
            },
        },
        widget_autoplay: {
            widget_extra_data: {
                is_live: true,
                live_text: 'LIVE',
                auto_play: true,
                auto_play_initiation: 500,
                auto_play_duration: 15000,
                scroll_direction: 'horizontal',
                title_text_size: '16',
                title_text_color: '#000000',
                bg_color: '#feebe7',
                show_live_graphics: false,
            },
            layout_config: {
                margin_top: 16,
                margin_right: 0,
                bg_color: '#ffffff',
            },
            divider_config: {
                background_color: '#d8d8d8',
                height: 1,
                skip_margin: false,
            },
        },
        widget_chapter_by_classes: {
            layout_config: {
                margin_top: 20,
                margin_right: 0,
                margin_left: 0,
                margin_bottom: 12,
            },
            items_extra_data: {
                text_one_size: '24',
                text_one_color: '#1a29a9',
                text_two_size: '12',
                text_two_color: '#031269',
                text_three_size: '16',
                text_three_color: '#17181f',
                text_four_size: '12',
                text_four_color: '#787777',
                icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/video_play_button.webp',
            },
        },
        widget_classes_by_teacher: {
            cardBgColor: ['#FFC5B2', '#FFE0B2', '#CCDDFF', '#F3F4F6', '#DFE2FF', '#FDD8FF', '#FFFFC5'],
            layout_config: {
                margin_top: 20,
                margin_right: 0,
                margin_left: 12,
            },
        },
        widget_top_selling_subject: {
            divider_config: {
                background_color: '#d8d8d8',
                height: 1,
                skip_margin: false,
            },
        },
        widget_top_topics: {
            widget_extra_data: {
                text_one_size: '16',
                text_one_color: '#000000',
            },
            layout_config: {
                margin_top: 20,
                margin_right: 0,
                margin_left: 12,
            },
            divider_config: {
                background_color: '#d8d8d8',
                height: 1,
                skip_margin: true,
                margin_top: 12,
            },
        },
        subjetColorCode: {
            maths: '#D5EDFF',
            physics: '#DFCCFF',
            biology: '#DAFFF2',
            chemistry: '#FCCBBC',
            science: '#C7F7F3',
            english: '#FDCCFF',
            'social science': '#B0D2FF',
            'english grammar': '#FFD5C0',
            general: '#FFEDD2',
            default: '#E5E5E5',
        },
        subjetBgImage: {
            maths: `${config.staticCDN}engagement_framework/52F7EFED-8C96-6323-4FE5-EFD826A055B7.webp`,
            physics: `${config.staticCDN}engagement_framework/8ECF24CB-EDF6-2676-ADC1-7A4EEFA0C66D.webp`,
            biology: `${config.staticCDN}engagement_framework/C93D8678-33BF-D433-0EA6-507BF388A5FE.webp`,
            chemistry: `${config.staticCDN}engagement_framework/7252A2B4-6A58-4D0F-2C35-C9C8847E6DBC.webp`,
            science: `${config.staticCDN}engagement_framework/EF34D550-D283-4007-2876-463C03D98DFF.webp`,
            english: `${config.staticCDN}engagement_framework/215F37C9-FC92-521B-2025-6F56AF81218B.webp`,
            economics: `${config.staticCDN}engagement_framework/C772ECF1-30C4-02FE-43B9-10EE7558F6AF.webp`,
            default: `${config.staticCDN}engagement_framework/93EBAD2A-CE29-4E29-515E-DD80DC5D9410.webp`,
            political_science: `${config.staticCDN}engagement_framework/AB8A4C78-941F-9065-29F8-C8811648B9C0.webp`,
            reasoning: `${config.staticCDN}engagement_framework/A274D354-8233-9888-2DE5-75E6966269C7.webp`,
            history: `${config.staticCDN}engagement_framework/6F6A6281-13D4-5D35-7A8E-FE5EF0FC1999.webp`,
            geography: `${config.staticCDN}engagement_framework/628EA1FB-0FC9-DAE0-3585-D8B1F4ECAC52.webp`,
            'social science': `${config.staticCDN}engagement_framework/2F6A103B-7E13-7DA5-BF2E-8C49F7FB25C0.webp`,
            'english grammar': `${config.staticCDN}engagement_framework/F50D3DAA-895C-4C4B-D00D-90BF1F911307.webp`,
        },
        subject: {
            subject_order_6_10: ['maths', 'science', 'english', 'social science', 'english grammar'],
            subject_order_11_12: ['physics', 'chemistry', 'maths', 'biology', 'english', 'english grammar', 'general studies', 'reasoning', 'guidance', 'computer science', 'political science', 'geography', 'history', 'hindi', 'general science', 'current affairs', 'economics', 'child development and pedagogy', 'environmental studies', 'general awareness', 'sanskrit'],
            staticSubjectTabs: {
                maths: { key: 'maths', title: 'Maths', is_selected: false },
                physics: { key: 'physics', title: 'Physics', is_selected: false },
                chemistry: { key: 'chemistry', title: 'Chemistry', is_selected: false },
                biology: { key: 'biology', title: 'Biology', is_selected: false },
                computer: { key: 'computer', title: 'Computer', is_selected: false },
                english: { key: 'english', title: 'English', is_selected: false },
                'social science': { key: 'social science', title: 'Social Science', is_selected: false },
                'english grammar': { key: 'english grammar', title: 'English Grammar', is_selected: false },
                guidance: { key: 'guidance', title: 'Guidance', is_selected: false },
                'General Studies': { key: 'general studies', title: 'General Studies', is_selected: false },
                science: { key: 'science', title: 'Science', is_selected: false },
            },
        },
        localisedData: {
            maths: 'गणित',
            physics: 'भौतिक विज्ञान',
            chemistry: 'रसायन विज्ञान',
            biology: 'जीवविज्ञान',
            computer: 'कंप्यूटर',
            english: 'अंग्रेज़ी',
            'social science': 'सामाजिक विज्ञान',
            'english grammar': 'अंग्रेज़ी व्याकरण',
            guidance: 'गाइडेंस',
            'general studies': 'सामान्य अध्ययन',
            science: 'विज्ञान',
            live: 'लाइव',
            past: 'पास्ट',
            upcoming: 'अगला',
            'iit jee': 'आईआईटी जेईई',
            neet: 'नीट',
            'political science': 'राजनीति विज्ञान',
            polity: 'सामान्य राजनीति',
            reasoning: 'तर्कशक्ति',
            sanskrit: 'संस्कृत',
            'environmental studies': 'वातावरण का अध्ययन',
            economics: 'अर्थशास्त्र',
            geography: 'भूगोल',
            hindi: 'हिन्दी',
            history: 'इतिहास',
            'general awareness': 'सामान्य जागरूकता',
            cdp: 'सीडीपी',
            evs: 'ईवीएस',
            sst: 'सामाजिक विज्ञान',
            ssc: 'एसएससी',
            banking: 'बैंकिंग',
            teaching: 'टीचिंग',
            railway: 'रेलवे',
            defence: 'डिफेंस',
            recommended: 'सुझाव',
        },
    },
    match_page_live_tab_text(locale) {
        return {
            old: global.t8[locale].t('Online Classes'),
            new_1: global.t8[locale].t('Similar Classes'),
            new_2: global.t8[locale].t('Free Classes'),
            new_3: global.t8[locale].t('Live Classes'),
        };
    },
    search_service_tyd_flag_id: 208,
    tyd_version_redis_key: 'TYD_SUGGESTION_ITERATION_VERSION',
    tyd_suggestions_logs: {
        collection_name: 'tyd_suggestions_logs',
        results_per_page: 10,
        projection: {
            _id: 0,
            updatedAt: 0,
            __v: 0,
        },
        stdid_for_not_logging: 91769650,
    },
    live_class_title: {
        en: 'Live Classes',
        hi: 'लाइव कक्षाए',
    },
    topic_video_title: {
        en: 'Topic Videos',
        hi: 'टॉपिक वीडियोज़',
    },
    formula_sheet_title: {
        en: 'Formula Sheet',
        hi: 'फ़ॉर्म्युला शीट',
    },
    books_title: {
        en: 'Books',
        hi: 'पुस्तकें',
    },
    ncert_videos_title: {
        en: 'NCERT Videos',
        hi: 'एनसीईआरटी वीडियो',
    },
    qaWidgetTitle(locale) {
        return global.t8[locale].t('Explore More on Doubtnut related to your question');
    },

    liveClass: {
        title(locale) {
            return global.t8[locale].t('Online Classes');
        },
        img_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/F3513961-19A5-A4E3-1524-E2D042378C0B.webp',
    },
    topicVideo: {
        title(locale) {
            return global.t8[locale].t('Topic Videos');
        },
        img_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/4F901BD4-1CA9-9198-8791-E74EA61237B7.webp',
    },
    formulaSheet: {
        title(locale) {
            return global.t8[locale].t('Formula Sheet');
        },
        img_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BB8D60EF-16E3-2284-2D18-F07DDEA3EA76.webp',
    },
    books: {
        title(locale) {
            return global.t8[locale].t('Books');
        },
        img_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/8324F5DF-3BC9-4D4C-4C4C-676C47FEF74F.webp',
    },
    ncertVideos: {
        title(locale) {
            return global.t8[locale].t('NCERT Videos');
        },
        img_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/03CE0DE7-4748-27E3-D18A-960F746270EF.webp',
    },
    dn_referral_ceo_tg: 1710,
    ncertPages: ['NCERT', 'BOOK_LIST', 'LIBRARY_BOOK_LIST', 'QA_WIDGET_NCERT'],
    unmatched_student_id_package_mapping: {
        '-331': 'en',
        '-332': 'en',
        '-333': 'hi',
    },
    askWidget: {
        FreeLive: {
            title: {
                en: 'Aapke puche gaye sawaal se judi FREE Classes',
                hi: 'आपके पूछे गए सवाल से जुडी फ्री क्लासेस',
            },
            sub_title: {
                en: 'k+ students are watching',
                hi: 'k+ छात्र देख रहे हैं',
            },
        },
        PdfList: {
            title: {
                en: 'Apke sawal se judi PDFs',
                hi: 'आपके सवाल से जुडी PDFs',
            },
            title_2: {
                en: 'Apke sawal se jude notes & homework',
                hi: 'Apke sawal se jude notes & homework',
            },
            sub_title: {
                en: 'Sirf agle 5 min k liye free. Jaldi Download Karein!',
                hi: 'Sirf agle 5 min k liye free. Jaldi Download Karein!',
            },
            sub_title_2: {
                en: 'Sirf agle 5 min k liye free!',
                hi: 'Sirf agle 5 min k liye free!',
            },
        },
        SubjectCard: {
            title: {
                en: 'xxxchapterxxx ke saath saath xxxsubjectxxx ke sabhi chapters ki taiyaari karein!',
                hi: 'xxxchapterxxx के साथ-साथ xxxsubjectxxx के सभी पाठों की तैयारी करें!',
            },
            title_2: {
                en: 'Padhne me ho rahi hai pareshani ?',
                hi: 'पढ़ने में हो रही परेशानी?',
            },
            title_3: {
                en: 'Doubtnut par aap sirf question pooch rahe hai ?',
                hi: 'Doubtnut पर आप सिर्फ सवाल पूछ रहे हैं?',
            },
            sub_title: {
                en: 'Aapki class k bachche is tuition se padh rahe hain!',
                hi: 'आपकी कक्षा के बच्चे इस ट्यूशन से पढ़ रहे हैं',
            },
            bottom_title: {
                en: '+ students are taking this tuition',
                hi: '+ छात्र यह ट्यूशन ले रहे हैं',
            },
        },
        SubjectCardList: {
            title: {
                en: 'Subject Tuitions',
                hi: 'सब्जेक्ट ट्यूशन',
            },
            sub_title: {
                en: 'Prepare for your exam!',
                hi: 'Prepare for your exam!',
            },
        },
        CcmList: {
            title: {
                en: 'Our Toppers\' Favourite Courses!',
                hi: 'टॉपर्स के पसंदीदा कोर्स!',
            },
            title_2: {
                en: 'Courses for you!',
                hi: 'आपके लिए चुने गए कोर्स',
            },
            sub_title: {
                en: 'Taught by excellent teachers',
                hi: 'बेहतरीन टीचर द्वारा पढ़ाया जाता है ',
            },
            sub_title_2: {
                en: 'Hurry Up! More than 60,000 students are enrolled',
                hi: 'जल्दी करें! 60,000 से अधिक छात्र नामांकित हैं',
            },
        },
        TrendingFreeLive: {
            title: {
                en: 'Trending free classes for you!',
                hi: 'आपके लिये ट्रेंडिंग फ्री क्लासेस',
            },
            title_2: {
                en: 'Ab jamkar karein exams ki preparation',
                hi: 'अब जमकर करें परीक्षा की तैयारी',
            },
            sub_title: {
                en: 'Watch unlimited lectures at your own pace',
                hi: 'अपनी गति से अनगिनत क्लासेस देखिए',
            },
            sub_title_2: {
                en: 'Latest free classes from top teachers',
                hi: 'टॉप टीचर्स की नई फ्री क्लासेस',
            },
        },
        images: {
            brainBook: 'engagement_framework/681111E0-4CCC-C2D9-FF51-AF9E335F6BE9.webp',
            winningCup: 'engagement_framework/B5C81990-A4F8-CDDF-A37F-7A485C32B373.webp',
            pdf: 'engagement_framework/000CD8B7-B5A2-8F5B-3D38-6C96D15512E0.webp',
            thinkingFace: 'engagement_framework/9F9E9934-F420-9DDB-1029-7221CE66A8AF.webp',
            playFilm: 'engagement_framework/164BFF93-F788-A6DE-9F45-E1BE1EFB2FEE.webp',
            teacher: 'engagement_framework/37E4DDD4-7A6A-F1B5-1ACC-62E0E8E137D3.webp',
            books: 'engagement_framework/D650DFB2-267D-A236-2BCB-0C6C8714AE07.webp',
            booksRack: 'engagement_framework/7866FDA6-46C4-9D30-5291-544898B498F7.webp',
            studentsImages: 'engagement_framework/DD95E370-3692-E233-E5A1-B70AC16796E9.webp',
            exam: 'engagement_framework/6D95A99D-9DAC-2809-226A-37B0C3E12261.webp',
            student: 'engagement_framework/797DE783-CA68-17BB-F222-0029FBC013B1.webp',
        },
        subjectCardBg: {
            biology: 'engagement_framework/6E6B2600-E337-93A0-569C-6ECEFDA6A11B.webp',
            botany: 'engagement_framework/5094C8E7-9818-3284-591A-771498145B66.webp',
            chemistry: 'engagement_framework/345B4CA2-F57D-FB45-532A-87B538AE565E.webp',
            english_grammar: 'engagement_framework/7516311B-3722-7EA1-41F2-19AA52D47F15.webp',
            english: 'engagement_framework/5B2613F5-5A36-3F6D-3401-F2090F1DEB1E.webp',
            environmental_studies: 'engagement_framework/523C5869-5B05-FAD9-FC80-4A86405AEDEB.webp',
            general_knowledge: 'engagement_framework/B4136483-6129-05CA-2388-4AB1084958DA.webp',
            geography: 'engagement_framework/A397E2C2-1548-8861-26C3-3E0245AE09E9.webp',
            history: 'engagement_framework/4D1D1B3A-F342-6E7E-8A6E-B92ED34025E0.webp',
            maths: 'engagement_framework/E2B0D110-90E1-A81B-65E0-C4353B73588E.webp',
            pedagogy: 'engagement_framework/EFC22083-1002-818A-0252-52C169F368B0.webp',
            physics: 'engagement_framework/D9006E6D-E928-07CA-F143-8B964C6CB4CF.webp',
            polity: 'engagement_framework/162ADFC8-9536-926A-0CA2-2CC899C43E63.webp',
            reasoning: 'engagement_framework/57EA263A-5697-C3E4-8713-A3A6DF96B50C.webp',
            science: 'engagement_framework/E2594674-C254-2B3A-3335-665B94F71F91.webp',
            social_science: 'engagement_framework/1F42A73D-8F2F-AA55-D21D-C25B04C8C61E.webp',
        },
        viewDetailsTitle: {
            en: 'View details',
            hi: 'और जानिए',
        },
        classWiseSubjectCardOrdering: {
            6: {
                en: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
                hi: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
            },
            7: {
                en: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
                hi: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
            },
            8: {
                en: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
                hi: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
            },
            9: {
                en: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
                hi: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
            },
            10: {
                en: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
                hi: ['ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
            },
            11: {
                en: ['BIOLOGY', 'CHEMISTRY', 'COMPUTER', 'ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'PHYSICS'],
                hi: ['BIOLOGY', 'CHEMISTRY', 'ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'PHYSICS'],
            },
            12: {
                en: ['BIOLOGY', 'CHEMISTRY', 'COMPUTER', 'ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'PHYSICS'],
                hi: ['BIOLOGY', 'CHEMISTRY', 'ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'PHYSICS'],
            },
            13: {
                en: ['BIOLOGY', 'CHEMISTRY', 'COMPUTER', 'ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'PHYSICS'],
                hi: ['BIOLOGY', 'CHEMISTRY', 'ENGLISH', 'ENGLISH GRAMMAR', 'MATHS', 'PHYSICS'],
            },
            14: {
                11401: ['ECONOMICS', 'ENGLISH', 'GEOGRAPHY', 'HISTORY', 'MATHS', 'POLITY', 'REASONING', 'SCIENCE'],
                11518: ['ECONOMICS', 'ENGLISH', 'GEOGRAPHY', 'HISTORY', 'MATHS', 'POLITY', 'REASONING', 'SCIENCE'],
                11402: ['ENGLISH', 'GENERAL AWARENESS', 'MATHS', 'REASONING'],
                11403: ['CDP', 'ENGLISH', 'EVS', 'HINDI', 'MATHS', 'SANSKRIT', 'SST'],
                11404: ['GENERAL SCIENCE', 'GENERAL Studies', 'MATHS', 'REASONING'],
                11405: ['ENGLISH', 'GENERAL SCIENCE', 'MATHS', 'PHYSICS'],
                11517: ['ENGLISH', 'GENERAL SCIENCE', 'MATHS', 'PHYSICS'],
                default: ['ENGLISH', 'GENERAL SCIENCE', 'MATHS', 'PHYSICS'],
            },
        },
        subjectWiseBgForFreeLiveLecture: {
            maths: '#4ca4e3',
            biology: '#2dca91',
            physics: '#854ce3',
            chemistry: '#f3754d',
            science: '#066666',
            english: '#ee83f2',
            social_science: '#1c57a5',
            english_grammar: '#f68b57',
            reasoning: '#720f76',
            guidance: '#cf7d4a',
            botany: '#169f79',
            environmental_studies: '#0098db',
            child_development_and_pedagogy: '#9e5c00',
            child_development_and_pedagogy1: '#d873dc',
            geography: '#4796d3',
            political_science: '#f25858',
            history: '#583d13',
            general_science: '#583D13',
            computer: '#FFD747',
            general_awareness: '#8B0090',
            economics: '#CF7D4A',
            sst: '#1C57A5',
            polity: '#C71F1F',
            default: '#FF8158',
        },
        subjectWiseBgForFreeLive: {
            maths: '#D5EDFF',
            biology: '#DAFFF2',
            physics: '#DFCCFF',
            chemistry: '#FCCBBC',
            science: '#C7F7F3',
            english: '#FDCCFF',
            social_science: '#B0D2FF',
            english_grammar: '#FFD5C0',
            reasoning: '#FCB4FF',
            guidance: '#FFDEC9',
            botany: '#169F79',
            environmental_studies: '#D5EDFF',
            child_development_and_pedagogy: '#FFDEC9',
            child_development_and_pedagogy1: '#FDD6FF',
            geography: '#98D2FF',
            political_science: '#FF9898',
            history: '#9E8968',
            general_science: '#9E8968',
            computer: '#FFF1BD',
            general_awareness: '#FCAAFF',
            economics: '#FFB88C',
            sst: '#B0D2FF',
            polity: '#FFC9B8',
            default: '#FFC9B8',
        },
        subjectWiseBgForCardList: {
            maths: '#4ca4e3',
            biology: '#2dca91',
            physics: '#854ce3',
            chemistry: '#f3754d',
            science: '#066666',
            english: '#ee83f2',
            social_science: '#1c57a5',
            english_grammar: '#f68b57',
            reasoning: '#720f76',
            guidance: '#cf7d4a',
            botany: '#169f79',
            environmental_studies: '#0098db',
            child_development_and_pedagogy: '#9e5c00',
            child_development_and_pedagogy1: '#d873dc',
            geography: '#4796d3',
            political_science: '#f25858',
            history: '#583d13',
            general_science: '#583d13',
            computer: '#ffd747',
            general_awareness: '#8b0090',
            economics: '#cf7d4a',
            sst: '#1c57a5',
            polity: '#c71f1f',
            default: '#ff8158',
        },
        subjectWiseBgForSubjectList: {
            maths: '#d5edff',
            biology: '#dafff2',
            physics: '#dfccff',
            chemistry: '#fccbbc',
            science: '#c7f7f3',
            english: '#fdccff',
            social_science: '#b0d2ff',
            english_grammar: '#ffd5c0',
            reasoning: '#f9bbfc',
            guidance: '#fdbb92',
            botany: '#b9ffec',
            environmental_studies: '#9cdffc',
            child_development_and_pedagogy: '#ffe3bc',
            child_development_and_pedagogy1: '#fcb4ff',
            geography: '#c0e4ff',
            political_science: '#fccccc',
            history: '#ebd4b1',
            general_science: '#FFEDD2',
            computer: '#FFEFB7',
            general_awareness: '#FCAAFF',
            economics: '#FFB88C',
            sst: '#B0D2FF',
            polity: '#FF9898',
            default: '#FFC5B2',
        },
    },
    testimonialArray: [{
        image: `${config.staticCDN}engagement_framework/BA8583A5-9694-9A0D-58DF-3814E768025F.webp`,
        name: 'Jatin Jindal, AIR 52',
        text: 'Mittal Sir has a very important role in clearing my JEE advanced. He taught us all concepts of chemistry in  such a way that I was able to solve all questions of chemistry in all tests with ease & get a seat in my dream IIT. He is also an excellent motivator which helped me push myself beyond my limits.',
    },
    {
        image: `${config.staticCDN}engagement_framework/F62F1027-843D-1C2C-B2BC-F97673145B69.webp`,
        name: 'Yash Gupta, AIR 76',
        text: "Swati Ma’am helped me a lot during my NEET Preparation and with her guidance and her hard work it's been easier for me to achieve my goal.",
    },
    {
        image: `${config.staticCDN}engagement_framework/3CDF1333-6E75-B235-693B-8AA213B67A05.webp`,
        name: 'Pranay Gupta, AIR 82',
        text: "Swati Ma’am taught  me from 'BASIC TO ADVANCE' sir will explain what is important for JEE point of view..your theory will be 100% ready.",
    },
    {
        image: `${config.staticCDN}engagement_framework/9707C9BE-43D6-FCBD-8AAC-B44021EF8B07.webp`,
        name: 'Jayesh Agarwal, AIR 117',
        text: 'Ashok Mittal sir not only clear academic Doubts but also motivates me. They set a target of 720 for me and under his guidance and strategies I scored 696 in NEET 2020.',
    },
    {
        image: `${config.staticCDN}engagement_framework/BA434C48-8804-262B-A2F9-D28924362996.webp`,
        name: 'Bhuvnesh Sharma, AIR 19',
        text: 'I thank Ashok Mittal and Anand sir for guiding me to achieve AIR 19 in GEN Category which was a dream for me and my Family.',
    },
    {
        image: `${config.staticCDN}engagement_framework/F0D3C418-1226-6931-E00D-AED2C67D45E4.webp`,
        name: 'Shivika Dudani, AIR 180',
        text: 'Thank you so much Swati Ma’am for your constant Support.',
    }],
    fixedNKCImage: `${config.staticCDN}engagement_framework/BFEBCCC8-B025-7722-572D-C2C7E69A45BC.webp`,
    trailCouponCard: {
        trailCouponCardTagsColorImage: [
            { text_color: '#BBFFE6', image_url: `${config.staticCDN}engagement_framework/A2FA50F9-A669-EDDD-1275-EB123CF1CCA3.webp` },
            { text_color: '#F5C2B2', image_url: `${config.staticCDN}engagement_framework/2305C9B5-EAC3-D7A7-5886-0F8D90012241.webp` },
            { text_color: '#EBCDEC', image_url: `${config.staticCDN}engagement_framework/FF496FE7-891A-A1D6-92B7-C661F852C5AB.webp` },
            { text_color: '#9AE0FF', image_url: `${config.staticCDN}engagement_framework/EB18BEF5-EE17-AAA2-2217-1FBAE3CB5C9E.webp` },
            { text_color: '#F8D3FA', image_url: `${config.staticCDN}engagement_framework/CF5B5FA9-E693-15D2-12D5-3A073D4A7E77.webp` },
        ],
        prePurchasePopUp: {
            title: 'Kya aap is course ko 3 din ke liye muft me padhna chahte hain?',
            title_size: 15,
            title_color: '#504949',
            cta1: {
                title: 'NO',
                title_size: 16,
                title_color: '#ea532c',
            },
            cta2: {
                title: 'YES',
                title_size: 16,
                title_color: '#ea532c',
            },
        },
        postPurchasePopUp: {
            cta: {
                title: '#ffffff',
                title_color: '#ffffff',
                title_size: 16,
                background_color: '#ea532c',
                corner_radius: 0,
            },
        },

    },
    referral_v2: {
        video_widget_bg_color_array: ['#c19bff', '#f68b7d', '#f7e1ac', '#97d295', '#80bef7'],
        video_widget_image_url: `${config.staticCDN}referral_v2/e7d48e47-4fdb-4a8b-b1cc-33be628e03bd-3x.png`,
        goodie_widget_image_url: `${config.staticCDN}referral_v2/frame_188.png`,
        level_widget_phone_url: `${config.staticCDN}referral_v2/frame_189.png`,
        level_widget_lock_url: `${config.staticCDN}referral_v2/flat_color_icons_lock.png`,
        share_button_icon: `${config.staticCDN}engagement_framework/2977811D-9492-C710-0D13-AC564DDA0833.webp`,
        earn_more_widget_image_url: `${config.staticCDN}referral_v2/image_71.png`,
        level_widget_reward_image_url: `${config.staticCDN}referral_v2/reward_1.png`,
        course_calling_widget_image_url: `${config.staticCDN}referral_v2/call_center_agent_2.png`,
        referral_winner_congratulation_widget_bg_image_url: `${config.staticCDN}referral_v2/image_72.png`,
        course_calling_widget_bg_image_url: `${config.staticCDN}homepage-profile-icons/profile-section-bg.webp`,
        paytm: `${config.staticCDN}referral_v2/paytm.png`,
        goodie_form_animation_video: `${config.staticCDN}referral_v2/refer_video.zip`,
        share_contact: {
            keys: {
                key: 'e#UVj$7cx-d@Y8m*v^qpxwdUr_T9TYYY',
                iv: 'C#bzzMKrXbx2y#2v',
            },
            batch_size: 2000,
        },
        default_json: {
            referral_video_widget: {
                widget_data: {
                    full_width_cards: true,
                    items: [
                        {
                            type: 'referral_video_widget',
                            data: {
                                title1: '',
                                title2: '',
                                title3: '',
                                bg_color: '',
                                image_url: '',
                                title4: {
                                    bg_color: '#000000',
                                    title: '',
                                    image_url: '',
                                },
                                bg_image_url: '', // for override
                                qid: '',
                                page: 'REFERRAL_V2',
                                video_resource: {
                                    resource: '',
                                    video_resource: '',
                                    media_type: 'BLOB',
                                },
                                default_mute: false,
                                auto_play: true,
                                auto_pause: false,
                            },
                            layout_config: {
                                margin_top: 0,
                                margin_bottom: 0,
                                margin_left: 0,
                                margin_right: 0,
                            },
                        },
                    ],
                    default_mute: false,
                    auto_play: true,
                    auto_pause: false,
                },
                widget_type: 'widget_autoplay',
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_left: 0,
                    margin_right: 0,
                },
            },
            referral_testimonial_widget_item: {
                type: 'widget_library_card',
                data: {
                    id: 649241092,
                    page: 'REFERRAL_V2',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/649241092.png',
                    card_width: '1.2',
                    card_ratio: '16:9',
                    deeplink: 'doubtnutapp://video?qid=649241092&page=REFERRAL_V2',
                    ocr_text: '',
                    background_color: '#FFEDD2',
                },
            },
            referral_steps_widget: {
                en: {
                    widget_type: 'referral_steps',
                    data: {
                        heading: '<font color=\'#000000\'>Win Phone</font> in just 3 simple steps!',
                        heading_color: '#504949',
                        steps: [
                            {
                                s_no: 1,
                                title: 'Apne doston ko course khareedne ke liye <font color=\'#ee2db8\'>referral code share</font>  share karo.',
                                highlight_color: '#ee2db8',
                            },
                            {
                                s_no: 2,
                                title: 'Referral Code ko use karke <font color=\'#3941fc\'>dost ko 30% discount</font> milega, aur aapko Rs. 1000 cashback!',
                                highlight_color: '#3941fc',
                            },
                            {
                                s_no: 3,
                                title: '2+ admission karane pe aap jeet sakte hai <font color=\'#0aac07\'>Boat Airdopes, Bluetooth Speaker aur Redmi 9 Mobile Phone!</font>.',
                                highlight_color: '#0aac07',
                            },
                        ],
                    },
                    layout_config: {
                        margin_top: 16,
                        margin_bottom: 0,
                        margin_left: 16,
                        margin_right: 16,
                    },
                },
                hi: {
                    widget_type: 'referral_steps',
                    data: {
                        heading: '3 आसान कदम और <font color=\'#000000\'>आप जीतोगे फ़ोन !</font>',
                        heading_color: '#504949',
                        steps: [
                            {
                                s_no: 1,
                                title: 'अपने दोस्तों को अपना <font color=\'#ee2db8\'>रेफरल कूपन कोड भेजो </font> और कोर्स में उनका एडमिशन कराओ',
                                highlight_color: '#ee2db8',
                            },
                            {
                                s_no: 2,
                                title: 'रेफरल कूपन कोड से आपके <font color=\'#3941fc\'>दोस्त को मिलेगी 30% की बचत </font> और आपको मिलेगा Rs.1000 का Paytm इनाम',
                                highlight_color: '#3941fc',
                            },
                            {
                                s_no: 3,
                                title: '2+ एडमिशन करवाने पे आप जीत सकते है <font color=\'#0aac07\'>Boat Airdopes, Bluetooth Speaker aur Redmi 9 Mobile Phone!</font>.',
                                highlight_color: '#0aac07',
                            },
                        ],
                    },
                    layout_config: {
                        margin_top: 16,
                        margin_bottom: 0,
                        margin_left: 16,
                        margin_right: 16,
                    },
                },
            },
            referral_calling_widget: {
                en: {
                    type: 'course_calling_widget',
                    data: {
                        title: '<b>Hum jitayenge phone!</b><br>Aap bas humein call karo',
                        title_color: '#2f2f2f',
                        title_size: 14,
                        icon_url: `${config.staticCDN}referral_v2/call_center_agent_2.png`,
                        bg_image_url: `${config.staticCDN}homepage-profile-icons/profile-section-bg.webp`,
                        mobile: '01247158250',
                    },
                    layout_config: {
                        margin_top: 14,
                        margin_bottom: 0,
                        margin_left: 4,
                        margin_right: 4,
                    },
                },
                hi: {
                    type: 'course_calling_widget',
                    data: {
                        title: '<b>हम जिताएंगे फ़ोन</b><br>आप बस हमे कॉल करो ',
                        title_color: '#2f2f2f',
                        title_size: 14,
                        icon_url: `${config.staticCDN}referral_v2/call_center_agent_2.png`,
                        bg_image_url: `${config.staticCDN}homepage-profile-icons/profile-section-bg.webp`,
                        mobile: '01247158250',
                    },
                    layout_config: {
                        margin_top: 14,
                        margin_bottom: 0,
                        margin_left: 4,
                        margin_right: 4,
                    },
                },
            },
            referral_goodie_widget: {
                en: {
                    type: 'referral_goodie_widget',
                    data: {
                        title: `Pao <big><b>₹1000</b></big>  <img src='${config.staticCDN}referral_v2/paytm.png'> <big><b>cashback</b></big> every time your friend purchases a course`,
                        image_url: `${config.staticCDN}engagement_framework/61D890F0-34D4-60F0-A3A8-59FF9EED9C1E.webp`,
                        image_width: 128,
                    },
                    layout_config: {
                        margin_top: 14,
                        margin_bottom: 16,
                        margin_left: 16,
                        margin_right: 8,
                    },
                },
                hi: {
                    type: 'referral_goodie_widget',
                    data: {
                        title: `हर दोस्त के एडमिशन पे पाओ <big><b>₹1000</b></big>  का <img src='${config.staticCDN}referral_v2/paytm.png'> <big><b>इनाम</b></big>`,
                        image_url: `${config.staticCDN}engagement_framework/61D890F0-34D4-60F0-A3A8-59FF9EED9C1E.webp`,
                        image_width: 128,
                    },
                    layout_config: {
                        margin_top: 14,
                        margin_bottom: 16,
                        margin_left: 16,
                        margin_right: 8,
                    },
                },
            },
            referral_level_widget: {
                type: 'referral_level_widget',
                data: {
                    title: '',
                    levels: [],
                },
                layout_config: {
                    margin_top: 16,
                    margin_bottom: 0,
                    margin_left: 16,
                    margin_right: 16,
                },
            },
            referral_testimonial_widget: {
                en: {
                    type: 'widget_parent',
                    widget_data: {
                        scroll_direction: 'horizontal',
                        title: 'Winner CEO ki Stories: 1 crore se zyada ka Paytm Cashback jeet chuke hai',
                        is_title_bold: true,
                        title_text_size: 16,
                        subtitle: 'Roz dekho new winners ki stories.',
                        subtitle_text_size: 12,
                        subtitle_text_color: '#808080',
                        items: [],
                    },
                    layout_config: {
                        margin_top: 22,
                        margin_bottom: 0,
                        margin_left: 0,
                        margin_right: 0,
                    },
                    divider_config: {
                        background_color: '#e2e2e2',
                        height: 1,
                        margin_left: 16,
                        margin_right: 16,
                    },
                },
                hi: {
                    type: 'widget_parent',
                    widget_data: {
                        scroll_direction: 'horizontal',
                        title: 'Winner CEO की कहानिया : 1 करोड़ से ज़्यादा का PayTm इनाम जीत चुके है !',
                        is_title_bold: true,
                        title_text_size: 16,
                        subtitle: 'रोज़ देखो नए खिलाडी की कहानी ',
                        subtitle_text_size: 12,
                        subtitle_text_color: '#808080',
                        items: [],
                    },
                    layout_config: {
                        margin_top: 22,
                        margin_bottom: 0,
                        margin_left: 0,
                        margin_right: 0,
                    },
                    divider_config: {
                        background_color: '#e2e2e2',
                        height: 1,
                        margin_left: 16,
                        margin_right: 16,
                    },
                },
            },
            referral_faq_widget: {
                type: 'course_faqs',
                data: {
                    title: 'FAQ',
                    toggle: true,
                    items: [],
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_left: 0,
                    margin_right: 0,
                },
            },
            referral_earn_more_widget: {
                en: {
                    type: 'referral_winner_earn_more_widget',
                    data: {
                        title1: 'Want to earn more?',
                        title2: 'Jeeto  <b>₹500</b> har baar jab bhi aapke referred dost kisi aur dost ko refer karte hai ',
                        image_url: `${config.staticCDN}referral_v2/image_71.png`,
                        deeplink: '',
                    },
                    layout_config: {
                        margin_top: 24,
                        margin_bottom: 0,
                        margin_left: 16,
                        margin_right: 16,
                    },
                },
                hi: {
                    type: 'referral_winner_earn_more_widget',
                    data: {
                        title1: 'और भी कमाना चाहते है? ',
                        title2: 'जीतो  <b>₹500</b> हर बार जब भी आपके दोस्त किसी और दोस्त का एडमिशन करवाते है  ',
                        image_url: `${config.staticCDN}referral_v2/image_71.png`,
                        deeplink: '',
                    },
                    layout_config: {
                        margin_top: 24,
                        margin_bottom: 0,
                        margin_left: 16,
                        margin_right: 16,
                    },
                },
            },
            referral_winner_congratulation_widget: {
                en: {
                    type: 'referral_winner_congratulation_widget',
                    data: {
                        start_color: '#f4ffdf',
                        end_color: '#90d178',
                        title1: 'Congratulations!!',
                        title2: 'Aapne Redmi 9 Phone jeeta hai',
                        image_url: `${config.staticCDN}referral_v2/frame_189.png`,
                        foreground_image_url: `${config.staticCDN}referral_v2/image_72.png`,
                    },
                    layout_config: {
                        margin_top: 0,
                        margin_bottom: 0,
                        margin_left: 0,
                        margin_right: 0,
                    },
                },
                hi: {
                    type: 'referral_winner_congratulation_widget',
                    data: {
                        start_color: '#f4ffdf',
                        end_color: '#90d178',
                        title1: 'बधाई हो !',
                        title2: 'आपने Redmi 9 Phone जीता है !',
                        image_url: `${config.staticCDN}referral_v2/frame_189.png`,
                        foreground_image_url: `${config.staticCDN}referral_v2/image_72.png`,
                    },
                    layout_config: {
                        margin_top: 0,
                        margin_bottom: 0,
                        margin_left: 0,
                        margin_right: 0,
                    },
                },
            },
            referral_winner_earn_more_widget: {
                en: {
                    type: 'referral_winner_earn_more_widget_v2',
                    data: {
                        title1: 'Want to keep earning more?',
                        title2: 'Aur bhi doston ka admission karao, aur aapko milte rahega cashback!',
                        title3: [
                            '<b>₹1000</b> milte rahega har referral pe.', 'Pao <b>₹500</b> har baar jab bhi aapke referred dost kisi aur dost ko refer karte hai.(Keval 5 admission tak)',
                        ],
                        image_url: `${config.staticCDN}referral_v2/image_71.png`,
                    },
                    layout_config: {
                        margin_top: 16,
                        margin_bottom: 30,
                        margin_left: 16,
                        margin_right: 0,
                    },
                },
                hi: {
                    type: 'referral_winner_earn_more_widget_v2',
                    data: {
                        title1: 'और भी कमाना चाहते है? ',
                        title2: 'और भी दोस्तों का एडमिशन कराओ और आपको मिलते रहेगा इनाम ',
                        title3: [
                            '<b>Rs. 1000</b> मिलते रहेगा हर एडमिशन करने पे', 'जीतो <b>₹500</b> हर बार जब भी आपके दोस्त किसी और दोस्त का एडमिशन करवाते है(केवल 5 एडमिशन तक) ',
                        ],
                        image_url: `${config.staticCDN}referral_v2/image_71.png`,
                    },
                    layout_config: {
                        margin_top: 16,
                        margin_bottom: 30,
                        margin_left: 16,
                        margin_right: 0,
                    },
                },
            },
            referral_text_widget: {
                en: {
                    type: 'text_widget',
                    data: {
                        html_title: 'If you are facing any issues, please email us at ceosupport@doubtnut.com',
                        alignment: 'center',
                        force_hide_right_icon: true,
                        deeplink: 'doubtnutapp://email?email=ceosupport@doubtnut.com&subject=&message=',
                    },
                    layout_config: {
                        margin_top: 16,
                        margin_bottom: 0,
                        margin_left: 16,
                        margin_right: 16,
                    },
                },
                hi: {
                    type: 'text_widget',
                    data: {
                        html_title: 'अगर आपको कोई दिक्कत आ रही है, हमे ceosupport@doubtnut.com पे ईमेल करें',
                        alignment: 'center',
                        force_hide_right_icon: true,
                        deeplink: 'doubtnutapp://email?email=ceosupport@doubtnut.com&subject=&message=',
                    },
                    layout_config: {
                        margin_top: 16,
                        margin_bottom: 0,
                        margin_left: 16,
                        margin_right: 16,
                    },
                },
            },
            referral_claim_widget: {
                en: {
                    widget_data: {
                        title: '',
                        title_color: '#ff0000',
                        background_color: '#fff2f2',
                        border_color: '#ffffff',
                        subtitle: '',
                        subtitle_color: '#504949',
                        button_text: 'Claim Your Goodies',
                        button_text_color: '#ffffff',
                        button_color: '#eb532c',
                        deeplink: 'doubtnutapp://submit_address_dialog?type=referral_v2_goodie&id={id}',
                    },
                    widget_type: 'validity_widget',
                    layout_config: {
                        margin_top: 0,
                        bg_color: '#ffffff',
                    },
                },
                hi: {
                    widget_data: {
                        title: '',
                        title_color: '#ff0000',
                        background_color: '#fff2f2',
                        border_color: '#ffffff',
                        subtitle: '',
                        subtitle_color: '#504949',
                        button_text: 'अपना पता हमें दो',
                        button_text_color: '#ffffff',
                        button_color: '#eb532c',
                        deeplink: 'doubtnutapp://submit_address_dialog?type=referral_v2_goodie&id={id}',
                    },
                    widget_type: 'validity_widget',
                    layout_config: {
                        margin_top: 0,
                        bg_color: '#ffffff',
                    },
                },
            },
        },
    },
    popular_subject_widget: {
        'state boards': 'स्टेट बोर्ड्स',
        'state boards 1': 'स्टेट बोर्ड्स 1',
        'state boards free': 'स्टेट बोर्ड्स फ्री',
        defence: 'डिफेन्स',
        'govt exams': 'सरकारी परीक्षा',
    },
    altAppsPackageNames: ['com.doubtnut.iit.jee.maths', 'com.doubtnut.neet.biology.ncert'],
    askV10SmChemistryDiagramConfig: {
        variantAttachment: {
            activeStringDiffSubjects: [
                'MATHS',
            ],
            apiUrl: '/api/vexp/search',
            bumpLanguage: true,
            bumpThreshold: 90,
            chemistryDiagramsSmilesExtractionActive: true,
            debug: true,
            defaultSuggestionCount: 40,
            donnotTranslate: true,
            elasticIndexName: 'question_bank_chemistry_equations_v1.2',
            getComputeQues: true,
            getComputeQues2: true,
            hideFromPanel: false,
            includeOnHindiPanel: false,
            isReorderSuggestions: true,
            optionsRemovalStrategyGoogle: 'v4',
            optionsRemovalStrategyMathpix: 'v8',
            preProcessor: [
                {
                    arg: [
                        'log,ln',
                        'cosec,csc',
                        'rarr0,raar 0',
                        'times,xx',
                        'sin, si n',
                        'lt,lim',
                    ],
                    type: 'synonyms',
                },
                {
                    googleOcrStrategy: 'v4',
                    mathpixOcrStrategy: 'v8',
                    type: 'strip_options',
                },
                {
                    googleOcrStrategy: 'v2',
                    mathpixOcrStrategy: 'v2',
                    type: 'strip_question_number',
                },
                {
                    type: 'replace_quad_only',
                },
            ],
            queryConfig: {
                maxTokensSize: 70,
                minimumShouldMatchPercent: 30,
                queryType: 'hybrid_slop',
                slop: 3,
            },
            searchImplVersion: 'v20',
            searchServiceMetaConfig: {
                activeStringDiffSubjects: [
                    'MATHS',
                ],
            },
            smilesIterationStringDiffStrategy: 'chemistry_diagram_weighted_v2',
            stringDiffCapabilities: [
                'SUBJECT_WISE_STRING_DIFF',
                'WEIGHTED_STRING_DIFF',
            ],
            subjectWiseStringDiff: true,
            suggestionCount: 100,
            synonymDelimiters: [
                'log,ln',
                'cosec,csc',
                'rarr0,raar 0',
                'times,xx',
                'sin, si n',
                'lt,lim',
            ],
            useQuestionIntentBoostSmilesIteration: true,
            useViserMathsOcr: true,
            version: 'v_organic_chemistry_smiles_ocr_v2',
        },
    },
    responseTemplate: {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: {},
    },
    southIndianStates: ['TG', 'KA', 'AP', 'TN', 'KL'],
    southIndianBoards: ['Telangana Board', 'Karnataka Board', 'Andhra Pradesh Board', 'Tamil Nadu Board', 'Kerala Board'],
    cameraPageBottomSheet: {
        cta_button: {
            title: {
                en: 'Explore All',
                hi: 'डाउटनट के सारे फीचर्स देखें',
            },
            color: '#eb532c',
        },
        title: {
            en: 'Kaha Chale, aur bhi bhut kuch hai, Doubtnut Par, Check Now',
            hi: 'कहाँ चलेें, और भी बहुत कुछ है Doubtnut पर, अभी देखेें',
            other: 'Wait Wait!! Take a look at what all we have at Doubtnut',
        },
        img_url: 'engagement_framework/D3671079-C9FD-B324-8B46-2D098B460C39.webp',
        iconsListWidgetLayout: {
            layout_config: {
                margin_top: 0,
                margin_bottom: 15,
                margin_left: 15,
                margin_right: 15,
            },
        },
        icons_bg_color: {
            online_class_bottom_sheet_icon: '#EFF3FF',
            dnr_bottom_sheet_icon: '#FFF3E3',
            free_class_bottom_sheet_icon: '#FFF9ED',
            study_group_bottom_sheet_icon: '#FFF7EE',
            friends_bottom_sheet_icon: '#F7EFFF',
            khelo_jeeto_bottom_sheet_icon: '#FFE9E9',
            doubt_pe_charcha_bottom_sheet_icon: '#F0F6FF',
            library_bottom_sheet_icon: '#EBF1FF',
            revision_corner_sheet_icon: '#F7EFFF',
        },
    },
    tempWebLandingVideoThumbnails: [`${config.staticCDN}engagement_framework/A2FAEF60-6E52-AEBE-B662-5FCFCD2A6632.webp`, `${config.staticCDN}engagement_framework/25211BF9-95AE-5BE5-2257-D3D86FD3DBE1.webp`, `${config.staticCDN}engagement_framework/D672E98E-D2FE-31F8-CE06-9A1F869B822A.webp`],
    tempWebLandingCourseDetails: ['16+ year experienced team', 'Top Rankers 1,3,9 taught', 'Daily interactive live classes', 'Mock Tests (Part & Full tests)', 'Complete Study Material', 'DPP, Tips & Tricks'],
    tempWebLandingBannerImage: `${config.staticCDN}engagement_framework/5660F5D5-6B4D-C5F3-441C-DE528B296730.webp`,
    tempWebLandingTestimonialNames: ['Abhishek Kumar', 'Rishi Raj', 'Yuvraj Varshney', 'Akshit Rathore', 'Priyansh Lashwani'],
    tempWebLandingTestimonialImages: [`${config.staticCDN}engagement_framework/CD444B77-804B-E3D4-2E28-291BCAE3069B.webp`, `${config.staticCDN}engagement_framework/F6502841-9863-DACE-AB3F-F01387B4ACB2.webp`, `${config.staticCDN}engagement_framework/C19838AD-75B6-BBA1-C278-670A4CB47DB3.webp`, `${config.staticCDN}engagement_framework/9B876DD5-E0C2-79A1-23DE-37A417D8723E.webp`, `${config.staticCDN}engagement_framework/761C5AC3-AB08-9EB1-12BD-8959F572F480.webp`],
    tempWebLandingTestimonialDetails: ["During my JEE Preparation, I studied from Doubtnut's IIT-JEE Course & got  99.02%. I am a big fan of NKC Sir and his teaching techniques, he is a rockstar. I will recommend every JEE aspirant to study from Doubtnut App", 'Doubtnut supported me in each and every step of my JEE Preparation, especially in solving all my Doubts instantly, I am very thankful to Doubtnut for helping me score 99.05% in my JEE mains & 1908 Rank in JEE Advanced', 'NKC Sir is the best teacher for JEE preparation. I loveeee you sir. To every JEE aspirant - You must surely study from NKC sir if you want to crack your JEE exam', "I would like to give all credit to Doubtnut for Solving my Doubts and clearing my Concepts. Doubtnut's JEE Course was very helpful. I Suggest all the JEE aspirants to study on Doubtnut", "I would like to thank Doubtnut faculty who helped me to strengthen my basics, cleared all my concepts, also gave me instant video solutions to all the tough JEE questions. I am very impressed by Doubtnut's teaching standards"],
    tempWebLandingFacultyDetails: ['Top Ranks: 1,3,9,10 \nEx- Allen, Vibrant, Bansal Classes', 'Top Ranks: 6,22,89 \nEx- FIITJEE, Brilliant Tutorials, Amity.', 'Top Rank: Rank 1 (AIIMS) \nEx - Aakash Institute, Brilliant Tutorials', 'Top Ranks: 8,19 \nEx- Bansal Classes, FIITJEE & Narayana', 'Ex - Vision Kota, Brilliant Tutorials \nTop Ranks - 20 Under 100 Rankers produced'],
    reinstall_reward_trial_duration: 7,
    reinstall_reward_dnr_notification: {
        title: {
            en: 'Congratulations! Reward Unlocked!',
            hi: 'बधाई हो',
            other: 'Congratulations! Reward Unlocked!',
        },
        message: {
            en: 'Aapne Jeeta hai 300 DNR. Rewards aur Gifts ke liye isko abhi redeem kare!',
            hi: 'आपने 300 डीएनआर जीते हैं। उपहारों और पुरस्कारों के लिए इसे रिडीम करें!अभी रिडीम करे।',
            other: 'You have won 300 DNR. Redeem this for Gifts and Rewards!',
        },
    },
    reinstall_reward_course_notification: {
        title: {
            en: 'Congratulations! Course Trial Activated!',
            hi: 'बधाई हो!',
            other: 'Congratulations! Course Trial Activated!',
        },
        message: {
            en: '7 Days Trial for xx-course-xx is now active. Abhi Classes Dekhe!',
            hi: 'xx-course-xx के लिए 7 दिन का ट्रायल अब शुरू कर दिया है। अभी कक्षाएं देखें!',
            other: '7 Days Trial for xx-course-xx is now active. Watch Classes Now!',
        },
    },
    tempWebLandingVideoThumbnails2: [`${config.staticCDN}engagement_framework/DB66CD3D-962B-1BE8-4773-4F64AC469B23.webp`, `${config.staticCDN}engagement_framework/25211BF9-95AE-5BE5-2257-D3D86FD3DBE1.webp`, `${config.staticCDN}engagement_framework/D672E98E-D2FE-31F8-CE06-9A1F869B822A.webp`],
    post_qa_notif: {
        title: 'Sab hain aagey, aap bhi naa raho peeche!',
        message: 'Seekho is question ka solution!',
        tag: 'USER_POST_QA',
    },
    favClassesCardsColourCodes: {
        1: {
            faculty_card: '#F3754D',
            bg_color: '#FFDACE',
        },
        2: {
            faculty_card: '#E9A53F',
            bg_color: '#FFEBCE',
        },
        3: {
            faculty_card: '#6194F5',
            bg_color: '#C8DBFF',
        },
    },
    country_code_country_name_mapping: {
        971: 'AE',
        '+971': 'AE',
    },
    languageFilters: {
        AE: ['en', 'hi-en'],
    },
    middleEastCountryCodes: ['+971', '+968', '+974', '+965', '+966', '+973', '971', '968', '974', '965', '966', '973'],
    videoQualityDisplay: {
        autoTitle: 'Auto (recommended)',
        saverTitle: 'Data Saver',
        highTitle: 'High Quality',
        autoSubTitle: 'Adjust to give you the best experience',
        saverSubTitle: 'Lower picture quality',
        highSubTitle: 'Use more Data',
    },
    d0UserQaWidgetMpvpBottomSheet: {
        title1: {
            en: 'Hurry Up!',
            hi: 'जल्दी करो!',
        },
        title3: {
            en: 'Aap xxLEFTQAxx question dur hai 7 din k liye free course jeetne ke!',
            hi: 'आप 7 दिन तक फ्री कोर्स जीतने से xxLEFTQAxx प्रश्न दूर हैं!',
        },
        title4: {
            en: 'ASK NOW',
            hi: 'अभी पूछो',
        },
    },
    d0UserQaWidgetCamera(obj) {
        return {
            overlay_title: global.t8[obj.locale].t('Aaj app se Pucho {{leftQa}} question, fir 7 din ke liye free course pao', { leftQa: obj.leftQa }),
            top_title_starting: global.t8[obj.locale].t('<p>Aaj <strong>{{leftQa}} question pucho</strong> aur 7 din tak <strong>free course</strong> paao!</p>', { leftQa: obj.leftQa }),
            top_title: global.t8[obj.locale].t('<p>Aap <strong>{{rewardLeftQa}} questions</strong> dur hai 7 din tak <strong>free course</strong> jeetne ke!</p>', { rewardLeftQa: obj.rewardLeftQa }),
            cta: global.t8[obj.locale].t('START'),
        };
    },
    d0UserCameraBackpress(locale) {
        return {
            title: global.t8[locale].t('Question nahi hai?'),
            exampleButtonText: global.t8[locale].t('Example ke sath try karein'),
            title_2: global.t8[locale].t('Doubtnut Pe aapko kya milega?'),
            opt_1: global.t8[locale].t('1 crore se bhi bhi jyada sawalon ke jawab.'),
            opt_2: global.t8[locale].t('IIT-JEE , NEET or saare Government exam ke sawalon ka jawab.'),
            opt_3: global.t8[locale].t('Hum 10 lakh baccho k 50 lakh question roz solve karte hai.'),
            opt_4: global.t8[locale].t('Pehle din par puche 5 Sawal aur payein 7 din k liye free course.'),
            cta: global.t8[locale].t('Ask question now'),
        };
    },
    d0UserVideoBackpress(obj) {
        return {
            questionsAsked: global.t8[obj.locale].t('{{totalAsked}} Questions asked', { totalAsked: obj.totalAsked }),
            questionsLeft: {
                backpress: global.t8[obj.locale].t('<p>Ask <font color = "#EB532C">{{limitReward}} more</font> to unlock free course for 7 days</p>', { limitReward: obj.limitReward }),
                top: global.t8[obj.locale].t('<p>Ask <font color = "#ffc700">{{limitReward}} more</font> to unlock free course for 7 days</p>', { limitReward: obj.limitReward }),
            },
        };
    },
    freeClassListingPageSubjectOrder: {
        6: ['maths', 'science', 'english', 'social science', 'english grammar'],
        7: ['maths', 'science', 'english', 'social science', 'english grammar'],
        8: ['maths', 'science', 'english', 'social science', 'english grammar'],
        9: ['maths', 'science', 'english', 'social science', 'english grammar'],
        10: ['maths', 'science', 'english', 'social science', 'english grammar'],
        11: ['physics', 'chemistry', 'maths', 'biology', 'english', 'english grammar', 'computer'],
        12: ['physics', 'chemistry', 'maths', 'biology', 'english', 'english grammar', 'computer'],
        13: ['physics', 'chemistry', 'maths', 'biology', 'english', 'english grammar', 'computer'],
        14: ['cdp', 'evs', 'hindi', 'sanskrit', 'english', 'physics', 'maths', 'reasoning', 'science', 'polity', 'history', 'economics', 'geography', 'general science', 'general studies'],
    },
    webLibraryClassText: "With the Doubtnut, you don’t need to buy any expensive books. Doubtnut is a hub for textbooks and their solutions. Explore Doubtnut’s rich library of textbooks for all subjects from 6th to 12th. Search for your textbook by title, then browse by chapter, to find detailed, step-by-step solutions for subjects like Maths, Biology, Chemistry, General Science, English Literature, Physics, and Social Science. Our textbook solutions are aimed at offering students e-learning solutions at zero cost & serve as an excellent resource in examination preparation. The solutions are from the latest edition of the textbook and are curated in line with CBSE's latest marking scheme pattern. These are curated by India’s top examination experts and are recommended for students preparing for JEE Main, NEET, JEE Advanced, CBSE board exams, ICSE, ISC as well as other state board exams. The solutions are provided to all the theoretical as well as the numerical problems from an examination point of view. We have followed a systematic layout covering all concepts in a chapter-wise manner. Get started now. Click on the name of the book which you want to study and you will be directed to its chapter page where you can find detailed, step-wise solutions for every question. Find accurate and precise solutions to every problem mentioned in the following books",
    inapp_pop_up_end_point_mapping: {
        '/v3/tesla/feed': 'doubtnutapp://common_popup?page=HOME_PAGE',
    },
    expert_panel_team: {
        mail_details: {
            autobotMailID: 'autobot@doubtnut.com',
            panelTechTeamMailID: 'feedback@doubtnut.com',
            panelTechTeamCCID: [],
        },
    },
    localeBoardMapping: {
        'West Bengal Board': 'bn',
        'Gujarat Board': 'gu',
        'Telangana Board': 'te',
        'Andhra Pradesh Board': 'te',
        'Karnataka Board': 'kn',
        'Tamil Nadu Board': 'ta',
    },
    defaultCCMCampaignExplore: {
        6: [{ id: 601, course: 'CBSE', category: 'board' }],
        7: [{ id: 701, course: 'CBSE', category: 'board' }],
        8: [{ id: 801, course: 'CBSE', category: 'board' }],
        9: [{ id: 901, course: 'CBSE', category: 'board' }],
        10: [{ id: 1001, course: 'CBSE', category: 'board' }],
        11: [{ id: 1101, course: 'CBSE', category: 'board' }],
        12: [{ id: 1201, course: 'CBSE', category: 'board' }],
        13: [{ id: 1201, course: 'CBSE', category: 'board' }],
        14: [{ id: 11401, course: 'SSC', category: 'SSC' }],
    },
    dnrExpStartingSid: 238986347,
    // TODO : change the versionCode before the release
    exact_match_qa_flow_experiment_config: {
        minVersionCodeExactMatchFlowByBackend: 1021,
    },
    mp_keys_changes_min_version_code: 1021,
};
