const Joi = require('joi');

module.exports = {
  library:{

    get: {
      params: {
        student_class:Joi.string().required(),
        student_course:Joi.string().required()
      }
    }
  }
};
