"use strict";
const Joi = require('joi');

module.exports = {
    homepage:{
        get: {
            params: {
                page: Joi.string().required(),
            },
        },
        storeActivityData: {
            body: {
                type: Joi.string().required(),
                activity_name: Joi.string(),
            },
        },
    },
};
