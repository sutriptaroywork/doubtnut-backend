"use strict";
const Joi = require('joi');

module.exports = {
  homepage: {
    get: {
      params: {
        page: Joi.string().required()
      }
    },
    submitSelectedData: {
      body: {
        options_string: Joi.string().required(),
        widget_name: Joi.string().required()
      }
    },
    deleteAllData: {
      body: {}
    },
    submitQuestionWidgetAnswersSelected: {
      body: {
        widget_type: Joi.string().required(),
        response:Joi.string().required(),
        question_id : Joi.number().required()
      }
    },
    submitPersonalisationBySubjectInRedis:{
        body:{
            subject_choice : Joi.number().required()
        }
    
    }
  }
};
