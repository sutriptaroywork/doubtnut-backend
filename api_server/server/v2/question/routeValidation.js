const Joi = require('joi');

module.exports = {
    question: {
        ask: {
            body: {
                question_text: Joi.string().allow('').default(null),
                question_image: Joi.string().allow('').default(null),
                student_id: Joi.string().allow('').default(null),
                chapter: Joi.string().allow('').default(null),
                question: Joi.string().allow('').default(null),
                subject: Joi.string().allow('').default(null),
                class: Joi.string().allow('').default(null),
                locale: Joi.string().allow('').default(null),
            },
        },
        question_meta: {
            body: {
                tag_data_obj: Joi.string().required(),
                page: Joi.string().required(),
                // count: Joi.string().required()
            },
        },
        filter: {
            body: {
            // params: Joi.string().required()
            },
        },
        filter2: {
            body: {
                params: Joi.string().required(),
                page: Joi.string().required(),
                count: Joi.string().required(),
            },
        },
        askExpert: {
            body: {
                question_id: Joi.string().required(),
            },
        },
        getSearchResults: {
            ocr_text: Joi.string().required(),
        },
        getMatchesByFileName: {
            query: {
                file_name: Joi.string().required(),
            },
        },
        postMatchesByFileName: {
            body: {
                question_text: Joi.string().allow('').default(null),
                question_image: Joi.string().allow('').default(null),
                student_id: Joi.string().allow('').default(null),
                chapter: Joi.string().allow('').default(null),
                question: Joi.string().allow('').default(null),
                subject: Joi.string().allow('').default(null),
                class: Joi.string().allow('').default(null),
                locale: Joi.string().allow('').default(null),
            },
        },
        updateSearchResults: {
            ocr_text: Joi.string().required(),
            qid: Joi.string().required(),
        },
        getChaptersByQid: {
            qid: Joi.string().required(),
        },
        jeeMains2019: {
            body: {
                exam: Joi.string().required(),
                page: Joi.number().required(),
            },
        },
        jeeMains2019Answers: {
            body: {
                exam: Joi.string().required(),
                page: Joi.number().required(),
            },
        },
        microConcept: {
            body: {
                page: Joi.number().required(),
            },
        },
        whatsappRating: {
            body: {
                question_id: Joi.string().required(),
                student_id: Joi.string().required(),
                yes_no: Joi.string().required(),
                rating: Joi.string().required(),
                report: Joi.string().required(),
            },
        },
    },
};
