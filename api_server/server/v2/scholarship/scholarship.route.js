const express = require('express');
const authGuard = require('../../../middlewares/auth');
const scholarshipCtrl = require('./scholarship.controller');

const router = express.Router();

router.route('/test').get(authGuard, scholarshipCtrl.getDetails);
router.route('/register-test').post(authGuard, scholarshipCtrl.registerTest);

module.exports = router;
