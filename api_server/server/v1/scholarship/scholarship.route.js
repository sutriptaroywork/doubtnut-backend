const express = require('express');
const authGuard = require('../../../middlewares/auth');
const baseDecoder = require('../../../middlewares/baseDecoder64');
const scholarshipCtrl = require('./scholarship.controller');

const router = express.Router();

router.route('/test').get(baseDecoder, authGuard, scholarshipCtrl.getTest);
router.route('/register-test').post(baseDecoder, authGuard, scholarshipCtrl.registerTest);
router.route('/start-test').get(baseDecoder, authGuard, scholarshipCtrl.getStartTestPage);
router.route('/wait').get(baseDecoder, authGuard, scholarshipCtrl.getWaitPage);
router.route('/results').get(baseDecoder, authGuard, scholarshipCtrl.getResultPage);
router.route('/test2').get(baseDecoder, authGuard, scholarshipCtrl.getRound2Reg);
router.route('/start-test2').get(baseDecoder, authGuard, scholarshipCtrl.getRound2Start);
router.route('/wait2').get(baseDecoder, authGuard, scholarshipCtrl.getRound2Wait);
router.route('/results2').get(baseDecoder, authGuard, scholarshipCtrl.getRound2Result);

module.exports = router;
