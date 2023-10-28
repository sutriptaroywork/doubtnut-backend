const Joi = require('joi');

module.exports = {
    scratch: {
        post: {
            body: {
                level: Joi.number().required(),
            },
        },
    },
    leaderboard: {
        post: {
            body: {
                page: Joi.number().required(),
                id: Joi.number().required(), // 1 - weekly or 2 - monthly
            },
        },
    },
    doubtCompletion: {
        body: {
            type_id: Joi.string().required(),
        },
    },
    doubtDetails: {
        body: {
            topic_id: Joi.string(),
        },
    },
    previousDoubtCompletion: {
        body: {
            type_id: Joi.string().required(),
        },
    },
};
