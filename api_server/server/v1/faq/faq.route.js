const express = require('express');

const feedbackCtrl = require('./faq.controller');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

router.route('/get').get(authGuard, feedbackCtrl.get);

module.exports = router;
