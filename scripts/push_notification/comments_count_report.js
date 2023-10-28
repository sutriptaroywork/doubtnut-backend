"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require("./database");
const MongoClient = require("mongodb").MongoClient;
const _ = require("lodash");
var sendgrid = require("sendgrid")(config.send_grid_key);
var helper = require("sendgrid").mail;
const moment = require("moment");
const fs = require("fs");
var request = require("request");
var excel = require("exceljs");
var workbook = new excel.Workbook(); //creating workbook

var likecountsheet = workbook.addWorksheet(
  "Like Count" +
    moment()
      .subtract(1, "d")
      .format("YYYY-MM-DD")
);
var commentcountsheet = workbook.addWorksheet(
  "Comment Count" +
    moment()
      .subtract(1, "d")
      .format("YYYY-MM-DD")
);
var imagecountsheet = workbook.addWorksheet(
  "Image Url" +
    moment()
      .subtract(1, "d")
      .format("YYYY-MM-DD")
);

const conRead = config.mysql_analytics
const mysqlRead = new database(conRead);
var promises = [];


MongoClient.connect(config.mongo.database_url,{ useUnifiedTopology: true }, { useNewUrlParser: true }, async function(err,client) {
  if (err) {
    console.log(err);
  } else {
   const mongo = client.db(config.mongo.database_name);
    promises.push(getLikeDetails(mysqlRead,mongo))
    promises.push(getCommentDetails(mysqlRead,mongo))
  
    await Promise.all(promises)


    var tempFilePath = "Count Report_" + moment().subtract(1, "d").format("YYYY-MM-DD") +".xlsx";
    console.log("tempFilePath:", tempFilePath);
    await workbook.xlsx.writeFile(tempFilePath);
    console.log("send mail");

     await sendMail(sendgrid, "vivek@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "gagan@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "akansha@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "gunjan@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "isha@doubtnut.com", tempFilePath, helper);
     // await sendMail(sendgrid, "intern@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "shivangi.bathla@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "shobhit.gaur@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "jasleen.singh@doubtnut.com", tempFilePath, helper);
    
    const files = [
      "templikecount.xlsx","tempcommentcount.xlsx","tempimagecount.xlsx",  tempFilePath
    ];
    files.forEach(function(filePath) {
      fs.access(filePath, error => {
        if (!error) {
          fs.unlinkSync(filePath, function(error) {
            console.log(error);
          });
        } else {
          console.log(error);
        }
      });
    });
    	mysqlRead.connection.end();    
    client.close();
    
    }
    
});


async function getLikeDetails(mysql,mongo) {
  try {
		let likeData = await getLikes(mysql);
		let engDetails,likeJson = [],sample, newAppLikeData;
		for (let i = 0; i < likeData.length; i++) {
		engDetails = await getPostsDetails(mysql,likeData[i]["resource_id"],likeData[i]["resource_type"]);
		sample = {};
		sample.post_id = likeData[i]["resource_id"];
		sample.post_type = likeData[i]["resource_type"];
		sample.post_title = engDetails.length > 0 ? engDetails[0]["en_title"] : "null";
		sample.post_text = engDetails.length > 0 ? engDetails[0]["en_text"] : "null";
		sample.post_image = engDetails.length > 0 ? engDetails[0]["en_image"] : "null";
		sample.post_start_date = engDetails.length > 0 ? engDetails[0]["start_date"] : "null";
    if(likeData[i]["resource_type"] == 'viral_videos' && likeData[i]["resource_id"].includes('_pinned')){
      newAppLikeData = await getNewAppLikes(mongo,String(likeData[i]["resource_id"]));
      sample.total_likes = likeData[i]["total_likes"] + newAppLikeData;

    }else{
      sample.total_likes = likeData[i]["total_likes"];
    }
		likeJson.push(sample);
		}

		likecountsheet.addRow().values = _.keys(likeJson[0]);

		  _.forEach(likeJson, function(item) {
		    var valueArray = [];
		    valueArray = _.values(item);
		    likecountsheet.addRow().values = valueArray;
		  });
		workbook.xlsx.writeFile("./templikecount.xlsx").then(function() {
		    console.log("likecountsheet is written");
		    return(likecountsheet);
		});

  	} catch (e) {
      console.log(e)
    }
}

async function getNewAppLikes(mongo,id){
  try {
      let query = {
        
        entity_id:id,
       // vote:1
      };
     let result= await mongo.collection("teslarating").countDocuments(query)
     console.log(result)
     return (result);
       
    } catch (e) {
      console.log(e);
      return (e);
    }
  
}



