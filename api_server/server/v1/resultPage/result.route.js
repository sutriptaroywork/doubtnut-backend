const express = require('express');
const authGuard = require('../../../middlewares/auth');
const resultCtrl = require('./resultPage.controller');

const router = express.Router();

router.route('/getresult').get(authGuard, resultCtrl.resultPage);

module.exports = router;
