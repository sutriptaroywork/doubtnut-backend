//image name format
//upload_{student_id}_{timestamp}.png
const request = require('request')
const aws = require('aws-sdk');
const bluebird = require("bluebird");
const mysql = require('mysql');
const _ = require('lodash')
const queueUrl = 'https://sqs.ap-south-1.amazonaws.com/942682721582/QUESTION_ASKED'
const maxNumberOfMessages = 10
const visibilityTimeout = 50
aws.config.setPromisesDependency(bluebird);
console.log("yoyo")
aws.config.update({
  accessKeyId: 'AKIAIVUFSD5BLE3YE5BQ',
  secretAccessKey: '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',
  region: 'ap-south-1',
  signatureVersion: 'v4'
});
const sqs = new aws.SQS();
console.log("hi")
 const config = {
  host: "dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "dn-prod",
  password: "D0ubtnut@2143",
  database: "classzoo1"
}
let conn = mysql.createConnection(config);

main()
async function main(){
    // await connect()
    return new Promise(async function(resolve, reject) {
        try {
          console.log("inside")
           let questions = await getQuestions()
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

async function getQuestions(){
    var params = {
      QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/942682721582/QUESTION_ASKED_DLQ', /* required */
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


async function buildQuery(questions){
    let questionsMeta = []
    let qValues = []
    let tValues = []
    let nValues = []
    // console.log(questions)
    for (var i in questions) {
        let questionMeta = {
            "Id": questions[i].MessageId,
            "ReceiptHandle": questions[i].ReceiptHandle
        }
        console.log(questions[i])
        questionsMeta.push(questionMeta)
        let object = JSON.parse(questions[i].Body)
        object = JSON.parse(object.Message)
        let values= []
        values.push((typeof object.data.student_id !== 'undefined') ? object.data.student_id : null)
        values.push((typeof object.data.subject !== 'undefined') ? object.data.subject : 'MATHS')
        values.push((typeof object.data.class !== 'undefined') ? object.data.class : null)
        values.push((typeof object.data.book !== 'undefined') ? object.data.book : null)
        values.push((typeof object.data.chapter !== 'undefined') ? object.data.chapter : null)
        values.push((typeof object.data.question !== 'undefined') ? object.data.question : null)
        values.push((typeof object.data.doubt !== 'undefined') ? object.data.doubt : null)
        values.push((typeof object.data.locale !== 'undefined') ? object.data.locale : null)
        values.push((typeof object.data.question_id !== 'undefined') ? object.data.question_id : null)
        values.push((typeof object.data.question_image !== 'undefined') ? object.data.question_image : null)
        values.push((typeof object.data.ocr_done !== 'undefined') ? object.data.ocr_done : null)
        values.push((typeof object.data.ocr_text !== 'undefined') ? object.data.ocr_text : null)
        values.push((typeof object.data.original_ocr_text !== 'undefined') ? object.data.original_ocr_text : null)
        values.push(object.uuid)
        values.push(object.timestamp)
        qValues.push(values)
        // console.log(values)
    }
    if(qValues.length > 0){
      await insertToDB(qValues)
    }
    await removeFromQueue(questionsMeta)
    // console.log(qValues)
}

async function insertToDB(qValues){
  console.log(qValues)
    var sql = "INSERT INTO questions_asked (student_id, class, subject, book, chapter, question, doubt, locale, question_id, question_image, ocr_done, ocr_text, original_ocr_text, uuid, timestamp) VALUES ?";
    console.log("sql",sql)
    return new Promise(function (resolve, reject) {
        conn.query(sql, [qValues], async function(err) {
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

async function insertTextQuestionsToDB(qValues){
  console.log(qValues)
    var sql = "INSERT INTO questions_asked (student_id, class, subject, book, chapter, question, doubt, locale, question_id, ocr_done, ocr_text, original_ocr_text, uuid, timestamp) VALUES ?";
    console.log("sql1",sql)
    return new Promise(function (resolve, reject) {
        conn.query(sql, [qValues], async function(err) {
            // conn.end();
            // if (err) reject(err) else resolve(true)
            // await removeFromQueue(questionMeta);
            if (err){
                console.log(err);
                // conn.end()
                reject(err)
            }else{
                resolve() 
            }     
        });
    });
}

async function removeFromQueue(questionMeta){
    console.log(questionMeta)
    var params = {
      Entries:questionMeta,
      QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/942682721582/QUESTION_ASKED_DLQ'
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
