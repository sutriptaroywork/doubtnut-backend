const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');
const teslaCtrl = require('./tesla.controller');

const router = express.Router();

router.route('/get-signed-upload-url').get(authGuard, teslaCtrl.getSigned);
router.route('/post-feed').post(authGuard, teslaCtrl.postFeed);
router.route('/post/:id').get(authGuard, teslaCtrl.getFeedItem);
router.route('/feed').get(authGuard, teslaCtrl.getFeed);
router.route('/visibilty-callback').post(authGuard, teslaCtrl.saveVisibilityData);
router.route('/bookmark/:entityId').get(authGuard, teslaCtrl.bookmarkEntity);
router.route('/rate/:entityId').post(authGuard, teslaCtrl.rateEntity);
router.route('/profile/:studentId').get(authGuard, teslaCtrl.getProfile);
router.route('/userposts/:studentId').get(authGuard, teslaCtrl.getUserPosts);
router.route('/userbookmarks/:studentId').get(authGuard, teslaCtrl.getBookmarkedPosts);
router.route('/follow').post(authGuard, teslaCtrl.follow);
router.route('/report').post(authGuard, teslaCtrl.reportPost);
router.route('/delete').post(authGuard, teslaCtrl.deletePost);
router.route('/labeldata').get(teslaCtrl.labelData);
router.route('/checkugc').get(teslaCtrl.checkUgc);
router.route('labeldata/marksefie/:id').get(teslaCtrl.markSelfie);
router.route('/livepost/isverified/check').get(authGuard, teslaCtrl.isVerified);
router.route('/livepost/verification/request').post(authGuard, teslaCtrl.requestVerification);
router.route('/createpost/meta').get(authGuard, teslaCtrl.createPostMeta);
router.route('/topicpost/:topic').get(authGuard, teslaCtrl.topicpost);
router.route('/livepost/:postId/streamurl').get(authGuard, teslaCtrl.getLiveStreamUrl);
router.route('/livepost/:postId/endstream').get(authGuard, teslaCtrl.endStream);
// router.route('/livepost/:postId/viewer_count').get(authGuard, teslaCtrl.viewerCount);
router.route('/livepost/:postId/viewer_join').get(authGuard, teslaCtrl.joinLivePost);
router.route('/livepost/:postId/viewer_left').get(authGuard, teslaCtrl.leftLivePost);
router.route('/livepost/:postId/viewer_count').get(authGuard, teslaCtrl.viewerCountOnPost);
router.route('/gamePost/:gameId/start').get(authGuard, teslaCtrl.getGamePost);
router.route('/one-tap-post')
    .post(authGuard, validate(routeValidation.oneTapPosts.post), teslaCtrl.postOneTapPosts)
    .get(authGuard, validate(routeValidation.oneTapPosts.get), teslaCtrl.getOneTapPosts);
// verifiedStatus
// requestVerified/

// disable post feed
router.route('/post_create_status').get(authGuard, teslaCtrl.getPostCreateStatus);

module.exports = router;
