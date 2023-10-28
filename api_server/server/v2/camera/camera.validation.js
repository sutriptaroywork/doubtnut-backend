const Joi = require('joi');

module.exports = {
    cameraSettings: {
        get: {
            query: {
                studentClass: Joi.string().required(),
            },
        },
    },
};
