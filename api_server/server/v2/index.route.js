const express = require('express');
const authGuard = require('../../middlewares/auth');
const sendResponse = require('../../middlewares/sendResponse');

const answerRoutes = require('./answer/answer.route');
const quizRoutes = require('./quiz/quiz.route');

const studentRoutes = require('./student/student.route');
const langRoutes = require('./language/language.route');
const classRoutes = require('./class/class.route');
const courseRoutes = require('./course/course.route');
const chapterRoutes = require('./chapter/chapter.route');
const commentRoutes = require('./comment/comment.route');
const settingRoutes = require('./settings/settings.route');
const libraryRoutes = require('./library/library.route');
const playlistRoutes = require('./playlist/playlist.route');
const feedRoutes = require('./feed/feed.route');
const blogRoutes = require('./blog/blog.route');
const iconsRoute = require('./icons/icons.route');
const contestRoutes = require('./contestWeb/contestWeb.route');
const newHomepage = require('./homepage/homepage.route');
const searchRoutes = require('./search/search.route');
const postRoutes = require('./post/post.route');
const deeplinkRoutes = require('./deeplink/deeplink.route');
// const askRoutes = require('./ask/ask.route');
// const asksRoutes = require('./asks/asks.route');
const feedbackRoutes = require('./feedback/feedback.route');
const gamificationRoutes = require('./gamification/gamification.route');
const questionRoutes = require('./question/question.route');
const homeRoutes = require('./home/home.route');
const NotifyRoutes = require('./notification/notification.route');
const communityRoutes = require('./community/community.route');
const brainlyRoute = require('./brainly/brainly.route');
const structuredCourseRoutes = require('./structuredcourse/structuredcourse.route');
const packageRoutes = require('./package/package.route');
const paymentRoutes = require('./payment/payment.route');
const cameraRoutes = require('./camera/camera.route');
const teslaRoutes = require('./tesla/tesla.route');
const liveclassRoutes = require('./liveclass/liveclass.route');
const kheloJeetoRoutes = require('./kheloJeeto/kheloJeeto.route');
const DailyGoalRoutes = require('./dailyGoal/dailygoal.route');
const scholarshipRoute = require('./scholarship/scholarship.route');
const htOlympiadRoute = require('./olympiad/olympiad.route');
const practiceCornerRoutes = require('./practice_corner/practiceCorner.route');
const p2pRoutes = require('./p2p/p2p.route');
// const tagsRoutes = require('./tags/tags.route');

// const userRoutes = require('./server/user/user.route');
// const authRoutes = require('./server/auth/auth.route');

const router = express.Router();

router.get('/health-check', (req, res) => res.send('OK'));

const groupChatRoute = require('./groupchat/groupchat.route');

router.use('/groupchat', groupChatRoute);

router.use('/answers', answerRoutes);
router.use('/quiz', authGuard, quizRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/student', studentRoutes);
router.use('/language', langRoutes);
router.use('/class', classRoutes);
router.use('/course', courseRoutes);
router.use('/comment', authGuard, commentRoutes);
router.use('/chapter', authGuard, chapterRoutes);
router.use('/settings', settingRoutes);
router.use('/library', authGuard, libraryRoutes);
router.use('/playlist', authGuard, playlistRoutes);
router.use('/community', authGuard, communityRoutes);
router.use('/notification', authGuard, NotifyRoutes);
router.use('/feed', feedRoutes);
router.use('/deeplink', deeplinkRoutes);
router.use('/contest-web', contestRoutes);
router.use('/blogs', blogRoutes);
router.use('/icons', iconsRoute);
router.use('/search', authGuard, searchRoutes);
router.use('/homepage', newHomepage);
router.use('/post', authGuard, postRoutes);
// router.use('/ask',askRoutes);
// router.use('/asks',asksRoutes);
router.use('/feedback', authGuard, feedbackRoutes);
router.use('/questions', questionRoutes);
// router.use('/spider',spiderRoutes);
router.use('/home', homeRoutes);
router.use('/brainly', brainlyRoute);
router.use('/structured-course', structuredCourseRoutes);
router.use('/package', packageRoutes);
router.use('/payment', paymentRoutes);
router.use('/camera', cameraRoutes);
router.use('/tesla', teslaRoutes, sendResponse);
router.use('/liveclass', liveclassRoutes);
router.use('/khelo-jeeto', kheloJeetoRoutes);
router.use('/daily-goal', DailyGoalRoutes);
router.use('/scholarship', scholarshipRoute);
router.use('/olympiad', htOlympiadRoute);
router.use('/practice-corner', practiceCornerRoutes);
router.use('/p2p', p2pRoutes);

// router.post('/test',authGuard,function(req,res){
//   //console.log(req.user)
//   res.send("test")
// });
// router.use('/tags',tagsRoutes);
module.exports = router;
