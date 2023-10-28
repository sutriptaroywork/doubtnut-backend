const _ = require('lodash')
const set_expiry = 60 * 60
// let Utility = require('./utility');
module.exports = class TestSeries {
  constructor() {
  }

  static getDailyQuizDataType(type,student_class, client) {
    return client.getAsync("HOMEPAGE"+"_"+type+"_"+student_class)
  }
  static setDailyQuizDataType(type,student_class, data,client) {
    console.log('set question in redis')
    return client.set("HOMEPAGE"+"_"+type+"_"+student_class, JSON.stringify(data), 'EX', set_expiry)
  }
}
