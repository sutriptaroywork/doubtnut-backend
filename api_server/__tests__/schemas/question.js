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
                question_id: {
                    type: 'string',
                },
                ocr_text: {
                    type: 'string',
                },
                question_image: {
                    type: 'string',
                },
                matched_questions: {
                    type: 'array',
                    items: [
                        {
                            type: 'object',
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
                                    properties: {
                                        chapter: {
                                            type: 'string',
                                        },
                                        chapter_alias: {
                                            type: 'string',
                                        },
                                        is_answered: {
                                            type: 'integer',
                                        },
                                        ocr_text: {
                                            type: 'string',
                                        },
                                        ocr_text_hi: {
                                            type: 'string',
                                        },
                                        is_text_answered: {
                                            type: 'integer',
                                        },
                                        subject: {
                                            type: 'string',
                                        },
                                        video_language: {
                                            type: 'string',
                                        },
                                        thumbnail_language: {
                                            type: 'string',
                                        },
                                        package_language: {
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
                                        },
                                        subject_title: {
                                            type: 'string',
                                        },
                                        subject_icon_link: {
                                            type: 'string',
                                        },
                                    },
                                    required: [
                                        'chapter',
                                        'chapter_alias',
                                        'is_answered',
                                        'ocr_text',
                                        'ocr_text_hi',
                                        'is_text_answered',
                                        'subject',
                                        'thumbnail_language',
                                        'package_language',
                                        'exact_match',
                                        'views',
                                        'likes',
                                        'share',
                                        'duration',
                                        'share_message',
                                        'bg_color',
                                        'isLiked',
                                        'ref',
                                    ],
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
                                    type: ['string', 'null'],
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                difficulty_level: {
                                    type: ['string', 'null'],
                                },
                                video_url: {
                                    type: 'string',
                                },
                                cdn_base_url: {
                                    type: 'string',
                                },
                                fallback_url: {
                                    type: 'string',
                                },
                                hls_timeout: {
                                    type: 'integer',
                                },
                                string_diff_text: {
                                    type: 'string',
                                },
                                string_diff_text_bg_color: {
                                    type: 'string',
                                },
                            },
                            required: [
                                '_index',
                                '_type',
                                '_id',
                                '_source',
                                'partial_score',
                                'resource_type',
                                'answer_id',
                                'answer_video',
                                'question_thumbnail',
                                'class',
                                'chapter',
                                'difficulty_level',
                                'string_diff_text',
                                'string_diff_text_bg_color',
                            ],
                        },
                    ],
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
                    items: {},
                },
                notification: {
                    type: 'array',
                    items: {},
                },
                feedback: {
                    type: 'object',
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
                    required: [
                        'feedback_text',
                        'is_show',
                        'bg_color',
                    ],
                },
                is_p2p_available: {
                    type: 'boolean',
                },
                p2p_thumbnail_images: {
                    type: 'array',
                    items: [
                        {
                            type: 'string',
                        },
                    ],
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
                    type: ['boolean', 'null'],
                },
                is_image_blur: {
                    type: 'boolean',
                },
                is_image_handwritten: {
                    type: 'boolean',
                },
            },
            required: [
                'question_id',
                'ocr_text',
                'question_image',
                'matched_questions',
                'matched_count',
                'handwritten',
                'is_only_equation',
                'is_exact_match',
                'tab',
                'notification',
                'feedback',
                'is_p2p_available',
                'p2p_thumbnail_images',
                'cdn_video_base_url',
                'is_blur',
            ],
        },
    },
    required: [
        'meta',
        'data',
    ],
};

module.exports = schema;
