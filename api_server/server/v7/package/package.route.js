const express = require('express');
const authGuard = require('../../../middlewares/auth');
const packageCtrl = require('./package.controller');
const setBrowserInHeaders = require('../../../middlewares/setBrowserInHeaders');

const router = express.Router();

/*
to get subscription package for today based on active
 */
router.route('/info').get(setBrowserInHeaders, authGuard, packageCtrl.info);
router.route('/get-emi-details').get(authGuard, packageCtrl.getEmiDetails);
router.route('/flagr').get(authGuard, packageCtrl.flagr);
router.route('/my-plans').get(authGuard, packageCtrl.myPlans);

module.exports = router;
