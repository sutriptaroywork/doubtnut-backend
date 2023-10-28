const express = require('express');
const authGuard = require('../../../middlewares/auth');
const storiesCtrl = require('./stories.controller');

const router = express.Router();

router.route('/ads').get(authGuard, storiesCtrl.getAds);

module.exports = router;
