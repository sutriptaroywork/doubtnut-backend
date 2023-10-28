// const _ = require('lodash');
// const Student = require('../../api_server/modules/student')
const Question = require('../../api_server/modules/question')
const Utility = require('../../api_server/modules/utility')
const VideoViewContainer = require('../../api_server/modules/containers/videoView')
const Notification = require('../../api_server/modules/notifications')
const Milestones = require('../../api_server/modules/mysql/milestones')

const moment = require('moment')
module.exports = class NotificationService {
  constructor(config) {
    this.config = config
  }

  async run(message, db) {
    console.log(message)
    console.log('run')
    try {
      let type = message.type
      if (type === "referred_video") {
        let referred_student_id = message.ref_student_id
        Notification.sendNotificationToStudent(type, referred_student_id, "", db)
      } else if (type === "video_views") {
        this.videoCount(message, db)
      } else if (type === "question_ask") {
        this.questionCount(message, db)
      }
    }
    catch (e) {
      console.log(e)
    }
  }

  async questionCount(message, db) {
    let student_id = message.student_id
    let gcm_id = message.gcm_id
    // let question_id = message.question_id
// console.log("fff")
    let resolvedPromises = await Question.checkQuestionsAskedCount(student_id, db.mysql.read)
    let count_values = resolvedPromises
    let c = 0, d = 0, e = 0
// console.log(count_values.length)
    if (count_values.length > 0) {
      if (count_values.length == 1) {
        //check for active notification
        Notification.checkUserActiveNotification("first_question", db.mysql.read).then((notification_data) => {
          if (notification_data.length > 0) {
            let notification_data1 = {
              "event": "user_journey",
              "title": notification_data[0]['title'],
              "message": notification_data[0]['message'],
              "image": notification_data[0]['image_url'],
              "data": JSON.stringify({"random":"1"})
            }
            Utility.sendFcm(student_id, gcm_id, notification_data1, "first_question", db.admin, db)
          }
        }).catch(error => {
          db.winstoneInstance.info(error)
        })
      } else {
        // console.log("ere")
        let beforeTime = moment().add(-30, 'days').valueOf();
        let currentTimestamp = new Date().getTime();
        for (let i = 0; i < count_values.length; i++) {
          if (Notification.compare(count_values[i]['timestamp'], new Date()) == 0) {
            c++
          }
          let q_timestamp = moment(count_values[i]['timestamp']).valueOf()
          if ((q_timestamp > beforeTime) && (q_timestamp < currentTimestamp)) {
            e++
          }
          d++
        }
        // console.log("c=" + c)
        // console.log("d=" + d)
        // console.log("e=" + e)
        // if (e >= 15) {
        //   Notification.checkLastNdaysNquestionAsk(student_id, gcm_id, db.admin, db)
        // }
        if (c === 10) {
          Notification.checkUserActiveNotification("user_question_streak", db.mysql.read).then((notification_data) => {
            if (notification_data.length > 0) {
              // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
              let notification_data1 = {
                "event": "user_journey",
                "title": notification_data[0]['title'],
                "message": notification_data[0]['message'],
                "image": notification_data[0]['image_url'],
                "data":JSON.stringify({"random":"1"})
              }
              Utility.sendFcm(student_id, gcm_id, notification_data1, "user_question_streak", db.admin, db)
            }
          }).catch(error => {
            db.winstoneInstance.info(error)
          })
        }
        if (c === 5 || c === 10 || c === 50) {
          //milestone
          await Milestones.addMilestone('question_asked', student_id, c, db.mysql.write)
        }
        if (d === 5 || d === 10 || d === 25 || d === 50 || d === 100 || d === 200) {
          Notification.checkUserActiveNotification("first_n_question", db.mysql.read).then((notification_data) => {
            if (notification_data.length > 0) {
              // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
              let notification_data1 = {
                "event": "user_journey",
                "title": notification_data[0]['title'],
                "message": notification_data[0]['message'],
                "image": notification_data[0]['image_url'],
                "data": JSON.stringify({"random":"1"})
              }
              Utility.sendFcm(student_id, gcm_id, notification_data1, "first_n_question", admin, db)
              // }).catch(error => {
              //   console.log(error)
              // })
            }
          }).catch(error => {
            db.winstoneInstance.info(error)
          })
        }
      }
    }
  }

  async videoCount(message, db) {
    let student_id = message.student_id
    let gcm_id = message.gcm_id
    let question_id = message.question_id
    let resolvedPromises = await VideoViewContainer.getVideoViews(student_id, db)
    let count_values = resolvedPromises
    let c = 0, d = 0
    if (count_values.length > 0) {
      if (count_values.length == 1) {
        //check for active notification
        Notification.checkUserActiveNotification("first_video_watch", db.mysql.read).then((notification_data) => {
          if (notification_data.length > 0) {
            let notification_data1 = {
              "event": "user_journey",
              "title": notification_data[0]['title'],
              "message": notification_data[0]['message'],
              "image": notification_data[0]['image_url'],
              "data": JSON.stringify({"random":"1"})
            }
            Utility.sendFcm(student_id, gcm_id, notification_data1, "first_video_watch", db.admin, db)
          }
        }).catch(error => {
          db.winstoneInstance.info(error)
        })
      } else {
        for (let i = 0; i < count_values.length; i++) {
          // console.log(count_values[i]['created_at'])
          if (Notification.compare(count_values[i]['created_at'], new Date()) == 0) {
            c++
          }
          d++
        }
        console.log("c=" + c)
        console.log("d=" + d)
        if (c == 10) {
          Notification.checkUserActiveNotification("user_video_streak", db.mysql.read).then((notification_data) => {
            if (notification_data.length > 0) {
              let notification_data1 = {
                "event": "user_journey",
                "title": notification_data[0]['title'],
                "message": notification_data[0]['message'],
                "image": notification_data[0]['image_url'],
                "data": JSON.stringify({"random":"1"})
              }
              Utility.sendFcm(student_id, gcm_id, notification_data1, "user_video_streak", db.admin, db)
            }
          }).catch(error => {
            db.winstoneInstance.info(error)
          })
        }
        if (c === 5 || c === 10 || c === 50) {
          //milestone
          await Milestones.addMilestone('video_view', student_id, c, db.mysql.write)
        }
        if (d === 5 || d === 10 || d === 25 || d === 50 || d === 100 || d === 200) {
          Notification.checkUserActiveNotification("first_n_video_watch", db.mysql.read).then((notification_data) => {
            if (notification_data.length > 0) {
              // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
              let notification_data1 = {
                "event": "user_journey",
                "title": notification_data[0]['title'],
                "message": notification_data[0]['message'],
                "image": notification_data[0]['image_url'],
                "data": JSON.stringify({"random":"1"})
              }
              Utility.sendFcm(student_id, gcm_id, notification_data1, "first_n_video_watch", db.admin, db)
            }
          }).catch(error => {
            // console.log(error)
            db.winstoneInstance.info(error)

          })
        }
      }
    }
  }


}



