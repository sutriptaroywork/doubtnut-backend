const express = require('express');
const passport = require('passport');
const trailCtrl = require('./trail.controller');

const router = express.Router();


router.route('/get-students-trail').get(trailCtrl.getStudents);
router.route('/get-package-question').get(trailCtrl.getPackageQuestion);

module.exports = router;
