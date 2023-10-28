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
const con = config.write_mysql
const conRead = config.mysql_analytics
const mysql = new database(con);
const mysqlRead = new database(conRead);

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
        let oldDataJson =[], oldDataSample, newDataJson =[], newDataSample,sqlDataJson=[], percentageDelivered
        for(let i=0;i<oldData.length;i++){
          
           oldDataSample ={}
          if(oldData[i].s_n_id == Number(oldData[i].s_n_id)){
            
            oldData[i].s_n_id = Number(oldData[i].s_n_id)
            
            if(oldData[i].s_n_id != null && isNaN(oldData[i].s_n_id ) == false && oldData[i].s_n_id>0){
                oldData[i].s_n_id = String(oldData[i].s_n_id)
                let oldPerDayCount = await getPerDayDetails(db, oldData[i].s_n_id)
                if(typeof oldPerDayCount !='undefined' && oldPerDayCount != null && oldPerDayCount !=0){
                  oldDataSample.s_n_id =oldData[i].s_n_id
                  oldDataSample.count = oldPerDayCount[0]['count']
                  oldDataJson.push(oldDataSample)
                }
            } 


          }else{
            
            if(oldData[i].s_n_id != null && isNaN(oldData[i].s_n_id ) == true && oldData[i].s_n_id!=0){
              let oldPerDayCount = await getPerDayDetails(db, oldData[i].s_n_id)
               if(typeof oldPerDayCount !='undefined' && oldPerDayCount != null && oldPerDayCount !=0){
                oldDataSample.s_n_id =oldData[i].s_n_id
                oldDataSample.count = oldPerDayCount[0]['count']
                oldDataJson.push(oldDataSample)
               }
            }
          }
          
          
          
        }
        console.log("oldDataJson")
        console.log(oldDataJson)
         await new Promise(done => setTimeout(done, 30000))
         
        for(let i=0;i<oldData.length;i++){
         newDataSample ={}
         if(oldData[i].s_n_id == Number(oldData[i].s_n_id)){
            
            oldData[i].s_n_id = Number(oldData[i].s_n_id)
            
           if(oldData[i].s_n_id != null && isNaN(oldData[i].s_n_id ) == false && oldData[i].s_n_id>0){
              oldData[i].s_n_id = String(oldData[i].s_n_id)
             let newPerDayCount = await getPerDayDetails(db, oldData[i].s_n_id)
              if(typeof newPerDayCount !='undefined' && newPerDayCount != null && newPerDayCount !=0){
               newDataSample.s_n_id =oldData[i].s_n_id
               newDataSample.count = newPerDayCount[0]['count']
               newDataJson.push(newDataSample)
              }
           }
         }else{
            
            if(oldData[i].s_n_id != null && isNaN(oldData[i].s_n_id ) == true && oldData[i].s_n_id!=0){
              let newPerDayCount = await getPerDayDetails(db, oldData[i].s_n_id)
              if(typeof newPerDayCount !='undefined' && newPerDayCount != null && newPerDayCount !=0){  
                newDataSample.s_n_id =oldData[i].s_n_id
                newDataSample.count = newPerDayCount[0]['count']
                newDataJson.push(newDataSample)
              }
            }
          }
          
        }
        console.log("newDataJson")
        console.log(newDataJson)
        for(let i =0; i<newDataJson.length; i++){
          if(newDataJson[i].s_n_id == Number(newDataJson[i].s_n_id)){
            
            newDataJson[i].s_n_id = Number(newDataJson[i].s_n_id)
            
           if(newDataJson[i].s_n_id != null && isNaN(newDataJson[i].s_n_id ) == false && newDataJson[i].s_n_id>0){

        	let sqlReceivedUpdate = await getReceivedUpdate(newDataJson[i].s_n_id,newDataJson[i].count, mysql)
           }
         }
        }
        for(var i =0; i<newDataJson.length; i++){
          var sqlIdDetails, sqlDataSample = {}
          if(newDataJson[i].s_n_id == Number(newDataJson[i].s_n_id)){
            
            newDataJson[i].s_n_id = Number(newDataJson[i].s_n_id)
            
           if(newDataJson[i].s_n_id != null && isNaN(newDataJson[i].s_n_id ) == false && newDataJson[i].s_n_id>0){

        	  sqlIdDetails = await getSqlIdDetails(newDataJson[i].s_n_id, mysqlRead)

              if(sqlIdDetails[0]['id']!= null){
              sqlDataSample.s_n_id =sqlIdDetails[0]['id']
              }
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
              percentageDelivered =sqlIdDetails[0]['received']/sqlIdDetails[0]['sent'] * 100
              percentageDelivered =parseFloat( percentageDelivered.toFixed(2) )
              sqlDataSample.percent =percentageDelivered

           }
          }else{
             if(newDataJson[i].s_n_id != null && isNaN(newDataJson[i].s_n_id ) == true && newDataJson[i].s_n_id!=0){

              let userJourneyDetails = await getUserJourneyDetails(db,newDataJson[i].s_n_id)
              let userJourneySentCount = await getUserJourneySentCount(db,newDataJson[i].s_n_id)
              let userJourneyReceivedCount = await getUserJourneyReceivedCount(db,newDataJson[i].s_n_id)
              sqlDataSample.s_n_id = userJourneyDetails[0]['s_n_id']
              sqlDataSample.title = userJourneyDetails[0]['title']
              sqlDataSample.message = userJourneyDetails[0]['message']
              sqlDataSample.hour = userJourneyDetails[0]['hour']
              sqlDataSample.sent = userJourneySentCount[0]['sent']
              sqlDataSample.received = userJourneyReceivedCount[0]['received']
              percentageDelivered = sqlDataSample.received /sqlDataSample.sent * 100
              percentageDelivered =parseFloat( percentageDelivered.toFixed(2) )
              sqlDataSample.percent =percentageDelivered
             }

          }
        	
          
        	sqlDataJson.push(sqlDataSample)

        }
        console.log(sqlDataJson)

           await sendMail(sendgrid, "tech-alerts@doubtnut.com", oldDataJson,newDataJson,sqlDataJson, helper)
           await sendMail(sendgrid, "shalu@doubtnut.com",oldDataJson,newDataJson, sqlDataJson, helper)
           await sendMail(sendgrid, "shobham.bali@doubtnut.com",oldDataJson,newDataJson, sqlDataJson, helper)
        
        mysql.connection.end();   
        mysqlRead.connection.end();   
        mongoDbClient.close();
 
       // process.exit()       

    })
}

