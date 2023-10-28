const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const answerCtrl = require('./answer.controller');
const sendResponse = require('../../../middlewares/sendResponse');
const handleComputatuoQuestions = require('../../../middlewares/handleComputationalQuestionView');


const router = express.Router();


router.route('/view-answer-by-question-id').post(validate(paramValidation.answer.viewAnswerByQuestionId), authGuard, handleComputatuoQuestions, answerCtrl.viewAnswerByQuestionId);
router.route('/advanced-search').post(validate(paramValidation.answer.advancedSearch.post), authGuard, answerCtrl.advanceSearchNew, sendResponse);

module.exports = router;
