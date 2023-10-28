const express = require('express');
const authGuard = require('../../../middlewares/auth');
const districtCtrl = require('./district.controller');

const router = express.Router();

router.route('/homepage').get(authGuard, districtCtrl.getHomepage);
router.route('/postform').post(authGuard, districtCtrl.postForm);
router.route('/districts').get(authGuard, districtCtrl.getDistricts);

module.exports = router;
