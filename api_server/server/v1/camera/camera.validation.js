const Joi = require('joi');

module.exports = {
    cameraSettings: {
        get: {
            query: {
                openCount: Joi.string().required(),
            },
        },
        faceData: {
            body: {
                face_img: Joi.string().allow('').default(null),
            }
        }
    },
};
