const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const dailyGoalController = require('./dailygoal.controller');

router.route('/reward-details').get(authGuard, dailyGoalController.getRewards);
router.route('/streak').post(authGuard, dailyGoalController.markStreak);
router.route('/scratch').post(authGuard, validate(routeValidation.scratch.post), dailyGoalController.scratchCard);
router.route('/leaderboard-tabs').get(authGuard, dailyGoalController.leaderboardTabs);
router.route('/leaderboard').post(validate(routeValidation.leaderboard.post), authGuard, dailyGoalController.leaderboard);
router.route('/submit-completion').put(validate(routeValidation.doubtCompletion), authGuard, dailyGoalController.submitDoubtCompletion);
router.route('/get-doubt-feed-details').post(validate(routeValidation.doubtDetails), authGuard, dailyGoalController.getDoubtFeedDetails);
router.route('/get-previous-doubts').post(validate(routeValidation.doubtDetails), authGuard, dailyGoalController.getPreviousDoubts);
router.route('/submit-completion-for-previous').put(validate(routeValidation.previousDoubtCompletion), authGuard, dailyGoalController.submitPreviousDoubtCompletion);

module.exports = router;
