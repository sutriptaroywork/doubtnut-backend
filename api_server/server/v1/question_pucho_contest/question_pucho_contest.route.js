const express = require('express');
const authGuard = require('../../../middlewares/auth');
const qPCCtrl = require('./question_pucho_contest.controller');

const router = express.Router();

router.route('/claim-reward').post(authGuard, qPCCtrl.claimReward);
router.route('/myhome').post(authGuard, qPCCtrl.getMyHome);
router.route('/home').get(qPCCtrl.getHome);

module.exports = router;
