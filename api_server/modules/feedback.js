const _ = require('lodash');

module.exports = class feedback {
    static _getAnswerByQuestionId(question_id, database) {
        const sql = 'select * from answers where question_id = ?';
        return database.query(sql, [question_id]);
    }

    static _updateAnswerTable(answers, answer_id, database) {
        const sql = 'UPDATE answers SET ? WHERE answer_id =?';

        console.log(sql);
        return database.query(sql, [answers, answer_id]);
    }

    static _negative_feedback_recieved(question_id, experts, database) {
        const msg = `Negative Feedback received for Q-ID : ${question_id} , solved by ${experts.expert_name}`;

        if (experts.expert_status == 'active' && experts.whatsapp_number.length > 9 && experts.is_intern == 0) {
            const url = `http://cp.smsgatewayhub.com/SendSMS/sendmsg.php?uname=doubtnut&pass=sms@123&send=DOUBTS&dest=91${expert.whatsapp_number}&msg=${urlencode(msg)}`;
            const text = file_get_contents(url);
        }
    }

    static _getExpertById(expert_id, database) {
        const sql = 'select * from internet_experts where iexpert_id=?';
        return database.query(sql, [expert_id]);
    }

    static _getLatestAnswerByQuestionId(question_id, database) {
        const sql = 'select * from answers where question_id = ?  order by answer_id DESC LIMIT 1';
        return database.query(sql, [question_id]);
    }

    static _checkUserFeed(video_feedback, database) {
        const sql = 'select * from user_answer_feedback where question_id = ? AND student_id =?';
        console.log(sql);
        return database.query(sql, [video_feedback.question_id, video_feedback.student_id]);
    }

    static getMaxVideoFeedback(student_id, question_id, answer_video, database) {
        const sql = 'SELECT * from user_answer_feedback WHERE student_id = ? AND answer_video = ? AND question_id =? ORDER BY timestamp DESC LIMIT 1';
        return database.query(sql, [student_id, answer_video, question_id]);
    }

    static _insertVideoFeedback(video_feedback, database) {
        const data = {};
        data.answer_id = video_feedback.answer_id;
        data.question_id = video_feedback.question_id;
        data.student_id = video_feedback.student_id;
        data.rating = video_feedback.rating;
        data.feedback = video_feedback.feedback;
        data.view_time = video_feedback.view_time;
        data.answer_video = video_feedback.answer_video;
        data.page = video_feedback.page;
        if (!_.isEmpty(video_feedback.view_id)) {
            data.view_id = video_feedback.view_id;
        }

        const sql = 'INSERT into user_answer_feedback SET ?';
        return database.query(sql, [data]);
    }

    static _updateVideoFeedback(video_feedback, database) {
        const data = {};

        data.answer_id = video_feedback.answer_id;
        data.question_id = video_feedback.question_id;
        data.student_id = video_feedback.student_id;
        data.rating = video_feedback.rating;
        data.feedback = video_feedback.feedback;
        data.view_time = video_feedback.view_time;
        data.answer_video = video_feedback.answer_video;
        data.is_active = video_feedback.is_active;
        data.page = video_feedback.page;
        if (!_.isEmpty(video_feedback.view_id)) {
            data.view_id = video_feedback.view_id;
        }

        const sql = 'UPDATE  user_answer_feedback SET ? WHERE  rating_id = ?';
        // console.log(sql);
        // console.log(video_feedback);
        return database.query(sql, [data, video_feedback.rating_id]);
    }

    static _getQuestionById(question_id, database) {
        const sql = 'select * from questions where question_id = ?';
        return database.query(sql, [question_id]);
    }

    static _getActiveSubscriptionByStudentIdSecond(id, database) {
        const sql = 'SELECT * from subscriptions where student_id =? ORDER BY subscription_id DESC LIMIT 1';
        return database.query(sql, [id]);
    }

    static _addMatchedQuestion(question_obj, database) {
        const sql = 'insert into questions SET ? ';
        return database.query(sql, [question_obj]);
    }

    static _getAnswerById(answer_id, database) {
        const sql = 'select * from answers where answer_id = ?';
        return database.query(sql, [answer_id]);
    }

    static _addNewAnswerForNegativeFeedbackMatchedQuestion(answer_obj, database) {
        const sql = 'insert into answers SET ? ';
        return database.query(sql, [answer_obj]);
    }

    static getLast3VideoFeedback(student_id, database) {
        const sql = 'SELECT * from user_answer_feedback where student_id = ? GROUP BY rating_id DESC LIMIT 3';
        return database.query(sql, [student_id]);
    }

    // static checkActiveUserNotification(type, database) {
    //   let sql = "select * from user_notification where type ='" + type + "'";
    //   return database.query(sql);
    // }
    static getActiveFeedback(database) {
        const sql = 'select * from app_feedbacks where isActive = 1';
        return database.query(sql);
    }

    static checkResponseGiven(student_id, database, feedback_id) {
        const sql = 'SELECT * from app_feedbacks_response where student_id = ? and feedback_id= ?';
        return database.query(sql, [student_id, feedback_id]);
    }

    static submitFeedback(student_id, feedback_id, options, question_id, database) {
        const insert_obj = {};
        insert_obj.student_id = student_id;
        insert_obj.feedback_id = feedback_id;
        insert_obj.options = options;
        insert_obj.question_id = question_id;
        const sql = 'insert into app_feedbacks_response SET ?';
        return database.query(sql, [insert_obj]);
    }

    static getAnswerFeedBackByStudent(sid, answer_video, database) {
        const sql = 'SELECT * from user_answer_feedback where answer_video = ? and student_id =? and is_active = 1';
        return database.query(sql, [answer_video, sid]);
    }
};
