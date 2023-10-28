const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const contestCtrl = require('./contest.controller');

const router = express.Router();
router.route('/get-active').get(contestCtrl.getActiveContests);
router.route('/get/:contest_id').get(validate(paramValidation.contest.getContestDetail), contestCtrl.getContestDetail);
module.exports = router;
