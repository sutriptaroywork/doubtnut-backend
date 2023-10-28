const express = require('express');
const moment = require('moment');
const mime = require('mime');
const crypto = require('crypto');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const questionCtrl = require('./question.controller');
const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');
const multer = require('multer')
const path = require('path')
const publicPath = path.join(__dirname, '..', '..', '..', 'public')
const responseSchemaMiddleware = require('../../../middlewares/responseModel')

var storage = multer.diskStorage({
  destination: publicPath + "/uploads/",
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(null, raw.toString('hex') + moment().unix() + '.png');
    });
  }
});
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg'  && ext !== '.jpeg') {
      return callback(new Error('Only images are allowed'))
    }
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 1024
  }
});
var uploadFields = upload.fields([{name: 'question_image', maxCount: 1}])

const router = express.Router();

router.route('/ask').post(authGuard, uploadFields, questionCtrl.ask,responseSchemaMiddleware.handleResponse);


module.exports = router;
