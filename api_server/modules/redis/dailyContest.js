const moment = require('moment')
// let Utility = require('./utility');
const hash_expiry = 60 * 60 * 24 //set key expiry time

module.exports = class Playlist {
  constructor() {
  }

  static getDailyContestDataType(type1,student_class,client){
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class);
  }

  static setDailyContestDataType(type1,student_class,data,client){
    // return client.set("HOMEPAGE_"+type1+"_"+student_class,JSON.stringify(data), 'EX', 7*24*set_expiry);
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
}
