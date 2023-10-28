const _ = require('lodash')
const config = require('../../config/config')
// let Utility = require('./utility');
// let _ = require('./utility');
const mysqlMicroconcept = require("../mysql/microconcept")
const redisMicroconcept = require("../redis/microconcept")
// const redisAnswer = require("../redis/answer")
module.exports = class Microconept {
  constructor() {
  }

  static async getByMcCourseMappingByClassAndCourse(microconcept_id, student_class, student_course, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisMicroconcept.getByMcCourseMappingByClassAndCourse(microconcept_id, student_class, student_course, db.redis.read)
          console.log("redis mc")
          console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await mysqlMicroconcept.getByMcCourseMappingByClassAndCourse(microconcept_id, student_class, student_course, db.mysql.read)
            console.log("mysql mc")
            console.log(data)
            if(data.length > 0){
              //set in redis
              await redisMicroconcept.setByMcCourseMappingByClassAndCourse(microconcept_id, student_class, student_course, data, db.redis.write)
            }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await mysqlMicroconcept.getByMcCourseMappingByClassAndCourse(microconcept_id, student_class, student_course, db.mysql.read)
          console.log("mysql mc")
          console.log(data)
          return resolve(data)
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  static async getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, subtopic_order, microconcept_order,subject,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisMicroconcept.getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, subtopic_order, microconcept_order,subject,db.redis.read)
          console.log("redis mc_order")
          console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await mysqlMicroconcept.getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, subtopic_order, microconcept_order,subject,db.mysql.read)
            console.log("mysql mc_order")
            console.log(data)
            if(data.length > 0){
              //set in redis
              await redisMicroconcept.setByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, subtopic_order, microconcept_order,subject,data, db.redis.write)
            }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await mysqlMicroconcept.getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, subtopic_order, microconcept_order,subject,db.mysql.read)
          console.log("mysql mc_order")
          console.log(data)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }
  static async getByMcCourseMappingByClassAndCourseWithLanguage(microconcept_id, student_class, student_course,language, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisMicroconcept.getByMcCourseMappingByClassAndCourseWithLanguage(microconcept_id, student_class, student_course,language, db.redis.read)
          console.log("redis mc")
          console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await mysqlMicroconcept.getByMcCourseMappingByClassAndCourseWithLanguage(microconcept_id, student_class, student_course,language, db.mysql.read)
            console.log("mysql mc")
            console.log(data)
            if(data.length > 0){
              //set in redis
              await redisMicroconcept.setByMcCourseMappingByClassAndCourseWithLanguage(microconcept_id, student_class, student_course,language, data, db.redis.write)
            }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await mysqlMicroconcept.getByMcCourseMappingByClassAndCourseWithLanguage(microconcept_id, student_class, student_course,language, db.mysql.read)
          console.log("mysql mc")
          console.log(data)
          return resolve(data)
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  static async getByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, subtopic_order, microconcept_order,language, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisMicroconcept.getByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, subtopic_order, microconcept_order,language, db.redis.read)
          console.log("redis mc_order")
          console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await mysqlMicroconcept.getByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, subtopic_order, microconcept_order,language, db.mysql.read)
            console.log("mysql mc_order")
            console.log(data)
            if(data.length > 0){
              //set in redis
              await redisMicroconcept.setByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, subtopic_order, microconcept_order,language, data, db.redis.write)
            }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await mysqlMicroconcept.getByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, subtopic_order, microconcept_order,language, db.mysql.read)
          console.log("mysql mc_order")
          console.log(data)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  static async getDistinctMcByClassAndCourse(chapter_class, chapter, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (0) {
          data = await redisMicroconcept.getDistinctMcByClassAndCourse(chapter_class, chapter, db.redis.read)
          if (!_.isNull(data)) {
            return resolve(JSON.parse(data))
          } else {
            data = await mysqlMicroconcept.getDistinctMcByClassAndCourse(chapter_class, chapter, db.mysql.read)
            if(data.length > 0){
              //set in redis
              await redisMicroconcept.setDistinctMcByClassAndCourse(chapter_class, chapter, data, db.redis.write)
            }
            return resolve(data)
          }
        } else {
          data = await mysqlMicroconcept.getDistinctMcByClassAndCourse(chapter_class, chapter, db.mysql.read)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  static async getQuestionsByClassAndCourse(chapter_class, chapter, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (0) {
          data = await redisMicroconcept.getQuestionsByClassAndCourse(chapter_class, chapter, db.redis.read)
          if (!_.isNull(data)) {
            return resolve(JSON.parse(data))
          } else {
            data = await mysqlMicroconcept.getQuestionsByClassAndCourse(chapter_class, chapter, db.mysql.read)
            if(data.length > 0){
              //set in redis
              await redisMicroconcept.setQuestionsByClassAndCourse(chapter_class, chapter, data, db.redis.write)
            }
            return resolve(data)
          }
        } else {
          data = await mysqlMicroconcept.getQuestionsByClassAndCourse(chapter_class, chapter, db.mysql.read)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }
}


