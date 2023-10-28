const express = require('express');
const authGuard = require('../../../middlewares/auth');
const couponCtrl = require('./coupon.controller');

const router = express.Router();


router.route('/check-coupon-code').get(couponCtrl.couponCodeCheck);
router.route('/post-coupon-code').post(couponCtrl.couponCodePost);
router.route('/get-target-group').get(couponCtrl.getTargetGroup);
router.route('/post-target-group').post(couponCtrl.postTargetGroup);
router.route('/get-target-group-by-id').get(couponCtrl.getTargetGroupById);
router.route('/get-package-by-coupon-code').get(couponCtrl.getPackagesByCouponCode);
router.route('/applicable-coupon-codes').post(authGuard, couponCtrl.applicableCouponCodes);
router.route('/post-coupon-package-mapping').post(couponCtrl.postCouponPackages);
router.route('/update-coupon-index').post(couponCtrl.updateCouponIndex);

// Reseller Coupons
router.route('/reseller-coupon').post(authGuard, couponCtrl.createResellerCoupon);
router.route('/reseller-coupon-ledger').get(authGuard, couponCtrl.getResellerCouponLedger);
module.exports = router;
