
const express = require('express');
const authGuard = require('../../../middlewares/auth');
const personalizeCtrl = require('./personalization.controller');

const router = express.Router();


router.route('/get-details').post(authGuard, personalizeCtrl.getDetails);
router.route('/get-chapter-details').post(authGuard, personalizeCtrl.getChapterDetails);
router.route('/get-next-book-chapter-details').post(authGuard, personalizeCtrl.getNextChapterDetails);
router.route('/get-next-book-chapter').post(authGuard, personalizeCtrl.getNextChapters);
router.route('/get-active-slots').post(authGuard, personalizeCtrl.getActiveSlots);

module.exports = router;
