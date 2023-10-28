
/**
 * @Author: xesloohc
 * @Date:   2019-06-11T15:41:22+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-06T19:17:32+05:30
 */

const express = require('express');
const authGuard = require('../../../middlewares/auth');

const sendResponse = require('../../../middlewares/sendResponse');
const gamificationCtrl = require('./gamification.controller');

const router = express.Router();

router.route('/:student_id/badge/all').get(authGuard, gamificationCtrl.getBadge);
router.route('/:student_id/profile').get(authGuard, gamificationCtrl.getProfile);
router.route('/badge/dailystreak').get(authGuard, gamificationCtrl.getDailyStreak);
router.route('/points').get(authGuard, gamificationCtrl.getPoints);
router.route('/leaderboard').get(authGuard, gamificationCtrl.leaderboard);
router.route('/:student_id/sim').get(gamificationCtrl.simulateActionSQS);
router.route('/updatedailystreak').post(authGuard, gamificationCtrl.updateDailyStreak);
router.route('/sendfcm/:student_id/:notification_type').get(gamificationCtrl.sendNotification);
router.route('/unlockinfo').get(authGuard, gamificationCtrl.unlockinfo);
router.get('/get-srp-banner', authGuard, gamificationCtrl.getSRPBanner, sendResponse);

module.exports = router;
