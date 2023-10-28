const Joi = require('joi');

module.exports = {
  home: {
    filter: {
      body: {
        params: Joi.string().required()
      }
    },
    feed: {
      params: {
        page: Joi.string().required()
      }
    },
    feedWeb: {
      params: {
        page: Joi.string().required()
      }
    }
  }
};