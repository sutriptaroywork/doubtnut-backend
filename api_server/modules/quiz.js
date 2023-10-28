module.exports = class Quiz {
    static _getQuizDetailsById(student_class, subject, database) {
    // let sql = "select * from quiz where date=CURDATE() and class = 12 and subject = 'maths' ";
    // let sql = "select * from quiz where date=CURDATE() and class ="+student_class;
        const sql = 'select * from quiz where  is_active=1 and class =? GROUP BY quiz_id  ORDER BY quiz_id  DESC  LIMIT 1';
        console.log(sql); return database.query(sql, [student_class]);
    }

    static _getQuizQuestionsById(quiz_id, database) {
        const sql = 'select question_id,quiz_id,q_text_in,q_type,q_image,q_video,q_pos_mark,q_neg_mark,option_value from quiz_questions where quiz_id =?';
        // console.log(sql);
        return database.query(sql, [quiz_id]);
    }

    static _getQuizQuestionOptions(qid, quiz_id, database) {
        const sql = ' select id,option_value from quiz_question_options where quiz_id = ? and question_id = ?';
        return database.query(sql, [quiz_id, qid]);
    }

    static _checkQuestionAnswer(question_id, quiz_id, option_id, database) {
    // let sql = "select quiz_questions.q_pos_mark, quiz_questions.q_neg_mark, quiz_question_options.id from quiz_question_options, quiz_questions where quiz_questions.quiz_id ='"+quiz_id+"' quiz_questions.question_id ='"+question_id+"' and quiz_quesion_options.is_correct =1 LIMIT 1"
    // let sql = "select quiz_questions.q_pos_mark,quiz_questions.q_neg_mark,quiz_question_options.id from quiz_questions,quiz_question_options where quiz_question_options.quiz_id ="+quiz_id+" and quiz_questions.question_id ="+question_id+" and quiz_question_options.is_correct =1";

        const sql = 'select a.*,b.* from(select q_pos_mark,q_neg_mark,question_id from quiz_questions where quiz_id =? and question_id=? ) as a left join (select id,is_correct,quiz_id,question_id from quiz_question_options where question_id =? and id=? and is_correct=1 ) as b on a.quiz_id = b.quiz_id and a.question_id=b.question_id ';
        // console.log(sql);
        return database.query(sql, [quiz_id, question_id, question_id, option_id]);
    }

    static _gettopScores(quiz_id, database) {
    // let sql = "select a.*,b.* from (SELECT  SUM(score) as total_score ,student_id , quiz_id from quiz_student_question where quiz_id='"+quiz_id+"' and eligible=1 GROUP BY student_id ORDER BY total_score DESC LIMIT 10) as a inner join (select * from quiz where quiz_id = '"+quiz_id+"' and is_active=1 and date = CURDATE() and time_start < time(now()) and time_end > time(now())) as c on a.quiz_id=c.quiz_id left join (select student_id,student_username,img_url,student_fname from students) as b on a.student_id=b.student_id";
        const params = [];
        params.push(quiz_id);
        params.push(quiz_id);
        const sql = 'Select a.test_id, a.eligiblescore as total_score, a.created_at, b.student_username,b.student_fname,b.img_url from (SELECT test_id, student_id, eligiblescore, created_at FROM `testseries_student_reportcards` where test_id = ? UNION SELECT quiz_id, student_id, sum(score) as eligiblescore, max(created_at) as created_at FROM `quiz_student_question` where quiz_id = ? and eligible = 1 group by quiz_id, student_id) as a left join students as b on a.student_id = b.student_id order by total_score DESC, a.created_at ASC LIMIT 10';
        return database.query(sql, params);
    }

    static getStudentQuizScore(quiz_id, student_id, database) {
        const sql = 'select a.* ,b.* from (SELECT  SUM(score) as total_score,student_id from quiz_student_question where quiz_id=? AND student_id =?  GROUP BY student_id) as a left join (select student_id,student_username,img_url,student_fname from students) as b on a.student_id=b.student_id ';
        // console.log(sql);
        return database.query(sql, [quiz_id, student_id]);
    }

    static getStudentQuizScoreWithoutEligibility(quiz_id, student_id, database) {
        const sql = 'select a.* ,b.* from (SELECT  SUM(score) as total_score,student_id from quiz_student_question where quiz_id=? AND student_id =? GROUP BY student_id) as a left join (select student_id,student_username,img_url,student_fname from students) as b on a.student_id=b.student_id ';
        // console.log(sql);
        return database.query(sql, [quiz_id, student_id]);
    }

    // static getQuizResult(quiz_id, student_id, database) {
    //   // let sql = "select b.* from (select * from quiz where quiz_id = '"+quiz_id+"' and is_active=1 and date = CURDATE() and time_start < time(now()) and time_end < time(now())) as a inner join (select * from quiz_student_question where quiz_id='"+quiz_id+"' and student_id='"+student_id+"' order by question_id asc) as b on a.quiz_id=b.quiz_id";
    //   let sql = "select b.* from (select * from quiz where quiz_id = '"+quiz_id+"' and is_active=1 and date = CURDATE() and time_start < time(now()) and time_end > time(now())) as a inner join (select * from quiz_student_question where quiz_id='"+quiz_id+"' and student_id='"+student_id+"' order by question_id asc) as b on a.quiz_id=b.quiz_id";
    //   console.log(sql)
    //   return database.query(sql);
    // }
    static getQuizResult(quiz_id, student_id, database) {
    // let sql = "select b.* from (select * from quiz where quiz_id = '"+quiz_id+"' and is_active=1 and date = CURDATE() and time_start < time(now()) and time_end > time(now())) as a inner join (select * from quiz_student_question where quiz_id='"+quiz_id+"' and student_id='"+student_id+"' order by question_id asc) as b on a.quiz_id=b.quiz_id";
        const sql = 'select b.* from (select * from quiz where quiz_id = ? and is_active=1 ) as a inner join (select * from quiz_student_question where quiz_id=? and student_id=? order by question_id asc) as b on a.quiz_id=b.quiz_id';
        return database.query(sql, [quiz_id, quiz_id, student_id]);
    }

    static submitStudentAnswer(quiz_id, student_id, question_id, option_id, score, is_correct, eligible, is_skipped, database) {
        const insert_obj = {};
        insert_obj.quiz_id = quiz_id;
        insert_obj.student_id = student_id;
        insert_obj.question_id = question_id;
        insert_obj.opt_selected = option_id;
        insert_obj.score = score;
        insert_obj.is_correct = is_correct;
        insert_obj.eligible = eligible;
        insert_obj.is_skipped = is_skipped;
        const sql = 'insert into quiz_student_question SET ?';
        return database.query(sql, [insert_obj]);
    }

    static getQuizDetails(student_class, subject, database) {
    // let sql = "SELECT a.*, b.*, c.id, c.option_value FROM " +
    //   "(Select * from quiz where date=CURRENT_DATE and class ='" + student_class + "' and subject = '" + subject + "') as a " +
    //   "left join " +
    //   "(Select * from quiz_questions) as b " +
    //   "on a.quiz_id=b.quiz_id " +
    //   "left join " +
    //   "(Select * from quiz_question_options) as c " +
    //   "on b.quiz_id=c.quiz_id and b.qid=c.qid"
        const sql = 'SELECT a.*, b.*, c.id, c.option_value FROM '
      + '(Select * from quiz where date=CURRENT_DATE and class =?) as a '
      + 'left join '
      + '(Select * from quiz_questions) as b '
      + 'on a.quiz_id=b.quiz_id '
      + 'left join '
      + '(Select * from quiz_question_options) as c '
      + 'on b.quiz_id=c.quiz_id and b.qid=c.qid';
        return database.query(sql, [student_class]);
    }

    static submitResponse(quiz_id, question_id, sel_value, timestamp, database) {
        const sql = 'insert into quiz_response(quiz_id,question_id,selected_option,selected_at) VALUES (?,?,?,?)';
        // console.log(sql);
        return database.query(sql, [quiz_id, question_id, sel_value, timestamp]);
    }

    static isQuizAttempted(quiz_id, student_id, database) {
        const sql = 'select sum(1) as sum from quiz_student_question where quiz_id=? and student_id=?';
        // console.log(sql);
        return database.query(sql, [quiz_id, student_id]);
    }

    static bulkInsertQuiz(data, database) {
        const sql = 'INSERT INTO quiz_student_question (quiz_id,student_id,question_id,opt_selected,score,is_correct,eligible) VALUES ?';
        console.log(sql);
        return database.query(sql, [data]);
    }
};
