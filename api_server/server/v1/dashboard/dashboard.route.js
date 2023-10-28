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
const dashboardCtrl = require('./dashboard.controller')

router.route('/search/:entity_type').get(dashboardCtrl.search)
router.route('/ugc/:entity_id/delete').get(dashboardCtrl.deleteugc)
router.route('/comment/:entity_id/delete').get(dashboardCtrl.deletecomment)
router.route('/migratemock/:idfrom').get(dashboardCtrl.migrateMockSync)
router.route('/rollbackmock/:idfrom').get(dashboardCtrl.rollBack)
router.route('/banuser/:studentid').get(dashboardCtrl.banuser)
router.route('/unbanuser/:studentid').get(dashboardCtrl.unbanuser)
router.route('/badword/add').get(dashboardCtrl.addbadword)
router.route('/badword/remove').get(dashboardCtrl.removebadword)
router.route('/question/:question_id/rating/:rating').get(dashboardCtrl.changeQuestionRating)
router.route('/sendMail').post(dashboardCtrl.sendMail)



module.exports = router
