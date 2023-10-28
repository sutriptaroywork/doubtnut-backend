const express = require('express');
// const paramValidation = require('./routeValidation');
const iconCtrl = require('./icons.controller');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

router.route('/getdata').get(authGuard, iconCtrl.geticonsByIconOrder);
router.route('/camera-screen/:icon_count?').get(authGuard, iconCtrl.getCameraScreenIcon);
router.route('/increase-icons-count').post(authGuard, iconCtrl.increaseIconsCounts);
router.route('/categories').get(authGuard, iconCtrl.getCategories);
router.route('/get-all-icons/:screen_name').get(authGuard, iconCtrl.getAllIconsByScreen);
router.route('/get-app-nav-icons').get(authGuard, iconCtrl.getAppNavigationIcons);

module.exports = router;
