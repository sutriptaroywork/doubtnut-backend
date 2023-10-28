const express = require('express');
const router = express.Router();
const authGuard = require('../../middlewares/auth');

const answerRoutes = require('./answer/answer.route');
const libraryRoutes = require('./library/library.route');
const commentRoutes = require('./comment/comment.route');
const feedRoutes = require('./feed/feed.route');
const newHomepage = require('./homepage/homepage.route');
const iconsRoute = require('./icons/icons.route');
const searchRoutes = require('./search/search.route');
const questionRoutes = require('./question/question.route');
const packageRoutes = require('./package/package.route');
const courseRoutes = require('./course/course.route');
const studentRoutes = require('./student/student.route');

router.use('/answers', answerRoutes);
router.use('/library', authGuard, libraryRoutes);
router.use('/feed', feedRoutes);
router.use('/comment', authGuard, commentRoutes);
router.use('/homepage', newHomepage);
router.use('/icons', iconsRoute);
router.use('/questions', questionRoutes);
router.use('/search', authGuard, searchRoutes);
router.use('/package', authGuard, packageRoutes);
router.use('/course', courseRoutes);
router.use('/student', studentRoutes);
module.exports = router;
