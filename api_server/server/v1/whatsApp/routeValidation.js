const Joi = require('joi');

module.exports = {
  whatsapp: {
    optIn:{
      body:{
        phone: Joi.string().required()
      }
    }
  }
  };

