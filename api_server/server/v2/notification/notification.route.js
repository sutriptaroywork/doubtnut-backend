const express = require('express');
// const validate = require('express-validation');
// const paramValidation = require('../param-validation');
const NotifyCtrl = require('./notification.controller');
// const Auth = require('../../../middlewares/userAuth');
// const authGuard = require('../../../middlewares/auth');

const router = express.Router();

// router.route('/get-active-notifications').get(authGuard,NotifyCtrl.getActiveNotifications);
router.route('/get-all-actions').get(NotifyCtrl.getAllAction);
router.route('/get-pending').get(NotifyCtrl.getPending);

module.exports = router;
