"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const sharingCtrl = require('./sharing.controller');
const authGuard = require('../../../middlewares/auth');


const router = express.Router();


router.route('/message/get').get(validate(paramValidation.sharingmessage.search), sharingCtrl.getMessage)
router.route('/whatsapp').post(validate(paramValidation.sharingmessage.whatsApp),authGuard, sharingCtrl.whatsApp)

module.exports = router;
