const _ = require('lodash');
const Utility = require('../utility');

module.exports = class Answer {
    static getByQuestionId(question_id, database) {
        // const sql = 'SELECT a.*, answers.* FROM (Select * from questions where question_id=?) as a inner join answers on a.question_id = answers.question_id order by answers.answer_id desc limit 1';
        const sql = 'SELECT b.*, a.*, c.id as \'text_solution_id\',c.sub_obj,c.opt_1,c.opt_2,c.opt_3,c.opt_4,c.answer as text_answer,c.solutions as text_solutions FROM (Select * from questions where question_id=?) as a left join answers as b on a.question_id = b.question_id left join text_solutions as c on c.question_id=a.question_id order by b.answer_id desc limit 1';
        return database.query(sql, [question_id]);
    }

    static getByQuestionNewId(question_id, database) {
        const sql = 'SELECT a.*, answers.* FROM (Select * from questions_new where question_id=?) as a inner join answers on a.question_id = answers.question_id order by answers.answer_id desc limit 1';
        return database.query(sql, [question_id]);
    }

    static getByQuestionIdWithText(question_id, database) {
        const sql = 'SELECT a.*, answers.* FROM (Select * from questions where question_id=?) as a left join answers on a.question_id = answers.question_id order by answers.answer_id desc limit 1';
        // console.log(sql)
        return database.query(sql, [question_id]);
    }

    static getByMcId(mc_id, database) {
        // let sql = "SELECT questions.*, answers.* FROM questions, answers WHERE questions.question_id = answers.question_id AND questions.doubt = '" + mc_id +"' order by answers.answer_id desc limit 1"
        const sql = 'SELECT a.*, answers.* FROM (Select * from questions where doubt=?) as a inner join answers on a.question_id = answers.question_id order by answers.answer_id desc limit 1';
        return database.query(sql, [mc_id]);
    }

    static getByMcIdWithTextSolution(mc_id, database) {
        const sql = 'SELECT a.*,b.*,c.id as text_solution_id,c.sub_obj,c.opt_1,c.opt_2,c.opt_3,c.opt_4,c.answer as text_answer,c.solutions as text_solutions FROM (Select * from questions where doubt=?) as a left join answers as b on a.question_id = b.question_id left join text_solutions as c on c.question_id=a.question_id order by b.answer_id desc limit 1';
        return database.query(sql, [mc_id]);
    }

    static getByQuestionIdWithTextSolution(questionID, database) {
        // console.log(questionID)
        const sql = 'SELECT b.*, a.*, c.id as \'text_solution_id\',c.sub_obj,c.opt_1,c.opt_2,c.opt_3,c.opt_4,c.answer as text_answer,c.solutions as text_solutions FROM (Select * from questions where question_id=?) as a left join answers as b on a.question_id = b.question_id left join text_solutions as c on c.question_id=a.question_id order by b.answer_id desc limit 1';
        //
        return database.query(sql, [questionID]);
    }

    static getByQuestionIdNewWithTextSolution(questionID, database) {
        const sql = 'SELECT a.*,b.answer_id,b.expert_id,b.answer_video,b.youtube_id, b.is_approved,b.answer_rating,b.answer_feedback,b.youtube_id,b.duration,b.aspect_ratio,b.is_vdo_ready, b.vdo_cipher_id,c.id as \'text_solution_id\',c.sub_obj,c.opt_1,c.opt_2,c.opt_3,c.opt_4,c.answer as text_answer,c.solutions as text_solutions FROM (Select * from questions_new where question_id=?) as a left join answers as b on a.question_id = b.question_id left join text_solutions as c on c.question_id=a.question_id order by b.answer_id desc limit 1';
        return database.query(sql, [questionID]);
    }

    static getSimilarQuestionsByMcId(mc_id, limit, database) {
        // let sql = "select mc_question_mapping.question_id,questions.ocr_text from mc_question_mapping,questions where mc_question_mapping.question_id = questions.question_id AND mc_question_mapping.mc_id = '" + mc_id + "' order by q_num ASC LIMIT " + limit;
        const sql = 'select a.question_id,b.ocr_text,b.question,b.matched_question from (select question_id from questions_meta where microconcept = ? order by rand() ASC LIMIT ?) as a left join (select question_id,ocr_text,question,matched_question from questions) as b on a.question_id = b.question_id';
        return database.query(sql, [mc_id, limit]);
    }

    static getList(database) {
        const sql = 'SELECT * FROM languages WHERE is_active = 1';
        return database.query(sql);
    }

    static getWebUrl(question_id, database) {
        const sql = 'select url_text from web_question_url where question_id=?';
        return database.query(sql, [question_id]);
    }

    static changeLanguage(question_id, language, database) {
        const sql = `SELECT ${language} from questions_localized where question_id =?`;
        return database.query(sql, [question_id]);
    }

    static getByQuestionIdWithLanguage(question_id, language, database) {
        const sql = `SELECT a.*, b.*,case when c.${language} is null then a.ocr_text else c.${language} end as ocr_text FROM (Select * from questions where question_id='${question_id}') as a inner join (select * from answers where question_id = '${question_id}') as b on a.question_id = b.question_id  left join (select question_id,${language} from questions_localized) as c on a.question_id=c.question_id  order by b.answer_id desc limit 1`;
        return database.query(sql);
    }

    static getByMcIdWithLanguage(mc_id, language, database) {
        const sql = `SELECT a.*, answers.*,case when b.${language} is null then a.ocr_text else b.${language} end as ocr_text FROM (Select * from questions where doubt='${mc_id}') as a inner join answers on a.question_id = answers.question_id left join (select question_id,${language} from questions_localized ) as b on a.question_id=b.question_id order by answers.answer_id desc limit 1`;
        return database.query(sql);
    }

    static getPackagesDetail(is_web, student_class, database) {
        let sql;
        if (is_web) {
            sql = 'Select distinct package from pdf_download where status = 1 order by package_order asc';
        } else {
            sql = `Select distinct package from pdf_download where class in ('${student_class}','all') and status = 1 order by package_order asc`;
        }

        return database.query(sql);
    }

    static getLevelCheck(is_web, class1, package_type, database) {
        const sql = 'Select level2 from pdf_download where package = ? and status = 1 limit 1';
        return database.query(sql, [package_type]);
    }

    static getLevelOneWithLocation(is_web, class1, package_type, database) {
        const sql = 'Select distinct level1 , location from pdf_download where package = ? and status = 1 order by id desc';
        return database.query(sql, [package_type]);
    }

    static getLevelOne(is_web, class1, package_type, database) {
        const sql = 'Select distinct(level1) as level1 from pdf_download where package = ? and status = 1 order by right(level1,2) desc';
        return database.query(sql, [package_type]);
    }

    static getLevelTwo(is_web, class1, package_type, level1, database) {
        const sql = 'SELECT DISTINCT(level2) as level2,location FROM pdf_download WHERE package=? && level1=? and status = 1 order by id desc';
        return database.query(sql, [package_type, level1]);
    }

    static getAllPackages(database) {
        const sql = 'SELECT DISTINCT(package) FROM `pdf_download_level_mapping` WHERE status=1';
        return database.query(sql);
    }

    static getFirstLevel(package_name, database) {
        let sql;
        if (package_name == 'X BOARDS PREVIOUS YEAR' || package_name == 'XII BOARDS PREVIOUS YEAR') {
            sql = 'SELECT DISTINCT(level_1) as level1,location FROM `pdf_download_location` WHERE package=? order by right(level_1,4) desc';
        } else if (package_name == 'NCERT' || package_name == 'RD SHARMA' || package_name == 'JEE RANK BOOSTER' || package_name == 'JEE CONCEPTS BOOSTER' || package_name == 'BOARDS CONCEPTS BOOSTER') {
            sql = 'SELECT DISTINCT(level_1) as level1 FROM `pdf_download_location` WHERE package=? order by right(level_1,2) desc';
        } else if (package_name == 'SUPER-40 SERIES JEE MAINS' || package_name == 'SUPER-40 SERIES GOVT EXAMS' || package_name == 'IBPS CLERK EXAM SPECIAL' || package_name == 'CLASS 10 PRE-BOARD SPECIAL' || package_name == 'CLASS 12 PRE-BOARD SPECIAL' || package_name == 'CLASS 10 BOARDS SAMPLE PAPER' || package_name == 'CLASS 12 BOARDS SAMPLE PAPER' || package_name == 'JEE ADVANCED SUPER 25' || package_name == 'JEE MAINS SAMPLE PAPER' || package_name == 'CLASS 9 FOUNDATION COURSE' || package_name == 'FORMULA SHEETS') {
            sql = 'SELECT DISTINCT(level_1) as level1,location FROM `pdf_download_location` WHERE package=?';
        } else {
            sql = 'SELECT DISTINCT(level_1) as level1 FROM `pdf_download_location` WHERE package=? order by level1 asc';
        }

        return database.query(sql, [package_name]);
    }

    static getSecondLevel(package_name, level1, database) {
        let sql;
        if (package_name == 'JEE PREVIOUS YEAR') {
            sql = 'SELECT DISTINCT(level_2) as level2,location FROM `pdf_download_location` WHERE package= ? && level_1= ? order by right(level_2,4) desc';
        } else {
            sql = 'SELECT DISTINCT(level_2) as level2,location FROM `pdf_download_location` WHERE package= ? && level_1= ? order by level_2 asc';
        }

        return database.query(sql, [package_name, level1]);
    }

    static getDownloadLinks(package_name, level1, level2, database) {
        let sql; let obj = [];
        if (!_.isNull(level2)) {
            sql = 'SELECT location FROM pdf_download_location WHERE package= ? && level_1= ? && level_2= ?';
            obj = [package_name, level1, level2];
        } else {
            sql = 'SELECT location FROM pdf_download_location WHERE package=? && level_1=?';
            obj = [package_name, level1];
        }

        return database.query(sql, obj);
    }

    static getFirstLevelWeb(package_name, database) {
        let sql;
        if (package_name == 'X BOARDS PREVIOUS YEAR' || package_name == 'XII BOARDS PREVIOUS YEAR') {
            sql = 'SELECT DISTINCT(level_1) as level1,location FROM pdf_download_location WHERE package= ? order by right(level_1,4) desc';
        } else if (package_name == 'NCERT' || package_name == 'RD SHARMA' || package_name == 'JEE RANK BOOSTER' || package_name == 'JEE CONCEPTS BOOSTER' || package_name == 'BOARDS CONCEPTS BOOSTER') {
            sql = 'SELECT DISTINCT(level_1) as level1 FROM pdf_download_location WHERE package= ? order by right(level_1,2) desc';
        } else if (package_name == 'SUPER-40 SERIES JEE MAINS' || package_name == 'SUPER-40 SERIES GOVT EXAMS' || package_name == 'IBPS CLERK EXAM SPECIAL' || package_name == 'CLASS 10 PRE-BOARD SPECIAL' || package_name == 'CLASS 12 PRE-BOARD SPECIAL' || package_name == 'CLASS 10 BOARDS SAMPLE PAPER' || package_name == 'CLASS 12 BOARDS SAMPLE PAPER' || package_name == 'JEE ADVANCED SUPER 25' || package_name == 'JEE MAINS SAMPLE PAPER' || package_name == 'CLASS 9 FOUNDATION COURSE' || package_name == 'FORMULA SHEETS') {
            sql = 'SELECT DISTINCT(level_1) as level1,location FROM pdf_download_location WHERE package= ?';
        } else {
            sql = 'SELECT DISTINCT(level_1) as level1 FROM pdf_download_location WHERE package= ? order by level1 asc';
        }

        return database.query(sql, [package_name]);
    }

    static getSecondLevelWeb(package_name, level1, database) {
        let sql;
        if (package_name == 'JEE PREVIOUS YEAR') {
            sql = 'SELECT DISTINCT(level_2) as level2,location FROM `pdf_download_location` WHERE package= ? && level_1= ? order by right(level_2,4) desc';
        } else if (package_name == 'NCERT') {
            sql = 'SELECT DISTINCT(a.level2),a.location,b.chapter_order FROM (SELECT DISTINCT(level_2) as level2,level_1,location FROM pdf_download_location WHERE package= ? && level_1= ? order by level_2 asc ) as a left join (SELECT class,chapter,chapter_order FROM ncert_video_meta) as b on right(a.level_1,2)= b.class && a.level2=b.chapter';
        } else {
            sql = 'SELECT DISTINCT(level_2) as level2,location FROM `pdf_download_location` WHERE package= ? && level_1= ? order by level_2 asc';
        }

        return database.query(sql, [package_name, level1]);
    }

    static getJeeAdvanceSimilarVideos(doubt, limit, database) {
        const slicedDoubt = Utility.sliceDoubt(doubt);
        const sql = `SELECT question_id,ocr_text,question FROM \`questions\`where doubt like '${slicedDoubt}%' and student_id = 8 and doubt <> '${doubt}' order by doubt ASC limit ${limit}`;

        return database.query(sql);
    }

    static getJeeMainsSimilarVideos(doubt, limit, database) {
        const slicedDoubt = Utility.sliceDoubt(doubt);
        const sql = `SELECT question_id,ocr_text,question FROM \`questions\`where doubt like '${slicedDoubt}%' and student_id = 3 and doubt <> '${doubt}' order by doubt ASC limit ${limit}`;

        return database.query(sql);
    }

    static getXSimilarVideos(doubt, limit, database) {
        const slicedDoubt = Utility.sliceDoubt(doubt);
        const sql = `SELECT question_id,ocr_text,question FROM \`questions\`where doubt like '${slicedDoubt}%' and student_id = 9 and doubt <> '${doubt}' order by doubt ASC limit ${limit}`;

        return database.query(sql);
    }

    static getXIISimilarVideos(doubt, limit, database) {
        const slicedDoubt = Utility.sliceDoubt(doubt);
        const sql = `SELECT question_id,ocr_text,question FROM \`questions\`where doubt like '${slicedDoubt}%' and student_id = 2 and doubt <> '${doubt}' order by doubt ASC limit ${limit}`;

        return database.query(sql);
    }

    static getNcertSimilarVideos(doubt, limit, database) {
        const slicedDoubt = Utility.sliceDoubt(doubt);
        const sql = `SELECT question_id,ocr_text,question FROM \`questions\`where doubt like '${slicedDoubt}%' and student_id = 1 and doubt <> '${doubt}' order by doubt ASC limit ${limit}`;

        return database.query(sql);
    }

    // methods for ads______________________________________________________________________________________________________

    static getPreAds(database) {
        const sql = "select * from video_ads where ad_type='PRE' and is_active = 1 order by created_at desc limit 1";

        return database.query(sql);
    }

    static getPostAds(database) {
        const sql = "select * from video_ads where ad_type='POST' and is_active = 1 order by created_at desc limit 1";

        return database.query(sql);
    }

    // _____________________________________________________________________________________________________________________

    // method for total likes

    static getTotLikes(question_id, database) {
        const sql = 'select count(*) as total_likes from user_answer_feedback where question_id = ? AND rating =5';
        return database.query(sql, [question_id]);
    }

    static getTotLikesWeb(question_id, database) {
        const sql = 'select COUNT(*) as total_web_likes from web_activity where question_id = ? AND type=1';
        return database.query(sql, [question_id]);
    }

    static getEngagementId(class1, question_id, database) {
        const sql = 'select id from engagement where question_id=? and class in (?,\'all\')';
        return database.query(sql, [question_id, class1]);
    }

    static getPinnedPostId(class1, question_id, database) {
        const sql = 'select * from pinned_post where question_id=? and class in (?,\'all\')';

        return database.query(sql, [question_id, class1]);
    }

    static getByQuestionIdLocalised(locale_val, question_id, database) {
        // let sql = "SELECT a.*, web_question_url.url_text, web_question_url.canonical_url FROM(SELECT questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class,"
        // if(locale_val == 'hindi') {
        //   sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.mc_id, questions_web.mc_text, questions_web.question_timestamp, questions_web.matched_question, questions_web.packages, questions_web.matched_student_id, answers.answer_video, answers.youtube_id,answers.duration, answers.timestamp as answer_creation FROM `questions_web` LEFT JOIN answers ON questions_web.question_id = answers.question_id WHERE questions_web.`question_id` = "+question_id+" LIMIT 1) AS a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id "
        // } else {
        //   sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.mc_id, questions_web.mc_text, questions_web.question_timestamp, questions_web.matched_question, questions_web.packages, questions_web.matched_student_id, answers.answer_video, answers.youtube_id,answers.duration, answers.timestamp as answer_creation FROM `questions_web` LEFT JOIN answers ON questions_web.question_id = answers.question_id WHERE questions_web.`question_id` = "+question_id+" LIMIT 1) AS a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id "
        // }
        // sql += "WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' AND web_question_url.canonical_url IS NOT NULL AND web_question_url.canonical_url <> ''"
        // let sql = "select * from (select * from questions_web where `question_id` = '"+question_id+"' LIMIT 1) as a left join (select * from web_question_url where url_text IS NOT NULL AND url_text <> '' AND canonical_url IS NOT NULL AND canonical_url <> '') as b on a.question_id=b.question_id left join (select * from answers where question_id='"+question_id+"' order by answer_id desc limit 1) as c on a.question_id=c.question_id"
        const sql = 'select a.*, b.*, c.answer_id, c.answer_video, c.youtube_id, c.timestamp, c.duration from (select * from questions_web where `question_id` = ? LIMIT 1) as a left join (select * from web_question_url where url_text IS NOT NULL AND canonical_url IS NOT NULL AND canonical_url <> \'\') as b on a.question_id=b.question_id left join (select * from answers where question_id= ? order by answer_id desc limit 1) as c on a.question_id=c.question_id';

        return database.query(sql, [question_id, question_id]);
    }

    static getPreviousHistory(student_id, database) {
        const sql = 'select question_id,parent_id from video_view_stats where student_id= ? and is_back = 0 and parent_id <> 0 order by view_id desc limit 1';

        return database.query(sql, [student_id]);
    }

    static getTagList(questionId, database) {
        const sql = 'select GROUP_CONCAT(tag SEPARATOR \'$#\') as tags_list from questions_book_meta where question_id=?';
        return database.query(sql, [questionId]);
    }

    static getImageSummary(database, questionId) {
        const sql = 'select * from video_summary_image where question_id = ? and is_active = 1 limit 1';
        return database.query(sql, [questionId]);
    }

    static async getPlaylistByQuestionId(questionId, tag, database) {
        // eslint-disable-next-line quotes
        const sql = `select * from questions_book_meta where question_id=? and binary tag=?`;
        return database.query(sql, [questionId, tag]);
    }

    static async getPlaylistByBookmeta(bookMeta, page, limit, database) {
        const sql = `select b.*,a.*,'' as packages from (Select question_id from questions_book_meta where book_meta= ? and matched_question is null) as t1 left join (SELECT question_id,ocr_text,doubt,question,chapter,class from questions) as a on t1.question_id = a.question_id left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        return database.query(sql, [bookMeta, limit]);
    }

    static getSolutionByQuestionId(database, questionId) {
        const sql = 'select * from text_solutions where question_id= ?';
        return database.query(sql, [questionId]);
    }

    static insertTextSolution(database, data) {
        const sql = 'INSERT into text_solutions set ?';
        return database.query(sql, data);
    }

    static updateQuestionStatusIsAnswered(database, questionId, matchedQuestionId) {
        const sql = 'UPDATE questions set is_text_answered = 1, matched_question=? where question_id =?';
        return database.query(sql, [matchedQuestionId, questionId]);
    }

    static addTextSolutionFromMatchedQuestion(database, solution, questionId) {
        const sql = 'INSERT into text_solutions set solution =? where questionId =?';
        return database.query(sql, [solution, questionId]);
    }

    static addTextSolution(database, data) {
        const sql = 'INSERT into text_solutions set ?';
        return database.query(sql, data);
    }

    static updateTextSolution(database, data, questionId) {
        const sql = 'UPDATE text_solutions set ? where question_id =?';
        return database.query(sql, [data, questionId]);
    }

    static getQidSimilar(database, qid) {
        const sql = 'select question_id,ocr_text from questions where question_id= ?';
        return database.query(sql, [qid]);
    }

    static getPackgeListOfChapterAlias(database, sClass, masterChapterAlias) {
        const sql = 'select package_id from question_chapter_alias where class=? and master_chapter_alias=? group by package_id';
        return database.query(sql, [sClass, masterChapterAlias]);
    }

    static getDataByChapterAlias(database, masterChapterAlias, sClass, packageid) {
        const sql = packageid.map((x) => (`(select * from question_chapter_alias where package_id='${x.package_id}'  and class='${sClass}' and master_chapter_alias='${masterChapterAlias}' limit 10)`)).join(' union all ');
        return database.query(sql);
    }

    static getSmartData(qid, sid, database) {
        const sql = 'SELECT a.* FROM smart_content_video AS a LEFT JOIN student_course_mapping AS b ON a.ccm_id = b.ccm_id WHERE a.question_id = ? AND b.student_id = ? ORDER BY number_of_users DESC LIMIT 1';
        return database.query(sql, [qid, sid]);
    }

    static getUserPics(ccm_id, next_qid, database) {
        const sql = 'SELECT student_id, img_url FROM students WHERE student_id IN (SELECT DISTINCT b.student_id FROM student_course_mapping AS a LEFT JOIN video_view_stats AS b ON a.student_id = b.student_id WHERE a.ccm_id = ? AND b.question_id = ?) AND img_url IS NOT NULL LIMIT 3';
        return database.query(sql, [ccm_id, next_qid]);
    }

    static getAdditionalPics(users, length, student_id, database) {
        let limit = 3;
        const random = Math.ceil(Math.random() * 2000);
        if (users != '') {
            users += `,${student_id.toString()}`;
        } else {
            users += `${student_id.toString()}`;
        }
        let sql = 'SELECT student_id, img_url FROM students WHERE img_url IS NOT NULL ';
        if (users != '') {
            limit = 3 - length;
            sql += `AND student_id NOT IN (${users}) `;
        }
        sql += `ORDER BY student_id DESC LIMIT ${random}, ${limit}`;
        return database.query(sql);
    }

    static getViewData(database, qid) {
        const sql = 'SELECT * FROM video_view_stats WHERE question_id = ? ORDER BY view_id DESC LIMIT 200';
        return database.query(sql, [qid]);
    }

    static getVideoLocale(database, studentID) {
        const sql = 'select video_language from studentid_package_mapping_new where student_id=?';
        return database.query(sql, [studentID]);
    }

    static getAnswerVideoResource(database, answerID) {
        const sql = 'select * from answer_video_resources where answer_id = ?  and is_active=1 order by resource_order asc';
        return database.query(sql, [answerID]);
    }

    static updateAnswerVideoResourceOrder(database, answerID) {
        const sql = 'UPDATE answer_video_resources SET resource_order = resource_order + 1 WHERE answer_id = ? and is_active=1';
        return database.query(sql, [answerID]);
    }

    static addAnswerVideoResource(database, data) {
        const sql = 'insert into answer_video_resources set ?';
        return database.query(sql, [data]);
    }

    static inActiveAnswerVideoResource(database, answerID, resourceType) {
        const sql = 'update answer_video_resources set is_active=0 where answer_id= ? and resource_type=?';
        return database.query(sql, [answerID, resourceType]);
    }

    static getAnswerVideoResourceByAnswerIDResourceType(database, answerID, resourceType) {
        const sql = 'select * from  answer_video_resources where is_active=1 and answer_id = ? and resource_type=?';
        return database.query(sql, [answerID, resourceType]);
    }

    static getAllAnswerVideoResource(database, answerID) {
        const sql = 'select * from answer_video_resources where answer_id = ? order by resource_order asc';
        return database.query(sql, [answerID]);
    }

    static updateAnswerVideoResource(database, id, isActive, resourceOrder) {
        const sql = 'update answer_video_resources set is_active=?, resource_order=? where id= ?';
        return database.query(sql, [isActive, resourceOrder, id]);
    }

    static updateAnswers(database, answerId, answerVideo, is_vdo_ready, vdo_cipher_id) {
        const sql = 'update answers set answer_video=?, is_vdo_ready=?, vdo_cipher_id=? where answer_id= ?';
        return database.query(sql, [answerVideo, is_vdo_ready, vdo_cipher_id, answerId]);
    }

    static getUsExam(database, questionId) {
        const sql = 'SELECT a.question_id,a.student_id,a.ocr_text,b.package,b.target_group,b.video_language from (SELECT *  FROM questions as a WHERE question_id = ?) as a left join studentid_package_mapping_new as b on a.student_id = b.student_id';
        return database.query(sql, questionId);
    }

    static getDurationByAnswerId(database, answerId) {
        const sql = 'SELECT duration FROM answers WHERE answer_id = ?';
        return database.query(sql, answerId);
    }

    static getDetailsByAnswerId(database, answerId) {
        const sql = 'SELECT * FROM answers WHERE answer_id = ?';
        return database.query(sql, answerId);
    }

    static getByQuestionIdNew(database, question_id) {
        const sql = 'SELECT q.*, a.answer_id FROM questions q LEFT JOIN answers a ON q.question_id = a.question_id WHERE q.question_id = ? ORDER BY a.answer_id DESC LIMIT 1';
        return database.query(sql, [question_id]);
    }

    static getLikedVideosByStudentId(database, studentId) {
        const sql = 'SELECT uaf.answer_id, uaf.answer_video, q.* FROM user_answer_feedback uaf LEFT JOIN questions q ON uaf.question_id = q.question_id LEFT JOIN answers a ON uaf.answer_id = a.answer_id WHERE uaf.student_id = ? AND uaf.rating = 5 ORDER BY uaf.timestamp DESC';
        return database.query(sql, studentId);
    }

    static getCompletedTopic(database, studentId) {
        const sql = 'SELECT dd.*, ddr.type FROM daily_doubt dd LEFT JOIN daily_doubt_resources ddr ON dd.id = ddr.topic_reference WHERE dd.sid = ? AND dd.date = DATE(NOW()) AND ddr.is_viewed = 1 ORDER BY dd.id DESC';
        return database.query(sql, studentId);
    }

    static getTopicDetails(database, studentId, day, topicName) {
        let sql = 'SELECT * FROM daily_doubt WHERE sid = ? AND topic = ?';
        if (day === 'today') {
            sql += ' AND date = DATE(NOW())';
        } else {
            sql += ' AND date = DATE(SUBDATE(NOW(),1))';
        }
        sql += ' ORDER BY id DESC';
        return database.query(sql, [studentId, topicName]);
    }

    static markAsCompleted(database, typeId) {
        const sql = 'UPDATE daily_doubt_resources SET is_viewed = 1 WHERE id = ?';
        return database.query(sql, typeId);
    }

    static getTypeDetails(database, typeId) {
        const sql = 'SELECT ddr.*, dd.sid, dd.date FROM daily_doubt_resources ddr LEFT JOIN daily_doubt dd ON ddr.topic_reference = dd.id WHERE ddr.id = ?';
        return database.query(sql, typeId);
    }

    static getAllTypesByDate(database, typeMainId) {
        const sql = 'SELECT id, is_viewed FROM daily_doubt_resources WHERE topic_reference = ?';
        return database.query(sql, typeMainId);
    }

    static previousMarkAsCompleted(database, typeId) {
        const sql = 'UPDATE daily_doubt_resources SET old_complete_time = CURRENT_TIMESTAMP WHERE id = ?';
        return database.query(sql, typeId);
    }

    static updateAnswerVideoResourcesTeachers(database, obj, answerId, resourceType, resourceOrder) {
        const sql = 'UPDATE answer_video_resources SET ? WHERE answer_id = ? and resource_type = ? and resource_order = ? and is_active = 1';
        return database.query(sql, [obj, answerId, resourceType, resourceOrder]);
    }
};
