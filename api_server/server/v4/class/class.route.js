
const express = require('express');
// const validate = require('express-validation');
// const paramValidation = require('../param-validation');
const authGuard = require('../../../middlewares/auth');
const classCtrl = require('./class.controller');
// const Auth = require('../../../middlewares/userAuth');


const router = express.Router();
router.route('/get-list/:language').get(classCtrl.getList);
router.route('/list').get(authGuard, classCtrl.getClassList);
module.exports = router;
