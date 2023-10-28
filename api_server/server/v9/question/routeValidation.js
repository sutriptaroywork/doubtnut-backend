const Joi = require('joi');

module.exports = {
    question: {
        ask: {
            body: {
                question_text: Joi.string().allow('').default(null),
                question_image: Joi.string().allow('').default(null),
                student_id: Joi.string().allow('').default(null),
                chapter: Joi.string().allow('').default(null),
                question: Joi.string().allow('').default(null),
                subject: Joi.string().allow('').default(null),
                class: Joi.string().allow('').default(null),
                locale: Joi.string().allow('').default(null),
                file_name: Joi.string().allow('').default(null),
            },
        },
        advanceSearchFacets: {
            question_id: Joi.string().required(),
        },
    },
};
