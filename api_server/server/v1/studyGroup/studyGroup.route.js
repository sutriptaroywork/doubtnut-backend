const express = require('express');
const validate = require('express-validation');
const routeValidation = require('./routeValidation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
const studyGroupController = require('./studyGroup.controller');

router.route('/create')
    .post(authGuard, validate(routeValidation.createGroup.post), studyGroupController.create)
    .get(authGuard, studyGroupController.canCreateGroup);
router.route('/list-groups').get(authGuard, studyGroupController.listGroups);
router.route('/leave').post(authGuard, validate(routeValidation.leaveGroup.post), studyGroupController.leaveGroup);
router.route('/block').post(authGuard, validate(routeValidation.block.post), studyGroupController.blockFromGroup);
router.route('/update-group-info').post(authGuard, validate(routeValidation.updateGroupInfo.post), studyGroupController.updateGroupInfo);
router.route('/group-info').post(authGuard, validate(routeValidation.groupInfo.post), studyGroupController.groupInfo);
router.route('/invite').post(authGuard, validate(routeValidation.invite.post), studyGroupController.invite);
router.route('/accept').post(authGuard, validate(routeValidation.accept.post), studyGroupController.accept);
router.route('/invitation-status').post(authGuard, validate(routeValidation.invitationStatus.post), studyGroupController.invitationStatus);
router.route('/signed-upload-url').get(authGuard, studyGroupController.getSignedURL);
router.route('/mute').post(authGuard, validate(routeValidation.mute.post), studyGroupController.mute);
router.route('/update-group-details').post(authGuard, validate(routeValidation.updateGroupCache.post), studyGroupController.updateGroupCache);

module.exports = router;
