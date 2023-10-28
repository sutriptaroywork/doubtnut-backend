const coursehomepageschema = {
    type: 'object',
    properties: {
        meta: {
            type: 'object',
            properties: {
                code: {
                    type: 'integer',
                },
                message: {
                    type: 'string',
                },
            },
            required: [
                'code',
                'message',
            ],
        },
        data: {
            type: 'object',
            properties: {
                widgets: {
                    type: 'array',
                    items: [
                        {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                },
                                data: {
                                    type: 'object',
                                    properties: {
                                        items: {
                                            type: 'array',
                                            items: [
                                                {
                                                    type: 'object',
                                                    properties: {
                                                        id: {
                                                            type: ['integer', 'string', 'null'],
                                                        },
                                                        image_url: {
                                                            type: 'string',
                                                        },
                                                        deeplink: {
                                                            type: 'string',
                                                        },
                                                    },
                                                    required: [
                                                        'id',
                                                        'image_url',
                                                        'deeplink',
                                                    ],
                                                },
                                            ],
                                        },
                                        margin: {
                                            type: 'boolean',
                                        },
                                        ratio: {
                                            type: ['string', 'null'],
                                        },
                                        auto_scroll_time_in_sec: {
                                            type: ['integer', 'null'],
                                        },
                                    },
                                },
                            },
                            required: [
                                'type',
                                'data',
                            ],
                        },
                    ],
                },
            },
            required: [
                'widgets',
            ],
        },
    },
    required: [
        'meta',
        'data',
    ],
};

module.exports = coursehomepageschema;
