"use strict";

const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash')
const url = "mongodb://35.200.139.17:27017";
const dbName = "doubtnut";
// var AWS = require('aws-sdk');
require('dotenv').config();
// console.log(process.env.SEND_GRID_KEY)
// var email = require('mailer');
const database = require('../../api_server/config/database');
const Json2csvParser = require('json2csv').Parser;
const likeFields = ['post_id', 'post_type', 'student_id', 'student_class', 'locale', 'liked_at', 'post_title', 'post_text', 'post_image', 'post_start_date'];
const commentFields = ['post_id', 'post_type', 'comment_id', 'student_id', 'student_class', 'locale', 'comment_text', 'commented_at', 'post_title', 'post_text', 'post_image', 'post_start_date'];
const postFields =['post_id', 'post_type', 'student_id', 'student_class', 'student_username', 'is_deleted','texts','image','audio','created_at','deep_link'];

var sendgrid = require("sendgrid")("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");
var helper = require('sendgrid').mail;

const likeParser = new Json2csvParser({likeFields});
const commentParser = new Json2csvParser({commentFields});
const postParser = new Json2csvParser({postFields});

const moment = require('moment');
const fs = require('fs');
var request = require('request');
var excel = require('exceljs');
var workbook = new excel.Workbook(); //creating workbook
var likesheet = workbook.addWorksheet('Likes' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
var commentsheet = workbook.addWorksheet('Comments' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
var postsheet = workbook.addWorksheet('Posts' + moment().subtract(1, 'd').format("YYYY-MM-DD"))
var tempfile =require('tempfile')
//let res
const con = {
  host: "dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "doubtnut",
  password: "Iamlegend123king",
  database: "classzoo1"
}
//console.log(con);
const mysql = new database(con);
//console.log(url)
MongoClient.connect(url, {useNewUrlParser: true}, async function (err, client) {
  if (err) {
    throw err;
  }
  else {
    try{
    const mongo = client.db(dbName);
    let likeFile = await generateLikeCsv(mysql)
    let commentFile = await generateCommentCsv(mongo)
    let postFile = await generatePostCsv(mongo)
   // await trendingVideoInserterCaller(mysql)
   
   // var tempFilePath =tempfile('.xlsx')
   var tempFilePath = "Report_" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".xlsx"
    console.log("tempFilePath:", tempFilePath)
    workbook.xlsx.writeFile(tempFilePath).then(function(res){
      // res.sendFile(tempFilePath, function(err){
      //   console.log('----------error downloading file:', err)
      // })
      sendMail(sendgrid, "lorsim@doubtnut.com", tempFilePath, helper)
      console.log('Workbook created with all sheets')
    })


    mysql.close()
    client.close()
   // sendMail(sendgrid, "lorsim@doubtnut.com", tempFilePath, helper)
    // sendMail(sendgrid, "gagan@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "uday@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "aditya@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "tanushree@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "akansha@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "gunjan@doubtnut.com",likeFile, commentFile,postFile, helper)
  }catch(e){
    console.log(e)
  }
  }
})

async function generateLikeCsv(mysql) {
  return new Promise(async function (resolve, reject) {
    try {
      let likeData = await getLikeData(mysql)
      let engDetails, post_id, post_type, liked_at, student_id, student_class, student_locale
      let post_title, post_text, en_image, start_date
      let likeJson = [], sample
      for (let i = 0; i < likeData.length; i++) {
        post_id = likeData[i]['resource_id']
        post_type = likeData[i]['resource_type']
        student_id = likeData[i]['student_id']
        student_class = likeData[i]['student_class']
        student_locale = likeData[i]['locale']
        liked_at = likeData[i]['created_at']
        engDetails = await getEngagementPostsDetails(likeData[i]['resource_id'], likeData[i]['resource_type'], mysql)
        post_title = (engDetails.length > 0) ? engDetails[0]['en_title'] : "null"
        post_text = (engDetails.length > 0) ? engDetails[0]['en_text'] : "null"
        en_image = (engDetails.length > 0) ? engDetails[0]['en_image'] : "null"
        start_date = (engDetails.length > 0) ? engDetails[0]['start_date'] : "null"
        start_date = (engDetails.length > 0) ? engDetails[0]['start_date'] : "null"
        sample = {}
        sample.post_id = post_id
        sample.post_type = post_type
        sample.student_id = student_id
        sample.student_class = student_class
        sample.student_locale = student_locale
        sample.liked_at = liked_at
        sample.post_title = post_title
        sample.post_text = post_text
        sample.post_image = en_image
        sample.post_start_date = start_date
        likeJson.push(sample)
      }

     // console.log(sample)
      // const csv = likeParser.parse(likeJson);
      // let likeCsvName = "like_" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".csv"
      likesheet.addRow().values =_.keys(likeJson[0])
      
       _.forEach(likeJson,function(item){
        var valueArray =[]
        valueArray = _.values(item)
        likesheet.addRow().values =valueArray
      })
      workbook.xlsx.writeFile('./templike.xlsx').then(function(){
        console.log('likesheet is written')
      })
      // fs.writeFile(likeCsvName, csv, 'utf8', function (err) {
      //   if (err) {
      //     console.log('Some error occured - file either not saved or corrupted file saved.');
      //   } else {
      //     console.log('like csv saved!');
      //     resolve(likeCsvName)
      //      //  // getCommentData(client, mongo, likeCsvName)
      //   }
      // })
      resolve(likesheet)
    } catch (e) {
      reject(e)
    }
  })
}

async function generateCommentCsv(mongo) {
  return new Promise(async function (resolve, reject) {
    try {
      let query = {
        "createdAt": {
          "$gt": moment().subtract(1, 'd').toDate()
        }
      }
      //console.log(query)
      mongo.collection('comments').find(query).toArray(async function (err, result) {
        let engDetails, studentData
        let post_id, post_type, comment_id, student_id, comment_text, commented_at, student_class, student_locale
        let post_title, post_text, en_image, start_date
        let commentJson = [], sample
        //console.log(result)
        if (result.length > 0) {
          for (let i = 0; i < result.length; i++) {
            if (result[i]['student_id'] != 99) {
              post_id = result[i]['entity_id']
              post_type = result[i]['entity_type']
              comment_id = result[i]['_id']
              student_id = result[i]['student_id']
              comment_text = result[i]['message']
              commented_at = result[i]['createdAt']
              studentData = await getStudentData(student_id, mysql)
              engDetails = await getEngagementPostsDetails(post_id, post_type, mysql)
              post_title = (engDetails.length > 0) ? engDetails[0]['en_title'] : "null"
              post_text = (engDetails.length > 0) ? engDetails[0]['en_text'] : "null"
              en_image = (engDetails.length > 0) ? engDetails[0]['en_image'] : "null"
              start_date = (engDetails.length > 0) ? engDetails[0]['start_date'] : "null"
              student_class = (studentData.length > 0) ? studentData[0]['student_class'] : "null"
              student_locale = (studentData.length > 0) ? studentData[0]['locale'] : "null"
              sample = {}
              sample.post_id = post_id
              sample.post_type = post_type
              sample.comment_id = comment_id
              sample.student_id = student_id
              sample.student_class = student_class
              sample.student_locale = student_locale
              sample.comment_text = comment_text
              sample.commented_at = commented_at
              sample.post_title = post_title
              sample.post_text = post_text
              sample.post_image = en_image
              sample.post_start_date = start_date
              commentJson.push(sample)
            }
          }
           // //console.log(sample)
          // const csv = commentParser.parse(commentJson);
          // let commentCsvName = "comment_" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".csv"
          // // // let commentCsvName = "my_file.csv"
          // fs.writeFile(commentCsvName, csv, 'utf8', function (err) {
          //   if (err) {
          //     console.log('Some error occured - file either not saved or corrupted file saved.');
          //   } else {
          //     console.log('Comment csv saved');
          //   //  // console.log('Ran on ' + moment().subtract(1, 'd').format("YYYY-MM-DD"));
          //   //   //send mail now
          //   // // sendMail(sendgrid, "vivek@doubtnut.com", likeFile, commentCsvName, helper)
          //   //  // sendMail(sendgrid, "gagan@doubtnut.com",likeFile, commentCsvName, helper)
          //   //  // sendMail(sendgrid, "uday@doubtnut.com",likeFile, commentCsvName, helper)
          //   //  // sendMail(sendgrid, "aditya@doubtnut.com",likeFile, commentCsvName, helper)
          //   //  // sendMail(sendgrid, "tanushree@doubtnut.com",likeFile, commentCsvName, helper)
          //   //  // sendMail(sendgrid, "akansha@doubtnut.com",likeFile, commentCsvName, helper)
          //   //  // sendMasendgrid, "gunjan@doubtnut.com",likeFile, commentCsvName, helper)
          //     resolve(commentCsvName)
          //   }
          // })
          commentsheet.addRow().values =_.keys(commentJson[0])
      _.forEach(commentJson,function(item){
        var valueArray =[]
        valueArray = _.values(item)
        commentsheet.addRow().values =valueArray
      })
      workbook.xlsx.writeFile('./tempcomment.xlsx').then(function(){
        console.log('commentsheet is written')
      })
        resolve(commentsheet)
        } else {
          console.log("no data")
          resolve(false)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

async function generatePostCsv(mongo){
  return new Promise(async function (resolve, reject) {
    try {
      let postData =await getPostData(mongo)
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
        link = await generateDeepLink(post_id)
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
        postJson.push(sample)

      }
      ////console.log(postJson)
      // const csv = postParser.parse(postJson);
      // let postCsvName = "post_" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".csv"
      // fs.writeFile(postCsvName, csv, 'utf8', function (err) {
      //   if (err) {
      //     console.log('Some error occured - file either not saved or corrupted file saved.');
      //   } else {
      //     console.log('post csv saved!');
      //    // // getPostData(mongo, postCsvName)
      //    // // sendMail(sendgrid, "lorsim@doubtnut.com", postCsvName, helper)
      //     resolve(postCsvName)
      //   }
      // })
      // postsheet.addRow().values =Object.Keys(sample[0])
       postsheet.addRow().values = _.keys(postJson[0])

       _.forEach(postJson,function(item){

        var valueArray =[]
        valueArray = _.values(item)
        postsheet.addRow().values =valueArray
      })
      workbook.xlsx.writeFile('./temppost.xlsx').then(function(){
        console.log('postsheet is written')
      })
      resolve(postsheet)
    } catch (e) {
      reject(e)
    }
  })
}
async function trendingVideoInserterCaller(mysql) {
  let st_class = ['6', '7', '8', '9', '10', '11', '12', '14'];
  for (let i = 0; i < st_class.length; i++) {
    // trendingVideoInserter(st_class[i], mysqldb);
    let data = await getCourseDetails(st_class[i], mysql)
    for (let j = 0; j < data.length; j++) {
      let qid = data[j]['question_id'];
      let course = "";
      if (data[j]['course'] == "JEE Mains" || data[j]['course'] == "JEE Advance")
        course = "IIT";
      else
        course = data[j]['course'];
      await trendingVideosInserter(st_class[i], course, qid, mysql)
    }
  }
}
function getPostData(mongo){

  return new Promise(async function (resolve, reject) {
    // Do async job
    try {
      let query = {
        "createdAt": {
          "$gt": moment().subtract(1, 'd').toDate()
        }
      }
      mongo.collection('posts').find(query).toArray(async function (err, result) {
        if(err){
          return reject(err)
        }
        return resolve(result)
      })
    } catch (e) {
      console.log(e)
      return reject(e)
    }
  })
}
async function generateDeepLink(post_id){
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
    //console.log(body);
    return resolve(body)
}
});
}catch(e){
  console.log(e)
  return reject(e)
}
})
}
function getCourseDetails(class1, mysql) {
  let sql = "select b.question_id, b.target_course, count(b.view_id) as views_count from (SELECT a.question_id,questions_meta.target_course,a.view_id,a.created_at FROM (select * from video_view_stats where date(created_at)=date_sub(CURRENT_DATE, INTERVAL 1 DAY)) as a LEFT JOIN questions_meta on a.question_id=questions_meta.question_id WHERE  questions_meta.class='" + class1 + "') as b left join questions as c on b.question_id=c.question_id where c.student_id <> 96 group by b.question_id order by count(b.view_id) desc limit 5";
  return mysql.query(sql)
}

function trendingVideosInserter(st_class, course, qid, mysql) {
  let sql = "insert into trending_videos (question_id,class,course) values('" + qid + "','" + st_class + "','" + course + "')";
  return mysql.query(sql)
}

function getEngagementPostsDetails(id, type, mysql) {
  let sql = "SELECT * FROM `engagement` WHERE id='" + id + "' and type = '" + type + "'"
  return mysql.query(sql)
}

function getLikeData(database) {

  let sql = "select a.resource_id, a.resource_type, a.student_id,a.created_at,b.locale,b.student_class from (SELECT resource_type,resource_id,is_like,student_id,created_at FROM `user_engagement_feedback` where is_like=1 and date(created_at)=date_sub(CURRENT_DATE, INTERVAL 1 DAY)) as a left join (select locale,student_id,student_class from students ) as b on a.student_id=b.student_id"
  //console.log(sql)
  return database.query(sql)
}


function getStudentData(student_id, database) {
  let sql = "select student_class,locale,student_id from students where student_id='" + student_id + "'"
  return database.query(sql)
}

function sendMail(sendgrid, toMail, tempFilePath, helper) {
//function sendMail(sendgrid, toMail, likeCsvName, commentCsvName, postCsvName, helper) {
  // var sendgrid = require("sendgrid")("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");
  // console.log(likeFile)
  let from_email = new helper.Email("vivek@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Like, Comment and Post Report for " + moment().subtract(1, 'd').format("YYYY-MM-DD");
  let content = new helper.Content("text/plain", "Report for " + moment().subtract(1, 'd').format("YYYY-MM-DD"));
  var attachment = new helper.Attachment();
  // var attachment2 = new helper.Attachment();
  // var attachment3 = new helper.Attachment();
  var file1 = fs.readFileSync(tempFilePath);
  // var file2 = fs.readFileSync(commentCsvName);
  // var file3 = fs.readFileSync(postCsvName);
  var base64File1 = new Buffer(file1).toString('base64');
  // var base64File2 = new Buffer(file2).toString('base64');
  // var base64File3 = new Buffer(file3).toString('base64');
  attachment.setContent(base64File1);
  attachment.setType('text/xlsx');
  // attachment2.setContent(base64File2);
  // attachment2.setType('text/csv');
  // attachment3.setContent(base64File3);
  // attachment3.setType('text/csv');
  //// attachment.setFilename('my_file.pdf');
  attachment.setFilename(tempFilePath);
  attachment.setDisposition('attachment');
  // attachment2.setFilename(commentCsvName);
  // attachment2.setDisposition('attachment');
  // attachment3.setFilename(postCsvName);
  // attachment3.setDisposition('attachment');
  let mail = new helper.Mail(from_email, subject, to_email, content);
  mail.addAttachment(attachment);
  // mail.addAttachment(attachment2);
  // mail.addAttachment(attachment3);
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


