const Joi = require('joi');

module.exports = {
    course: {
        courselist: {
            params: {
                student_class: Joi.string().required(),
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
        lectures: {
            params: {
                chapter_id: Joi.string().required(),
            },
        },
        list: {
            query: {
                ecm_id: Joi.string(),
                subject: Joi.string(),
                sutdent_class: Joi.string(),
            },
        },
        timetable: {
            query: {
                assortment_id: Joi.string(),
                page: Joi.string(),
            },
        },
        videopageWidgets: {
            query: {
                question_id: Joi.string().required(),
                page: Joi.string().required(),
            },
        },
        lectureSeriesWidgets: {
            query: {
                question_id: Joi.string().required(),
            },
        },
    },
};
