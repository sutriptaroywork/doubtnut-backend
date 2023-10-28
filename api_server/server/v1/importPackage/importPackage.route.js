const express = require("express");
const passport = require("passport");
const importPackageCtrl = require("./importPackage.controller");

const router = express.Router();
router.route("/get-import-package-data").post(importPackageCtrl.getImportPackage);
// router.route("/get-import-variant-data").post(importPackageCtrl.getImportVariant);
module.exports = router;
