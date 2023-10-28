const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const studyTimerController = require('./studyTimer.controller');

router.route('/home').get(authGuard, studyTimerController.home);
router.route('/stats').get(authGuard, studyTimerController.stats);
router.route('/result').post(authGuard, validate(routeValidation.result.post), studyTimerController.result);

module.exports = router;
