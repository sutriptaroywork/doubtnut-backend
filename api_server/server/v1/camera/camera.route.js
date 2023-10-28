const express = require('express');
const validator = require('express-validation');
const authGuard = require('../../../middlewares/auth');

const sendResponse = require('../../../middlewares/sendResponse');
const cameraCtrl = require('./camera.controller');
const validation = require('./camera.validation');

const router = express.Router();

router.get('/get-settings', validator(validation.cameraSettings.get), authGuard, cameraCtrl.getCameraSettings, sendResponse);
router.get('/get-animation', authGuard, cameraCtrl.getCameraAnimation, sendResponse);
router.post('/post-face-data', validator(validation.cameraSettings.faceData), authGuard, cameraCtrl.postFaceData, sendResponse);

module.exports = router;
