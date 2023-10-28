"use strict";
const Joi = require('joi');

module.exports = {
  chapter:{

    chapterlist: {
      params: {
      	student_class:Joi.string().required(),
      	student_course:Joi.string().required()

      }
    },
    chapterdetails:{
      params:{
        student_class:Joi.string().required(),
        student_course:Joi.string().required(),
        student_chapter:Joi.string().required()
      }
    }
    // learn:{
    //   body:{
    //     student_id:Joi.string().required(),
    //     student_class:Joi.string().required(),
    //     student_course:Joi.string().required(),
    //   }
    // }
  }
};
