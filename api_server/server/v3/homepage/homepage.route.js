"use strict"


const express = require("express")
const validate = require("express-validation")
const paramValidation = require('./routeValidation')
const authGuard = require('../../../middlewares/auth');
const router = express.Router()
const  homepage = require('./homepage.controller')


router.route('/get/:page').get(validate(paramValidation.homepage.get),authGuard,homepage.get)

module.exports = router
