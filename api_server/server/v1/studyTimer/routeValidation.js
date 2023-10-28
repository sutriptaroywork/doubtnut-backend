const Joi = require('joi');

module.exports = {
    result: {
        post: {
            label: Joi.string().required(),
            total_study_time: Joi.number().required(),
            total_break_time: Joi.number().required(),
            total_breaks: Joi.number().required(),
        },
    },
};
