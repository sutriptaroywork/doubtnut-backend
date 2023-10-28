module.exports = class Chapter {
    // static getList(database,student_class,student_course){
    //   let sql ="SELECT DISTINCT chapter,ChapterOrder FROM mc_course_mapping WHERE class = '" + student_class + "' AND course = '" + student_course + "' AND active_status=1 order by ChapterOrder ASC";
    //   return database.query(sql);
    // }
    static getList(database, student_class, student_course) {
        const sql = ' ';
        return database.query(sql);
    }

    static getListWithClass(database, student_class, student_course) {
    // let sql ="select distinct mc_course_mapping.chapter,mc_course_mapping.chapter_order,mc_course_mapping.class, class_chapter_image_mapping.image from mc_course_mapping, class_chapter_image_mapping where mc_course_mapping.class = class_chapter_image_mapping.class AND mc_course_mapping.course = class_chapter_image_mapping.course AND mc_course_mapping.chapter = class_chapter_image_mapping.chapter AND mc_course_mapping.class = '" + student_class + "' AND mc_course_mapping.course = '" + student_course + "' AND mc_course_mapping.active_status=1 order by mc_course_mapping.chapter_order ASC";
        const sql = 'select distinct(a.chapter),a.chapter_order, a.class, b.image,b.chapter_display from (select * from mc_course_mapping where class = ? AND course = ? AND active_status = 1 order by class ASC, chapter_order ASC) as a left join (select * from class_chapter_image_mapping where class = ? AND course = ?) as b on a.chapter = b.chapter and a.class=b.class and a.course=b.course';
        // console.log(sql);
        return database.query(sql, [student_class, student_course, student_class, student_course]);
    }

    // static getDetails(database,student_class,student_course,student_chapter){
    //   let sql ="Select a.mc_id, a.chapter, a.class, a.course, a.subtopic, a.question_id, b.answer_id, c.duration from (SELECT * FROM `mc_question_mapping` where class = '" + student_class + "' AND course = '" + student_course + "' AND chapter = '" + student_chapter + "' ) as a left JOIN(select question_id, max(answer_id) as answer_id from answers group by question_id) as b on a.question_id = b.question_id left join answers as c on b.answer_id = c.answer_id";
    //   return database.query(sql);
    // }
    static getDetails(database, student_class, student_course, student_chapter, language) {
        const sql = `select a.id,a.chapter_order,a.sub_topic_order,a.micro_concept_order,a.final_order,a.mc_id,a.class,a.course,a.chapter,a.subtopic,c.${language} as mc_text,a.active_status from (SELECT * FROM \`mc_course_mapping\` where class = ? AND course = ? AND chapter = ? AND active_status = 1 order by sub_topic_order ASC , micro_concept_order ASC) as a left join (select question_id,doubt,ocr_text from questions where is_answered = 1 and student_id < 100) as b on a.mc_id=b.doubt left join (select question_id,${language} from questions_localized) as c on c.question_id = b.question_id`;
        // console.log(sql);
        return database.query(sql, [student_class, student_course, student_chapter]);
    }

    static getChapterStats(database, student_class, student_course, student_chapter) {
        const sql = 'Select a.class, a.course, a.chapter,count(a.mc_id) as total_videos, CEIL(sum(d.duration)/60) as total_duration,e.path_image,e.chapter_display from (SELECT * FROM `mc_course_mapping` where class = ? and course = ? and chapter = ? and active_status = 1) as a left join (select chapter_display,chapter,path_image from class_chapter_image_mapping where class = ? and course = ?) as e on a.chapter = e.chapter '
      + 'left JOIN '
      + '(Select * from questions where is_answered = 1 and student_id < 100 and doubt like \'CV%\') as b '
      + 'on a.mc_id = b.doubt '
      + 'left JOIN '
      + '(Select question_id, max(answer_id) as answer_id from answers group by question_id) as c '
      + 'on b.question_id = c.question_id '
      + 'left join '
      + 'answers as d '
      + 'on c.answer_id=d.answer_id '
      + 'where d.answer_id is not null '
      + 'group by a.class, a.course,a.chapter ';
        // console.log(sql);
        return database.query(sql, [student_class, student_course, student_chapter, student_class, student_course]);
    }

    // static getDetails(database,student_class,student_course,student_chapter){
    //   let sql ="Select a.mc_id, e.mc_text, a.level, a.chapter, a.class, a.course, a.subtopic, a.question_id, b.answer_id, c.duration, case when d.view_id is null then 0 else 1 end as is_watched from (SELECT * FROM `mc_question_mapping` where class = '" + student_class + "' AND course = '" + student_course + "' AND chapter = '" + student_chapter + "' ) as a left JOIN (select question_id, max(answer_id) as answer_id from answers group by question_id) as b on a.question_id = b.question_id left join answers as c on b.answer_id = c.answer_id left join (Select * from video_view_stats where student_id = 7232 and parent_id like 'CV%') as d on b.answer_id = d.answer_id left join (Select distinct mc_id, mc_text from mc_course_mapping) as e on a.mc_id=e.mc_id";
    //   console.log(sql)
    //   return database.query(sql);
    // }
    static getDistinctSubtopics(database, student_class, student_course, student_chapter) {
        const sql = 'SELECT distinct subtopic, sub_topic_order FROM `mc_course_mapping` where class = ? and course = ? and chapter = ? && active_status=1 order by sub_topic_order ASC';
        return database.query(sql, [student_class, student_course, student_chapter]);
    }

    static insertCourseBrowseHistory(database, student_id, student_class, student_course) {
        const sql = 'INSERT INTO `course_browse_history`(`student_id`, `class`, `course`) VALUES (?,?,?)';
        return database.query(sql, [student_id, student_class, student_course]);
    }
};
