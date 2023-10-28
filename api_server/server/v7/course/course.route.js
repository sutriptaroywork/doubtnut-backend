const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const courseCtrl = require('./course.controller');
const optionalAuth = require('../../../middlewares/optionalAuth');
const setBrowserInHeaders = require('../../../middlewares/setBrowserInHeaders');
const eventPublisher = require('../../../middlewares/eventsPublisher');
const sendResponse = require('../../../middlewares/sendResponse');
const campaignDataSet = require('../../../middlewares/campaign');

const router = express.Router();

router.route('/get-detail').get(validate(paramValidation.course.courseDetail), setBrowserInHeaders, optionalAuth, campaignDataSet, courseCtrl.getCourseDetail, eventPublisher, sendResponse);
router.route('/get-tab-detail').get(validate(paramValidation.course.tabDetail), setBrowserInHeaders, authGuard, campaignDataSet, courseCtrl.courseTabDetail);
// filter addition ias perspective can bu used in future "courseTabDetailNew"
router.route('/get-tab-detail-new').get(authGuard, campaignDataSet, courseCtrl.courseTabDetailNew);
router.route('/get-pre-purchase-tab-detail').get(validate(paramValidation.course.tabDetail), authGuard, campaignDataSet, courseCtrl.prePurchaseTabDetail);

module.exports = router;
