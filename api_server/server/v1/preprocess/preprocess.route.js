
const express = require('express');
const validate = require('express-validation');
const preprocessCtrl = require('./preprocess.controller');
const paramValidation = require('./routeValidation');

// const authGuard = require('../../../middlewares/auth');

const router = express.Router();


router.route('/multiple-image-split').post(validate(paramValidation.preprocess.multiple_images), preprocessCtrl.getMultipleImagesSplitUrls);

module.exports = router;
