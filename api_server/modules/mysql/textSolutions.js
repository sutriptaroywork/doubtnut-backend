const _ = require('lodash')
// let Utility = require('./utility');
module.exports = class TextSolutions {
   constructor() {
   }

   static getTextSolutions(database,question_id) {
    let sql = "SELECT * from text_solutions where question_id = ? ";
    // console.log(sql)
    return database.query(sql,[question_id]);
  }
}