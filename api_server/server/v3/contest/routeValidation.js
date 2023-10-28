"use strict";
const Joi = require('joi');

module.exports = {

  contest: {
    getContestDetail:{
      params:{
        contest_id:Joi.string().required()
      }
    }  
  }
};