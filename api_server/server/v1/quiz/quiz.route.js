const express = require('express');
const optionalAuth = require('../../../middlewares/optionalAuth');
const quizController = require('./quiz.controller');

const router = express.Router();

router.route('/get-details').get(optionalAuth, quizController.getDetails);
router.route('/start').get(optionalAuth, quizController.start);
router.route('/end').post(optionalAuth, quizController.end);
router.route('/submit').post(optionalAuth, quizController.submit);
router.route('/fetch-submitted').post(optionalAuth, quizController.fetchSubmitted);

module.exports = router;
