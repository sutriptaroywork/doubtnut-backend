const express = require('express');
const authGuard = require('../../../middlewares/auth');

const configCtrl = require('./config.controller');
const campaignDataSet = require('../../../middlewares/campaign');
const deprecatedHandler = require('../../../middlewares/deprecatedAPIHandler');
const sendResponse = require('../../../middlewares/sendResponse');

const router = express.Router();

router.route('/onboard').get(configCtrl.onboard);
router.route('/demo').get(authGuard, configCtrl.getQuestionDemo);
router.route('/getBottomSheet').get(authGuard, configCtrl.getBottomSheetNavigationForIIT);
router.route('/submitBottomSheet').post(authGuard, configCtrl.submitBottomSheet);
router.route('/get-signed-url').get(authGuard, deprecatedHandler);
router.route('/get-login-config').get(configCtrl.getLoginConfigMeta);
router.route('/settings').get(authGuard, campaignDataSet, configCtrl.getOnboardingSettings, sendResponse);
router.route('/doubtnut_coralogix').get(authGuard, configCtrl.coralogixTest);

module.exports = router;
