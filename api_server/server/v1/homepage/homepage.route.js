const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const homepage = require('./homepage.controller');

router.route('/get/:page').get(validate(paramValidation.homepage.get), authGuard, homepage.get);
router.route('/pop-up').get(authGuard, homepage.popUpData);
router.route('/get-nudge-pop-up-details').get(authGuard, homepage.getNudgePopDetails);
router.route('/store-activity-data').post(validate(paramValidation.homepage.storeActivityData), authGuard, homepage.storeActivityData);
router.route('/last-watched-question-widget').get(authGuard, homepage.getLastWatchedQuestionWidget);

module.exports = router;
