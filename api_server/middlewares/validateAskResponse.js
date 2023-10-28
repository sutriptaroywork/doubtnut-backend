const Joi = require('joi');
const _ = require('lodash');
const logger = require('../config/winston').winstonLogger;
const Data = require('../data/data');

const stringSchema = Joi.string();
const integerSchema = Joi.number();
const booleanSchema = Joi.boolean();

const matchesArraySourceSchema = Joi.object({
    chapter: stringSchema.default('DEFAULT'),
    chapter_alias: stringSchema.default('DEFAULT'),
    is_answered: integerSchema.default(0),
    ocr_text: stringSchema.allow('').default(''),
    ocr_text_hi: stringSchema.default(Joi.ref('ocr_text')),
    is_text_answered: integerSchema.default(0),
    subject: stringSchema.default('MATHS'),
    video_language: stringSchema.default('en'),
    thumbnail_language: stringSchema.default('en'),
    exact_match: booleanSchema.default(false),
    is_exact_match: booleanSchema.default(false),
    share_message: stringSchema.allow('').default(''),
    views: integerSchema.default(1000),
    bg_color: stringSchema.default('#FFFFFF'),
    isLiked: booleanSchema.default(false),
    likes: integerSchema.default(1000),
    share: integerSchema.default(1000),
    duration: integerSchema.default(0),
    render_katex: booleanSchema.default(true),
    rating: stringSchema.default('5 ✭'),
    rating_color: stringSchema.default('#000000'),
    rating_background_color: stringSchema.default('#FFFFFF'),
    top_left: Joi.object(),
    top_right: Joi.object(),
    bottom_left: Joi.object(),
    bottom_right: Joi.object(),
    bottom_center: Joi.object(),
}).options({ stripUnknown: true });

const videoResourceSchema = Joi.object({
    resource: stringSchema.allow('').default(''),
    is_flv: booleanSchema.default(false),
    video_resource: stringSchema.allow('').default(''),
    timeout: integerSchema.default(0),
    drm_scheme: stringSchema.allow('').default(''),
    media_type: stringSchema.default('BLOB'),
    drop_down_list: Joi.array().default([]),
    drm_license_url: stringSchema.allow('').default(''),
    offset: stringSchema.allow(null).default(null),
}).options({ stripUnknown: true });

const matchesArrayItemSchema = Joi.object({
    _index: stringSchema.allow('').default('question_bank'),
    _type: stringSchema.allow('').default('repository'),
    _id: stringSchema.allow('').default(0),
    _score: integerSchema.allow(0).default(100),
    resource_type: stringSchema.default('video'),
    widget_data: Joi.any().when('resource_type', { is: 'widget', then: Joi.object().required(), otherwise: Joi.forbidden() }),
    _source: Joi.any().when('resource_type', { is: 'widget', then: Joi.object(), otherwise: matchesArraySourceSchema }),
    partial_score: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: integerSchema.default(100) }),
    question_thumbnail: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: stringSchema.allow('').default('') }),
    is_locked: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: integerSchema.default(0) }),
    answer_id: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: integerSchema.default(0) }),
    answer_video: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: stringSchema.allow('').default('') }),
    html: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: stringSchema.allow('').default('') }),
    question_thumbnail_localized: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: stringSchema.allow('').default(Joi.ref('question_thumbnail')) }),
    video_url: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: stringSchema.allow('').default('') }),
    cdn_base_url: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: stringSchema.allow('').default('') }),
    fallback_url: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: stringSchema.allow('').default('') }),
    hls_timeout: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: integerSchema.default(0) }),
    video_resource: Joi.any().when('resource_type', { is: 'widget', then: Joi.forbidden(), otherwise: videoResourceSchema }),
    canvas: Joi.object(),
});

const matchesArraySchema = Joi.array().when('resource_type', { is: 'widget', then: Joi.any(), otherwise: Joi.array().items(matchesArrayItemSchema) });

const feedbackSchema = Joi.object({
    feedback_text: stringSchema.default('Happy with the Solutions'),
    is_show: integerSchema.default(1),
    bg_color: stringSchema.default('#e0eaff'),
});

const liveTabDataSchema = Joi.object({
    tab_text: stringSchema.allow('').default(''),
});

const bottomTextNestedSchema = Joi.object({
    title: stringSchema.allow('').default(''),
    deeplink: stringSchema.allow('').default(''),
});

const bottomTextDataSchema = Joi.object({
    VIP: bottomTextNestedSchema,
    'Online Classes': bottomTextNestedSchema,
});

