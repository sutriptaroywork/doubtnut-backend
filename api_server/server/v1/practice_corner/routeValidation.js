const Joi = require('joi');

module.exports = {
    questions: {
        post: {
            body: {
                widget_id: Joi.number().required(),
                chapter_alias: Joi.string().required(),
            },
        },
    },
    topics: {
        post: {
            body: {
                subject: Joi.string().required(),
            },
        },
    },
    rules: {
        post: {
            body: {
                widget_id: Joi.number().required(),
                topic: Joi.string(),
                subject: Joi.string(),
            },
        },
    },
    submit: {
        post: {
            body: {
                subject: Joi.string().required(),
                all_questions: Joi.required(),
                correct_questions: Joi.required(),
                incorrect_questions: Joi.required(),
                chapter_alias: Joi.string().required(),
                widget_id: Joi.number().required(),
                // submitted_options: Joi.required(),
            },
        },
    },
    history: {
        post: {
            body: {
                tab_id: Joi.number().required(),
                widget_id: Joi.number().required(),
                page: Joi.number().required(),
            },
        },
    },
    tabs: {
        post: {
            widget_id: Joi.number().required(),
        },
    },
    previous: {
        post: {
            body: {
                result_id: Joi.string().required(),
                widget_id: Joi.number().required(),

            },
        },
    },
    submitStats: {
        post: {
            body: {
                test_id: Joi.number().required(),
                total_score: Joi.number().required(),
                total_marks: Joi.number().required(),
                exam_type: Joi.string().required(),

            },
        },
    },
    fullTest: {
        post: {
            body: {
                exam_type: Joi.string().required(),
                page: Joi.number().required(),
            },
        },
    },
};
