const express = require('express');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const doubtsSuggesterCtrl = require('./doubtSuggester.controller');

router.route('/get-suggestions').post(authGuard, doubtsSuggesterCtrl.getSuggestions);
router.route('/get-app-suggestions').post(authGuard, doubtsSuggesterCtrl.getAppSuggestions);

module.exports = router;
