"use strict";
const Joi = require('joi');

module.exports = {
  community: {
    update: {
      body: {
        chapter: Joi.string().required(),
        subtopic: Joi.string().required(),
        question_id: Joi.string().required()
      }
    },
    upvote: {
      body: {
        question_id: Joi.string().required()
      }
    },
    ask: {
      body: {
        question_text: Joi.string().allow('').default(null),
        question_image: Joi.string().allow('').default(null),
        student_id: Joi.string().allow('').default(null),
        chapter: Joi.string().allow('').default(null),
        question: Joi.string().required().allow('').default(null),
        subject: Joi.string().required().allow('').default(null),
        class: Joi.string().required().allow('').default(null),
        locale: Joi.string().allow('').default(null),
      }
    },
    add: {
      body: {
        question_id: Joi.string().required(),
        chapter: Joi.string().required().allow(''),
        subtopic: Joi.string().allow('')
      }
    },
    get_question: {
      params: {
        question_id: Joi.string().required()
      }
    },
    getAnsweredQuestions: {
      params: {
        page: Joi.string().required()
      }
    },
    getUnansweredQuestions: {
      params: {
        page: Joi.string().required()
      }
    },
    getStats: {
      params: {
        page: Joi.string().required()
      }
    }
  }

};
