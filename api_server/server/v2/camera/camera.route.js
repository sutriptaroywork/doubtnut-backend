const express = require('express');
const authGuard = require('../../../middlewares/auth');

const sendResponse = require('../../../middlewares/sendResponse');
const cameraCtrl = require('./camera.controller');

const router = express.Router();

router.get('/get-settings', authGuard, cameraCtrl.getCameraSettings, sendResponse);
router.get('/get-bottom-icons', authGuard, cameraCtrl.getBottomIcons, sendResponse);

module.exports = router;
