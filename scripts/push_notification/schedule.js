//const MongoClient = require('mongodb').MongoClient
//const bluebird = require("bluebird");
var mongoose = require('mongoose');
//bluebird.promisifyAll(mongoose);
mongoose.Promise = require('bluebird');
const url = "mongodb://xx.xxx.xx.xxx:27017/doubtnut";
// const config = require('../../api_server/config/config');
// const url =config.mongo.database_url + "/" + config.mongo.database_name;
const dbName = "doubtnut"
require('dotenv').config()
const database = require('../push_notification/database')
const PostModel = require('./mongo/post')
let dev = {
  host: "latest-production.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "XXXXX",
  password: "XXXXX",
  database: "XXXXX",
  timezone: "UTC+0"
}
const mysql = new database(dev);

mongoose.connect(url, {useNewUrlParser: true, autoIndex: false}, async function (err, client) {
  if (err) {
    throw err;
  }
  else {
    console.log("Successfully connected to the database");
    schedule_post(mysql).then(result => {
      console.log("result")
      console.log(result)
      var today = new Date();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
      var dateTime = date + ' ' + time;
      client.close()
      mysql.close()
      console.log("script end at " + dateTime)
    }).catch(error => {
      console.log("error")
      console.log(error)
      client.close()
      mysql.close()
    })
  }
})

function schedule_post(mysql) {
  return new Promise(async function (resolve, reject) {
    try {
      let data = await getData(mysql)
      console.log("data")
      console.log(data)
      if (data.length > 0) {
        for(let i=0;i<data.length;i++){
          let savePromise = await savePost(data[i], PostModel)
          console.log("save")
          console.log(savePromise)
        }
        return resolve(true)
          // if (data !== false) {
          //   console.log("exit")
          //   // return resolve(flag)
          //   let m_id = data['_id']
          //
          // }

      } else {
        return resolve(false)
      }
    } catch (e) {
      return resolve(false)
    }
  })
}

function savePost(data, Postmodel) {
  return new Promise(async function (resolve, reject) {
    if (data.length === 0) {
      return resolve(false)
    }
    try{
      console.log("save")
      console.log(data)
      let promises = []
        let sid, type, student_id, student_avatar, student_username, text, image, audio, start_date, class_group
        let sample = {}
        sid = data['id']
        type = data['type']
        student_id = data['student_id']
        student_avatar = data['student_avatar']
        student_username = data['student_username']
        text = data['texts']
        image_url = data['image_url']
        audio = data['audio']
        student_class = data['student_class']
        sample.type = type
        sample.student_id = student_id
        sample.text = text
        sample.image = image_url
        sample.audio = audio
        if (text.length > 0) {
          sample.contain_text = true
        } else {
          sample.contain_text = false
        }
        if (audio !== null && audio.length > 0) {
          sample.contain_audio = true
        } else {
          sample.contain_audio = false
        }
        if (image_url.length > 0) {
          sample.contain_image = true
        } else {
          sample.contain_image = true
        }

        sample.class_group = student_class
        sample.student_username = student_username
        sample.student_avatar = student_avatar
        let post = new Postmodel(sample);
        let resolvePromise = await post.save()
console.log("resolvePromise")
console.log(resolvePromise)
      //save post
      let updatePromise = await updateData(resolvePromise['_id'],sid,mysql)
      return resolve(true)
      // let resolvePromise = await Promise.all(promises)
      // console.log("resolvePromise")
      // console.log(resolvePromise)
      // return resolve(resolvePromise)
      // for(let j=0;j<resolvePromise.length;j++){
      //   console.log("resolvePromise[j]")
      //   console.log(resolvePromise[j])
      //
      // }
    }catch(e){
      console.log(e)
      return resolve(false)
    }
  })
}





function getData(mysql) {
  //let sql = "Select * from schedule_ugc where start_date >= date_sub(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE)"
  let sql = "SELECT * FROM `schedule_ugc` WHERE start_date < CURRENT_TIMESTAMP AND start_date > date_sub(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE)"
  // let sql = "SELECT * FROM `schedule_ugc` order by id limit 5"

  //  let sql ="SELECT * FROM `schedule_ugc` WHERE start_date < CURRENT_TIMESTAMP AND start_date limit 10"
//  let sql ="SELECT * FROM `schedule_ugc` WHERE start_date < NOW() AND start_date > (NOW()-INTERVAL 15 MINUTE)"
  //console.log(sql)
  return mysql.query(sql)
}

function updateData(m_id, sid, mysql) {
  let sql = "Update schedule_ugc set mongo_id ='" + m_id + "' where id ='" + sid + "'"
  return mysql.query(sql)
}
