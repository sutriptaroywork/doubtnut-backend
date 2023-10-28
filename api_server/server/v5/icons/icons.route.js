const express = require('express');
const authGuard = require('../../../middlewares/auth');
const iconCtrl = require('./icons.controller');

const router = express.Router();


router.route('/getdata/:class').get(authGuard, iconCtrl.geticonsByIconOrderByClass);

module.exports = router;
