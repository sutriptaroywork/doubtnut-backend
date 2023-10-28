"use strict";
const Joi = require('joi');

module.exports = {

  contest: {

    maxQidContest: {
      body: {
        contest_id: Joi.number().required()
      }
    },

    enroll: {
      body: {
        name: Joi.string().required(),
        email_id: Joi.string().email({ minDomainAtoms: 2 }).required(),
        phone: Joi.string().required(),
        student_class: Joi.string().required()
      }
    },

    answerInsert: {
      contest_id: Joi.number().integer().required(),
      q_no: Joi.number().integer().min(1).max(20).required(),
      ans_no: Joi.number().integer().min(1).max(4).required()
    }
    
  }
};
