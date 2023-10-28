const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const questionCtrl = require('./question.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');
const responseSchemaMiddleware = require('../../../middlewares/responseModel')



const router = express.Router();
const compression = require('compression')

router.route('/ask').post(authGuard,compression(),questionCtrl.ask,responseSchemaMiddleware.handleResponse);
//router.route('/get-matches-by-ocr').post(compression(),questionCtrl.getMatchesByOcr);



module.exports = router;
