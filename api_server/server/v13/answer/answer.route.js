const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const webAuthGuard = require('../../../middlewares/webAuth');
const videoGuard = require('../../../middlewares/videoSessionHandler');
const paramValidation = require('./routeValidation');
const answerCtrl = require('./answer.controller');
const setBrowserInHeaders = require('../../../middlewares/setBrowserInHeaders');
const handleComputatuoQuestions = require('../../../middlewares/handleComputationalQuestionView');
const handleBackpressInvalidPageValue = require('../../../middlewares/handleBackpressInvalidPageValue');
const sendResponse = require('../../../middlewares/sendResponse');
const handleNoFilterMatches = require('../../../middlewares/handleNoFilterMatches');

const router = express.Router();

router.route('/view-answer-by-question-id').post(validate(paramValidation.answer.viewAnswerByQuestionId), setBrowserInHeaders, authGuard, videoGuard, handleComputatuoQuestions, handleBackpressInvalidPageValue, handleNoFilterMatches, answerCtrl.viewAnswerByQuestionId, sendResponse);

router.route('/view-answer-web').post(validate(paramValidation.answer.viewAnswerWeb), setBrowserInHeaders, webAuthGuard, handleComputatuoQuestions, handleBackpressInvalidPageValue, answerCtrl.viewAnswerByQuestionId, sendResponse);

module.exports = router;
