const Joi = require('joi');

module.exports = {
    feedback: {

        answer: {
            // addAnswerFeedbackAction
            body: {
                question_id: Joi.string().required(),
                rating: Joi.string().required(),
                feedback: Joi.string().required(),
                is_approved: Joi.string().required(),
            },
        },

        video: {
            // addVideoFeedbackPublicAction
            body: {
                question_id: Joi.string().required(),
                rating: Joi.string().required().allow(''),
                feedback: Joi.string().allow(''),
                view_time: Joi.string().required().allow(''),
                answer_id: Joi.string().required().allow(''),
                answer_video: Joi.string().required().allow(''),
                page: Joi.string(),
            },
        },
        question: {
            // addAnswerFeedbackForMatchedQuestionsAction
            body: {
                p_id: Joi.string().allow('').required(),
                student_id: Joi.string().required(),
                feedback: Joi.string().required(),
                rating: Joi.string().required(),
                answer_id: Joi.string().required(),
                question_id: Joi.string().required(),
            },
        },
        submitFeedback: {
            body: {
                type: Joi.string().required(),
                campaign_id: Joi.string().allow(''),
                feedback_id: Joi.string().allow(''),
                rating: Joi.string().allow(''),
                options: Joi.string().allow(''),
                question_id: Joi.string().allow(''),
            },
        },
    },
};
