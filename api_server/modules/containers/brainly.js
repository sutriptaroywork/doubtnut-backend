const _ = require('lodash')
const config = require('../../config/config')
const mysqlBrainlyContainer = require("../mysql/brainly")
const redisBrainlyContainer = require("../redis/brainly")
module.exports = class Brainly {
  constructor() {
  }

  static async getBrainlyQuestion(qid, db) {
    return new Promise(async function (resolve, reject) {
      try {     
        let questionData
        if (config.caching) {
          questionData = await redisBrainlyContainer.getQuestionData(qid, db.redis.read)
          if (!_.isNull(questionData)) {
            return resolve(JSON.parse(questionData))
          } else {
            questionData = await mysqlBrainlyContainer.getQuestionData(qid, db.mysql.read)
            if (questionData && questionData.length > 0) {
              await redisBrainlyContainer.setQuestionData(qid, questionData, db.redis.write)
              return resolve(questionData)
            } else {
              // reject("No recent blogs found")
              return resolve(questionData)
            }
          }
        } else {
          questionData = await mysqlBrainlyContainer.getQuestionData(qid, db.mysql.read)
          resolve(questionData)
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  static async getBrainlyQuestionWithUrl(url, db) {
    return new Promise(async function (resolve, reject) {
      try {     
        let questionData
        if (config.caching) {
          questionData = await redisBrainlyContainer.getQuestionDataWithUrl(url, db.redis.read)
          if (!_.isNull(questionData)) {
            return resolve(JSON.parse(questionData))
          } else {
            questionData = await mysqlBrainlyContainer.getQuestionDataWithUrl(url, db.mysql.read)
            if (questionData && questionData.length > 0) {
              await redisBrainlyContainer.setQuestionDataWithUrl(url, questionData, db.redis.write)
              return resolve(questionData)
            } else {
              // reject("No recent blogs found")
              return resolve(questionData)
            }
          }
        } else {
          questionData = await mysqlBrainlyContainer.getQuestionDataWithUrl(url, db.mysql.read)
          resolve(questionData)
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  static async getBrainlyTextSol(qid, db) {
    return new Promise(async function (resolve, reject) {
      try {     
        let questionData
        if (config.caching) {
          questionData = await redisBrainlyContainer.getSolData(qid, db.redis.read)
          if (!_.isNull(questionData)) {
            return resolve(JSON.parse(questionData))
          } else {
            questionData = await mysqlBrainlyContainer.getSolData(qid, db.mysql.read)
            if (questionData && questionData.length > 0) {
              await redisBrainlyContainer.setSolData(qid, questionData, db.redis.write)
              // return resolve(questionData)
            } else {
              // reject("No recent blogs found")
            }
            return resolve(questionData)
          }
        } else {
          questionData = await mysqlBrainlyContainer.getSolData(qid, db.mysql.read)
          if (questionData && questionData.length > 0) {
            return resolve(questionData)
          } else {
            reject("No recent blogs found")
          }
        }
      } catch (e) {
        reject(e)
      }
    })
  }
}
