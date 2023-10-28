const Joi = require('joi');

module.exports = {
    questions: {
        post: {
            body: {
                chapter_alias: Joi.string().required(),
                is_whatsapp: Joi.number(),
            },
        },
    },
    leaderboard: {
        post: {
            body: {
                page: Joi.number().required(),
                id: Joi.number().required(), // 1 - daily or 2 - weekly
            },
        },
    },
    friendsTabs: {
        post: {
            body: {
                topic: Joi.string().required(),
            },
        },
    },
    friends: {
        post: {
            body: {
                id: Joi.number().required(), // 1 - following or 2 - followers
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
    invite: {
        post: {
            body: {
                student_ids: Joi.array().required(),
                topic: Joi.string().required(),
                game_id: Joi.string().required(),
            },
        },
    },
    numberInvite: {
        post: {
            body: {
                mobile: Joi.number().required(),
                topic: Joi.string().required(),
                game_id: Joi.string().required(),
            },
        },
    },
    acceptInvite: {
        post: {
            body: {
                inviter_id: Joi.number().required(),
                is_inviter_online: Joi.number().required(),
                game_id: Joi.string().required(),
                chapter_alias: Joi.string().required(),
            },
        },
    },
    result: {
        post: {
            body: {
                inviter_id: Joi.number(),
                // invitee_id: Joi.defaults(null),
                game_id: Joi.string().required(),
                total_score: Joi.number().required(),
                inviter_score: Joi.number().required(),
                invitee_score: Joi.number().required(),
                inviter_correct_questions: Joi.array().required(),
                invitee_correct_questions: Joi.array().required(),
                all_questions: Joi.array().required(),
                topic: Joi.string().required(),
                is_quit: Joi.boolean().required(),
            },
        },
    },
    quizHistory: {
        post: {
            body: {
                page: Joi.number().required(),
            },
        },
    },
    previousResult: {
        post: {
            body: {
                game_id: Joi.string().required(),
            },
        },
    },
    getWidget: {
        post: {
            body: {
                chapter: Joi.string().required(),
            },
        },
    },
    generateGameId: {
        post: {
            body: {
                invitee_id: Joi.number().required(),
            },
        },
    },
};
