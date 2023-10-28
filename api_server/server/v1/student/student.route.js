const express = require('express');
const moment = require('moment');
const validate = require('express-validation');
const multer = require('multer');
const multers3 = require('multer-s3');
const { S3 } = require('aws-sdk');
const passport = require('passport');
const authGuard = require('../../../middlewares/auth');
const studentCtrl = require('./student.controller');
const paramValidation = require('./routeValidation');
const file = require('../../../data/bounty');
const config = require('../../../config/config');
const studentMarksheet = require('./student.marksheet.controller');
// const Auth = require('../../../middlewares/userAuth');

const s3 = new S3({
    region: 'ap-south-1',
    signatureVersion: 'v4',
});

const router = express.Router();

const upload = multer({
    limits: { fileSize: file.file_size * 1024 * 1024 },
    storage: multers3({
        s3,
        bucket: config.aws_bucket_bounty_video,
        metadata: (req, file1, cb) => {
            cb(null, { fieldName: file1.fieldname });
        },
        key: (req, file2, cb) => {
            console.log('req');
            const fileName = `upload_${moment().unix()}.${file2.mimetype}`;
            const prefix = 'students-marksheet/';
            cb(null, prefix + fileName);
        },
    }),
});

router.route('/add-public-user-web').post(validate(paramValidation.student.addPublicUserWeb), studentCtrl.addPublicUserWeb);
router.route('/update-gcm').post(validate(authGuard, paramValidation.student.updateGcm), studentCtrl.updateGcm);
router.route('/add-gcm').post(validate(paramValidation.student.addGcm), studentCtrl.addGcm);
router.route('/save-email').post(validate(paramValidation.student.saveEmail), studentCtrl.saveEmail);
router.route('/:student_id/profile').get(authGuard, studentCtrl.getProfile);
router.route('/:student_id/profile').post(authGuard, studentCtrl.setProfile);
router.route('/get-ask-history/:student_id').get(validate(paramValidation.student.getAskHistory), studentCtrl.getAskHistory);
router.route('/get-student-onboarding').get(authGuard, studentCtrl.getStudentOnboarding);
router.route('/post-student-onboarding').post(authGuard, studentCtrl.postStudentOnboarding);
router.route('/get-onboarding-status').get(authGuard, studentCtrl.getOnboardingStatus);
router.route('/upload-marksheet').post(
    upload.fields([{ name: 'marksheet', maxCount: 1 }, { name: 'hash' }]),
    studentMarksheet.uploadMarkSheet,
);
router.route('/check-if-marksheet-uploaded').post(studentMarksheet.checkIfUploaded);
router.route('/get-login-timer').get(studentCtrl.getLoginTimer);
router.route('/get-class-language').get(authGuard, studentCtrl.getClassLanguage);
router.route('/sent-in-app-notification').post(validate(paramValidation.student.liveClassNotification), studentCtrl.liveClassNotification);
router.route('/add-to-gupshup/:phone').get(studentCtrl.addUserToGupShup);
router.route('/auto-play-value').post(validate(paramValidation.student.autoPlayData), authGuard, studentCtrl.autoPlayData);
router.route('/store-on-board-language').post(validate(paramValidation.student.storeOnBoardLanguage), studentCtrl.storeOnBoardLanguage);
router.route('/store-pin').post(validate(paramValidation.student.storePin), authGuard, studentCtrl.storePin);
router.route('/get-otp-delivery-details/:mobile_no').get(validate(paramValidation.student.getOtpDeliveryDetails), authGuard, studentCtrl.getOtpDeliveryDetails);
router.route('/store-otp-delivery-details').get(studentCtrl.storeOtpDeliveryDetails);
router.route('/auth-google').get((req, res, next) => { passport.authenticate('google', { scope: ['profile', 'email'], session: false, state: JSON.stringify(req.query) })(req, res, next); });
router.route('/auth-google-callback').get(passport.authenticate('google', { failureRedirect: '/account', session: false }), studentCtrl.verifySocialOAuth);
router.route('/auth-facebook').get((req, res, next) => { passport.authenticate('facebook', { scope: ['email'], session: false, state: JSON.stringify(req.query) })(req, res, next); });
router.route('/auth-facebook-callback').get(passport.authenticate('facebook', { failureRedirect: '/account', session: false }), studentCtrl.verifySocialOAuth);
router.route('/login-with-pin').post(validate(paramValidation.student.loginWithPin), studentCtrl.loginWithPin);
router.route('/check-survey-by-user').get(authGuard, studentCtrl.checkSurveyByUser);
router.route('/get-survey-details/:surveyId').get(validate(paramValidation.student.getSurveyDetails), authGuard, studentCtrl.getSurveyDetails);
router.route('/store-survey-feedback').put(validate(paramValidation.student.storeSurveyFeedback), authGuard, studentCtrl.storeSurveyFeedback);
router.route('/ncert-last-watched-details').put(validate(paramValidation.student.ncertLastWatchedDetails), authGuard, studentCtrl.ncertLastWatchedDetails);
router.route('/get-doubt-feed-details').post(validate(paramValidation.student.doubtnutFeedParams), authGuard, studentCtrl.getDoubtFeedDetails);
router.route('/get-doubt-feed-progress').post(validate(paramValidation.student.doubtFeedProgress), authGuard, studentCtrl.getDoubtFeedProgress);
router.route('/submit-doubt-completion').put(validate(paramValidation.student.doubtCompletion), authGuard, studentCtrl.submitDoubtCompletion);
router.route('/get-doubt-feed-status').get(authGuard, studentCtrl.getDoubtFeedStatus);
router.route('/get-notices/:type?').get(validate(paramValidation.student.noticeBoard), authGuard, studentCtrl.getAllNotice);
router.route('/get-doubtfeed-video-banner').post(validate(paramValidation.student.doubtfeedVideoBanner), authGuard, studentCtrl.doubtfeedVideoBanner);

router.route('/get-board-result-testimonials').get(studentCtrl.getBoardResultTestimonials);
router.route('/refer-and-earn-faq').get(authGuard, studentCtrl.getReferralFaq);
router.route('/refer-and-earn').get(authGuard, studentCtrl.referAndEarn);
router.route('/storing-referrer-id').post(validate(paramValidation.student.storingReferrerId), authGuard, studentCtrl.storingReferrerId);

module.exports = router;
