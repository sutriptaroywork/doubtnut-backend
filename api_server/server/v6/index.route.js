const express = require('express');
const authGuard = require('../../middlewares/auth');

const answerRoutes = require('./answer/answer.route');
const libraryRoutes = require('./library/library.route');
const commentRoutes = require('./comment/comment.route');
const feedRoutes = require('./feed/feed.route');
const questionRoutes = require('./question/question.route');
const newHomepage = require('./homepage/homepage.route');
const packageRoutes = require('./package/package.route');
const courseRoutes = require('./course/course.route');
const iconsRoute = require('./icons/icons.route');

const router = express.Router();
router.use('/answers', answerRoutes);
router.use('/library', authGuard, libraryRoutes);
router.use('/homepage', newHomepage);
router.use('/feed', feedRoutes);
router.use('/comment', authGuard, commentRoutes);
router.use('/questions', questionRoutes);
router.use('/package', authGuard, packageRoutes);
router.use('/course', courseRoutes);
router.use('/icons', authGuard, iconsRoute);
module.exports = router;
