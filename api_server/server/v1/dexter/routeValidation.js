const Joi = require('joi');

module.exports = {
    route: {
        questions: {
            body: {
                chapter_alias: Joi.string().required(),
                test_uuid: Joi.string().required(),
            },
        },
    },
};
