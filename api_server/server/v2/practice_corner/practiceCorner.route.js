const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const practiceCornerController = require('./practiceCorner.controller');

router.route('/get-full-test-history').post(validate(routeValidation.fullTest.post), authGuard, practiceCornerController.fullLengthTestHistory);

module.exports = router;
