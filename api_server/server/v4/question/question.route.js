const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const questionCtrl = require('./question.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');
const responseSchemaMiddleware = require('../../../middlewares/responseModel')


const router = express.Router();
const compression = require('compression')

router.route('/ask').post(authGuard,compression(),questionCtrl.ask,responseSchemaMiddleware.handleResponse);
// router.route('/get-by-tag').post(validate(paramValidation.question.question_meta),authGuard,questionCtrl.getQuestionDetailsByTag);
router.route('/get-by-filters').post(validate(paramValidation.question.filter2),questionCtrl.filter);
// // router.route('/get-by-filters').post(Auth.userAuthByToken,questionCtrl.filter);
// router.route('/get-by-filters').post(validate(paramValidation.question.filter2),questionCtrl.filter);
// router.route('/get-chapters').get(authGuard,questionCtrl.getChapters);
// router.route('/ask-expert').post(authGuard,questionCtrl.askExpert);
// router.route('/get-match-results').post(authGuard,validate(paramValidation.question.getSearchResults),questionCtrl.getPrefixSearch);
// router.route('/update-match-results').post(authGuard,validate(paramValidation.question.updateSearchResults),questionCtrl.updatePrefixSearch);

// router.route('/get-chapters-by-qid').post(authGuard,validate(paramValidation.question.getChaptersByQid),questionCtrl.getChaptersByQid);
// router.route('/get-most-watched-users').get(authGuard,questionCtrl.getMostWatchedUsers);
// // router.route('/mathpix').post(validate(paramValidation.ask.mathpix), askCtrl.mathpix);
// // router.route('/latex').post(validate(paramValidation.ask.latex), askCtrl.latex);
// // router.route('/translate').post(validate(paramValidation.ask.translate), askCtrl.translate);
// router.route('/get-jee-mains-2019').post(validate(paramValidation.question.jeeMains2019),questionCtrl.jeeMains2019);
// router.route('/get-jee-mains-2019-answers').post(validate(paramValidation.question.jeeMains2019Answers),questionCtrl.jeeMains2019Answers);
// router.route('/get-microconcept').post(validate(paramValidation.question.microConcept), questionCtrl.microConcept);

module.exports = router;
