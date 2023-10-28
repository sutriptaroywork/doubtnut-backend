const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const practiceCornerController = require('./practiceCorner.controller');

router.route('/home').get(authGuard, practiceCornerController.home);
router.route('/topics').post(validate(routeValidation.topics.post), authGuard, practiceCornerController.topics);
router.route('/rules').post(validate(routeValidation.rules.post), authGuard, practiceCornerController.rules);
router.route('/questions').post(validate(routeValidation.questions.post), authGuard, practiceCornerController.questions);
router.route('/submit').post(validate(routeValidation.submit.post), authGuard, practiceCornerController.submit);
router.route('/previous-result').post(validate(routeValidation.previous.post), authGuard, practiceCornerController.previousResult);
router.route('/stats').get(authGuard, practiceCornerController.stats);
router.route('/history').post(validate(routeValidation.history.post), authGuard, practiceCornerController.history);
router.route('/subject-tabs').post(validate(routeValidation.tabs.post), authGuard, practiceCornerController.subjectTabs);
router.route('/submit-stats').post(validate(routeValidation.submitStats.post), authGuard, practiceCornerController.submitStats);
router.route('/get-full-test-history').post(validate(routeValidation.fullTest.post), authGuard, practiceCornerController.fullLengthTestHistory);

module.exports = router;
