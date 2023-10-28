const Joi = require('joi');

module.exports = {
    liveclass: {
        getLeaderBoard: {
            query: {
                offset: Joi.number(),
            },
        },
        getList: {
            query: {
                faculty_id: Joi.string().required(),
            },
        },
        startByFaculty: {
            query: {
                resource_id: Joi.string().required(),
            },
        },
        end: {
            query: {
                resource_id: Joi.string().required(),
            },
        },
        getQuizQuestions: {
            query: {
                resource_id: Joi.string().required(),
            },
        },
        pushQuizQuestion: {
            query: {
                resource_id: Joi.string().required(),
            },
        },
        quizSubmit: {
            body: {
                liveclass_id: Joi.string(),
                quiz_resource_id: Joi.string(),
                quiz_question_id: Joi.string().required(),
                resource_detail_id: Joi.string().allow(null, ''),
                detail_id: Joi.string().allow(null, ''),
                liveclass_resource_id: Joi.string().allow(null, ''),
            },
        },
        postQuizDetails: {
            query: {
                resource_id: Joi.string().required(),
            },
        },
        status: {
            query: {
                id: Joi.string().required(),
            },
        },
    },
};
