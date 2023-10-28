"use strict";
const Joi = require('joi');

module.exports = {
  sharingmessage:{
    search: {
      query: {
        screen: Joi.string().required(),
        type: Joi.string().required()
      }
    },
    whatsApp:{
      body:{
        entity_type:Joi.string().required(),
        entity_id:Joi.string().required()
      }
    }
  }
}
