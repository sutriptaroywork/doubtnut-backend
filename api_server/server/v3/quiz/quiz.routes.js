const express = require('express');
const quizController = require('./quiz.controller');

const router = express.Router();

router.route('/get-details').get(quizController.getDetails);
router.route('/start').get(quizController.start);
router.route('/end').post(quizController.end);
router.route('/submit').post(quizController.submit);
router.route('/fetch-submitted').post(quizController.fetchSubmitted);

module.exports = router;
