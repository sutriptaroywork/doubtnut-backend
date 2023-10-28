const schemas = {};

schemas.defaultResponse = {
    title: 'Ask Reponse v10',
    type: 'object',
    required: ['meta', 'data'],
    properties: {
        meta: {
            type: 'object',
            required: ['code', 'success', 'message'],
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
        },
        data: {
            type: 'object',
            required: [],
            properties: {
                question_id: {
                    type: 'integer',
                },
                ocr_text: {
                    type: 'string',
                },
                question_image: {
                    type: 'string',
                },
                matched_questions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: [],
                        properties: {
                            _index: {
                                type: 'string',
                            },
                            _type: {
                                type: 'string',
                            },
                            _id: {
                                type: 'string',
                            },
                            _score: {
                                type: 'number',
                            },
                            _source: {
                                type: 'object',
                                required: [],
                                properties: {
                                    ocr_text: {
                                        type: 'string',
                                    },
                                    is_answered: {
                                        type: 'integer',
                                    },
                                    is_text_answered: {
                                        type: 'integer',
                                    },
                                    subject: {
                                        type: 'string',
                                    },
                                    chapter: {
                                        type: 'integer',
                                    },
                                    video_language: {
                                        type: 'string',
                                    },
                                    exact_match: {
                                        type: 'boolean',
                                    },
                                    views: {
                                        type: 'integer',
                                    },
                                    likes: {
                                        type: 'integer',
                                    },
                                    share: {
                                        type: 'integer',
                                    },
                                    duration: {
                                        type: 'string',
                                    },
                                    share_message: {
                                        type: 'string',
                                    },
                                    bg_color: {
                                        type: 'string',
                                    },
                                    isLiked: {
                                        type: 'boolean',
                                    },
                                    ref: {
                                        type: ['string', 'null'],
                                        required: [],
                                    },
                                },
                            },
                            partial_score: {
                                type: 'integer',
                            },
                            resource_type: {
                                type: 'string',
                            },
                            answer_id: {
                                type: 'integer',
                            },
                            answer_video: {
                                type: 'string',
                            },
                            html: {
                                type: 'string',
                            },
                            question_thumbnail: {
                                type: 'string',
                            },
                            class: {
                                type: ['object', 'null'],
                                required: [],
                                properties: {
                                    type: {
                                        type: 'string',
                                    },
                                },
                            },
                            chapter: {
                                type: ['object', 'null'],
                                required: [],
                                properties: {
                                    type: {
                                        type: 'string',
                                    },
                                },
                            },
                            difficulty_level: {
                                type: ['object', 'null'],
                                required: [],
                                properties: {
                                    type: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                },
                matched_count: {
                    type: 'integer',
                },
                handwritten: {
                    type: 'integer',
                },
                is_only_equation: {
                    type: 'boolean',
                },
                is_exact_match: {
                    type: 'boolean',
                },
                tab: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: [],
                        properties: {
                            subject: {
                                type: 'string',
                            },
                            display: {
                                type: 'string',
                            },
                        },
                    },
                },
                notification: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: [],
                        properties: {
                            event: {
                                type: 'string',
                            },
                            title: {
                                type: 'string',
                            },
                            message: {
                                type: 'string',
                            },
                            image: {
                                type: 'string',
                            },
                            data: {
                                type: 'string',
                            },
                        },
                    },
                },
                feedback: {
                    type: 'object',
                    required: [],
                    properties: {
                        feedback_text: {
                            type: 'string',
                        },
                        is_show: {
                            type: 'integer',
                        },
                        bg_color: {
                            type: 'string',
                        },
                    },
                },
                platform_tabs: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: [],
                        properties: {
                            key: {
                                type: 'string',
                            },
                            display: {
                                type: 'string',
                            },
                        },
                    },
                },
                is_subscribed: {
                    type: 'integer',
                },
                user_language_video_heading: {
                    type: 'string',
                },
                other_language_video_heading: {
                    type: 'string',
                },
                more_user_language_videos_text: {
                    type: 'string',
                },
                cdn_video_base_url: {
                    type: 'string',
                },
                is_blur: {
                    type: ['string', 'null'],
                    required: [],
                },
                youtube_flag: {
                    type: 'string',
                },
            },
        },
    },
};

module.exports = schemas;
