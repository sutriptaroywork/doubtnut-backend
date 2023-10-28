/**
 * @Author: xesloohc
 * @Date:   2019-06-11T15:41:22+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-10-24T12:24:20+05:30
 */

const express = require('express');
// const validation = require('express-validation');
// const paramValidation = require('./routeValidation');
// const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

const gamificationCtrl = require('./gamification.controller');

// router.route('/:student_id/badge/all').get(authGuard,gamificationCtrl.getBadge)
router.route('/:student_id/profile').get(authGuard,gamificationCtrl.getProfile);
// router.route('/:student_id/badge/dailystreak').get(authGuard,gamificationCtrl.getDailyStreak)
// router.route('/points').get(authGuard,gamificationCtrl.getPoints)
// router.route('/leaderboard').get(authGuard,gamificationCtrl.leaderboard)
// router.route('/:student_id/sim').get(gamificationCtrl.simulateActionSQS)
// router.route('/updatedailystreak').post(authGuard,gamificationCtrl.updateDailyStreak)
// router.route('/sendfcm/:student_id/:notification_type').get(gamificationCtrl.sendNotification)
// router.route('/unlockinfo').get(authGuard,gamificationCtrl.unlockinfo)
// router.route('/redeemstore').get(authGuard,gamificationCtrl.redeemStore)
// router.route('/:inventory_id/redeem').get(authGuard,gamificationCtrl.redeemItem)
// router.route('/convertcoins').get(authGuard,gamificationCtrl.convertCoins)
// router.route('/insufficentcoins').get(authGuard,gamificationCtrl.insufficentCoins)
// router.route('/pointshistory').get(authGuard,gamificationCtrl.pointsHistory)
// router.route('/dncashinfo').get(authGuard,gamificationCtrl.dnCashInfo)
// router.route('/:badge_id/progress').get(authGuard,gamificationCtrl.badgeProgress)
// router.route('/myorders').get(authGuard,gamificationCtrl.myOrders)
module.exports = router;
