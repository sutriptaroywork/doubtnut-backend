const _ = require('lodash')
const hash_expiry = 1 * 60 * 60 * 24; // 24 hour
module.exports = class Homeget {
  constructor() {
  }


	static getter(redisKey,client){
		return client.hgetAsync("homeget_questions",redisKey);	
  }

  static setter(data,redisKey,client){
    if(redisKey!='mostwatched_questions')
    {
      // return client.hsetAsync("homeget_questions",redisKey, JSON.stringify(data));
      return client.multi()
        .hset("homeget_questions",redisKey, JSON.stringify(data))
        .expire("homeget_questions", hash_expiry)
        .execAsync()
    }
    else if(redisKey=='mostwatched_questions')
    {
      return client.multi()
        .hset("homeget_questions",redisKey, JSON.stringify(data))
        .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
        .execAsync()
    }
  }


  // static getNcertBrowseQuestions(redisKey,client){
  //   return client.hgetAsync("homeget_questions","ncert_qu	estions");
  // }

  // static setNcertBrowseQuestions(data,redisKey,client){
  // 	return client.hsetAsync("homeget_questions","ncert_questions", JSON.stringify(data));
  // }

  // static getRDsharmaBrowseQuestions(redisKey,client){
  //   return client.hgetAsync("homeget_questions","rdsharma_questions");
  // }

  // static setRDsharmaBrowseQuestions(data,redisKey,client){
  //  	return client.hsetAsync("homeget_questions","rdsharma_questions", JSON.stringify(data));
  // }

  // static getCengageBrowseQuestions(redisKey,client){
  //   return client.hgetAsync("homeget_questions","cengage_questions");
  // }

  // static setCengageBrowseQuestions(data,redisKey,client){
  // 	return client.hsetAsync("homeget_questions","cengage_questions", JSON.stringify(data));
  // }

  // static getTenthBoardsBrowseQuestions(redisKey,client){
  //   return client.hgetAsync("homeget_questions","tenthboard_questions");
  // }

  // static setTenthBoardsBrowseQuestions(data,redisKey,client){
  // 	return client.hsetAsync("homeget_questions","tenthboard_questions", JSON.stringify(data));
  // }

  // static getBoardsBrowseQuestions(redisKey,client){
  //   return client.hgetAsync("homeget_questions","boards_questions");
  // }

  // static setBoardsBrowseQuestions(data,redisKey,client){
  // 	return client.hsetAsync("homeget_questions","boards_questions", JSON.stringify(data));
  // }

  // static getJeeMainsQuestions(redisKey,client){
  //   return client.hgetAsync("homeget_questions","jeemains_questions");
  // }

  // static setJeeMainsQuestions(data,redisKey,client){
  // 	return client.hsetAsync("homeget_questions","jeemains_questions", JSON.stringify(data));
  // }

  // static getJeeAdvancedBrowseQuestions(redisKey,client){
  //   return client.hgetAsync("homeget_questions","jeeadvanced_questions");
  // }

  // static setJeeAdvancedBrowseQuestions(data,redisKey,client){
  // 	return client.hsetAsync("homeget_questions","jeeadvanced_questions", JSON.stringify(data));
  // }

  // static getMostWatchedQuestions(redisKey,client){
  //   return client.hgetAsync("homeget_questions","mostwatched_questions");
  // }

  // static setMostWatchedQuestions(data,redisKey,client){
  // 	return client.hsetAsync("homeget_questions","mostwatched_questions", JSON.stringify(data));
  // }

}  