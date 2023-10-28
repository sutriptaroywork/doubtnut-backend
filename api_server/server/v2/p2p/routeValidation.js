const Joi = require('joi');

module.exports = {
    home: {
        post: {
            body: {
                primary_tab_id: Joi.number().required(),
                secondary_tab_id: Joi.number().required(),
                subjects: Joi.array().required(),
                question_classes: Joi.array().required(),
                question_languages: Joi.array().required(),
            },
        },
    },

    doubts: {
        post: {
            body: {
                primary_tab_id: Joi.number().required(),
                secondary_tab_id: Joi.number().required(),
                subjects: Joi.array().required(),
                question_classes: Joi.array().required(),
                question_languages: Joi.array().required(),
                page: Joi.number().required(),
            },
        },
    },

    whatsappInitiated: {
        post: {
            body: {
                number: Joi.string().required(),
            },
        },
    },

    feedbackData: {
        post: {
            body: {
                room_id: Joi.string().required(),
            },
        },
    },

    markSolved: {
        post: {
            body: {
                room_id: Joi.string().required(),
                sender_id: Joi.number().required(),
                event: Joi.string().required(),
                // message_id: Joi.string(),
            },
        },
    },
};
