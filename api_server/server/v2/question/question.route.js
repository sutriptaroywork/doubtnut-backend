const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const multer = require('multer');
const questionCtrl = require('./question.controller');
const paramValidation = require('./routeValidation');

const getFields = multer();

const router = express.Router();


router.route('/ask').post(authGuard, questionCtrl.ask);
router.route('/get-by-tag').post(validate(paramValidation.question.question_meta), authGuard, questionCtrl.getQuestionDetailsByTag);
router.route('/get-by-filters').post(validate(paramValidation.question.filter2), questionCtrl.filter);
router.route('/get-chapters').get(authGuard, questionCtrl.getChapters);
router.route('/ask-expert').post(authGuard, questionCtrl.askExpert);
router.route('/get-match-results').post(authGuard, validate(paramValidation.question.getSearchResults), questionCtrl.getPrefixSearch);
router.route('/update-match-results').post(authGuard, validate(paramValidation.question.updateSearchResults), questionCtrl.updatePrefixSearch);
router.route('/get-chapters-by-qid').post(authGuard, validate(paramValidation.question.getChaptersByQid), questionCtrl.getChaptersByQid);
router.route('/get-most-watched-users').get(authGuard, questionCtrl.getMostWatchedUsers);
router.route('/get-jee-mains-2019-answers').post(validate(paramValidation.question.jeeMains2019Answers), questionCtrl.jeeMains2019Answers);
router.route('/get-microconcept').post(authGuard, validate(paramValidation.question.microConcept), questionCtrl.microConcept);
router.route('/whatsapp-rating').post(validate(paramValidation.question.whatsappRating), questionCtrl.whatsappRating);
router.route('/whatsapp-rating-multipart').post(getFields.fields([]), questionCtrl.whatsappRatingMultipart);
router.route('/matches').get(authGuard, questionCtrl.matches);
router.route('/updated-matches').get(questionCtrl.updatedMatches);
router.route('/add-stats').post(questionCtrl.addStats);
router.route('/get-matches-by-filename').get(validate(paramValidation.question.getMatchesByFileName), authGuard, questionCtrl.getMatchesByFileName);
router.route('/get-matches-by-filename').post(validate(paramValidation.question.postMatchesByFileName), authGuard, questionCtrl.postMatchesByFileName);

module.exports = router;
