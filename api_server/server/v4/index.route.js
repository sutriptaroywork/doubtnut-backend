const express = require('express');

const authGuard = require('../../middlewares/auth');
const answerRoutes = require('./answer/answer.route');
const statsRoutes = require('./stats/stats.route');
const studentRoutes = require('./student/student.route');
const classRoutes = require('./class/class.route');
const libraryRoutes = require('./library/library.route');
const commentRoutes = require('./comment/comment.route');
const feedRoutes = require('./feed/feed.route');
const homeRoutes = require('./home/home.route');
const questionRoutes = require('./question/question.route');
const iconsRoute = require('./icons/icons.route');
const newHomepage = require('./homepage/homepage.route');
const feedbackRoutes = require('./feedback/feedback.route');
const searchRoutes = require('./search/search.route');
const packageRoutes = require('./package/package.route');
const structuredCourseRoutes = require('./structuredcourse/structuredcourse.route');
const courseRoutes = require('./course/course.route');
const paymentRoutes = require('./payment/payment.route');
const gamificationRoutes = require('./gamification/gamification.route');

const router = express.Router();

router.use('/answers', answerRoutes);
router.use('/student', studentRoutes);
router.use('/class', classRoutes);
router.use('/library', authGuard, libraryRoutes);
router.use('/feed', feedRoutes);
router.use('/comment', authGuard, commentRoutes);
router.use('/home', homeRoutes);
router.use('/questions', questionRoutes);
router.use('/stats', statsRoutes);
router.use('/icons', iconsRoute);
router.use('/homepage', newHomepage);
router.use('/feedback', authGuard, feedbackRoutes);
router.use('/search', authGuard, searchRoutes);
router.use('/package', authGuard, packageRoutes);
router.use('/payment', authGuard, paymentRoutes);
router.use('/structured-course', authGuard, structuredCourseRoutes);
router.use('/course', authGuard, courseRoutes);
router.use('/gamification', gamificationRoutes);

module.exports = router;
