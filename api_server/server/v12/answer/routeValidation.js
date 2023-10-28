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
                page: Joi.string().required(),
                ref_student_id: Joi.string(),
                mc_class: Joi.string().allow(''),
                mc_course: Joi.string().allow(''),
            },
        },
        pdfDownloadWeb: {
            body: {
                package: Joi.string().allow(''),
                level1: Joi.string().allow(''),
                level2: Joi.string().allow(''),
            },
        },
        advancedSearch: {
            post: {
                body: {
                    ocr_text: Joi.string().required(),
                    facets_v2: Joi.array().items().required(),
                    question_id: Joi.string().required(),
                },
            },
        },
    },
};
