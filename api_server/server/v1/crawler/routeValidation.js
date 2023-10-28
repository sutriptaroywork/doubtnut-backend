"use strict";
const Joi = require('joi');

module.exports = {
  crawler:{
    crawl: {
      query: {
        keyword: Joi.string().required()
      }
    }
  }
};
