const express = require('express');
const authGuard = require('../../../middlewares/auth');
const ctrl = require('./twenty_four_seven_quiz_contest.controller');

const router = express.Router();

router.route('/claim-reward').post(authGuard, ctrl.claimReward);
router.route('/myhome').post(authGuard, ctrl.getMyHome);
router.route('/home').get(ctrl.getHome);

module.exports = router;
