const express = require('express');
const validate = require('express-validation');
const authGuard = require('../../../middlewares/auth');

const router = express.Router();
// const compression = require('compression');

const questionCtrl = require('./question.controller');
const paramValidation = require('./routeValidation');

router.route('/ask').post(validate(paramValidation.question.ask), authGuard, (req, _res, next) => {
    req._routeBlacklists.body = ['question_image'];
    next();
}, questionCtrl.ask);
router.route('/advance-search-facets').post(validate(paramValidation.question.advanceSearchFacets), authGuard, questionCtrl.advanceSearchFacets);

module.exports = router;
