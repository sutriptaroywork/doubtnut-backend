const Joi = require('joi');

module.exports = {
    createGroup: {
        post: {
            body: {
                group_name: Joi.string().required(),
                group_image: Joi.string(),
            },
        },
    },
    leaveGroup: {
        post: {
            body: {
                group_id: Joi.string().required(),
            },
        },
    },
    block: {
        post: {
            body: {
                group_id: Joi.string().required(),
                student_id: Joi.number().required(),
            },
        },
    },
    updateGroupInfo: {
        post: {
            body: {
                group_id: Joi.string().required(),
                group_name: Joi.string(),
                group_image: Joi.string(),
            },
        },
    },
    groupInfo: {
        post: {
            body: {
                group_id: Joi.string().required(),
            },
        },
    },
    invite: {
        post: {
            body: {
                group_id: Joi.string().required(),
                invitee: Joi.number().required(),
            },
        },
    },
    accept: {
        post: {
            body: {
                group_id: Joi.string().required(),
                inviter: Joi.number().required(),
            },
        },
    },
    invitationStatus: {
        post: {
            body: {
                invitee: Joi.number().required(),
            },
        },
    },
    signedUploadURL: {
        body: {
            params: {
                content_type: Joi.string().required(),
                file_ext: Joi.string().required(),
                file_name: Joi.string().required(),
            },
        },
    },
    mute: {
        post: {
            body: {
                group_id: Joi.string(),
                type: Joi.number().required(), // 0 - mute 1-unmute
            },
        },
    },
    updateGroupCache: {
        post: {
            body: {
                group_id: Joi.string().required(),
                field: Joi.string().required(),
            },
        },
    },
};
