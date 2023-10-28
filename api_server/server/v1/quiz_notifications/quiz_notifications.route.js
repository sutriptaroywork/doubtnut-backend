const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const quizController = require('./quiz_notifications.controller');

router.route('/get-upcoming-quizzes').post(validate(routeValidation.route.post), authGuard, quizController.getUpcomingQuizzes);
router.route('/popup-notifications')
    .get(quizController.popupNotifications)
    .post(validate(routeValidation.popup_notifications.post), quizController.popupNotifications);

module.exports = router;
