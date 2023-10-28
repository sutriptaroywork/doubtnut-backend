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
    getEntityDetails:{
        id: Joi.string().required(),
        type: Joi.string().required()  
    },
    getFeedAnsweredQuestions:{
       params: {
        page: Joi.string().required()
      }
    },
    // getEntityLikes:{
    //    id: Joi.string().required(),
    //    type: Joi.string().required() 
    // }
  }
};
