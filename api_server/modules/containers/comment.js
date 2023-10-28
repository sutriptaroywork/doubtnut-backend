const _ = require('lodash')
const config = require('../../config/config')
// const mysql = require("../mysql/co")
const redis = require("../redis/comment")
const mongo = require("../mongo/comment")
const Student = require("../../modules/student");

// function myLogger(key,msg,type="FgWhite"){
//   const colorMap = {
//       Reset : "\x1b[0m",
//       FgBlack : "\x1b[30m",
//       FgRed : "\x1b[31m",
//       FgGreen : "\x1b[32m",
//       FgYellow : "\x1b[33m",
//       FgBlue : "\x1b[34m",
//       FgMagenta : "\x1b[35m",
//       FgCyan : "\x1b[36m",
//       FgWhite : "\x1b[37m",
//       BgBlack : "\x1b[40m",
//       BgRed : "\x1b[41m",
//       BgGreen : "\x1b[42m",
//       BgYellow : "\x1b[43m",
//       BgBlue : "\x1b[44m",
//       BgMagenta : "\x1b[45m",
//       BgCyan : "\x1b[46m",
//       BgWhite : "\x1b[47m",
//   }
//   console.log(colorMap[type],key,...msg,colorMap["Reset"]);
// }
module.exports= class Comment{
  constructor(){

  }

  static async getCommentCount(type,id,comment,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        // let query = {entity_type: type, entity_id: id, is_deleted: false, reported_by: { $size: 0 }}
        let query = {entity_type: type, entity_id: id, is_deleted: false}

        if (config.caching) {
          data = await redis.getCommentCount(type,id,db.redis.read)
          console.log("redis data")
          console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist")
            data = await comment.countDocuments(query);
            console.log("mysql data")
            console.log(data)
            // if(data.length > 0){
              //set in redis
              await redis.setCommentCount(type,id,data,db.redis.write)
            // }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await comment.countDocuments(query);
          console.log("mysql data")
          console.log(data)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }
  static async getTopComment(type,id,comment,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        let query = {entity_type: type, entity_id: id, is_deleted: false, reported_by: { $size: 0 }}

        if (config.caching) {
          data = await redis.getTopComment(type,id,db.redis.read)
          console.log("redis data top comment")
          console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            // console.log(" not exist top comment")
            data = await comment.find(query).sort({createdAt: -1}).limit(1);
            // console.log("mysql data top comment")
            console.log(data)
            if(data.length > 0) {
              if ((data[0].message.length === 0) && (typeof data[0].audio !== 'undefined') && (data[0].audio.length > 0)) {
                data[0].message = "is message to dekhne ke liye apne app ko update karein " +
                  "https://play.google.com/store/apps/details?id=com.doubtnutapp"
              }
              await redis.setTopComment(type,id,data,db.redis.write)
            }
              //set in redis
            // }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await comment.countDocuments(query);
          console.log("mysql data")
          console.log(data)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }
  static async updateTopComment(type,id,comment,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        let query = {entity_type: type, entity_id: id, is_deleted: false}

        if (config.caching) {
          data = await redis.getTopComment(type,id,db.redis.read)
          console.log("redis data top comment")
          console.log(data)
          if (!_.isNull(data)) {
            console.log("exist")
            return resolve(JSON.parse(data))
          } else {
            //get from mysql
            console.log(" not exist top comment")
            data = await comment.find(query).sort({createdAt: -1}).limit(1);
            console.log("mysql data top comment")
            console.log(data)
            // if(data.length > 0){
              //set in redis
              await redis.setTopComment(type,id,data,db.redis.write)
            // }
            return resolve(data)
          }
        } else {
          console.log(" not exist")
          data = await comment.countDocuments(query);
          console.log("mysql data")
          console.log(data)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  static async updateCommentCount(type,id,comment,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        let query = {entity_type: type, entity_id: id, is_deleted: false}

          data = await redis.getCommentCount(type,id,db.redis.read)
          console.log("redis data comment count")
          console.log(data)
          console.log(typeof data)
          if (!_.isNull(data)) {
            console.log("exist")
            data = parseInt(data)
            data = data + 1
            console.log(data)
            await redis.setCommentCount(type,id,data,db.redis.write)
            return resolve(data)
          } else {
            //set 1 comment count because no keys exists
            console.log(" not exist comment count")
            // data = await comment.find(query).sort({createdAt: -1}).limit(1);
            console.log("mysql data comment count")
            // console.log(data)
            // if(data.length > 0){
              //set in redis
              await redis.setCommentCount(type,id,1,db.redis.write)
            // }
            return resolve(1)
          }
        // } else {
        //   console.log(" not exist")
        //   data = await comment.countDocuments(query);
        //   console.log("mysql data")
        //   console.log(data)
        //   return resolve(data)
        // }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }
  static async updateCommentors(type,id,comment,db, user) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        // myLogger("UPDATE COMMENTORS",['\n'],"FgBlue")
        let data=[];
        // let query = {entity_type: type, entity_id: id, is_deleted: false, reported_by: { $size: 0 }}
        let query = {
          entity_type: type,
          entity_id: id,
          is_deleted: false,
          // is_mute: {$ne:true}
        }

        if (config.caching) {
          data = await redis.getCommentors(type,id,db.redis.read)
          // myLogger("REDIS ENABLED",[true],"FgBlue")
          if (data.length) {
            // EMPTY
            // myLogger("REDIS DATA",[data],"FgBlue")
            await redis.setCommentors(type,id,[user],db.redis.write)
            return resolve(data)
          } else {
            //get from mysql
            // console.log(" not exist")
            data = await comment.find(query).lean();
            // console.log("COMMENTS FROM MONGO",data)
            const commentors = data.map(commentor => commentor.student_id);
            // myLogger("REDIS DATA NOT EXIST",["Total Commentors",data.length,"Commentors",commentors],"FgBlue");
            if(commentors.length){
              await redis.setCommentors(type,id,commentors,db.redis.write)
            }
            return resolve(commentors)
          }
        } else {
          data = await comment.find(query).lean();
          const commentors = data.map(commentor => commentor.student_id);
          return resolve(commentors)
        }
      } catch (e) {
        // myLogger("UPDATE COMMENTORS ERROR",[e],"FgCyan")
        reject(e)
      }
    })
  }
  static async updateGCMIDByStudentID(studentID,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        // myLogger("UPDATE GMMID",['\n'],"FgBlue")
        let data;
        if (config.caching) {
          data = await redis.getFeedGCMID(studentID,db.redis.read);
          // myLogger("REDIS ENABLED",[true],"FgBlue")
          if (!_.isNull(data)) {
            // EMPTY
            // myLogger("REDIS DATA",[data],"FgBlue");
            return resolve(data)
          } else {
            //get from mysql
            data = await Student.getGcmByStudentId(studentID,db.mysql.read);
            const gcmID = data[0].gcm_reg_id
            await redis.setFeedGCMID(studentID,gcmID,db.redis.write);
            // myLogger("REDIS DATA NOT EXIST",["Student",studentID,"GCMID",gcmID],"FgBlue");
            return resolve(gcmID)
          }
        } else {
          // console.log(" not exist")
          data = await Student.getGcmByStudentId(student_id,db.mysql.read);
          const gcmID = data[0].gcm_reg_id
          // console.log("mongo data")
          // console.log(data[0].replies_count)
          return resolve(gcmID)
        }
      } catch (e) {
        // myLogger("UPDATE GCMID ERROR",[e],"FgCyan")
        reject(e)
      }
    })
  }
  static async getCommentorsCount(type,id,comment,db,studentID) {
    return new Promise(async function (resolve, reject) {
      try {
        // myLogger("GET COMMENTORS COUNT BY ID",['\n'],"FgBlue")
        let data=[];
        // let query = {entity_type: type, entity_id: id, is_deleted: false, reported_by: { $size: 0 }}
        if (config.caching) {
          data = await redis.getCommentCountByCommentor(type,id,studentID,db.redis.read)
          // myLogger("REDIS ENABLED",[true],"FgBlue")
          if (!_.isNull(data)) {
            // EMPTY
            // myLogger("REDIS DATA",[data],"FgBlue")
            // await redis.setCommentCountByCommentor(type,id,studentID,count,db.redis.write)
            return resolve(data)
          } else {
            //get from mysql
            // console.log(" not exist")
            // myLogger("REDIS DATA NOT EXIST",["SETTING COUNT TO:",0],"FgBlue");
            await redis.setCommentCountByCommentor(type,id,studentID,0,db.redis.write)
            return resolve(0)
          }
        } else {
          // console.log(" not exist")
          // console.log("mongo data")
          // console.log(data[0].replies_count)
          return resolve(0)
        }
      } catch (e) {
        // myLogger("GETCOMMENTORS COUNT ERROR",[e],"FgCyan")
        reject(e)
      }
    })
  }
  static async removeCommentor(type,id,comment,db, user) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        // myLogger("REMOVE COMMENTORS",['\n'],"FgBlue")
        let data=[];
        // let query = {entity_type: type, entity_id: id, is_deleted: false, reported_by: { $size: 0 }}
        if (config.caching) {
          data = await redis.getCommentors(type,id,db.redis.read)
          // myLogger("REDIS ENABLED",[true],"FgBlue")
          if (data.length) {
            // COMMENTORS EXIST
            // myLogger("REDIS DATA",[data],"FgBlue")
            await redis.removeCommentor(type,id,[user],db.redis.write);
            // myLogger("REMOVED",[removed], "FgBlue")
          }
        }
        return resolve("DONE");
      } catch (e) {
        // myLogger("UPDATE COMMENTORS ERROR",[e],"FgCyan")
        reject(e)
      }
    })
  }
  static async updateCommentorsCount(type,id,comment,db,studentID,count) {
    return new Promise(async function (resolve, reject) {
      try {
        // myLogger("UPDATE COMMENTORS COUNT BY ID",['\n'],"FgBlue")
        // let query = {entity_type: type, entity_id: id, is_deleted: false, reported_by: { $size: 0 }}
        if (config.caching) {
          // myLogger("REDIS ENABLED",[true],"FgBlue")
          // myLogger("SETTING COUNT TO:",[count],"FgBlue");
          await redis.setCommentCountByCommentor(type,id,studentID,count,db.redis.write);
        } 
          return resolve(0)
        
      } catch (e) {
        // myLogger("GETCOMMENTORS COUNT ERROR",[e],"FgCyan")
        reject(e)
      }
    })
  }

  static async updateTotalCount(type,id,comment,db) {
    return new Promise(async function (resolve, reject) {
      try {
        // myLogger("UPDATE TOTAL COUNT !!!",['\n'],"FgBlue")
        // let query = { parent_id: id, is_deleted: false}
        let query = {entity_type: type, entity_id: id, is_deleted: false}
        let data;
        // let query = {entity_type: type, entity_id: id, is_deleted: false, reported_by: { $size: 0 }}
        if (config.caching) {
          data = await redis.getCommentTotalCount(type,id,db.redis.read)
          // myLogger("REDIS ENABLED",[true],"FgBlue")
          if (!_.isNull(data)) {
            // EMPTY
            const newCount = parseInt(data) +1;
            // myLogger("REDIS DATA",[data],"FgBlue")
            await redis.setCommentTotalCount(type,id,newCount,db.redis.write)
            return resolve(newCount)
          } else {
            //get from mysql
            // console.log(" not exist")
            // data = await comment.countDocuments(query);
            // myLogger("REDIS DATA NOT EXIST",["\n"],"FgBlue");
            data = await comment.countDocuments(query);
            await redis.setCommentTotalCount(type,id,data,db.redis.write)
            // myLogger("SETTING COUNT TO:",[data],"FgBlue")
            return resolve(data)
          }
        } else {
          // console.log(" not exist")
          // console.log("mongo data")
          // console.log(data[0].replies_count)
          data = await comment.countDocuments(query);
          return resolve(data)
        }
      } catch (e) {
        // myLogger("GETCOMMENTORS COUNT ERROR",[e],"FgCyan")
        reject(e)
      }
    })
  }

}