async function getCommentDetails(mysql,mongo){
	try{

  		let result= await mongo.collection("comments").aggregate( [
         { $match : { "createdAt" : { 
         	$gt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .subtract(1, "d")
            .toDate(),
          $lt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toDate()
          }, "entity_type":{ $in: ["news", "viral_videos", "youtube"] } } },  
           
           {
             $group : {
                _id: '$entity_id',
                    //counts the number
             }
            }
         
         
        ]).toArray()
        
    	let engDetails, sample, commentJson = [], totalMessage, totalImage, totStuMsg, totStuImg;
    	
    	if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
              if (result[i]["student_id"] != 99) {
                engDetails = await getPostsDetails(mysql,result[i]["_id"]);
                totalMessage = await getTotalComment(mongo,result[i]["_id"])
                totalImage = await getTotalImage(mongo,result[i]["_id"])
                totStuMsg = await getTotalStudentMsg(mongo,result[i]["_id"])
                totStuImg = await getTotalStudentImg(mongo,result[i]["_id"])
                sample = {};
                sample.post_id = result[i]["_id"];
                sample.post_title = engDetails.length > 0 ? engDetails[0]["en_title"] : "null";
                sample.post_text = engDetails.length > 0 ? engDetails[0]["en_text"] : "null";
                sample.post_image = engDetails.length > 0 ? engDetails[0]["en_image"] : "null";
                sample.post_start_date = engDetails.length > 0 ? engDetails[0]["start_date"] : "null";
                if(typeof totalMessage !='undefined' && !_.isNull(totalMessage)){
                sample.total_comment = totalMessage
                }
                if(typeof totalImage !='undefined' && !_.isNull(totalImage)){
                sample.total_image = totalImage
                }
                sample.total_distinct_stu_comment = totStuMsg.length > 0 ? totStuMsg[0]['total'] : "null"
                sample.total_distinct_stu_img = totStuImg.length > 0 ? totStuImg[0]['total'] : "null"
                commentJson.push(sample);
                //console.log(sample)
              }
            }
       		
            commentcountsheet.addRow().values = _.keys(commentJson[0]);
            _.forEach(commentJson, function(item) {
              var valueArray = [];
              valueArray = _.values(item);
              commentcountsheet.addRow().values = valueArray;
            });
            workbook.xlsx.writeFile("./tempcommentcount.xlsx").then(function() {
              console.log("commentcountsheet is written");
              return(commentcountsheet);
            });

            let img, imgJson=[]
            for(let i =0; i< result.length; i++){
            	if (result[i]["student_id"] != 99) {
            		img = await getImagesUrl(mongo,result[i]["_id"])
            		sample = {};  
	                sample.post_id = result.length > 0 ? result[i]["_id"] : "null" ;
	                sample.img_url = img.length > 0 ? img : "null"
	                imgJson.push(sample)
            	}
            }
            console.log("finally")
            imagecountsheet.addRow().values = _.keys(imgJson[0]);
            _.forEach(imgJson, function(item) {
              var valueArray = [];
              valueArray = _.values(item);
              imagecountsheet.addRow().values = valueArray;
            });
            workbook.xlsx.writeFile("./tempimagecount.xlsx").then(function() {
              console.log("imagecountsheet is written");
              return(imagecountsheet);
            });


        } else {
            console.log("no data");
            return(false);
        }

	}  catch (e) {
      console.log(e)
    }

}

async function getImagesUrl(mongo,id){
	try{

		let query = {
	        createdAt: {
	          //"$gt": moment().subtract(1, 'd').toDate()
	          $gt: moment()
	            .utcOffset(0)
	            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
	            .subtract(1, "d")
	            .toDate(),
	          $lt: moment()
	            .utcOffset(0)
	            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
	            .toDate()
	       	},
	       	entity_id:id, 
	        entity_type:{ $in: ["news", "viral_videos", "youtube"] },
	        image: { $ne: "" }
      
      	};

      	const result = await mongo.collection("comments").find(query)
        .toArray();

        let sample,imgJson =[]
        if(result.length > 0){
	        for(let i =0; i< result.length; i++){
	        	sample={}
	        	sample.image = result.length > 0 ? result[i]["image"] : "null" ;
	        	imgJson.push(sample)

	        }
			
	    }
		console.log(imgJson)
		return(imgJson)

	}  catch (e) {
      console.log(e)
    }
}

