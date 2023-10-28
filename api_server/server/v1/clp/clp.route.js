const express = require('express');
const clpCtrl = require('./clp.controller');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

router.route('/get-filter-data').get(authGuard, clpCtrl.getFilterData);

module.exports = router;
