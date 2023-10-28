const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const webAuthGuard = require('../../../middlewares/webAuth');
const paramValidation = require('./routeValidation');
const answerCtrl = require('./answer.controller');
const sendResponse = require('../../../middlewares/sendResponse');
const answerHelper = require('../../helpers/answer');
const handleSrpNoFilterPageValue = require('../../../middlewares/handleSrpNoFilterPageValue');

const router = express.Router();

router.route('/view-answer-by-question-id').post(validate(paramValidation.answer.viewAnswerByQuestionId), authGuard, answerCtrl.viewAnswerByQuestionId);
router.route('/view-similar-questions').post(validate(paramValidation.answer.viewSimilarQuestions), authGuard, handleSrpNoFilterPageValue, answerCtrl.viewSimilarQuestions, answerHelper.widgetHandler, sendResponse);
router.route('/view-similar-questions-web').post(validate(paramValidation.answer.viewSimilarWeb), webAuthGuard, answerCtrl.viewSimilarQuestions, answerHelper.widgetHandler, sendResponse);
router.route('/getPlaylistByTag').get(authGuard, answerCtrl.getPlaylistByTag);
router.route('/advanced-search').post(validate(paramValidation.advancedSearch.post), authGuard, answerCtrl.advancedSearch, sendResponse);

module.exports = router;
