const express = require('express');
const authGuard = require('../../../middlewares/auth');
const packageCtrl = require('./package.controller');

const router = express.Router();

/*
to get subscription package for today based on active
 */
router.route('/info').get(packageCtrl.info);

/*
check the status of user package
 */
router.route('/status').get(packageCtrl.status);


/*
post feedback  of student
 */
router.route('/feedback').post(authGuard, packageCtrl.feedbackSubmit);

/*
get invite referral list
 */
router.route('/plan-days').get(authGuard, packageCtrl.planDays);

/*
trial package
 */
router.route('/trial').get(authGuard, packageCtrl.trial);
/*
get package info by mobile no. for panel
 */
router.route('/panel-info').get(packageCtrl.infoForPanel);

router.route('/get-variant-info').get(authGuard, packageCtrl.getVariantInfo);

router.route('/set-student-package').get(authGuard, packageCtrl.setStudentPackage);

router.route('/state').get(authGuard, packageCtrl.getSubscriptionStatus);

router.route('/payment-info').get(packageCtrl.getPaymentInfo);
router.route('/follow-up').get(packageCtrl.followUp);
router.route('/package-details').post(authGuard, packageCtrl.getPackageDetails);

router.route('/doubt/info').get(authGuard, packageCtrl.doubtInfo);
router.route('/doubt/status').get(authGuard, packageCtrl.doubtStatus);

// getting paypal subscription info
router.route('/doubt/billing/info').get(authGuard, packageCtrl.doubtBillingInfo);

// for activating, cancelling membership
router.route('/doubt/subscription/do').post(authGuard, packageCtrl.doubtSubscriptionDo);
router.route('/send-deeplink').get(packageCtrl.sendDeeplink);
router.route('/offline-sales-deeplinks').get(packageCtrl.offlineSalesDeeplink);
router.route('/offline-sales-get-packages').get(packageCtrl.offlineSalesGetPackages);
router.route('/crm-get-package-details').get(packageCtrl.crmGetPackageDetails);
router.route('/crm-get-student-details').get(packageCtrl.crmGetStudentDetails);
router.route('/crm-send-disposition-message').post(packageCtrl.crmSendDispositionMessage);
router.route('/nkc-qc').post(packageCtrl.nkcQc);
module.exports = router;
