const Joi = require('joi');

module.exports = {
    liveclass: {
        start: {
            query: {
                id: Joi.string().required(),
            },
        },
        getPushUrl: {
            faculty_id: Joi.string().required(),
            question_id: Joi.string().required(),
        },
        pushQuizQuestion: {
            query: {
                resource_id: Joi.string().required(),
                resource_detail_id: Joi.string().required(),
            },
        },
        startByFaculty: {
            query: {
                detail_id: Joi.string().required(),
            },
        },
        quizSubmit: {
            body: {
                liveclass_id: Joi.string().required(),
                quiz_question_id: Joi.string().required(),
                selected_options: Joi.string().allow(null, ''),
            },
        },
        getQuizQuestions: {
            query: {
                detail_id: Joi.string().required(),
            },
        },
        end: {
            query: {
                detail_id: Joi.string().required(),
            },
        },
        getList: {
            query: {
                faculty_id: Joi.string().required(),
            },
        },
        home: {
            query: {
                course_id: Joi.string(),
            },
        },
        interestedSudents: {
            query: {
                resource_id: Joi.string(),
            },
        },
        courseDetail: {
            query: {
                id: Joi.string(),
                master_chapter: Joi.string(),
            },
        },
        packageInfo: {
            query: {
                course_id: Joi.string().required(),
            },
        },
        postQuizDetails: {
            query: {
                resource_id: Joi.string().required(),
            },
        },
        facultyLogin: {
            query: {
                email: Joi.string().required(),
                password: Joi.string().required(),
            },
        },
        getLeaderBoard: {
            query: {
                offset: Joi.number(),
            },
        },
        status: {
            query: {
                id: Joi.string().required(),
            },
        },
        videoPageData: {
            params: {
                question_id: Joi.string().required(),
                status: Joi.string().required(),
            },
        },
        videoPageLiveBanner: {
            params: {
                question_id: Joi.string().required(),
            },
        },
    },
};
