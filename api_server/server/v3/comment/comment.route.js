"use strict";
const express = require('express');
const validate = require('express-validation');
// const paramValidation = require('../param-validation');
const commentCtrl = require('./comment.controller');
//const Auth = require('../../../middlewares/userAuth');
const authGuard = require('../../../middlewares/auth');


const router = express.Router();
router.route('/get-list-by-entity/:entity_type/:entity_id').get(commentCtrl.getListByEntity);
// router.route('/get-by-parent/:parent_id').get(commentCtrl.getByParent);
router.route('/add').post(commentCtrl.add);
// router.route('/remove').post(commentCtrl.remove);
// router.route('/report').post(commentCtrl.report);
// router.route('/like').post(commentCtrl.like);
module.exports = router;
