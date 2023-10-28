//image name format
//upload_{student_id}_{timestamp}.png
const request = require('request')
const aws = require('aws-sdk');
const bluebird = require("bluebird");
const mysql = require('mysql');
const _ = require('lodash')
aws.config.setPromisesDependency(bluebird);
console.log("yoyo1")
aws.config.update({
  accessKeyId: 'AKIAIVUFSD5BLE3YE5BQ',
  secretAccessKey: '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',
  region: 'ap-south-1',
  signatureVersion: 'v4'
});
const sqs = new aws.SQS();
 const config = {
  host: "dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "dn-prod",
  password: "D0ubtnut@2143",
  database: "classzoo1"
}
// let db = new database(config)
let conn = mysql.createConnection(config);
console.log("bye")

exports.handler = async (event, context) => {
    console.log(event)
    console.log("hihihihhi")
    console.log(context)
    console.log("hihihihhi")
     try {
           let views = event.Records
           console.log(views)
           if(typeof views !== "undefined" && views.length >0 ){
                // await connect()
                await buildQuery(views)
                // conn.end()
           }
           console.log("this is the end")
        } catch (e) {
            console.log(e)
            // conn.end();
            return new Promise(function (resolve, reject) {
                reject("Galat Scene");
            });
        }
};


async function connect()
{
    try
    {
        await new Promise((resolve, reject) => {
            conn.connect(err => {
                return err ? reject(err) : resolve()
            })
        })
    }
    catch(err)
    {
        console.log(err)
        // conn.end();
    }
}


async function buildQuery(views){
    let view_id=''
    let view_time=''
    let engage_time= ''
    let str = 'UPDATE video_view_logs SET '
    let video_time_str = "(CASE view_id "
    let engage_time_str = "(CASE view_id "
    let id_str = ""
    for (var i in views) {

        let object = JSON.parse(views[i].body)
        object = JSON.parse(object.Message)
        _.map(object.data, function(value, key) {
          if(key == "view_id"){
            view_id = value
          }else if(key == "engage_time"){
            engage_time = value
          }else{
            view_time = value
          }
         
        });
        video_time_str = video_time_str + " WHEN "+ view_id + " THEN " + view_time
        engage_time_str = engage_time_str +" WHEN "+ view_id + " THEN " + engage_time
        id_str = id_str+view_id + ","
    }
    video_time_str = video_time_str+ " END)"
    engage_time_str = engage_time_str + " END)"
    id_str = id_str.substring(0, id_str.length - 1);
    if(id_str.length > 0){
      let query = str+"video_time="+video_time_str+ ", engage_time="+engage_time_str+ " WHERE view_id IN ("+id_str+ ")"
      console.log("query ", query)
      await insertToDB(query)      
    }
}

async function insertToDB(query){
    return new Promise(function (resolve, reject) {
        conn.query(query, async function(err) {
            // conn.end();
            // if (err) reject(err) else resolve(true)
            // await removeFromQueue(questionMeta);
            if (err){
                console.log(err);
                // conn.end()
                reject(err)
            }else{
                resolve(true) 
            }     
        });
    });
}




