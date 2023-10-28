const Joi = require('joi');

module.exports = {
    dnShorts: {
        updateFootprint: {
            body: {
                engage_time: Joi.string().required(),
                // question_id: Joi.string().required(),
            },
        },
        bookmarkShorts: {
            body: {
                question_id: Joi.any().required(),
            },
        },
    },
};
