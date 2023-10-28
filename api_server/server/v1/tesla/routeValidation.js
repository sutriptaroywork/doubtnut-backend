const Joi = require('joi');

module.exports = {
    oneTapPosts: {
        get: {
            query: {
                page: Joi.number().required(),
                carousel_type: Joi.string().required(),
            },
        },
        post: {
            body: {
                post_id: Joi.number().required(),
            },
        },
    },
};
