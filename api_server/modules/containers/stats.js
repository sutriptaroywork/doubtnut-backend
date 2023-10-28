const _ = require('lodash')
const config = require('../../config/config')

const mysqlQuestionContainer = require("../mysql/stats")
const redisQuestionContainer = require("../redis/stats")

module.exports = class Stats {
  constructor() {
  }

static getMostWatchedVideosByPackage(package_name,count,old_day_count,db) {
     return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisQuestionContainer.getMostWatchedVideosByPackage(package_name,count,db.redis.read)
          if (!_.isNull(data)) {
            console.log("exist")
            console.log(data)
            return resolve(JSON.parse(data))
          } else {
            console.log("not2mysql")
            //get from mysql
            data = await mysqlQuestionContainer.getMostWatchedVideosByPackage(package_name,count,old_day_count,db.mysql.read)
              //set in redis
            await redisQuestionContainer.setMostWatchedVideosByPackage(package_name,count,data,db.redis.write)
            return resolve(data)
          }
        }else{
          data = await mysqlQuestionContainer.getMostWatchedVideosByPackage(package_name,count,old_day_count,db.mysql.read)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }

  static getMostWatchedVideosForFirstLevel(package_name,level1,count,old_day_count,db) {
     return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisQuestionContainer.getMostWatchedVideosForFirstLevel(package_name,level1,count,db.redis.read)
          if (!_.isNull(data)) {
            console.log("exist")
            console.log(data)
            return resolve(JSON.parse(data))
          } else {
            console.log("not2mysql")
            //get from mysql
            data = await mysqlQuestionContainer.getMostWatchedVideosForFirstLevel(package_name,level1,count,old_day_count,db.mysql.read)
              //set in redis
            await redisQuestionContainer.setMostWatchedVideosForFirstLevel(package_name,level1,count,data,db.redis.write)
            return resolve(data)
          }
        }else{
          data = await mysqlQuestionContainer.getMostWatchedVideosForFirstLevel(package_name,level1,count,old_day_count,db.mysql.read)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }

  static  getMostWatchedVideosForSecondLevel(package_name,level1,level2,count,old_day_count,db) {
     return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisQuestionContainer.getMostWatchedVideosForSecondLevel(package_name,level1,level2,count,db.redis.read)
          if (!_.isNull(data)) {
            console.log("exist")
            console.log(data)
            return resolve(JSON.parse(data))
          } else {
            console.log("not2mysql")
            //get from mysql
            data = await mysqlQuestionContainer.getMostWatchedVideosForSecondLevel(package_name,level1,level2,count,old_day_count,db.mysql.read)
              //set in redis
            await redisQuestionContainer.setMostWatchedVideosForSecondLevel(package_name,level1,level2,count,data,db.redis.write)
            return resolve(data)
          }
        }else{
          data = await mysqlQuestionContainer.getMostWatchedVideosForSecondLevel(package_name,level1,level2,count,old_day_count,db.mysql.read)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }


   static getFirstLevel(package_name,old_day_count,db) {
     return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisQuestionContainer.getFirstLevel(package_name,db.redis.read)
          if (!_.isNull(data)) {
            console.log("exist")
            console.log(data)
            return resolve(JSON.parse(data))
          } else {
            console.log("not2mysql")
            //get from mysql
            data = await mysqlQuestionContainer.getFirstLevel(package_name,old_day_count,db.mysql.read)
              //set in redis
            await redisQuestionContainer.setFirstLevel(package_name,data,db.redis.write)
            return resolve(data)
          }
        }else{
          data = await mysqlQuestionContainer.getFirstLevel(package_name,old_day_count,db.mysql.read)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }

  static getSecondLevel(package_name,level1,old_day_count,db) {
     return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisQuestionContainer.getSecondLevel(package_name,level1,db.redis.read)
          if (!_.isNull(data)) {
            console.log("exist")
            console.log(data)
            return resolve(JSON.parse(data))
          } else {
            console.log("not2mysql")
            //get from mysql
            data = await mysqlQuestionContainer.getSecondLevel(package_name,level1,old_day_count,db.mysql.read)
              //set in redis
            await redisQuestionContainer.setSecondLevel(package_name,level1,data,db.redis.write)
            return resolve(data)
          }
        }else{
          data = await mysqlQuestionContainer.getSecondLevel(package_name,level1,old_day_count,db.mysql.read)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }

  static getTopChapters(package_name,level1,db) {
     return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisQuestionContainer.getTopChapters(package_name,level1,db.redis.read)
          if (!_.isNull(data)) {
            console.log("exist")
            console.log(data)
            return resolve(JSON.parse(data))
          } else {
            console.log("not2mysql")
            //get from mysql
            data = await mysqlQuestionContainer.getTopChapters(package_name,level1,db.mysql.read)
              //set in redis
            await redisQuestionContainer.setTopChapters(package_name,level1,data,db.redis.write)
            return resolve(data)
          }
        }else{
          data = await mysqlQuestionContainer.getTopChapters(package_name,level1,db.mysql.read)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }

  static  getMostWatchedVideosForSecondLevelNew(package_name,level1,level2,count,old_day_count,db) {
    return new Promise(async function (resolve, reject) {
     // Do async job
     try {
       let data
       if (config.caching) {
         data = await redisQuestionContainer.getMostWatchedVideosForSecondLevelNew(package_name,level1,level2,count,db.redis.read)
         if (!_.isNull(data)) {
           console.log("exist")
           console.log(data)
           return resolve(JSON.parse(data))
         } else {
           console.log("not2mysql")
           //get from mysql
           data = await mysqlQuestionContainer.getMostWatchedVideosForSecondLevelNew(package_name,level1,level2,count,old_day_count,db.mysql.read)
             //set in redis
           await redisQuestionContainer.setMostWatchedVideosForSecondLevelNew(package_name,level1,level2,count,data,db.redis.write)
           return resolve(data)
         }
       }else{
         data = await mysqlQuestionContainer.getMostWatchedVideosForSecondLevelNew(package_name,level1,level2,count,old_day_count,db.mysql.read)
         return resolve(data)
       }
     } catch (e) {
       console.log(e)

       reject(e)
     }
   })
 }

static getMostWatchedVideosForFirstLevelNew(package_name,level1,count,old_day_count,db) {
  return new Promise(async function (resolve, reject) {
   // Do async job
   try {
     let data
     if (config.caching) {
       data = await redisQuestionContainer.getMostWatchedVideosForFirstLevelNew(package_name,level1,count,db.redis.read)
       if (!_.isNull(data)) {
         console.log("exist")
         console.log(data)
         return resolve(JSON.parse(data))
       } else {
         console.log("not2mysql")
         //get from mysql
         data = await mysqlQuestionContainer.getMostWatchedVideosForFirstLevelNew(package_name,level1,count,old_day_count,db.mysql.read)
           //set in redis
         await redisQuestionContainer.setMostWatchedVideosForFirstLevelNew(package_name,level1,count,data,db.redis.write)
         return resolve(data)
       }
     }else{
       data = await mysqlQuestionContainer.getMostWatchedVideosForFirstLevelNew(package_name,level1,count,old_day_count,db.mysql.read)
       return resolve(data)
     }
   } catch (e) {
     console.log(e)

     reject(e)
   }
 })
}
    static getTopChaptersNew(package_name,level1,db) {
      return new Promise(async function (resolve, reject) {
        try {
          let data
          if (config.caching) {
            data = await redisQuestionContainer.getTopChaptersNew(package_name,level1,db.redis.read)
            if (!_.isNull(data)) {
              return resolve(JSON.parse(data))
            } else {
              data = await mysqlQuestionContainer.getTopChaptersNew(package_name,level1,db.mysql.read)
              await redisQuestionContainer.setTopChaptersNew(package_name,level1,data,db.redis.write)
              return resolve(data)
            }
          }else{
            data = await mysqlQuestionContainer.getTopChaptersNew(package_name,level1,db.mysql.read)
            return resolve(data)
          }
        } catch (e) {
          reject(e)
        }
      })
    }

    static getFirstLevelNew(package_name,old_day_count,db) {
      return new Promise(async function (resolve, reject) {
       // Do async job
       try {
         let data
         if (config.caching) {
           data = await redisQuestionContainer.getFirstLevelNew(package_name,db.redis.read)
           if (!_.isNull(data)) {
             return resolve(JSON.parse(data))
           } else {
             //get from mysql
             data = await mysqlQuestionContainer.getFirstLevelNew(package_name,old_day_count,db.mysql.read)
               //set in redis
             await redisQuestionContainer.setFirstLevelNew(package_name,data,db.redis.write)
             return resolve(data)
           }
         }else{
           data = await mysqlQuestionContainer.getFirstLevelNew(package_name,old_day_count,db.mysql.read)
           return resolve(data)
         }
       } catch (e) {
         console.log(e)
 
         reject(e)
       }
     })
   }

  static getMostWatchedVideosByPackageNew(package_name,count,old_day_count,db) {
    return new Promise(async function (resolve, reject) {
     // Do async job
      try {
        let data
        if (config.caching) {
          data = await redisQuestionContainer.getMostWatchedVideosByPackageNew(package_name,count,db.redis.read)
          if (!_.isNull(data)) {
            console.log("exist")
            console.log(data)
            return resolve(JSON.parse(data))
          } else {
            console.log("not2mysql")
            //get from mysql
            data = await mysqlQuestionContainer.getMostWatchedVideosByPackageNew(package_name,count,old_day_count,db.mysql.read)
              //set in redis
            await redisQuestionContainer.setMostWatchedVideosByPackageNew(package_name,count,data,db.redis.write)
            return resolve(data)
          }
        }else{
          data = await mysqlQuestionContainer.getMostWatchedVideosByPackageNew(package_name,count,old_day_count,db.mysql.read)
          return resolve(data)
        }
      } catch (e) {
        console.log(e)

        reject(e)
      }
    })
  }

}
