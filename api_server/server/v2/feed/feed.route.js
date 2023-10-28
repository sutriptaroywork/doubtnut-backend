const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const feedCtrl = require('./feed.controller');
const authGuard = require('../../../middlewares/auth');
const router = express.Router();

router.route('/get/:page').get(validate(paramValidation.feed.feed),authGuard,feedCtrl.getFeed);
router.route('/submit-like').post(validate(paramValidation.feed.submitResult),authGuard,feedCtrl.submitResult);
router.route('/submit-poll').post(validate(paramValidation.feed.submitPoll),authGuard,feedCtrl.updatePolls);
router.route('/get-entity-details').post(validate(paramValidation.feed.getEntityDetails),authGuard,feedCtrl.getEntityDetails);
router.route('/get-feed-answered/:page').get(validate(paramValidation.feed.getFeedAnsweredQuestions),authGuard,feedCtrl.getFeedAnsweredQuestions);
router.route('/get-data/:type').get(validate(paramValidation.feed.getData),authGuard,feedCtrl.getData);
router.route('/get-entity-likes/:id/:type').get(validate(paramValidation.feed.getEntityLikes),authGuard,feedCtrl.getEntityLikes);

router.route('/:entityId/report').post(authGuard,feedCtrl.reportEntity);
router.route('/add-og').post(validate(paramValidation.feed.addOg),authGuard,feedCtrl.addOg);
router.route('/unsubscribe').post(validate(paramValidation.feed.getPostsUnsubscribe),authGuard,feedCtrl.getPostsUnsubscribe);

module.exports = router;

