const express = require('express');
const validate = require('express-validation');

const paramValidation = require('./routeValidation');
const feedbackCtrl = require('./feedback.controller');
const sendResponse = require('../../../middlewares/sendResponse');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

router.route('/submit').post(feedbackCtrl.submitFeedback);
router.route('/student-rating').post(validate(paramValidation.feedback.studentRating), authGuard, feedbackCtrl.studentRating);
router.route('/rating-cross').get(feedbackCtrl.studentRatingCross);
router.get('/match-failure-options', validate(paramValidation.matchFailureFeedback.get), feedbackCtrl.getMatchFailureFeedbackOptions, sendResponse);
router.put('/match-failure', validate(paramValidation.matchFailureFeedback.put), feedbackCtrl.putMatchFailureFeedback, sendResponse);
router.get('/video-dislike-options', validate(paramValidation.videoDislikeFeedback.get), feedbackCtrl.getVideoDislikeFeedbackOptions, sendResponse);
router.route('/us/screen').get(authGuard, feedbackCtrl.getUSFeedbackScreen);
router.route('/get-popup-data').post(authGuard, feedbackCtrl.getPopupData);
router.route('/submit-popup-selections').post(authGuard, feedbackCtrl.submitPopupSelections);
router.route('/submit-feedback-prefrences').post(authGuard, feedbackCtrl.submitFeedbackPrefrences);

module.exports = router;
