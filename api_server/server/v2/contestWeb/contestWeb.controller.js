"use strict";
const Student = require('../../../modules/student')
const ContestNew = require('../../../modules/contestNewWeb')

require('../../../modules/mongo/comment')
const bluebird = require("bluebird");
const mongoose = require("mongoose");
bluebird.promisifyAll(mongoose);
const _ = require('lodash');

let db, config, client;

async function getAllContests(req, res, next) {
  try{
    db = req.app.get('db');
    config = req.app.get('config');
    let data = {};
    let contest_list = await ContestNew.getContestsList(db.mysql.read);

    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS"
      },
      "data": contest_list
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e) {
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }
}

async function enroll(req, res, next) {
  try{
    db = req.app.get('db');
    config = req.app.get('config');
    let data = {};
    let name = req.body.name;
    let email_id = req.body.email_id;
    let contact_no = req.body.phone;
    let student_class = req.body.student_class;
    let student_exist = await Student.checkStudentExists(contact_no, db.mysql.write);
    // let student_id = student_exist[0]['student_id'];
    if(student_exist.length == 0)
    {
      let student_id = req.user.student_id;
      let params = {};
      params.student_fname = name;
      params.student_email = email_id;
      params.mobile = contact_no;
      params.student_class = student_class;
      let updateStatus = await Student.updateUserProfile(student_id, params, db.mysql.write);

      data = {
        'mobile_updated' : "updated"
      }

      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": data
      }
      res.status(responseData.meta.code).json(responseData);
    }
    else
    {
      data = {
        'mobile_updated' : "previously updated"
      }

      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": data
      }
      res.status(responseData.meta.code).json(responseData);
    }
  } catch (e) {
    next(e)

    // let responseData = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "Error from catch block"
      //   },
      //   "data": null,
      //   "error": e
      // }
      // res.status(responseData.meta.code).json(responseData);
    }
}

async function getQuestionslist(req, res, next) {
  try {
    db = req.app.get('db');
    config = req.app.get('config');
    let data = {};
    let contest_id = req.body.contest_id;
    let get_question_list = await ContestNew.getQuestionList(contest_id, db.mysql.read);
    data = {
      'q_list' : get_question_list,
      'max_q_id' : get_question_list.length
    }

    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS"
      },
      "data": data
    }
    res.status(responseData.meta.code).json(responseData);
  } catch(e) {
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }
}

async function getMaxQnoByStudentId(req, res, next) {
  try {
    db = req.app.get('db');
    config = req.app.get('config');
    let data = {};
    let contest_id = req.body.contest_id;
    let student_id = req.user.student_id;
    let maxQno = await ContestNew.getMaxQno(student_id, contest_id, db.mysql.read);
    data = {
      'max_qno' : maxQno[0]['max_q_no']
    }

    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS"
      },
      "data": data
    }
    res.status(responseData.meta.code).json(responseData);
  } catch (e) {
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }
}

async function answerInsert(req, res, next)
{
  try {
    db = req.app.get('db');
    config = req.app.get('config');
    let data = {};
    let student_id = req.user.student_id;
    let contest_id = req.body.contest_id;
    let q_no = req.body.q_no;
    let ans_no = req.body.ans_no;
    let checkAnswer = await ContestNew.checkAnswerExistance(student_id, contest_id, q_no, db.mysql.read);
    //console.log(checkAnswer);
    if(checkAnswer.length == 0) {
      ContestNew.insertQuestionAnswer(student_id, contest_id, q_no, ans_no, db.mysql.write).then(response =>{
        return ContestNew.getById(response['insertId'], db.mysql.write);
      }).then(result => {
          let data = {
            'max_qno' : result[0]['max_q_no']
          }
          let responseData = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "SUCCESS"
            },
            "data": data
          }
          res.status(responseData.meta.code).json(responseData);
        })

    }else{
      ContestNew.getMaxQno(student_id, contest_id, db.mysql.read).then(result => {
        let data = {
          'max_qno' : result[0]['max_q_no']
        }
        let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS"
          },
          "data": data
        }
        res.status(responseData.meta.code).json(responseData);
      })
    }

  } catch(e) {
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }
}

module.exports = {getAllContests, enroll, getQuestionslist, getMaxQnoByStudentId, answerInsert};
