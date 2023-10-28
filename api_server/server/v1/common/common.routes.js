const express = require('express');
const commonsCtrl = require('./common.controller');

const router = express.Router();
router.route('/bottom-sheet').get(commonsCtrl.bottomSheet);
router.route('/dialog').get(commonsCtrl.dialog);
router.route('/paginated-bottom-sheet-widget').get(commonsCtrl.getCourseBottomSheetHomepage);
router.route('/address-form-data').get(commonsCtrl.addressFormData);
router.route('/submit-address').post(commonsCtrl.submitAddress);
router.route('/get-inapp-popup').get(commonsCtrl.getInappPopup);

module.exports = router;
