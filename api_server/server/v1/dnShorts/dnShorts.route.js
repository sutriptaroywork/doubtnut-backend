const express = require('express');
const validate = require('express-validation');
const dnShortsCtrl = require('./dnShorts.controller');
const authGuard = require('../../../middlewares/auth');
const routeValidation = require('./routeValidation');

const router = express.Router();

router.route('/get-qc-videos/:page_no').get(authGuard, dnShortsCtrl.getVideosToQC);
router.route('/update-qc-action').post(authGuard, dnShortsCtrl.updateQcActionForRawVideo);
router.route('/get-shorts-videos').get(authGuard, dnShortsCtrl.getVideos);
router.route('/update-watch-footprint').post(authGuard, validate(routeValidation.dnShorts.updateFootprint), dnShortsCtrl.updateWatchFootprint);
router.route('/bookmark-shorts').post(authGuard, validate(routeValidation.dnShorts.bookmarkShorts), dnShortsCtrl.bookmarkShorts);
router.route('/get-dnshort-tags').post(authGuard, dnShortsCtrl.getDnShortTags);

module.exports = router;
