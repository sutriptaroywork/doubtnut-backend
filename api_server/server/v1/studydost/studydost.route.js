const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const rewardsController = require('./studydost.controller');

router.route('/request').post(authGuard, rewardsController.request);
router.route('/send-notification').post(authGuard, validate(routeValidation.sendNotification.post), rewardsController.sendNotification);
router.route('/block-room')
    .post(authGuard, validate(routeValidation.blockRoom.post), rewardsController.blockRoom)
    .get(authGuard, validate(routeValidation.blockRoom.get), rewardsController.blockRoom);

module.exports = router;
