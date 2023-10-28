
const express = require('express');
// const validate = require('express-validation');
// const paramValidation = require('../param-validation');
const settingsCtrl = require('./settings.controller');
// const Auth = require('../../../middlewares/userAuth');


const router = express.Router();

router.route('/get-about-us').get(settingsCtrl.aboutUs);

router.route('/get-tnc').get(settingsCtrl.termsAndConditions);

router.route('/get-privacy').get(settingsCtrl.privacy);

router.route('/get-contact-us').get(settingsCtrl.contactUs);

router.route('/get-camera-guide').get(settingsCtrl.cameraGuide)

router.route('/get-refund-policy').get(settingsCtrl.refundPolicy);

module.exports = router;
