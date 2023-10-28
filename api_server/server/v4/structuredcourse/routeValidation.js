const Joi = require('joi');

module.exports = {
    structuredCourse: {
        getDetails: {
            query: {
                id: Joi.string().required(),
                subject: Joi.string().required(),
            },
        },
        getResource: {
            query: {
                detail_id: Joi.string().required(),
            },
        },
    },
};
