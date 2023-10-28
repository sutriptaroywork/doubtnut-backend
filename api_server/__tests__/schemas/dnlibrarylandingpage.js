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
            type: 'array',
            items: [
                {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                        },
                        view_type: {
                            type: 'string',
                        },
                        list: {
                            type: 'array',
                            items: {},
                        },
                    },
                    required: [
                        'title',
                        'view_type',
                        'list',
                    ],
                },
                {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                        },
                        view_type: {
                            type: 'string',
                        },
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
                                            type: 'string',
                                        },
                                        image_url: {
                                            type: 'string',
                                        },
                                        is_first: {
                                            type: 'integer',
                                        },
                                        is_last: {
                                            type: 'integer',
                                        },
                                        is_admin_created: {
                                            type: 'integer',
                                        },
                                        parent: {
                                            type: 'null',
                                        },
                                        resource_type: {
                                            type: 'string',
                                        },
                                        resource_description: {
                                            type: 'string',
                                        },
                                        resource_path: {
                                            type: 'null',
                                        },
                                        student_class: {
                                            type: 'string',
                                        },
                                        student_course: {
                                            type: 'string',
                                        },
                                        playlist_order: {
                                            type: 'integer',
                                        },
                                        student_id: {
                                            type: 'null',
                                        },
                                        empty_playlist_id: {
                                            type: 'null',
                                        },

                                        size: {
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
                                        'is_admin_created',
                                        'parent',
                                        'resource_type',
                                        'resource_description',
                                        'resource_path',
                                        'student_class',
                                        'student_course',
                                        'playlist_order',
                                        'student_id',
                                        'empty_playlist_id',

                                        'size',
                                    ],
                                },
                            ],
                        },
                    },
                    required: [
                        'title',
                        'view_type',
                        'list',
                    ],
                },
            ],
        },
    },
    required: [
        'meta',
        'data',
    ],
};

module.exports = schema;
