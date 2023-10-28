const express = require('express');
const authGuard = require('../../../middlewares/auth');
const searchCtrl = require('./search.controller');
const sendResponse = require('../../../middlewares/sendResponse');

const router = express.Router();

router.route('/getSuggestions').post(authGuard, searchCtrl.getSuggestions);
router.route('/autoSuggest').post(authGuard, searchCtrl.getAutoSuggest, sendResponse);
router.route('/get-ias-feedback').post(authGuard, searchCtrl.getIasFeedback);
router.route('/getSuggestionsWidgets').post(authGuard, searchCtrl.getSuggestionsWidgets);
module.exports = router;
