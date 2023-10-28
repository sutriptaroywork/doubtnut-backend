const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const courseCtrl = require('./course.controller');
const optionalAuth = require('../../../middlewares/optionalAuth');
const setBrowserInHeaders = require('../../../middlewares/setBrowserInHeaders');

const router = express.Router();

router.route('/get-resource').get(validate(paramValidation.course.resourceDetail), authGuard, courseCtrl.resourcePage);
router.route('/get-detail').get(validate(paramValidation.course.courseDetail), authGuard, courseCtrl.getCourseDetail);
router.route('/get-tab-detail').get(validate(paramValidation.course.tabDetail), authGuard, courseCtrl.courseTabDetail);
router.route('/home').get(validate(paramValidation.course.home), setBrowserInHeaders, optionalAuth, courseCtrl.home);
router.route('/get-timetable').get(validate(paramValidation.course.courseDetail), authGuard, courseCtrl.timetable);

module.exports = router;
