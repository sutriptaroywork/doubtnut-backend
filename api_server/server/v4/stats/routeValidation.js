"use strict";
const Joi = require('joi');

module.exports = {

  stats: {

    getMostWatchedVideos: {
      body: {
        params:Joi.string().required()
      }
    }
  }
}