const express = require('express');
const authGuard = require('../../../middlewares/auth');
const iconCtrl = require('./icons.controller');

const router = express.Router();
router.route('/getdata').post(authGuard, iconCtrl.geticonsByIconOrderByClass);

module.exports = router;
