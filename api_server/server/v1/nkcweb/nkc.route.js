const express = require('express');
const nkcController = require('./nkc.controller');

const router = express.Router();

router.route('/details').get(nkcController.getDetails);
router.route('/set-details').post(nkcController.setDetails);
router.route('/proof-signed-url').get(nkcController.getNKCSignedUrl);
router.route('/set-old-students-proof').post(nkcController.setNKCOldStudentsData);

module.exports = router;
