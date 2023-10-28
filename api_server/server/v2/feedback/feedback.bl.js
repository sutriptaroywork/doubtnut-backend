const Feedback = require('../../../modules/mongo/feedback');

/**
 * - Adds feedback data to ask_matches_feedback
 * @param {number} studentId
 * @param {{questionId: number, feedback: string, answersDisplayed: string[], event: string, isPositive: string}} data feedback data
 * @param source Source of feedback
 * @author Abhishek Sinha
 */
function insertMatchFailureFeedback(studentId, data, source) {
    const obj = {
        student_id: studentId,
        question_id: data.questionId,
        source,
        is_positive: data.isPositive,
        feedback: data.feedback,
        meta: { answersDisplayed: data.answersDisplayed },
        event: data.event,
    };
    const feedbackObj = new Feedback(obj);
    feedbackObj.save();
}

module.exports = {
    insertMatchFailureFeedback,
};
