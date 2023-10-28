const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const courseCtrl = require('./course.controller');

const router = express.Router();

router.route('/get').get(validate(paramValidation.course.get), authGuard, courseCtrl.get);
router.route('/get-faculty-detail/:faculty_id/:ecm_id').get(validate(paramValidation.course.faculty), authGuard, courseCtrl.getFacultyDetail);
router.route('/get-livesection').get(validate(paramValidation.course.livesection), authGuard, courseCtrl.getLivesection);
// validate(paramValidation.course.faculty),

module.exports = router;
