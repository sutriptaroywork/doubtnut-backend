'use strict';
const vision = require('@google-cloud/vision')
const request = require("request")
let Enum = require('enum');
const Utility = require('../../api_server/modules/utility');
const GroupChatMessageModel = require('./mongo/groupchatmessage')
const gupshupMysql = require('../../api_server/modules/mysql/gupshup')
const Student = require('../../api_server/modules/student');
const bannedUser = require('../../api_server/modules/banned_users');
const bluebird = require("bluebird")
const mongoose = require("mongoose")
bluebird.promisifyAll(mongoose)

let imageCheckresult=new Enum(['POSSIBLE','VERY_LIKELY','LIKELY'])

module.exports = class ImageProfanityCheckService {
  constructor(config) {
    this.config = config
  }
  async run(data, admin, db) {
  	//console.log(data)
    try {
      let image_url =data.comment.image
      let id=data.comment._id
      let student_id=data.comment.student_id
      let checkedImage = await this.visionImageApi(image_url)
        if(!imageCheckresult.isDefined(checkedImage[0]['safeSearchAnnotation']['adult'])){

          delete data.comment._id
          data.comment.is_deleted=false
          
          let data1= new GroupChatMessageModel(data.comment)
          let data2=await data1.save()
          await GroupChatMessageModel.deleteOne({_id:id})

          //let temp=await GroupChatMessageModel.find({_id:id})
          // console.log(data2)
          // console.log("111111111")
          // console.log(temp)
        }else{
          let temp=await gupshupMysql.add(db.mysql.write,student_id,id,'gupshup')
          let gupshupBanned=await gupshupMysql.banCheck(db.mysql.read,student_id)
          if(gupshupBanned.length==1){
              Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
              let notification_data1 = {
                "event": "",
                "title": "⚠Offensive Content Detected⚠",
                "message": "ध्यान रखे! Iss platform pe offensive या अश्लील content nahi post karein.",
                "image": ""
              }
              Utility.sendFcm(student_id, studentData[0].gcm_reg_id, notification_data1, "user_journey", admin, db)
            }).catch(error => {
              console.log(error)
            })
          }
          if(gupshupBanned.length==2){
            Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
              let notification_data1 = {
                "event": "",
                "title": "⚠Message Reported सावधान !⚠",
                "message": "Offensive या अश्लील content post karne se aap par legal action ho sakta hai under sec 292, 499 and 500 of IPC",
                "image": ""
              }
              Utility.sendFcm(student_id, studentData[0].gcm_reg_id, notification_data1, "user_journey", admin, db)
            }).catch(error => {
              console.log(error)
            })
          }
          if(gupshupBanned.length==3){
            await bannedUser.getBanned(db.mysql.write,student_id)
            Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
              let notification_data1 = {
                "event": "",
                "title": "🚫 Aapko block kiya jaata hai! 🚫",
                "message": "Aapka post Offensive aur अश्लील tha. Ab aap yahan post nhi kar sakte.",
                "image": ""
              }
              Utility.sendFcm(student_id, studentData[0].gcm_reg_id, notification_data1, "user_journey", admin, db)
            }).catch(error => {
              console.log(error)
            })
          }
        }
    }
    catch (e) {
      console.log(e)
    }
  }

  async visionImageApi(image_url){
    let client = new vision.ImageAnnotatorClient()
    return client.safeSearchDetection(image_url)
  
  }
 
}