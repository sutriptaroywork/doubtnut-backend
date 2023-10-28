"use strict";
const mysqlTimeTable =require('../../../modules/mysql/timetable')
let db, config
async function insert(req,res,next){
  try{
    db =req.app.get('db')
    config =req.app.get('config')
    let insert_obj = {}
    insert_obj.type = req.body.type
    insert_obj.title =req.body.title
    insert_obj.subject =req.body.subject
    insert_obj.note = req.body.note
    insert_obj.date =req.body.date
    insert_obj.schedule =req.body.schedule
    insert_obj.start_time =req.body.start_time
    insert_obj.end_time =req.body.end_time
    insert_obj.recurring =req.body.recurring
    insert_obj.date_in_milliseconds =req.body.date_in_milliseconds
    insert_obj.student_id =req.user.student_id
    insert_obj.student_class = req.user.student_class

    let dataInsert = await mysqlTimeTable.insertPostToCalender(db.mysql.write,insert_obj)
    let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
         "data": {
           'id': dataInsert.insertId,
           'type': req.body.type,
           'title':req.body.title,
           'subject':req.body.subject,
           'note': req.body.note,
           'date': req.body.date,
           'schedule': req.body.schedule,
           'start_time': req.body.start_time,
           'end_time': req.body.end_time,
           'recurring': req.body.recurring,
           'date_in_milliseconds':req.body.date_in_milliseconds
        }
      }
      res.status(responseData.meta.code).json(responseData)

  }catch(e){
    next(e)
  }
}
async function getTimeTable(req,res,next){
  try{
    db =req.app.get('db')
    let student_id =req.user.student_id
    let getData = await mysqlTimeTable.getCalenderDetails(student_id, db.mysql.read)
    let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
         "data": getData
      }
      res.status(responseData.meta.code).json(responseData)

  }catch(e){
    next(e)
  }
}
async function deleteTimeTable(req,res,next){
  try{
    db =req.app.get('db')
    let id = req.params.id
    let details= await mysqlTimeTable.removeDetails(id,db.mysql.write)
    //console.log(details)
    let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        }
         
      }
      res.status(responseData.meta.code).json(responseData)

  }catch(e){
    next(e)
  }
}
async function updateTimeTable(req,res,next){
  try{
    db =req.app.get('db')
    let id =req.params.id
    let insert_obj = {}
    insert_obj.type = req.body.type
    insert_obj.title =req.body.title
    insert_obj.subject =req.body.subject
    insert_obj.note = req.body.note
    insert_obj.date =req.body.date
    insert_obj.schedule =req.body.schedule
    insert_obj.start_time =req.body.start_time
    insert_obj.end_time =req.body.end_time
    insert_obj.recurring =req.body.recurring
    insert_obj.date_in_milliseconds =req.body.date_in_milliseconds
    insert_obj.student_id =req.user.student_id
    insert_obj.student_class = req.user.student_class
    let updateCalender =await mysqlTimeTable.updateDetails(db.mysql.write, insert_obj, id)
    let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
         "data":{
           'id': id,
           'type': req.body.type,
           'title':req.body.title,
           'subject':req.body.subject,
           'note': req.body.note,
           'date': req.body.date,
           'schedule': req.body.schedule,
           'start_time': req.body.start_time,
           'end_time': req.body.end_time,
           'recurring': req.body.recurring,
           'date_in_milliseconds':req.body.date_in_milliseconds
         }
      }
      res.status(responseData.meta.code).json(responseData)
  }catch(e){
    next(e)
  }

}


module.exports ={insert, getTimeTable, deleteTimeTable, updateTimeTable}
