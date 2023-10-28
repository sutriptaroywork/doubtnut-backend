const express = require('express');
const authGuard = require('../../../middlewares/auth');
const ctrl = require('./seven_pm_quiz.controller');

const router = express.Router();

router.route('/claim-reward').post(authGuard, ctrl.claimReward);
router.route('/myhome').post(authGuard, ctrl.getMyHome);
router.route('/home').get(ctrl.getHome);

module.exports = router;
