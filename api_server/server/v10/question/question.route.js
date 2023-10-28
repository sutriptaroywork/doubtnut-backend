const express = require('express');
const authGuard = require('../../../middlewares/auth');
const validate = require('express-validation');

const router = express.Router();
// const compression = require('compression');

const questionCtrl = require('./question.controller');
const paramValidation = require('./routeValidation');
const headerMiddleware = require('../../../middlewares/header');
const { generateAskResponse } = require('../../../middlewares/generateAskResponse');
const sendResponse = require('../../../middlewares/validateAskResponse');
// const handleSequentialQuestionIdMiddleware = require('../../../middlewares/handleSequentialQuestionId');

router.route('/ask').post(validate(paramValidation.question.ask), authGuard, headerMiddleware.blockQASpamming, questionCtrl.ask, generateAskResponse, sendResponse);
module.exports = router;
