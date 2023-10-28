const express = require('express');

const router = express.Router();
const authGuard = require('../../../middlewares/auth');
const studentCtrl = require('./student.controller');

router.route('/get-student-onboarding').get(authGuard, studentCtrl.getStudentOnboarding);
router.route('/post-student-onboarding').post(authGuard, studentCtrl.postStudentOnboarding);

module.exports = router;
