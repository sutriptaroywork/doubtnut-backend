const express = require('express');
const authGuard = require('../../../middlewares/auth');
const teslaCtrl = require('./tesla.controller');
const eventsPublisher = require('../../../middlewares/eventsPublisher');
const checkApiRoute = require('../../../middlewares/checkApiRoute');
const campaignDataSet = require('../../../middlewares/campaign');

const router = express.Router();

router.route('/userposts/:studentId').get(authGuard, teslaCtrl.getUserPosts);
router.route('/userbookmarks/:studentId').get(authGuard, teslaCtrl.getBookmarkedPosts);
router.route('/feed').get(authGuard, checkApiRoute, campaignDataSet, teslaCtrl.getFeed, teslaCtrl.sendFeedForCountriesIfNecessary, teslaCtrl.setPostsData, eventsPublisher);
router.route('/feed_browser').get(teslaCtrl.feedBrowser);
router.route('/feedstats').get(teslaCtrl.feedStats);
router.route('/post/:id').get(authGuard, teslaCtrl.getFeedItem);
router.route('/topicpost/:topic').get(authGuard, teslaCtrl.topicpost);
router.route('/livepost/:filter').get(authGuard, teslaCtrl.livePosts);
router.route('/pinnedposts').get(authGuard, teslaCtrl.getPinnedPostsWidgets);
router.route('/webhook/cricket-score').post(teslaCtrl.rawBody, teslaCtrl.webhookCricket);

module.exports = router;
