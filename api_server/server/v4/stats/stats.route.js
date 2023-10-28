"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const statsCtrl = require('./stats.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');
const deprecatedHandler = require('../../../middlewares/deprecatedAPIHandler');

const router = express.Router();
router.route('/get-most-watched-videos').post(validate(paramValidation.stats.getMostWatchedVideos), deprecatedHandler, statsCtrl.getMostWatchedVideos)
module.exports = router;
