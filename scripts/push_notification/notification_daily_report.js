"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'})
const config = require(__dirname+'/../../api_server/config/config')
const database = require('../../api_server/config/database')
const MongoClient = require("mongodb").MongoClient
const _ = require("lodash")
var sendgrid = require("sendgrid")(config.send_grid_key)
var helper = require("sendgrid").mail
const moment = require("moment")
const fs = require("fs")
var request = require("request")
const conRead = config.mysql_analytics
const mysql = new database(conRead)

let mongoDbClient = connectMongo()
let db

async function connectMongo() {
    
    MongoClient.connect(config.mongo.database_url,{useNewUrlParser: true},{useUnifiedTopology: true},async function (err, c) {
        console.log("Connected successfully to server")
   
        mongoDbClient = c
        db = mongoDbClient.db(config.mongo.database_name)
        let oldData = await generateNotificationDetails(db)
        console.log("oldData")
        console.log(oldData)
        let oldDataJson =[], oldDataSample, newDataJson =[], newDataSample,sqlDataJson=[],percentageDelivered, question_id, views_videos, views_not_zero
        for(let i=0;i<oldData.length;i++){
          oldDataSample ={}
          if(oldData[i].s_n_id == Number(oldData[i].s_n_id)){
            oldData[i].s_n_id = Number(oldData[i].s_n_id)
            if(oldData[i].s_n_id != null && isNaN(oldData[i].s_n_id ) == false && oldData[i].s_n_id>0){
              oldData[i].s_n_id = String(oldData[i].s_n_id)
              let oldPerDayCount = await getPerDayDetails(db, oldData[i].s_n_id)
              oldDataSample.s_n_id =oldData[i].s_n_id
              oldDataSample.count = oldPerDayCount
              oldDataJson.push(oldDataSample)
            }
          }else{
            
            if(oldData[i].s_n_id != null && isNaN(oldData[i].s_n_id ) == true && oldData[i].s_n_id!=0){
              let oldPerDayCount = await getPerDayDetails(db, oldData[i].s_n_id)
              
                oldDataSample.s_n_id =oldData[i].s_n_id
                oldDataSample.count = oldPerDayCount
                oldDataJson.push(oldDataSample)
            
            }
          } 
        }
        console.log("oldDataJson")
        console.log(oldDataJson)
         
       
        for(var i =0; i<oldDataJson.length; i++){
        	var sqlIdDetails, sqlDataSample = {}
          if(oldDataJson[i].s_n_id == Number(oldDataJson[i].s_n_id)){
            
            oldDataJson[i].s_n_id = Number(oldDataJson[i].s_n_id)
            
           if(oldDataJson[i].s_n_id != null && isNaN(oldDataJson[i].s_n_id ) == false && oldDataJson[i].s_n_id>0){

              sqlIdDetails = await getSqlIdDetails(oldDataJson[i].s_n_id, mysql)
              if(sqlIdDetails[0]!= null){
                sqlDataSample.s_n_id =sqlIdDetails[0]['id']
                sqlDataSample.title =sqlIdDetails[0]['title']
                sqlDataSample.message =sqlIdDetails[0]['message']
                if(sqlIdDetails[0]['is_schedule'] == 1){
                  sqlDataSample.hour =sqlIdDetails[0]['hour']
                }else{
                  sqlDataSample.hour ="-"
                }
                if(sqlIdDetails[0]['sent']!= null){
                  sqlDataSample.sent =sqlIdDetails[0]['sent']
                }else{
                  sqlDataSample.sent ="-"
                }
                if(sqlIdDetails[0]['received']!= null){
                  sqlDataSample.received =sqlIdDetails[0]['received']
                }else{
                  sqlDataSample.received ="-"
                }
                percentageDelivered =(sqlIdDetails[0]['received'])/(sqlIdDetails[0]['sent']) *100
                percentageDelivered =parseFloat( percentageDelivered.toFixed(2) )
                sqlDataSample.percent =percentageDelivered
                if((sqlIdDetails[0].type == 'VIDEO PAGE') || (sqlIdDetails[0].type == 'video')){
                      sqlDataSample.video ='YES'
                      question_id = sqlIdDetails[0].question_query.split("question_id =") 
                      question_id = question_id.pop()
                    
                      sqlDataSample.question_id = question_id

                      views_videos = await getViewsCount(mysql,question_id)
                      
                      sqlDataSample.views_total  =views_videos[0].total_view

                      views_not_zero = await getViewsNotZero(mysql,question_id)
                      sqlDataSample.views_not_zero_total  =views_not_zero[0].total_view
                      
                }else{
                      sqlDataSample.video ='NO'
                      sqlDataSample.views_total  ='-'
                      sqlDataSample.views_not_zero_total  = '-'
                }
                
              }
            }
          }else{
             if(oldDataJson[i].s_n_id != null && isNaN(oldDataJson[i].s_n_id ) == true && oldDataJson[i].s_n_id!=0){

                let userJourneyDetails = await getUserJourneyDetails(db,oldDataJson[i].s_n_id)
                let userJourneySentCount = await getUserJourneySentCount(db,oldDataJson[i].s_n_id)
                let userJourneyReceivedCount = await getUserJourneyReceivedCount(db,oldDataJson[i].s_n_id)
                sqlDataSample.s_n_id = userJourneyDetails[0]['s_n_id']
                sqlDataSample.title = userJourneyDetails[0]['title']
                sqlDataSample.message = userJourneyDetails[0]['message']
                sqlDataSample.hour = userJourneyDetails[0]['hour']
                sqlDataSample.sent = userJourneySentCount
                sqlDataSample.received = userJourneyReceivedCount
                percentageDelivered = sqlDataSample.received /sqlDataSample.sent * 100
                percentageDelivered =parseFloat( percentageDelivered.toFixed(2) )
                sqlDataSample.percent =percentageDelivered
                if(userJourneyDetails[0].event == "video"){
                  sqlDataSample.video ='YES'
                  question_id = userJourneyDetails[0].qid
                  views_videos = await getViewsCount(mysql,question_id)
                  sqlDataSample.views_total  =views_videos[0].total_view
                  views_not_zero = await getViewsNotZero(mysql,question_id)
                  sqlDataSample.views_not_zero_total  =views_not_zero[0].total_view
                }else{
                      sqlDataSample.video ='NO'
                      sqlDataSample.views_total  ='-'
                      sqlDataSample.views_not_zero_total  = '-'
                }
             }
          }
          sqlDataJson.push(sqlDataSample)
        	// console.log("sqlIdDetails")
        	// console.log(sqlIdDetails)
        	
          

        }
        console.log(sqlDataJson)

        await sendMail(sendgrid, "tech-alerts@doubtnut.com",sqlDataJson, helper)
        await sendMail(sendgrid, "shalu@doubtnut.com",sqlDataJson, helper)
        await sendMail(sendgrid, "shobham.bali@doubtnut.com", sqlDataJson, helper)
        process.exit()       

    })
}

