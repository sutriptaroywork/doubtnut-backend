const Joi = require('joi');

module.exports = {
    answer: {
        viewAnswerByQuestionId: {
            body: {
                parent_id: Joi.string(),
                session_id: Joi.string().default('0'),
                tab_id: Joi.string().default('0'),
                source: Joi.string(),
                id: Joi.string().required(),
                page: Joi.string().optional(),
                ref_student_id: Joi.string(),
                mc_class: Joi.string().allow(''),
                mc_course: Joi.string().allow(''),
                supported_media_type: Joi.array().items(Joi.string()).required(),
            },
        },
        viewAnswerWeb: {
            body: {
                parent_id: Joi.string(),
                session_id: Joi.string().default('0'),
                tab_id: Joi.string().default('0'),
                source: Joi.string(),
                id: Joi.string().required(),
                page: Joi.string().optional(),
                ref_student_id: Joi.string(),
                mc_class: Joi.string().allow(''),
                mc_course: Joi.string().allow(''),
                supported_media_type: Joi.array().items(Joi.string()).required(),
            },
        },
    },
};
