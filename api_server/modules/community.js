module.exports = class Community {
    static upvoteQuestions(qid, sid, database) {
        const insert_obj = {};
        insert_obj.qid = qid;
        insert_obj.voter_id = sid;
        const sql = 'insert into community_questions_upvote SET ?';
        return database.query(sql, [insert_obj]);
    }

    static updateFlagCommunity(qid, database) {
        const sql = 'UPDATE  questions SET is_community = 1 WHERE question_id=?';
        return database.query(sql, [qid]);
    }

    static getTopVotedQuestions(class1, database) {
        const sql = 'select sum(upvote) as upvotes,community_questions_upvote.voted_at, questions.question_id, questions.class,questions.ocr_text from(community_questions_upvote inner join questions on questions.question_id = community_questions_upvote.qid) where questions.class = ? GROUP BY community_questions_upvote.qid ORDER BY upvotes DESC LIMIT 2';
        return database.query(sql, [class1]);
    }

    static getRecentQuestions(class1, database) {
        const sql = 'select sum(upvote) as upvotes,community_questions_upvote.voted_at,questions.question_id, questions.class,questions.ocr_text from(community_questions_upvote inner join questions on questions.question_id = community_questions_upvote.qid) where questions.class = ? GROUP BY community_questions_upvote.qid ORDER BY voted_at DESC LIMIT 3';
        return database.query(sql, [class1]);
    }

    static getCommunitySubtopics(class1, database) {
        const sql = 'select  DISTINCT  subtopic FROM mc_course_mapping WHERE class = ?';
        return database.query(sql, [class1]);
    }

    static getCommunitySubtopicsWithLanguage(class1, language, database) {
        const sql = `select a.subtopic, case when b.${language} is null then a.subtopic else b.${language} end as subtopic_display from (select  DISTINCT  subtopic FROM mc_course_mapping WHERE class IN (?) and active_status<>0) as a left join (select subtopic,min(${language}) as ${language} from localized_subtopic where class IN (?) group by subtopic) as b on a.subtopic=b.subtopic`;
        return database.query(sql, [class1, class1]);
    }

    static getCommunityChapters(class1, database) {
        if (class1 == '11' || class1 == '12') {
            class1 = "'11','12'";
        }
        const sql = 'select  DISTINCT chapter FROM mc_course_mapping WHERE class IN (?)';
        return database.query(sql, [class1]);
    }

    static getCommunityChaptersWithLanguage(class1, language, database) {
        if (class1 == '11' || class1 == '12') {
            class1 = "'11','12'";
        }
        const sql = `select a.chapter, case when b.${language} is null then a.chapter else b.${language} end as chapter_display from (select DISTINCT chapter FROM mc_course_mapping WHERE class IN (?) and active_status<>0) as a left join (select chapter, min(${language}) as ${language} from localized_chapter where class IN (?) group by chapter ) as b on a.chapter=b.chapter`;
        return database.query(sql, [class1, class1]);
    }

    static addCommunityQuestionMeta(qid, chapter, subtopic, database) {
        const insert_obj = {};
        insert_obj.qid = qid;
        if (typeof chapter !== 'undefined') {
            insert_obj.chapter = chapter;
        }
        if (typeof subtopic !== 'undefined') {
            insert_obj.subtopic = subtopic;
        }

        const sql = 'insert into community_questions_meta SET ?';
        return database.query(sql, [insert_obj]);
    }

    //   static updateFlagCommunity(qid, chapter, subtopic, database) {

    //     let insert_obj = {};
    //     insert_obj.is_community = 1;

    //     let sql = "UPDATE community_meta SET ? where question_id" + q_id;
    //     return database.query(sql, insert_obj);
    //   }

    static updateCommunityUpvote(qid, student_id, database) {
        const insert_obj = {};
        insert_obj.voter_id = student_id;
        insert_obj.qid = qid;

        const sql = 'insert community_questions_upvote SET ?';
        return database.query(sql, [insert_obj]);
    }

    static checkUpvoter(qid, sid, database) {
        const sql = 'select * from community_questions_upvote where qid= ? and voter_id= ?';
        return database.query(sql, [qid, sid]);
    }

    static getCommuniytAskId(qid, sid, database) {
        const sql = 'select student_id from questions where question_id= ? and is_community = 1';
        // console.log(sql);
        return database.query(sql, [qid]);
    }
};
