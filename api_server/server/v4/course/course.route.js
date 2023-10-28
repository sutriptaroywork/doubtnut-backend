const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const courseCtrl = require('./course.controller');

const router = express.Router();

router.route('/get').get(validate(paramValidation.course.get), authGuard, courseCtrl.get);
router.route('/get-detail').get(authGuard, courseCtrl.getDetails);
// validate(paramValidation.course.faculty),

module.exports = router;
