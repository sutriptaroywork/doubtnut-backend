const Joi = require('joi');

module.exports = {
    getBanner: {
        query: {
            question_id: Joi.number().empty('').allow(null),
            page_type: Joi.string().valid('quiz-questions', 'question-answer').required(),
        },
    },
};
