"use strict";
const Joi = require('joi');

module.exports = {
  timetable:{
    insert:{
      body:{
        type: Joi.string(),
        title: Joi.string(),
        subject: Joi.string(),
        note: Joi.string(),
        date: Joi.string(),
        schedule: Joi.string(),
        start_time: Joi.string(),
        end_time: Joi.string(),
        recurring: Joi.string(),
        date_in_milliseconds: Joi.string()
      
      }
    }
  }
};
