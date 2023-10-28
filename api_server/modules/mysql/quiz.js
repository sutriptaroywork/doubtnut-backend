const _ = require('lodash');
const Utility = require('../utility');

module.exports = class Quiz {
    static getQuizDetails(class1, database) {
    // let sql = "select * from quiz where  is_active=1 and date = CURDATE() and class = '"+class1+"' group by quiz_id order by quiz_id desc";
        const sql = 'select * from quiz where  is_active=1 and class = ? order by quiz_id desc limit 30';
        // let sql = "select * from quiz where  is_active=1";
        // console.log(sql);
        return database.query(sql, [class1]);
    }

    // Saayon added_________________________________________________________________________________________________________

    static getQuizDetailsById(id, database) {
        const sql = 'select * from quiz where quiz_id = ?';

        // console.log(sql);
        return database.query(sql, [id]);
    }

    // ______________________________________________________________________________________________________________________
    static getQuizQuestionsById(quiz_id, database) {
        const sql = 'select * from quiz_questions where  is_active=1 and quiz_id = ?';
        return database.query(sql, [quiz_id]);
    }

    static getQuizQuestionsOption(quiz_id, database) {
        const sql = 'select id as option_id,question_id,option_value,quiz_id from quiz_question_options where  is_active=1 and quiz_id = ?';
        return database.query(sql, [quiz_id]);
    }

    static getQuizQuestionsOptionWithResult(quiz_id, database) {
        const sql = 'select id as option_id,question_id,option_value,quiz_id,is_correct from quiz_question_options where  is_active=1 and quiz_id = ?';
        return database.query(sql, [quiz_id]);
    }

    static getQuiznQuestion(quiz_id, question_id, database) {
        const sql = 'select a.*,b.* from (select * from quiz_questions where quiz_id = ? and question_id = ? and is_active=1) as a left join (select * from quiz where is_active=1 and quiz_id=?) as b on a.quiz_id=b.quiz_id';
        return database.query(sql, [quiz_id, question_id, quiz_id]);
    }

    static checkQuestionAnswer(quiz_id, question_id, option_id, database) {
        const sql = 'select b.*,a.*,c.* from (select * from quiz where quiz_id = ? and is_active=1) as c left join (select q_pos_mark,q_neg_mark,question_id,quiz_id from quiz_questions where quiz_id =? and question_id=? ) as a on c.quiz_id=a.quiz_id left join (select id,is_correct,quiz_id,question_id from quiz_question_options where question_id =? and id=? and is_correct=1 ) as b on a.quiz_id = b.quiz_id and a.question_id=b.question_id ';
        // console.log(sql);
        return database.query(sql, [quiz_id, quiz_id, question_id, question_id, option_id]);
    }

    static getQuizQuestionsOptionWithCorrect(quiz_id, question_id, database) {
        const sql = 'select * from quiz_question_options where quiz_id=? and question_id=? and is_correct = 1';
        // console.log(sql);
        return database.query(sql, [quiz_id, question_id]);
    }

    static getQuizRulesById(quiz_id, database) {
        const sql = 'select * from quiz_rules where  quiz_id = ?';
        return database.query(sql, [quiz_id]);
    }

    static checkQuizActiveAndUpcoming(student_class, student_id, database) {
        const sql = 'select \'quiz\' as type, a.date as created_at,a.subject as text,a.description,a.quiz_id as id from (select * from `quiz` WHERE is_active =1 and class=? order by quiz_id desc limit 1) as a';
        // console.log("quiz");
        // console.log(sql);
        return database.query(sql, [student_class]);
    }

    // static getDailyQuizDataType(type,button_text,button_bg_color,button_text_color,student_class,limit,database){
    //   let sql = "select quiz_id as id, '"+type+"' as type, left(subject,50) as title,description,case when image_url is null then 'https://www.cambridgema.gov/~/media/Images/sharedphotos/departmentphotos/animal.jpg?mw=1920' end as image_url,'"+button_text+"' as button_text,'"+button_bg_color+"' as button_bg_color,'"+button_text_color+"' as button_text_color, date, time_start , time_end from quiz WHERE is_active =1 and class="+student_class+" limit "+limit
    //   console.log(sql);
    //   return database.query(sql);

    // }
};