function getLikes(database){
	let sql ="select resource_id, resource_type,COUNT(student_id) as total_likes,created_at from `user_engagement_feedback` where is_like=1 and date(created_at)=date_sub(CURRENT_DATE, INTERVAL 1 DAY) and resource_type IN ('news', 'viral_videos', 'youtube') GROUP BY resource_id";
 
  return database.query(sql);
}

function getPostsDetails(mysql,id) {
  let sql ="SELECT * FROM `engagement` WHERE id='" +id +"' and type IN ('news','viral_videos', 'youtube')";
  return mysql.query(sql);
}

async function getTotalComment(mongo,id){
	try {
      let query = {
        createdAt: {
          // "$gt": moment().subtract(1, 'd').toDate()
          $gt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .subtract(1, "d")
            .toDate(),
          $lt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toDate()
        },
        entity_id:id, 
        entity_type:{ $in: ["news", "viral_videos", "youtube"] },
        message: { $ne: "" }
      };
     let result= await mongo.collection("comments").countDocuments(query)
     console.log(result)
     return (result);
       
    } catch (e) {
      console.log(e);
      return (e);
    }
  
}

async function getTotalImage(mongo,id){
	try {
      let query = {
        createdAt: {
          // "$gt": moment().subtract(1, 'd').toDate()
          $gt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .subtract(1, "d")
            .toDate(),
          $lt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toDate()
        },
        entity_id:id, 
        entity_type: { $in: ["news", "viral_videos", "youtube"] },
        image: { $ne: "" }
      };
     let result= await mongo.collection("comments").countDocuments(query)
     console.log(result)

     return (result);
       
    } catch (e) {
      console.log(e);
      return (e);
    }
}

async function getTotalStudentMsg(mongo,id){
	try {
      
     let result= await mongo.collection("comments").aggregate( [
         { $match : { "createdAt" : { 
         	$gt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .subtract(1, "d")
            .toDate(),
          $lt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toDate()
          }, "entity_id":id, "entity_type":{ $in: ["news", "viral_videos", "youtube"] },"message": { $ne: "" } } },  
           
           {
             $group : {
                _id: null,
                 sids: {$addToSet: '$student_id'},   //counts the number
             }
            },
          {
          	$project:{
             total: {$size: '$sids'}
            }
		  }
         
        ]).toArray()

     return (result);
       
    } catch (e) {
      console.log(e);
      return (e);
    }
}

async function getTotalStudentImg(mongo,id){
	try {
      let result= await mongo.collection("comments").aggregate( [
         { $match : { "createdAt" : { 
         	$gt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .subtract(1, "d")
            .toDate(),
          $lt: moment()
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toDate()
          }, "entity_id":id, "entity_type":{ $in: ["news", "viral_videos", "youtube"] }, "image": { $ne: "" } } },  
           
          {
             $group : {
                _id:null,
                 sids: {$addToSet: '$student_id'},  
                 
             }
          },
          {
          	$project:{
             total: {$size: '$sids'}
            }
		  }
         
        ]).toArray()
     

     return (result);
       
    } catch (e) {
      console.log(e);
      return (e);
    }
}

async function sendMail(sendgrid, toMail, tempFilePath, helper) {
  return new Promise(async function(resolve, reject) {
    try {
    	 let from_email = new helper.Email("autobot@doubtnut.com");
         let to_email = new helper.Email(toMail);
         let subject ="Count Report for Like, Comment and Post" +
			moment()
			.subtract(1, "d")
			.format("YYYY-MM-DD");
      let content = new helper.Content(
        "text/plain",
        "Report for " +
          moment()
            .subtract(1, "d")
            .format("YYYY-MM-DD")
      );
      var attachment = new helper.Attachment();
     
      var file1 = fs.readFileSync(tempFilePath);
     
      var base64File1 = new Buffer(file1).toString("base64");
      
      attachment.setContent(base64File1);
      attachment.setType("text/xlsx");
      attachment.setFilename(tempFilePath);
      attachment.setDisposition("attachment");
      let mail = new helper.Mail(from_email, subject, to_email, content);
      mail.addAttachment(attachment);
      var sg = sendgrid.emptyRequest({
        method: "POST",
        path: "/v3/mail/send",
        body: mail.toJSON()
      });

      sendgrid.API(sg, function(error, response) {
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
        return resolve(mail);
      });
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}
