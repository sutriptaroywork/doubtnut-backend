const _ = require('lodash')
// let Utility = require('./utility')
const hash_expiry = 30; //30 sec
const quiz_winner_expiry= 60 * 60 * 12;
const contest_hash_expiry = 60 * 60;
const milestone_hash_expiry = 60;
const static_expiry = 60 * 60;
const pinned_static_expiry = 60;
const moment = require('moment');

module.exports = class Answer {
  constructor() {
  }

  static getFeedByUserId(user_id, client) {
    return client.hgetAsync("studentFeed", user_id)
  }

  static setFeedByUserId(user_id, studentFeed, client) {
    console.log('set feed in redis');
    return client.hsetAsync("studentFeed", user_id, studentFeed)
  }

  static getCommentByEntityId(entity_id, client) {
    return client.hgetAsync("topComment", entity_id)
  }

  static setCommentByEntityId(entity_id, comment, client) {
    console.log('set feed in redis');
    return client.hsetAsync("topComment", entity_id, comment)
  }

  static getLikesByUserId(user_id, client) {
    return client.hgetAsync("user_likes", user_id)
  }

  static setLikesByUserId(user_id, data, client) {
    // console.log("redis set")
    return client.hsetAsync("user_likes", user_id, JSON.stringify(data))
  }

  // Get and Set for Engagement Questions
  static setEngagementQuestions(sclass, engagementLimit, productFeatureLimit, viralVideosLimit, page_no, data, client) {
    sclass = sclass.toString()

    return client.multi()
      .set("feed_engagement_" + sclass + "_" + engagementLimit + "_" + productFeatureLimit + "_" + viralVideosLimit + "_" + page_no, JSON.stringify(data))
      .expireat("feed_engagement_" + sclass + "_" + engagementLimit + "_" + productFeatureLimit + "_" + viralVideosLimit + "_" + page_no, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getEngagementQuestions(sclass, engagementLimit, productFeatureLimit, viralVideosLimit, page_no, client) {
    sclass = sclass.toString()

    return client.getAsync("feed_engagement_" + sclass + "_" + engagementLimit + "_" + productFeatureLimit + "_" + viralVideosLimit + "_" + page_no)
  }

  //Get and Set for Matched Questions
  static setMatchedQuestions(limit, page_no, student_class, data, client) {
    console.log("classss")
    console.log(student_class)
    console.log(parseInt((+new Date) / 1000) + hash_expiry)
    student_class = student_class.toString()
    return client.multi()
      .set("feed_matched_" + student_class, JSON.stringify(data))
      .expireat("feed_matched_" + student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .exec()
  }

  static getMatchedQuestions(limit, page_no, student_class, client) {
    student_class = student_class.toString()

    return client.getAsync("feed_matched_" + student_class)
  }

  //Get and Set My Matched Questions
  static setMyMatchedQuestions(student_id, page_no, limit, data, client) {

    console.log(parseInt((+new Date) / 1000) + hash_expiry)
    student_id = student_id.toString()
    return client.multi()
      .set("feed_my_matched_" + student_id + "_" + page_no, JSON.stringify(data))
      .expireat("feed_my_matched_" + student_id + "_" + page_no, parseInt((+new Date) / 1000) + hash_expiry)
      .exec()
  }

  static getMyMatchedQuestions(student_id, page_no, limit, client) {
    student_id = student_id.toString()

    return client.getAsync("feed_my_matched_" + student_id + "_" + page_no)
  }  //Get and Set My Matched Questions
  static setMyMatchedQuestionsAfterId(matched, student_id, page_no, limit, data, client) {

    console.log(parseInt((+new Date) / 1000) + hash_expiry)
    student_id = student_id.toString()
    return client.multi()
      .set("feed_my_matched_" + student_id + "_" + matched + "_" + page_no, JSON.stringify(data))
      .expireat("feed_my_matched_" + student_id + "_" + matched + "_" + page_no, parseInt((+new Date) / 1000) + hash_expiry)
      .exec()
  }

  static getMyMatchedQuestionsAfterId(matched, student_id, page_no, limit, client) {
    student_id = student_id.toString()

    return client.getAsync("feed_my_matched_" + student_id + "_" + matched + "_" + page_no)
  }

  //Get and Set for Answered Questions
  static setAnsweredQuestion(page_no, limit, student_class, data, client) {
    student_class = student_class.toString()

    return client.multi().set("feed_answered_" + student_class, JSON.stringify(data))
      .expireat("feed_answered_" + student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getAnsweredQuestion(page_no, limit, student_class, client) {
    student_class = student_class.toString()

    return client.getAsync("feed_answered_" + student_class)
  }

  //Get and set for my answered questions______________________________________________
  static setMyAnsweredQuestion(student_id, page_no, limit, data, client) {
    student_id = student_id.toString()

    return client.multi().set("feed_my_answered_" + student_id + "_" + page_no, JSON.stringify(data))
      .expireat("feed_my_answered_" + student_id + "_" + page_no, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getMyAnsweredQuestions(student_id, page_no, limit, client) {
    student_id = student_id.toString()
    return client.getAsync("feed_my_answered_" + student_id + "_" + page_no)
  }

  //Get and Set for Community Questions
  static setCommunityQuestionsForFeed(page_no, limit, question_credit, student_class, data, client) {
    student_class = student_class.toString()

    return client.multi().set("feed_unanswered_" + student_class, JSON.stringify(data))
      .expireat("feed_unanswered_" + student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getCommunityQuestionsForFeed(page_no, limit, question_credit, student_class, client) {
    student_class = student_class.toString()
    return client.getAsync("feed_unanswered_" + student_class)
  }

  //Get and Set methods for my Community Questions+++++++++++++++++++++
  static setMyCommunityQuestionsForFeed(student_id, page_no, limit, data, client) {
    student_id = student_id.toString()

    return client.multi().set("feed_my_unanswered_" + student_id + "_" + page_no, JSON.stringify(data))
      .expireat("feed_my_unanswered_" + student_id + "_" + page_no, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getMyCommunityQuestionsForFeed(student_id, page_no, limit, client) {
    student_id = student_id.toString()
    return client.getAsync("feed_my_unanswered_" + student_id + "_" + page_no)
  }


  //Get and Set for Community Questions
  static setAppBanners(student_class, data, client) {
    return client.setAsync("app_banners_" + student_class, JSON.stringify(data))
  }

  static getAppBanners(student_class, client) {
    return client.getAsync("app_banners_" + student_class)
  }


  static getPreviousWinnerList(type, parameter, page_no, client) {
    let d = moment().subtract(page_no, 'days').format("YYYY-MM-DD")
    return client.getAsync("feed_contest_winners_" + d)

  }

  static setPreviousWinnerList(type, parameter, page_no, data, client) {
    console.log("contest")
    console.log(data)
    let d = moment().subtract(page_no, 'days').format("YYYY-MM-DD")
    return client.multi()

      .set("feed_contest_winners_" + d, JSON.stringify(data))
      .expireat("feed_contest_winners_" + d, parseInt((+new Date) / 1000) + contest_hash_expiry)
      .execAsync()
  }

  static getPreviousQuizWinnerList(page_no, client) {
    return client.getAsync("feed_quiz_winners_" + "_" + page_no)
  }

  static setPreviousQuizWinnerList(page_no, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("feed_quiz_winners_" + page_no, JSON.stringify(data))
      .expireat("feed_quiz_winners_" + page_no, parseInt((+new Date) / 1000) + contest_hash_expiry)
      .execAsync()
  }

  static getQuizWinnerType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setQuizWinnerType(type1,student_class,data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class,JSON.stringify(data), 'EX', 24*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + quiz_winner_expiry)
      .execAsync()
  }

  static getMilestone(limit, page_no, client) {
    return client.getAsync("feed_milestone_" + page_no)
  }

  static setMilestone(limit, page_no, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("feed_milestone_" + page_no, JSON.stringify(data))
      .expireat("feed_milestone_" + page_no, parseInt((+new Date) / 1000) + milestone_hash_expiry)
      .execAsync()
  }

  static getMatchedQuestionsAfterViewID(question_id, student_class, matchedQuestionLimit, client) {
    return client.getAsync("feed_matched_" + student_class + "_" + question_id)
  }

  static setMatchedQuestionsAfterViewID(question_id, student_class, matchedQuestionLimit, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("feed_matched_" + student_class + "_" + question_id, JSON.stringify(data))
      .expireat("feed_matched_" + student_class + "_" + question_id, parseInt((+new Date) / 1000) + static_expiry)
      .execAsync()
  }

  static getCommunityQuestionsForFeedAfterId(lastQuestionId, question_credit, limit, student_class, client) {
    return client.getAsync("feed_unanswered_" + student_class + "_" + lastQuestionId)
  }

  static setCommunityQuestionsForFeedAfterId(lastQuestionId, question_credit, limit, student_class, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("feed_unanswered_" + student_class + "_" + lastQuestionId, JSON.stringify(data))
      .expireat("feed_unanswered_" + student_class + "_" + lastQuestionId, parseInt((+new Date) / 1000) + static_expiry)
      .execAsync()
  }

  static getAnsweredQuestionAfterAnswerId(lastQuestionId, limit, student_class, client) {
    return client.getAsync("feed_answered_" + student_class + "_" + lastQuestionId)
  }

  static setAnsweredQuestionAfterAnswerId(lastQuestionId, limit, student_class, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("feed_answered_" + student_class + "_" + lastQuestionId, JSON.stringify(data))
      .expireat("feed_answered_" + student_class + "_" + lastQuestionId, parseInt((+new Date) / 1000) + static_expiry)
      .execAsync()
  }

  static getLikeCount(type, id, client) {
    return client.getAsync("like_count_" + type + "_" + id)
  }

  static setLikeCount(type, id, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("like_count_" + type + "_" + id, JSON.stringify(data))
      .expireat("like_count_" + type + "_" + id, parseInt((+new Date) / 1000) + static_expiry)
      .execAsync()
  }

  static getEngagementType(type, class1, dn_logo, page_no, limit, client) {
    return client.getAsync("feed_filter_" + type + "_" + class1 + "_" + page_no)
  }

  static setEngagementType(type, class1, dn_logo, page_no, limit, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("feed_filter_" + type + "_" + class1 + "_" + page_no, JSON.stringify(data))
      .expireat("feed_filter_" + type + "_" + class1 + "_" + page_no, parseInt((+new Date) / 1000) + static_expiry)
      .execAsync()
  }

  static getExtraFilter(type,class1,page_no,limit,client){
    return client.getAsync("feed_filter_" + type + "_" + class1 + "_" + page_no+"_"+limit)
  }

  static setExtraFilter(type,class1,page_no,limit,response,client){
    return client.multi()
      .set("feed_filter_" + type + "_" + class1 + "_" + page_no+"_"+limit, JSON.stringify(response))
      .expireat("feed_filter_" + type + "_" + class1 + "_" + page_no+"_"+limit, parseInt((+new Date) / 1000) + static_expiry)
      .execAsync()
  }

  static getUgcContent(class1, page_no, limit, client) {
    return client.getAsync("feed_ugc_" + class1 + "_" + page_no)
  }
  static removeUgcContent(class1, page_no, limit, client) {
    return client.delAsync("feed_ugc_" + class1 + "_" + page_no)
  }
  static setUgcContent(class1, page_no, limit, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("feed_ugc_" + class1 + "_" + page_no, JSON.stringify(data))
      .expireat("feed_ugc_" + class1 + "_" + page_no, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static getUgcContentAfterId(id,class1, page_no, limit, client) {
    return client.getAsync("feed_ugc_" + class1 + "_" + id)
  }

  static setUgcContentAfterId(id,class1, page_no, limit, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("feed_ugc_" + class1 + "_" + id, JSON.stringify(data))
      .expireat("feed_ugc_" + class1 + "_" + id, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static getUgcContentByStudentId(student_id, page_no, limit, client) {
    return client.getAsync("feed_ugc_student_" + student_id + "_" + page_no)
  }

  static setUgcContentByStudentId(student_id, page_no, limit, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .set("feed_ugc__student_" + student_id + "_" + page_no, JSON.stringify(data))
      .expireat("feed_ugc_student_" + student_id + "_" + page_no, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static getImageData(image_data, client) {
    return client.hgetAsync("image_data" ,image_data)
  }

  static setImageData(image_data, data, client) {
    console.log("contest")
    console.log(data)
    return client.multi()
      .hset("image_data", image_data , JSON.stringify(data))
      .execAsync()
  }
  static getPinnedPost(student_class,filter, client) {
    return client.getAsync("feed_pinned_"+student_class+"_"+filter)
  }

  static setPinnedPost(student_class,filter, data, client) {
    return client.multi()
      .set("feed_pinned_"+student_class+"_"+filter , JSON.stringify(data))
      .expireat("feed_pinned_"+student_class+"_"+filter, parseInt((+new Date) / 1000) + pinned_static_expiry)

      .execAsync()
  }
  static getIsShowPinnedPost(student_id,filter, client) {
    return client.getAsync("show_pinned_"+student_id+"_"+filter)
  }

  static setIsShowPinnedPost(student_id,filter, data, client) {
    // console.log("contest")
    // console.log(data)
    return client.multi()
      .set("show_pinned_"+student_id+"_"+filter , JSON.stringify(data))
      .expireat("show_pinned_"+student_id+"_"+filter, parseInt((+new Date) / 1000) + pinned_static_expiry)

      .execAsync()
  }
}
