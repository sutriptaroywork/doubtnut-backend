const express = require('express');
const packageCtrl = require('./package.controller');
const authGuard = require('../../../middlewares/auth');
const router = express.Router();

/*
to get subscription package for today based on active
 */
router.route('/info').get(packageCtrl.info);

/*
check the status of user package
 */
router.route('/status').get(packageCtrl.status);
router.route('/trial').get(authGuard, packageCtrl.trial);

/* only for doubts */
router.route('/doubt/info').get(authGuard, packageCtrl.doubtInfo);
router.route('/doubt/status').get(authGuard, packageCtrl.doubtStatus);

module.exports = router;
