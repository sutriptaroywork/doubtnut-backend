"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'})
const config = require(__dirname+'/../../api_server/config/config')
const database = require('./database')
const MongoClient = require("mongodb").MongoClient
const _ = require("lodash")
var sendgrid = require("sendgrid")(config.send_grid_key)
var helper = require("sendgrid").mail
const moment = require("moment")
const fs = require("fs")
var request = require("request")
const conRead = config.mysql_analytics
const mysql = new database(conRead);
connectMongo()
let db
function connectMongo() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(config.mongo.database_cron_url,{ useUnifiedTopology: true },async function (err, client) {
         
        db = client.db(config.mongo.database_name)
        let oldData = await getNotificationDetails(db)
        
        let oldDataJson = await getCombinedData(db,oldData) 
       
		let sqlDataJson = await getCombinedSqlDataJson(db,mysql,oldDataJson)
        
        await sendMail(sendgrid, "tech-alerts@doubtnut.com", sqlDataJson, helper)
        await sendMail(sendgrid, "shalu@doubtnut.com", sqlDataJson, helper)
        await sendMail(sendgrid, "shobham.bali@doubtnut.com", sqlDataJson, helper)
       
   		mysql.connection.end();    
        client.close();
    })

  })
}

async function getNotificationDetails(db) {
  return new Promise(async function(resolve, reject) {
    try {
      
      let notificationJson=[], notificationSample

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

async function getCombinedData(db,oldData) {
    return new Promise(async function(resolve, reject) {
    try {
        let oldDataJson =[], oldDataSample
        for(let i=0;i<oldData.length;i++){
          oldDataSample ={}
          if(oldData[i].s_n_id == Number(oldData[i].s_n_id)){
            oldData[i].s_n_id = Number(oldData[i].s_n_id)
            if(oldData[i].s_n_id != null && isNaN(oldData[i].s_n_id ) == false && oldData[i].s_n_id>0){
              oldData[i].s_n_id = String(oldData[i].s_n_id)
              let oldPerDayCount = await getOneDayDetails(db, oldData[i].s_n_id)
              if(typeof oldPerDayCount !='undefined' && oldPerDayCount != null && oldPerDayCount !=0){
                oldDataSample.s_n_id =oldData[i].s_n_id
                oldDataSample.count = oldPerDayCount[0]['count']
                oldDataJson.push(oldDataSample)
              }
            }
          }else{
            
            if(oldData[i].s_n_id != null && isNaN(oldData[i].s_n_id ) == true && oldData[i].s_n_id!=0){
              let oldPerDayCount = await getOneDayDetails(db, oldData[i].s_n_id)
              if(typeof oldPerDayCount !='undefined' && oldPerDayCount != null && oldPerDayCount !=0){
                oldDataSample.s_n_id =oldData[i].s_n_id
                oldDataSample.count = oldPerDayCount[0]['count']
                oldDataJson.push(oldDataSample)
              }
            }
          } 
        }
        resolve(oldDataJson)
        }catch (e) {
            console.log("error",e);
        reject(e)
    }
  
  })
}

async function getOneDayDetails(db, s_n_id) {
  return new Promise(async function(resolve, reject) {
    try {
      
       let receivedSample, receivedJson =[]
       let count_details = db.collection('notification').aggregate(
        [
         { $match : { "createdAt" : { $gte: new Date(moment().subtract(1, 'd').toISOString()) }, "data.s_n_id":s_n_id } },
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

async function getCombinedSqlDataJson(db,mysql,oldDataJson){
    return new Promise(async function(resolve, reject){
        try{
         var percentageDelivered, question_id, views_videos, views_not_zero,  sqlDataJson =[]
         for(var i =0; i<oldDataJson.length; i++){
          var sqlIdDetails, sqlDataSample = {}, classTotal=[], viewsTotal =[], notZeroClass=[], viewsNotZero=[],vClass=[], vTot=[], nZclass =[], nViews =[], locale =[], localeTot=[],  nLocale =[], notZeroLocale =[]
          if(oldDataJson[i].s_n_id == Number(oldDataJson[i].s_n_id)){
            
            oldDataJson[i].s_n_id = Number(oldDataJson[i].s_n_id)
            
           if(oldDataJson[i].s_n_id != null && isNaN(oldDataJson[i].s_n_id ) == false && oldDataJson[i].s_n_id>0){
             let vidQid = await getUserJourneyDetails(db,oldDataJson[i].s_n_id)
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
                      if(vidQid !=null && vidQid[0].event == "video"){
                        question_id = vidQid[0].qid
                      }else{
                        question_id = sqlIdDetails[0].question_query.split("question_id =") 
                        question_id = question_id.pop()
                      }
                      sqlDataSample.question_id = question_id

                      views_videos = await getViewsCount(mysql,question_id)

                      if(typeof views_videos !='undefined'  && views_videos != null && views_videos !=''){
                        for(var j=0; j<views_videos.length; j++){
                          var classSample ={}, viewsSample={}, localeSample={}
                          classSample.student_class=  views_videos[j].student_class
                          viewsSample.total_view = views_videos[j].total_view
                          localeSample.lang = views_videos[j].locale
                          classTotal.push(classSample)
                          viewsTotal.push(viewsSample)
                          locale.push(localeSample)
                        }

                        sqlDataSample.locale  = locale
                      
                        sqlDataSample.class  = classTotal
                     
                        sqlDataSample.views_total  = viewsTotal

                      }else{
                       sqlDataSample.locale ="-"
                       sqlDataSample.class  ="-"
                       sqlDataSample.views_total  = "-"
                      }

                      views_not_zero = await getViewsNotZero(mysql,question_id)
                     
                      if(typeof views_not_zero !='undefined'  && views_not_zero != null && views_not_zero != ''){
                        for(var k=0;k<views_not_zero.length; k++){
                          var notZeroClassSample={}, viewsNotZeroSample={}, notZeroLocaleSample={}
                          notZeroClassSample.student_class = views_not_zero[k].student_class
                          viewsNotZeroSample.total_view =views_not_zero[k].total_view
                          notZeroLocaleSample.lang = views_not_zero[k].locale
                          notZeroClass.push(notZeroClassSample)
                          viewsNotZero.push(viewsNotZeroSample)
                          notZeroLocale.push(notZeroLocaleSample)
                        }

                        sqlDataSample.nlocale  = notZeroLocale
                       
                        sqlDataSample.not_zero_class  = notZeroClass
                    
                        sqlDataSample.views_not_zero_total  = viewsNotZero
                         
                      }else{
                        sqlDataSample.nlocale ="-"
                        sqlDataSample.not_zero_class  ="-"
                        sqlDataSample.views_not_zero_total  = "-"
                      }
                      
                }else{
                      sqlDataSample.video ='NO'
                      sqlDataSample.locale ="-"
                      sqlDataSample.class  ="-"
                      sqlDataSample.views_total  ='-'
                      sqlDataSample.nlocale ="-"
                      sqlDataSample.not_zero_class  ="-"
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
                sqlDataSample.sent = userJourneySentCount[0]['sent']
                sqlDataSample.received = userJourneyReceivedCount[0]['received']
                percentageDelivered = sqlDataSample.received /sqlDataSample.sent * 100
                percentageDelivered =parseFloat( percentageDelivered.toFixed(2) )
                sqlDataSample.percent =percentageDelivered
                if(userJourneyDetails[0].event == "video"){
                  sqlDataSample.video ='YES'
                  question_id = userJourneyDetails[0].qid
                  views_videos = await getViewsCount(mysql,question_id)
                  //sqlDataSample.views_total  =views_videos[0].total_view
                  if(typeof views_videos !='undefined'  && views_videos != null && views_videos != ''){
                    for(var j=0; j<views_videos.length; j++){
                          var classSample ={}, viewsSample={},  localeSample={}
                          classSample.student_class=  views_videos[j].student_class
                          viewsSample.total_view = views_videos[j].total_view
                          localeSample.lang = views_videos[j].locale
                          classTotal.push(classSample)
                          viewsTotal.push(viewsSample)
                          locale.push(localeSample)
                        }

                      sqlDataSample.locale  = locale
                     
                      sqlDataSample.class  = classTotal
                     
                      sqlDataSample.views_total  = viewsTotal
                  }else{
                    sqlDataSample.locale ="-"
                    sqlDataSample.class  ="-"
                    sqlDataSample.views_total  ="-"
                  }
                  views_not_zero = await getViewsNotZero(mysql,question_id)
                  if(typeof views_not_zero !='undefined'  && views_not_zero != null && views_not_zero != ''){
                    for(var k=0;k<views_not_zero.length; k++){
                          var notZeroClassSample={}, viewsNotZeroSample={}, notZeroLocaleSample ={}
                          notZeroClassSample.student_class = views_not_zero[k].student_class
                          viewsNotZeroSample.total_view =views_not_zero[k].total_view
                          notZeroLocaleSample.lang = views_not_zero[k].locale
                          notZeroClass.push(notZeroClassSample)
                          viewsNotZero.push(viewsNotZeroSample)
                          notZeroLocale.push(notZeroLocaleSample)
                        }

                     
                      sqlDataSample.nlocale  = notZeroLocale
                     
                      sqlDataSample.not_zero_class  = notZeroClass
                    
                      sqlDataSample.views_not_zero_total  = viewsNotZero
                    
                  }else{
                    sqlDataSample.nlocale ="-"
                    sqlDataSample.not_zero_class  ="-"
                    sqlDataSample.views_not_zero_total  ="-"
                  }
                  

                }else{
                      sqlDataSample.video ='NO'
                      sqlDataSample.locale ="-"
                      sqlDataSample.class  ="-"
                      sqlDataSample.views_total  ='-'
                      sqlDataSample.nlocale ="-"
                      sqlDataSample.not_zero_class  ="-"
                      sqlDataSample.views_not_zero_total  = '-'
                }
             }
          }
          sqlDataJson.push(sqlDataSample)
          // console.log("sqlIdDetails")
          // console.log(sqlIdDetails)    

        }
        resolve(sqlDataJson)
        }catch(e){
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
                    
            if(result !=null && result !=''){
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
              resolve()
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
         { $match : { "createdAt" : { $gte: new Date(moment().subtract(1, 'd').toISOString()) }, "data.s_n_id":s_n_id } },  
          
           {
             $group : {
                _id:null,
                 count : {$sum : 1},    //counts the number
                 failure : {$sum : '$response.failure'},
                 success : {$sum : '$response.success'}    //sums the amount
             }
            }
         
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
         { $match : { "createdAt" : { $gte: new Date(moment().subtract(1, 'd').toISOString()) }, "data.s_n_id":s_n_id } },
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
    
    console.log(sql)
    return mysql.query(sql)
  }

function getViewsCount(mysql,question_id){
   

    let sql ="SELECT locale,question_id,student_class,COUNT(view_id) AS total_view FROM (SELECT question_id,student_id,view_id from `video_view_stats` where created_at >=DATE_SUB(CURRENT_DATE,INTERVAL 1 DAY) and created_at<CURRENT_DATE and view_from like 'NOTIFICATION' and question_id ='"+question_id+"') as a left join (SELECT student_id,student_class,locale from students where is_web<>1) as b on a.student_id=b.student_id WHERE  b.student_class IS NOT NULL AND b.locale IS NOT NULL GROUP by b.locale,a.question_id,b.student_class"

    //console.log(sql)
    return mysql.query(sql)
  }

  function getViewsNotZero(mysql,question_id){
   

    let sql ="SELECT locale,question_id,student_class,COUNT(view_id) AS total_view FROM (SELECT question_id,student_id,view_id from `video_view_stats` where created_at >=DATE_SUB(CURRENT_DATE,INTERVAL 1 DAY) and created_at<CURRENT_DATE and view_from like 'NOTIFICATION' and  video_time>0 and question_id ='"+question_id+"') as a left join (SELECT student_id,student_class,locale from students where is_web<>1) as b on a.student_id=b.student_id WHERE  b.student_class IS NOT NULL AND b.locale IS NOT NULL GROUP by b.locale,a.question_id,b.student_class"

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
        "<th colspan='3'>Views on Video from Notification</th>" +
        "<th colspan='3'>Views on Video from Notification >0</th>" +
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
                  "<td>"+ JSON.stringify(sqlData[i].locale) +"</td>"+
                  "<td>"+ JSON.stringify(sqlData[i].class) +"</td>"+
                  "<td>"+ JSON.stringify(sqlData[i].views_total) +"</td>"+
                  "<td>"+ JSON.stringify(sqlData[i].nlocale) +"</td>"+
                  "<td>"+ JSON.stringify(sqlData[i].not_zero_class) +"</td>"+
                  "<td>"+ JSON.stringify(sqlData[i].views_not_zero_total) +"</td>"+

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
