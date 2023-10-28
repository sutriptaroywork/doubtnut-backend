"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const chapterCtrl = require('./chapter.controller');
const Auth = require('../../../middlewares/userAuth');
const classAuth = require('../../../middlewares/handleDropperClass');
const authGuard = require('../../../middlewares/auth');


const router = express.Router();

router.route('/:student_class/:student_course/get-list').get(validate(paramValidation.chapter.chapterlist), chapterCtrl.chapterList)
router.route('/:student_class/:student_course/get-list-with-class').get(validate(paramValidation.chapter.chapterlist), chapterCtrl.chapterListWithClass)
router.route('/:student_class/:student_course/:student_chapter/get-details').get(validate(paramValidation.chapter.chapterdetails),  chapterCtrl.chapterDetails)
router.route('/:student_class/:student_course/:student_chapter/:subtopic/get-details').get(validate(paramValidation.chapter.chapterdetails),  chapterCtrl.subtopicDetails)

module.exports = router;
