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
    },
};
