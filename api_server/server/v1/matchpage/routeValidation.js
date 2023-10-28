const Joi = require('joi');

module.exports = {
    getCarousel: {
        params: {
            question_id: Joi.string(),
        },
    },
};