async function generateNotificationDetails(db) {
  return new Promise(async function(resolve, reject) {
    try {
      
      let title, description, sent, received, notificationJson=[], notificationSample

       db.collection("notification").aggregate([
         { $match : { "createdAt" : { $gte: new Date(moment().subtract(1, 'd').toISOString()), $lt: new Date(moment().toISOString())} } },
        {
          $group :{_id:"$data.s_n_id",
          count:{$sum:1}}
          }])
        .toArray(function(err, result){
                    
            if(result){
                for(let i=0;i<result.length;i++){
                 notificationSample={}
                 notificationSample.s_n_id =result[i]._id
                 notificationSample.count =result[i].count
                 
                 notificationJson.push(notificationSample)
              }
              resolve(notificationJson)
            }else{
              console.log("not found")
            }
            
        }) 
      
  }catch (e) {
    console.log("error",e);
      reject(e)
    }
  
  })
  
}

async function getPerDayDetails(db, s_n_id) {
  return new Promise(async function(resolve, reject) {
    try {
      let title, description, sent, received, notificationJson=[], notificationSample


      let count_details=  db.collection('notification').find(
        {
            "data.s_n_id":s_n_id,
            "createdAt": {"$gt":new Date(moment().subtract(1, 'd').toISOString())},
            "response.success":1
            
        }).count()

      //console.log(count_details)
      return resolve(count_details)
        
  }catch (e) {
    console.log("error",e);
      reject(e)
    }
  
  })
  
}

async function getUserJourneyDetails(db, s_n_id){
  return new Promise(async function(resolve, reject) {
    try {
      let detailsSample, detailsJson =[]
      let details=  db.collection('notification').find(
        {
            "data.s_n_id":s_n_id,
            "createdAt": {"$gt":new Date(moment().subtract(1, 'd').toISOString())}
            
        }).toArray(function(err, result){
                    
            if(result){

                 detailsSample={}
                 detailsSample.title =result[0].data.title
                 detailsSample.message =result[0].data.message
                 detailsSample.s_n_id =result[0].data.s_n_id
                 if(result[0].data.data.hour){
                 
                  detailsSample.hour =result[0].data.data.hour
                 }else{
                  
                 detailsSample.hour = "-"
                 }
                 if(result[0].data.event =="video"){
                    detailsSample.event =result[0].data.event
                    detailsSample.qid =result[0].data.data.qid
                 }
                 detailsJson.push(detailsSample)
              
              resolve(detailsJson)
            }else{
              console.log("not found")
            }
            
        }) 

      //console.log(details)
        
  }catch (e) {
    console.log("error",e);
      reject(e)
    }
  
  })
}


