const express = require('express');
const authGuard = require('../../../middlewares/auth');
const socialStudentCtrl = require('./socialstudent.controller');

const router = express.Router();


router.route('/:userId/report').post(authGuard, socialStudentCtrl.reportUser);
router.route('/:userId/report_status').get(authGuard, socialStudentCtrl.reportStatus);
router.route('/:userId/following').get(authGuard, socialStudentCtrl.userFollowings);
router.route('/:userId/followers').get(authGuard, socialStudentCtrl.userFollowers);
router.route('/:userId/remove_follower').get(authGuard, socialStudentCtrl.removeFollower);
router.route('/:userId/allFollowing').get(authGuard, socialStudentCtrl.getAllFollowing);
router.route('/:userId/banUser').get(authGuard, socialStudentCtrl.banUser);
router.route('/reportedUsers').get(authGuard, socialStudentCtrl.reportedUsers);
router.route('/:userId/reviewed').put(authGuard, socialStudentCtrl.reviewedUser);
router.route('/reviewedUsers').get(authGuard, socialStudentCtrl.getReviewedUsers);
router.route('/reviewedUsersByModerator').get(authGuard, socialStudentCtrl.getReviewedUsersByModerator);
router.route('/reportedUserCount/:id').get(authGuard, socialStudentCtrl.reportedUserCount);
router.route('/reviewedStatus/:id').get(authGuard, socialStudentCtrl.reviewedStatus);
router.route('/most_popular_students').get(authGuard, socialStudentCtrl.mostPopularStudents);
module.exports = router;
