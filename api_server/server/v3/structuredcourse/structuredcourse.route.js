const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const structuredCourseCtrl = require('./structuredcourse.controller');

const router = express.Router();

router.route('/get-todays-data/:id/:subject').get(validate(paramValidation.structuredCourse.getTodaysData), authGuard, structuredCourseCtrl.getTodaysData);
router.route('/get-course-details/:course_id/:details_id').get(validate(paramValidation.structuredCourse.getCourseDetails), authGuard, structuredCourseCtrl.getCourseDetails);

module.exports = router;
