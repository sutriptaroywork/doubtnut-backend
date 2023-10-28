"use strict";
const Joi = require('joi');

module.exports = {
  homepage:{
    get: {
      params: {
        page: Joi.string().required()
      }
    }
  }
};
