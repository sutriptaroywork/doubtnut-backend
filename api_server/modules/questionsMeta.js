module.exports = class QuestionsMeta {
    static getQuestionMeta(database, question_id) {
        const sql = 'select distinct a.question_id,b.chapter,b.subject,b.class from (SELECT chapter,microconcept,class,question_id FROM `questions_meta` where question_id =?) as a left join (select * from mc_course_mapping) as b on a.microconcept=b.mc_id order by a.question_id asc';
        return database.query(sql, [question_id]);
    }
};

// let sql = "select class,chapter, from questions_meta where question_id ="+question_id;
// 11468898
