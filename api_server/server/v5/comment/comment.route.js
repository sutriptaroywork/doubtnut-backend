"use strict";
const express = require('express');
const validate = require('express-validation');
// const paramValidation = require('../param-validation');
const commentCtrl = require('./comment.controller');
//const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');
//for audio in comment
const multer  = require('multer')

const router = express.Router();
//file path for audio in comment
const path = require('path')
const publicPath = path.join(__dirname, '..','..','..', 'public')
//console.log(publicPath);
const upload = multer({ dest: publicPath + "/uploads/"})
var limits = {
  files: 1, // allow only 1 file per request
  fileSize: 1024 * 1024 * 25 *10, // 1 MB (max file size)
};
var uploadFields = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }])
// router.route('/get-list-by-entity/:entity_type/:entity_id').get(commentCtrl.getListByEntity);
// router.route('/get-by-parent/:parent_id').get(commentCtrl.getByParent);
router.route('/add').post(uploadFields,commentCtrl.add);
// router.route('/remove').post(commentCtrl.remove);
// router.route('/report').post(commentCtrl.report);
// router.route('/like').post(commentCtrl.like);
module.exports = router;
