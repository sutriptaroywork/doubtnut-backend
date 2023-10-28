"use strict";
const Student = require('../../../modules/student')
let db, config, client
const moment = require('moment');

async function read_test(req,res,next){
  try
  {
    db = req.app.get('db');
    let result= await Student.read_test(db.mysql.read);
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },

      "data": result
    }
    res.status(responseData.meta.code).json(responseData);
  }
  catch(e){
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error"
      },

      "data": null
    }
    res.status(responseData.meta.code).json(responseData);
  }


}

async function write_test(req,res,next){
  try{
    db = req.app.get('db');
    let data;
    let time=moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let result=await Student.write_test(time,db.mysql.write);
    if(result){
      let previousTimestmap;

      setTimeout(async ()=>{
        previousTimestmap=await Student.read_test(db.mysql.read);
        //console.log("Current timestamp = ");
        //console.log(time);
        //console.log("Previous Timestamp = ");
        let previousTime=moment(previousTimestmap[0].timestamp).format('YYYY-MM-DD HH:mm:ss')
        //console.log(previousTime);
        if(previousTime==time){
            data="Both timestamp matched"
            let responseData = {
            "meta": {
            "code": 200,
            "success": true,
            "message": "Success"
            },

            "data": "Timestamp Updated and "+data
          }
          res.status(responseData.meta.code).json(responseData);
        }
        else{
          data="Both timestamp not matched"
          let responseData = {
              "meta": {
              "code": 200,
              "success": true,
              "message": "Success"
            },

            "data": "Timestamp Updated and "+data
          }
          res.status(responseData.meta.code).json(responseData);
        }
      },3000);

    }
    else
    {
      let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "FAILURE"
      },

      "data": "Timestamp not Updated"
    }
    res.status(responseData.meta.code).json(responseData);
    }

  }
  catch(e){
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error"
      },

      "data": e
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

async function null_test(req, res, next) {
    try {
        db = req.app.get('db');
        const { time } = req.params;
        const { threshold } = req.params;
        const offset = 330 - (parseInt(time) + 5);
        const date = moment().utcOffset(offset).format('YYYY-MM-DD HH:mm:ss');
        const date1 = moment().utcOffset(325).format('YYYY-MM-DD HH:mm:ss');
        console.log(time);
        console.log(threshold);
        console.log(date);
        console.log(date1);
        const result = await Student.null_test(date, date1, db.mysql.read);
        console.log(result)
        if (result[0].count > parseInt(threshold)) {
            const responseData = {
                meta: {
                    code: 403,
                    message: 'FAILURE',
                },
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e)
        const responseData = {
            meta: {
                code: 403,
                message: 'FAILURE',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = { read_test, write_test, null_test }
