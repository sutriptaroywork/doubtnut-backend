"use strict";
const Joi = require('joi');

module.exports = {

  blog: {

    blogList: {
        params: {
            page: Joi.string().required(),
            category: Joi.string()
        }
    },
    singleBlog: {
        params: {
            title: Joi.string().required()
        }
    }
  }
};
