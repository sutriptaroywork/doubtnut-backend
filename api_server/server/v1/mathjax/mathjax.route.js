const express = require('express');
const validate = require('express-validation');
const mathJaxCtrl = require('./mathjax.controller');
const authGuard = require('../../../middlewares/auth');
const router = express.Router();

const compression = require('compression')

router.route('/:questionId/create').get(mathJaxCtrl.createHtml)


module.exports = router;

