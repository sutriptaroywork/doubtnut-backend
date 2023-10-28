const playlistschema = {
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
                list: {
                    type: 'array',
                    items: [
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer',
                                },
                                name: {
                                    type: 'string',
                                },
                                view_type: {
                                    type: 'string',
                                },
                                description: {
                                    type: 'null',
                                },
                                is_first: {
                                    type: 'integer',
                                },
                                is_last: {
                                    type: 'integer',
                                },
                                empty_text: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'name',
                                'view_type',
                                'description',
                                'image_url',
                                'is_first',
                                'is_last',
                                'empty_text',
                                'resource_type',
                                'resource_path',
                            ],
                        },
                    ],
                },
                headers: {
                    type: 'array',
                    items: [
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer',
                                },
                                name: {
                                    type: 'string',
                                },
                                view_type: {
                                    type: 'string',
                                },
                                description: {
                                    type: 'null',
                                },
                                is_first: {
                                    type: 'integer',
                                },
                                is_last: {
                                    type: 'integer',
                                },
                                empty_text: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                resource_path: {
                                    type: 'null',
                                },
                            },
                            required: [
                                'id',
                                'name',
                                'view_type',
                                'description',
                                'image_url',
                                'is_first',
                                'is_last',
                                'empty_text',
                                'resource_type',
                                'resource_path',
                            ],
                        },
                    ],
                },
            },
        },
    },
    required: [
        'meta',
        'data',
    ],
};
module.exports = playlistschema;
