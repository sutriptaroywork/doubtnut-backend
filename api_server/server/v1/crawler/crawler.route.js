"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const deprecatedHandler = require('../../../middlewares/deprecatedAPIHandler')
const router = express.Router();

router.route('/crawl-details').get(validate(paramValidation.crawler.crawl), deprecatedHandler);

module.exports = router;
