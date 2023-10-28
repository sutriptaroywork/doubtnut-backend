const express = require('express');
const assgnCtrl = require('./assignment.controller');


const router = express.Router();


router.route('/get-book-name').post(assgnCtrl.getBookName);


module.exports = router;
