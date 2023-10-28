const express = require('express');
const validate = require('express-validation');
const formulasCtrl = require('./formulas.controller');
const authGuard = require('../../../middlewares/auth');
const router = express.Router();

const compression = require('compression')

router.route('/home').get(formulasCtrl.home)
router.route('/subject/:subjectId/chapters').get(formulasCtrl.chapters)
router.route('/chapter/:chapterId/formulas').get(compression(),formulasCtrl.formulas)

router.route('/cheatsheets').get(authGuard,formulasCtrl.getCheatsheets)
router.route('/cheatsheet/create').post(authGuard,formulasCtrl.createCheatsheet)
router.route('/cheatsheet/get/:id').get(compression(),formulasCtrl.getCheatSheetById)
router.route('/cheatsheet/add').post(authGuard,formulasCtrl.customCheatSheetAdd)

// router.route('/cheatsheets/create').post(formulasCtrl.createCheatsheet)
// router.route('/cheatsheets/:cheatsheetId/addformulas').post(formulasCtrl.addformulas)

router.route('/search/:name').get(formulasCtrl.globalSearchResult)
router.route('/searchpage/:type/:id').get(compression(),formulasCtrl.searchPageFormulas)

//router.route('/searchformula/?topic=string&chapter=string&formula=string').get(formulasCtrl.searchResultPage)
module.exports = router;

