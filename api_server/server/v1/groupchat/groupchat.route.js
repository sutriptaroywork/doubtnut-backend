/**
 * @Author: xesloohc
 * @Date:   2019-05-06T15:04:29+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-07-19T14:03:28+05:30
 */



const express = require('express');
const validate = require('express-validation');
const groupChatCtrl = require('./groupchat.controller');
const authGuard = require('../../../middlewares/auth');
const router = express.Router();

const compression = require('compression')
const multer  = require('multer')
const path = require('path')

const publicPath = path.join(__dirname, '..','..','..', 'public')

const upload = multer({ dest: publicPath + "/uploads/"})

var limits = {

  files: 1, // allow only 1 file per request

  fileSize: 1024 * 1024 * 25 *10, // 1 MB (max file size)

};

var uploadFields = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }])

router.route('/addmessage').post(uploadFields,authGuard,groupChatCtrl.addMessage);

router.route('/get').get(authGuard,groupChatCtrl.getGroups)
router.route('/:id/messages').get(authGuard,groupChatCtrl.getMessagesByGroupId)
router.route('/stats').get(groupChatCtrl.getStats)
module.exports = router;
