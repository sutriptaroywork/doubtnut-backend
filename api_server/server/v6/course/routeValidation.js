const Joi = require('joi');

module.exports = {
    course: {
        courseDetail: {
            query: {
                assortment_id: Joi.string(),
            },
        },
        tabDetail: {
            query: {
                assortment_id: Joi.string(),
                tab: Joi.string(),
            },
        },
        home: {
            query: {
                page: Joi.string().required(),
            },
        },
        list: {
            query: {
                resource_type: Joi.string(),
            },
        },
    },
};
