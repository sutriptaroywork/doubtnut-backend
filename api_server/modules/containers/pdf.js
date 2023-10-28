const _ = require('lodash')
const config = require('../../config/config')
const mysql = require("../mysql/pdf")
const redis = require("../redis/pdf")

module.exports = class Answer {
  constructor() {
  }
  
  static async getSuperSeriesData(type1,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getSuperSeriesDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getSuperSeriesDataType(description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setSuperSeriesDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getSuperSeriesDataType(description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }
  static async getJeeMains2019AprilData(type1,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getJeeMains2019AprilDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getJeeMains2019AprilDataType(description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setJeeMains2019AprilDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getJeeMains2019AprilDataType(description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  static async getNeet2019AprilData(type1,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getNeet2019AprilDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getNeet2019AprilDataType(description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setNeet2019AprilDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getNeet2019AprilDataType(description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  static async getMockTestData(type1,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getMocktestDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getMocktestDataType(description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setMocktestDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getMocktestDataType(description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  static async getJeeMainsPrevYearData(type1,action_activity,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getJeeMainsPrevYearDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getJeeMainsPrevYearDataType(action_activity,description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setJeeMainsPrevYearDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getJeeMainsPrevYearDataType(action_activity,description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  static async getJeeAdvPrevYearData(type1,action_activity,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getJeeAdvPrevYearDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getJeeAdvPrevYearDataType(action_activity,description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setJeeAdvPrevYearDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getJeeAdvPrevYearDataType(action_activity,description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }  

  static async getFormulaSheetData(type1,action_activity,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getFormulaSheetDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getFormulaSheetDataType(action_activity,description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setFormulaSheetDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getFormulaSheetDataType(action_activity,description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async getCutOffListData(type1,action_activity,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getCutOffListDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getCutOffListDataType(action_activity,description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setCutOffListDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getCutOffListDataType(action_activity,description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async get12PrevYearData(type1,action_activity,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.get12PrevYearDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.get12PrevYearDataType(action_activity,description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.set12PrevYearDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.get12PrevYearDataType(action_activity,description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async get12SamplePaperData(type1,action_activity,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.get12SamplePaperDataType(type1,student_class,db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.get12SamplePaperDataType(action_activity,description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.set12SamplePaperDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.get12SamplePaperDataType(action_activity,description,type,student_class, limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async get12MostImportantQuestionData(type1,action_activity,description,type,student_class,limit,db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.get12MostImportantQuestionDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            // console.log(" not exist")
            // console.log("==============================Inside Most important question");
            answer = await mysql.get12MostImportantQuestionDataType(action_activity,description,type,student_class,limit,db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.set12MostImportantQuestionDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.get12MostImportantQuestionDataType(action_activity,description,type,student_class,limit,db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

static async get10BoardPrevYearData(type1,action_activity,description,type,limit,student_class, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.get10BoardPrevYearDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.get10BoardPrevYearDataType(action_activity,description,type,limit,student_class, db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.set10BoardPrevYearDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.get10BoardPrevYearDataType(action_activity,description,type,limit,student_class, db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async get10SamplePaperData(type1,action_activity,description,type,limit,student_class, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.get10SamplePaperDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.get10SamplePaperDataType(action_activity,description,type,limit,student_class, db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.set10SamplePaperDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.get10SamplePaperDataType(action_activity,description,type,limit,student_class, db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async get10MostImportantQuestionData(type1,action_activity,description,type,limit,student_class, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.get10MostImportantQuestionDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.get10MostImportantQuestionDataType(action_activity,description,type,limit,student_class, db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.set10MostImportantQuestionDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.get10MostImportantQuestionDataType(action_activity,description,type,limit,student_class, db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async getIBPSClerkSpecialData(type1,action_activity,description,type,limit,student_class, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getIBPSClerkSpecialDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getIBPSClerkSpecialDataType(action_activity,description,type,limit,student_class, db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setIBPSClerkSpecialDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getIBPSClerkSpecialDataType(action_activity,description,type,limit,student_class, db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async getConceptBoosterPdfData(type1,action_activity,description,type,limit,student_class, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getConceptBoosterPdfDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getConceptBoosterPdfDataType(action_activity,description,type,limit,student_class, db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setConceptBoosterPdfDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getConceptBoosterPdfDataType(action_activity,description,type,limit,student_class, db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async getNcertSolutionsPdfData(type1,action_activity,description,type,limit,student_class, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getNcertSolutionsPdfDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getNcertSolutionsPdfDataType(action_activity,description,type,limit,student_class, db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setNcertSolutionsPdfDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getNcertSolutionsPdfDataType(action_activity,description,type,limit,student_class, db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

  static async getClass9FoundationCourseData(type1,action_activity,description,type,limit,student_class, db) {
    //first try to get from redis
    return new Promise(async function (resolve, reject) {
      // Do async job
      try {

        let answer
        if (config.caching) {
          answer = await redis.getClass9FoundationCourseDataType(type1,student_class, db.redis.read)
          // console.log("redis answer")
          // console.log(answer)
          if (!_.isNull(answer)) {
            console.log("exist")
            return resolve(JSON.parse(answer))
          } else {
            //get from mysql
            console.log(" not exist")
            answer = await mysql.getClass9FoundationCourseDataType(action_activity,description,type,limit,student_class, db.mysql.read)
            // console.log("mysql answer")
            // console.log(answer)
            if(answer.length > 0){
              //set in redis
              await redis.setClass9FoundationCourseDataType(type1,student_class,answer, db.redis.write)
            }
            return resolve(answer)
          }
        } else {
          console.log(" not exist")
          answer = await mysql.getClass9FoundationCourseDataType(action_activity,description,type,limit,student_class, db.mysql.read)
          // console.log("mysql answer")
          // console.log(answer)
          return resolve(answer)
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  } 

}
