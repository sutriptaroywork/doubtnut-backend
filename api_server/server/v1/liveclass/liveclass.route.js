const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const liveclassCtrl = require('./liveclass.controller');

const router = express.Router();

router.route('/push-quiz-question').get(validate(paramValidation.liveclass.pushQuizQuestion), authGuard, liveclassCtrl.pushQuizQuestion);
router.route('/quiz-submit').post(validate(paramValidation.liveclass.quizSubmit), authGuard, liveclassCtrl.quizSubmit);
router.route('/get-push-url').get(validate(paramValidation.liveclass.getPushUrl), authGuard, liveclassCtrl.getPushUrl);
router.route('/get-quiz-questions').get(validate(paramValidation.liveclass.getQuizQuestions), authGuard, liveclassCtrl.getQuizQuestions);
router.route('/start').get(validate(paramValidation.liveclass.startByFaculty), authGuard, liveclassCtrl.startByFaculty);
router.route('/end').get(validate(paramValidation.liveclass.end), authGuard, liveclassCtrl.end);
router.route('/get-list').get(validate(paramValidation.liveclass.home), validate(paramValidation.liveclass.getList), authGuard, liveclassCtrl.getList);
router.route('/home').get(authGuard, liveclassCtrl.home);
router.route('/get-resource').get(validate(paramValidation.liveclass.courseDetail), authGuard, liveclassCtrl.courseDetail);
router.route('/package-info').get(validate(paramValidation.liveclass.packageInfo), authGuard, liveclassCtrl.packageInfo);
router.route('/post-quiz-details').get(validate(paramValidation.liveclass.postQuizDetails), authGuard, liveclassCtrl.postQuizDetails);
router.route('/mark-student-interested').get(validate(paramValidation.liveclass.interestedSudents), authGuard, liveclassCtrl.markInterestedStudents);
router.route('/get-interested-students').get(validate(paramValidation.liveclass.interestedSudents), authGuard, liveclassCtrl.getInterestedStudents);
router.route('/faculty-login').get(validate(paramValidation.liveclass.facultyLogin), liveclassCtrl.facultyLogin);
router.route('/leaderboard').get(validate(paramValidation.liveclass.getLeaderBoard), authGuard, liveclassCtrl.getLeaderBoard);
router.route('/current-leaderboard-stats').get(authGuard, liveclassCtrl.currentLeaderBoardStats);
router.route('/status').get(validate(paramValidation.liveclass.status), authGuard, liveclassCtrl.status);
router.route('/video-page-data/:question_id/:status').get(validate(paramValidation.liveclass.videoPageData), authGuard, liveclassCtrl.videoPageData);
router.route('/video-page-live-banner/:question_id').get(authGuard, liveclassCtrl.videoPageLiveBanner);

module.exports = router;
