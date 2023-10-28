const express = require('express');

const authGuard = require('../../../middlewares/auth');
const practiceEnglishCtrl = require('./practiceEnglish.controller');

const router = express.Router();

router.route('/start-test').get(authGuard, practiceEnglishCtrl.getQuestionsList);
router.route('/:questionId/question').get(authGuard, practiceEnglishCtrl.getQuestion);
router.route('/:questionId/upload-answer').post(authGuard, practiceEnglishCtrl.uploadAnswer);
router.route('/end-test').get(authGuard, practiceEnglishCtrl.endTest);
router.route('/set-reminder').get(authGuard, practiceEnglishCtrl.setReminderForTomorrow);

// To be used from admin-panel only
router.route('/addQuestions').post(authGuard, practiceEnglishCtrl.addQuestions);
router.route('/getAllQuestions').get(authGuard, practiceEnglishCtrl.getAllQuestions);
router.route('/:questionId/skip-question').get(authGuard, practiceEnglishCtrl.skipQuestion);

router.route('/:questionId/get-question-admin').get(authGuard, practiceEnglishCtrl.getQuestionAdmin);
router.route('/:questionId/update-question').post(authGuard, practiceEnglishCtrl.updateQuestionById);

module.exports = router;
