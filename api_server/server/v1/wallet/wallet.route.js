const express = require('express');
const authGuard = require('../../../middlewares/auth');
const payCtrl = require('./wallet.controller');

const router = express.Router();

// to fetch pdf data on wallet page
router.route('/recommended-resources').get(authGuard, payCtrl.suggestedResources);
router.route('/show-vpa').get(authGuard, payCtrl.showWalletVpa);

module.exports = router;
