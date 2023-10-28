const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const feedCtrl = require('./feed.controller');
const authGuard = require('../../../middlewares/auth');
const router = express.Router();

router.route('/get/:page').get(validate(paramValidation.feed.feed),authGuard,feedCtrl.getFeed);
// router.route('/submit-like').post(validate(paramValidation.feed.submitResult),authGuard,feedCtrl.submitResult);
router.route('/get-entity-details').post(validate(paramValidation.feed.getEntityDetails),authGuard,feedCtrl.getEntityDetails);
module.exports = router;

