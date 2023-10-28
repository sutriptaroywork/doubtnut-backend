const express = require('express');
const authGuard = require('../../../middlewares/auth');

const sendResponse = require('../../../middlewares/sendResponse');
const audioToolTipController = require('./audiotooltip.controller');

const router = express.Router();

router.get('/files', authGuard, audioToolTipController.files, sendResponse);

module.exports = router;
