const express = require('express');
const validate = require('express-validation');

const router = express.Router();
const multer = require('multer');
const multers3 = require('multer-s3');
const path = require('path');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const routeValidation = require('./routeValidation');
const teacherAuthGuard = require('../../../middlewares/teacherAuth');
const studentAuthGuard = require('../../../middlewares/auth');
const teacherController = require('./teacher.controller');
const s3 = require('../../../config/aws').s3();
const authGuard = require('../../../middlewares/auth');

const upload = multer({
    // limits: { fileSize: 2000 * 1024 * 1024 },
    storage: multers3({
        s3,
        bucket: 'doubtnut-static',
        contentType(req, file, cb) {
            cb(null, file.mimetype);
        },
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const fileName = `${uuidv4()}${ext}`;
            const prefix = `teachers/${req.body.resource_type}/${moment().unix().toString()}`;
            cb(null, `${prefix}${fileName}`);
        },
        // metadata(req, file, cb) {
        //     cb(null, { fieldName: file.fieldname });
        // },
        // key(req, file, cb) {
        //     cb(null, Date.now().toString());
        // },
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'video/mp4' || file.mimetype === 'application/pdf' || file.mimetype === 'multipart/form-data') {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    },
});
router.route('/onboard-data/login').get(validate(routeValidation.onboardLogin), teacherController.onboardData);
router.route('/login').post(validate(routeValidation.login), teacherController.login);
router.route('/verify').post(validate(routeValidation.verify), teacherController.verify);
router.route('/update').post(teacherAuthGuard, teacherController.update);
router.route('/get-meta').get(teacherAuthGuard, teacherController.getMeta);
router.route('/payment-details').get(teacherAuthGuard, teacherController.getPaymentDetails);
router.route('/set-default-payment').post(teacherAuthGuard, teacherController.setDefaultPayment);
router.route('/profile').get(teacherAuthGuard, teacherController.getProfile);
router.route('/upload').post(teacherAuthGuard, upload.fields([{ name: 'resource', maxCount: 1 }]), teacherController.upload);
router.route('/profile-signed-url').get(teacherAuthGuard, teacherController.getProfileSignedUrl);
router.route('/upload-resource-details').get(teacherAuthGuard, teacherController.resourceDetails);
router.route('/add-resource').post(teacherAuthGuard, teacherController.addResource);
router.route('/upload-signed-url').get(teacherAuthGuard, teacherController.getResourceUploadSignedUrl);
router.route('/resource-uploaded').get(teacherAuthGuard, teacherController.resourceUploaded);
router.route('/home').get(teacherAuthGuard, teacherController.home);
router.route('/subscribe').post(validate(routeValidation.subscribe), studentAuthGuard, teacherController.subscribe);
router.route('/channel').get(studentAuthGuard, teacherController.channelPage);
router.route('/profile-student').get(authGuard, teacherController.getProfile);
router.route('/view-all-by').get(teacherAuthGuard, teacherController.viewAll);
router.route('/hamburger').get(teacherAuthGuard, teacherController.hamburger);
router.route('/leaderboard-home').get(teacherAuthGuard, teacherController.leaderboardHome);
router.route('/leaderboard').get(teacherAuthGuard, teacherController.leaderboard);
router.route('/get-resource-by-id').get(teacherAuthGuard, teacherController.getResourceByID);
router.route('/edit-resource').post(teacherAuthGuard, teacherController.editResource);
router.route('/get-teachers-tab').get(studentAuthGuard, teacherController.getTeachersTab);

module.exports = router;
