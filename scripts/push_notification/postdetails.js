"use strict";
const MongoClient = require('mongodb').MongoClient;

const url = "mongodb://35.200.139.17:27017";
const dbName = "doubtnut";
require('dotenv').config();
const database = require('../../api_server/config/database');
const Json2csvParser = require('json2csv').Parser;
const postFields =['post_id', 'post_type', 'student_id', 'student_class', 'student_username', 'is_deleted','texts','image','audio','created_at','deep_link'];
var sendgrid = require("sendgrid")("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");
var helper = require('sendgrid').mail;
const postParser = new Json2csvParser({postFields});
const moment = require('moment');
const fs = require('fs');
var request = require('request');
const con = {
  host: "https://35.200.228.199/phpmyadmin/",
  user: "doubtnut",
  password: "Iamlegend123king",
  database: "classzoo1"
}
//console.log(con);
MongoClient.connect(url, {useNewUrlParser: true}, async function (err, client) {
  try{
  if (err) {
    throw err;
  }
  else {
    const mongo = client.db(dbName);
    let postData =await getPostsData(mongo)
    //console.log(postData)
    let post_id,post_type, student_id, student_class, student_username, is_deleted, texts, image, audio, created_at, deep_link
    let link,postJson =[], sample
    for(let i =0; i<postData.length; i++){
      post_id =postData[i]['_id']
      post_type =postData[i]['type']
      student_id = postData[i]['student_id']
      student_class = postData[i]['class_group']
      student_username = postData[i]['student_username'] 
      is_deleted = postData[i]['is_deleted']
      texts = postData[i]['text']
      image = postData[i]['image']
      audio =postData[i]['audio']
      created_at =postData[i]['createdAt']
      link = await generateDeepLinks(post_id)
      //console.log(link)
      deep_link = link['url']
      sample={}
      sample.post_id= post_id
      sample.post_type= post_type
      sample.student_id= student_id
      sample.student_class= student_class
      sample.student_username=student_username
      sample.is_deleted=is_deleted
      sample.texts =texts
      sample.image= image
      sample.audio= audio
      sample.created_at=created_at
      sample.deep_link =deep_link
      //console.log(sample)
      postJson.push(sample)
    }
    console.log(postJson)
    const csv = postParser.parse(postJson);
    let postCsvName = "post_" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".csv"
    fs.writeFile(postCsvName, csv, 'utf8', function (err) {
      if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
      } else {
        console.log('post csv saved!');
        sendTheMail(sendgrid, "lorsim@doubtnut.com", postCsvName, helper)
       // getPostData(mongo, postCsvName)
      }
    })
  }
}catch(e){
  console.log(e)
}
})

function getPostsData(mongo){

return new Promise(async function (resolve, reject) {
      // Do async job
      try {
        let query = {
        "createdAt": {
        "$gt": moment().subtract(1, 'd').toDate()
         }
        }
        //console.log(query)
       mongo.collection('posts').find(query).toArray(async function (err, result) {
        if(err){
        return reject(err)
        }
        //console.log(result)
        return resolve(result)
        })
      } catch (e) {
        console.log(e)
        return reject(e)
      }
    })
}

async function generateDeepLinks(post_id){
  //console.log(post_id)
  return new Promise(async function (resolve, reject) {
  try{
  var myJSONObject = { 
  "branch_key": "key_live_cbx3cYpK30NM7Ph4H3OX7ihpqsn9tgQ4",
  "channel": "timeline_feed_share",
  "feature": "timeline_feed",
  "campaign": "app_viral",
  "data": {
    qid : post_id,
    type : "ugc"
    
  } };
request({
    url: "https://api.branch.io/v1/url",
    method: "POST",
    json: true,   // <--Very important!!!
    body: myJSONObject
}, function (error, response, body){
  if(error){
    console.log(error);
  }else{
    console.log(body);
    return resolve(body)
}
});
}catch(e){
  console.log(e)
  return reject(e)
}
})
}

function sendTheMail(sendgrid, toMail, postCsvName, helper) {
  let from_email = new helper.Email("vivek@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Post Report for "+moment().subtract(1, 'd').format("YYYY-MM-DD");
  let content = new helper.Content("text/plain", "Report for "+moment().subtract(1, 'd').format("YYYY-MM-DD"));
  var attachment = new helper.Attachment();
  var file = fs.readFileSync(postCsvName);
  var base64File = new Buffer(file).toString('base64');
  attachment.setContent(base64File);
  attachment.setType('text/csv');
  attachment.setFilename(postCsvName);
  attachment.setDisposition('attachment');
  let mail = new helper.Mail(from_email, subject, to_email, content);
  mail.addAttachment(attachment);
  var sg = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });  
  sendgrid.API(sg, function (error, response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
  })
}


