"use strict";
const Joi = require('joi');

module.exports = {

  stats: {

    getMostWatchedVideos: {
      body: {
        params:Joi.string()
      }
    },
    getMostWatchedChapters:{
    	body: {
    	 	params:Joi.string()
    	}
    },
    getRoundWiseRank:{
      body:{
        clg: Joi.string().required(),
        dept: Joi.string().required(),
        quota: Joi.string().required(),
        category: Joi.string().required()
      }
    },
    getClgDeptRank:{
      body:{
        state: Joi.string().required(),
        category: Joi.string().required(),
        rank: Joi.string().required()
      }
    },
    getDistDept:{
      params: {
        clg: Joi.string().required()
      }
    },
    getDistQuota:{
      params: {
        clg: Joi.string().required(),
        dept: Joi.string().required()
      }
    },
    getDistCategory:{
      params: {
        clg: Joi.string().required(),
        dept: Joi.string().required(),
        quota: Joi.string().required()
      }
    },
    getStateWiseCategory:{
      params: {
        state: Joi.string().required()
      }
    }
  }
}
