const express = require('express');
const webBookController = require('./web_library.controller');

const router = express.Router();

router.route('/get-web-book-list').get(webBookController.getBookList);
router.route('/get-web-book-data').get(webBookController.getBookData);
router.route('/get-web-book-chapter-data').get(webBookController.getBookChapterData);
router.route('/get-web-book-chapter-exercise-data').get(webBookController.getBookChapterExerciseData);

module.exports = router;
