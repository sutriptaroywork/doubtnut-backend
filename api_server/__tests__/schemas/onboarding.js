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
                is_final_submit: {
                    type: 'boolean',
                },
                ask_question: {
                    type: 'boolean',
                },
                ask_button_text: {
                    type: 'string',
                },
                ask_button_active_message: {
                    type: 'string',
                },
                ask_button_inactive_message: {
                    type: 'string',
                },
                steps: {
                    type: 'array',
                    items: [
                        {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                },
                                image: {
                                    type: 'string',
                                },
                                title: {
                                    type: 'string',
                                },
                                message: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'type',
                                'image',
                                'title',
                                'message',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                },
                                title: {
                                    type: 'string',
                                },
                                error_message: {
                                    type: 'string',
                                },
                                is_active: {
                                    type: 'boolean',
                                },
                                is_multi_select: {
                                    type: 'boolean',
                                },
                                is_submitted: {
                                    type: 'boolean',
                                },
                                image: {
                                    type: 'string',
                                },
                                message: {
                                    type: 'string',
                                },
                                step_items: {
                                    type: 'array',
                                    items: [
                                        {
                                            type: 'object',
                                            properties: {
                                                id: {
                                                    type: 'integer',
                                                },
                                                title: {
                                                    type: 'string',
                                                },
                                                code: {
                                                    type: 'integer',
                                                },
                                                type: {
                                                    type: 'string',
                                                },
                                                is_active: {
                                                    type: 'boolean',
                                                },
                                                sub_title: {
                                                    type: 'null',
                                                },
                                            },
                                            required: [
                                                'id',
                                                'title',
                                                'code',
                                                'type',
                                                'is_active',
                                                'sub_title',
                                            ],
                                        },
                                    ],
                                },
                                progress_details: {
                                    type: 'null',
                                },
                            },
                            required: [
                                'type',
                                'title',
                                'error_message',
                                'is_active',
                                'is_multi_select',
                                'is_submitted',
                                'image',
                                'message',
                                'step_items',
                                'progress_details',
                            ],
                        },
                    ],
                },
            },
            required: [
                'is_final_submit',
                'ask_question',
                'ask_button_text',
                'ask_button_active_message',
                'ask_button_inactive_message',
                'steps',
            ],
        },
    },
    required: [
        'meta',
        'data',
    ],
};

module.exports = schema;
