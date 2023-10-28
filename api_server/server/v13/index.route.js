const express = require('express');

const answerRoutes = require('./answer/answer.route');

const router = express.Router();

router.use('/answers', answerRoutes);
module.exports = router;
