const express = require('express');
const validate = require('express-validation');

const paramValidation = require('./routeValidation');
const landingCtrl = require('./landing.controller');

const router = express.Router();

router.route('/get-data').get(landingCtrl.getLandingData);
router.route('/store-student-query').put(validate(paramValidation.studentQuery), landingCtrl.saveStudentQuery);

module.exports = router;
