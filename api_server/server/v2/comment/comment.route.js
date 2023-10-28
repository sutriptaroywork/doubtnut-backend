
const express = require('express');
// const paramValidation = require('../param-validation');
const commentCtrl = require('./comment.controller');
// const Auth = require('../../../middlewares/userAuth');


const router = express.Router();
router.route('/get-list-by-entity/:entity_type/:entity_id').get(commentCtrl.getListByEntity);
router.route('/add').post(commentCtrl.add);
router.route('/remove').post(commentCtrl.remove);
router.route('/report').post(commentCtrl.report);
router.route('/like').post(commentCtrl.like);
router.route('/mute').post(commentCtrl.mute);
router.route('/updateCommentCount').post(commentCtrl.updateCommentCount);
module.exports = router;
