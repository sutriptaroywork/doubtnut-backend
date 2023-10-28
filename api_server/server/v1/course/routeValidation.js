const Joi = require('joi');

module.exports = {
    course: {
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
        lectures: {
            params: {
                chapter_id: Joi.string().required(),
            },
        },
        homeworkGet: {
            query: {
                question_id: Joi.string().required(),
            },
        },
        homeworkReview: {
            query: {
                question_id: Joi.string().required(),
            },
        },
        homeworkWidgets: {
            query: {
                question_id: Joi.string().required(),
                page: Joi.string().required(),
            },
        },
        homeworkSubmit: {
            body: {
                question_id: Joi.number().required(),
                response: Joi.array().required(),
            },
        },
        courseChange: {
            query: {
                assortment_id: Joi.string(),
            },
        },
        dismissCallingCard: {
            body: {
                assortment_id: Joi.number(),
            },
        },
        requestCallback: {
            body: {
                assortment_id: Joi.number().empty(''),
            },
        },
        coursebottomSheet: {
            body: {
                widget_type: Joi.string(),
            },
        },
        bookmarkCourseResources: {
            query: {
                resource_id: Joi.string(),
                bookmark: Joi.string(),
            },
        },
        schedulerListing: {
            query: {
                subjects: Joi.string(),
                slot_key: Joi.string(),
            },
        },
    },
};
