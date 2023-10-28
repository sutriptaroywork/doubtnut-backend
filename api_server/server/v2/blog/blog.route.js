
"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const blogCtrl = require('./blog.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

router.route('/blog-list/:page/:category?').get(validate(paramValidation.blog.blogList), blogCtrl.getBlogs)
router.route('/single-blog/:title').get(validate(paramValidation.blog.singleBlog), blogCtrl.getSingleBlog)

module.exports = router;
