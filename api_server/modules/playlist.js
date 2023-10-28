module.exports = class Playlist {
    static getPlaylistByStudentId(student_id, limit, database) {
        const sql = 'SELECT a.name,a.id,b.question_id ,c.ocr_text, c.question FROM (Select * from student_playlists where student_id = ? order by created_at desc) as a left join (select * from playlist_questions_mapping order by created_at desc) as b on a.id=b.playlist_id left JOIN questions as c on b.question_id = c.question_id order by b.created_at desc limit ?';
        return database.query(sql, [student_id, limit]);
    }

    static getPlaylistByStudentIdNew(student_id, database) {
        const sql = 'SELECT a.name,a.id,b.question_id ,c.ocr_text, c.question FROM (Select * from new_library where student_id = ? and is_active=1 and is_delete=0 order by created_at desc) as a left join (select * from playlist_questions_mapping order by created_at desc) as b on a.id=b.playlist_id left JOIN questions as c on b.question_id = c.question_id order by b.created_at desc';
        return database.query(sql, [student_id]);
    }

    static getAdminPlaylists(admin_id, class1, course, database) {
        const sql = 'SELECT a.name,a.id,b.question_id ,c.ocr_text, c.question FROM (Select * from student_playlists where student_id = ? and class = ? and course=? and is_active=1 and show_library=1 order by created_at desc) as a left join (select * from playlist_questions_mapping order by created_at desc) as b on a.id=b.playlist_id left JOIN questions as c on b.question_id = c.question_id order by b.created_at asc';
        // console.log(sql);
        return database.query(sql, [admin_id, class1, course]);
    }

    static getPlaylistByStudentIdWithLanguage(student_id, limit, language, database) {
        const sql = `SELECT a.name,a.id,b.question_id ,case when d.${language} is null then c.ocr_text else d.${language} end as ocr_text, c.question FROM (Select * from student_playlists where student_id = ? order by created_at desc) as a left join (select * from playlist_questions_mapping order by created_at desc) as b on a.id=b.playlist_id left JOIN questions as c on b.question_id = c.question_id left join (select question_id, ${language} from questions_localized ) as d on b.question_id=d.question_id order by b.created_at desc limit ?`;
        return database.query(sql, [student_id, limit]);
    }

    static getPlaylistByStudentIdVls(student_class, limit, database) {
        const sql = 'SELECT a.name,a.id,b.question_id ,c.ocr_text, c.question FROM (Select * from student_playlists where student_id = 97 and class = ? order by created_at desc LIMIT 1) as a left join (select * from playlist_questions_mapping order by created_at desc) as b on a.id=b.playlist_id left JOIN questions as c on b.question_id = c.question_id order by b.created_at desc limit ?';
        return database.query(sql, [student_class, limit]);
    }

    static getStudentHistoryPlaylist(student_id, page_no, limit, database) {
        const sql = `select c.*,a.question_id,b.ocr_text,b.question,d.packages, 0 as show_share from (select distinct question_id from video_view_stats where student_id = ? order by created_at desc LIMIT ? OFFSET ${this.getOffset(page_no, limit)}) as a left join (select * from questions) as b on a.question_id = b.question_id left join questions_meta as c on a.question_id = c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as d on a.question_id = d.question_id`;
        // console.log(sql);
        return database.query(sql, [student_id, limit]);
    }

    static getStudentHistoryPlaylistWithLanguage(student_id, language, page_no, limit, database) {
        const sql = `select c.*,case when x.${language} is null then c.chapter else x.${language} end as chapter,case when y.${language} is null then c.subtopic else y.${language} end as subtopic,a.question_id,case when e.${language} is null then b.ocr_text else e.${language} end as ocr_text,b.question,d.packages, 0 as show_share from (select distinct question_id from video_view_stats where student_id = ? order by created_at desc LIMIT ? OFFSET ${this.getOffset(page_no, limit)}) as a left join (select * from questions) as b on a.question_id = b.question_id left join questions_meta as c on a.question_id = c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as d on a.question_id = d.question_id left join (select question_id,${language} from questions_localized ) as e on a.question_id=e.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on c.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on c.subtopic=y.subtopic`;
        // console.log(sql);
        return database.query(sql, [student_id, limit]);
    }

    static getQuestionOfTheDayPlaylist(student_class, student_course, page_no, limit, database) {
        const sql = `SELECT a.*, b.*,c.* from (select qotd.question_id from qotd where class=? AND course =?) as a left join (select question_id,question,ocr_text from questions ) as b on a.question_id = b.question_id left join questions_meta as c on a.question_id = c.question_id  LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
        return database.query(sql, [student_class, student_course, limit]);
    }

    static getRecommendedPlaylist(student_class, page_no, limit, database) {
        const sql = `select a.*, b.*,c.packages,0 as show_share from (select * from questions_meta where doubtnut_recommended = 'Recommended' AND is_skipped = 0  AND class = ? limit ? OFFSET ${this.getOffset(page_no, limit)}) as a left join (select question_id,ocr_text,question from questions) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as c on a.question_id = c.question_id`;
        // console.log(sql);
        return database.query(sql, [student_class, limit]);
    }

    static subscribedStudentPlaylist(student_id, is_answered, page_no, limit, database) {
        let sql;
        if (is_answered == 0) {
            sql = `select c.*, b.question_id, b.ocr_text,b.question,b.question_image,b.timestamp,b.is_skipped, d.skip_message, e.packages, 0 as show_share from (select distinct student_id from subscriptions where student_id = ? AND scheme_id <> 'NEW_REGISTER' AND CURDATE() >= start_date AND CURDATE() <= end_date) as a LEFT join (select * from questions where student_id = ? AND is_answered = 0 and question_credit = 0) as b on a.student_id = b.student_id left join questions_meta as c on b.question_id = c.question_id left join (select skip_message,question_id from expert_skipped_question) as d on b.question_id = d.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on b.question_id = e.question_id order by b.question_id desc LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
        } else {
            sql = `select c.*, b.question_id, b.ocr_text,b.question,b.question_image,b.timestamp,b.is_skipped, d.skip_message, e.packages from (select distinct student_id from subscriptions where student_id = ? AND scheme_id <> 'NEW_REGISTER' AND CURDATE() >= start_date AND CURDATE() <= end_date) as a LEFT join (select * from questions where student_id = ? AND is_answered = 1  and question_credit = 0) as b on a.student_id = b.student_id left join questions_meta as c on b.question_id = c.question_id left join (select skip_message,question_id from expert_skipped_question) as d on b.question_id = d.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on b.question_id = e.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on b.question_id = f.question_id order by f.answer_id desc LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
        }
        // console.log(sql);
        return database.query(sql, [student_id, student_id, limit]);
    }

    static subscribedStudentPlaylistWithLanguage(student_id, language, is_answered, page_no, limit, database) {
        let sql;
        const params = [];
        if (is_answered == 0) {
            sql = `select c.*, b.question_id, b.ocr_text,b.question,b.question_image,b.timestamp,b.is_skipped, d.skip_message, e.packages, 0 as show_share from  (select * from questions where student_id = ? AND is_answered = 0 and question_credit = 0) as b  left join questions_meta as c on b.question_id = c.question_id left join (select skip_message,question_id from expert_skipped_question) as d on b.question_id = d.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on b.question_id = e.question_id  order by b.question_id desc LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
            params.push(student_id, limit);
        } else {
            sql = `select c.*,case when x.${language} is null then c.chapter else x.${language} end as chapter,case when y.${language} is null then c.subtopic else y.${language} end as subtopic, b.question_id, case when g.${language} is null then b.ocr_text else g.${language} end as ocr_text,b.question,b.question_image,b.timestamp,b.is_skipped, d.skip_message, e.packages from (select distinct student_id from subscriptions where student_id = ? AND scheme_id <> 'NEW_REGISTER' AND CURDATE() >= start_date AND CURDATE() <= end_date) as a LEFT join (select * from questions where student_id = ? AND is_answered = 1  and question_credit = 0) as b on a.student_id = b.student_id left join questions_meta as c on b.question_id = c.question_id left join (select skip_message,question_id from expert_skipped_question) as d on b.question_id = d.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on b.question_id = e.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on b.question_id = f.question_id left join (select question_id, ${language} from questions_localized) as g on b.question_id=g.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on c.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on c.subtopic=y.subtopic order by f.answer_id desc LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
            params.push(student_id, student_id, limit);
        }
        // console.log(sql);
        return database.query(sql, params);
    }

    static getViralVideos(page_no, limit, database) {
        const sql = `select b.*,a.*, 0 as show_share  from (select question_id,ocr_text,question from questions where student_id = '98') as a left join questions_meta as b on a.question_id = b.question_id LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
        return database.query(sql, [limit]);
    }

    static getViralVideosWithLanguage(language, page_no, limit, database) {
        const sql = `select b.*,a.*,case when x.${language} is null then b.chapter else x.${language} end as chapter,case when y.${language} is null then b.subtopic else y.${language} end as subtopic,case when c.${language} is null then a.ocr_text else c.${language} end as ocr_text , 0 as show_share  from (select question_id,ocr_text,question from questions where student_id in ('81') and is_answered = 1) as a left join questions_meta as b on a.question_id = b.question_id left join (select question_id,${language} from questions_localized) as c on a.question_id=c.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on b.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on b.subtopic=y.subtopic order by a.question_id DESC LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
        return database.query(sql, [limit]);
    }

    static getVLSVideos(student_class, page_no, limit, database) {
        const sql = `Select c.*,a.question_id, b.question, b.ocr_text, e.packages, 0 as show_share  from (Select * from student_playlists where  is_active=1 and student_id='97' and class = ? order by id desc limit 1) as d left join (Select * from playlist_questions_mapping where student_id = '97' order by created_at desc) as a on d.id=a.playlist_id left JOIN questions as b on a.question_id=b.question_id left join questions_meta as c on a.question_id=c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on e.question_id = a.question_id LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
        return database.query(sql, [student_class, limit]);
    }

    static getVLSVideosWithLanguage(student_class, language, page_no, limit, database) {
        const sql = `Select c.*,case when x.${language} is null then c.chapter else x.${language} end as chapter,case when y.${language} is null then c.subtopic else y.${language} end as subtopic, a.question_id, b.question, case when f.${language} is null then b.ocr_text else f.${language} end as ocr_text, e.packages, 0 as show_share  from (Select * from student_playlists where  is_active=1 and student_id='97' and class = ? order by id desc limit 1) as d left join (Select * from playlist_questions_mapping where student_id = '97' order by created_at desc) as a on d.id=a.playlist_id left JOIN questions as b on a.question_id=b.question_id left join questions_meta as c on a.question_id=c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on e.question_id = a.question_id left join (select question_id,${language} from questions_localized) as f on a.question_id=f.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on c.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on c.subtopic=y.subtopic LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
        return database.query(sql, [student_class, limit]);
    }

    static getPlaylistByPlaylistId(student_id, playlist_id, page_no, limit, database) {
        const sql = `Select c.*,a.question_id, b.question, b.ocr_text, e.packages, case when f.refer_id = ? then 0 else case when d.student_id = ? then 0 else 1 end end as show_share  from (Select * from student_playlists where  is_active=1 and id=?) as d left join (Select * from playlist_questions_mapping where playlist_id = ?) as a on d.id=a.playlist_id left JOIN questions as b on a.question_id=b.question_id left join questions_meta as c on a.question_id=c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on e.question_id = a.question_id left join (select * from student_playlists where student_id = ? ) as f on f.refer_id = ? LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
        // console.log(sql);
        return database.query(sql, [playlist_id, student_id, playlist_id, playlist_id, student_id, playlist_id, limit]);
    }

    static getPlaylistByPlaylistIdWithLanguage(student_id, playlist_id, language, page_no, limit, database) {
        const sql = `Select c.*,case when x.${language} is null then c.chapter else x.${language} end as chapter,case when y.${language} is null then c.subtopic else y.${language} end as subtopic,a.question_id, b.question, case when g.${language} is null then b.ocr_text else g.${language} end as ocr_text, e.packages, case when d.student_id = ? then 0 when d.is_admin_created= 1 then 0 else 1 end as show_share  from `
      + `(Select * from new_library where  is_active=1 and id=? and is_delete=0) as d left join (Select * from playlist_questions_mapping where playlist_id = ?) as a on d.id=a.playlist_id left JOIN questions as b on a.question_id=b.question_id left join questions_meta as c on a.question_id=c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on e.question_id = a.question_id left join (select question_id,${language} from questions_localized) as g on a.question_id=g.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on c.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on c.subtopic=y.subtopic order by a.created_at desc LIMIT ? OFFSET ${this.getOffset(page_no, limit)}`;
        // console.log(sql);
        return database.query(sql, [student_id, playlist_id, playlist_id, limit]);
    }

    static getPlaylistByPlaylistIdList(student_id, playlist_id, database) {
        const limit = 10;
        const sql = 'select a.question_id,b.ocr_text,b.question,b.matched_question from (select question_id from playlist_questions_mapping where playlist_id = ? AND is_active = 1 order by created_at desc limit ?) as a inner join (select question_id,ocr_text,question,matched_question from questions WHERE is_answered = 1) as b on a.question_id = b.question_id';
        return database.query(sql, [playlist_id, limit]);
    }

    static createPlaylistNewLibrary(param, database) {
        const sql = 'INSERT INTO new_library SET ?';

        // console.log(sql);
        return database.query(sql, param);
    }

    static getPlaylistByName(database, playlist_name) {
        const sql = 'SELECT * from new_library WHERE name = ?';
        return database.query(sql, playlist_name);
    }

    static getShortsPlaylistByName(database, student_id, playlist_name) {
        const sql = 'SELECT * from new_library WHERE student_id = ?  and name = ?';
        return database.query(sql, [student_id, playlist_name]);
    }

    static getByStudentIdFromNewLibrary(student_id, database) {
        const sql = 'SELECT * FROM new_library WHERE student_id = ? AND is_active = 1 and is_delete=0 and parent=0 and is_admin_created=0 ORDER BY created_at DESC';
        return database.query(sql, [student_id]);
    }

    static addQuestionInPlaylist(playlist_id, question_id, student_id, database) {
        const sql = 'INSERT INTO playlist_questions_mapping SET ? ON DUPLICATE KEY UPDATE is_active = 1';
        const param = {};
        param.playlist_id = playlist_id;
        param.question_id = question_id;
        param.student_id = student_id;
        return database.query(sql, [param]);
    }

    static removeQuestionFromPlaylist(playlist_id, question_id, student_id, database) {
        const sql = 'UPDATE playlist_questions_mapping SET is_active = 0 where playlist_id = ? AND question_id = ? AND student_id = ?';
        return database.query(sql, [playlist_id, question_id, student_id]);
    }

    static removeFromNewLibrary(playlist_id, student_id, database) {
        const sql = 'UPDATE new_library SET is_delete = 1 where id = ? AND student_id = ?';
        return database.query(sql, [playlist_id, student_id]);
    }

    static getNcertPlaylist(class1, chapter, exercise, database) {
        const sql = ' select b.*,a.question_id,a.ocr_text,a.doubt,a.question, case when b.chapter is null then a.chapter else b.chapter end as chapter, case when b.class is null then a.class else b.class end as class,e.packages from (SELECT question_id,ocr_text,doubt,question,chapter,class from questions WHERE student_id=1 and chapter=? and  doubt LIKE ? and class=? and is_answered=1 ORDER BY doubt ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id order by a.doubt ASC';
        return database.query(sql, [chapter, `%${exercise}%`, class1]);
    }

    static getNcertPlaylistWithLanguage(class1, chapter, language, exercise, database) {
        const sql = ` select b.*,a.question_id,case when f.${language} is null then a.ocr_text else f.${language} end as ocr_text,a.doubt,a.question, case when b.chapter is null then a.chapter else b.chapter end as chapter,case when x.${language} is null then b.chapter else x.${language} end as chapter,case when y.${language} is null then b.subtopic else y.${language} end as subtopic, case when b.class is null then a.class else b.class end as class,e.packages from (SELECT question_id,ocr_text,doubt,question,chapter,class from questions WHERE student_id=1 and chapter=? and  doubt LIKE ? and class=? and is_answered=1 ORDER BY doubt ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id left join (select question_id,${language} from questions_localized) as f on a.question_id=f.question_id left join (select chapter,min(${language}) as ${language} from localized_ncert_chapter group by chapter) as x on x.chapter=? left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on b.subtopic=y.subtopic order by a.doubt ASC`;
        return database.query(sql, [chapter, `%${exercise}%`, class1, chapter]);
    }

    static getJeeAdvancePlaylist(year, database) {
        const sql = `select b.*,a.question_id,a.ocr_text,a.doubt,a.question,case when b.chapter is null then a.chapter else b.chapter end as chapter, case when b.class is null then a.class else b.class end as class, e.packages from (SELECT question_id,ocr_text,doubt,question,matched_question,chapter,class FROM questions WHERE student_id = 8 AND doubt LIKE 'JA${year}%' and is_answered=1 ORDER BY \`doubt\` ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id order by a.doubt ASC`;
        return database.query(sql);
    }

    static getJeeAdvancePlaylistWithLanguage(year, language, database) {
        const sql = `select b.*,a.question_id,case when f.${language} is null then a.ocr_text else f.${language} end as ocr_text,a.doubt,a.question,case when b.chapter is null then a.chapter else b.chapter end as chapter,case when x.${language} is null then b.chapter else x.${language} end as chapter,case when y.${language} is null then b.subtopic else y.${language} end as subtopic, case when b.class is null then a.class else b.class end as class, e.packages from (SELECT question_id,ocr_text,doubt,question,matched_question,chapter,class FROM questions WHERE student_id = 8 AND doubt LIKE 'JA${year}%' and is_answered=1 ORDER BY \`doubt\` ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id left join (select question_id,${language} from questions_localized) as f on a.question_id=f.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on b.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on b.subtopic=y.subtopic order by a.doubt ASC`;
        // console.log(sql);
        return database.query(sql);
    }

    static getJeeMainPlaylist(year, database) {
        const sql = `select b.*,a.question_id,a.ocr_text,a.doubt,a.question,case when b.chapter is null then a.chapter else b.chapter end as chapter, case when b.class is null then a.class else b.class end as class,e.packages from (SELECT question_id,ocr_text,doubt,question,matched_question,chapter,class FROM questions WHERE student_id = 3 AND doubt LIKE 'JM_${year}%' and is_answered=1 ORDER BY \`doubt\` ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id order by a.doubt ASC`;
        return database.query(sql);
    }

    static getJeeMainPlaylistWithLanguage(year, language, database) {
        const sql = `select b.*,case when b.chapter is null then a.chapter else b.chapter end as chapter,case when x.${language} is null then b.chapter else x.${language} end as chapter,case when y.${language} is null then b.subtopic else y.${language} end as subtopic,a.question_id,case when f.${language} is null then a.ocr_text else f.${language} end as ocr_text,a.doubt,a.question, case when b.class is null then a.class else b.class end as class,e.packages from (SELECT question_id,ocr_text,doubt,question,matched_question,chapter,class FROM questions WHERE student_id = 3 AND doubt LIKE 'JM_${year}%' and is_answered=1 ORDER BY \`doubt\` ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id left join (select question_id,${language} from questions_localized) as f on a.question_id=f.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on b.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on b.subtopic=y.subtopic order by a.doubt ASC`;
        console.log(sql);

        return database.query(sql);
    }

    static getXIIBoardsPlaylist(class1, year, database) {
        const arr = {
            6: 'VI',
            7: 'VII',
            8: 'VIII',
            9: 'IX',
            10: 'X',
            11: 'XI',
            12: 'XII',
        };
        const sql = 'select b.*,a.question_id,a.ocr_text,a.doubt,a.question,case when b.chapter is null then a.chapter else b.chapter end as chapter, case when b.class is null then a.class else b.class end as class,e.packages from  (SELECT question, ocr_text,doubt,question_id,matched_question,chapter,class FROM questions WHERE student_id = 2 and class=? and doubt LIKE ? and is_answered=1 ORDER BY `doubt` ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id order by a.doubt ASC';
        return database.query(sql, [class1, `${arr[class1]}${year}%`]);
    }

    static getXIIBoardsPlaylistWithLanguage(class1, year, language, database) {
        const arr = {
            6: 'VI',
            7: 'VII',
            8: 'VIII',
            9: 'IX',
            10: 'X',
            11: 'XI',
            12: 'XII',
        };
        const sql = `select b.*,a.question_id,case when f.${language} is null then a.ocr_text else f.${language} end as ocr_text,a.doubt,a.question,case when b.chapter is null then a.chapter else b.chapter end as chapter,case when b.chapter is null then a.chapter else b.chapter end as chapter,case when x.${language} is null then b.chapter else x.${language} end as chapter,case when y.${language} is null then b.subtopic else y.${language} end as subtopic, case when b.class is null then a.class else b.class end as class,e.packages from  (SELECT question, ocr_text,doubt,question_id,matched_question,chapter,class FROM questions WHERE student_id = 2 and class=? and doubt LIKE ? and is_answered=1 ORDER BY \`doubt\` ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id left join (select question_id,${language} from questions_localized) as f on a.question_id=f.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on b.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on b.subtopic=y.subtopic order by a.doubt ASC`;
        return database.query(sql, [class1, `${arr[class1]}${year}%`]);
    }

    static getXBoardsPlaylist(year, database) {
        const sql = `select b.*,a.question_id,a.ocr_text,a.doubt,a.question,case when b.chapter is null then a.chapter else b.chapter end as chapter, case when b.class is null then a.class else b.class end as class,e.packages from (SELECT question, ocr_text,doubt,question_id,matched_question,chapter,class FROM questions WHERE student_id = 9 and doubt LIKE 'X_BD${year}%' and is_answered=1 ORDER BY \`doubt\` ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id order by a.doubt ASC`;
        return database.query(sql);
    }

    static getXBoardsPlaylistWithLanguage(year, language, database) {
        const sql = `select b.*,a.question_id,case when f.${language} is null then a.ocr_text else f.${language} end as ocr_text,a.doubt,a.question,case when b.chapter is null then a.chapter else b.chapter end as chapter,case when b.chapter is null then a.chapter else b.chapter end as chapter,case when x.${language} is null then b.chapter else x.${language} end as chapter,case when y.${language} is null then b.subtopic else y.${language} end as subtopic, case when b.class is null then a.class else b.class end as class,e.packages from (SELECT question, ocr_text,doubt,question_id,matched_question,chapter,class FROM questions WHERE student_id = 9 and doubt LIKE 'X_BD${year}%' and is_answered=1 ORDER BY \`doubt\` ASC) as a left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id left join (select question_id,${language} from questions_localized) as f on a.question_id=f.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on b.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on b.subtopic=y.subtopic order by a.doubt ASC`;
        return database.query(sql);
    }

    static getNcertClassList(database) {
        const sql = 'SELECT DISTINCT(class) FROM questions WHERE student_id=1';
        return database.query(sql);
    }

    static getNcertChapterList(class1, database) {
        const sql = 'SELECT DISTINCT(chapter) FROM questions WHERE student_id=1 and class=?';
        return database.query(sql, [class1]);
    }

    static getNcertChapterListWithLanguage(class1, language, database) {
        const sql = `select a.chapter, case when b.${language} is null then a.chapter else b.${language} end as chapter_display from (SELECT DISTINCT(chapter) FROM questions WHERE student_id=1 and class=?) as a left join (select distinct(chapter),${language} from localized_ncert_chapter where class=?) as b on a.chapter=b.chapter`;
        // console.log(sql);
        return database.query(sql, [class1, class1]);
    }

    static getNcertExerciseList(class1, chapter, database) {
        const sql = 'Select distinct(b.ncert_exercise_name) as exercise_name, (right(left(doubt,instr(a.doubt,\'_\')+6),3)) as exercise from (Select * from questions where student_id = 1 and class = ? and chapter = ?) as a left join ncert_video_meta as b on a.question_id=b.question_id order by exercise ASC';
        // console.log(sql);
        return database.query(sql, [class1, chapter]);
    }

    static getJeeMainYears(database) {
        const sql = "SELECT distinct(right(left(doubt,5),2)) as year FROM questions where student_id = 3 and doubt like 'JM%' ORDER BY (right(left(doubt,5),2)) DESC";
        return database.query(sql);
    }

    static getJeeAdvanceYears(database) {
        const sql = "SELECT distinct(right(left(doubt,4),2)) as year FROM `questions` where student_id = 8 and doubt like 'JA%' ORDER BY (right(left(doubt,4),2)) DESC";
        return database.query(sql);
    }

    static getClassXIIYears(database) {
        const sql = "SELECT distinct(right(left(doubt,5),2)) as year FROM questions where student_id = 2 and class='12' ORDER BY (right(left(doubt,5),2)) DESC";
        return database.query(sql);
    }

    static getClassXYears(database) {
        const sql = 'SELECT distinct(right(left(doubt,6),2)) as year FROM `questions` where student_id = 9 ORDER BY (right(left(doubt,6),2)) DESC';
        return database.query(sql);
    }

    static addedPlaylistCheck(question_id, student_id, database) {
        const sql = 'select a.*,b.* from((select * from student_playlists where student_id =?) as a inner join (select * from playlist_questions_mapping where question_id =?) as b on a.id = b.playlist_id)';
        return database.query(sql, [student_id, question_id]);
    }

    static getOffset(page_no, page_length) {
        let offset;
        if (page_no > 1) {
            offset = (page_no - 1) * page_length;
        } else if (page_no == 1) {
            offset = 0;
        }
        return offset;
    }

    static getPlaylist(playlist_id, database) {
        const sql = 'select * from (select * from student_playlists where id = ?) as a left join playlist_questions_mapping on a.id = playlist_questions_mapping.playlist_id';
        return database.query(sql, [playlist_id]);
    }

    static addQuestionBatch(data, database) {
        const sql = 'INSERT INTO playlist_questions_mapping (playlist_id, question_id, student_id) VALUES ?';
        return database.query(sql, [data]);
    }
};
