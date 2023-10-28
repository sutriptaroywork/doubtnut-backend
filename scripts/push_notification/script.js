"use strict";

const MongoClient = require('mongodb').MongoClient;

const url = "mongodb://localhost:27017";
//const url = "";
const dbName = "doubtnut";
// const uniqid = require('uniqid');
const admin = require('firebase-admin');
 // const serviceAccount = "/home/neil/doubtnut-e000a-firebase-adminsdk-6lh8n-2d57630fa7.json"
const serviceAccount = "/home/vivek29vivek/doubtnut-e000a-firebase-adminsdk-6lh8n-2d57630fa7.json"

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://doubtnut-e000a.firebaseio.com"
});
// const config = require('../../api_server/config/config');

const database = require('../../api_server/config/database');
const Utility = require('../../api_server/modules/utility');
const Notification = require('../../api_server/modules/notifications');
const Constants = require('../../api_server/modules/appConstants');
const moment = require('moment');
const con = {
  host: "35.154.38.157",
  user: "doubtnut",
  password: "Iamlegend123king",
  database: "classzoo1"
}
// const mysqldb = new database(config.read_mysql);
const db = new database(con);

MongoClient.connect(url, {useNewUrlParser: true}, function (err, client) {
  if (err) {
    throw err;
  }
  else {
    const mongo_db = client.db(dbName);
    let mongo = {}
    mongo.mongo = {}
    mongo.mongo.write = mongo_db
    console.log('mongo connected');
    trendingVideoInserterCaller(db)

    // checkAnsweredInactiveNotification(mongo_db,db)
    // mongo_db.collection('testing').insert({"name": "test_insert"}, function (err, result) {
    //   console.log(err);
    //   if (err) {
    //     throw err;
    //   }
    //   else {
    //
    //     console.log("connected");
    // updateUserName();
    // test_breaking_streak(mongo,db);
    // added this inactive answered question here  //  --------     // checkAnsweredInactiveNotification(mongo_db,db)
    // QuestionAskBadgeNotification(mongodb, mysqldb)
    // user_inactivity_notifications(mongo_db, mysqldb);

    // }
    // });
    // get_query(5, db)
  }
});




//       ---------------           version 2 simplified code                     ----------          //
let cdn = "https://d10lpgp6xz60nq.cloudfront.net/images/";
const benchmark_array = [10, 50, 100, 250, 1000];    // questions to be asked to attain a badge benchmark
const badges_array = ["Intermediate badge", "Expert badge", "Boss badge", "Boss badge", "Boss badge"];      // badge names to be  awarded correspondingly
const badges_url = [cdn + "question_asked_intermediate.png", cdn + "question_asked_expert.png", cdn + "question_asked_boss.png", cdn + "question_asked_boss.png", cdn + "question_asked_boss.png"];      // badge names to be  awarded correspondingly

function QuestionAskBadgeNotification(mongodb, mysqldb) {

  for (let i = 0; i < benchmark_array.length; i++) {
    let benchmark_markup = benchmark_array[i] * .9;
    let sql = "SELECT * from ((select student_id,count(question) as question_count from questions group by (student_id)) as a left join (select student_id ,gcm_reg_id from students) as b on a.student_id = b.student_id) where gcm_reg_id IS NOT NULL and question_count >=" + benchmark_markup + " and question_count < " + benchmark_array[i];
    mysqldb.query(sql).then((values) => {
      values.forEach((rows) => {
        let student_id = rows['student_id'];
        let gcm_reg_id = rows['gcm_reg_id'];
        let question_count = rows['question_count'];
        let questions_more = benchmark_array[i] - question_count;
        let notification_data = {
          "trigger": "home",
          "event": "user_journey",
          "title": "no questions in last 5 days",
          "message": "Just " + questions_more + "questions more to ask to achieve" + badges_array[i] + "badge",
          "image": badges_url[i],
          "button_text": "Goto"
        }
        mongodb.collection('notification_logs').insert({
          "student_id": student_id,
          "gcm_reg_id": gcm_reg_id,
          "data": notification_data,
          "status": "pending",
          "date": new Date()
        }, function (err, response) {
          if (err) throw err;
          else {
            console.log(response);
          }
        })
      });

    }).catch((error) => {
      console.log(error);
    });
  }
}

