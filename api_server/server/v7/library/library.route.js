const express = require('express');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const library = require('./library.controller');

router.route('/getAll').get(authGuard, library.getAll);
router.route('/topHeaders').get(authGuard, library.getTopHeaders);
router.route('/getplaylist').get(authGuard, library.getPlaylist);
router.route('/getresource').get(authGuard, library.getResource);
router.route('/getCustomPlaylist').get(authGuard, library.getCustomPlaylist);
router.route('/watch-later').post(authGuard, library.watchLater);
router.route('/buildPopular').get(library.buildPopular);

module.exports = router;
