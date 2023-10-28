/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-02 15:43:30
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-17 14:57:04
*/
"use strict";
const config = require('./config');
console.log(config)
const ElasticSearch = require('../api_server/modules/elasticSearch')
const elasticSearch = require('elasticsearch')
const winstonInstance = require('./winston');
const request = require('request')
const TelegramBot = require('node-telegram-bot-api');
let TelegramService  = require('./services/telegram-service')
// console.log(TelegramService)
const admin = require('firebase-admin');
const {Translate} = require('@google-cloud/translate');
const projectId = 'doubtnut-vm';
// Instantiates a client
const translate = new Translate({
  projectId: projectId,
});
const serviceAccount = config.GOOGLE_KEYFILE;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.firebase.baseUrl
});
// console.log(config)
const client = new elasticSearch.Client({
  host: config.elastic.ELASTIC_HOST
});
let elasticSearchInstance = new ElasticSearch(client, config);
const mongoose = require('mongoose');
const mongodb_url = config.mongo.database_url+"/"+config.mongo.database_name;
mongoose.connect(mongodb_url,{ useNewUrlParser: true, autoIndex: false  }).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...');
    process.exit();
});
// console.log(config)
const bluebird = require("bluebird");
const redis = require('redis');
bluebird.promisifyAll(redis);
let service_list = ["whatsapp_service","activitystream_service","notification_service","remove_caching_service", "clevertap_profile_service","image_profanity_check_service", "whatsapp_video_update_service"]
// let WhatsappService = require('./services/whatsapp-service')

// let NotificationService = require('./services/notification-service')
let ImageProfanityCheckService =require('./services/image-profanity-check-service')
let ActivityStreamService = require('./services/activitystream-service')
let RemoveCachingService = require('./services/remove-caching-service')
let ClevertapUpdateProfileService = require('./services/clevertap-profile-update-service')
let WhatsappVideoUpdateService = require('./services/whatsapp-video-update-service')
ImageProfanityCheckService =new ImageProfanityCheckService(config)
ActivityStreamService = new ActivityStreamService(config)
RemoveCachingService = new RemoveCachingService(config)
ClevertapUpdateProfileService = new ClevertapUpdateProfileService(config)
WhatsappVideoUpdateService = new WhatsappVideoUpdateService(config)
// NotificationService = new NotificationService(config)
let subscriber = redis.createClient(config.redis);
let redisClient = redis.createClient(config.redis);
const database = require('./database')
const readMysql = new database(config.read_mysql)
let writeMysql;
if (config.env === 'development') {
  writeMysql = readMysql
} else {
  writeMysql = new database(config.write_mysql)
}
const aws = require('aws-sdk');
aws.config.setPromisesDependency(bluebird);
aws.config.update({
  accessKeyId: config.aws_access_id,
  secretAccessKey: config.aws_secret,
  region: config.aws_region,
  signatureVersion: config.aws_signature_version
});
const fs = require('fs')
bluebird.promisifyAll(fs);
const moment = require('moment')
const s3 = new aws.S3();
let db = {}
db.mysql = {}
db.redis = {}
db.redis.read = redisClient
db.redis.write = redisClient
db.mysql.read = readMysql;
db.mysql.write = writeMysql;
db.elasticClient = elasticSearchInstance
db.winstoneInstance = winstonInstance
db.s3 = s3

let telegramInstance = new TelegramService(config)
db.admin = admin
telegramInstance.run(db,TelegramBot,moment,fs,__dirname,request,translate)

subscriber.on("message", function (channel, message) {
  message = JSON.parse(message)
  console.log(channel)
  // console.log(message)
  if (channel === "whatsapp_service") {
    // WhatsappService.run(message,db)
  }
  if (channel === "activitystream_service") {
    ActivityStreamService.run(message,db)
  }
  if (channel === "notification_service") {
    NotificationService.run(message,db)
  }
  if (channel === "remove_caching_service") {
    RemoveCachingService.run(message,db)
  }
  if(channel === "clevertap_profile_service"){
    ClevertapUpdateProfileService.run(message, db)
  }
  if(channel === "image_profanity_check_service"){
    ImageProfanityCheckService.run(message,admin, db)

  }

  if(channel === "whatsapp_video_update_service"){
    WhatsappVideoUpdateService.run(message,db)
  }
});
for (let i = 0; i < service_list.length; i++) {
  subscriber.subscribe(service_list[i]);
}


// redisClient.publish("whatsapp_video_update_service", JSON.stringify({
//   "whatsapp_stu_id" : "724515",
//   "student_id": "3499754"
// }));