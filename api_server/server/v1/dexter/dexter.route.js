const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const routeValidation = require('./routeValidation');

const router = express.Router();
const dexterCtrl = require('./dexter.controller');

router.route('/questions').post(validate(routeValidation.route.questions), authGuard, dexterCtrl.getQuestions);
router.route('/:questionId/get_widget').get(authGuard, dexterCtrl.getWidget);
router.route('/save_response').post(authGuard, dexterCtrl.saveResponse);
router.route('/leaderboard').get(authGuard, dexterCtrl.leaderboard);
router.route('/result').post(authGuard, dexterCtrl.result);

module.exports = router;
