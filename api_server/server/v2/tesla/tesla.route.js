"use strict";
const express = require('express');
const validate = require('express-validation');
const teslaCtrl = require('./tesla.controller');
const authGuard = require('../../../middlewares/auth');
const router = express.Router();
const path = require('path')
const publicPath = path.join(__dirname, '..', '..', '..', 'public')

router.route('/userposts/:studentId').get(authGuard, teslaCtrl.getUserPosts);
router.route('/userbookmarks/:studentId').get(authGuard, teslaCtrl.getBookmarkedPosts);
router.route('/feed').get(authGuard, teslaCtrl.getFeed)
router.route('/feed_browser').get(teslaCtrl.feedBrowser);
router.route('/feedstats').get(teslaCtrl.feedStats);
router.route('/post/:id').get(authGuard, teslaCtrl.getFeedItem)
router.route('/topicpost/:topic').get(authGuard, teslaCtrl.topicpost);
module.exports = router;

