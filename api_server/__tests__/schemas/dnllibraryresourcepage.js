const resourceschema = {
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
                library_playlist_id: {
                    type: 'string',
                },
                header: {
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
                                description: {
                                    type: 'string',
                                },
                                image_url: {
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
                                is_admin_created: {
                                    type: 'integer',
                                },
                                parent: {
                                    type: 'string',
                                },
                                resource_path: {
                                    type: 'string',
                                },
                                student_class: {
                                    type: 'string',
                                },
                                student_id: {
                                    type: 'null',
                                },
                                is_active: {
                                    type: 'integer',
                                },
                                is_delete: {
                                    type: 'integer',
                                },
                                playlist_order: {
                                    type: 'integer',
                                },
                                master_parent: {
                                    type: 'string',
                                },
                                subject: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'name',
                                'description',
                                'image_url',
                                'is_first',
                                'is_last',
                                'empty_text',
                                'is_admin_created',
                                'parent',
                                'resource_path',
                                'student_class',
                                'student_id',
                                'is_active',
                                'is_delete',
                                'playlist_order',
                                'master_parent',
                                'subject',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer',
                                },
                                name: {
                                    type: 'string',
                                },
                                description: {
                                    type: 'string',
                                },
                                image_url: {
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
                                is_admin_created: {
                                    type: 'integer',
                                },
                                parent: {
                                    type: 'string',
                                },
                                resource_path: {
                                    type: 'string',
                                },
                                student_class: {
                                    type: 'string',
                                },
                                student_id: {
                                    type: 'null',
                                },
                                is_active: {
                                    type: 'integer',
                                },
                                is_delete: {
                                    type: 'integer',
                                },
                                playlist_order: {
                                    type: 'integer',
                                },
                                master_parent: {
                                    type: 'string',
                                },
                                subject: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'name',
                                'description',
                                'image_url',
                                'is_first',
                                'is_last',
                                'empty_text',
                                'is_admin_created',
                                'parent',
                                'resource_path',
                                'student_class',
                                'student_id',
                                'is_active',
                                'is_delete',
                                'playlist_order',
                                'master_parent',
                                'subject',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer',
                                },
                                name: {
                                    type: 'string',
                                },
                                description: {
                                    type: 'string',
                                },
                                image_url: {
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
                                is_admin_created: {
                                    type: 'integer',
                                },
                                parent: {
                                    type: 'string',
                                },
                                resource_path: {
                                    type: 'string',
                                },
                                student_class: {
                                    type: 'string',
                                },
                                student_id: {
                                    type: 'null',
                                },
                                is_active: {
                                    type: 'integer',
                                },
                                is_delete: {
                                    type: 'integer',
                                },
                                playlist_order: {
                                    type: 'integer',
                                },
                                master_parent: {
                                    type: 'string',
                                },
                                subject: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'name',
                                'description',
                                'image_url',
                                'is_first',
                                'is_last',
                                'empty_text',
                                'is_admin_created',
                                'parent',
                                'resource_path',
                                'student_class',
                                'student_id',
                                'is_active',
                                'is_delete',
                                'playlist_order',
                                'master_parent',
                                'subject',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer',
                                },
                                name: {
                                    type: 'string',
                                },
                                description: {
                                    type: 'string',
                                },
                                image_url: {
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
                                is_admin_created: {
                                    type: 'integer',
                                },
                                parent: {
                                    type: 'string',
                                },
                                resource_path: {
                                    type: 'string',
                                },
                                student_class: {
                                    type: 'string',
                                },
                                student_id: {
                                    type: 'null',
                                },
                                is_active: {
                                    type: 'integer',
                                },
                                is_delete: {
                                    type: 'integer',
                                },
                                playlist_order: {
                                    type: 'integer',
                                },
                                master_parent: {
                                    type: 'string',
                                },
                                subject: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'name',
                                'description',
                                'image_url',
                                'is_first',
                                'is_last',
                                'empty_text',
                                'is_admin_created',
                                'parent',
                                'resource_path',
                                'student_class',
                                'student_id',
                                'is_active',
                                'is_delete',
                                'playlist_order',
                                'master_parent',
                                'subject',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer',
                                },
                                name: {
                                    type: 'string',
                                },
                                description: {
                                    type: 'string',
                                },
                                image_url: {
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
                                is_admin_created: {
                                    type: 'integer',
                                },
                                parent: {
                                    type: 'string',
                                },
                                resource_path: {
                                    type: 'string',
                                },
                                student_class: {
                                    type: 'string',
                                },
                                student_id: {
                                    type: 'null',
                                },
                                is_active: {
                                    type: 'integer',
                                },
                                is_delete: {
                                    type: 'integer',
                                },
                                playlist_order: {
                                    type: 'integer',
                                },
                                master_parent: {
                                    type: 'string',
                                },
                                subject: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'name',
                                'description',
                                'image_url',
                                'is_first',
                                'is_last',
                                'empty_text',
                                'is_admin_created',
                                'parent',
                                'resource_path',
                                'student_class',
                                'student_id',
                                'is_active',
                                'is_delete',
                                'playlist_order',
                                'master_parent',
                                'subject',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer',
                                },
                                name: {
                                    type: 'string',
                                },
                                description: {
                                    type: 'string',
                                },
                                image_url: {
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
                                is_admin_created: {
                                    type: 'integer',
                                },
                                parent: {
                                    type: 'string',
                                },
                                resource_path: {
                                    type: 'string',
                                },
                                student_class: {
                                    type: 'string',
                                },
                                student_id: {
                                    type: 'null',
                                },
                                is_active: {
                                    type: 'integer',
                                },
                                is_delete: {
                                    type: 'integer',
                                },
                                playlist_order: {
                                    type: 'integer',
                                },
                                master_parent: {
                                    type: 'string',
                                },
                                subject: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'name',
                                'description',
                                'image_url',
                                'is_first',
                                'is_last',
                                'empty_text',
                                'is_admin_created',
                                'parent',
                                'resource_path',
                                'student_class',
                                'student_id',
                                'is_active',
                                'is_delete',
                                'playlist_order',
                                'master_parent',
                                'subject',
                            ],
                        },
                    ],
                },
                playlist: {
                    type: 'array',
                    items: [
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer',
                                },
                                key_name: {
                                    type: 'string',
                                },
                                class: {
                                    type: 'string',
                                },
                                created_at: {
                                    type: 'string',
                                },
                                updated_at: {
                                    type: 'string',
                                },
                                is_active: {
                                    type: 'integer',
                                },
                                key_hindi_value: {
                                    type: 'string',
                                },
                                image_url: {
                                    type: 'string',
                                },
                                description: {
                                    type: 'string',
                                },
                                button_text: {
                                    type: 'string',
                                },
                                button_bg_color: {
                                    type: 'string',
                                },
                                action_activity: {
                                    type: 'string',
                                },
                                action_data: {
                                    type: 'object',
                                    properties: {
                                        url: {
                                            type: 'string',
                                        },
                                    },
                                    required: [
                                        'url',
                                    ],
                                },
                                resource_type: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'key_name',
                                'class',
                                'created_at',
                                'updated_at',
                                'is_active',
                                'key_hindi_value',
                                'image_url',
                                'description',
                                'button_text',
                                'button_bg_color',
                                'action_activity',
                                'action_data',
                                'resource_type',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: ['integer', 'null'],
                                },
                                question_id: {
                                    type: ['integer', 'null'],
                                },
                                intern_id: {
                                    type: ['integer', 'null'],
                                },
                                assigned_to: {
                                    type: ['string', 'null'],
                                },
                                class: {
                                    type: 'string',
                                },
                                chapter: {
                                    type: ['string', 'null'],
                                },
                                subtopic: {
                                    type: ['string', 'null'],
                                },
                                microconcept: {
                                    type: ['string', 'null'],
                                },
                                level: {
                                    type: 'null',
                                },
                                target_course: {
                                    type: 'null',
                                },
                                package: {
                                    type: 'null',
                                },
                                type: {
                                    type: 'null',
                                },
                                q_options: {
                                    type: 'null',
                                },
                                q_answer: {
                                    type: 'null',
                                },
                                diagram_type: {
                                    type: 'null',
                                },
                                concept_type: {
                                    type: 'null',
                                },
                                chapter_type: {
                                    type: 'null',
                                },
                                we_type: {
                                    type: 'null',
                                },
                                ei_type: {
                                    type: 'null',
                                },
                                aptitude_type: {
                                    type: 'null',
                                },
                                pfs_type: {
                                    type: 'null',
                                },
                                symbol_type: {
                                    type: 'null',
                                },
                                doubtnut_recommended: {
                                    type: 'null',
                                },
                                secondary_class: {
                                    type: 'null',
                                },
                                secondary_chapter: {
                                    type: 'null',
                                },
                                secondary_subtopic: {
                                    type: 'null',
                                },
                                secondary_microconcept: {
                                    type: 'null',
                                },
                                video_quality: {
                                    type: 'null',
                                },
                                audio_quality: {
                                    type: 'null',
                                },
                                language: {
                                    type: 'null',
                                },
                                ocr_quality: {
                                    type: 'null',
                                },
                                timestamp: {
                                    type: ['string', 'null'],
                                },
                                is_skipped: {
                                    type: ['integer', 'null'],
                                },
                                subject: {
                                    type: 'null',
                                },
                                questions_title: {
                                    type: 'null',
                                },
                                meta_tags: {
                                    type: 'null',
                                },
                                ocr_text: {
                                    type: 'string',
                                },
                                doubt: {
                                    type: 'string',
                                },
                                question: {
                                    type: 'string',
                                },
                                packages: {
                                    type: 'null',
                                },
                                resource_type: {
                                    type: 'string',
                                },
                                duration: {
                                    type: 'string',
                                },
                                bg_color: {
                                    type: 'string',
                                },
                                share: {
                                    type: 'integer',
                                },
                                like: {
                                    type: 'integer',
                                },
                                views: {
                                    type: 'integer',
                                },
                                share_message: {
                                    type: 'string',
                                },
                                isLiked: {
                                    type: 'boolean',
                                },
                                thumbnail_image: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'id',
                                'question_id',
                                'intern_id',
                                'assigned_to',
                                'class',
                                'chapter',
                                'subtopic',
                                'microconcept',
                                'level',
                                'target_course',
                                'package',
                                'type',
                                'q_options',
                                'q_answer',
                                'diagram_type',
                                'concept_type',
                                'chapter_type',
                                'we_type',
                                'ei_type',
                                'aptitude_type',
                                'pfs_type',
                                'symbol_type',
                                'doubtnut_recommended',
                                'secondary_class',
                                'secondary_chapter',
                                'secondary_subtopic',
                                'secondary_microconcept',
                                'video_quality',
                                'audio_quality',
                                'language',
                                'ocr_quality',
                                'timestamp',
                                'is_skipped',
                                'subject',
                                'questions_title',
                                'meta_tags',
                                'ocr_text',
                                'doubt',
                                'question',
                                'packages',
                                'resource_type',
                                'duration',
                                'bg_color',
                                'share',
                                'like',
                                'views',
                                'share_message',
                                'isLiked',
                                'thumbnail_image',
                            ],
                        },
                    ],
                },
            },
            required: [
                'library_playlist_id',
                'header',
                'playlist',
            ],
        },
    },
    required: [
        'meta',
        'data',
    ],
};
module.exports = resourceschema;
