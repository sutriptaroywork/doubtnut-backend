const Joi = require('joi');

module.exports = {
    course: {
        livesection: {
            query: {
                ecm_id: Joi.string().required(),
            },
        },
        faculty: {
            params: {
                faculty_id: Joi.string().required(),
                ecm_id: Joi.string().required(),
            },
        },
        get: {
            query: {
                ecm_id: Joi.string(),
                page: Joi.string().required(),
            },
        },
    },
};
