"use strict";
const Joi = require('joi');

module.exports = {
  comment: {
    add: {
      body: {
        message : Joi.string().required(),
        question_id : Join.string(),
        entity_type : Join.string().required(),
        entity_id : Join.string().required(),
        parent_id : Join.string().required(),
        image : Join.string(),
      }
    },
    getListByEntity: {
      params: {
        entity_type : Joi.string().required(),
        entity_id : Joi.string().required(),
      }
    },
    like: {
      body: {
        comment_id : Joi.string().required(),
        is_like: Joi.string().required()
      }
    },
  }
};
