"use strict";
const Utility = require('../../../modules/utility')
const Sharing = require('../../../modules/mysql/sharingMessages')
const redisAnswer= require('../../../modules/redis/answer')
const TeacherRedis = require('../../../modules/redis/teacher');
const TeacherMysql = require('../../../modules/mysql/teacher');
const _ = require('lodash')
const fs = require('fs')
const randomNumberGenerator = require('../../../modules/randomNumberGenerator');
let db, config;

async function getMessage(req,res,next){
  try{
    db = req.app.get('db');
    let screen = req.query.screen
    let type = req.query.type
    let result = await Sharing.getMessages(screen,type,db.mysql.read)
    //console.log("result")
    //console.log(result)
    if(result.length > 0){
      let responseData = {
        "meta": {
          "code": 200,
          "success":true,
          "message": "Sharing Message",
        },
        "data": result[0],
      }
      return res.status(responseData.meta.code).json(responseData)

    }else{
      let responseData = {
        "meta": {
          "code": 403,
          "success":false,
          "message": "Invalid params",
        },
      }
      return res.status(responseData.meta.code).json(responseData)

    }

  }catch(e){
    next(e)
  }

}


async function whatsApp(req, res, next) {
  try {
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id=req.user.student_id
    let entity_id=req.body.entity_id
    let entity_type=req.body.entity_type
    let data= await Sharing.whatsApp(db.mysql.write,student_id,entity_id,entity_type)

    // teacher video share count increment
    const checkTeacherVideo = await TeacherMysql.checkRecourceIsTeacherVideo(db.mysql.read, entity_id.toString());
    if (!_.isEmpty(checkTeacherVideo)) {
      await TeacherRedis.incrTeacherVideoShareStats(db.redis.write, entity_id);
    }

    let responseData = {
        meta: {
          code: 200,
          message: 'success',
        },
        data: { share: randomNumberGenerator.getWhatsappShareStatsNew(entity_id) },
      }
    return res.status(responseData.meta.code).json(responseData);
  }catch (e) {
    next(e)
  }
}


// { id: 798,
//   chapter_order: 1,
//   sub_topic_order: 1,
//   micro_concept_order: 3,
//   final_order: 798,
//   mc_id: 'CV_1985',
//   class: 12,
//   course: 'NCERT',
//   chapter: 'RELATIONS',
//   subtopic: 'RELATION',
//   mc_text: 'Cartesian Product of Sets',
//   active_status: 1 }

module.exports = {getMessage,whatsApp}
