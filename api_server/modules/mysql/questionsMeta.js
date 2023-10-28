module.exports = class QuestionsMeta {
    static getQuestionMetaWithMcText(questionId, database) {
        const sql = 'select y.*, GROUP_CONCAT(y.p) as packages from (select DISTINCT * from (select a.*,b.ocr_text as mc_text,c.ocr_text as secondary_mc_text,d.packages as p from (SELECT * FROM questions_meta  WHERE question_id =  ?) as a left join (select question_id,question,ocr_text,doubt from questions) as b on a.microconcept = b.doubt left join (select question_id,question,ocr_text,doubt from questions) as c on a.secondary_microconcept = c.doubt left join (select packages, question_id from question_package_mapping) as d on d.question_id = a.question_id) x) y';
        return database.query(sql, [questionId]);
    }

    static getQuestionMetaWithMcTextWithLanguage(questionId, language, database) {
        const sql = `select a.*,case when x.${language} is null then b.ocr_text else x.${language} end as mc_text, case when y.${language} is null then c.ocr_text else y.${language} end as secondary_mc_text,d.packages, case when m.${language} is null then a.chapter else m.${language} end as chapter_display, a.chapter, case when n.${language} is null then a.subtopic else n.${language} end as subtopic_display, a.subtopic from (SELECT * FROM questions_meta  WHERE question_id =  ?) as a left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as m on a.chapter=m.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as n on a.subtopic=n.subtopic left join (select question_id,question,ocr_text,doubt from questions) as b on a.microconcept = b.doubt left join (select question_id, ${language} from questions_localized ) as x on b.question_id=x.question_id left join (select question_id,question,ocr_text,doubt from questions) as c on a.secondary_microconcept = c.doubt left join (select question_id,${language} from questions_localized) as y on c.question_id=y.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as d on d.question_id = a.question_id`;
        return database.query(sql, [questionId]);
    }

    static getQuestionWithMeta(questionId, database) {
        const sql = 'SELECT questions.student_id, questions.question_id,questions.class as q_class, questions.chapter as q_chapter,  questions.doubt,questions.ocr_text,questions.question,questions.matched_question,questions_meta.class,questions_meta.chapter,questions_meta.subtopic,questions_meta.microconcept,questions_meta.level,questions_meta.target_course,questions_meta.package,questions_meta.type,questions_meta.q_options,questions_meta.q_answer,questions_meta.diagram_type,questions_meta.concept_type,questions_meta.chapter_type,questions_meta.we_type,questions_meta.ei_type,questions_meta.aptitude_type,questions_meta.pfs_type,questions_meta.symbol_type,questions_meta.doubtnut_recommended,questions_meta.secondary_class,questions_meta.secondary_chapter,questions_meta.secondary_subtopic,questions_meta.secondary_microconcept,questions_meta.video_quality,questions_meta.audio_quality,questions_meta.language,questions_meta.ocr_quality,questions_meta.timestamp,questions_meta.is_skipped  FROM questions left join questions_meta on questions_meta.question_id=questions.question_id  WHERE questions.question_id =? AND is_answered=\'1\' AND questions.is_skipped = 0 AND questions.matched_question is NULL';
        return database.query(sql, [questionId]);
    }

    static getQuestionMeta(questionId, database) {
        const sql = 'select * from questions_meta where question_id = ?';
        return database.query(sql, [questionId]);
    }
};
