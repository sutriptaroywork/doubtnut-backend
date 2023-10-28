const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const courseCtrl = require('./course.controller');
const setBrowserInHeaders = require('../../../middlewares/setBrowserInHeaders');
const sendResponse = require('../../../middlewares/sendResponse');

const router = express.Router();

router.route('/:student_class/get-list').get(validate(paramValidation.course.courselist), courseCtrl.courseList);
router.route('/get').get(validate(paramValidation.course.get), authGuard, courseCtrl.get);
router.route('/get-faculty-detail/:faculty_id/:ecm_id').get(validate(paramValidation.course.faculty), authGuard, courseCtrl.getFacultyDetail);
router.route('/get-lectures/:chapter_id').get(validate(paramValidation.course.lectures), authGuard, courseCtrl.getLectures);
router.route('/list').get(validate(paramValidation.course.list), authGuard, courseCtrl.list);
router.route('/timetable').get(validate(paramValidation.course.timetable), setBrowserInHeaders, authGuard, courseCtrl.timeTable);
router.route('/widgets').get(validate(paramValidation.course.videopageWidgets), authGuard, courseCtrl.getVideopageWidgets, sendResponse);
router.route('/video-page-tabs').get(validate(paramValidation.course.lectureSeriesWidgets), authGuard, courseCtrl.getVideoPageTabsData);
router.route('/bottom-sheet').get(validate(paramValidation.course.lectureSeriesWidgets), authGuard, courseCtrl.getNextLectureSeries);
router.route('/referral-info').get(authGuard, courseCtrl.referralInfo);
router.route('/referral-share-info').post(authGuard, courseCtrl.shareInfo);

module.exports = router;
