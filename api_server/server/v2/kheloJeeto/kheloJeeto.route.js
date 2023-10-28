const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const kheloJeetoController = require('./kheloJeeto.controller');

router.route('/home').get(authGuard, kheloJeetoController.home);
router.route('/levels').get(authGuard, kheloJeetoController.levels);
router.route('/questions').post(validate(routeValidation.questions.post), authGuard, kheloJeetoController.questions);
router.route('/get-widget').post(validate(routeValidation.getWidget.post), authGuard, kheloJeetoController.getWidget);
router.route('/leaderboard-tabs').get(authGuard, kheloJeetoController.leaderboardTabs);
router.route('/leaderboard').post(validate(routeValidation.leaderboard.post), authGuard, kheloJeetoController.leaderboard);
router.route('/topics').post(validate(routeValidation.topics.post), authGuard, kheloJeetoController.topics);
router.route('/friends-tabs').post(validate(routeValidation.friendsTabs.post), authGuard, kheloJeetoController.friendsTabs);
router.route('/friends').post(validate(routeValidation.friends.post), authGuard, kheloJeetoController.friends);
router.route('/invite').post(validate(routeValidation.invite.post), authGuard, kheloJeetoController.invite);
router.route('/number-invite').post(validate(routeValidation.numberInvite.post), authGuard, kheloJeetoController.numberInvite);
router.route('/accept-invite').post(validate(routeValidation.acceptInvite.post), authGuard, kheloJeetoController.acceptInvite);
router.route('/result').post(validate(routeValidation.result.post), authGuard, kheloJeetoController.result);
router.route('/quiz-history').post(validate(routeValidation.quizHistory.post), authGuard, kheloJeetoController.quizHistory);
router.route('/previous-result').post(validate(routeValidation.previousResult.post), authGuard, kheloJeetoController.previousResult);
router.route('/generate-game-id').post(validate(routeValidation.generateGameId.post), authGuard, kheloJeetoController.generateGameId);

module.exports = router;
