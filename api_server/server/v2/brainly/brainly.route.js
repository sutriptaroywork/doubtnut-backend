"use strict"

const express = require("express")
const validate = require('express-validation');
const paramValidation = require('./routeValidation')
const Auth = require('../../../middlewares/userAuth')
const authGuard = require('../../../middlewares/auth');

const router = express.Router()
const brainlyCtrl = require('./brainly.controller')

router.route('/search/:qid').get(brainlyCtrl.search)
router.route('/search-with-url/:url').get(brainlyCtrl.searchWithUrl)
router.route('/feedback').post(validate(paramValidation.brainly.feedback),brainlyCtrl.feedback)

module.exports = router
