const express = require('express');
// const validate = require('express-validation');
// const paramValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');
const gamificationCtrl = require('./gamification.controller');

const router = express.Router();

router.route('/test-leaderboard').get(authGuard, gamificationCtrl.getTestLeaderboard);

module.exports = router;
