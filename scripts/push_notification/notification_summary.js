"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const MongoClient = require("mongodb").MongoClient
const _ = require("lodash")
var sendgrid = require("sendgrid")(config.send_grid_key);
var helper = require("sendgrid").mail
const moment = require("moment")
const fs = require("fs")
var request = require("request")

let mongoDbClient = connectMongo()
let db

async function connectMongo() {
    
    MongoClient.connect(config.mongo.database_url,{useNewUrlParser: true},{useUnifiedTopology: true},async function (err, c) {
        console.log("Connected successfully to server")
   
         mongoDbClient = c;
        db = mongoDbClient.db(config.mongo.database_name)
        let oldDataJson =[], oldDataSample, newDataJson =[], newDataSample
        let oldData = await generateNotificationDetails(db)
        // for(let i=0;i<oldData.length;i++){
        //   oldDataSample ={}
        //   oldDataSample.title = oldData[i].title
        //   oldDataSample.count = oldData[i].count
        //   oldDataJson.push(oldDataSample)
        // }
       
        for(let i=0;i<oldData.length;i++){
          
          let oldPerDayCount = await getPerDayDetails(db, oldData[i].title)
          oldDataSample ={}
          oldDataSample.title = oldData[i].title
          oldDataSample.count = oldPerDayCount
          oldDataJson.push(oldDataSample)
          
        }
       
         await new Promise(done => setTimeout(done, 30000))
         
         for(let i=0;i<oldData.length;i++){
        
          let newPerDayCount = await getPerDayDetails(db, oldData[i].title)
           newDataSample ={}
           newDataSample.count = newPerDayCount
           newDataJson.push(newDataSample)
          
        }
       
        // let newData = await generateNotificationDetails(db)
      

        // for(let i=0;i<newData.length;i++){
        //   newDataSample ={}
        //   newDataSample.title = newData[i].title
        //   newDataSample.count = newData[i].count
        //   newDataJson.push(newDataSample)
        // }

        //if(oldData.length != 0){
        await sendMail(sendgrid, "tech-alerts@doubtnut.com", oldDataJson,newDataJson, helper)
        //} 
        process.exit();       

    })
}
  

async function generateNotificationDetails(db) {
  return new Promise(async function(resolve, reject) {
    try {
      
      let title, description, sent, received, notificationJson=[], notificationSample

       db.collection("notification").aggregate([
        { $match : { "createdAt" : { $gte: new Date(moment().subtract(1, 'hours').toISOString()), $lt: new Date(moment().toISOString())} } },
        {
          $group :{_id:"$data.title",
          count:{$sum:1}}
          }])
        .toArray(function(err, result){
                    
            if(result){
                for(let i=0;i<result.length;i++){
                 
                 notificationSample={}
                 notificationSample.title =result[i]._id
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


async function getPerDayDetails(db, oldTitle) {
  return new Promise(async function(resolve, reject) {
    try {
      
      let title, description, sent, received, notificationJson=[], notificationSample


      let count_details=  db.collection('notification').find(
        {
            "data.title":oldTitle,
            "createdAt": {"$gt":new Date(moment().subtract(6, 'hours').toISOString())},
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


async function sendMail(sendgrid, toMail, oldDetails,newDetails, helper) {
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
        "<th>Notification Title</th>" +
        "<th>Total Notifications Received</th>" +
        "<th>Notification Status</th>" +
        "</tr>";

        for(let i=0;i<oldDetails.length;i++){
          
            if(oldDetails[i].count < newDetails[i].count){
              var new_html = 
                "<tr>"+
                  "<td>"+ oldDetails[i].title +"</td>"+
                  "<td>"+ oldDetails[i].count +"</td>"+
                  "<td>"+ 'In Progress'+"</td>"+
                "</tr>";

            }else{
              var new_html = 
              "<tr>"+
                "<td>"+ oldDetails[i].title +"</td>"+
                "<td>"+ oldDetails[i].count +"</td>"+
                "<td>"+'Sent'+"</td>"+
              "</tr>";
            }
            
            content_html = content_html + new_html;   

        }

        content_html = content_html + "</table>"+
        "</body>" +
        "</html>"

      let from_email = new helper.Email("autobot@doubtnut.com");
      let to_email = new helper.Email(toMail);
      let subject = "Notification Sent Count for " + new Date(moment().subtract(1, 'hours').toISOString());
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

     
