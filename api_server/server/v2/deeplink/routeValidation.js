const Joi = require('joi');

module.exports = {
    deeplink: {
        generate: {
            body: {
                channel: Joi.string().required(),
                campaign: Joi.string().required(),
                deeplink: Joi.string().required(),
            },
        },
    },
};
