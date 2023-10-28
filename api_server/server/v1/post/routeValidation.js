"use strict";
const Joi = require('joi');

module.exports = {
  post:{
    add: {
      body: {
        type: Joi.string().required(),
        student_id: Joi.string().required(),
        text: Joi.string(),
        url: Joi.string(),
        image: Joi.string(),
        audio: Joi.string(),
        data: Joi.string(),
        class_group: Joi.string().required(),
        student_username: Joi.string(),
        student_avatar: Joi.string()
      }
    }
  }
};
