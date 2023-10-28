const Joi = require('joi');

module.exports = {
    scratch: {
        post: {
            body: {
                level: Joi.number().required(),
            },
        },
    },
    subscribe: {
        post: {
            body: {
                is_subscribed: Joi.number().required(),
            },
        },
    },
};
