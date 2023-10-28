


"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const contestCtrl = require('./contestWeb.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

router.route('/get-all-contests').get(authGuard, contestCtrl.getAllContests)
router.route('/enroll').post(validate(paramValidation.contest.enroll), authGuard, contestCtrl.enroll)
router.route('/get-max-qid').post(validate(paramValidation.contest.maxQidContest), authGuard, contestCtrl.getMaxQnoByStudentId)
router.route('/get-questions-list').post(validate(paramValidation.contest.maxQidContest), authGuard, contestCtrl.getQuestionslist)
router.route('/answer-insert').post(validate(paramValidation.contest.answerInsert), authGuard, contestCtrl.answerInsert)
module.exports = router;
