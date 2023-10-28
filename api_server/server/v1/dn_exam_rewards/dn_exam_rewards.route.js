const express = require('express');
const authGuard = require('../../../middlewares/auth');
const baseDecoder = require('../../../middlewares/baseDecoder64');
const dnExamCtrl = require('./dn_exam_rewards.controller');

const router = express.Router();

router.route('/getsignedurl').get(baseDecoder, authGuard, dnExamCtrl.getSignedUrl);
router.route('/homepage').get(baseDecoder, authGuard, dnExamCtrl.getHomepage);
router.route('/getfaq').get(baseDecoder, authGuard, dnExamCtrl.getFAQs);
router.route('/view-more').get(baseDecoder, authGuard, dnExamCtrl.viewMoreToppers);
router.route('/redirect').get(authGuard, dnExamCtrl.redirect);
router.route('/formdata').get(baseDecoder, authGuard, dnExamCtrl.getFormData);
router.route('/classes').get(baseDecoder, authGuard, dnExamCtrl.getClasses);
router.route('/exams').get(baseDecoder, authGuard, dnExamCtrl.getExamsList);
router.route('/sheetcourses').get(baseDecoder, authGuard, dnExamCtrl.getSheetCourses);
router.route('/version').get(baseDecoder, authGuard, dnExamCtrl.getversionUpdate);

router.route('/exams').post(baseDecoder, authGuard, dnExamCtrl.postExamsList);
router.route('/formdata').post(baseDecoder, authGuard, dnExamCtrl.postFormData);

module.exports = router;
