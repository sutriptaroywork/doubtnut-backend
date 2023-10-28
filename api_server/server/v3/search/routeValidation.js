"use strict";
const Joi = require('joi');

module.exports = {
  search:{
    search: {
      params: {
        text: Joi.string().required()
      }
    }
  }
};
