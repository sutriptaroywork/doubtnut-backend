const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const checkUserAgent = require('../../../middlewares/optionalAuth');
const paramValidation = require('./routeValidation');
const courseCtrl = require('./course.controller');
const campaign = require('../../../middlewares/campaign');

const router = express.Router();

router.route('/get-detail').get(validate(paramValidation.course.courseDetail), checkUserAgent, courseCtrl.getCourseDetail);
router.route('/get-tab-detail').get(validate(paramValidation.course.tabDetail), authGuard, courseCtrl.courseTabDetail);
router.route('/home').get(validate(paramValidation.course.home), authGuard, campaign, courseCtrl.home);
router.route('/get-list').get(validate(paramValidation.course.list), authGuard, courseCtrl.getList);
router.route('/emi-reminder').get(authGuard, courseCtrl.getEmiReminder);
router.route('/trending-list').get(authGuard, courseCtrl.getTrendingCoursesList);
router.route('/liveclass-search').post(authGuard, courseCtrl.liveclassSearch);
router.route('/auto-suggest').post(authGuard, courseCtrl.autoSuggest);
router.route('/get-free-live-class-data').get(authGuard, courseCtrl.getFreeLiveClassData);

module.exports = router;
