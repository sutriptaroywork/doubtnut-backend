const Joi = require('joi');

module.exports = {
    recommendation: {
        chat: {
            body: {
                message_id: Joi.number().required().allow(''),
                selected_option_key: Joi.string().required().allow(''),
                session_id: Joi.string().required().allow(''),
                initiate: Joi.boolean().required(),
                is_back: Joi.boolean().required(),
            },
        },
    },
};
