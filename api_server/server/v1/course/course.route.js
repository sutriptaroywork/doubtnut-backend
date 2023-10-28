const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const courseCtrl = require('./course.controller');
const deprecatedHandler = require('../../../middlewares/deprecatedAPIHandler');
const setBrowserInHeaders = require('../../../middlewares/setBrowserInHeaders');
const optionalAuth = require('../../../middlewares/optionalAuth');
const sendResponse = require('../../../middlewares/sendResponse');

const router = express.Router();

router.route('/get').get(validate(paramValidation.course.get), authGuard, courseCtrl.get);
router.route('/get-faculty-detail/:faculty_id/:ecm_id').get(validate(paramValidation.course.faculty), authGuard, deprecatedHandler);
router.route('/get-lectures/:chapter_id').get(validate(paramValidation.course.lectures), authGuard, deprecatedHandler);
router.route('/timetable').get(authGuard, courseCtrl.timeTable);
router.route('/pdf-download').get(authGuard, courseCtrl.pdfDownload);
router.route('/homework/get').get(validate(paramValidation.course.homeworkGet), authGuard, courseCtrl.homeworkGet);
router.route('/homework/review').get(validate(paramValidation.course.homeworkReview), authGuard, courseCtrl.homeworkReview);
router.route('/widgets').get(validate(paramValidation.course.homeworkWidgets), setBrowserInHeaders, optionalAuth, courseCtrl.homeworkWidgets);
router.route('/homework/submit').post(validate(paramValidation.course.homeworkSubmit), authGuard, courseCtrl.homeworkSubmit);
router.route('/homework/list').get(authGuard, courseCtrl.homeworkList);

router.route('/referral-info').get(authGuard, courseCtrl.referralInfo);
router.route('/referral-info-web/:sid').get(courseCtrl.referralInfoWeb);
router.route('/best-seller').get(authGuard, courseCtrl.bestSeller);
router.route('/course-list').get(setBrowserInHeaders, optionalAuth, courseCtrl.courseListing, sendResponse);
router.route('/purchased-list').get(authGuard, courseCtrl.purchasedCourseListing);
router.route('/help-popup').get(validate(paramValidation.course.courseChange), authGuard, courseCtrl.popupDetailsForHelpFlow);
router.route('/switch-list').get(validate(paramValidation.course.courseChange), authGuard, courseCtrl.courseListingForSwitch);
router.route('/switch-filter-details').get(validate(paramValidation.course.courseChange), authGuard, courseCtrl.courseFiltersSelection);
router.route('/callback-data').get(validate(paramValidation.course.courseChange), authGuard, courseCtrl.addCallbackData);
router.route('/calling-card-dismiss').post(authGuard, courseCtrl.dismissCallingCard);
// router.route('/calling-card-dismiss').post(validate(paramValidation.course.dismissCallingCard), authGuard, courseCtrl.dismissCallingCard);
router.route('/request-callback').post(authGuard, courseCtrl.requestCallback);
router.route('/purchase-popups').get(authGuard, courseCtrl.getCoursePagePopups);
router.route('/bottom-sheet').get(validate(paramValidation.course.coursebottomSheet), authGuard, courseCtrl.getCourseBottomSheet);
router.route('/bookmark-resources').get(validate(paramValidation.course.bookmarkCourseResources), authGuard, courseCtrl.bookmarkCourseResources);
router.route('/scheduler-listing').get(validate(paramValidation.course.schedulerListing), authGuard, courseCtrl.schedulerListing);
router.route('/recommended-courses-by-user-category').get(authGuard, courseCtrl.getRecommendedCoursesByUserCategoty);

module.exports = router;
