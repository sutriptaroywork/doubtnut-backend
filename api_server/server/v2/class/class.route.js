"use strict";
const express = require('express');
const validate = require('express-validation');
// const paramValidation = require('../param-validation');
const classCtrl = require('./class.controller');
//const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');


const router = express.Router();
router.route('/get-list').get(classCtrl.getList);
module.exports = router;
