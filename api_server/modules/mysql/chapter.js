// const _ = require('lodash');
// let Utility = require('./utility');
module.exports = class Language {
    static getListWithClass(database, student_class, student_course, language) {
    // let sql = "select distinct(a." + language + ") as chapter_display,a.chapter,a.chapter_order, a.class, b.image from (select class,course,chapter,chapter_order," + language + " from localized_chapter where class = " + student_class + " AND course = '" + student_course + "' order by class ASC, chapter_order ASC) as a left join (select * from class_chapter_image_mapping where class = " + student_class + " AND course = '" + student_course + "') as b on a.chapter = b.chapter and a.class=b.class and a.course=b.course"
        const sql = `${'select a.chapter,a.chapter_order, a.class, b.image,case when a.chapter is null then b.chapter_display'
      + ' else c.'}${language} end as chapter_display,'${student_course}' as course from (select distinct(chapter) as`
      + ' chapter,chapter_order,'
      + ` class,course from mc_course_mapping where class = ${student_class} AND course = '${student_course}' AND active_status > 0 order by class ASC, chapter_order ASC) as a left join (select * from class_chapter_image_mapping where class = ${student_class} AND course = '${student_course}') as b on a.chapter = b.chapter and a.class=b.class and a.course=b.course left join (select class,course,chapter,chapter_order,${language} from localized_chapter where class='${student_class}' and course='${student_course}') as c on a.chapter=c.chapter`;
        console.log(sql);
        return database.query(sql);
    }

    static getChapterbySubject(database, subject) {
        const sql = 'SELECT DISTINCT (chapter)  from chapter_aliases where subject = ? order by chapter asc';
        return database.query(sql, [subject]);
    }

    static getSubjectsAndChapters(database) {
        const sql = 'select subject, chapter from chapter_aliases';
        return database.query(sql);
    }

    static getSubjects(database) {
        const sql = 'select distinct(subject) from chapter_aliases ';
        return database.query(sql);
    }

    static getChapterbySubjectForMaths(database, subject) {
        const sql = 'SELECT DISTINCT (chapter)  from chapter_aliases where subject = ? and subject = \'Mathematics\' order by chapter asc';
        return database.query(sql, [subject]);
    }

    static getConceptBoosterDataWithClass(base_url, database, gradient, type, description, page, capsule, student_class, student_course, limit, language) {
        const sql = `select concat(a.class,a.course,a.chapter_order) as id,CONVERT(a.class,CHAR(50)) as class, a.course as course,'${type}' as type,c.path_image as image_url,a.chapter as title,'${page}' as page,'' as description,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color, '${gradient[0]}' as start_gradient, '${gradient[1]}' as mid_gradient,'${gradient[2]}' as end_gradient, a.chapter, 'CONCEPT BOOSTER' as capsule_text from (select DISTINCT chapter,chapter_order, class,course from mc_course_mapping where class = ${student_class} AND course = '${student_course}' AND active_status > 0 order by class ASC, chapter_order ASC) as a left join (select * from class_chapter_image_mapping where class = ${student_class} AND course = '${student_course}') as c on a.chapter = c.chapter and a.class=c.class and a.course=c.course order by rand() limit ${limit}`;
        // console.log(sql)
        return database.query(sql);
    }

    static getDetails(database, student_class, student_course, student_chapter, language) {
        const sql = `select a.id,a.chapter_order,a.sub_topic_order,a.micro_concept_order,a.final_order,a.mc_id,a.class,a.course,a.chapter,d.${language} as subtopic, case when c.${language} is null then b.ocr_text else c.${language} end as mc_text,a.active_status from (SELECT * FROM \`mc_course_mapping\` where class = '${student_class}' AND course = '${student_course}' AND chapter = '${student_chapter}' AND active_status > 0 order by sub_topic_order ASC , micro_concept_order ASC) as a left join (select question_id,doubt,ocr_text from questions where is_answered = 1 and student_id < 100) as b on a.mc_id=b.doubt left join (select question_id,${language} from questions_localized) as c on c.question_id = b.question_id left join (select class,course,chapter_order,subtopic_order,subtopic,${language} from localized_subtopic where class = '${student_class}' and course = '${student_course}') as d on a.class=d.class and a.course = d.course and a.chapter_order = d.chapter_order and a.sub_topic_order = d.subtopic_order`;
        console.log(sql);
        return database.query(sql);
    }

    static getSubtopicDetails(database, student_class, student_course, student_chapter, subtopic, language) {
        const sql = `${'select'
      + ' a.id,a.chapter_order,a.sub_topic_order,a.micro_concept_order,a.final_order,a.mc_id,a.class,a.course,a.chapter,d.'}${language} as subtopic, case when c.${language} is null then b.ocr_text else c.${language} end as mc_text,a.active_status from (SELECT * FROM \`mc_course_mapping\` where class = '${student_class}' AND course = '${student_course}' AND chapter = '${student_chapter}' and subtopic = '${subtopic}' AND active_status > 0 order by sub_topic_order ASC , micro_concept_order ASC) as a left join (select question_id,doubt,ocr_text from questions where is_answered = 1 and student_id < 100) as b on a.mc_id=b.doubt left join (select question_id,${language} from questions_localized) as c on c.question_id = b.question_id left join (select class,course,chapter_order,subtopic_order,subtopic,${language} from localized_subtopic where class = '${student_class}' and course = '${student_course}') as d on a.class=d.class and a.course = d.course and a.chapter_order = d.chapter_order and a.sub_topic_order = d.subtopic_order`;
        console.log(sql);
        return database.query(sql);
    }

    static getDistinctChapter(course, class1, database) {
        let sql = '';
        if (course == 'IIT') {
            sql = "SELECT distinct(chapter) FROM questions_meta WHERE chapter is not null and class in ('11','12') and target_course <>'BOARDS' and chapter <> 'Skip' and chapter<>''";
        } else if (course == 'NCERT') {
            sql = `SELECT distinct(chapter) FROM questions WHERE student_id=1 && class='${class1}' && is_answered=1`;
        }
        return database.query(sql);
    }


    static getDistSubtopics(course, chapter, database) {
        const sql = `SELECT distinct(subtopic) FROM questions_meta WHERE chapter='${chapter}' and class in ('11','12') and target_course <>'BOARDS' and subtopic is not null and subtopic <> 'Skip' and subtopic<> ''`;
        return database.query(sql);
    }


    static getDistClasses(course, database) {
        const sql = `SELECT distinct(class) FROM mc_course_mapping where course='${course}' and active_status=1`;
        return database.query(sql);
    }


    static getChapterStats(database, student_class, student_course, student_chapter, language) {
        const sql = `Select a.class, a.course, a.chapter,count(a.mc_id) as total_videos, CEIL(sum(d.duration)/60) as total_duration,e.path_image,x.${language} as chapter_display from (SELECT * FROM \`mc_course_mapping\` where class = '${student_class}' and course = '${student_course}' and chapter = '${student_chapter}' and active_status > 0) as a left join (select chapter_display,chapter,path_image from class_chapter_image_mapping where class = '${student_class}' and course = '${student_course}') as e on a.chapter = e.chapter `
      + 'left JOIN '
      + '(Select * from questions where is_answered = 1 and student_id < 100 and doubt like \'CV%\') as b '
      + 'on a.mc_id = b.doubt '
      + 'left JOIN '
      + '(Select question_id, max(answer_id) as answer_id from answers group by question_id) as c '
      + `on b.question_id = c.question_id left join (select ${language},course,class,chapter from localized_chapter where class = '${student_class}' and course = '${student_course}' and chapter = '${student_chapter}') as x on a.chapter=x.chapter `
      + 'left join '
      + 'answers as d '
      + 'on c.answer_id=d.answer_id '
      + 'where d.answer_id is not null '
      + 'group by a.class, a.course,a.chapter ';
        console.log(sql);
        return database.query(sql);
    }

    static getDistExercises(course, sclass, chapter, database) {
        const sql = 'Select distinct(b.ncert_exercise_name) as exercise_name, (right(left(doubt,instr(a.doubt,\'_\')+6),3)) as exercise from (Select * from questions where student_id = 1 and class = ? and chapter = ?) as a left join ncert_video_meta as b on a.question_id=b.question_id order by exercise ASC';
        return database.query(sql, [sclass, chapter]);
    }

    static getDistSubtopicsForMostWatched(course, sclass, chapter, database) {
    // let sql = "Select distinct(b.subtopic) from (Select * from questions where student_id = (SELECT student_id from studentid_package_mapping where package='"+course+"') and class = '"+sclass+"' and chapter = '"+chapter+"') as a left join ncert_video_meta as b on a.question_id=b.question_id where b.subtopic!='Skip' && b.subtopic!='' && b.subtopic is not NULL order by subtopic ASC"
        const sql = 'SELECT DISTINCT topic as subtopic,chapter  FROM class_chapter_topic where class_name=? && chapter = ?';
        console.log(sql);
        return database.query(sql, [sclass, chapter]);
    }


    static getDistYears(exam, database) {
        let sql = '';
        if (exam == 'Jee Advanced') {
            sql = "SELECT distinct(right(left(doubt,4),2)) as year FROM `questions` where student_id = 8 and doubt like 'JA%' ORDER BY (right(left(doubt,4),2)) ASC";
        } else if (exam == 'Jee Mains') {
            sql = "SELECT distinct(right(left(doubt,5),2)) as year FROM questions where student_id = 3 and doubt like 'JM%' ORDER BY (right(left(doubt,5),2)) ASC";
        } else if (exam == 'X Boards') {
            sql = 'SELECT distinct(right(left(doubt,6),2)) as year FROM `questions` where student_id = 9 ORDER BY (right(left(doubt,6),2)) DESC';
        } else if (exam == 'XII Boards') {
            sql = "SELECT distinct(right(left(doubt,5),2)) as year FROM questions where student_id = 2 and class='12' ORDER BY (right(left(doubt,5),2)) ASC";
        }
        return database.query(sql);
    }

    static getDistClassesForStudyMaterial(study, database) {
        let sql;
        sql = 'SELECT distinct(class) from questions where student_id=(SELECT student_id from studentid_package_mapping where package= ?)';
        return database.query(sql, [study]);
    }

    static getDistChaptersForStudyMaterial(study, sclass, database) {
        let sql;
        let obj = [];
        if (sclass != null) {
            // sql = "SELECT distinct(chapter) from questions where student_id=(SELECT student_id from studentid_package_mapping where package='" + study + "'" + ") and class='" + sclass + "' && is_answered=1";
            sql = 'SELECT distinct(chapter) from questions where student_id=(SELECT student_id from studentid_package_mapping where package=?) and class=? and is_answered=1';
            obj = [study, sclass];
            // sql="SELECT DISTINCT(rds_chapter) as chapter FROM `rds_chapters_list` WHERE class='"+sclass+"' ORDER BY chapter_order";
        } else if (study == 'CENGAGE' && sclass == null) {
            // sql = "SELECT distinct(chapter) FROM (SELECT distinct(chapter),question_id from questions_meta where chapter is not null and chapter<>'Skip' and chapter<>'') as a left join (SELECT student_id,question_id FROM questions) as b on b.question_id=a.question_id where b.student_id=(SELECT student_id from studentid_package_mapping where package='" + study + "'" + ")";
            // sql = "SELECT DISTINCT chapter FROM `questions` where student_id=(SELECT student_id from studentid_package_mapping where package='" + study + "') && is_answered=1";
            sql = 'SELECT DISTINCT chapter FROM subtopic_cen';
        } else {
            sql = 'SELECT distinct(chapter) from questions where student_id=(SELECT student_id from studentid_package_mapping where package=?) && is_answered=1';
            obj = [study];
        }
        return database.query(sql, [obj]);
    }


    static getCodeByChapter(chapter, database) {
        const sql = `SELECT code from \`rds_chapters_list\` WHERE rds_chapter='${chapter}'`;
        console.log(sql);
        return database.query(sql);
    }

    static getDistinctChapterLocalised(locale_val, course, class1, database) {
        console.log('mysql course');
        console.log(course);
        let sql = '';
        if (course == 'IIT') {
            // if(locale_val == 'hindi') {
            //   sql = "SELECT distinct(chapter_hi) as chapter FROM questions_web WHERE chapter is not null AND class in ('11','12') AND target_course <>'BOARDS' AND chapter <> 'Skip' AND chapter<>''";
            // } else {
            //   sql = "SELECT distinct(chapter) FROM questions_web WHERE chapter is not null AND class in ('11','12') AND target_course <>'BOARDS' AND chapter <> 'Skip' AND chapter<>''";
            // }
            if (locale_val == 'hindi') {
                sql = 'select DISTINCT(chapter_hi) as chapter FROM questions_web WHERE student_id=5';
            } else {
                sql = 'select DISTINCT(chapter) as chapter FROM questions_web WHERE student_id=5';
            }
        } else if (course == 'NCERT') {
            if (locale_val == 'hindi') {
                sql = `SELECT distinct(chapter_hi) as chapter FROM questions_web WHERE student_id=1 && class='${class1}'`;
            } else {
                sql = `SELECT distinct(chapter) FROM questions_web WHERE student_id=1 && class='${class1}'`;
            }
        }
        return database.query(sql);
    }

    static getDistinctChapterLocalisedNew(locale_val, course, class1, database) {
        console.log('mysql course');
        console.log(course);
        let sql = '';
        if (course == 'IIT') {
            // if(locale_val == 'hindi') {
            //   sql = "SELECT distinct(chapter_hi) as chapter FROM questions_web WHERE chapter is not null AND class in ('11','12') AND target_course <>'BOARDS' AND chapter <> 'Skip' AND chapter<>''";
            // } else {
            //   sql = "SELECT distinct(chapter) FROM questions_web WHERE chapter is not null AND class in ('11','12') AND target_course <>'BOARDS' AND chapter <> 'Skip' AND chapter<>''";
            // }
            if (locale_val == 'hindi') {
                sql = 'select DISTINCT(chapter_hi) as chapter FROM questions_web WHERE student_id=5';
            } else {
                sql = 'select DISTINCT(chapter) as chapter FROM questions_web WHERE student_id=5';
            }
        } else if (course == 'NCERT') {
            if (locale_val == 'hindi') {
                sql = `SELECT distinct(chapter_hi) as chapter FROM questions_web WHERE student_id=1 && class='${class1}'`;
            } else {
                sql = `SELECT DISTINCT chapter,chapter_order FROM ncert_video_meta WHERE class = '${class1}'`;
            }
        }
        return database.query(sql);
    }

    static getDistSubtopicsLocalised(locale_val, course, chapter, database) {
        let sql = '';
        if (locale_val == 'hindi') {
            sql += 'SELECT distinct(subtopic_hi) as subtopic FROM questions_web WHERE chapter_hi= ? AND student_id=5';
        } else {
            sql += 'SELECT distinct(subtopic) FROM questions_web WHERE chapter= ? AND student_id=5';
        }
        return database.query(sql, [chapter]);
    }

    static getDistClassesLocalised(database) {
        const sql = "SELECT distinct(class) AS class FROM questions_web WHERE student_id='1' ORDER BY class DESC";
        return database.query(sql);
    }

    static getDistExercisesLocalised(locale_val, sclass, chapter, database) {
        let sql = '';
        if (locale_val == 'hindi') {
            sql += 'SELECT DISTINCT(right(left(doubt,instr(doubt,\'_\')+6),3)) as exercise FROM `questions_web` WHERE `student_id` = 1 AND `class` = ? AND `chapter_hi` = ? ORDER BY exercise';
        } else {
            sql += 'SELECT DISTINCT(right(left(doubt,instr(doubt,\'_\')+6),3)) as exercise FROM `questions_web` WHERE `student_id` = 1 AND `class` = ? AND `chapter` = ? ORDER BY exercise';
        }
        return database.query(sql, [sclass, chapter]);
    }

    static getDistYearsLocalised(exam, database) {
        let sql = '';
        if (exam.trim() == 'Jee Advanced') {
            sql = "SELECT distinct(right(left(doubt,4),2)) as year FROM `questions_web` where student_id = 8 and doubt like 'JA%' ORDER BY year";
        } else if (exam.trim() == 'Jee Mains') {
            sql = "SELECT distinct(right(left(doubt,5),2)) as year FROM questions_web where student_id = 3 and doubt like 'JM%' ORDER BY year";
        } else if (exam.trim() == 'X Boards') {
            sql = 'SELECT distinct(right(left(doubt,6),2)) as year FROM `questions_web` where student_id = 9 ORDER BY year';
        } else if (exam.trim() == 'XII Boards') {
            sql = "SELECT distinct(right(left(doubt,5),2)) as year FROM questions_web where student_id = 2 and class='12' ORDER BY year";
        }
        return database.query(sql);
    }

    static getDistClassesForStudyMaterialLocalised(study, database) {
        const sql = "select DISTINCT(class) FROM questions_web WHERE student_id=4 and doubt like '%RD%'";
        return database.query(sql);
    }

    static getDistChaptersForStudyMaterialLocalised(locale_val, study, sclass, database) {
        let sql = '';
        if (sclass != null) {
            if (locale_val == 'hindi') {
                sql += `select DISTINCT(chapter_hi) as chapter FROM questions_web WHERE student_id=4 AND class='${sclass}' and doubt like '%RD%'`;
            } else {
                sql += `select DISTINCT(chapter) FROM questions_web WHERE student_id=4 AND class='${sclass}' and doubt like '%RD%'`;
            }
        } else if (study == 'CENGAGE' && sclass == null) {
            if (locale_val == 'hindi') {
                sql += 'select DISTINCT(chapter_hi) as chapter FROM questions_web WHERE student_id=5';
            } else {
                sql += 'select DISTINCT(chapter) FROM questions_web WHERE student_id=5';
            }
        } else if (locale_val == 'hindi') {
            sql += "select DISTINCT(chapter_hi) as chapter FROM questions_web WHERE student_id=4 AND doubt like '%RD%'";
        } else {
            sql += "select DISTINCT(chapter) FROM questions_web WHERE student_id=4 AND doubt like '%RD%'";
        }
        return database.query(sql);
    }

    static getDistSubtopicsForMostWatchedNew(course, sclass, chapter, database) {
    // let sql = "Select distinct(b.subtopic) from (Select * from questions where student_id = (SELECT student_id from studentid_package_mapping where package='"+course+"') and class = '"+sclass+"' and chapter = '"+chapter+"') as a left join ncert_video_meta as b on a.question_id=b.question_id where b.subtopic!='Skip' && b.subtopic!='' && b.subtopic is not NULL order by subtopic ASC"
        let sql = '';
        if (course === 'NCERT') {
            sql += 'SELECT DISTINCT subtopic,chapter  FROM `questions_web` where questions_web.class=? AND questions_web.chapter = ? AND questions_web.student_id = 1';
        } else if (course === 'RD SHARMA') {
            sql += 'SELECT DISTINCT subtopic,chapter  FROM `questions_web` where questions_web.class=? AND questions_web.chapter = ? AND questions_web.student_id = 4 AND questions_web.doubt like \'%RD%\'';
        }
        return database.query(sql, [sclass, chapter]);
    }

    static getDistChaptersOfContent(locale_val, topic, sclass, database) {
        let sql = '';
        // if (sclass != null) {
        //   if(locale_val == 'hindi') {
        //     sql += "SELECT DISTINCT chapter FROM `listing_page_content` WHERE topic = '"+topic+"' AND class = "+sclass;
        //   } else {
        //     sql += "SELECT DISTINCT chapter FROM `listing_page_content` WHERE topic = '"+topic+"' AND class = "+sclass;
        //   }
        // }
        sql = "SELECT chapter_order as 'order', chapter FROM `listing_page_content` WHERE topic =? AND class=? and chapter_order is not null";
        return database.query(sql, [topic, sclass]);
    }
};
