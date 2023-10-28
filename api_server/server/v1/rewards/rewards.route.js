const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const rewardsController = require('./rewards.controller');

router.route('/details').get(authGuard, rewardsController.getRewards);
router.route('/attendance')
    .post(authGuard, rewardsController.markAttendance)
    .get(authGuard, rewardsController.markAttendance);
router.route('/scratch').post(authGuard, validate(routeValidation.scratch.post), rewardsController.scratchCard);
router.route('/subscribe').post(authGuard, validate(routeValidation.subscribe.post), rewardsController.subscribe);

module.exports = router;
