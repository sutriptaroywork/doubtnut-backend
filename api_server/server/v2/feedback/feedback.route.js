const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const feedbackCtrl = require('./feedback.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');
const sendResponse = require('../../../middlewares/sendResponse');


const router = express.Router();


// router.route('/view-answer-by-question-id').post(validate(paramValidation.answer.viewAnswerByQuestionId),Auth.userAuthByToken, answerCtrl.viewAnswerByQuestionId)
// router.route('/view-answer-by-question-id-new').post(validate(paramValidation.answer.viewAnswerByQuestionIdNew),Auth.userAuthByToken, answerCtrl.viewAnswerByQuestionIdNew)



// router.route('/add-answer-feedback').post(validate(paramValidation.feedback.answer), authGuard,feedbackCtrl.addAnswerFeedback);
router.route('/video-add').post(validate(paramValidation.feedback.video),feedbackCtrl.addVideoFeedback);
// router.route('/add-question-feedback').post(validate(paramValidation.feedback.question), authGuard,feedbackCtrl.addAnswerFeedbackForMatchedQuestion);

router.route('/get-active').get(feedbackCtrl.getActiveFeedbacks);
router.route('/submit').post(validate(paramValidation.feedback.submitFeedback), feedbackCtrl.submitFeedback);
router.put('/match-failure', validate(paramValidation.feedback.matchFailureFeedback.put), feedbackCtrl.putMatchFailureFeedback, sendResponse);

module.exports = router;
