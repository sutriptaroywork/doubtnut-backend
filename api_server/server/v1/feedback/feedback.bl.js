const _ = require('lodash');

const Feedback = require('../../../modules/mongo/feedback');
const Data = require('../../../data/data');

/**
 * - Gets answer feedback options
 * @returns {{title: string, content: string, hint: string, placeholder: string}} feedback option
 * @author Abhishek Sinha
 */
function getNoSolutionFeedbackOption(region, locale) {
    try {
        if (!_.isEmpty(Data.noSolutionFeedbackData[region.toLowerCase()][locale.toLowerCase()])) {
            return Data.noSolutionFeedbackData[region.toLowerCase()][locale.toLowerCase()];
        }
        return Data.noSolutionFeedbackData[region.toLowerCase()].default;
    } catch (e) {
        return Data.noSolutionFeedbackData[region.toLowerCase()].default;
    }
}

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

/**
 * - Gets video feedback options
 * @returns {{content: string}[]}
 * @author Abhishek Sinha
 */
function getVideoDislikeFeedbackOptions() {
    return [{
        content: 'Incorrect Answer',
    }, {
        content: 'Poor Explaination',
    }, {
        content: 'Unclear Voice',
    }];
}

/**
 * - Gets text solution feedback options
 * @returns {{content: string}[]}
 * @author Abhishek Sinha
 */
function getTextSolutionDislikeFeedbackOptions() {
    return [{
        content: 'Iska Video Solution Hona Chahiye',
    }, {
        content: 'Explanation Proper Nahi Tha',
    }, {
        content: 'Sirf Answer Mention Tha',
    }];
}

module.exports = {
    insertMatchFailureFeedback,
    getVideoDislikeFeedbackOptions,
    getTextSolutionDislikeFeedbackOptions,
    getNoSolutionFeedbackOption,
};
