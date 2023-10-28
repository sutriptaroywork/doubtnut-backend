const coursedetailpageschema = {
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
                is_vip: {
                    type: 'boolean',
                },
                tabs: {
                    type: 'array',
                    items: [
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                },
                                text: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'text',
                            ],
                        },
                    ],
                },
                widget_view_plan_button: {
                    type: 'object',
                    properties: {
                        text_one: {
                            type: 'string',
                        },
                        text_one_size: {
                            type: 'string',
                        },
                        text_one_color: {
                            type: 'string',
                        },
                        text_two: {
                            type: 'string',
                        },
                        text_two_size: {
                            type: 'string',
                        },
                        text_two_color: {
                            type: 'string',
                        },
                        bg_color: {
                            type: 'string',
                        },
                        show_icon_end: {
                            type: 'string',
                        },
                        deep_link: {
                            type: 'string',
                        },
                        extra_params: {
                            type: 'object',
                            properties: {
                                assortment_id: {
                                    type: 'integer',
                                },
                            },
                            required: [
                                'assortment_id',
                            ],
                        },
                    },
                    required: [
                        'text_one',
                        'text_one_size',
                        'text_one_color',
                        'text_two',
                        'text_two_size',
                        'text_two_color',
                        'bg_color',
                        'show_icon_end',
                        'deep_link',
                        'extra_params',
                    ],
                },
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
                                        title: {
                                            type: 'string',
                                        },
                                        subtitle: {
                                            type: 'string',
                                        },
                                        tag_one_text: {
                                            type: 'string',
                                        },
                                        tag_one_bg_color: {
                                            type: 'string',
                                        },
                                        tag_one_deeplink: {
                                            type: 'string',
                                        },
                                        tag_two_text: {
                                            type: 'string',
                                        },
                                        tag_two_bg_color: {
                                            type: 'string',
                                        },
                                        tag_two_deeplink: {
                                            type: 'string',
                                        },
                                        assortment_id: {
                                            type: 'integer',
                                        },
                                        download_url: {
                                            type: 'string',
                                        },
                                        share_data: {
                                            type: 'object',
                                            properties: {
                                                shareable_message: {
                                                    type: 'string',
                                                },
                                                control_params: {
                                                    type: 'object',
                                                    properties: {
                                                        id: {
                                                            type: 'string',
                                                        },
                                                        student_class: {
                                                            type: 'string',
                                                        },
                                                        referrer_student_id: {
                                                            type: 'string',
                                                        },
                                                    },
                                                    required: [
                                                        'id',
                                                        'student_class',
                                                        'referrer_student_id',
                                                    ],
                                                },
                                                feature_name: {
                                                    type: 'string',
                                                },
                                                channel: {
                                                    type: 'string',
                                                },
                                                campaign_id: {
                                                    type: 'string',
                                                },
                                                share_image: {
                                                    type: 'string',
                                                },
                                            },
                                            required: [
                                                'shareable_message',
                                                'control_params',
                                                'feature_name',
                                                'channel',
                                                'campaign_id',
                                                'share_image',
                                            ],
                                        },
                                    },
                                },
                                extra_params: {
                                    type: 'object',
                                    properties: {
                                        assortment_id: {
                                            type: 'integer',
                                        },
                                    },
                                    required: [
                                        'assortment_id',
                                    ],
                                },
                            },
                            required: [
                                'type',
                                'data',
                            ],
                        },
                    ],
                },
                fab: {
                    type: 'object',
                    properties: {
                        image_url: {
                            type: 'string',
                        },
                        deeplink: {
                            type: 'string',
                        },
                    },
                    required: [
                        'image_url',
                        'deeplink',
                    ],
                },
                assortment_id: {
                    type: 'string',
                },
                pop_up_deeplink: {
                    type: 'string',
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

module.exports = coursedetailpageschema;
