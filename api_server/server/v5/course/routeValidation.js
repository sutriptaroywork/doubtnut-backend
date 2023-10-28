const Joi = require('joi');

module.exports = {
    course: {
        resourceDetail: {
            query: {
                detail_id: Joi.string(),
                master_chapter: Joi.string(),
            },
        },
        courseDetail: {
            query: {
                course_id: Joi.string(),
            },
        },
        tabDetail: {
            query: {
                course_id: Joi.string(),
                tab: Joi.string(),
            },
        },
        home: {
            query: {
                page: Joi.string().required(),
                ecm_id: Joi.string(),
            },
        },
    },
};
