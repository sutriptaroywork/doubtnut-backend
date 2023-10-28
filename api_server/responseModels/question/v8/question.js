const Joi = require('joi');

const matchedQuestionsSourceSchema = Joi.object().keys({
    ocr_text: Joi.string().required().allow(''),
    likes: Joi.number(),
    share: Joi.number(),
    bg_color: Joi.string().required(),
    isLiked: Joi.boolean(),
    duration: Joi.number().required(),
    share_message: Joi.string().required(),
}).required();
const matchedQuestionsSchema = Joi.object().keys({
    _index: Joi.string().required(),
    _type: Joi.string().required(),
    _id: Joi.string().required(),
    _score: Joi.number().required(),
    class: Joi.string(),
    difficulty_level: Joi.string(),
    chapter: Joi.string(),
    question_thumbnail: Joi.string().required(),
    _source: matchedQuestionsSourceSchema,
    html: Joi.string(),
}).optional();
const notificationSchema = Joi.object().keys({
    event: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    image: Joi.string(),
    data: Joi.string().required(),
}).optional();
const feedbackSchema = Joi.object().keys({
    feedback_text: Joi.string(),
    is_show: Joi.number(),
    bg_color: Joi.string(),
}).required();

const notificationArraySchema = Joi.array().items(notificationSchema).required();
const matchedQuestionsArraySchema = Joi.array().items(matchedQuestionsSchema).unique().required()
    .options({ stripUnknown: true });

module.exports = {
    ask: Joi.object({
        question_id: Joi.number().required(),
        tab: Joi.array().items().required(),
        matched_count: Joi.number().required(),
        question_image: Joi.string().allow(null),
        is_subscribed: Joi.number().integer(),
        handwritten: Joi.number().integer(),
        ocr_text: Joi.string().required().allow(''),
        notification: notificationArraySchema,
        feedback: feedbackSchema,
        matched_questions: matchedQuestionsArraySchema,
    }),
};
