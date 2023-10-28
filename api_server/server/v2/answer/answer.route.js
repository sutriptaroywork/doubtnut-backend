
const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const answerCtrl = require('./answer.controller');

const router = express.Router();


router.route('/view-answer-by-question-id').post(validate(paramValidation.answer.viewAnswerByQuestionId), authGuard, answerCtrl.viewAnswerByQuestionId);
router.route('/update-answer-view').post(validate(paramValidation.answer.updateAnswerView), authGuard, answerCtrl.updateAnswerView);
router.route('/view-similar-questions').post(validate(paramValidation.answer.viewSimilarQuestions), authGuard, answerCtrl.viewSimilarQuestions);
router.route('/view-onboarding').post(validate(paramValidation.answer.onBoarding), authGuard, answerCtrl.onBoarding);
module.exports = router;
