const Joi = require('joi');

module.exports = {
  language: {
    updateLanguage: {
      body: {
        udid: Joi.string().required(),
        locale: Joi.string().required()
      }
    }
  }
};
