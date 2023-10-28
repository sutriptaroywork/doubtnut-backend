module.exports = class Personalization {
    static getDistinctMcByPlaylistId(id, database) {
        const sql = 'select microconcept from personalization_distinct_microconcept_latest where playlist_id=?';
        return database.query(sql, [id]);
    }

    static getLiveclassByPlaylistId(id, database, locale) {
        const sql = 'select * from questions where question_id in (select etoos_question_id from etoos_mc_course where mc_id in ( select microconcept from personalization_distinct_microconcept_latest where playlist_id in (?))) and question_image <>"NONE";';
        return database.query(sql, [id]);
    }

    static getMcVideosByPlaylistId(id, database) {
        const sql = 'select b.question_id, b.ocr_text,a.type, c.hindi as ocr_text_hindi from (select * from personalization_distinct_mc_questions_latest where playlist_id=? ) as a left join questions as b on a.question_id=b.question_id left join questions_localized as c on a.question_id=c.question_id where b.question_id is not null';
        return database.query(sql, [id]);
    }

    static getVideoViewByQuestionList(questionArray, student_id, database) {
        const sql = 'select distinct(question_id) from video_view_stats where student_id = ? and question_id in (?)';
        console.log(sql);
        return database.query(sql, [student_id, questionArray]);
    }

    static getDurationByQuestionList(questionArray, database) {
        const sql = 'select e.answer_id,e.question_id,e.duration from ((select MAX(answer_id) as id from answers where question_id in (?) group by question_id) as d left join answers as e on d.id=e.answer_id)';
        console.log(sql);
        return database.query(sql, [questionArray]);
    }

    static getLocalizedChapters(chapters, database) {
        const sql = 'SELECT * from english_hindi_chapter_mapping where chapter_en in (?)';
        return database.query(sql, [chapters]);
    }

    static getChapterNameandBookName(database, question_id) {
        const sql = 'select * from questions where question_id= ?';
        return database.query(sql, [question_id]);
    }

    static getPlaylistWithBookAndChapterName(database, bookName, chapter) {
        // const sql = `select e.answer_id,e.question_id,e.duration from ((select MAX(answer_id) as id from answers where question_id in (select question_id from questions where chapter =? and book = ? ) group by question_id) as d left join answers as e on d.id=e.answer_id) limit 25`;
        // const sql= `select * from questions where chapter =? and book = ? limit 25;`
        const sql = 'select q.question_id,q.ocr_text, a.duration from questions q join (select MAX(answer_id) as id, question_id, duration from answers where question_id in (select question_id from questions where chapter = ?  and book = ? ) group by question_id) as a on a.question_id = q.question_id limit 25;';
        return database.query(sql, [chapter, bookName]);
    }

    static getLiveclassByQuestionId(questionId, database, locale) {
        const sql = `select * from questions where question_id in (select etoos_question_id from etoos_mc_course where mc_id in
            ( select microconcept from personalization_distinct_microconcept_latest where playlist_id in
                (select playlist_id from personalization_distinct_microconcept_latest where microconcept in (select microconcept from question_meta where question_id=?)))) and question_image <>"NONE";`;
        return database.query(sql, [questionId]);
    }

    static getActiveSlots(database, student_id) {
        const sql = 'SELECT * from student_slot_mapping where student_id= ?';
        return database.query(sql, [student_id]);
    }
};
