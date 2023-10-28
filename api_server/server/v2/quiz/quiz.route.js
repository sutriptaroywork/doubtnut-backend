const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const quizCtrl = require('./quiz.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');



const router = express.Router();


router.route('/get-details').get(quizCtrl.getQuizDetails)
router.route('/get/:id').get(quizCtrl.getQuizDetailsById);
router.route('/submit-answer').post(validate(paramValidation.quiz.submit),quizCtrl.submitAnswer)
router.route('/get-top-scorer/:quiz_id').get(validate(paramValidation.quiz.topScorer),quizCtrl.getTopScorers)
router.route('/get-report/:quiz_id').get(validate(paramValidation.quiz.topScorer),quizCtrl.getReport)
// router.route('/get-question-options').post(validate(paramValidation.quiz.quizOptions),  quizCtrl.getQuizQuestionOptions)
module.exports = router;
