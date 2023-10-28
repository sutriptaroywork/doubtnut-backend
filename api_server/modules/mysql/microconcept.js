const _ = require('lodash');
// let Utility = require('./utility');
module.exports = class Microconcept {
    static getByMcCourseMappingByClassAndCourse(microconcept_id, student_class, student_course, database) {
        const sql = 'select * from mc_course_mapping where mc_id = ? AND class=? AND course = ?';

        return database.query(sql, [microconcept_id, student_class, student_course]);
    }

    static getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, subtopic_order, microconcept_order, subject, database) {
        const sql = 'select * from mc_course_mapping where class=? AND course = ? AND chapter_order = ? AND sub_topic_order=? AND micro_concept_order = ? AND subject=?';
        // console.log(sql)
        return database.query(sql, [student_class, student_course, chapter_order, subtopic_order, microconcept_order, subject]);
    }

    static getByMcCourseMappingByClassAndCourseWithLanguage(microconcept_id, student_class, student_course, language, database) {
        const sql = `select a.*, case when c.${language} is null then b.ocr_text else c.${language} end as mc_text, case when x.${language} is null then a.chapter else x.${language} end as chapter_display,a.chapter,case when y.${language} is null then a.subtopic else y.${language} end as subtopic_display,a.subtopic from (select * from mc_course_mapping where mc_id = '${microconcept_id}' AND class='${student_class}' AND course = '${student_course}' AND active_status=1 ) as a left join ( select question_id,ocr_text,doubt from questions where is_answered=1) as b on a.mc_id=b.doubt left join (select question_id,${language} from questions_localized) as c on b.question_id=c.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on a.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on a.subtopic=y.subtopic`;
        return database.query(sql);
    }

    static getByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, subtopic_order, microconcept_order, language, database) {
        const sql = `select a.*, case when c.${language} is null then b.ocr_text else c.${language} end as mc_text from (select * from mc_course_mapping where class='${student_class}' AND course = '${student_course}' AND chapter_order = '${chapter_order}' AND sub_topic_order='${subtopic_order}' AND micro_concept_order = '${microconcept_order}' AND active_status=1 ) as a left join ( select question_id,ocr_text,doubt from questions where is_answered=1) as b on a.mc_id=b.doubt left join (select question_id,${language} from questions_localized) as c on b.question_id=c.question_id`;
        console.log(sql);
        return database.query(sql);
    }

    static getSimilarQuestionsByMcId(mc_id, limit, database) {
        const sql = `select a.question_id,b.ocr_text,b.question,b.matched_question from (select question_id from questions_meta where microconcept = '${mc_id}' order by rand() ASC LIMIT ${limit}) as a left join (select question_id,ocr_text,question,matched_question from questions) as b on a.question_id = b.question_id`;
        return database.query(sql);
    }

    static getPlaylistIdData(mc_id, database) {
        const sql = 'select * from new_library WHERE id in (select master_parent from new_library where id in (select final_order from mc_course_mapping where mc_id=?))';
        console.log(sql);
        return database.query(sql, [mc_id]);
    }

    static getDistinctMcByClassAndCourse(chapter_class, chapter, database) {
        const sql = "select distinct(microconcept) from questions_meta where chapter=? and class=?  and microconcept is not null and microconcept <> '' and (microconcept like 'CV_%' or microconcept like 'MC_%')";
        return database.query(sql, [chapter, chapter_class]);
    }

    static getQuestionsByClassAndCourse(chapter_class, chapter, database) {
        const sql = 'select b.question_id, b.ocr_text from ((select question_id, class, chapter from questions_meta where chapter = ? and class=?) as a left join (select question_id, ocr_text from questions where is_answered=1 and student_id <100) as b on a.question_id=b.question_id) where b.question_id is not null';
        return database.query(sql, [chapter, chapter_class]);
    }
};
