/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-10 20:04:56
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-20T15:23:41+05:30
*/
"use strict"

const express = require("express")
const validation = require("express-validation")
const paramValidation = require('./routeValidation')
const Auth = require('../../../middlewares/userAuth')
const authGuard = require('../../../middlewares/auth');

const router = express.Router()
const unbanCtrl = require('./unban.controller')

router.route('/sendUnBanRequest/:studentid').put(unbanCtrl.sendUnBanRequest)
router.route('/getUnBanRequests').get(unbanCtrl.getUnBanRequests)
router.route('/getUnBanRequestStatus/:studentid').get(unbanCtrl.getUnBanRequestStatus)
router.route('/:studentid/reviewed').put(unbanCtrl.reviewedUser);

module.exports = router