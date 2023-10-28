const _ = require('lodash')
const config = require('../../config/config')
// let Utility = require('./utility');
// let _ = require('./utility');
const mysql = require("../mysql/dailyPractiseProblems")
const redis = require("../redis/dailyPractiseProblems")
// const redisAnswer = require("../redis/answer")
module.exports = class DailyPractiseProblems {
  constructor() {
  }

  static async getByStudentId(student_id,limit, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redis.getByStudentId(student_id, db.redis.read)
          console.log("redis answer")
          console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await mysql.getByStudentId(student_id,limit,db.mysql.read)
            console.log("mysql answer")
            console.log(data)
            if (data.length > 0) {
              //set in redis
              await redis.setByStudentId(student_id,data, db.redis.write)
            }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await mysql.getByStudentId(student_id,db.mysql.read)
          console.log("mysql answer")
          console.log(data)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }
  static async getByStudentIdWithLanguage(student_id,limit,language, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redis.getByStudentIdWithLanguage(student_id,language, db.redis.read)
          console.log("redis answer")
          console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await mysql.getByStudentIdWithLanguage(student_id,limit, language,db.mysql.read)
            console.log("mysql answer")
            console.log(data)
            if (data.length > 0) {
              //set in redis
              await redis.setByStudentIdWithLanguage(student_id,language,data, db.redis.write)
            }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await mysql.getByStudentIdWithLanguage(student_id,limit, language,db.mysql.read)
          console.log("mysql answer")
          console.log(data)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }

  static async getDPPVideoType(type1,base_url,gradient,type,description,page,capsule_bg_color,capsule_text_color,student_id,student_class,limit,duration_text_color,duration_bg_color,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      //Do async job
      try {
        let data
        if (config.caching) {
          data = await redis.getDPPVideoType(type1,student_id,db.redis.read)
          // console.log("redis answer")
          // console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await mysql.getDPPVideoType(base_url,gradient,type,description,page,capsule_bg_color,capsule_text_color,student_id,student_class,limit,duration_text_color,duration_bg_color,db.mysql.read)
            // console.log("mysql answer")
            // console.log(data)
            if (data.length > 0) {
              //set in redis
              await redis.setDPPVideoType(type1,student_id,data,db.redis.write)
            }
            return resolve(data)
          }
        } else {
          console.log("Not exist")
          data = await mysql.getDPPVideoType(base_url,gradient,type,description,page,capsule_bg_color,capsule_text_color,student_id,student_class,limit ,duration_text_color,duration_bg_color,db.mysql.read)
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

  static async getDPPVideoTypeWithTextSolutions(type1,base_url,gradient,type,description,page,capsule_bg_color,capsule_text_color,student_id,student_class,limit,duration_text_color,duration_bg_color,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      //Do async job
      try {
        let data
        if (config.caching) {
          data = await redis.getDPPVideoTypeWithTextSolutions(type1,student_id,db.redis.read)
          // console.log("redis answer")
          // console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await mysql.getDPPVideoTypeWithTextSolutions(base_url,gradient,type,description,page,capsule_bg_color,capsule_text_color,student_id,student_class,limit,duration_text_color,duration_bg_color,db.mysql.read)
            // console.log("mysql answer")
            // console.log(data)
            if (data.length > 0) {
              //set in redis
              await redis.setDPPVideoTypeWithTextSolutions(type1,student_id,data,db.redis.write)
            }
            return resolve(data)
          }
        } else {
          console.log("Not exist")
          data = await mysql.getDPPVideoTypeWithTextSolutions(base_url,gradient,type,description,page,capsule_bg_color,capsule_text_color,student_id,student_class,limit ,duration_text_color,duration_bg_color,db.mysql.read)
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