const topicsTabSchema = Joi.array().items(Joi.object({
    subject: stringSchema.default('MATHS'),
    display: stringSchema.default('Mathematics'),
}));

const tabUrlsSchema = Joi.object({
    google: stringSchema.allow('').default(''),
    youtube: stringSchema.allow('').default(''),
}).options({ stripUnknown: true });

const platformTabsSchema = Joi.array().items(Joi.object({
    key: stringSchema.default('doubtnut'),
    display: stringSchema.default('Doubtnut'),
})).options({ stripUnknown: true });

const notificationSchema = Joi.array().items(Joi.object({
    event: stringSchema.allow('').default(''),
    title: stringSchema.allow('').default(''),
    message: stringSchema.allow('').default(''),
    image: stringSchema.allow('').default(''),
    data: stringSchema.allow('').default(''),
})).options({ stripUnknown: true });

const dataSchema = Joi.object({
    question_id: integerSchema.default(0),
    ocr_text: stringSchema.allow('').default(''),
    question_image: stringSchema.allow(null).default(''),
    question_locale: stringSchema.default('en'),
    matched_questions: matchesArraySchema,
    matches_display_config: Joi.object().optional(),
    matched_count: integerSchema.default(0),
    handwritten: integerSchema.default(0),
    is_only_equation: booleanSchema.default(false),
    is_exact_match: booleanSchema.default(false),
    tab: topicsTabSchema.default([]),
    notification: notificationSchema.default([]),
    feedback: feedbackSchema.default({}),
    is_p2p_available: booleanSchema.default(false),
    p2p_thumbnail_images: Joi.array().items(stringSchema).default([]),
    user_language_video_heading: stringSchema.allow('').default(''),
    other_language_video_heading: stringSchema.allow('').default(''),
    more_user_language_videos_text: stringSchema.allow('').default(''),
    cdn_video_base_url: stringSchema.allow('').default(''),
    // is_blur: null.default(),
    is_image_blur: booleanSchema.default(false),
    is_image_handwritten: booleanSchema.default(false),
    live_tab_data: liveTabDataSchema.default({}),
    bottom_text_data: bottomTextDataSchema.default({}),
    tab_urls: tabUrlsSchema.default({}),
    platform_tabs: platformTabsSchema.default([]),
    back_press_variant: Joi.any(),
    scroll_animation: booleanSchema.default(true),
    auto_play: booleanSchema.default(false),
    ocr_loading_order: Joi.any(),
    auto_play_duration: Joi.any(),
    auto_play_initiation: Joi.any(),
}).options({ stripUnknown: true });

const incrementKeysSchema = Joi.object({
    d0_qa_count: integerSchema.default(1),
}).options({ stripUnknown: true });

const metaDataSchema = Joi.object({
    code: integerSchema.default(500),
    success: booleanSchema.default(false),
    message: stringSchema.default('Failure'),
    increment_keys: incrementKeysSchema.default({}),
}).options({ stripUnknown: true });

/**
 * @description Response validation middleware of v10 Ask API
 * @param {Object} result contains response and meta data
 * @param {Express.Response} res
 */

function sendResponse(result, _req, res, next) {
    let source;
    try {
        if (result.error || result instanceof (Error)) {
            source = 'Ask service error';
            throw result;
        }
        if (result.err) {
            source = 'Ask service error';
            throw result.err;
        }
        const responseData = result.getResponse();
        const { meta, data } = responseData;
        if (_req.headers.version_code < Data.mp_keys_changes_min_version_code) {
            return res.status(responseData.meta.code).json(responseData);
        }
        const {
            error: responseDataError,
            value: responseDataValue,
        } = dataSchema.validate(data);

        const {
            error: metaDataError,
            value: metaDataValue,
        } = metaDataSchema.validate(meta);
        const responseDataToSend = {
            meta: metaDataValue,
            data: responseDataValue,
        };

        if (_.isNull(responseDataError) && _.isNull(metaDataError)) {
            return res.status(responseDataToSend.meta.code).json(responseDataToSend);
        }
        source = 'ask response validation error';
        throw result;
    } catch (e) {
        if (source === 'ask response validation error') {
            const responseData = result.getResponse();
            logger.error({ tag: 'ask', source, error: e });
            return res.status(responseData.meta.code).json(responseData);
        }
        logger.error({ tag: 'ask', source, error: e });
        next(e);
    }
}

module.exports = sendResponse;
