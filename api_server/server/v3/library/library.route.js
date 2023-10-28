const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const libraryCtrl = require('./library.controller');
const Auth = require('../../../middlewares/userAuth');
const classAuth = require('../../../middlewares/handleDropperClass');
const authGuard = require('../../../middlewares/auth');


const router = express.Router();

router.route('/:student_class/:student_course/get').get(libraryCtrl.get)

module.exports = router;
