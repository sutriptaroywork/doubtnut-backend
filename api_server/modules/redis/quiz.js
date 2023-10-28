const moment = require('moment')
// let Utility = require('./utility');
const hash_expiry = 7 * 60 * 60 * 24; // 24 hour
const set_expiry = 1 * 60 * 60 // 1 hour key expire

module.exports = class Playlist {
  constructor() {
  }
  //Saayon_added___________________________________________________________________________________________________________
  static getQuizDetailsById(id,client){
    return client.getAsync("quiz_"+id);
  }

  // static getDailyQuizDataType(student_class,client){
  //   return client.getAsync("daily_quiz_type_"+student_class);
  // }

  // static setDailyQuizDataType(student_class,data,client){
  //   return client.set("daily_quiz_type_"+student_class, JSON.stringify(data), 'EX', set_expiry);
  // }


  static setQuizDetailsById(id,data, client) {
    return client.multi()
      .set("quiz_"+id, JSON.stringify(data))
      .expireat("quiz_"+id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  //_______________________________________________________________________________________________________________________
  static getQuizDetails(class1, client) {
    let date = moment().format('YYYY-MM-DD');
    return client.getAsync("quiz_"+date+"_"+class1)
  }
  static setQuizDetails(class1,data, client) {
    let date = moment().format('YYYY-MM-DD');
    return client.multi()
      .set("quiz_"+date+"_"+class1, JSON.stringify(data))
      .expireat("quiz_" + date+"_"+class1, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static getQuizQuestionsById(quiz_id, client) {
    return client.hgetAsync("quiz_questions_"+quiz_id,quiz_id)
  }
  static setQuizQuestionsById(quiz_id,data, client) {
    return client.multi()
      .hset("quiz_questions_"+quiz_id,quiz_id, JSON.stringify(data))
      .expireat("quiz_questions_"+quiz_id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static getQuizQuestionsOption(quiz_id, client) {
    return client.hgetAsync("quiz_question_options_"+quiz_id,quiz_id)
  }
  static setQuizQuestionsOption(quiz_id,data, client) {
    return client.multi()
      .hset("quiz_question_options_"+quiz_id,quiz_id, JSON.stringify(data))
      .expireat("quiz_question_options_"+quiz_id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static getQuizQuestionsOptionWithResult(quiz_id, client) {
    return client.hgetAsync("quiz_question_options_result_"+quiz_id,quiz_id)
  }
  static setQuizQuestionsOptionWithResult(quiz_id,data, client) {
    return client.multi()
      .hset("quiz_question_options_result_"+quiz_id,quiz_id, JSON.stringify(data))
      .expireat("quiz_question_options_result_"+quiz_id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static checkQuestionAnswer(quiz_id,question_id,option_id, client) {
    return client.hgetAsync("quiz_check_question_"+quiz_id+"_"+question_id+"_"+option_id,quiz_id+"_"+question_id+"_"+option_id)
  }
  static setCheckQuestionAnswer(quiz_id,question_id,option_id,data, client) {
    return client.multi()
      .hset("quiz_check_question_"+quiz_id+"_"+question_id+"_"+option_id,quiz_id+"_"+question_id+"_"+option_id, JSON.stringify(data))
      .expireat("quiz_check_question_"+quiz_id+"_"+question_id+"_"+option_id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static getQuiznQuestion(quiz_id,question_id, client) {
    return client.hgetAsync("quiz_question_"+quiz_id+"_"+question_id,quiz_id+"_"+question_id)
  }
  static setQuiznQuestion(quiz_id,question_id,data, client) {
    return client.multi()
      .hset("quiz_question_"+quiz_id+"_"+question_id,quiz_id+"_"+question_id, JSON.stringify(data))
      .expireat("quiz_question_"+quiz_id+"_"+question_id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static getQuizQuestionsOptionWithCorrect(quiz_id,question_id, client) {
    return client.hgetAsync("quiz_options_" + quiz_id + "_" + question_id, quiz_id + "_" + question_id)
  }
  static setQuizQuestionsOptionWithCorrect(quiz_id,question_id,data, client) {
    return client.multi()
      .hset("quiz_options_"+quiz_id+"_"+question_id,quiz_id+"_"+question_id, JSON.stringify(data))
      .expireat("quiz_options_"+quiz_id+"_"+question_id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getQuizRulesById(quiz_id, client) {
    return client.hgetAsync("quiz_rules_"+quiz_id,quiz_id)
  }
  static setQuizRulesById(quiz_id,data, client) {
    return client.multi()
      .hset("quiz_rules_"+quiz_id,quiz_id, JSON.stringify(data))
      .expireat("quiz_rules_"+quiz_id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
}
