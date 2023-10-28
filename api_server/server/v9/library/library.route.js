const express = require('express');
// const paramValidation = require('./routeValidation')
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const library = require('./library.controller');

router.route('/getAll').get(authGuard, library.getAllLibraryLandingData);
router.route('/get-all-exams').get(authGuard, library.getAllExams);
router.route('/change-exam').post(authGuard, library.changeExam);
router.route('/previous-years-papers').get(authGuard, library.getExamHeadersAndFilters);
router.route('/previous-years-papers/filter-data').get(authGuard, library.getExamByYearFilterHeadings);
router.route('/previous-years-papers/selection-data').get(authGuard, library.getExamData);

module.exports = router;
