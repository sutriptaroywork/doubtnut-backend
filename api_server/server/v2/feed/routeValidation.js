const Joi = require('joi');

module.exports = {
  feed: {
    feed: {
      params: {
        page: Joi.string().required()
      }
    },
    submitResult: {
      body: {
        type: Joi.string().required(),
        is_like: Joi.string().required(),
        id: Joi.string().required()
      }
    },
    submitPoll: {
      body: {
        poll_id: Joi.string().required(),
        option_id: Joi.string().required()
      }
    },
    getEntityDetails: {
      id: Joi.string().required(),
      type: Joi.string().required()
    },
    getFeedAnsweredQuestions: {
      params: {
        page: Joi.string().required()
      }
    },
    getData: {
      params: {
        type: Joi.string().required()
      }
    },
    getEntityLikes: {
      id: Joi.string().required(),
      type: Joi.string().required()
    },
    entityReport: {
      entity_id: Joi.string().required(),
      entity_type: Joi.string().required(),
      message: Joi.string()
    },
    addOg: {
      post_id: Joi.string().required(),
      og_title: Joi.string().required(),
      og_des: Joi.string().required(),
      og_url: Joi.string().required(),
      og_image: Joi.string().required()
    },
    getPostsUnsubscribe:{
      body:{
        entity_id: Joi.string().required(),
        entity_type: Joi.string().required()
      }  
     }
  }
};
