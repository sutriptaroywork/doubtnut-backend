const schema = {
    type: 'object',
    properties: {
        meta: {
            type: 'object',
            properties: {
                code: {
                    type: 'integer',
                },
                success: {
                    type: 'boolean',
                },
                message: {
                    type: 'string',
                },
            },
            required: [
                'code',
                'success',
                'message',
            ],
        },
        data: {
            type: 'object',
            properties: {
                student_id: {
                    type: 'integer',
                },
                token: {
                    type: 'string',
                },
                onboarding_video: {
                    type: 'string',
                },
                intro: {
                    type: 'array',
                    items: [
                        {
                            type: 'object',
                            properties: {
                                question_id: {
                                    type: 'integer',
                                },
                                video: {
                                    type: 'string',
                                },
                                type: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'question_id',
                                'video',
                                'type',
                            ],
                        },
                    ],
                },
                student_username: {
                    type: 'string',
                },
                is_new_user: {
                    type: 'boolean',
                },
            },
            required: [
                'student_id',
                'token',
                'onboarding_video',
                'intro',
                'student_username',
                'is_new_user',
            ],
        },
    },
    required: [
        'meta',
        'data',
    ],
};

module.exports = schema;
