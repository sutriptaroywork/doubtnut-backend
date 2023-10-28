const express = require('express');
const olympiadCtrl = require('./olympiad.controller');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

router.route('/get-user-details').get(olympiadCtrl.getUserDetails);
router.route('/get-user-links').get(olympiadCtrl.getUserLinks);
router.route('/add-users').post(authGuard, olympiadCtrl.addUsers);

module.exports = router;
