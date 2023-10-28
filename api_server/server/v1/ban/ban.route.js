const express = require('express');
const authGuard = require('../../../middlewares/auth');
const banCtrl = require('./ban.controller');

const router = express.Router();

router.route('/status').get(authGuard, banCtrl.status);
router.route('/timeout').post(authGuard, banCtrl.timeout);
router.route('/timeoutStatus').post(authGuard, banCtrl.timeoutStatus);
router.route('/timeout/:liveclassQuestionId/:studentId').get(banCtrl.timeOutUrgent);

module.exports = router;
