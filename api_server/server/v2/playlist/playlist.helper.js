module.exports = class PlaylistHelper {
    static getPlaylistCreationParams(data) {
        const param = {};
        param.name = data.playlist_name;
        param.is_first = 0;
        param.is_last = 1;
        param.is_admin_created = 0;
        param.parent = 0;
        param.resource_path = 'select b.*,a.question_id,case when f.xxlanxx is null then a.ocr_text else f.xxlanxx end as ocr_text,a.doubt,a.question, case when b.chapter is null then a.chapter else b.chapter end as chapter,case when x.xxlanxx is null then b.chapter else x.xxlanxx end as chapter,case when y.xxlanxx is null then b.subtopic else y.xxlanxx end as subtopic, case when b.class is null then a.class else b.class end as class,e.packages from (Select question_id from playlist_questions_mapping where playlist_id=? and is_active=1) as t1 left join  (SELECT question_id,ocr_text,doubt,question,chapter,class from questions) as a on t1.question_id = a.question_id left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id left join (select question_id,xxlanxx from questions_localized) as f on a.question_id=f.question_id left join (select chapter,min(xxlanxx) as xxlanxx from localized_ncert_chapter group by chapter) as x on a.chapter=x.chapter left join (select subtopic,min(xxlanxx) as xxlanxx from localized_subtopic group by subtopic) as y on b.subtopic=y.subtopic order by a.doubt ASC';
        param.resource_type = 'playlist';
        param.resource_description = 'playlist';
        param.student_class = data.student_class;
        param.student_course = data.student_course;
        param.playlist_order = 0;
        param.student_id = data.student_id;
        param.is_active = 1;
        return param;
    }
};
