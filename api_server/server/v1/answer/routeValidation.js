const Joi = require('joi');

module.exports = {
    answer: {
        viewAnswerByQuestionId: {
            body: {
                qid: Joi.string().required(),
                sid: Joi.string().required(),
                parent_id: Joi.string().required(),
            },
        },
        viewAnswerByQuestionIdNew: {
            body: {
                qid: Joi.string().required(),
                sid: Joi.string().required(),
                parent_id: Joi.string().required(),
                session_id: Joi.string(),
                tab_id: Joi.string().default('0'),
                source: Joi.string().required(),
            },
        },
        updateAnswerView: {
            body: {
                view_id: Joi.string().required(),
                video_time: Joi.string().required(),
                is_back: Joi.string().required(),
                engage_time: Joi.string().required(),
            },
        },
    },
    downloadVideo: {
        post: {
            body: {
                question_id: Joi.string().required(),
                answer_id: Joi.string().required(),
            },
        },
    },
    similarBottomSheet: {
        params: {
            question_id: Joi.string().required(),
        },
    },
    ncertVideos: {
        body: {
            playlist_id: Joi.string().required(),
            type: Joi.string().required(),
            supported_media_type: Joi.array().items(Joi.string()).required(),
            question_id: Joi.string().allow(''),
        },
    },
    storeFeedback: {
        body: {
            question_id: Joi.string().required(),
        },
    },
};
