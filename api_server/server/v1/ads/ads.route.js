const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
// const videoGuard = require('../../../middlewares/videoSessionHandler');
const paramValidation = require('./routeValidation');
const adsCtrl = require('./ads.controller');

const router = express.Router();

router.route('/update-engagetime').put(validate(paramValidation.ads.updateEngageTime), authGuard, adsCtrl.updateEngageTime);

module.exports = router;
