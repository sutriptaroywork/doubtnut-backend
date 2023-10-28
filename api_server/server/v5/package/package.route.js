const express = require('express');
const authGuard = require('../../../middlewares/auth');
const packageCtrl = require('./package.controller');

const router = express.Router();

/*
to get subscription package for today based on active
 */
router.route('/info').get(authGuard, packageCtrl.info);

module.exports = router;
