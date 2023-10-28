const express = require('express');
const paidUserChampionship = require('./paidUserChampionship.controller');

const router = express.Router();
router.route('/get-leaderboard').get(paidUserChampionship.getLeaderboard);
// router.route('/get-previous-winners').get(paidUserChampionship.getPreviousWinners);
// router.route('/address-form-data').get(paidUserChampionship.claimReward);
// router.route('/submit-reward').get(paidUserChampionship.submitClaim);

module.exports = router;
