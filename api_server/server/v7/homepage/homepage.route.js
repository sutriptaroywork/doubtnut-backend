const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');

const router = express.Router();
const homepage = require('./homepage.controller');

router.route('/get/:page').get(validate(paramValidation.homepage.get), authGuard, homepage.get);
router.route('/get-home-us-web/:page').get(validate(paramValidation.homepage.get), authGuard, homepage.getHomepageUS);
router.route('/submit-selected-widget-data').post(validate(paramValidation.homepage.submitSelectedData), authGuard, homepage.submitOptionsSelectedForActionWidgets);
router.route('/reset-student-course-mapping').post(validate(paramValidation.homepage.deleteAllData), authGuard, homepage.removeAllDataFromStudentCourseMapping);
router.route('/submit-widget-question-answer').post(validate(paramValidation.homepage.submitQuestionWidgetAnswersSelected), authGuard, homepage.submitQuestionWidgetAnswersSelected);
router.route('/submit-subject-widget-choice').post(validate(paramValidation.homepage.submitPersonalisationBySubjectInRedis), authGuard, homepage.submitPersonalisationBySubjectInRedis);

module.exports = router;
