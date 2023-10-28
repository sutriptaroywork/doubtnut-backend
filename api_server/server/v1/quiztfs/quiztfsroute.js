const express = require('express');

const router = express.Router();
const quiztfsctrl = require('./quiztfscontroller');
const authGuard = require('../../../middlewares/auth');

router.route('/').get(authGuard, quiztfsctrl.getLandingDetails);
router.route('/quiztfs-start').get(authGuard, quiztfsctrl.getQuizDetails);
router.route('/get-question').get(authGuard, quiztfsctrl.getQuestionForQuizTfs);
router.route('/submit-answer').post(authGuard, quiztfsctrl.submitAnswer);
router.route('/check-daily-streak').get(authGuard, quiztfsctrl.checkDailyStreak);
router.route('/past-sessions').get(authGuard, quiztfsctrl.getPastSessions);
router.route('/rewards').get(authGuard, quiztfsctrl.getRewards);
router.route('/past-sessions-date').get(authGuard, quiztfsctrl.getPastSessionDetailsForDate);
router.route('/question').get(authGuard, quiztfsctrl.getQuestionSubmissionDetails);
router.route('/scratchcard').get(authGuard, quiztfsctrl.scratchCard);
router.route('/question-leader').get(authGuard, quiztfsctrl.questionLeader);
// router.route('/get-session-score').get(authGuard, quiztfsctrl.getAllSessionScore);
// router.route('/get-today-session-score').get(authGuard, quiztfsctrl.getTodaySessionScore);
// router.route('/get-party-session-score').get(authGuard, quiztfsctrl.getSessionScoreForParty);
// router.route('/get-global-session-score').get(authGuard, quiztfsctrl.getGlobalSessionScoreForToday);
// router.route('/get-leadgerboard').get(authGuard, quiztfsctrl.getLeaderboard);
module.exports = router;
