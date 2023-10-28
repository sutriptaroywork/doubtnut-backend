// "use strict";
// const Joi = require('joi');

// module.exports = {
//   comment: {
//     add: {
//       body: {
//         message : Joi.string().required(),
//         question_id : Joi.string(),
//         entity_type : Joi.string().required(),
//         entity_id : Joi.string().required(),
//         parent_id : Joi.number().required(),
//         //for audio on comment
//         //url: Joi.string(),
//         image : Joi.string(),
//         //audio: Joi.string(),

//       }
//     },
//     getListByEntity: {
//       params: {
//         entity_type : Joi.string().required(),
//         entity_id : Joi.string().required(),
//       }
//     },
//     like: {
//       body: {
//         comment_id : Joi.string().required(),
//         is_like: Joi.string().required()
//       }
//     },
//   }
// };
