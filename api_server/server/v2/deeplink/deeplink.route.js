const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const deeplinkCtrl = require('./deeplink.controller');

const router = express.Router();

router.route('/generate').post(validate(paramValidation.deeplink.generate), deeplinkCtrl.generate);

module.exports = router;
