"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const MongoClient = require("mongodb").MongoClient;
// var AWS = require('aws-sdk');
// console.log(process.env.SEND_GRID_KEY)
// var email = require('mailer');
const database = require("./database");
const _ = require("lodash");
const Json2csvParser = require("json2csv").Parser;
const likeFields = [
  "post_id",
  "post_type",
  "student_id",
  "student_class",
  "locale",
  "liked_at",
  "post_title",
  "post_text",
  "post_image",
  "post_start_date"
];
const commentFields = [
  "post_id",
  "post_type",
  "comment_id",
  "student_id",
  "student_class",
  "locale",
  "comment_text",
  "commented_at",
  "post_title",
  "post_text",
  "post_image",
  "post_start_date"
];
const postFields = [
  "post_id",
  "post_type",
  "student_id",
  "student_class",
  "student_username",
  "is_deleted",
  "texts",
  "image",
  "audio",
  "created_at",
  "deep_link"
];

var sendgrid = require("sendgrid")(config.send_grid_key);
var helper = require("sendgrid").mail;

const likeParser = new Json2csvParser({ likeFields });
const commentParser = new Json2csvParser({ commentFields });
const postParser = new Json2csvParser({ postFields });

const moment = require("moment");
const fs = require("fs");
var request = require("request");
var excel = require("exceljs");
var workbook = new excel.Workbook(); //creating workbook
var likesheet = workbook.addWorksheet(
  "Likes" +
    moment()
      .subtract(1, "d")
      .format("YYYY-MM-DD")
);
var unansweredsheet = workbook.addWorksheet(
  "Unanswered" +
    moment()
      .subtract(1, "d")
      .format("YYYY-MM-DD")
);
var categorysheet =  workbook.addWorksheet(
  "Youtube Category" +
    moment()
      .subtract(1, "d")
      .format("YYYY-MM-DD")
);
var commentsheet = workbook.addWorksheet(
  "Comments" +
    moment()
      .subtract(1, "d")
      .format("YYYY-MM-DD")
);
var postsheet = workbook.addWorksheet(
  "Posts" +
    moment()
      .subtract(1, "d")
      .format("YYYY-MM-DD")
);
// var tempfile =require('tempfile')
const con = config.write_mysql
const conRead = config.mysql_analytics
const mysql = new database(con);
const mysqlRead = new database(conRead);
var promises = []
MongoClient.connect(config.mongo.database_url, { useNewUrlParser: true, useUnifiedTopology: true }, async function(
  err,
  client
) {
  if (err) {
    throw err;
  } else {
    const mongo = client.db(config.mongo.database_name);
    //let likeFile = await generateLikeCsv(mysql);
     promises.push(generateLikeCsv(mysqlRead))
   // let commentFile = await generateCommentCsv(mongo);
     promises.push(generateCommentCsv(mongo))
    //let postFile = await generatePostCsv(mongo);
     promises.push(generatePostCsv(mongo))
     await Promise.all(promises)
    await trendingVideoInserterCaller(mysql, mysqlRead);

    var tempFilePath =
      "Report_" +
      moment()
        .subtract(1, "d")
        .format("YYYY-MM-DD") +
      ".xlsx";
    console.log("tempFilePath:", tempFilePath);
    await workbook.xlsx.writeFile(tempFilePath);
    console.log("send mail");

    //   .then(function(res){
    //   // res.sendFile(tempFilePath, function(err){
    //   //   console.log('----------error downloading file:', err)
    //   // })
     await sendMail(sendgrid, "vivek@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "gagan@doubtnut.com", tempFilePath, helper);
    // await  sendMail(sendgrid, "uday@doubtnut.com", tempFilePath, helper)
    // await  sendMail(sendgrid, "aditya@doubtnut.com", tempFilePath, helper)
    // await  sendMail(sendgrid, "tanushree@doubtnut.com", tempFilePath, helper)
     await sendMail(sendgrid, "akansha@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "gunjan@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "isha@doubtnut.com", tempFilePath, helper);
     await  sendMail(sendgrid, "intern@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "shivangi.bathla@doubtnut.com", tempFilePath, helper);
     await sendMail(sendgrid, "shobhit.gaur@doubtnut.com", tempFilePath, helper);
    //   console.log('Workbook created with all sheets')

    // })
    const files = [
      "templike.xlsx",
      "tempunanswered.xlsx",
      "tempcategory.xlsx",
      "tempcomment.xlsx",
      "temppost.xlsx",
      tempFilePath
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

    mysql.close();
    mysqlRead.close()
    client.close();
    // sendMail(sendgrid, "vivek@doubtnut.com", likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "gagan@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "uday@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "aditya@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "tanushree@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "akansha@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "gunjan@doubtnut.com",likeFile, commentFile,postFile, helper)
    // sendMail(sendgrid, "lorsim@doubtnut.com",likeFile, commentFile,postFile, helper)
  }
});

async function generateLikeCsv(mysql) {
  return new Promise(async function(resolve, reject) {
    try {
      let likeData = await getLikeData(mysql);
      // console.log(likeData)
      let engDetails,
        post_id,
        post_type,
        liked_at,
        student_id,
        student_class,
        student_locale;
      let post_title, post_text, en_image, start_date;
      let likeJson = [],
        sample;
      for (let i = 0; i < likeData.length; i++) {
        post_id = likeData[i]["resource_id"];
        post_type = likeData[i]["resource_type"];
        student_id = likeData[i]["student_id"];
        student_class = likeData[i]["student_class"];
        student_locale = likeData[i]["locale"];
        liked_at = likeData[i]["created_at"];
        engDetails = await getEngagementPostsDetails(
          likeData[i]["resource_id"],
          likeData[i]["resource_type"],
          mysql
        );
        post_title = engDetails.length > 0 ? engDetails[0]["en_title"] : "null";
        post_text = engDetails.length > 0 ? engDetails[0]["en_text"] : "null";
        en_image = engDetails.length > 0 ? engDetails[0]["en_image"] : "null";
        start_date =
          engDetails.length > 0 ? engDetails[0]["start_date"] : "null";
        start_date =
          engDetails.length > 0 ? engDetails[0]["start_date"] : "null";
        sample = {};
        sample.post_id = post_id;
        sample.post_type = post_type;
        sample.student_id = student_id;
        sample.student_class = student_class;
        sample.student_locale = student_locale;
        sample.liked_at = liked_at;
        sample.post_title = post_title;
        sample.post_text = post_text;
        sample.post_image = en_image;
        sample.post_start_date = start_date;
        likeJson.push(sample);
      }
      // const csv = likeParser.parse(likeJson);
      // let likeCsvName = "like_" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".csv"
      // fs.writeFile(likeCsvName, csv, 'utf8', function (err) {
      //   if (err) {
      //     console.log('Some error occured - file either not saved or corrupted file saved.');
      //   } else {
      //     console.log('like csv saved!');
      //     resolve(likeCsvName)
      //     // getCommentData(client, mongo, likeCsvName)
      //   }
      // })
      likesheet.addRow().values = _.keys(likeJson[0]);

      _.forEach(likeJson, function(item) {
        var valueArray = [];
        valueArray = _.values(item);
        likesheet.addRow().values = valueArray;
      });
      workbook.xlsx.writeFile("./templike.xlsx").then(function() {
        console.log("likesheet is written");
        resolve(likesheet);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function generateCommentCsv(mongo) {
  return new Promise(async function(resolve, reject) {
    try {
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
        }
      };
      //console.log(query)
      mongo
        .collection("comments")
        .find(query)
        .toArray(async function(err, result) {
          let engDetails, studentData;
          let post_id,
            post_type,
            comment_id,
            student_id,
            comment_text,
            commented_at,
            comment_image,
            student_class,
            student_locale,
            category
          let post_title, post_text, en_image, start_date, sample, commentJson = [];
          await getAnsweredData(result)
          await getCategoryData(result)

          if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
              if (result[i]["student_id"] != 99) {
                post_id = result[i]["entity_id"];
                post_type = result[i]["entity_type"];

                comment_id = result[i]["_id"].toString();
                student_id = result[i]["student_id"];
                comment_text = result[i]["message"];
                commented_at = result[i]["createdAt"];
                comment_image = result[i]["image"];

                studentData = await getStudentData(student_id, mysqlRead);
                engDetails = await getEngagementPostsDetails(
                  post_id,
                  post_type,
                  mysqlRead
                );
                post_title =
                  engDetails.length > 0 ? engDetails[0]["en_title"] : "null";
                post_text =
                  engDetails.length > 0 ? engDetails[0]["en_text"] : "null";
                en_image =
                  engDetails.length > 0 ? engDetails[0]["en_image"] : "null";
                start_date =
                  engDetails.length > 0 ? engDetails[0]["start_date"] : "null";
                student_class =
                  studentData.length > 0
                    ? studentData[0]["student_class"]
                    : "null";
                student_locale =
                  studentData.length > 0 ? studentData[0]["locale"] : "null";
                sample = {};
                sample.post_id = post_id;
                sample.post_type = post_type;
                sample.comment_id = comment_id;
                sample.student_id = student_id;
                sample.student_class = student_class;
                sample.student_locale = student_locale;
                sample.comment_text = comment_text;
                sample.commented_at = commented_at;
                sample.comment_image =comment_image;
                sample.category =category;
                sample.post_title = post_title;
                sample.post_text = post_text;
                sample.post_image = en_image;
                sample.post_start_date = start_date;
                commentJson.push(sample);
                //console.log(sample)
              }
            }
            //console.log(sample)
            //     const csv = commentParser.parse(commentJson);
            //     let commentCsvName = "comment_" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".csv"
            //     // let commentCsvName = "my_file.csv"
            //     fs.writeFile(commentCsvName, csv, 'utf8', function (err) {
            //       if (err) {
            //         console.log('Some error occured - file either not saved or corrupted file saved.');
            //       } else {
            //         console.log('Comment csv saved');
            //         // console.log('Ran on ' + moment().subtract(1, 'd').format("YYYY-MM-DD"));
            //         //send mail now
            //         // sendMail(sendgrid, "vivek@doubtnut.com", likeFile, commentCsvName, helper)
            //         // sendMail(sendgrid, "gagan@doubtnut.com",likeFile, commentCsvName, helper)
            //         // sendMail(sendgrid, "uday@doubtnut.com",likeFile, commentCsvName, helper)
            //         // sendMail(sendgrid, "aditya@doubtnut.com",likeFile, commentCsvName, helper)
            //         // sendMail(sendgrid, "tanushree@doubtnut.com",likeFile, commentCsvName, helper)
            //         // sendMail(sendgrid, "akansha@doubtnut.com",likeFile, commentCsvName, helper)
            //         // sendMasendgrid, "gunjan@doubtnut.com",likeFile, commentCsvName, helper)
            //         resolve(commentCsvName)
            //       }
            //     })
            //   } else {
            //     console.log("no data")
            //     resolve(false)
            //   }
            // })
            commentsheet.addRow().values = _.keys(commentJson[0]);
            _.forEach(commentJson, function(item) {
              var valueArray = [];
              valueArray = _.values(item);
              commentsheet.addRow().values = valueArray;
            });
            workbook.xlsx.writeFile("./tempcomment.xlsx").then(function() {
              console.log("commentsheet is written");
              resolve(commentsheet);
            });
          } else {
            console.log("no data");
            resolve(false);
          }
        });
    } catch (e) {
      reject(e);
    }
  });
}

async function generatePostCsv(mongo) {
  return new Promise(async function(resolve, reject) {
    try {
      let postData = await getPostData(mongo);
      let post_id,
        post_type,
        student_id,
        student_class,
        student_username,
        is_deleted,
        texts,
        image,
        audio,
        created_at,
        deep_link

      let link,
        postJson = [],
        sample;
//console.log(postData)
      for (let i = 0; i < postData.length; i++) {
        post_id = postData[i]["_id"].toString();
        post_type = postData[i]["type"];
        student_id = postData[i]["student_id"];
        student_class = postData[i]["class_group"];
        student_username = postData[i]["student_username"];
        is_deleted = postData[i]["is_deleted"];
        texts = postData[i]["text"];
        image = postData[i]["image"];
        audio = postData[i]["audio"];
        created_at = postData[i]["createdAt"];
        link = await generateDeepLink(post_id);
        //console.log(link)
        deep_link = link["url"];
        sample = {};
        sample.post_id = post_id;
        sample.post_type = post_type;
        sample.student_id = student_id;
        sample.student_class = student_class;
        sample.student_username = student_username;
        sample.is_deleted = is_deleted;
        sample.texts = texts;
        sample.image = image;
        sample.audio = audio;
        sample.created_at = created_at;
        sample.deep_link = deep_link;
        postJson.push(sample);
      }
      //console.log(sample)
      // const csv = postParser.parse(postJson);
      // let postCsvName = "post_" + moment().subtract(1, 'd').format("YYYY-MM-DD") + ".csv"
      // fs.writeFile(postCsvName, csv, 'utf8', function (err) {
      //   if (err) {
      //     console.log('Some error occured - file either not saved or corrupted file saved.');
      //   } else {
      //     console.log('post csv saved!');
      //     // getPostData(mongo, postCsvName)
      //     // sendMail(sendgrid, "lorsim@doubtnut.com", postCsvName, helper)
      //     resolve(postCsvName)
      //   }
      // })

      postsheet.addRow().values = _.keys(postJson[0]);

      _.forEach(postJson, function(item) {
        var valueArray = [];
        valueArray = _.values(item);
        postsheet.addRow().values = valueArray;
      });
      workbook.xlsx.writeFile("./temppost.xlsx").then(function() {
        console.log("postsheet is written");
        resolve(postsheet);
      });
    } catch (e) {
      reject(e);
    }
  });
}
async function trendingVideoInserterCaller(mysql, mysqlRead) {
  let st_class = ["6", "7", "8", "9", "10", "11", "12", "14"];
  for (let i = 0; i < st_class.length; i++) {
    // trendingVideoInserter(st_class[i], mysqldb);
    let data = await getCourseDetails(st_class[i], mysqlRead);
    for (let j = 0; j < data.length; j++) {
      let qid = data[j]["question_id"];
      let course = "";
      if (
        data[j]["course"] == "JEE Mains" ||
        data[j]["course"] == "JEE Advance"
      )
        course = "IIT";
      else course = data[j]["course"];
      await trendingVideosInserter(st_class[i], course, qid, mysql);
    }
  }
}
function getPostData(mongo) {
  return new Promise(async function(resolve, reject) {
    // Do async job
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
        }
      };
      mongo
        .collection("posts")
        .find(query)
        .toArray(async function(err, result) {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
    } catch (e) {
      console.log(e);
      return reject(e);
    }
  });
}

function getAnsweredData(result){
   return new Promise(async function(resolve, reject) {
    // Do async job
    try {
      let unansweredJson=[],unansweredSample,unanswered,unanswered_deep_link,postId;
          //console.log(result)
          console.log("before")
         let  commentsData = _.groupBy(result,'entity_id')
         //console.log(unanswered_data)
         let groupedCommentsData = _.map(commentsData, firstComment=>{
          return firstComment[0]
         })
        // console.log(groupedCommentsData)
         let unanswered_data =_.groupBy(groupedCommentsData,'entity_type')
         //console.log(unanswered_data['unanswered'])
         if(unanswered_data['unanswered']){
          for(let i=0;i<unanswered_data['unanswered'].length;i++){
            //console.log(i)
            let unansweredId =unanswered_data['unanswered'][i].entity_id
             unanswered =await generateAnsweredDeepLink(unansweredId)
             unanswered_deep_link = unanswered['url']
             //console.log(unanswered_deep_link)
             unansweredSample={}
             unansweredSample.postId =unansweredId
             unansweredSample.unanswered_deep_link =unanswered_deep_link
             //console.log(unansweredSample)
             unansweredJson.push(unansweredSample)
          }


         }
         // console.log("<<<<<<<<<<<<<>>>>>>>>>>>>")
         // console.log(unansweredSample)
         unansweredsheet.addRow().values = _.keys(unansweredJson[0]);

        _.forEach(unansweredJson, function(item) {
          var valueArray = [];
          valueArray = _.values(item);
          unansweredsheet.addRow().values = valueArray;
        });
        workbook.xlsx.writeFile("./tempunanswered.xlsx").then(function() {
          console.log("unansweredsheet is written");
          resolve(unansweredsheet);
        });

    }catch (e) {
      console.log(e);
      return reject(e);
    }
  });
}

async function getCategoryData(result){
  return new Promise(async function(resolve, reject) {
    // Do async job
    try {
      let categoryJson=[],categorySample,category
          console.log("after unanswered")
         let  commentsData = _.groupBy(result,'entity_id')
         //console.log(commentsData)
         let groupedCommentsData = _.map(commentsData, firstComment=>{
          return firstComment[0]
         })
         //console.log(groupedCommentsData)
         let youtube_data =_.groupBy(groupedCommentsData,'entity_type')
         //console.log(youtube_data['youtube'])
         //console.log(youtube_data['youtube'].length)
         if(youtube_data['youtube']){
          for(let i=0;i<youtube_data['youtube'].length;i++){
            //console.log(i)
            let postId =youtube_data['youtube'][i].entity_id
            //console.log(postId)
             category =await getCategoryForYoutube(postId,mysqlRead)
             //console.log(category)
             category = category[0]['en_options']
             //console.log(category[0]['en_options'])
             let studentId =youtube_data['youtube'][i].student_id
             categorySample={}
             categorySample.postId =postId
             categorySample.category =category
             categorySample.studentId =studentId
             //console.log(categorySample)
             categoryJson.push(categorySample)
          }


         }
         // console.log("<<<<<<<<<<<<<>>>>>>>>>>>>")
         // console.log(categorySample)
         categorysheet.addRow().values = _.keys(categoryJson[0]);

        _.forEach(categoryJson, function(item) {
          var valueArray = [];
          valueArray = _.values(item);
          categorysheet.addRow().values = valueArray;
        });
        workbook.xlsx.writeFile("./tempcategory.xlsx").then(function() {
          console.log("categorysheet is written");
          resolve(categorysheet);
        });

    }catch (e) {
      console.log(e);
      return reject(e);
    }
  });

}


async function generateDeepLink(post_id) {
  //console.log(post_id)
  return new Promise(async function(resolve, reject) {
    try {
      var myJSONObject = {
        branch_key: "key_live_cbx3cYpK30NM7Ph4H3OX7ihpqsn9tgQ4",
        channel: "timeline_feed_share",
        feature: "timeline_feed",
        campaign: "app_viral",
        data: {
          qid: post_id,
          type: "ugc"
        }
      };
      request(
        {
          url: "https://api.branch.io/v1/url",
          method: "POST",
          json: true, // <--Very important!!!
          body: myJSONObject
        },
        function(error, response, body) {
          if (error) {
            console.log(error);
          } else {
            //console.log(body);
            return resolve(body);
          }
        }
      );
    } catch (e) {
      console.log(e);
      return reject(e);
    }
  });
}
async function generateAnsweredDeepLink(post_id){
  return new Promise(async function(resolve, reject) {
    try {
      var myJSONObject = {
        branch_key: "key_live_cbx3cYpK30NM7Ph4H3OX7ihpqsn9tgQ4",
        channel: "timeline_feed_share",
        feature: "timeline_feed",
        campaign: "app_viral",
        data: {
          qid: post_id,
          type: "unanswered"
        }
      };
      request(
        {
          url: "https://api.branch.io/v1/url",
          method: "POST",
          json: true, // <--Very important!!!
          body: myJSONObject
        },
        function(error, response, body) {
          if (error) {
            console.log(error);
          } else {
            //console.log(body);
            return resolve(body);
          }
        }
      );
    } catch (e) {
      console.log(e);
      return reject(e);
    }
  });
}

function getCourseDetails(class1, mysql) {
  let sql =
    "select b.question_id, b.target_course, count(b.view_id) as views_count from (SELECT a.question_id,questions_meta.target_course,a.view_id,a.created_at FROM (select * from video_view_stats where date(created_at)=date_sub(CURRENT_DATE, INTERVAL 1 DAY)) as a LEFT JOIN questions_meta on a.question_id=questions_meta.question_id WHERE  questions_meta.class='" +
    class1 +
    "') as b left join questions as c on b.question_id=c.question_id where c.student_id <> 96 group by b.question_id order by count(b.view_id) desc limit 5";
  return mysql.query(sql);
}

function trendingVideosInserter(st_class, course, qid, mysql) {
  let sql =
    "insert into trending_videos (question_id,class,course) values('" +
    qid +
    "','" +
    st_class +
    "','" +
    course +
    "')";
  return mysql.query(sql);
}

function getEngagementPostsDetails(id, type, mysql) {
  let sql =
    "SELECT * FROM `engagement` WHERE id='" +
    id +
    "' and type = '" +
    type +
    "'";
  return mysql.query(sql);
}

function getLikeData(database) {
  let sql =
    "select a.resource_id, a.resource_type, a.student_id,a.created_at,b.locale,b.student_class from (SELECT resource_type,resource_id,is_like,student_id,created_at FROM `user_engagement_feedback` where is_like=1 and date(created_at)=date_sub(CURRENT_DATE, INTERVAL 1 DAY)) as a left join (select locale,student_id,student_class from students ) as b on a.student_id=b.student_id";
  //console.log(sql)
  return database.query(sql);
}

function getStudentData(student_id, database) {
  let sql =
    "select student_class,locale,student_id from students where student_id='" +
    student_id +
    "'";
  return database.query(sql);
}

function getCategoryForYoutube(post_id,database){
  let sql = "select en_options from engagement where id ='"+post_id+"' and type ='youtube'";
 // console.log(sql)
  return database.query(sql);

}

async function sendMail(sendgrid, toMail, tempFilePath, helper) {
  return new Promise(async function(resolve, reject) {
    try {
      // var sendgrid = require("sendgrid")("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");
      // console.log(likeFile)
      let from_email = new helper.Email("vivek@doubtnut.com");
      let to_email = new helper.Email(toMail);
      let subject =
        "Like, Comment and Post Report for " +
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
      // var attachment2 = new helper.Attachment();
      // var attachment3 = new helper.Attachment();
      var file1 = fs.readFileSync(tempFilePath);
      // var file2 = fs.readFileSync(commentCsvName);
      // var file3 = fs.readFileSync(postCsvName);
      var base64File1 = new Buffer(file1).toString("base64");
      // var base64File2 = new Buffer(file2).toString('base64');
      // var base64File3 = new Buffer(file3).toString('base64');
      attachment.setContent(base64File1);
      attachment.setType("text/xlsx");
      // attachment2.setContent(base64File2);
      // attachment2.setType('text/csv');
      // attachment3.setContent(base64File3);
      // attachment3.setType('text/csv');
      // attachment.setFilename('my_file.pdf');
      attachment.setFilename(tempFilePath);
      attachment.setDisposition("attachment");
      // attachment2.setFilename(commentCsvName);
      // attachment2.setDisposition('attachment');
      // attachment3.setFilename(postCsvName);
      // attachment3.setDisposition('attachment');
      let mail = new helper.Mail(from_email, subject, to_email, content);
      mail.addAttachment(attachment);
      // mail.addAttachment(attachment2);
      // mail.addAttachment(attachment3);
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
