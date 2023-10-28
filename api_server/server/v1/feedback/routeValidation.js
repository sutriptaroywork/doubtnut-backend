const Joi = require('joi');

module.exports = {
    feedback: {
        studentRating: {
            body: {
                rating: Joi.string(),
            },
        },
    },
    matchFailureFeedback: {
        get: {
            query: {
                source: Joi.string().required(),
            },
        },
        put: {
            body: {
                question_id: Joi.number().required(),
                is_positive: Joi.bool().required(),
                source: Joi.string().required(),
                feedback: Joi.string().required(),
                answers_displayed: Joi.array().items(
                    Joi.number().required(),
                ).required(),
            },
        },
    },
    videoDislikeFeedback: {
        get: {
            query: {
                source: Joi.string().required(),
            },
        },
    },
};
