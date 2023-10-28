const Joi = require('joi');

module.exports = {
    studentQuery: {
        body: {
            phone: Joi.string().required(),
        },
    },
};
