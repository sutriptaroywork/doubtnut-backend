const express = require('express');
const examCornerCtrl = require('./examcorner.controller');

const router = express.Router();
router.route('/').get(examCornerCtrl.getFeed); // 70-500 ms usually around 150-200 ms
router.route('/get-bookmarks').get(examCornerCtrl.getBookmarks); // around 150 ms
router.route('/set-bookmark').post(examCornerCtrl.setBookmarks); // around 300 ms

module.exports = router;
