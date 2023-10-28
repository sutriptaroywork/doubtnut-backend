"use strict"
const _ = require('lodash')
const config = require('../../config/config')
const redisAnswer = require("../redis/elasticSearch")

module.exports=class elasticSearch{
	constructor() {
  }

  static  async getElasticResultsByQID(elasticSearchInstance,question_id,ocr,db){
  	return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let answer
        if (config.caching) {
          answer = await redisAnswer.getElasticResultsByQID(question_id, db.redis.read)
          console.log("redis answer")
          console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from elasticSearch
            console.log(" not exist")
            answer = await elasticSearchInstance.findByOcr(ocr);
            console.log("elastic answer")
            console.log(answer)
            if(!_.isNull(answer)){
              //set in redis
              await redisAnswer.setElasticResultsByQID(question_id,answer,db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await elasticSearchInstance.findByOcr(ocr);
          console.log("elastic answer")
          console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }
}