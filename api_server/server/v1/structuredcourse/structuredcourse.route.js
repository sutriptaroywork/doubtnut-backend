"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const structuredCourseCtrl = require('./structuredcourse.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

router.route('/get-todays-data/:id/:subject').get(validate(paramValidation.structuredCourse.getTodaysData), authGuard, structuredCourseCtrl.getTodaysData)
router.route('/get-course-details/:course_id/:details_id').get(validate(paramValidation.structuredCourse.getCourseDetails), authGuard, structuredCourseCtrl.getCourseDetails)
router.route('/get-tag-qlist/:tag').get(validate(paramValidation.structuredCourse.getTagQlist), authGuard, structuredCourseCtrl.getTagQlist)

module.exports = router;
