const Utility = require('../utility');
const config = require('../../config/config');

module.exports = class Feed {
    static async getLikesByUserId(user_id, database) {
        const sql = 'SELECT resource_id as entity_id FROM user_engagement_feedback WHERE student_id = ? AND is_like = 1';
        return database.query(sql, [user_id]);
    }

    static isUserLikeEntity(type, id, user_id, database) {
        const sql = 'SELECT resource_id as entity_id FROM user_engagement_feedback WHERE student_id = ? AND is_like = 1 and resource_type=? and resource_id=?';
        return database.query(sql, [user_id, type, id]);
    }

    // Engagement questions
    /*
  static getEngagementQuestions(dn_logo, sclass, limit, page_no, database) {

    let sql = "select a.*,case when b.is_like is null then 0 else b.is_like end as is_like,case when b.like_count is null then 0 else b.like_count end as like_count from (SELECT " + "'doubtnut' " + " as student_username,'"+dn_logo+"' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data,action FROM `engagement` WHERE class in ('" + sclass + "','all') and start_date <= CURRENT_TIMESTAMP) as a left join (SELECT count(*) as like_count,resource_id,is_like from user_engagement_feedback) as b on b.resource_id=a.question_id order by created_at DESC LIMIT " + limit + " OFFSET " + Utility.getOffset(page_no, limit);
    console.log(sql)
    return database.query(sql);
  }
  */

    // (select * from engagement where type = 'polling' order by id desc limit 1) union all (select * from engagement where type = 'pdf' order by id desc limit 1) union all (select * from engagement where type = 'url' order by id desc limit 1) union all (select * from engagement where type = 'news' order by id desc limit 1) union all (select * from engagement where type = 'youtube' order by id desc limit 1)
    static getEngagementQuestions(dn_logo, sclass, engagementLimit, productLimit, viralLimit, page_no, database) {
        const sql = `(SELECT 'doubtnut'  as student_username,'${dn_logo}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category FROM \`engagement\` WHERE class in ('${sclass}','all') and start_date <= CURRENT_TIMESTAMP and type in ('polling','pdf','url','news','youtube') order by created_at DESC LIMIT ${engagementLimit} OFFSET ${Utility.getOffset(page_no, engagementLimit)
        }) union all `
      + `(select 'doubtnut'  as student_username,'${dn_logo}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category from engagement where class in ('${sclass}','all') and start_date <= CURRENT_TIMESTAMP and type = 'product_features' order by rand()  limit ${productLimit}  OFFSET ${Utility.getOffset(page_no, productLimit)
      }) union all `
      + `(select 'doubtnut'  as student_username,'${dn_logo}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category from engagement where class in ('${sclass}','all') and start_date <= CURRENT_TIMESTAMP and type = 'viral_videos' order by created_at desc limit ${viralLimit}  OFFSET ${Utility.getOffset(page_no, viralLimit)})`;

        // let sql = "(select 'doubtnut'  as student_username,'"+dn_logo+"' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action from engagement where class in ('" + sclass + "','all') and start_date <= CURRENT_TIMESTAMP and type = 'polling' order by id desc limit 1) union all " +
        //
        //   "(select 'doubtnut'  as student_username,'"+dn_logo+"' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action from engagement where class in ('" + sclass + "','all') and start_date <= CURRENT_TIMESTAMP and type = 'pdf' order by id desc limit 1) union all" +
        //
        //   " (select 'doubtnut'  as student_username,'"+dn_logo+"' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action from engagement where class in ('" + sclass + "','all') and start_date <= CURRENT_TIMESTAMP and type = 'url' order by id desc limit 1) union all " +
        //
        //   "(select 'doubtnut'  as student_username,'"+dn_logo+"' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action from engagement where class in ('" + sclass + "','all') and start_date <= CURRENT_TIMESTAMP and type = 'news' order by id desc limit 1) union all " +
        //
        //   "(select 'doubtnut'  as student_username,'"+dn_logo+"' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action from engagement where class in ('" + sclass + "','all') and start_date <= CURRENT_TIMESTAMP and type = 'youtube' order by id desc limit 1) union all"+
        //
        //   "(select 'doubtnut'  as student_username,'"+dn_logo+"' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action from engagement where class in ('" + sclass + "','all') and start_date <= CURRENT_TIMESTAMP and type = 'product_features' order by id desc limit "+productLimit+") union all" +
        //
        //   "(select 'doubtnut'  as student_username,'"+dn_logo+"' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action from engagement where class in ('" + sclass + "','all') and start_date <= CURRENT_TIMESTAMP and type = 'viral_videos' order by id desc limit "+viralLimit+")"
        console.log(sql);
        return database.query(sql);
    }

    // viral videos

    static getViralVideos(student_id, dn_logo, sclass, limit, page_no, database) {
        const sql = `${'select a.*,case when c.id is null then 0 else 1 end as is_like,case when b.like_count is null then 0 else b.like_count end as like_count from (SELECT ' + "'doubtnut' " + " as student_username,'"}${dn_logo}' as profile_image,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,start_date as created_at,blog_url,question_id as id FROM \`engagement\` WHERE class in ('${sclass}','all') and start_date <= CURRENT_TIMESTAMP and type = 'viral_videos' order by id desc) as a left join (SELECT count(*) as like_count,resource_id from user_engagement_feedback) as b on b.resource_id=a.id left join (select id,resource_id from user_engagement_feedback where is_like=1 and resource_type='viral_videos') as c on a.id=b.resource_id order by created_at DESC LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
        console.log(sql);
        return database.query(sql);
    }

    // Product Features
    static getProductFeature(student_id, dn_logo, sclass, limit, page_no, database) {
        const query = `${'select a.*,case when b.id is null then 0 else 1 end as is_like from (SELECT ' + "'doubtnut' " + " as student_username,'"}${dn_logo}' as profile_image,id,type,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,data,action FROM \`engagement\` WHERE class in ('${sclass}','all') and start_date <= CURRENT_TIMESTAMP and type = 'product_features') as a left join (SELECT id,resource_id from user_engagement_feedback where is_like=1 and resource_type='product_features' and student_id='${student_id}') as b on a.id=b.resource_id order by a.created_at DESC LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
        return database.query(query);
    }

    /*
  static getProductFeature(dn_logo,database){
      let sql ="select a.type,a.id,'"+dn_logo+"' as profile_image,a.en_text as button_text,a.en_title as title,a.data as action,a.start_date as created_at,a.en_image as image,case when b.is_like is null then 0 else b.is_like end as is_like,case when b.like_count is null then 0 else b.like_count end as like_count from (SELECT * FROM engagement WHERE type = 'product_features') as a left join (select count(*) as like_count,is_like,resource_id from user_engagement_feedback where is_like=1) as b on b.resource_id=a.id ORDER BY created_at DESC LIMIT 1";
    console.log(sql);
    return database.query(sql);
  }
  */

    // Matched questions

    static getMatchedQuestions(limit, page_no, student_class, database) {
        const sql = `select 'matched' as type, a.question_id as id, a.student_id, a.question_image,b.student_username,a.ocr_text,a.question,a.timestamp as created_at, b.profile_image, a.matched_question from (select question_id,student_id,ocr_text,timestamp,question_image,question,matched_question from questions where is_community=0 and class=? and matched_app_questions = '1' order by question_id desc limit 15) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url as profile_image from students where is_new_app=1) as b on a.student_id=b.student_id LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        return database.query(sql, [student_class, limit]);
    }
    // Matched questions

    static getMatchedQuestionsWithImageData(cdn, limit, page_no, student_class, database) {
        const sql = `select 'matched' as type, a.question_id as id, a.student_id, a.question_image,b.student_username,a.ocr_text,a.question,a.timestamp as created_at, b.profile_image, a.matched_question from (select question_id,student_id,ocr_text,timestamp,question_image,question,matched_question from questions where is_community=0 and class='${student_class}' and matched_app_questions = '1' order by question_id desc limit 15) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url as profile_image from students where is_new_app=1) as b on a.student_id=b.student_id LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
        return database.query(sql);
    }

    static getMyMatchedQuestions(student_id, page_no, limit, database) {
        const sql = `select 'matched' as type, a.question_id as id, a.student_id, a.question_image,b.student_username,a.ocr_text,a.question,a.timestamp as created_at, b.profile_image, a.matched_question from (select question_id,student_id,ocr_text,timestamp,question_image,question,matched_question from questions where is_community=0 and student_id=? and matched_app_questions = '1' order by question_id desc limit 15) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url as profile_image from students where is_new_app=1) as b on a.student_id=b.student_id order by a.question_id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        console.log(sql);
        return database.query(sql, [student_id, limit]);
    }

    static getMyMatchedQuestionsAfterId(matched, student_id, page_no, limit, database) {
        const sql = `select 'matched' as type, a.question_id as id, a.student_id, a.question_image,b.student_username,a.ocr_text,a.question,a.timestamp as created_at, b.profile_image, a.matched_question from (select question_id,student_id,ocr_text,timestamp,question_image,question,matched_question from questions where is_community=0 and student_id='${student_id}' and matched_app_questions = '1' and question_id < ${matched} order by question_id desc limit 15) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url as profile_image from students) as b on a.student_id=b.student_id order by a.question_id desc LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
        console.log(sql);
        return database.query(sql);
    }

    static getMatchedQuestionsAfterViewID(question_id, student_class, limit, database) {
    // let sql ="select "+"'matched' " + " as type,a.parent_id as id,b.question_image,a.student_id,a.view_id,case when c.student_username is null then 'doubtnut' else c.student_username end as student_username,b.question_id,b.ocr_text,b.question,b.created_at from (SELECT distinct question_id,student_id,parent_id,view_id FROM  video_view_stats WHERE parent_id <> 0 and is_back=0 and source='android' and refer_id=0 and view_id < "+matchedViewId+" order by created_at desc ) as a inner join (select question_id,ocr_text,question_image,question,matched_question,timestamp as created_at from questions where is_community=0 and class = '"+student_class+"') as b on a.parent_id=b.question_id left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url as profile_image from students where is_new_app=1) as c on a.student_id=c.student_id LIMIT "+limit+"";
        const sql = 'select \'matched\' as type, a.question_id as id, a.student_id, a.question_image,b.student_username,a.ocr_text,a.question,a.timestamp as created_at, b.profile_image, a.matched_question from (select question_id,student_id,ocr_text,timestamp,question_image,question,matched_question from questions where is_community=0 and class=? and matched_app_questions = \'1\' and question_id < ? order by question_id desc limit 15) as a left join (select student_id,case when student_fname = \'\' then student_username else student_fname end as student_username,img_url as profile_image from students) as b on a.student_id=b.student_id order by a.question_id desc LIMIT ?';
        console.log(sql);
        return database.query(sql, [student_class, question_id, limit]);
    }

    // Community Questions

    static getCommunityQuestionsForFeed(page_no, limit, question_credit, student_class, database) {
        let is_answered; let
            sql;
        if (question_credit == '1') {
            sql = `${'Select ' + "'unanswered' " + ' as type, ' + "a.question_id as id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,case when d.student_username is null then 'doubtnut' else d.student_username end as student_username  from (SELECT question_id,ocr_text,question_image,student_id,question,timestamp FROM questions where class='"}${student_class}' and questions.is_community=1 and questions.is_answered=0 and is_skipped = 0 order by question_id desc limit 10 ) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url as profile_image from students) as d on a.student_id = d.student_id order by a.question_id desc LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
        } else if (question_credit == '0') {
            // sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,a.matched_question, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,g.is_like from" +
            //   " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0 and date(timestamp) > date_sub(CURRENT_DATE, INTERVAL 10 DAY)) as a left join" +
            //   " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
            //   " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
            //   "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
            //   "left join" +
            //   " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = '" + student_id + "') as e on e.qid = a.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='answered' and student_id = '"+student_id+"') as g on g.resource_id = a.question_id order by f.answer_id desc LIMIT " + limit + " OFFSET " + Utility.getOffset(page_no, limit);
            sql = `Select t1.*, NULL as chapter, NULL as subtopic, t2.student_username, t2.img_url as profile_image,t1.timestamp as created_at FROM (SELECT question_id,ocr_text,question_image,student_id,question,timestamp ,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0) as t1 left JOIN (Select * from students where is_web=0) as t2 on t1.student_id=t2.student_id order by t1.question_id desc LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
        } else if (question_credit == '2') {
            // sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,a.matched_question, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,g.is_like from" +
            //   " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0 and date(timestamp) > date_sub(CURRENT_DATE, INTERVAL 10 DAY)) as a left join" +
            //   " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
            //   " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
            //   "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
            //   "left join" +
            //   " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = '" + student_id + "') as e on e.qid = a.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='answered' and student_id = '"+student_id+"') as g on g.resource_id = a.question_id order by f.answer_id desc LIMIT " + limit + " OFFSET " + Utility.getOffset(page_no, limit);
            sql = `Select t1.*, NULL as chapter, NULL as subtopic, t2.student_username, t2.img_url as profile_image,t1.timestamp as created_at FROM (SELECT question_id,ocr_text,question_image,student_id,question,timestamp ,matched_question FROM questions where is_answered=1 and is_text_answered=0 and is_skipped = 0) as t1 left JOIN (Select * from students where is_web=0) as t2 on t1.student_id=t2.student_id order by t1.question_id desc LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
        }

        console.log(sql);
        return database.query(sql);
    }

    static getMyCommunityQuestionsForFeed(student_id, page_no, limit, database) {
        const sql = `${'Select ' + "'unanswered' " + ' as type, ' + "a.question_id as id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,case when d.student_username is null then 'doubtnut' else d.student_username end as student_username  from (SELECT question_id,ocr_text,question_image,student_id,question,timestamp FROM questions where student_id='"}${student_id}' and questions.is_community=1 and is_skipped = 0 order by question_id desc) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url  as profile_image from students) as d on a.student_id = d.student_id order by a.question_id desc LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
        console.log(sql);
        return database.query(sql);
    }

    // COMMUNITY________________________________________________________________________________________________________
    static getCommunityQuestionsForFeedAfterId(lastQuestionId, question_credit, limit, student_class, database) {
        let sql;

        if (question_credit == '1') {
            sql = `${'Select ' + "'unanswered' " + ' as type, ' + "'question'" + " as entity_name ,a.question_id as id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.matched_question,a.timestamp as created_at,case when d.student_username is null then 'doubtnut' else d.student_username end as student_username from (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where questions.is_community=1 and questions.is_answered=0 and is_skipped = 0 and question_id < "}${lastQuestionId} and class='${student_class}' order by question_id desc limit 10 ) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url  as profile_image from students) as d on a.student_id = d.student_id order by a.question_id desc LIMIT ${limit}`;
        } else if (question_credit == '0') {
            sql = `Select t1.*, NULL as chapter, NULL as subtopic, t2.student_username, t2.img_url as profile_image,t1.timestamp as created_at FROM (SELECT question_id,ocr_text,question_image,student_id,question,timestamp ,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0 and question_id < ${lastQuestionId}) as t1 left JOIN (Select * from students where is_web=0) as t2 on t1.student_id=t2.student_id order by t1.question_id desc LIMIT ${limit}`;
        } else if (question_credit == '2') {
            sql = `Select t1.*, NULL as chapter, NULL as subtopic, t2.student_username, t2.img_url as profile_image,t1.timestamp as created_at FROM (SELECT question_id,ocr_text,question_image,student_id,question,timestamp ,matched_question FROM questions where is_answered=1 and is_text_answered=0 and is_skipped = 0 and question_id < ${lastQuestionId}) as t1 left JOIN (Select * from students where is_web=0) as t2 on t1.student_id=t2.student_id order by t1.question_id desc LIMIT ${limit}`;
        }

        console.log('community');
        console.log(sql);
        return database.query(sql);
    }

    // __________________________________________________________________________________________________________________

    // static getLikeCount(entity_id_array, database) {
    //   let QueryLike = "SELECT count(*) AS like_count,resource_id AS entity_id FROM user_engagement_feedback WHERE resource_id IN (" + entity_id_array + ") AND is_like='1' GROUP BY resource_id";
    //
    //   return database.query(QueryLike);
    // }
    static getLikeCount(type, id, database) {
        const sql = 'select count(*) as like_count from user_engagement_feedback where is_like=1 and resource_type=? and resource_id=?';
        return database.query(sql, [type, id]);
    }

    static getRateUs(dn_logo, sclass, limit, page_no, database) {
        const query = `${'select a.*,case when b.is_like is null then 0 else b.is_like end as is_like,case when b.like_count is null then 0 else b.like_count end as like_count from (SELECT ' + "'doubtnut' " + " as student_username,'"}${dn_logo}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as url FROM \`engagement\` WHERE class in ('${sclass}','all') and start_date <= CURRENT_TIMESTAMP and type = 'rate_us') as a left join (SELECT count(*) as like_count,resource_id,is_like from user_engagement_feedback) as b on b.resource_id=a.question_id order by created_at DESC LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;

        return database.query(query);
    }

    static getInvites(dn_logo, sclass, limit, page_no, database) {
        const query = `${'select a.*,case when b.is_like is null then 0 else b.is_like end as is_like,case when b.like_count is null then 0 else b.like_count end as like_count from (SELECT ' + "'doubtnut' " + " as student_username,'"}${dn_logo}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data FROM \`engagement\` WHERE class in ('${sclass}','all') and start_date <= CURRENT_TIMESTAMP and type = 'invite') as a left join (SELECT count(*) as like_count,resource_id,is_like from user_engagement_feedback) as b on b.resource_id=a.question_id order by created_at DESC LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;

        return database.query(query);
    }

    static getAnsweredQuestion(page_no, limit, student_class, database) {
        const sql = 'select \'answered\' as type,a.question_id as id,a.student_id,case when d.student_username is null then \'doubtnut\' else d.student_username end as student_username ,a.ocr_text,a.question_image,a.question,a.timestamp as created_at,a.matched_question from (select question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and is_skipped=0 and class=? and student_id <> 96 and student_id <> 98 order by question_id desc limit 10) as a left join (select student_id,case when student_fname = \'\' then student_username else student_fname end as student_username from students) as d on a.student_id = d.student_id order by a.question_id desc LIMIT ?';
        console.log(sql);
        return database.query(sql, [student_class, limit]);
    }

    static getMyAnsweredQuestions(student_id, page_no, limit, database) {
        const sql = `select 'answered' as type,a.question_id as id,a.student_id,case when d.student_username is null then 'doubtnut' else d.student_username end as student_username ,a.ocr_text,a.question_image,a.question,a.timestamp as created_at,a.matched_question from (select question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and is_skipped=0 and student_id=? and student_id <> 96 and student_id <> 98) as a left join (select student_id,case when student_fname = '' then student_username else student_fname end as student_username from students) as d on a.student_id = d.student_id order by a.question_id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        console.log(sql);
        return database.query(sql, [student_id, limit]);
    }

    static getAnsweredQuestionAfterAnswerId(question_id, limit, student_class, database) {
        const sql = 'select \'answered\' as type,a.question_id as id,a.student_id,case when d.student_username is null then \'doubtnut\' else d.student_username end as student_username ,a.ocr_text,a.question_image,a.question,a.timestamp as created_at,a.matched_question from (select question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and is_skipped=0 and class=? and question_id < ? and student_id <> 96 and student_id <> 98 order by question_id desc limit 10) as a left join (select student_id,case when student_fname = \'\' then student_username else student_fname end as student_username from students) as d on a.student_id = d.student_id order by a.question_id desc LIMIT ?';
        console.log(sql);
        return database.query(sql, [student_class, question_id, limit]);
    }

    static getAnsweredQuestionWithId(lastQueryId, student_id, page_no, limit, database) {
        const sql = `${"select 'answered' as type,a.question_id as id,a.student_id,d.student_username as student_username,a.ocr_text,a.question_image,a.question,a.timestamp as created_at from "
      + '(select question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and is_skipped=0) as a left join'
      + '(select student_id,student_username from students) as d on a.student_id = d.student_id left join '
      + '(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id left join'
      + '(select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id where a.question_id < '}${lastQueryId} order by f.answer_id desc LIMIT ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;

        console.log(sql);
        return database.query(sql);
    }

    static getAppBanners(student_class, database) {
        const sql = 'select * from app_banners where class in (?,\'all\') and is_active=1 and page_type like \'%FEED%\' and min_version_code<585 and max_version_code>=585 order by'
      + ' banner_order asc';

        console.log(sql);
        return database.query(sql, [student_class]);
    }

    static getAppBannersNew(student_class, version_code, database) {
        const sql = 'select * from app_banners where class in (?,\'all\') and is_active=1 and page_type like \'%FEED%\' and min_version_code<? and max_version_code>=? order by'
      + ' banner_order asc';

        console.log(sql);
        return database.query(sql, [student_class, version_code, version_code]);
    }

    static getPreviousWinnerList(contest_type, parameter, page_no, database) {
        const sql = `Select * from (Select amount,count as video_count,student_id,date,position,contest_id,type,parameter from contest_winners where date=date_sub(CURRENT_DATE, INTERVAL ? DAY)) as b left join (select student_id,student_fname,student_username,case when img_url='' or img_url is null then '${config.staticCDN}engagement_framework/feed_profile.png' else img_url end as profile_image from students) as a on b.student_id=a.student_id left join (select contest_name,id from contest_details) as c on b.contest_id=c.id`;
        console.log(sql);
        return database.query(sql, [page_no]);
    }

    static getPreviousQuizWinnerList(page_no, database) {
        const sql = `Select student_id,student_username,date_q ,case when img_url='' or img_url is null then '${config.staticCDN}engagement_framework/feed_profile.png' else img_url end as profile_image from quiz_winners where date_q=date_sub(CURRENT_DATE, INTERVAL ? DAY)`;
        console.log(sql);
        return database.query(sql, [page_no]);
    }

    static getQuizWinnerType(data_type, page, button, limit, student_class, database) {
        const sql = `Select cast(student_id as char(50)) as id,'${data_type}' as type,left(student_username,50) as title,case when img_url='' or img_url is null then '${config.staticCDN}engagement_framework/feed_profile.png' else img_url end as image_url from quiz_winners where date_q=date_sub(CURRENT_DATE, INTERVAL ? DAY)`;
        // console.log(sql);
        return database.query(sql, [page]);
    }

    static getEngagementType(type, class1, dn_logo, page_no, limit, database) {
        const sql = `select 'doubtnut'  as student_username,'${dn_logo}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category from engagement where class in (?,'all') and start_date <= CURRENT_TIMESTAMP and type = ? order by created_at desc limit ?  OFFSET ${Utility.getOffset(page_no, limit)}`;
        console.log(sql);
        return database.query(sql, [class1, type, limit]);
    }

    static getExtraFilter(type, class1, dn_logo, page_no, limit, database) {
        const sql = `select 'doubtnut'  as student_username,'${dn_logo}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category from engagement where class in (?,'all') and type ='youtube' and en_options =? and start_date <= CURRENT_TIMESTAMP order by created_at desc limit ?  OFFSET ${Utility.getOffset(page_no, limit)}`;
        console.log(sql);
        return database.query(sql, [class1, type, limit]);
    }

    // getentitylikes
    static entityLikes(id, type, database) {
        const sql = 'Select a.student_id, b.img_url as student_avatar, b.student_username, a.created_at from (Select * from user_engagement_feedback where resource_id=? and resource_type =? and is_like =1 order by id desc) as a left join (Select student_id,img_url, student_username from students) as b on a.student_id = b.student_id order by id desc';
        console.log(sql);
        return database.query(sql, [id, type]);
    }

    static getImageData(image_data, database) {
        const sql = 'select  height, width from image_data where image_path = ? order by created_at desc limit 1 ';
        console.log(sql);
        return database.query(sql, [image_data]);
    }

    static getPinnedPost(student_class, filter, database) {
        const sql = 'select * from  (select  * from pinned_post where class in (?,\'all\') and type = ? and is_active = 1 and `start_date` <= CURRENT_TIMESTAMP and `end_date` >=CURRENT_TIMESTAMP order by created_at desc limit 1 ) as a left join (select student_id,student_username,img_url as profile_image from students) as b on a.student_id=b.student_id';
        // let sql = "select * from  (select  * from pinned_post where id=572) as a left join (select student_id,student_username,img_url as profile_image from students) as b on a.student_id=b.student_id";
        console.log('pinnned');
        console.log(sql);
        return database.query(sql, student_class, filter);
    }

    static getPinnedPostById(id, database) {
        const sql = 'select a.* , b.student_username, b.img_url as profile_image from (select  * from pinned_post where id = ?) as a left join (select *  from students ) as b on a.student_id=b.student_id';
        console.log(sql);
        return database.query(sql, [id]);
    }

    static postsUnsubscribe(entity_id, entity_type, student_id, database) {
        const sql = 'INSERT INTO user_unsubscribe_posts(entity_id, entity_type, student_id) VALUES (?,?,?)';
        return database.query(sql, [entity_id, entity_type, student_id]);
    }
};
