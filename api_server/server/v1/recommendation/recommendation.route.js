const express = require('express');
const validate = require('express-validation');

const setBrowserInHeaders = require('../../../middlewares/setBrowserInHeaders');

const paramValidation = require('./routeValidation');
const recommendationCtrl = require('./recommendation.controller');

const router = express.Router();

router.route('/chat').post(setBrowserInHeaders, validate(paramValidation.recommendation.chat), recommendationCtrl.chat);
module.exports = router;
