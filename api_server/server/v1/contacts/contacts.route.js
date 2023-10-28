const express = require('express');
const authGuard = require('../../../middlewares/auth');
const contactsController = require('./contacts.controller');

const router = express.Router();

router.route('/read').get(authGuard, contactsController.read);
router.route('/insert').post(authGuard, contactsController.insert);
router.route('/last-updated').get(authGuard, contactsController.lastUpdate);

module.exports = router;
