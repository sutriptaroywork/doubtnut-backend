"use strict";
const Joi = require('joi');

module.exports = {
  search:{
    search: {
      params: {
        page: Joi.string().required(),
        tab: Joi.string().required(),
        text: Joi.string().required()
      }
    },
    getCustomMatches: {
      body: {
          ocrText: Joi.string().required(),
          ocrType: Joi.number().required(),
          locale: Joi.string().required(),
          elasticHostName: Joi.string().required(),
          elasticIndexName: Joi.string().required(),
          searchFieldName: Joi.string().required(),
      },
  },
  }
};
