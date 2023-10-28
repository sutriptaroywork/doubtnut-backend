const authGuard = require('../../../middlewares/auth');
const express = require('express');

const cameraCtrl = require('./camera.controller');

const router = express.Router();

router.get('/get-settings', authGuard, cameraCtrl.getCameraSettings());

module.exports = router;
