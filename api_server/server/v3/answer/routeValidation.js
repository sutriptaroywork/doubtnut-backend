const Joi = require('joi');

module.exports = {

    answer: {

        viewAnswerByQuestionId: {
            body: {
                parent_id: Joi.string(),
                session_id: Joi.string().default('0'),
                tab_id: Joi.string().default('0'),
                source: Joi.string(),
                id: Joi.string(),
                page: Joi.string().required(),
                ref_student_id: Joi.string(),
                mc_class: Joi.string().allow(''),
                mc_course: Joi.string().allow(''),
            },
        },
        updateAnswerView: {
            body: {
                view_id: Joi.string().required().regex(/^\d+$/),
                video_time: Joi.string().required(),
                is_back: Joi.string().required(),
                engage_time: Joi.string().required(),
            },
        },
        updateAnswerViewWeb: {
            body: {
                view_id: Joi.string().regex(/^\d+$/),
                video_time: Joi.string().required(),
                engage_time: Joi.string().required(),
                udid: Joi.string().required(),
                q_id: Joi.string().required(),
                ans_id: Joi.string().required(),
                answer_video: Joi.string().required(),
            },
        },
        updateVvsWhatsapp: {
            body: {
                view_id: Joi.string().required(),
                video_time: Joi.string().required(),
                engage_time: Joi.string().required(),
                q_id: Joi.string().required(),
                ans_id: Joi.string().required(),
                answer_video: Joi.string().required(),
            },
        },
        viewSimilarQuestions: {
            body: {
                question_id: Joi.string().required(),
                playlist_id: Joi.string(),
                page: Joi.string().required(),
            },
        },
        onBoarding: {
            body: {
                question_id: Joi.string().required(),
                video_time: Joi.string().required(),
                engage_time: Joi.string().required(),
                page: Joi.string().required(),
                source: Joi.string().required(),
            },
        },
        pdfDownload: {
            body: {
                package: Joi.string().allow(''),
                level1: Joi.string().allow(''),
                level2: Joi.string().allow(''),
            },
        },
        pdfDownloadWeb: {
            body: {
                package: Joi.string().allow(''),
                level1: Joi.string().allow(''),
                level2: Joi.string().allow(''),
            },
        },
    },
};
