/**
 * @Author: Meghna Gupta
 * @Date:   2020-03-03
 * @Email:  meghna.gupta@doubtnut.com
 * @Last modified by: Meghna Gupta
 * @Last modified date: 2020-03-04
 */

"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const Database = require(__dirname+'/../../api_server/config/database');
const mysql = new Database(config.mysql_analytics);
const MongoClient = require('mongodb').MongoClient;
const ScriptsUtility = require('../search-iterations/scripts_utility');
const fields = ['Version', 'Match_Rate', 'Questions_Asked', 'Tag_Data'];
const url = 'mongodb://mongo-rs1-1.doubtnut.internal:27017,mongo-rs1-2.doubtnut.internal:27017,mongo-rs1-3.doubtnut.internal:27017/{database}?replicaSet=rs0&readPreference=secondaryPreferred&connectTimeoutMS=60000&socketTimeoutMS=60000&retryWrites=true';
// const url = 'mongodb://172.31.18.116:27017,172.31.22.139:27017/{database}?replicaSet=rs0&readPreference=secondary&connectTimeoutMS=60000&socketTimeoutMS=60000';
const dbName = 'doubtnut';
// const tagsArray = ['mathpix', 'google', 'tesseract', '6', '7', '8', '9', '10', '11', '12', '13', '14', 
//                     'option', 'stopword', 'synonym', 'question_number', 'solution', 'dictionary',
//                     'hi', 'en', 'bn', 'gu', 'kn', 'ml', 'mr', 'ne', 'pa', 'ta', 'te', 'ur', 
//                     'MATHS', 'PHYSICS', 'CHEMISTRY', 'ENGLISH', 'BIOLOGY', 'random', 'no_results'];
function getMatchRate() {
  let sql = "SELECT q,count(a.question_id),(sum(a.matched_app_questions)/count(a.question_id)) as match_rate from (SELECT question as q,question_id ,matched_app_questions FROM `questions` where timestamp>=CURRENT_DATE and hour(timestamp)=(hour(CURRENT_TIMESTAMP)-1) and doubt not like 'web' and doubt not like 'whatsapp%' and student_id>100) as a GROUP by q having count(a.question_id)>20 order by count(a.question_id) desc"
  return mysql.query(sql);
}
var utc = Date.now();
let date_ob = new Date(utc + 19800000);
// let date_ob = new Date(utc)
console.log('date obj: ', date_ob);
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let prevHour = hours - 1;
console.log('prev hour: ', prevHour);
console.log('hour: ', hours);
if(hours === 0) {
  date_ob.setDate(date_ob.getDate() - 1);
  date = ("0" + date_ob.getDate()).slice(-2);
  month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  year = date_ob.getFullYear();
  prevHour = 23;
  process.exit(0);
}

// db.question_logs_user.aggregate([
//   {
//     $match: {
//       "tags": tagsArray[index],
//       "createdAt": { 
//           $gte: new Date(new Date().setHours(prevHour, 00, 00)+19800000),
//           $lt: new Date(new Date().setHours(hours, 00, 00)+19800000)
//       } 
//     }
//   },
//   {
//     $group: {
//        _id: "$iteration_name",
//        count: { $sum: 1 }
//     }
//   }
// ])

async function getTagsData(db) {
    return new Promise(async function (resolve, reject) {
        try {
            const response = {};
            let query = [
              { 
                $match : 
                  { "createdAt" : { 
                      "$gte": new Date(new Date().setHours(prevHour, 00, 00)),
                      "$lt": new Date(new Date().setHours(hours, 00, 00)) 
                  }
                }
              },
              {
                $unwind: "$tags"
              },
             {
               $group :{
                  _id: {iteration_name: "$iteration_name", tags: "$tags"},
                  count: { $sum: 1},
                  iteration_name: { $first: "$iteration_name" },
                  tags: { $first: "$tags" },
              }
             }];
             console.log('EXECUTING QUERY:');
             console.log(query);
            db.collection("question_logs_user").aggregate(query)
             .toArray(function(err, result){
                         
                 if (result && Array.isArray(result)) {
                   result.forEach(res => {
                     if(res && res.count && res.iteration_name && res.tags) {
                       let iteration_name = res.iteration_name;
                       let tags = res.tags;
                       response[iteration_name] ? null : response[iteration_name] = {};
                       response[iteration_name][tags] = res.count;
                     }
                   });
                  return resolve(response)
                 } else {
                  console.log("not found")
                  return resolve()
                 }
                 
             }) 


          // db.collection('question_logs_user').find(query, { projection: { _id: 0, tags: 1, iteration_name: 1 } }).toArray(function(err, result) {
          //     if(result !=null && result !='') {
          //       console.log(result);
          //       result.forEach(res => {
          //         if(res && res.iteration_name && res.tags && Array.isArray(res.tags)) {
          //           let tags = res.tags;
          //           let iteration_name = res.iteration_name;
          //           response[iteration_name] ? null : response[iteration_name] = {};
          //           tags.forEach(tag => {
          //             response[iteration_name][tag] ? response[iteration_name][tag]++ : response[iteration_name][tag] = 1;
          //           });
          //         }
          //       });

          //       return resolve(response)
          //     } else {
          //       console.log("not found")
          //       return resolve()
          //     }
          //   })
        } catch (e) {
          console.log(e)
          return reject(e)
        }
      })
}


MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function (err, client) {
    try {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    else {
      const db = client.db(dbName);
      let csvData = [];
      let data;
      let hourlyData = await getMatchRate();
      let tagsData = await getTagsData(db)
      for (let index = 0; index < hourlyData.length; index++) {
        const row = hourlyData[index];
        data = {};
        data.Version = row.q;
        data.Match_Rate = row.match_rate;
        data.Questions_Asked = row['count(a.question_id)'];
        data.Tag_Data = tagsData[row.q];
        csvData.push(data);
      }
      await ScriptsUtility.createCsv(csvData, fields, ["meghna.gupta@doubtnut.com", 'uday@doubtnut.com', 'akshat@doubtnut.com'],
      `${year}-${month}-${date} Hour: ${prevHour} to ${hours}`, 'Hourly Match Rate & Tags - Version wise');
      process.exit(0);
    }
  }catch(e){
    console.log(e)
  }
  })