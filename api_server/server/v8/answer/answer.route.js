"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const answerCtrl = require('./answer.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');





const router = express.Router();


router.route('/view-answer-by-question-id').post(validate(paramValidation.answer.viewAnswerByQuestionId), authGuard, answerCtrl.viewAnswerByQuestionId)
// router.route('/update-answer-view').post(validate(paramValidation.answer.updateAnswerView),authGuard,  answerCtrl.updateAnswerView)

// router.route('/view-similar-questions-web').post(validate(paramValidation.answer.viewSimilarQuestions),authGuard, answerCtrl.viewSimilarQuestionsWeb)
// router.route('/view-onboarding').post(validate(paramValidation.answer.onBoarding),authGuard, answerCtrl.onBoarding)
// router.route('/update-answer-view').post(validate(paramValidation.answer.updateAnswerView),authGuard,  answerCtrl.updateAnswerView)
router.route('/view-similar-questions').post(validate(paramValidation.answer.viewSimilarQuestions),authGuard, answerCtrl.viewSimilarQuestions)
// router.route('/view-onboarding').post(validate(paramValidation.answer.onBoarding),authGuard, answerCtrl.onBoarding)
//  router.route('/pdf-download').post(validate(paramValidation.answer.pdfDownload),authGuard, answerCtrl.pdfDownload);

// router.route('/pdf-download-web').post(validate(paramValidation.answer.pdfDownloadWeb),authGuard, answerCtrl.pdfDownloadWeb);
// router.route('/pdf-download').post(validate(paramValidation.answer.newPdfDownload), authGuard, answerCtrl.newPdfDownload)

module.exports = router;
