const Joi = require('joi');

module.exports = {
    nudge: {
        get: {
            query: {
                id: Joi.string().required(),
            },
        },
    },
};
