const express = require('express');
const testCtrl = require('./test.controller');

const router = express.Router();

router.route('/read-test').get(testCtrl.read_test);
router.route('/write-test').get(testCtrl.write_test);
router.route('/null-test/:time/:threshold').get(testCtrl.null_test);
module.exports = router;
