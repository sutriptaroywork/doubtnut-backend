const express = require('express');

const router = express.Router();
const validate = require('express-validation');
const webBannerCtrl = require('./web_banner.controller');
const paramValidation = require('./routeValidation');

router.route('/get-banner').get(validate(paramValidation.getBanner), webBannerCtrl.getBanner);
router.route('/get-web-banner').get(webBannerCtrl.getWebBanner);
module.exports = router;
