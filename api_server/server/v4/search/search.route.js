const express = require('express');
const authGuard = require('../../../middlewares/auth');
const searchCtrl = require('./search.controller');

const router = express.Router();

router.route('/getSuggestions').get(authGuard, searchCtrl.getSuggestions);
router.route('/get-match').post(authGuard, searchCtrl.search);
router.route('/autoSuggest').post(authGuard, searchCtrl.getAutoSuggest);
module.exports = router;
