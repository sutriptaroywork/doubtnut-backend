
const express = require('express');
const authGuard = require('../../../middlewares/auth');
const payCtrl = require('./payment.controller');

const router = express.Router();

router.route('/start').post(authGuard, payCtrl.startPayment);

module.exports = router;
