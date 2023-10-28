const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');

const paramValidation = require('./routeValidation');
const liveclassCtrl = require('./liveclass.controller');

const router = express.Router();

router.route('/leaderboard').get(validate(paramValidation.liveclass.getLeaderBoard), liveclassCtrl.getLeaderBoard);
router.route('/get-list').get(validate(paramValidation.liveclass.getList), validate(paramValidation.liveclass.getList), authGuard, liveclassCtrl.getList);
router.route('/start').get(validate(paramValidation.liveclass.startByFaculty), authGuard, liveclassCtrl.startByFaculty);
router.route('/end').get(validate(paramValidation.liveclass.end), authGuard, liveclassCtrl.end);
router.route('/get-quiz-questions').get(validate(paramValidation.liveclass.getQuizQuestions), authGuard, liveclassCtrl.getQuizQuestions);
router.route('/push-quiz-question').get(validate(paramValidation.liveclass.pushQuizQuestion), authGuard, liveclassCtrl.pushQuizQuestion);
router.route('/quiz-submit').post(validate(paramValidation.liveclass.quizSubmit), authGuard, liveclassCtrl.quizSubmit);
router.route('/post-quiz-details').get(validate(paramValidation.liveclass.postQuizDetails), authGuard, liveclassCtrl.postQuizDetails);
router.route('/status').get(validate(paramValidation.liveclass.status), authGuard, liveclassCtrl.status);
router.route('/endappx').post(validate(paramValidation.liveclass.end), authGuard, liveclassCtrl.endAppx);
router.route('/deletecache').get(validate(paramValidation.liveclass.end), authGuard, liveclassCtrl.deleteCache);

module.exports = router;