async function getUserJourneySentCount(db, s_n_id){
  return new Promise(async function(resolve, reject) {
    try {
      
      let count_details=  db.collection('notification').find(
        {
            "data.s_n_id":s_n_id,
            "createdAt": {"$gt":new Date(moment().subtract(1, 'd').toISOString())}
            
        }).count()

      //console.log(details)
      return resolve(count_details)
        
  }catch (e) {
    console.log("error",e);
      reject(e)
    }
  
  })
}


async function getUserJourneyReceivedCount(db, s_n_id){
  return new Promise(async function(resolve, reject) {
    try {
      
      let count_details=  db.collection('notification').find(
        {
            "data.s_n_id":s_n_id,
            "createdAt": {"$gt":new Date(moment().subtract(1, 'd').toISOString())},
            "response.success":1
            
        }).count()

      //console.log(details)
      return resolve(count_details)
        
  }catch (e) {
    console.log("error",e);
      reject(e)
    }
  
  })
}

function getSqlIdDetails(s_n_id,mysql){
    
    let sql ="SELECT * FROM `scheduled_notification` where id ='"+s_n_id+"'"
    
    console.log(sql)
    return mysql.query(sql)
  }

function getViewsCount(mysql,question_id){
   
    let sql ="SELECT COUNT(view_id) AS total_view FROM `video_view_stats` where DATE(created_at) >=DATE_SUB(CURRENT_DATE,INTERVAL 1 DAY) and DATE(created_at)< DATE(CURRENT_DATE) and view_from like 'NOTIFICATION' and question_id ='"+question_id+"'"

    //console.log(sql)
    return mysql.query(sql)
  }

  function getViewsNotZero(mysql,question_id){
    let sql ="SELECT COUNT(view_id) AS total_view FROM `video_view_stats` where DATE(created_at) >=DATE_SUB(CURRENT_DATE,INTERVAL 1 DAY) and DATE(created_at)< DATE(CURRENT_DATE) and view_from like 'NOTIFICATION' and  video_time>0 and question_id ='"+question_id+"'"

    //console.log(sql)
    return mysql.query(sql)
  }


async function sendMail(sendgrid, toMail,sqlData, helper) {
  return new Promise(async function (resolve, reject) {
    try {
      
      let content_html = "<!DOCTYPE html>" +
        "<html>" +
        "<head>" +
        "<style>" +
        "table {" +
        "width:100%;" +
        "}" +
        "table, th, td {" +
        "border: 1px solid black;" +
        "border-collapse: collapse;" +
        "}" +
        "th, td {" +
        "padding: 15px;" +
        "text-align: left;" +
        "}" +
        "table#t01 tr:nth-child(even) {" +
        "background-color: #eee;" +
        "}" +
        "table#t01 tr:nth-child(odd) {" +
        "background-color: #fff;" +
        "}" +
        "table#t01 th {" +
        "background-color: black;" +
        "color: white;" +
        "}" +
        "</style>" +
        "</head>" +
        "<body>" +
        "<h2>Report</h2>" +
        "<table>" +
        "<tr>" +
        "<th>ID</th>" +
        "<th>Notification Title</th>" +
        "<th>Notification Mesage</th>" +
        "<th>Time Scheduled</th>" +
        "<th>Sent Count</th>" +
        "<th>Received Count</th>" +
        "<th>Percentage Delivered</th>" +
        "<th>Video(Y/N)</th>" +
        "<th>Views on Video from Notification</th>" +
        "<th>Views on Video from Notification >0</th>" +
        "</tr>";

        for(let i=0;i<sqlData.length;i++){
          
              var new_html = 
                "<tr>"+
                  "<td>"+ sqlData[i].s_n_id +"</td>"+
                  "<td>"+ sqlData[i].title +"</td>"+
                  "<td>"+ sqlData[i].message +"</td>"+
                  "<td>"+ sqlData[i].hour +"</td>"+
                  "<td>"+ sqlData[i].sent +"</td>"+
                  "<td>"+ sqlData[i].received +"</td>"+
                  "<td>"+ sqlData[i].percent +"</td>"+
                  "<td>"+ sqlData[i].video +"</td>"+
                  "<td>"+ sqlData[i].views_total +"</td>"+
                  "<td>"+ sqlData[i].views_not_zero_total +"</td>"+

                "</tr>";

           
            content_html = content_html + new_html;   

        }

        content_html = content_html + "</table>"+
        "</body>" +
        "</html>"

      let from_email = new helper.Email("autobot@doubtnut.com");
      let to_email = new helper.Email(toMail);
      let subject = "Notification Summary for " + new Date(moment().subtract(1, 'd').toISOString());
      let content = new helper.Content("text/html", content_html)
      let mail = new helper.Mail(from_email, subject, to_email, content);
    
      var sg = sendgrid.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
      });

      sendgrid.API(sg, function (error, response) {
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
        return resolve(mail)
      })
    } catch (e) {
      console.log(e)
      reject(e)
    }
  })
}

     
