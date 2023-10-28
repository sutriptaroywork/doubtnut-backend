const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const doubtPeCharcha = require('./doubtPeCharcha.controller');

router.route('/connect').post(authGuard, doubtPeCharcha.connect);
router.route('/list-members').post(authGuard, validate(routeValidation.listMembers.post), doubtPeCharcha.listMembers);
router.route('/feedback').post(authGuard, validate(routeValidation.feedback.post), doubtPeCharcha.feedback);
router.route('/add-member').post(authGuard, validate(routeValidation.addMember.post), doubtPeCharcha.addMember);
router.route('/deactivate').post(authGuard, validate(routeValidation.deactivate.post), doubtPeCharcha.deactivate);
router.route('/get-question-thumbnail/:question_id').get(validate(routeValidation.question_thumbnail), doubtPeCharcha.getQuestionThumbnail);
router.route('/doubt-types').get(authGuard, doubtPeCharcha.doubtTypes);
router.route('/doubts').post(authGuard, validate(routeValidation.doubts.post), doubtPeCharcha.doubts);
router.route('/helper-data').post(authGuard, validate(routeValidation.helperData.post), doubtPeCharcha.helperData);
router.route('/similar-solved-doubts').post(authGuard, validate(routeValidation.similarSolvedDoubts.post), doubtPeCharcha.similarSolvedDoubts);

module.exports = router;
