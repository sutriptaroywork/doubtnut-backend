"use strict";
const _ = require('lodash')
const ClassContainer = require('../../../modules/containers/class')
const LanguageContainer =require('../../../modules/containers/language')
let db;

async function getList(req,res,next){
  try
  {
    
    db = req.app.get('db');

    let language_code=req.params.language;
    //console.log(language_code)
    if(language_code!=="" && !_.isNull(language_code) && language_code!==undefined)
    {
      let language = await LanguageContainer.getByCode(language_code,db);
      if(language.length>0){
        let result = await ClassContainer.getList(language[0]['language'],db); 
        let responseData = {
          "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS",
        },
        "data": result
        }
        res.status(responseData.meta.code).json(responseData)
      }
      else
      {
        let responseData = {
          "meta": {
          "code": 403,
          "success": false,
          "message": "No Language Found With This Code",
        },
        "data": null
        }
        res.status(responseData.meta.code).json(responseData)
      }
      
    }
    else
    {
      let responseData = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "Invalid Language Code Provided",
        },
        "data": null
      }
      res.status(responseData.meta.code).json(responseData)
    }
    
  }
  catch(e)
  {
    //console.log(e)
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData)
  }
  
}


module.exports = {getList}
