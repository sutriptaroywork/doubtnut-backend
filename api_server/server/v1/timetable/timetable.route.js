"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const tmetblCtrl = require('./timetable.controller');
const authGuard = require('../../../middlewares/auth');
const router = express.Router();



 
router.route('/insert').post(authGuard, tmetblCtrl.insert)
router.route('/get-details').get(authGuard, tmetblCtrl.getTimeTable)
router.route('/delete/:id').get(authGuard,tmetblCtrl.deleteTimeTable)
router.route('/update/:id').post(authGuard, tmetblCtrl.updateTimeTable)
module.exports = router;

