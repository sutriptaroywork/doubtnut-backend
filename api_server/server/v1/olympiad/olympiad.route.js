const express = require('express');
const olympiadCtrl = require('./olympiad.controller');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
router.route('/get-details').get(authGuard, olympiadCtrl.getDetailsV2);
router.route('/get-success').get(authGuard, olympiadCtrl.getSuccessV2);
router.route('/register').post(authGuard, olympiadCtrl.registerV2);

router.route('/get-user-details').get(olympiadCtrl.getUserDetails);
router.route('/get-user-links').get(olympiadCtrl.getUserLinks);

module.exports = router;
