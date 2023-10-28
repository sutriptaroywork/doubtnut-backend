const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const structuredCourseCtrl = require('./structuredcourse.controller');

const router = express.Router();

router.route('/get-details').get(validate(paramValidation.structuredCourse.getDetails), structuredCourseCtrl.getDetails);
router.route('/get-resource').get(validate(paramValidation.structuredCourse.getResource), structuredCourseCtrl.getResource);

module.exports = router;
