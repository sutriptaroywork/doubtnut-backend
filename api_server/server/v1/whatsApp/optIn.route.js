const express = require('express');
const validate = require('express-validation');
const multer = require('multer');
const paramValidation = require('./routeValidation');
const whatsappCtrl = require('./optIn.controller');
const whatsappResponse = require('./whatsAppResponse');
const netcoreWebhook = require('./whatsapp.netcore.controller');
const sendResponse = require('../../../middlewares/sendResponse');

const router = express.Router();
const getFields = multer();


router.route('/optIn').post(validate(paramValidation.whatsapp.optIn), whatsappCtrl.optIn);
router.route('/phone-one').get(whatsappCtrl.optInOne);
router.route('/phone-two').get(whatsappCtrl.optInTwo);
router.route('/phone-three').get(whatsappCtrl.optInThree);
router.route('/whatsappResponse').post(whatsappResponse.whatsappResponses);
router.route('/pushNotification_wa').post(whatsappResponse.pushNotification_wa);
router.route('/whatsappRetention').get(whatsappCtrl.retentionReportByDate);
router.route('/newRetention_wa').get(whatsappCtrl.newRetention_wa);
router.route('/pauseNotification').post(whatsappResponse.PauseNotification);
router.route('/netcoreWebhook').post(netcoreWebhook.netcoreWebhook, sendResponse);
// router.route('/resumeNotification').post(whatsappResponse.ResumeNotification);
// router.route('/sendWhatsAppMessage').post(whatsappResponse.sendWhatsAppMessage)
router.route('/optInMutipart').post(getFields.fields([]), whatsappCtrl.optInMultipart);


module.exports = router;
