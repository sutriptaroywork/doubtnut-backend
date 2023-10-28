
const express = require("express")
const Auth = require('../../../middlewares/userAuth')
const authGuard = require('../../../middlewares/auth');

const router = express.Router()
const alfredCtrl = require('./alfred.controller');

router.route('/channel/create').post(authGuard, alfredCtrl.createChannel);
router.route('/channel/get').get(authGuard, alfredCtrl.getChannel)
router.route('/ban').post(authGuard, alfredCtrl.banUser)
router.route('/user_status/:channelId').get(authGuard, alfredCtrl.userStatus)
router.route('/user_join_status').post(authGuard, alfredCtrl.userJoinStatus)
module.exports = router
