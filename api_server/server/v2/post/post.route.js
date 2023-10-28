"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const postCtrl = require('./post.controller');
const authGuard = require('../../../middlewares/auth');
const multer  = require('multer');
const router = express.Router();
const path = require('path')
const publicPath = path.join(__dirname, '..','..','..', 'public')
////console.log(publicPath);
const upload = multer({ dest: publicPath + "/uploads/"});
var limits = {
  files: 1, // allow only 1 file per request
  fileSize: 1024 * 1024 * 25, // 1 MB (max file size)
};


/**
 * @swagger
 *
 * /v1/post/add:
 *   post:
 *     description: POST ADD (UGC Insert Api) -- V1
 *     tags:
 *       - V1
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       -  in: formData
 *          name: image
 *          type: file
 *          description: The Image file to upload.
 *       -  in: formData
 *          name: audio
 *          type: file
 *          description: The Audio file to upload.
 *       -  in: formData
 *          name: video
 *          type: file
 *          description: The Video file to upload.
 *       -  in: formData
 *          name: text
 *          type: string
 *          description: Inserted Text.
 *       -  in: formData
 *          name: url
 *          type: string
 *          format: url
 *          description: Inserted Url.
 *       -  in: formData
 *          name: type
 *          type: string
 *          enum: [Tips&Trick,Meme,JustAThought,BrainTwister,DuelAFriend]
 *          description: Type Of UGC Post.
 *       -  in: body
 *          name: body
 *          type: array
 *          description: Data Inserted By User.
 *          schema:
 *             $ref: '#/definitions/postAdd'
 *       -  in: body
 *          name: user
 *          type: array
 *          description: Currently Logged in Data Of User.
 *          schema:
 *             $ref: '#/definitions/user'
 *     responses:
 *       200:
 *         description: Successful add
 *         schema:
 *           $ref: '#/definitions/post'
 *
 *
 */

var uploadFields = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 },{ name: 'video', maxCount: 1 }])

router.route('/add').post( uploadFields,authGuard, postCtrl.add)
//router.route('/:postId/delete').get(authGuard,postCtrl.deletePost)

module.exports = router;