async function generateNotificationDetails(db) {
  return new Promise(async function(resolve, reject) {
    try {
      
      let notificationJson=[], notificationSample

       db.collection("notification").aggregate([
         { $match : { "createdAt" : { $gte: new Date(moment().subtract(1, 'hours').toISOString()), $lt: new Date(moment().toISOString())} } },
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
      
      let receivedSample, receivedJson =[]
       let count_details = db.collection('notification').aggregate(
        [
         { $match : { "createdAt" : { $gte: new Date(moment().subtract(6, 'hours').toISOString()) }, "data.s_n_id":s_n_id } },
         {
             $group : {
                _id:null,
                 count : {$sum : 1},    //counts the number
                 received : {$sum : '$response.success'}    //sums the amount
             }
         }
        ]).toArray(function(err, result){
                    
            if(result){
                for(let i=0;i<result.length;i++){
                 receivedSample={}
                // receivedSample.count = result[i].count
                 receivedSample.count =result[i].received
                 
                 receivedJson.push(receivedSample)
              }
              
              resolve(receivedJson)
            }else{
              console.log("not found")
              resolve()
            }
            
        })   
        
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
            "createdAt": {"$gt":new Date(moment().subtract(6, 'hours').toISOString())}
            
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

      let sentSample, sentJson =[]
     
      let count_details = db.collection('notification').aggregate(
        [
         { $match : { "createdAt" : { $gte: new Date(moment().subtract(6, 'hours').toISOString()) }, "data.s_n_id":s_n_id } },  
           // {
           //    $count: "studentId"
           // }

           {
             $group : {
                _id:null,
                 count : {$sum : 1},    //counts the number
                 failure : {$sum : '$response.failure'},
                 success : {$sum : '$response.success'}    //sums the amount
             }
            }

            // { "$project" :
            //   {   
            //        _id: 0,
            //       'First' : '$response.failure',
            //       'Second' : '$response.success',
            //       'Sent' : { '$add' : [ '$response.failure', '$response.success' ] },
            //    }
            // }
        
         
        ]).toArray(function(err, result){     
            if(result){
                for(let i=0;i<result.length;i++){
                 sentSample={}
                 sentSample.sent =result[i].failure + result[i].success
                 
                 sentJson.push(sentSample)
              }
              
              resolve(sentJson)
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


async function getUserJourneyReceivedCount(db, s_n_id){
  return new Promise(async function(resolve, reject) {
    try {
      let receivedSample, receivedJson =[]
      
      let count_details = db.collection('notification').aggregate(
        [
         { $match : { "createdAt" : { $gte: new Date(moment().subtract(6, 'hours').toISOString()) }, "data.s_n_id":s_n_id } },
         {
             $group : {
                _id:null,
                 count : {$sum : 1},    //counts the number
                 received : {$sum : '$response.success'}    //sums the amount
             }
         }
        ]).toArray(function(err, result){
                    
            if(result){
                for(let i=0;i<result.length;i++){
                 receivedSample={}
                 //receivedSample.count = result[i].count
                 receivedSample.received =result[i].received
                 
                 receivedJson.push(receivedSample)
              }
              
              resolve(receivedJson)
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

function getSqlIdDetails(s_n_id,mysql){
    
    let sql ="SELECT * FROM `scheduled_notification` where id ='"+s_n_id+"'"
    
    //console.log(sql)
    return mysql.query(sql)
  }

function getReceivedUpdate(s_n_id,count, mysql){

	let sql ="UPDATE `scheduled_notification` SET received ='" + count +"' WHERE id ='" + s_n_id +"'"
	//console.log(sql)
    return mysql.query(sql)
}


async function sendMail(sendgrid, toMail, oldDetails,newDetails,sqlData, helper) {
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
        "<th>Notification Status</th>" +
        "</tr>";

        for(let i=0;i<oldDetails.length;i++){
          
            if(oldDetails[i].count < newDetails[i].count){
              var new_html = 
                "<tr>"+
                  "<td>"+ sqlData[i].s_n_id +"</td>"+
                  "<td>"+ sqlData[i].title +"</td>"+
                  "<td>"+ sqlData[i].message +"</td>"+
                  "<td>"+ sqlData[i].hour +"</td>"+
                  "<td>"+ sqlData[i].sent +"</td>"+
                  "<td>"+ sqlData[i].received +"</td>"+
                  "<td>"+ sqlData[i].percent +"</td>"+
                  "<td>"+ 'In Progress'+"</td>"+
                "</tr>";

            }else{
              var new_html = 
              "<tr>"+
                "<td>"+ sqlData[i].s_n_id +"</td>"+
                "<td>"+ sqlData[i].title +"</td>"+
                "<td>"+ sqlData[i].message +"</td>"+
                "<td>"+ sqlData[i].hour +"</td>"+
                "<td>"+ sqlData[i].sent +"</td>"+
                "<td>"+ sqlData[i].received +"</td>"+
                "<td>"+ sqlData[i].percent +"</td>"+
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
      let subject = "Notification Sent Count for " + new Date(moment().add(5, 'hours').add(30,'minutes').toISOString());
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

     
