const express = require('express');
// const authGuard = require('../../../middlewares/auth');
const answerRoutes = require('./answer/answer.route');
const questionRoutes= require('./question/question.route');
// const questionRoutes = require('./question/question.route');

const router = express.Router();


router.use('/answers', answerRoutes);
router.use('/questions',questionRoutes);

module.exports = router;
