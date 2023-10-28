"use strict"


const express = require("express")
const validate = require("express-validation")
//const paramValidation = require('./routeValidation')
const authGuard = require('../../../middlewares/auth');
const router = express.Router()
const  library = require('./library.controller')


router.route('/getAll').get(authGuard,library.getAll)
router.route('/getplaylist').get(authGuard,library.getPlaylist)
router.route('/getresource').get(authGuard,library.getResource)
router.route('/getCustomPlaylist').get(authGuard,library.getCustomPlaylist)

module.exports = router