function user_inactivity_notifications(mongodb, mysqldb) {

  let inactivity_days_counter = 5;
  let messages = [
    "We miss You! We added 100 videos yesterday",
    "Tell us what will bring you back - take them to a screen to get feedback",
    "Watch Trending Video",
    "If no Activity in last 2 days - DN helped 1000 students to clear doubts yesterday",
    "You were not here yesterday ,Dont break your yesterday !!"
  ];
  for (let i = inactivity_days_counter; i > 0; i--) {
    console.log(i);
    let sql = query_generator(inactivity_days_counter);
    console.log(sql);
    mysqldb.query(sql).then((values) => {
      // console.log("values");
      values.forEach((rows) => {
        // console.log(rows);
        let notification_data = {
          "trigger": "home",
          "event": "user_journey",
          "title": "user inactivity notifications",
          "message": messages[i],
          "image": "image_url",
          "data": JSON.stringify({"random":"1"})
        }
        mongodb.collection('testing').insert(
          {
            "student_id": rows['student_id'],
            "gcm_reg_id": rows['gcm_reg_id'],
            "message": notification_data,
            "status": "pending",
            "date": new Date()

          }, function (err, response) {
            if (err) throw err;
            console.log(response);
          });
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}


//  ----------------------              notification function query generator  -----------     //


// const benchmark_array = [10, 50, 100, 250, 1000];

function query_generator(counter, data) {

  let query = "select student_id,gcm_reg_id,timestamp from students where gcm_reg_id is not null AND DATEDIFF(NOW(),timestamp) > 5 AND student_id NOT IN ( select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL " + counter + " DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL " + counter + " DAY)) and gcm_reg_id IS NOT NULL";
  return query;
}



function checkBreakingStreak() {

}


function earlyInactiveUserNotifications(mongodb, mysqldb) {

  let sql = "select * from ((select * from students where timestamp < NOW() and timestamp > (NOW()-INTERVAL 6 HOUR)) as a inner join (select student_id from video_view_stats where created_at < NOW() and created_at > (NOW() - INTERVAL 6 HOUR) union select student_id from questions where timestamp < NOW() and timestamp > (NOW() - INTERVAL 6 HOUR)) as b on a.student_id = b.student_id)";
  mysqldb.query(sql).then((values) => {
    values.forEach((rows) => {
      let notification_data = {
        "trigger": "home",
        "event": "user_journey",
        "title": "no questions in last 6 hours after install",
        "message": "Didn't you get anything interesting on doubtnut yet",
        "image": "image_url"
      }
      mongodb.collection('testing').insert(
        {
          "student_id": rows['student_id'],
          "gcm_reg_id": rows['gcm_reg_id'],
          "message": notification_data,
          "status": "pending",
          "date": new Date()

        }, function (err, response) {
          if (err) throw err;
          console.log(response);
        });
    });
  }).catch((error) => {
    console.log(error);
  });
}


function get_query(day, database) {
  let d = moment().subtract(day, 'days').format("YYYY-MM-DD HH:mm:ss")
  console.log(d)
  let q = "select a.student_id from (select * from video_view_stats where date(created_at) = date('" + d + "')) as a inner join (select student_id from students where DATEDIFF(NOW(),timestamp) > 5) as b on a.student_id = b.student_id GROUP BY a.student_id";
  console.log(q)
}


function breaking_streak_notification(mongodb,db) {
  console.log(con);
  let counter = 5;
  let sql = query_generator(5) +" and student_id IN ('" + query_generator(6) + "')";
  Notification.checkUserActiveNotification('no_activity',db).then(result => {
    let message = {
      "event": "user_journey",
      "title": result[0]['title'],
      "message": result[0]['message'],
      "image": result[0]['image_url'],
      "data": JSON.stringify({"random":"1"})
    }
    db.query(sql).then((values) => {
      console.log("values")
      console.log(values)
      values.forEach((rows) => {
        // insert_notification(rows['student_id'], rows['gcm_reg_id'], counter, mongodb)
        Utility.sendFcm(rows['student_id'], rows['gcm_reg_id'], message, admin, mongodb)
      });
      return values;
    }).then((values) => {
      counter--;
      let sql = query_generator(4) + " and student_id IN ('" + query_generator(5) + "')" + " and student_id IN ('" + query_generator(6) + "')" ;
      console.log(sql);
      db.query(sql).then((values) => {
        values.forEach((rows) => {
          Utility.sendFcm(rows['student_id'], rows['gcm_reg_id'], message, admin, mongodb)
        });
        // console.log(values+"hello i am here");
      });
    }).then((values) => {
      counter--;
      let sql = query_generator(3) + " and student_id IN ('" + query_generator(4) + "')" + " and student_id IN ('" + query_generator(5) + "')" + " and student_id IN ('" + query_generator(6) + "')";
      console.log(sql);
      db.query(sql).then((values) => {
        values.forEach((rows) => {
          Utility.sendFcm(rows['student_id'], rows['gcm_reg_id'], message, admin, mongodb)
        });
        // console.log(values);
      });
    }).then((values) => {
      counter--;
      let sql = query_generator(2) + " and student_id IN ('" + query_generator(3) + "')" + " and student_id IN ('" + query_generator(4) + "')" + " and student_id IN ('" + query_generator(5) + "')" + " and student_id IN ('" + query_generator(6) + "')";
      console.log(sql);
      db.query(sql).then((values) => {
        values.forEach((rows) => {
          Utility.sendFcm(rows['student_id'], rows['gcm_reg_id'], message, admin, mongodb)
        });
        // console.log(values+"omino");
      });
      }).then((values) => {
        counter--;
        let sql = query_generator(1) + " and student_id IN ('" + query_generator(2) + "')" + " and student_id IN ('" + query_generator(3) + "')" + " and student_id IN ('" + query_generator(4) + "')" + " and student_id IN ('" + query_generator(5) + "')" + " and student_id IN ('" + query_generator(6) + "')";
        console.log(sql);
        db.query(sql).then((values) => {
          values.forEach((rows) => {
            Utility.sendFcm(rows['student_id'], rows['gcm_reg_id'], message, admin, mongodb)
          });
          // console.log(values+"omino");
        }).catch((error) => {
      console.log(error);
    });
  }).catch(error => {
    console.log(error);
  });
}).catch(error => {
  console.log(error);
});
}

function TrendingVideoWatchNotification(mongodb, mysqldb, question_id) {
  let sql = "select count(question_id) as video_watch_count from video_view_stats where question_id = " + question_id + " and date(created_at) = CURDATE() - 1";
  mysqldb.query(sql).then((values) => {
    console.log("response");
    console.log(values);
    if (values[0]['video_watch_count'] > Constants.getTrendingVideoCount()) {
      console.log('hello');
      values.forEach((rows) => {
        let notification_data = {
          "trigger": "home",
          "event": "user_journey",
          "title": "Congrats! ",
          "message": "This video has been on trending on doubtnut",
          "image": "http://getdrawings.com/images/winter-tree-drawing-31.jpg",
          "data": JSON.stringify({"random":"1"})
        }
        mongodb.collection('testing').insert(
          {
            "student_id": rows['student_id'],
            "gcm_reg_id": rows['gcm_reg_id'],
            "message": notification_data,
            "status": "pending",
            "date": new Date(),
            "type": "trending"
          }, function (err, response) {
            if (err) throw err;
            console.log(response);
          });
      });
    }
  }).catch((error) => {
    console.log(error);
  });
}

function checkAnsweredInactiveNotification(mongodb, mysqldb) {
  let sql = "select distinct a.student_id,d.gcm_reg_id,a.question_id from ((select * from questions where is_community = 1 and is_answered =1) as a inner join(select question_id from answers where date(timestamp)=CURDATE()) as b on a.question_id = b.question_id left join (select view_id,question_id from video_view_stats) as c on a.question_id = c.question_id) left join(select gcm_reg_id,student_id from students) as d on a.student_id =d.student_id where view_id IS NULL";
  Notification.checkUserActiveNotification('comm_answered_unwatched', db).then(result => {
    let message = {
      "trigger":"library",
      "event": "video",
      "title": result[0]['title'],
      "message": result[0]['message'],
      "button_text": result[0]['button_text'],
      "data": JSON.stringify({"random":"1"})
    }
    mysqldb.query(sql).then((values) => {
      console.log("values")
      console.log(values)
      values.forEach((rows) => {
        message['data'] = JSON.stringify({"qid":rows['question_id'],"page":"COMMUNITY"})
        message["image"] = result[0]['image_url'] + rows['question_id'] + ".png"
        mongodb.collection('notification_logs').insert(
          {
            "student_id": rows['student_id'],
            "gcm_reg_id": rows['gcm_reg_id'],
            "message": message,
            "status": "pending",
            "date": new Date(),
            "type": result[0]['type']
          }, function (err, response) {
            if (err) throw err;
            console.log(response);
          });
      });
    }).catch(error => {
      console.log(error)
    });
  }).catch((error) => {
    console.log(error);
  });
}

//                                         //  --  notification function query generator  - //


// const benchmark_array = [10, 50, 100, 250, 1000];

// function query_generator(counter){


//     let query = "select student_id,gcm_reg_id from students where student_id NOT IN( select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL "+counter+" DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL "+counter+" DAY)) and gcm_reg_id IS NOT NULL";
//     for(let i=benchmark_array.length;i>counter;i--){
//         query = query + "')" + " and student_id IN ('" + query_generator(i) + "')";
//     }
//     return query;
//     // console.log(query);
//     // return  query];           
// }
//  let que = query_generator(3);
// console.log(que);

//  --  notification function  mongo db insertion  - //


function insert_notification(student_id, gcm_reg_id, counter, mongodb) {
  if (counter == 5) {
    // console.log(mongo_db);
    mongodb.collection('testing').insert(
      {
        "student_id": student_id,
        "gcm_reg_id": gcm_reg_id,
        "message": "Tell us what will bring you back - take them to a screen to get feedback",
        "status": "pending",
        "date": new Date()
      }, function (err, response) {
        if (err) throw err;
        console.log(response);
      });
  }
  else if (counter == 4) {
    mongodb.collection('notification_logs').insert(
      {
        "student_id": student_id,
        "gcm_reg_id": gcm_reg_id,
        "message": "We miss You! We added 100 videos yesterday",
        "status": "pending",
        "date": new Date()
      }, function (err, response) {
        if (err) throw err;
        console.log(response);
      });
  }
  else if (counter == 3) {
    mongodb.collection('notification_logs').insert(
      {
        "student_id": student_id,
        "gcm_reg_id": gcm_reg_id,
        "message": "Watch Trending Video",
        "status": "pending",
        "date": new Date()
      }, function (err, response) {
        if (err) throw err;
        console.log(response);
      });
  }
  else if (counter == 2) {
    mongodb.collection('notification_logs').insert(
      {
        "student_id": student_id,
        "gcm_reg_id": gcm_reg_id,
        "message": "If no Activity in last 2 days - DN helped 1000 students to clear doubts yesterday",
        "status": "pending",
        "date": new Date()
      }, function (err, response) {
        if (err) throw err;
        console.log(response);
      });
  }
}



function trendingVideoInserterCaller(mysqldb) {
  let st_class = ['6', '7', '8', '9', '10', '11', '12','14'];
  for (let i = 0; i < st_class.length; i++) {
    trendingVideoInserter(st_class[i], mysqldb);
  }
}

function trendingVideoInserter(st_class, mysqldb) {
  let sql = "select b.question_id, b.target_course, count(b.view_id) as views_count from (SELECT a.question_id,questions_meta.target_course,a.view_id,a.created_at FROM (select * from video_view_stats where date(created_at)=date_sub(CURRENT_DATE, INTERVAL 1 DAY)) as a LEFT JOIN questions_meta on a.question_id=questions_meta.question_id WHERE  questions_meta.class='"+st_class+"') as b left join questions as c on b.question_id=c.question_id where c.student_id <> 96 group by b.question_id order by count(b.view_id) desc limit 5";
  mysqldb.query(sql).then((values) => {
    console.log(values)
    for (let i = 0; i < values.length; i++) {
      let qid = values[i]['question_id'];
      let course = "";
      if (values[i]['course'] == "JEE Mains" || values[i]['course'] == "JEE Advance")
        course = "IIT";
      else
        course = values[i]['course'];

      console.log(course);
      let inserQuery = "insert into trending_videos (question_id,class,course) values('" + qid + "','" + st_class + "','" + course + "')";
      mysqldb.query(inserQuery).then((result) => {
        if (result)
          console.log("Row inserted successfully");
        else
          console.log("Row not inserted");
      }).catch((error) => {
        console.log(error);
      });
    }
  }).catch((err) => {
    console.log(err);
  });
}





function test_breaking_streak(mongodb,db){
  let query_array=[];

   query_array[0] = "select * from students where student_id not in (select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 5 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 5 DAY)) and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 6 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 6 DAY))";
   query_array[1] = "select * from students where student_id not in (select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 4 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 4 DAY)) and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 5 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 5 DAY)) and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 6 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 6 DAY))";
   query_array[2] = "select * from students where student_id not in (select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 3 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 3 DAY))and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 4 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 4 DAY))and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 5 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 5 DAY))  and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 6 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 6 DAY))";
   query_array[3] = "select * from students where student_id not in (select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 2 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 2 DAY)) and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 3 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 3 DAY))and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 4 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 4 DAY))and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 5 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 5 DAY))  and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 6 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 6 DAY))";
   query_array[4] = "select * from students where student_id not in (select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 1 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 1 DAY))and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 2 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 2 DAY)) and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 3 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 3 DAY))and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 4 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 4 DAY))and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 5 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 5 DAY))  and student_id IN(select student_id from video_view_stats where date(created_at) < CURDATE() and date(created_at) > DATE_SUB(CURDATE() , INTERVAL 6 DAY) union select student_id from questions where date(timestamp) < CURDATE() and date(timestamp) > DATE_SUB(CURDATE() , INTERVAL 6 DAY))";
    
  for(let i=0;i<query_array.length;i++){
    console.log('hi')
        Notification.checkUserActiveNotification('no_activity', db).then(result => {
          let message = {
            "event": "user_journey",
            "title": result[0]['title'],
            "message": result[0]['message'],
            "image": result[0]['image_url'],
            "data": JSON.stringify({"random":"1"})
          }
          db.query(query_array[i]).then((values) => {
            console.log(values);

            values.forEach((rows) => {
             
              Utility.sendFcm(rows['student_id'], rows['gcm_reg_id'], message, admin, mongodb)
          });
      }).catch(error=>{console.log(error);})
  }).catch(error=>{console.log(error)});   
  }
}






function commmunityQuestionsForExperts(mongodb, db) {
  let limit = 5;
  _getMaxCommUpvotedQuestions.then(values => {
    if (values.length > 0) {
      let promises = [];
      values.forEach(values => {
        console.log('values');
        console.log(values['question_id']);
        promises.push(_updateQuestionCredit(values['question_id']));
      });
      Promise.all(promises).then(values => {
        console.log(values)
        console.log('done');
      }).catch(err => {
        console.log(error)
      });
    }
  }).catch(err => {
    console.log(err);
  });
}
function _getMaxCommUpvotedQuestions(limit) {
  let select_sql = "select * from ((SELECT question_id FROM `questions` where is_community =1 and question_credit!=0) as a left join (SELECT count(voter_id) as upvote_count,qid from community_questions_upvote GROUP BY qid ) as b on a.question_id = b.qid) ORDER BY upvote_count DESC LIMIT " + limit;
  return db.query(select_sql);
}
function _updateQuestionCredit(question_id) {
  let update_sql = "update questions set question_credit=0 where question_id =" + question_id;
  return db.query(update_sql);
}





