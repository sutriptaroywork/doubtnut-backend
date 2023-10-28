const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const playlistCtrl = require('./playlist.controller');
const Auth = require('../../../middlewares/userAuth');
const classAuth = require('../../../middlewares/handleDropperClass');
const authGuard = require('../../../middlewares/auth');


const router = express.Router();


router.route('/:student_id/:playlist_id/:page_no/view').get(validate(paramValidation.playlist.view),playlistCtrl.view)

router.route('/custom/:student_id/:playlist_id/view').post(validate(paramValidation.playlist.customView),playlistCtrl.customView)


router.route('/create').post(validate(paramValidation.playlist.create) ,playlistCtrl.create)

router.route('/get-list').get(playlistCtrl.listByStudentId)

router.route('/add-question').post(validate(paramValidation.playlist.addQuestion),playlistCtrl.addQuestion)

router.route('/remove-question').post(validate(paramValidation.playlist.removeQuestion),playlistCtrl.removeQuestion)

router.route('/remove').post(validate(paramValidation.playlist.remove),playlistCtrl.remove)

//get ncert class
router.route('/ncert/get-class-list').get(playlistCtrl.getNcertClassList)

//get ncert +class  chapters
router.route('/ncert/:class/get-chapter-list').get(validate(paramValidation.playlist.getNcertChapterList),playlistCtrl.getNcertChapterList)

//get ncert + class+chapter exercises
router.route('/ncert/:class/:chapter/get-exercise-list').get(validate(paramValidation.playlist.getNcertExerciseList),playlistCtrl.getNcertExerciseList)

//get custom playlist years
router.route('/:playlist_id/get-year-list').get(validate(paramValidation.playlist.getPlaylistYearList),playlistCtrl.getPlaylistYearList)

router.route('/save').post(validate(paramValidation.playlist.save),playlistCtrl.save)
router.route('/playlistWrapper').post(validate(paramValidation.playlist.addPlaylistWrapper) ,playlistCtrl.addPlaylistWrapper)
module.exports = router;
