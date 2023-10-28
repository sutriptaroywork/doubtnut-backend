const express = require('express');
const authGuard = require('../../../middlewares/auth');
const payCtrl = require('./payment.controller');
const setBrowserInHeaders = require('../../../middlewares/setBrowserInHeaders');

const router = express.Router();

router.route('/transaction-history/:page').get(authGuard, payCtrl.txnHistory);
router.route('/start').post(authGuard, payCtrl.startPayment);
router.route('/checkout').post(authGuard, payCtrl.checkoutPage);
router.route('/checkout/payment-details').post(setBrowserInHeaders, authGuard, payCtrl.checkoutPaymentDetails);

module.exports = router;
