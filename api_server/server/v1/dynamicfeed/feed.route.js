/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-10 12:42:25
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-22 12:05:31
*/
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const feedCtrl = require('./feed.controller');
const authGuard = require('../../../middlewares/auth');
const router = express.Router();


router.route('/get/:page').get(authGuard,feedCtrl.getFeed);
// router.route('/submit-like').post(validate(paramValidation.feed.submitResult),authGuard,feedCtrl.submitResult);
router.route('/get-entity-details').post(validate(paramValidation.feed.getEntityDetails),authGuard,feedCtrl.getEntityDetails);
//router.route('/gziptest').get(compression(),feedCtrl.gziptest);


module.exports = router;

