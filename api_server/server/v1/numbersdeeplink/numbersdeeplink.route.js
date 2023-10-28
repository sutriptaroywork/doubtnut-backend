"use strict"

const express = require("express")
const validate = require("express-validation")
const router = express.Router()
const  deeplinkCtrl = require('./numbersdeeplink.controller')

router.route('/get').get(deeplinkCtrl.get)

module.exports = router