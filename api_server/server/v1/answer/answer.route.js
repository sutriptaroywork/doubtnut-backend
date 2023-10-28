const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const answerCtrl = require('./answer.controller');
const deprecatedHandler = require('../../../middlewares/deprecatedAPIHandler');

const router = express.Router();

router.route('/view-answer-by-question-id').post(validate(paramValidation.answer.viewAnswerByQuestionId), deprecatedHandler);
router.route('/view-answer-by-question-id-new').post(validate(paramValidation.answer.viewAnswerByQuestionIdNew), deprecatedHandler);
router.route('/update-answer-view').post(validate(paramValidation.answer.updateAnswerView), deprecatedHandler);
router.route('/get-topic-video-by-questionid').get(authGuard, answerCtrl.getTopicVideosByQuestionId);
router.route('/video-download').post(validate(paramValidation.downloadVideo.post), authGuard, deprecatedHandler);
router.route('/similar-bottom-sheet/:question_id').get(validate(paramValidation.similarBottomSheet), authGuard, answerCtrl.similarBottomSheet);
router.route('/ncert-videos-additional-data').post(validate(paramValidation.ncertVideos), authGuard, answerCtrl.ncertVideosScreenResponse);
router.route('/store-text-solution-feedback').put(validate(paramValidation.storeFeedback), authGuard, answerCtrl.storeFeedback);
router.route('/get-video-top-widget/:question_id').get(authGuard, answerCtrl.getVideoTopWidget);
router.route('/set-popular-widget-click').put(authGuard, answerCtrl.setPopularWidgetClick);
router.route('/get-last-whatsapp-video-view').get(authGuard, answerCtrl.getLastWhatsappVideoView);
router.route("/add-solution").post(answerCtrl.addTextSolution);
router.route("/add-solution-from-matched-question").post(authGuard, answerCtrl.addSolutionFromMatchedQuestion);

module.exports = router;
