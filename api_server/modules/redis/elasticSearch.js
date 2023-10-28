const _ = require('lodash')
const hash_expiry = 1 * 60 * 60 * 24 *10; // 10 days
module.exports = class ElasticSearch {
  constructor() {
  }

  static getElasticResultsByQID(question_id, client) {
    return client.hgetAsync("similarquestions", question_id+"_elasticResults")
  }
  static setElasticResultsByQID(question_id,answer, client) {
    console.log('set elastic  question in redis');console.log(client)
    return client.multi()
    			.hset("similarquestions",question_id+"_elasticResults",JSON.stringify(answer))
    			.expireat(question_id+"_elasticResults", parseInt((+new Date) / 1000) + hash_expiry)
      		    .execAsync()
  }
}