const Joi = require('joi');

module.exports = {
    blockRoom: {
        post: {
            body: {
                room_id: Joi.string().required(),
            },
        },
        get: {
            query: {
                room_id: Joi.string().required(),
            },
        },
    },
    sendNotification: {
        post: {
            body: {
                room_id: Joi.string().required(),
                message: Joi.required(),
            },
        },
    },
};
