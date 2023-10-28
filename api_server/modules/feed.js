"use strict";

let Utility = require('./utility');
const config = require('../config/config');

module.exports = class Feed {
  constructor() {
  }

  static getEngagementQuestions(student_id, sclass, limit, page_no, database) {

    let sql = "select a.*, case when b.is_like is null then 0 else 1 end as is_like, case when c.like_count is null then 0 else c.like_count end as like_count from (SELECT id,poll_category,en_correct_option as correct_option,type,en_title as title,en_text as text,en_image as image_url,en_options as options,class,start_time,start_date as created_at,end_date,end_time,blog_url,question_id FROM `engagement` WHERE class in (?,'all') and start_date <= CURRENT_TIMESTAMP and type in ('news','polling','success-story','tips','viral_videos') order by start_date DESC LIMIT  ?  OFFSET " + Utility.getOffset(page_no, limit) + ")as a left join (select is_like,resource_id,resource_type from user_engagement_feedback where student_id= ?) as b on a.type = b.resource_type and a.id=b.resource_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback) as c on a.id=c.resource_id and a.type=c.resource_type";
    return database.query(sql, [sclass, limit, student_id]);
  }

  static getCustomQoutes(database,type){
    let sql = "SELECT * FROM custom_quotes WHERE type = ? AND is_active = 1 ORDER BY id DESC LIMIT 10"
    return database.query(sql,[type])
  }
  static getStudentClass(sid, database) {
    let sql = "select * from students where student_id= ?";
    return database.query(sql, [sid]);
  }

  static getRemainingAnsweredQuestions(limit, page_no, sclass, student_id, database) {
    let sql = "SELECT a.*, case when b.is_like is null then 0 else 1 end as is_like, case when f.like_count is null then 0 else f.like_count end as like_count FROM (SELECT question_id,question,ocr_text,timestamp as created_at FROM questions WHERE is_answered=1 and is_skipped = 0 and student_id<90 and class = ?) as a left join (select is_like,resource_id from user_engagement_feedback where student_id=? and resource_type='answered') as b on a.question_id = b.resource_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type='answered') as f on f.resource_id=a.question_id order by a.question_id desc LIMIT ? OFFSET " + Utility.getOffset(page_no, limit);
    return database.query(sql, [sclass, student_id, limit]);
  }

  static getTrendingVideo(limit, page_no, sclass, student_id, database) {
    let sql = "SELECT a.*, b.*, d.is_like FROM ((SELECT * FROM `trending_videos` WHERE class=?) as a left join (SELECT question_id as qid,ocr_text,question,timestamp as created_at FROM questions) as b on a.question_id = b.qid left join (select is_like,resource_id from user_engagement_feedback where resource_type='trending_videos' and student_id = ?) as d on d.resource_id = a.question_id) order by a.id desc LIMIT ? OFFSET " + Utility.getOffset(page_no, limit);
    return database.query(sql, [sclass, student_id, limit]);
  }


  static async updatePollsResult(poll_id, student_id, option_id, database) {
    let sql1 = "SELECT * FROM user_poll_results WHERE poll_id= ? AND student_id=?";
    let ans = await database.query(sql1, [poll_id, student_id]);
    if (ans.length == 0) {
      let sql2 = "INSERT INTO user_poll_results(poll_id,student_id,option_id) VALUES (?, ?, ?)";
      return database.query(sql2, [poll_id, student_id, option_id]);
    }
    else {
      return new Promise((resolve, reject) => {
        resolve("already_polled");
      });
    }
  }

  static getAllOptions(poll_id, database) {
    let sql = "SELECT * from engagement where id= ? && type='polling'";
    return database.query(sql, [poll_id]);
  }

  static getOptionCounts(flag, poll_id, option_id, database) {

    if (flag == "total") {
      let sql = "SELECT count(poll_id) as totalCount FROM `user_poll_results` WHERE poll_id= ?";
      return database.query(sql, [poll_id]);
    }
    else if (flag == "single") {
      let sql = "SELECT count(poll_id) as opCount FROM `user_poll_results` WHERE poll_id= ? && option_id= ?";
      return database.query(sql, [poll_id, option_id]);
    }
  }

  static getPollResults(poll_id, database) {
    let sql = 'SELECT *  FROM `user_poll_results` WHERE poll_id=?';
    // console.log(sql);
    return database.query(sql, [poll_id]);
  }
  static getStudentPollResults(poll_id,student_id, database) {
    let sql = "SELECT *  FROM `user_poll_results` WHERE poll_id= ? and student_id= ? order by created_at desc limit 1";
    // console.log(sql);
    return database.query(sql, [poll_id, student_id]);
  }

  static async calcWeightage(optionsCount, totalCount, poll_id, database) {

    let response = [], promises = [];
    let totalSum = 0;
    for (let i = 0; i < optionsCount - 1; i++) {
      promises.push(this.getOptionCounts('single', poll_id, i, database));
    }

    let result = await Promise.all(promises)

    for (let i = 0; i < result.length; i++) {
      let opCount = result[i];
      let percentage = (opCount[0]['opCount'] / totalCount) * 100;
      percentage = Math.floor(percentage);
      totalSum += percentage;
      response.push(percentage);
    }
    response.push(100 - totalSum);
    return response;
  }

  static isLikeFeed(obj, database) {
    let sql = "INSERT INTO user_engagement_feedback set ?";
    return database.query(sql, [obj]);
  }

  static updateFeedResult(id, is_like, database) {
    let sql = "update user_engagement_feedback set is_like = ? where id = ?";
    // console.log(sql)
    return database.query(sql, [is_like, id]);
  }

  static checkIsSubmit(student_id, resource_type, resource_id, database) {
    let sql = "select * from  user_engagement_feedback where student_id = ? and resource_type = ? and resource_id = ?";
    return database.query(sql, [student_id, resource_type, resource_id]);
  }

  static checkUserAnsweredPolls(student_id, poll_id, database) {
    let sql = "SELECT * FROM  user_poll_results WHERE student_id= ? and poll_id= ?";
    return database.query(sql, [student_id, poll_id]);
  }
  static getMatchedQuestions(limit,page_no,database) {
    let sql = "select a.*,c.img_url as profile_image,case when c.student_fname = '' then c.student_username else c.student_fname end as student_username,b.* from (SELECT distinct question_id,student_id,parent_id FROM  video_view_stats WHERE parent_id <> 0 and is_back=0 and source='android' and refer_id=0 order by created_at desc LIMIT ? OFFSET " + Utility.getOffset(page_no, limit)+") as a left join (select question_id,ocr_text,question_image,question,matched_question,timestamp as created_at from questions where is_community=0) as b on a.parent_id=b.question_id left join (select * from students where is_new_app=1) as c on a.student_id=c.student_id";
    return database.query(sql, [limit]);
  }
  //Saayon code for filter__________________________________________________________________________________________

  static getMyMatchedQuestions(){
    let sql = "select a.*,c.img_url as profile_image,case when c.student_fname = '' then c.student_username else c.student_fname end as student_username,b.* from (SELECT distinct question_id,student_id,parent_id FROM  video_view_stats WHERE parent_id <> 0 and is_back=0 and source='android' and refer_id=0) as a left join (select question_id,ocr_text,question_image,question,matched_question,timestamp as created_at from questions where is_community=0) as b on a.parent_id=b.question_id left join (select * from students where is_new_app=1) as c on a.student_id=c.student_id";
  }
  //________________________________________________________________________________________________________________
  static getMatchedQuestionsWithCounts(student_id,limit,page_no,database) {
    let sql = "select a.*,c.img_url as profile_image,c.student_username,b.*,case when f.like_count is null then 0 else f.like_count end as like_count, case when g.is_like is null then 0 else 1 end as is_like from (SELECT distinct question_id,student_id,parent_id FROM  video_view_stats WHERE parent_id <> 0 and is_back=0 and source='android' and refer_id=0 order by created_at desc LIMIT ? OFFSET " + Utility.getOffset(page_no, limit)+") as a left join (select question_id,ocr_text,question_image,question,matched_question,timestamp as created_at from questions where is_community=0) as b on a.parent_id=b.question_id left join (select * from students where is_new_app=1) as c on a.student_id=c.student_id   left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type='matched') as f on f.resource_id=b.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='matched' and student_id = ?) as g on g.resource_id=b.question_id";
    return database.query(sql, [limit, student_id]);
  }

  static getEntityDetails(type, student_id, sclass, id, database) {
    let sql;
    // console.log(type);
    // console.log(id);
      const param = []
    if (type == "unanswered") {
        param.push(id, student_id, type, student_id, type)
      sql = "Select a.question_id as id ,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.matched_question,a.timestamp as created_at, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,case when f.is_like is null then 0 else 1 end as is_like , case when g.like_count is null then 0 else g.like_count end as like_count from" +
        " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where  questions.is_answered=0 and is_skipped = 0 and question_id=?) as a left join" +

        " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
        " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
        "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
        "left join" +
        " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = ?) as e on e.qid = a.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type=? and student_id = ?) as f on f.resource_id = a.question_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type=?) as g on g.resource_id=a.question_id order by upvote_count desc";
    }else if(type == "matched"){
        param.push(id, student_id, type, student_id, type)

        sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.matched_question,a.timestamp as created_at, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,case when f.is_like is null then 0 else 1 end as is_like , case when g.like_count is null then 0 else g.like_count end as like_count from" +
        " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_skipped = 0 and question_id=?) as a left join" +

        " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
        " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
        "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
        "left join" +
        " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = ?) as e on e.qid = a.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type=? and student_id = ?) as f on f.resource_id = a.question_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type=?) as g on g.resource_id=a.question_id order by upvote_count desc";
    }

    else if (type == "answered") {
        param.push(id, student_id, student_id, type)

        sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,a.matched_question, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,case when g.is_like is null then 0 else 1 end as is_like, case when h.like_count is null then 0 else h.like_count end as like_count from" +
        " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where  questions.is_answered=1 and question_id=?) as a left join" +
        " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
        " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
        "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
        "left join" +
        " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = ?) as e on e.qid = a.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='answered' and student_id = ?) as g on g.resource_id = a.question_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type=?) as h on h.resource_id=a.question_id order by f.answer_id desc";
    }
    // else if (type == "viral_videos") {
    //   sql = "Select a.*, case when b.new_views is null then 0 else b.new_views end as new_views , case when c.old_views is null then 0 else c.old_views end as old_views, (new_views + old_views) as total_views,d.is_like from ((SELECT question_id,timestamp as created_at, ocr_text,question FROM questions WHERE student_id='98' and is_answered=1 and is_skipped=0 and question_id='" + id + "' order by timestamp desc) as a left join (select count(view_id) as new_views, question_id from video_view_stats group by question_id) as b on a.question_id = b.question_id left join (select count(view_id) as old_views, question_id from view_download_stats_new group by question_id) as c on a.question_id = c.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='viral_videos' and student_id = '" + student_id + "') as d on d.resource_id = a.question_id)";
    // }

    else if (type == "trending_videos") {
        param.push(id, student_id)
      sql = "SELECT a.*, b.*, d.is_like FROM (SELECT * FROM `trending_videos` WHERE  question_id=?) as a left join (SELECT question_id as qid,ocr_text,question,timestamp as created_at FROM questions) as b on a.question_id = b.qid left join (select is_like,resource_id from user_engagement_feedback where resource_type='trending_videos' and student_id = ?) as d on d.resource_id = a.question_id";
    }
    else if (type == "ncert_questions") {
        param.push(id, student_id)
      sql = "SELECT questions_meta.*,a.*, b.is_like FROM (SELECT question_id,question,ocr_text,timestamp as created_at FROM questions WHERE student_id<100 && is_answered=1  && question_id=?)as a left join questions_meta on a.question_id=questions_meta.question_id left join (select is_like,resource_id from user_engagement_feedback where student_id=? and resource_type='ncert_questions') as b on a.question_id = b.resource_id ";
    }

    else if (type == "polling" || type == "success-story" || type == "news" || type == "blog" || type == "trending-questions" || type == "tips" || type == "viral_videos") {
        param.push(id, student_id, type)
        sql = "select a.*,case when b.is_like is null then 0 else 1 end as is_like, case when h.like_count is null then 0 else h.like_count end as like_count from (SELECT id,type,en_title as title,en_text as text,en_image as image_url,en_options as options,class,start_time,start_date as created_at,end_date,end_time,blog_url,question_id,en_correct_option as correct_option FROM `engagement` WHERE id=?)as a left join (select is_like,resource_id,resource_type from user_engagement_feedback where student_id=?') as b on a.type = b.resource_type and a.id=b.resource_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type=?) as h on h.resource_id=a.id";

    }

    else if(type=='url'){
        param.push(type, id)
        sql="select 'doubtnut' as student_username,a.*,'${config.staticCDN}images/logo.png' as profile_image,case when b.like_count is null then 0 else b.like_count end as like_count,case when b.is_like is null then 0 else b.is_like end as is_like from (select id,type,case when en_image = '' then null else en_image end as image_url,start_date as created_at,data as url from engagement where type = ? and id=?) as a left join (select count(*) as like_count,resource_id,is_like from `user_engagement_feedback` where is_like=1) as b on b.resource_id=a.id";
    }

    else if(type=='youtube'){
        param.push(type, id)
      sql="select 'doubtnut' as student_username,a.*,'${config.staticCDN}images/logo.png' as profile_image,case when b.like_count is null then 0 else b.like_count end as like_count,case when b.is_like is null then 0 else b.is_like end as is_like from (select id,type,case when en_image = '' then null else en_image end as image_url,start_date as created_at,data as url,en_text as text from engagement where type = ? and id=?) as a left join (select count(*) as like_count,resource_id,is_like from `user_engagement_feedback` where is_like=1) as b on b.resource_id=a.id";
    }

    else if(type=='pdf'){
        param.push(type, id)
      sql="select 'doubtnut' as student_username,a.*,'${config.staticCDN}images/logo.png' as profile_image,case when b.like_count is null then 0 else b.like_count end as like_count,case when b.is_like is null then 0 else b.is_like end as is_like,a.text from (select id,type,case when en_image = '' then null else en_image end as image_url,start_date as created_at,data as url,en_text as text from engagement where type = ? and id=?) as a left join (select count(*) as like_count,resource_id,is_like from `user_engagement_feedback`) as b on b.resource_id=a.id";
    }

    else if(type=='milestone'){
      sql = "";
    }


    // console.log(sql)
    return database.query(sql, param);
  }

  static getEntityDetailsNew(type,id,database){
    let sql;
    if(type=='matched'){
      sql = "select 'matched' as type, a.question_id as id, a.student_id, a.question_image,b.student_username,a.ocr_text,a.question,a.timestamp as created_at, b.profile_image, a.matched_question from (select question_id,student_id,ocr_text,timestamp,question_image,question,matched_question from questions where is_community=0 and matched_app_questions = '1' and question_id=?) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url as profile_image from students where is_new_app=1) as b on a.student_id=b.student_id";
    }

    else if(type=='unanswered'){
      sql = "Select " + "'unanswered' " + " as type, " + "a.question_id as id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,case when d.student_username is null then 'doubtnut' else d.student_username end as student_username  from (SELECT question_id,ocr_text,question_image,student_id,question,timestamp FROM questions where question_id=? and questions.is_community=1 and questions.is_answered=0 and is_skipped = 0 order by question_id desc limit 10 ) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url  as profile_image from students) as d on a.student_id = d.student_id";
    }
    else if(type=='answered'){
      sql ="select 'answered' as type,a.question_id as id,a.question_id,a.student_id,case when d.student_username is null then 'doubtnut' else d.student_username end as student_username ,a.ocr_text,a.question_image,a.question,a.timestamp as created_at,a.matched_question from (select question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and is_skipped=0 and question_id=?) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username from students) as d on a.student_id = d.student_id order by a.question_id";
    }
    else if(type=='viral_videos'){
      sql= "select 'doubtnut'  as student_username,'${config.staticCDN}images/logo.png' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category from engagement where id=? and type = 'viral_videos'";
    }
    else if(type=='pdf'){
      sql = `SELECT 'doubtnut'  as student_username,'${config.staticCDN}images/logo.png' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,question_id,data as url,action,poll_category FROM engagement WHERE  type ='pdf' and id= ?`;
    }
    else if(type=='youtube'){
      sql = `SELECT 'doubtnut'  as student_username,'${config.staticCDN}images/logo.png' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as youtube_id,action,poll_category FROM engagement WHERE  type ='youtube' and id= ?`;
    }
    else if(type=='url'){
      sql = `SELECT 'doubtnut'  as student_username,'${config.staticCDN}images/logo.png' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as url,action,poll_category FROM engagement WHERE type ='url' and id=?`;
    }
    else if(type=='polling'){
      sql = `SELECT 'doubtnut'  as student_username,'${config.staticCDN}images/logo.png' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category FROM engagement WHERE  type ='polling' and id=?`;
    }
    else if(type=='news'){
      sql = `SELECT 'doubtnut'  as student_username,'${config.staticCDN}images/logo.png' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category FROM engagement WHERE  type ='news' and id=?`;
    }
    else if(type=='product_features'){
      sql=`SELECT 'doubtnut'  as student_username,'${config.staticCDN}images/logo.png' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category FROM engagement WHERE  type ='product_features' and id=?`;
    }
    else if(type=='contest_winners'){
      let cont=id.split("_");
      //console.log(cont);
      sql="Select * from (Select amount,count as total_referral,student_id,date,position,contest_id,type,parameter from contest_winners where type ='top' && parameter='max_views' && contest_id='"+cont[0]+"' && date='"+cont[1]+"') as b left join (select student_id,student_fname,student_username,img_url as profile_image from students) as a on b.student_id=a.student_id";
    }
    else if(type=='success-story'){
      sql=`SELECT 'doubtnut'  as student_username,'${config.staticCDN}images/logo.png' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category FROM engagement WHERE start_date <= CURRENT_TIMESTAMP and type ='success-story' and id=?`;
    }
    else if(type=='milestones'){
      sql = "select 'milestones' as type,a.id as id,a.type as view_type,a.text,a.count,a.created_at, b.student_username,b.student_class,b.img_url as profile_pic from (SELECT * FROM `milestones` where id='"+id+"' ) as a left join (select * from students where is_new_app=1) as b on a.student_id=b.student_id";
    }
    else if(type=='quiz_winners'){
      sql = `Select student_id,student_username,date_q,case when img_url='' or img_url is null then '${config.staticCDN}engagement_framework/feed_profile.png' else img_url end as profile_image from quiz_winners where date_q=?`;
    }


    // console.log(sql);
    return database.query(sql, [id]);
  }
  static getEntityDetailsWithoutVote(type, student_id, sclass, id, database) {
    let sql;
    const param = []

    if (type == "unanswered") {
        param.push(id, student_id, type, student_id, type)
      sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.matched_question,a.timestamp as created_at, b.*,case when f.is_like is null then 0 else 1 end as is_like , case when g.like_count is null then 0 else g.like_count end as like_count from" +
        " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where questions.is_community=1 and questions.is_answered=0 and is_skipped = 0 and question_id=?) as a left join" +
        " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
        " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
        "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
        "left join" +
        " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = ?) as e on e.qid = a.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type=? and student_id = ?) as f on f.resource_id = a.question_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type=?) as g on g.resource_id=a.question_id order by upvote_count desc";
    }else if(type == "matched"){
        param.push(id, student_id, type, student_id, type)
      sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.matched_question,a.timestamp as created_at, b.*,case when f.is_like is null then 0 else 1 end as is_like , case when g.like_count is null then 0 else g.like_count end as like_count from" +
        " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_skipped = 0 and question_id=?) as a left join" +

        " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
        " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
        "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
        "left join" +
        " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = ?) as e on e.qid = a.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type=? and student_id = ?) as f on f.resource_id = a.question_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type=?) as g on g.resource_id=a.question_id order by upvote_count desc";
    }

    else if (type == "answered") {
        param.push(id, student_id, student_id)
      sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,a.matched_question, b.*,case when g.is_like is null then 0 else 1 end as is_like, case when h.like_count is null then 0 else h.like_count end as like_countfrom" +
        " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where  questions.is_answered=1 and question_id=?) as a left join" +
        " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
        " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
        "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
        "left join" +
        " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = ?) as e on e.qid = a.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='answered' and student_id = ?) as g on g.resource_id = a.question_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type='\"+type+\"') as h on h.resource_id=a.question_id order by f.answer_id desc";
    }
    // else if (type == "viral_videos") {
    //   sql = "Select a.*, case when b.new_views is null then 0 else b.new_views end as new_views , case when c.old_views is null then 0 else c.old_views end as old_views, (new_views + old_views) as total_views,d.is_like from ((SELECT question_id,timestamp as created_at, ocr_text,question FROM questions WHERE student_id='98' and is_answered=1 and is_skipped=0 and question_id='" + id + "' order by timestamp desc) as a left join (select count(view_id) as new_views, question_id from video_view_stats group by question_id) as b on a.question_id = b.question_id left join (select count(view_id) as old_views, question_id from view_download_stats_new group by question_id) as c on a.question_id = c.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='viral_videos' and student_id = '" + student_id + "') as d on d.resource_id = a.question_id)";
    // }
    else if (type == "trending_videos") {
        param.push(id, student_id)
      sql = "SELECT a.*, b.*, d.is_like FROM ((SELECT * FROM `trending_videos` WHERE  question_id=?) as a left join (SELECT question_id as qid,ocr_text,question,timetamp as created_at as created_at FROM questions) as b on a.question_id = b.qid left join (select is_like,resource_id from user_engagement_feedback where resource_type='trending_videos' and student_id = ?) as d on d.resource_id = a.question_id)";
    }
    else if (type == "ncert_questions") {
        param.push(id, student_id)
        sql = "SELECT questions_meta.*,a.*, b.is_like FROM (SELECT question_id,question,ocr_text,timestamp as created_at FROM questions WHERE student_id<100 && is_answered=1  && question_id=?)as a left join questions_meta on a.question_id=questions_meta.question_id left join (select is_like,resource_id from user_engagement_feedback where student_id=? and resource_type='ncert_questions') as b on a.question_id = b.resource_id ";
    }

    else if (type == "polling" || type == "success-story" || type == "news" || type == "blog" || type == "trending-questions" || type == "tips" || type == "viral_videos") {

        param.push(id, student_id, type)
        sql = "select a.*,case when b.is_like is null then 0 else 1 end as is_like, case when h.like_count is null then 0 else h.like_count end as like_count from (SELECT id,type,en_title as title,en_text as text,en_image as image_url,en_options as options,class,start_time,start_date as created_at,end_date,end_time,blog_url,question_id,en_correct_option as correct_option FROM `engagement` WHERE id=?)as a left join (select is_like,resource_id,resource_type from user_engagement_feedback where student_id=?) as b on a.type = b.resource_type and a.id=b.resource_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type=?) as h on h.resource_id=a.id";

    }

    console.log(sql)
    return database.query(sql, param);
  }
}
