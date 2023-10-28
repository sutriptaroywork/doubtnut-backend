"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const communityCtrl = require('./community.controller');
const Auth = require('../../../middlewares/userAuth');
const classAuth = require('../../../middlewares/handleDropperClass');
const authGuard = require('../../../middlewares/auth');


const router = express.Router();



router.route('/add-question').post(validate(paramValidation.community.add),communityCtrl.addQuestion);
router.route('/get-meta').get(communityCtrl.getCommunityMeta);
router.route('/upvote-question').post(validate(paramValidation.community.upvote),communityCtrl.upvoteQuestions);
// router.route('/get-top-voted').get(communityCtrl.getTopVotedQuestions);
// router.route('/ask-question').post(validate(paramValidation.community.ask), classAuth.classChangeParams,communityCtrl.askCommunity);
router.route('/:page/get-unanswered-questions').get(validate(paramValidation.community.getUnansweredQuestions), communityCtrl.getUnansweredQuestions);
router.route('/:page/get-answered-questions').get(validate(paramValidation.community.getAnsweredQuestions), communityCtrl.getAnsweredQuestions);
router.route('/:page/get-stats').get(validate(paramValidation.community.getStats), communityCtrl.getStats);
router.route('/get-question/:question_id').get(validate(paramValidation.community.get_question), communityCtrl.getCommunitySingleQuestion);
module.exports = router;
