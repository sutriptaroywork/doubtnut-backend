const express = require('express');
const authGuard = require('../../../middlewares/auth');
const payCtrl = require('./payment.controller');
const payCtrlNew = require('./payment.controller_new');
const setBrowserInHeaders = require('../../../middlewares/setBrowserInHeaders');

const router = express.Router();

router.route('/start').post(authGuard, payCtrl.startPayment);
router.route('/complete').post(authGuard, payCtrl.completePayment);
router.route('/paytm/phone').post(authGuard, payCtrl.paytmUpdateNumber);
router.route('/paytm/phone').get(authGuard, payCtrl.getPaytmNumber);
router.route('/rzp-hook').post(payCtrl.rzpHook);
router.route('/paypal-hook').post(payCtrl.paypalHook);
// to create invoice link via rzp payment link api
// on completion of payment the webhook will be called to make entry in relevant table
// TODO sms, template pending with 2F for approval, not a blocker
router.route('/rzp/invoice').post(payCtrl.rzpCreateInvoice);
router.route('/panel-checkout-details').post(payCtrl.panelCheckoutDetails);
router.route('/payout/details').post(payCtrl.payoutDetails);
router.route('/paytm/disburse').post(payCtrl.paytmDisburse);
router.route('/paytm/refund').post(payCtrl.handlePaytmPayRefund);
router.route('/paytm-hook').post(payCtrl.paytmHook);
router.route('/paytm/disburse/status').post(payCtrl.paytmDisburseStatus);
// router.route('/paytm/disburse').post(payCtrl.paytmDisburse);
router.route('/transaction-history/:page').get(authGuard, payCtrl.txnHistory);

// to fetch transaction history based on type of transaction
router.route('/transaction-history/:type/:page').get(payCtrl.txnHistoryByType);
router.route('/initiate-refund').post(authGuard, payCtrl.initiateRefund);
router.route('/payment-link/info').get(authGuard, payCtrl.paymentLinkInfo);
router.route('/payment-link/create').post(authGuard, payCtrl.paymentLinkCreate);
router.route('/checkout').post(authGuard, payCtrl.checkoutPage);
router.route('/checkout/payment-details').post(setBrowserInHeaders, authGuard, payCtrl.checkoutPaymentDetails);
// to fetch the status of a payment
router.route('/qr/status').post(authGuard, payCtrl.qrStatus);
router.route('/payout/paytm-referral').post(payCtrl.payoutPaytmReferral);
router.route('/payout/paytm-referral-success').post(payCtrl.payoutPaytmReferralSuccess);

// bbps
router.route('/bbps/info').get(payCtrl.bbpsInfo);

// cod
router.route('/sr-hook').post(payCtrl.shiprocketHook);
router.route('/cod/pincode-check').get(authGuard, payCtrl.checkForPincodeServiceability);
router.route('/cod/confirm-order').post(authGuard, payCtrl.confirmCODOrder);
router.route('/cod/create-order').post(authGuard, payCtrl.createCODOrder);
router.route('/cod/cancel-order').get(payCtrl.cancelCODOrder);
router.route('/cod/address').get(authGuard, payCtrl.getAddressArray);
router.route('/cod/address/:id').get(authGuard, payCtrl.getAddressById);
router.route('/cod/address').put(authGuard, payCtrl.updateAddress);
router.route('/cod/address').post(authGuard, payCtrl.createAddress);
router.route('/cod/cart-details').get(authGuard, payCtrl.codPricingDetails);
router.route('/cod/status').post(authGuard, payCtrl.codPage);

// Temporary reward Coupon
router.route('/temp-reward/info').get(authGuard, payCtrl.getTempRewardWidgetDetails);
router.route('/temp-reward/continue-payment').post(authGuard, payCtrl.tempRewardsContinuePayment);

router.route('/create-missing-payment-entries').get(payCtrl.createMissingPaymentEntries);
router.route('/recon-payment-entries-by-order').get(payCtrl.reconcilePaymentByOrderId);

// sales attribution
router.route('/update-sales-attribution').post(payCtrl.updateSalesAttribution);

// Reseller
router.route('/reseller/create-transaction').post(authGuard, payCtrl.createResellerTransaction);
router.route('/reseller/verify-reseller').post(authGuard, payCtrl.verifyResellerByPhone);
router.route('/reseller/transaction-history').get(authGuard, payCtrl.resellerTransactionHistory);

// Fetch Payment By Type
router.route('/payment-status').post(payCtrlNew.fetchPaymentByType);

// GrayQuest Webhook
router.route('/grayquest/hook').post(payCtrl.grayQuestHook);

// Wallet Transfer
router.route('/transfer-wallet-cash').post(payCtrlNew.transferWalletCash);

// Switch Course
router.route('/switch-course').post(payCtrlNew.switchCourse);

// Shopse EMI
router.route('/shopse/get-otp').post(authGuard, payCtrlNew.getShopseOTP);
router.route('/shopse/verify-otp-eligibility').post(authGuard, payCtrlNew.verifyShopseOTP);
router.route('/shopse/create-transaction').post(authGuard, payCtrlNew.createShopseTransaction);
router.route('/shopse/payment-complete').post(payCtrlNew.shopsePaymentComplete);
router.route('/shopse/check-emi-eligibility').post(payCtrlNew.checkShopseEligibility);
router.route('/shopse/webhook').post(payCtrlNew.shopseWebhook);

// PayU EMI
router.route('/payu/check-emi-eligibility').post(authGuard, payCtrlNew.checkPayUEligibility);
router.route('/payu/calculate-emi-interest').post(authGuard, payCtrlNew.computePayUEmiInterest);
router.route('/payu/create-transaction').post(authGuard, payCtrlNew.createPayUTransaction);
router.route('/payu/payment-complete').post(payCtrlNew.payUPaymentComplete);
router.route('/payu/webhook').post(payCtrlNew.payUWebhook);

router.route('/referral/missing-entries').get(authGuard, payCtrlNew.referralKafkaManualEntries);

router.route('/activate-fintech-emi').post(authGuard, payCtrlNew.activateFintechEmi);

// Create qr based on paymentInfoId for whatsapp-payment-failure
router.route('/qr/payment').get(payCtrlNew.getQrByPaymentInfo);

module.exports = router;
