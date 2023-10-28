const Joi = require('joi');

module.exports = {
    preprocess: {
        multiple_images: {
            body: {
                question_image: Joi.string().allow('').default(null),
            },
        },
    },
};
