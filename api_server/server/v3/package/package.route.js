const express = require('express');
const authGuard = require('../../../middlewares/auth');
const packageCtrl = require('./package.controller');

const router = express.Router();

/*
to get subscription package for today based on active
 */
router.route('/info/:lectureId').get(authGuard, packageCtrl.info);

router.route('/trial').get(authGuard, packageCtrl.createTrial);

module.exports = router;
