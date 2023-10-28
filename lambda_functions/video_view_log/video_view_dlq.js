//image name format
//upload_{student_id}_{timestamp}.png
const request = require('request')
const aws = require('aws-sdk');
const bluebird = require("bluebird");
const mysql = require('mysql');
const _ = require('lodash')
aws.config.setPromisesDependency(bluebird);
console.log("yoyo")
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

// exports.handler = async (event, context) => {
//     console.log(event)
//     console.log("hihihihhi")
//     console.log(context)
//     console.log("hihihihhi")
//      try {
//            let views = event.Records
//            console.log(views)
//            if(typeof views !== "undefined" && views.length >0 ){
//                 // await connect()
//                 await buildQuery(views)
//                 // conn.end()
//            }
//            console.log("this is the end")
//         } catch (e) {
//             console.log(e)
//             // conn.end();
//             return new Promise(function (resolve, reject) {
//                 reject("Galat Scene");
//             });
//         }
// };

main()
async function main(){
    // await connect()
    return new Promise(async function(resolve, reject) {
        try {
          console.log("inside")
           let questions = await getVideos()
           console.log(questions)
           if(typeof questions.Messages !== "undefined" && questions.Messages.length >0 ){
                await buildQuery(questions.Messages)
                main()
           }else{
            resolve(true);
           }
        } catch (e) {
            console.log(e)
            // conn.end();
            return new Promise(function (resolve, reject) {
                reject("Galat Scene");
            });
        }
    });
     
}

async function getVideos(){
    var params = {
      QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/942682721582/VIDEO_VIEWS_DLQ', /* required */
      MaxNumberOfMessages: 1,
      VisibilityTimeout: 0
    };
    return new Promise(function (resolve, reject) {
        // Do async job
        sqs.receiveMessage(params, function(err, data) {
           if (err){
                console.log(err, err.stack);
                reject(err)
            }else{
                resolve(data) 
            }     
        });
    });
    
    
}


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
    let viewsMeta = []
    let vValues = []
    console.log(views)
    for (var i in views) {
        let object = JSON.parse(views[i].Body)
        object = JSON.parse(object.Message)
        if(typeof object.data !== "undefined" && typeof object.data.student_id !== 'undefined'){
            let viewMeta = {
                "Id": views[i].MessageId,
                "ReceiptHandle": views[i].ReceiptHandle
            }
            viewsMeta.push(viewMeta)
            let values= []
            values.push((typeof object.data.student_id !== 'undefined') ? object.data.student_id : null)
            values.push((typeof object.data.question_id !== 'undefined') ? object.data.question_id : 'MATHS')
            values.push((typeof object.data.answer_id !== 'undefined') ? object.data.answer_id : null)
            values.push((typeof object.data.answer_video !== 'undefined') ? object.data.answer_video : null)
            values.push((typeof object.data.video_time !== 'undefined') ? object.data.video_time : 0)
            values.push((typeof object.data.engage_time !== 'undefined') ? object.data.engage_time : 0)
            values.push((typeof object.data.parent_id !== 'undefined') ? object.data.parent_id : null)
            values.push((typeof object.data.is_back !== 'undefined') ? object.data.is_back : null)
            values.push((typeof object.data.session_id !== 'undefined') ? object.data.session_id : 0)
            values.push((typeof object.data.tab_id !== 'undefined') ? object.data.tab_id : 0)
            values.push((typeof object.data.ip_address !== 'undefined') ? object.data.ip_address : null)
            values.push((typeof object.data.source !== 'undefined') ? object.data.source : 0)
            values.push((typeof object.data.refer_id !== 'undefined') ? object.data.refer_id : 0)
            values.push((typeof object.data.view_from !== 'undefined') ? object.data.view_from : null)
            values.push((typeof object.data.referred_st_id !== 'undefined') ? object.data.referred_st_id : 0)
            values.push((typeof object.data.view_id !== 'undefined') ? object.data.view_id : null)        
            values.push(object.uuid)
            values.push(object.timestamp)
            vValues.push(values)
        }
    }
    if(vValues.length > 0){
        await insertToDB(vValues)
        await removeFromQueue(viewsMeta)
    }
}

async function insertToDB(vValues){
    var sql = "INSERT INTO video_view_logs (student_id, question_id, answer_id, answer_video, video_time, engage_time, parent_id, is_back, session_id, tab_id, ip_address, source, refer_id, view_from, referred_st_id, view_id, uuid,timestamp) VALUES ?";
    return new Promise(function (resolve, reject) {
        conn.query(sql, [vValues], async function(err) {
            // conn.end();
            // if (err) reject(err) else resolve(true)
            // await removeFromQueue(questionMeta);
            if (err){
                console.log(err.code);
                // conn.end()
                if (err.code == "ER_DUP_ENTRY"){
                  resolve(true)
                }else{
                  reject(err)   
                }
            }else{
                console.log("success")
                resolve(true) 
            }     
        });
    });
}

async function removeFromQueue(viewMeta){
    console.log(viewMeta)
    var params = {
      Entries:viewMeta,
      QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/942682721582/VIDEO_VIEWS_DLQ'
    };
    return new Promise(function (resolve, reject) {
        sqs.deleteMessageBatch(params, function(err, data) {
            if (err){
                console.log(err, err.stack);
                reject(err)
            }else{
                resolve(data) 
            }     
        });
    });
}




