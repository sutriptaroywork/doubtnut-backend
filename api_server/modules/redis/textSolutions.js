"use strict";
//let Utility = require('./utility');
module.exports = class TextSolutions {
   constructor() {
   }
   static getTextSolutions(client,question_id) {
    return client.hgetAsync("text_solutions","text_solutions_"+question_id)
  }

  static setTextSolutions(client,question_id,data) {
    return client.hsetAsync("text_solutions", "text_solutions_"+question_id, JSON.stringify(data))
  }
}