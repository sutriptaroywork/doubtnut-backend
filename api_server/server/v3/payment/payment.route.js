
const express = require('express');
const authGuard = require('../../../middlewares/auth');
const payCtrl = require('./payment.controller');

const router = express.Router();

router.route('/transaction-history/:page').get(authGuard, payCtrl.txnHistory);
router.route('/start').post(authGuard, payCtrl.startPayment);
router.route('/checkout').post(authGuard, payCtrl.checkoutPage);
module.exports = router;
