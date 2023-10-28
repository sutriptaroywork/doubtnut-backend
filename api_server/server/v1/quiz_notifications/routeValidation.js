const Joi = require('joi');

module.exports = {
    route: {
        post: {
            body: {
                current_day: Joi.number().required(),
            },
        },
    },
    popup_notifications: {
        post: {
            body: {
                id: Joi.string(),
                heading: Joi.string().required(),
                heading_hi: Joi.string().required(),
                thumbnail_url: Joi.string().required(),
                cta_text: Joi.string().required(),
                deeplink: Joi.string().required(),
                logo_url: Joi.string().required(),
                csv_url: Joi.string().required(),
                notification_date: Joi.date().required(),
                is_skippable: Joi.number().default(1),
                created_by: Joi.string(),
            },
        },
    },
};
