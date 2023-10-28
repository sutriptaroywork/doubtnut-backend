/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2018-12-27 18:01:54
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-18 12:50:12
*/
"use strict"
/**
 *@author  : Xesloohc
 *
 * Test Series Route  definitions/
 *
 */
const express = require("express")
const validation = require("express-validation")
const paramValidation = require('./routeValidation')
const Auth = require('../../../middlewares/userAuth')
const authGuard = require('../../../middlewares/auth');

const router = express.Router()

const  testseriesCtrl = require('./testseries.controller')


router.route('/:filter').get(authGuard,testseriesCtrl.getTestSeries)
router.route('/rules/:ruleId').get(authGuard,testseriesCtrl.getRulesById)
router.route('/:testId/questionsdata').get(authGuard,testseriesCtrl.getQuestionsByTestWithData)
router.route('/:testId/subscribe').get(authGuard,testseriesCtrl.subscibeUserForTest)
router.route('/response').post(authGuard,testseriesCtrl.saveStudentResponse)
router.route('/:testsubscriptionId/submit').get(authGuard,testseriesCtrl.submitTest)
router.route('/:testsubscriptionId/result').get(authGuard,testseriesCtrl.getResult)
router.route('/:testsubscriptionId/responses').get(testseriesCtrl.inProgressStudentResponse)
router.route('/:testId/leaderboard').get(authGuard,testseriesCtrl.getleaderboard)
router.route('/:testId/questionsdatabysections').get(authGuard,testseriesCtrl.getQuestionsByTestSectionsWithData)
router.route('/:testsubscriptionId/mockresult').get(authGuard,testseriesCtrl.getMockResult)
router.route('/:testId/repopulateresult').get(testseriesCtrl.repopulateResult)

//router.route('/:testsubscriptionId/inprogressresponse').get(authGuard,testseriesCtrl.inProgressStudentResponse)


//router.route('/:testId/questions').get(authGuard,testseriesCtrl.getQuestionsByTest)
// router.route('/:testId/testsections').get(authGuard,testseriesCtrl.getTestSections)
// router.route('/:testId/:sectionCode/questions').get(authGuard,testseriesCtrl.getQuestionsBySection)
// router.route('/:testId/:sectionCode/questionsdata').get(authGuard,testseriesCtrl.getQuestionsBySectionWithData)


module.exports = router
