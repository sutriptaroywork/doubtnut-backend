const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const p2pController = require('./p2p.controller');

router.route('/home').post(authGuard, validate(routeValidation.home.post), p2pController.home);
router.route('/doubts').post(authGuard, validate(routeValidation.doubts.post), p2pController.doubts);
router.route('/feedback-data').post(authGuard, validate(routeValidation.feedbackData.post), p2pController.feedbackData);
router.route('/whatsapp-initiated').post(authGuard, validate(routeValidation.whatsappInitiated.post), p2pController.whatsappInitiated);
router.route('/mark-solved').post(authGuard, validate(routeValidation.markSolved.post), p2pController.markSolved);

module.exports = router;
