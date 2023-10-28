"use strict";
const Joi = require('joi');

module.exports = {
  generate:{
    get: {
      params: {
        student_id: Joi.string().default(null),
        question_id: Joi.string().default(null),
        
      }
    }
  }
};
