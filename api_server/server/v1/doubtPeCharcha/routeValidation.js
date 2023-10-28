const Joi = require('joi');

module.exports = {
    listMembers: {
        post: {
            body: {
                room_id: Joi.string().required(),
            },
        },
    },
    feedback: {
        post: {
            body: {
                room_id: Joi.string().required(),
                rating: Joi.number().min(1).max(5),
                reason: Joi.string(),
                rating_for_student: Joi.number(),
            },
        },
    },
    addMember: {
        post: {
            body: {
                room_id: Joi.string().required(),
            },
        },
    },
    deactivate: {
        post: {
            body: {
                room_id: Joi.string().required(),
            },
        },
    },
    question_thumbnail: {
        params: {
            question_id: Joi.number().required(),
        },
    },
    doubts: {
        post: {
            type: Joi.string().required(),
        },
    },
    helperData: {
        post: {
            room_id: Joi.string().required(),
        },
    },
    similarSolvedDoubts: {
        post: {
            question_id: Joi.number().required(),
        },
    },
};
