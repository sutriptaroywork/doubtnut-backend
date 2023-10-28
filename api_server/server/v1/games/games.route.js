
const express = require('express');
const authGuard = require('../../../middlewares/auth');
const gamesCtrl = require('./games.controller');

const router = express.Router();

router.route('/list').get(authGuard, gamesCtrl.list);

module.exports = router;
