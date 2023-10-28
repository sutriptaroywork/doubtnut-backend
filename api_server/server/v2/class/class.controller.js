"use strict";
const Class = require('../../../modules/class')
const utility = require('../../../modules/utility')
let db;


function getList(req, res, next) {

  db = req.app.get('db');
  let responseData
  Class.getList(db.mysql.read).then(function (values) {

    // values.push({class: "13"})
    responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS",
      },
      "data": values
    }
    res.status(responseData.meta.code).json(responseData)
  }).catch(function (error) {
    //console.log(error)
    next(error)

    // responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong",
    //   },
    //   "data": null,
    //   "error": error
    // }
    // res.status(responseData.meta.code).json(responseData)
  });
}


module.exports = {getList}
