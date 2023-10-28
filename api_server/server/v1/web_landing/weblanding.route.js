const express = require('express');
const nkcController = require('./weblanding.controller');

const router = express.Router();

router.route('/details').get(nkcController.getDetails);
router.route('/set-details').post(nkcController.setDetails);
router.route('/form-details').get(nkcController.getFormDetails);
router.route('/set-form-details').post(nkcController.setFormDetails);

module.exports = router;
