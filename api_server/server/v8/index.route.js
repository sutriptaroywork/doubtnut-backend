
const express = require('express');

// const contestRoutes = require('./contest/contest.route');
const authGuard = require('../../middlewares/auth');
const answerRoutes = require('./answer/answer.route');
const formulasRoute = require('./formulas/formulas.route');
const testseriesRoutes = require('./testseries/testseries.route');
const feedRoutes = require('./feed/feed.route');

// const studentRoutes = require('./student/student.route');
// const langRoutes = require('./language/language.route');
// const classRoutes = require('./class/class.route');
// const courseRoutes = require('./course/course.route');
// const chapterRoutes = require('./chapter/chapter.route');
// const settingRoutes = require('./settings/settings.route');
const libraryRoutes = require('./library/library.route');
// const playlistRoutes = require('./playlist/playlist.route');
// const commentRoutes = require('./comment/comment.route');
// const feedRoutes = require('./feed/feed.route');


// const askRoutes = require('./ask/ask.route');
// const asksRoutes = require('./asks/asks.route');
// const feedbackRoutes = require('./feedback/feedback.route');

const questionRoutes = require('./question/question.route');
// const homeRoutes = require('./home/home.route');

// const NotifyRoutes = require('./notification/notification.route');
// const communityRoutes = require('./community/community.route');

// const tagsRoutes = require('./tags/tags.route');

// const userRoutes = require('./server/user/user.route');
// const authRoutes = require('./server/auth/auth.route');


const router = express.Router();


// router.get('/health-check', (req, res) =>
//   res.send('OK')
// );


router.use('/formulas', formulasRoute);
router.use('/testseries', testseriesRoutes);
router.use('/feed', feedRoutes);
router.use('/answers', answerRoutes);

// router.use('/quiz',authGuard, quizRoutes);
// router.use('/student', studentRoutes);
// router.use('/language',langRoutes);
// router.use('/class',classRoutes);
// router.use('/course',courseRoutes);
// router.use('/chapter',authGuard,chapterRoutes);
// router.use('/settings',settingRoutes);
router.use('/library', authGuard, libraryRoutes);
// router.use('/playlist',authGuard,playlistRoutes);
// router.use('/community',authGuard,communityRoutes);
// router.use('/notification',authGuard, NotifyRoutes);
// router.use('/feed',feedRoutes);
// router.use('/comment',authGuard,commentRoutes);
// router.use('/ask',askRoutes);
// router.use('/asks',asksRoutes);
// router.use('/feedback',authGuard,feedbackRoutes);
router.use('/questions', questionRoutes);
// router.use('/spider',spiderRoutes);
// router.use('/home',homeRoutes);
// router.use('/contest',authGuard,contestRoutes);
// router.use('/answers',authGuard,answerRoutes);
// router.use('/questions',questionRoutes);
// router.use('/spider',spiderRoutes);
// router.use('/home',homeRoutes);
// router.post('/test',authGuard,function(req,res){
//   //console.log(req.user)
//   res.send("test")
// });
// router.use('/tags',tagsRoutes);
module.exports = router;
