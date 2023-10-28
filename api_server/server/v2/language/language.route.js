"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const langCtrl = require('./language.controller');
// const Auth = require('../../../middlewares/userAuth');

const router = express.Router();

router.route('/get-list/:student_id?').get(langCtrl.getList);
router.route('/update').post(validate(paramValidation.language.updateLanguage), langCtrl.updateLanguage);

module.exports = router;
