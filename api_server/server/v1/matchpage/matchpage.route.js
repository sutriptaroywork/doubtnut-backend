const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const sendResponse = require('../../../middlewares/sendResponse');

const router = express.Router();
const matchPageController = require('./matchpage.controller');

router.route('/get-carousels/:question_id?').get(validate(paramValidation.getCarousel), authGuard, matchPageController.getCarousels, sendResponse);
router.route('/get-srp-carousels').post(authGuard, matchPageController.getSRPCarousels, sendResponse);

module.exports = router;
