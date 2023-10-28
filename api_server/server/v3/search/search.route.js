const express = require('express');
const authGuard = require('../../../middlewares/auth');
const searchCtrl = require('./search.controller');

const router = express.Router();

router.route('/').get(searchCtrl.search);
router.route('/getSuggestions').get(authGuard, searchCtrl.getSuggestions);
router.route('/insertLog').post(authGuard, searchCtrl.insertLogs);
router.route('/add-ias-suggestion-logs').post(authGuard, searchCtrl.addIasSuggestionLogs);
router.route('/autoSuggest').get(authGuard, searchCtrl.getAutoSuggest);
router.route('/get-animation').get(authGuard, searchCtrl.getAnimationString);
router.route('/dialogue-hints').get(authGuard, searchCtrl.getDialogueHints);
router.route('/last-watch-video').get(authGuard, searchCtrl.getLastWatchedVideo);
router.route('/insert-premium-content-block-view-log').post(authGuard, searchCtrl.insertPremiumContentBlockViewLog);
module.exports = router;
