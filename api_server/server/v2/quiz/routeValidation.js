"use strict";
const Joi = require('joi');

module.exports = {
  quiz: {

    submit: {
      body: {
        quiz_id: Joi.string().required(),
        question_id: Joi.string().required(),
        option_id: Joi.string().required(),
        is_skipped:Joi.string().allow("").default(0)
      }
    },
    topScorer: {
      params: {
        quiz_id: Joi.string().required()
      }
    },
    quizOptions: {
      quiz_id: Joi.string().required(),
      question_id: Joi.string().required()
    },
    quizResponse: {
      quiz_id: Joi.string().required(),
      response: Joi.string().required()
    }
  }
};
