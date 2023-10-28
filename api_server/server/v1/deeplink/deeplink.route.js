
"use strict"

const express = require("express")


const router = express.Router()
const deeplinkCtrl = require('./deepklink.controller')

router.route('/generate').post(deeplinkCtrl.generate)

module.exports = router
