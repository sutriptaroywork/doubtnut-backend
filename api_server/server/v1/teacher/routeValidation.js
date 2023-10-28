const Joi = require('joi');

module.exports = {
    onboardLogin: {
        query: {
            language: Joi.string(),
        },
    },
    login: {
        body: {
            mobile: Joi.number().required(),
            locale: Joi.string(),
        },
    },
    verify: {
        body: {
            otp: Joi.number().required(),
            session_id: Joi.string(),
        },
    },
    subscribe: {
        body: {
            is_subscribe: Joi.number().required(),
            teacher_id: Joi.number().required(),
        },
    },
};
