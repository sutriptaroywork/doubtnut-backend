// const _ = require('lodash');
// let Utility = require('./utility');
module.exports = class UserAnswerFeedback {
    static getAnswerFeedBackByStudent(studentId, answerId, client) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, `user_answer_feedback:${answerId}`);
    }

    static setAnswerFeedBackByStudent(studentId, answerId, feedback, client) {
        return client.hsetAsync(`USER:PROFILE:${studentId}`, `user_answer_feedback:${answerId}`, JSON.stringify(feedback));
    }

    static deleteAnswerFeedBackByStudent(studentId, answerId, client) {
        return client.hdelAsync(`USER:PROFILE:${studentId}`, `user_answer_feedback:${answerId}`);
    }

    static getAnswerFeedBackByStudentNew(studentId, answerId, answerVideo, client) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, `user_answer_feedback_with_text:${answerId}:${answerVideo}`);
    }

    static setAnswerFeedBackByStudentNew(studentId, answerId, answerVideo, feedback, client) {
        return client.hsetAsync(`USER:PROFILE:${studentId}`, `user_answer_feedback_with_text:${answerId}:${answerVideo}`, JSON.stringify(feedback));

    // return client.hsetAsync('user_answer_feedback_with_text', `${answer_id}_${student_id}_${answer_video}`, JSON.stringify(feedback));
    }

    static deleteAnswerFeedBackByStudentNew(studentId, answerId, answerVideo, client) {
    // return client.hdelAsync('user_answer_feedback_with_text', `${answer_id}_${student_id}_${answer_video}`);
        return client.hdelAsync(`USER:PROFILE:${studentId}`, `user_answer_feedback_with_text:${answerId}:${answerVideo}`);
    }

    static getAnswerFeedBackByStudentMulti(questionsArray, studentId, client) {
        const c = client.multi();
        for (let i = 0; i < questionsArray.length; i++) {
            c.hget(`USER:PROFILE:${studentId}`, `user_answer_feedback:${questionsArray[i].answer_id}`);
        }
        return c.execAsync();
    }

    static getAnswerFeedBackByStudentMultiNew(questionsArray, studentId, client) {
        const c = client.multi();
        for (let i = 0; i < questionsArray.length; i++) {
            c.hget(`USER:PROFILE:${studentId}`, `user_answer_feedback_with_text:${questionsArray[i].answer_id}:${questionsArray[i].answer_video}`);
        }
        return c.execAsync();
    }
};
