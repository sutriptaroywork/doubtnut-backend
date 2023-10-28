const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const homeCtrl = require('./home.controller');
const router = express.Router();
const authGuard = require('../../../middlewares/auth');


// router.route('/get').get(homeCtrl.homePage);
// router.route('/get-intro').get(homeCtrl.getIntroVideoLink);
// router.route('/get-ncert-details').get(homeCtrl.getNcertClassChapters);
router.route('/feed/:page').get(validate(paramValidation.home.feed),authGuard,homeCtrl.feed);
router.route('/feed-web/:page').get(validate(paramValidation.home.feedWeb),homeCtrl.feedWeb);
module.exports = router;
