const Joi = require('joi');

module.exports = {
    ads: {
        updateEngageTime: {
            body: {
                uuid: Joi.string().required(),
                ad_id: Joi.string().required(),
                engage_time: Joi.number().required(),
            },
        },
    },
};