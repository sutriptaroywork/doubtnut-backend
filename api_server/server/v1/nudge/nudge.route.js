const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');

const nudgeCtrl = require('./nudge.controller');

const router = express.Router();

router.route('/get').get(validate(paramValidation.nudge.get), authGuard, nudgeCtrl.get);
router.route('/close-banner').get(validate(paramValidation.nudge.get), authGuard, nudgeCtrl.closeNudgeBanner);
router.route('/popup-banner').get(validate(paramValidation.nudge.get), authGuard, nudgeCtrl.getNudgePopUp);

module.exports = router;
