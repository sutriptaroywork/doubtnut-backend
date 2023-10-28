const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const studentCtrl = require('./student.controller');
const studentVerificationBypassHandler = require('../../../middlewares/bypassReverify'); 

const router = express.Router();

// router.route('/get-profile/:student_id').get(validate(paramValidation.student.getProfile), authGuard, studentCtrl.getProfile)
router.route('/update-profile').post(authGuard, validate(paramValidation.student.updateProfile), studentCtrl.updateProfile);
// router.route('/logout').get(authGuard, validate(paramValidation.student.logout), studentCtrl.logout)
// router.route('/add-public-user-web').post(validate(paramValidation.student.addPublicUserWeb), studentCtrl.addPublicUserWeb)
// router.route('/update-gcm').post(validate(paramValidation.student.updateGcm), authGuard, studentCtrl.updateGcm)
// router.route('/set-language').post(validate(paramValidation.student.setLanguage), authGuard, studentCtrl.setLanguage)
// router.route('/set-class').post(validate(paramValidation.student.setClass),  authGuard, studentCtrl.setClass)
// router.route('/browse').post(validate(paramValidation.student.browse),  authGuard, studentCtrl.browse)
router.route('/login').post(validate(paramValidation.student.login), studentCtrl.login);
router.route('/verify').post(validate(paramValidation.student.verify), studentVerificationBypassHandler, studentCtrl.verify);
// router.route('/check-username').post(validate(paramValidation.student.username_check), authGuard, studentCtrl.checkUsername)
// router.route('/recreate-token/:student_id').get(validate(paramValidation.student.recreated_token), studentCtrl.tokenRecreate)

router.route('/add-referred-user').post(validate(paramValidation.student.addReferredUser), authGuard, studentCtrl.addReferredUser);
// router.route('/get-invitees').get(validate(paramValidation.student.getReferredUsers), authGuard, studentCtrl.getReferredUsers)
router.route('/add-public-user-whatsapp').post(validate(paramValidation.student.addPublicUserWhatsapp), studentCtrl.addPublicUserWhatsapp);

router.route('/truecaller-login').post(validate(paramValidation.student.truecallerLogin), studentCtrl.truecallerLogin);
router.route('/whatsapp-login').post(validate(paramValidation.student.whatsappLogin), studentCtrl.whatsappLogin);
router.route('/new-invite').get(authGuard, studentCtrl.newInvite);
router.route('/how-it-works').get(authGuard, studentCtrl.howItWorks);
router.route('/get-student-onboarding').get(authGuard, studentCtrl.getStudentOnboarding);
router.route('/post-student-onboarding').post(authGuard, studentCtrl.postStudentOnboarding);
router.route('/add-public-user-app').post(validate(paramValidation.student.addPublicUserApp), studentCtrl.addPublicUserApp);

module.exports = router;
