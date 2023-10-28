/**
 * @Author: xesloohc
 * @Date:   2019-07-29T17:46:47+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-06T17:59:08+05:30
 */
 const _ = require('lodash')
 const config = require('../../config/config')
 const mysql = require("../mysql/contentunlock")
 const redis = require("../redis/contentunlock")
 module.exports = class Icons {
   constructor() {
   }
   static async getUnlockStatus(db,student_id,content) {
     //first try to get from redis
     return new Promise(async function (resolve, reject) {
       // Do async job
       try {
         let data = 0
         content = "physics_chemistry"
         if (0) {
           data = await redis.getUnlockStatus(db.redis.read,student_id,content)
           //data=null
           console.log(data)
           if (!_.isNull(data)) {
             console.log("exist")
             return resolve(parseInt(data))
           } else {
             //get from mysql
             console.log(" not exist")
             data = await mysql.getUnlockStatus(db.mysql.read,student_id,content)

             // console.log("mysql data")
             // console.log(data)
             if (data.length > 0) {
               //set in redis
               await redis.setUnlockStatus(db.redis.write,student_id,content)
             }
             return resolve(data.length)
           }
         } else {
           console.log(" not exist")
           data = await mysql.getUnlockStatus(db.mysql.read,student_id,content)

           // console.log("mysql data")
           //
           // console.log(data)
           return resolve(data.length)
         }
       } catch (e) {
         console.log(e)
         reject(e)
       }
     })
   }
 }
