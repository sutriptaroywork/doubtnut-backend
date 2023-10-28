"use strict";
const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');
const searchCtrl = require('./search.controller');


const router = express.Router();


router.route('/:page/:tab/:text').get(validate(paramValidation.search.search), searchCtrl.search)
router.route('/getTrendingSuggestions').get(searchCtrl.getSuggestions)
router.route('/get-custom-matches').post(validate(paramValidation.search.getCustomMatches), searchCtrl.getCustomMatches);


module.exports = router;
