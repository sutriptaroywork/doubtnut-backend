const _ = require('lodash')
// let Utility = require('./utility');
const hash_expiry = 1 * 60 * 60 * 6; // 6 hour
const trending_hash_expiry= 1 * 60 * 60 * 24; // 1 day
const set_expiry = 1* 60 *60;
module.exports = class Playlist {
  constructor() {
  }

  static getByPlaylistId(question_id, database) {

  }

  static getNCERTDataType(type1,student_class,client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setNCERTDataType(type1,student_class,data,client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class,JSON.stringify(data), 'EX', 24*60*60)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

static getNCERTDataNewLibrary(type1,student_class,client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class+"_new")
  }

  static getNCERTDataNewLibraryWithPCM(type1,student_class,client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class+"_withpcm")
  }

  static setNCERTDataNewLibrary(type1,student_class,data,client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class,JSON.stringify(data), 'EX', 24*60*60)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class+"_new", JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry/3)
      .execAsync()
  }

  static setNCERTDataNewLibraryWithPCM(type1,student_class,data,client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class,JSON.stringify(data), 'EX', 24*60*60)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class+"_withpcm", JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry/3)
      .execAsync()
  }

  static getAllPlaylist(student_id, database) {

  }
  static getQuestionsByPlaylistId(student_id, database) {

  }
  static getPlaylistCheck(question_id,student_id,client){
    return client.hgetAsync("playlist_check", student_id+"_"+question_id)
  }
  static setPlaylistCheck(question_id,student_id,data,client){
    return client.hsetAsync("playlist_check", student_id+"_"+question_id,JSON.stringify(data))
  }
  static getAllPlaylistQuestions(student_id,client){
    return client.hgetAsync("student_playlist_questions", student_id)
  }
  static setAllPlaylistQuestions(student_id,data,client){
    return client.hgetAsync("student_playlist_questions", student_id,JSON.stringify(data))
  }
  static getDpp(student_id,page_no, client) {
    return client.getAsync("playlist_dpp_"+student_id+"_"+page_no)
  }
  static getDppWithLanguage(student_id,language,page_no, client) {
    return client.getAsync("playlist_dpp_"+student_id+"_"+language+"_"+page_no)
  }
  static setDpp(student_id,page_no,data, client) {
    return client.multi()
      .set("playlist_dpp_" + student_id+"_"+page_no, JSON.stringify(data))
      .expireat("playlist_dpp_" + student_id+"_"+page_no, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getTrendingVideosNew(student_class,language,client) {
    return client.hgetAsync("view_all_trending","playlist_trending_"+student_class+"_"+language)
  }

  static setTrendingVideosNew(student_class,language,data,client) {
    //return client.hsetAsync("view_all_trending","playlist_trending_"+student_class+"_"+language,JSON.stringify(data))
    return client.multi()
      .hset("view_all_trending","playlist_trending_" + student_class+"_"+language, JSON.stringify(data))
      .expireat("playlist_trending_" + student_class+"_"+language, parseInt((+new Date) / 1000) + trending_hash_expiry)
      .execAsync()
  }
//sudhir
  static getCrashCoursePlaylist(student_class,language,page,client) {
    client.getAsync("playlist_crash_course_"+student_class+"_"+language+"_"+page)
  }

  static setCrashCoursePlaylist(student_class,language,page,data,client) {
    client.set("playlist_crash_course_"+student_class+"_"+language+"_"+page,data) 
  }

  static getLatestFromDoubtnutPlaylist(student_class,language,page,client) {
    client.getAsync("playlist_latest_from_doubtnut_"+student_class+"_"+language+"_"+page)
  }

  static setLatestFromDoubtnutPlaylist(student_class,language,page,data,client) {
    client.set("playlist_latest_from_doubtnut_"+student_class+"_"+language+"_"+page,data) 
  }

  static getGeneralKnowledgePlaylist(student_class,language,page,client) {
    client.getAsync("playlist_general_knowledge_"+student_class+"_"+language+"_"+page)
  }

  static setGeneralKnowledgePlaylist(student_class,language,page,data,client) {
    client.set("playlist_general_knowledge_"+student_class+"_"+language+"_"+page,data) 
  }
  //end here

  static getPlaylistByPlaylistIdList(student_id,playlist_id,client){
    return client.hgetAsync("similarquestions", student_id+"_"+playlist_id)
  }
  
  static setPlaylistByPlaylistIdList(student_id,playlist_id,data,client){
    return client.hgetAsync("similarquestions", student_id+"_"+playlist_id,JSON.stringify(data))
  }

  static setDppWithLanguage(student_id,language,page_no,data, client) {
    return client.multi()
      .set("playlist_dpp_" + student_id+"_"+language+"_"+page_no, JSON.stringify(data))
      .expireat("playlist_dpp_" + student_id+"_"+language+"_"+page_no, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
}
