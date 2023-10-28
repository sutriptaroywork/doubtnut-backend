const _ = require('lodash')
const hash_expiry = 60 * 60 * 12; // 12 hours
const set_expiry = 1 * 60 * 60; //1 hour

// let Utility = require('./utility');
module.exports = class DailyPractiseProblems {
  constructor() {
  }

  static getByStudentId(student_id, client) {
    return client.hgetAsync("dpp_"+student_id,student_id)
  }
  static setByStudentId(student_id,data, client) {
    return client.multi()
      .hset("dpp_" + student_id, student_id, JSON.stringify(data))
        .expireat("dpp_" + student_id, parseInt((+new Date) / 1000) + hash_expiry)
        .execAsync()
  }
  static getByStudentIdWithLanguage(student_id,language, client) {
    return client.hgetAsync("dpp_"+student_id,student_id)
  }
  static setByStudentIdWithLanguage(student_id,language,data, client) {
    return client.multi()
      .hset("dpp_"+language+"_" + student_id, student_id, JSON.stringify(data))
        .expireat("dpp_"+language+"_" + student_id, parseInt((+new Date) / 1000) + hash_expiry)
        .execAsync()
  }

  static setDPPVideoType(type1,student_id,data,client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_id, JSON.stringify(data), 'EX', 24*60*60)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_id, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getDPPVideoType(type1,student_id,client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_id)
  }

  static setDPPVideoTypeWithTextSolutions(type1,student_id,data,client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_id, JSON.stringify(data), 'EX', 24*60*60)
    return client.multi()
      .set("HOMEPAGE_WITH_TEXT_"+type1+"_"+student_id, JSON.stringify(data))
      .expireat("HOMEPAGE_WITH_TEXT_"+type1+"_"+student_id, parseInt((+new Date) / 1000) + set_expiry*2)
      .execAsync()
  }

  static getDPPVideoTypeWithTextSolutions(type1,student_id,client) {
    return client.getAsync("HOMEPAGE_WITH_TEXT_"+type1+"_"+student_id)
  }
}


