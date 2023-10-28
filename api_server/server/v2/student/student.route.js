const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');
const paramValidation = require('./routeValidation');
const studentCtrl = require('./student.controller');
const studentCtrlNew = require('./student.controller.new');
const sendResponse = require('../../../middlewares/sendResponse');

const router = express.Router();

router.route('/get-profile/:student_id').get(validate(paramValidation.student.getProfile), authGuard, studentCtrl.getProfile);
router.route('/update-profile').post(authGuard, validate(paramValidation.student.updateProfile), studentCtrl.updateProfile);
// router.route('/logout').get(authGuard, validate(paramValidation.student.logout), studentCtrl.logout)
router.route('/add-public-user-web').post(validate(paramValidation.student.addPublicUserWeb), studentCtrl.addPublicUserWeb);
router.route('/update-gcm').post(validate(paramValidation.student.updateGcm), authGuard, studentCtrl.updateGcm);
router.route('/set-language').post(validate(paramValidation.student.setLanguage), authGuard, studentCtrl.setLanguage);
router.route('/set-class').post(validate(paramValidation.student.setClass), authGuard, studentCtrl.setClass);
router.route('/browse').post(validate(paramValidation.student.browse), authGuard, studentCtrl.browse);
router.route('/login').post(validate(paramValidation.student.login), studentCtrl.login);
router.route('/verify').post(validate(paramValidation.student.verify), studentCtrl.verify);
router.route('/check-username').post(validate(paramValidation.student.username_check), authGuard, studentCtrl.checkUsername);
router.route('/recreate-token/:student_id').get(validate(paramValidation.student.recreated_token), studentCtrlNew.tokenRecreate, sendResponse);
router.route('/add-gcm').post(validate(paramValidation.student.addGcm), studentCtrl.addGcm);
router.route('/add-referred-user').post(validate(paramValidation.student.addReferredUser), authGuard, studentCtrl.addReferredUser);
router.route('/get-invitees').get(validate(paramValidation.student.getReferredUsers), authGuard, studentCtrl.getReferredUsers);
router.route('/truecaller-login').post(validate(paramValidation.student.truecallerLogin), studentCtrl.truecallerLogin);
router.route('/whatsapp-login').post(validate(paramValidation.student.whatsappLogin), studentCtrl.whatsappLogin);
router.route('/onboard').post(validate(paramValidation.student.onboard), studentCtrl.onboard);
router.route('/whatsapp-login-one').post(validate(paramValidation.student.whatsappLoginOne), studentCtrl.handleWhatsappSigninResponse2);
router.route('/whatsapp-login-three').post(validate(paramValidation.student.whatsappLoginOne), studentCtrl.handleWhatsappSigninResponse);
router.route('/whatsapp-login-two').post(validate(paramValidation.student.whatsappLoginTwo), studentCtrl.handleWhatsappSiginDeeplink);
router.route('/store-contact').post(validate(paramValidation.student.storeContacts), authGuard, studentCtrl.storeContacts);
router.route('/store-appdata').post(validate(paramValidation.student.storeAppData), authGuard, studentCtrl.storeAppData);
router.route('/pre-login-onboard').post(validate(paramValidation.student.preLoginOnboarding), studentCtrl.preLoginOnboarding);
router.route('/login-with-firebase').post(validate(paramValidation.student.firebaseLogin), studentCtrl.firebaseLogin);
router.route('/update-social-auth-verified-users').post(authGuard, studentCtrl.socialAuthLoggedInUsers);
router.route('/get-student-onboarding').get(authGuard, studentCtrl.getStudentOnboarding);
router.route('/post-student-onboarding').post(authGuard, studentCtrl.postStudentOnboarding);
router.route('/get-onboarding-status').get(authGuard, studentCtrl.getOnboardingStatus);
router.route('/facebook-delete').post(studentCtrl.facebookDataDelete);
router.route('/facebook-delete-status').get(studentCtrl.facebookDataDeleteStatus);

// new controller
router.route('/:student_id/profile').get(authGuard, studentCtrlNew.getProfile);
router.route('/:student_id/profile').post(authGuard, studentCtrlNew.setProfile);

module.exports = router;
