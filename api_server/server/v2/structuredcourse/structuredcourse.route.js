"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const structuredCourseCtrl = require('./structuredcourse.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

router.route('/get-todays-data/:id/:subject').get(validate(paramValidation.structuredCourse.getTodaysData), authGuard, structuredCourseCtrl.getTodaysData)

module.exports = router;
