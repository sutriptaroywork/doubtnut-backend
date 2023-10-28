"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const statsCtrl = require('./stats.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');


const router = express.Router();
router.route('/get-most-watched-videos').post(validate(paramValidation.stats.getMostWatchedVideos), authGuard, statsCtrl.getMostWatchedVideos)
router.route('/get-most-watched-chapters').post(validate(paramValidation.stats.getMostWatchedChapters), authGuard, statsCtrl.getMostWatchedChapters)
router.route('/get-round-wise-rank').post(validate(paramValidation.stats.getRoundWiseRank), statsCtrl.getRoundWiseRank)
router.route('/get-clg-dept-rank').post(validate(paramValidation.stats.getClgDeptRank), statsCtrl.getClgDeptRank)
router.route('/get-dist-clg').get(statsCtrl.getDistClg)
router.route('/get-dist-state').get(statsCtrl.getDistState)
router.route('/get-dist-dept/:clg').get(validate(paramValidation.stats.getDistDept),statsCtrl.getDistDept)
router.route('/get-dist-quota/:clg/:dept').get(validate(paramValidation.stats.getDistQuota),statsCtrl.getDistQuota)
router.route('/get-dist-category/:clg/:dept/:quota').get(validate(paramValidation.stats.getDistCategory),statsCtrl.getDistCategory)
router.route('/get-state-wise-category/:state').get(validate(paramValidation.stats.getStateWiseCategory), statsCtrl.getStateWiseCategory)
router.route('/test-response').get(statsCtrl.test);
module.exports = router;
