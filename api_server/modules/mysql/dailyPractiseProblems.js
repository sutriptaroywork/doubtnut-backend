module.exports = class DailyPractiseProblems {
    static getByStudentId(student_id, limit, database) {
        const sql = `select a.*,b.* from ( SELECT question_id,student_id from student_daily_problems_qid where student_id = ? and date(timestamp) = CURDATE() ) as a left join (select ocr_text,question_id,question from questions ) as b on a.question_id = b.question_id order by rand() limit ?`;
        return database.query(sql, [student_id, limit]);
    }

    static getByStudentIdWithLanguage(student_id, limit, language, database) {
        const sql = `select a.*,b.question, case when c.${language} is null then b.ocr_text else c.${language} end as ocr_text from ( SELECT question_id,student_id from student_daily_problems_qid where student_id = ? and date(timestamp) = CURDATE() ) as a left join (select ocr_text,question_id,question from questions ) as b on a.question_id = b.question_id left join (select question_id,${language} from questions_localized) as c on a.question_id = c.question_id order by rand() limit ?`;
        return database.query(sql, [student_id, limit]);
    }

    static getDPPVideoType(base_url, gradient, type, description, page, capsule_bg_color, capsule_text_color, student_id, student_class, limit, duration_text_color, duration_bg_color, database) {
        const sql = `SELECT cast(b.question_id as char(50)) as id,'${type}' as type,b.subject, case when b.matched_question is null then concat('${base_url}',b.question_id,'.png') else concat('${base_url}',b.matched_question,'.png') end as image_url, left(b.ocr_text,100) AS title, left('${description}',100) as description, '${page}' as page, '${capsule_bg_color}' as capsule_bg_color, '${capsule_text_color}' as capsule_text_color, case when b.student_id not in (80,81,82,83,84,85,86,87,88,89,90,98) then '${gradient[0]}' end as start_gradient, case when b.student_id not in (80,81,82,83,84,85,86,87,88,89,90,98) then '${gradient[1]}' end as mid_gradient, case when b.student_id not in (80,81,82,83,84,85,86,87,88,89,90,98) then '${gradient[2]}' end as end_gradient, c.chapter, c.packages as capsule_text, d.duration,'${duration_text_color}' as duration_text_color,'${duration_bg_color}' as duration_bg_color FROM ( SELECT question_id from student_daily_problems_qid where student_id = '${student_id}' and timestamp >= CURDATE() ) as a left join (select ocr_text,question_id,matched_question,student_id,subject from questions where is_answered = 1) as b on a.question_id = b.question_id left join (select e.chapter,f.packages,e.question_id from questions_meta as e left join question_package_mapping as f on e.question_id=f.question_id ) as c on b.question_id=c.question_id left join(select duration,question_id from answers order by answer_id DESC limit 1) as d on d.question_id=a.question_id limit ${limit}`;
        // console.log(sql);
        return database.query(sql);
    }

    static getDPPVideoTypeWithTextSolutions(base_url, gradient, type, description, page, capsule_bg_color, capsule_text_color, student_id, student_class, limit, duration_text_color, duration_bg_color, database) {
        const sql = `SELECT cast(b.question_id as char(50)) as id,'${type}' as type,b.subject, case when b.matched_question is null then concat('${base_url}',b.question_id,'.webp') else concat('${base_url}',b.matched_question,'.webp') end as image_url, left(b.ocr_text,100) AS title, left('${description}',100) as description, '${page}' as page, '${capsule_bg_color}' as capsule_bg_color, '${capsule_text_color}' as capsule_text_color, case when b.student_id not in (80,81,82,83,84,85,86,87,88,89,90,98) then '${gradient[0]}' end as start_gradient, case when b.student_id not in (80,81,82,83,84,85,86,87,88,89,90,98) then '${gradient[1]}' end as mid_gradient, case when b.student_id not in (80,81,82,83,84,85,86,87,88,89,90,98) then '${gradient[2]}' end as end_gradient, c.chapter, c.packages as capsule_text, d.duration,'${duration_text_color}' as duration_text_color,'${duration_bg_color}' as duration_bg_color FROM ( SELECT question_id from student_daily_problems_qid where student_id = '${student_id}' and timestamp >= CURDATE() ) as a left join (select ocr_text,question_id,matched_question,student_id,subject,case when is_text_answered=1 and is_answered=0 then 'text' else 'video' end as resource_type from questions where (is_answered = 1 or is_text_answered=1)) as b on a.question_id = b.question_id left join (select e.chapter,f.packages,e.question_id from questions_meta as e left join question_package_mapping as f on e.question_id=f.question_id ) as c on b.question_id=c.question_id left join(select duration,question_id from answers order by answer_id DESC limit 1) as d on d.question_id=a.question_id limit ${limit}`;
        // console.log(sql);
        return database.query(sql);
    }
};