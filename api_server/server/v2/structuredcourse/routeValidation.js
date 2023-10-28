"use strict";
const Joi = require('joi');

module.exports = {
    structuredCourse:{
        getTodaysData: {
            params: {
                id: Joi.string().required(),
                subject: Joi.string().required()
            }
        },
        getCourseDetails: {
            params: {
                course_id: Joi.string().required(),
                details_id: Joi.string().required()
            }
        }
    }
};
