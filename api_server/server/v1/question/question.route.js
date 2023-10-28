const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');

const paramValidation = require('./routeValidation');
const questionCtrl = require('./question.controller');
const sendResponse = require('../../../middlewares/sendResponse');

const router = express.Router();

// router.route('/ask').post(authGuard,questionCtrl.ask);
// router.route('/get-by-tag').post(validate(paramValidation.question.question_meta),authGuard,questionCtrl.getQuestionDetailsByTag);

// // router.route('/get-by-filters').post(Auth.userAuthByToken,questionCtrl.filter);
// router.route('/get-by-filters').post(validate(paramValidation.question.filter2),questionCtrl.filter);
// router.route('/get-chapters').get(authGuard,questionCtrl.getChapters);
// router.route('/ask-expert').post(authGuard,questionCtrl.askExpert);
// router.route('/get-match-results').post(authGuard,validate(paramValidation.question.getSearchResults),questionCtrl.getPrefixSearch);
// router.route('/update-match-results').post(authGuard,validate(paramValidation.question.updateSearchResults),questionCtrl.updatePrefixSearch);

// router.route('/get-chapters-by-qid').post(authGuard,validate(paramValidation.question.getChaptersByQid),questionCtrl.getChaptersByQid);
// router.route('/get-most-watched-users').get(authGuard,questionCtrl.getMostWatchedUsers);
// router.route('/mathpix').post(validate(paramValidation.ask.mathpix), askCtrl.mathpix);
// router.route('/latex').post(validate(paramValidation.ask.latex), askCtrl.latex);
// router.route('/translate').post(validate(paramValidation.ask.translate), askCtrl.translate);
// router.route('/get-jee-mains-2019').post(validate(paramValidation.question.jeeMains2019),questionCtrl.jeeMains2019);
// router.route('/get-jee-mains-2019-answers').post(validate(paramValidation.question.jeeMains2019Answers),questionCtrl.jeeMains2019Answers);
// router.route('/get-microconcept').post(validate(paramValidation.question.microConcept), questionCtrl.microConcept);
router.route('/ask-whatsapp').post(validate(paramValidation.question.askWhatsApp), questionCtrl.askWhatsApp);
router.route('/whatsapp-logs').post(validate(paramValidation.question.whatsAppLogs), questionCtrl.whatsAppLogs);
router.route('/whatsapp-rating').post(validate(paramValidation.question.whatsappRating), questionCtrl.whatsappRating);
router.route('/get-technothlon').post(validate(paramValidation.question.getTechnothon), questionCtrl.getTechnothon);
router.route('/get-matches').get(validate(paramValidation.question.getMatches), questionCtrl.getMatches);
router.route('/get-by-ocr').post(questionCtrl.getByOcr);
router.route('/youtube-search').post(validate(paramValidation.question.youtubeSearch), authGuard, questionCtrl.getYoutubeSearch);
router.route('/watch-history').get(authGuard, questionCtrl.getQuestionWatchHistory);
router.route('/generate-question-image-upload-url').post(authGuard, questionCtrl.generateSignedUrlForQuestionAskImage);
router.route('/get-topic-data/:question_id').get(authGuard, questionCtrl.getTopicData);
router.route('/get-filters/:filter_type').get(questionCtrl.getAvailableFiltersByFilterType);
router.route('/set-filters').post(questionCtrl.getFilteredResults);
router.route('/top-100-questions-web').get(questionCtrl.getTopQuestionsWeb);
router.route('/breadcrumbs').get(questionCtrl.getBreadcrumbsWeb);
router.route('/get-srp-widgets').get(authGuard, questionCtrl.getSrpWidgets, sendResponse);
router.route('/assign-skip').post(authGuard, questionCtrl.assignSkipForTagging);
router.route('/get-tags').post(authGuard, questionCtrl.getMcTags);
router.route('/add-tagging').post(authGuard, questionCtrl.addMcTagging);
module.exports = router;
