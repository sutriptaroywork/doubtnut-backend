"use strict";
const express = require('express');
const validate = require('express-validation');
//const paramValidation = require('./routeValidation');
const iconCtrl = require('./icons.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();


router.route('/getdata/:class').get(authGuard,iconCtrl.geticonsByIconOrderByClass)

module.exports = router;
