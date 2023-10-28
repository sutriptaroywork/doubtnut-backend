const _ = require('lodash')
const config = require('../../config/config')
// let Utility = require('./utility');
// let _ = require('./utility');
const mysql = require("../mysql/dailyContest")
const redis = require("../redis/dailyContest")
// const redisAnswer = require("../qu/answer")
module.exports = class Student {
  constructor() {
  }

  static async getDailyContestData(type1,type,button,limit,student_class,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redis.getDailyContestDataType(type1,student_class,db.redis.read)
          // console.log("redis answer")
          // console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await mysql.getDailyContestDataType(type,button,limit,student_class,db.mysql.read)
            // console.log("mysql answer")
            // console.log(data)
            if (data.length > 0) {
              //set in redis
              await redis.setDailyContestDataType(type1,student_class,data,db.redis.write)
            }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await mysql.getDailyContestDataType(type,button,limit,student_class,db.mysql.read)
          // console.log("mysql answer")
          // console.log(data)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }
}