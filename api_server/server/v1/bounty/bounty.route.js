const express = require('express');
const moment = require('moment');
const multer = require('multer');
const multers3 = require('multer-s3');
const { S3 } = require('aws-sdk');
const path = require('path');
const authGuard = require('../../../middlewares/auth');
const bountyCtrl = require('./bounty.controller');
const config = require('../../../config/config');
const videoSize = require('../../../data/bounty');
const deprecatedHandler = require('../../../middlewares/deprecatedAPIHandler');

const s3 = new S3({
    region: 'ap-south-1',
    signatureVersion: 'v4',
});

const router = express.Router();

const upload = multer({
    limits: { fileSize: videoSize.file_size * 1024 * 1024 },
    storage: multers3({
        s3,
        bucket: config.aws_bucket_bounty_video,
        contentType(req, file, cb) {
            let content_type;
            if (req.body.entity_type == 'image') {
                content_type = 'image/png';
            } else if (req.body.entity_type == 'video') {
                content_type = 'video/mp4';
            }
            cb(null, content_type);
        },

        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },

        key: (req, file, cb) => {
            console.log('req');
            const ext = path.extname(file.originalname);
            const fileName = `upload_${moment().unix()}${ext}`;
            const prefix = `bounty-answers/${moment().format('YYYY/MM/DD/')}`;
            cb(null, prefix + fileName);
        },
    }),
});

router.route('/prepostpopup').get(deprecatedHandler);
router.route('/viewQuestionByBountyId').get(deprecatedHandler);
router.route('/uploadingvid').get(deprecatedHandler);
router.route('/checkIfUploaded').post(deprecatedHandler);
router.route('/deletePost').post(deprecatedHandler);
router.route('/reupload').get(deprecatedHandler);

router.route('/faqpopup').get(bountyCtrl.faqPopUp);
router.route('/bountypost').post(authGuard, bountyCtrl.bountyPostPage);
router.route('/getChapters').post(bountyCtrl.getChapters);
router.route('/allBountyListingPage').post(authGuard, bountyCtrl.allBountyListingPage);
router.route('/myQuestionsBountyList').post(authGuard, bountyCtrl.myQuestionsBountyList);
router.route('/mySolutionsBountyList').post(authGuard, bountyCtrl.mySolutionsBountyList);
router.route('/wantToSolveBountyList').post(authGuard, bountyCtrl.wantToSolveBountyList);
router.route('/viewSolutionsByQuestionId').get(bountyCtrl.viewSolutionsByQuestionId);
router.route('/addToBookMark').post(authGuard, bountyCtrl.addToBookMark);
router.route('/acceptVideoSolution').post(authGuard, bountyCtrl.acceptVideoSolution);
router.route('/bountyAnswerUpvoteCounter').post(authGuard, bountyCtrl.bountyAnswerUpvoteCounter);
router.route('/postQuestionPopup').post(authGuard, bountyCtrl.postQuestionPopup);
router.route('/reportSpam').post(authGuard, bountyCtrl.reportSpam);
router.route('/bountyFeedback').post(authGuard, bountyCtrl.bountyFeedback);

// file path for audio in comment

router.route('/uploadVideoSolution').post(authGuard,
    upload.fields([{ name: 'student_id' }, { name: 'question_id' }, { name: 'video', maxCount: 1 }]),
    bountyCtrl.uploadVideoSolution);

module.exports = router;
