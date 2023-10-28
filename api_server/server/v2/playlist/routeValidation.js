const Joi = require('joi');

module.exports = {
  playlist: {
    view: {
      params: {
        student_id: Joi.string().required(),
        playlist_id: Joi.string().required(),
        page_no:Joi.string().required()
      }
    },
    create: {
      body: {
        playlist_name: Joi.string().required(),
        question_id: Joi.string().default(null)
      }
    },
    addQuestion: {
      body: {
        question_id: Joi.string().required(),
        playlist_id: Joi.string().required()
      }
    },
    removeQuestion: {
      body: {
        question_id: Joi.string().required(),
        playlist_id: Joi.string().required()
      }
    },
    remove: {
      body: {
        student_id: Joi.string().default('0'),
        playlist_id: Joi.string().required()
      }
    },
    customView: {
      params: {
        student_id: Joi.string().required(),
        playlist_id: Joi.string().required()
      },
      body: {
        year:Joi.string(),
        chapter:Joi.string(),
        exercise:Joi.string(),
        class:Joi.string()
      }
    },
    getNcertChapterList: {
      params: {
        class: Joi.string().required()
      }
    },
    getNcertExerciseList: {
      params: {
        class: Joi.string().required(),
        chapter: Joi.string().required()
      }
    },
    getPlaylistYearList: {
      params: {
        playlist_id: Joi.string().required()
      }
    },
    save: {
      body: {
        playlist_id: Joi.string().required()
      }
    },
    addPlaylistWrapper:{
      body:{
        playlist_id: Joi.array().items(Joi.string().required()).required(),
        question_id: Joi.string().default(null),
        student_id: Joi.string().required()
      }
    }
  }
};
