"use strict";

const MongoClient = require('mongodb').MongoClient;

const url = "mongodb://localhost:27017";
const dbName = "doubtnut";
// var AWS = require('aws-sdk');
let is_prod = 0
require('dotenv').config();
// console.log(process.env.SEND_GRID_KEY)
// var email = require('mailer');
const database = require('../../api_server/config/database');
const Json2csvParser = require('json2csv').Parser;
const likeFields = ['post_id', 'post_type', 'student_id', 'student_class', 'locale', 'liked_at', 'post_title', 'post_text', 'post_image', 'post_start_date'];
const commentFields = ['post_id', 'post_type', 'comment_id', 'student_id', 'student_class', 'locale', 'comment_text', 'commented_at', 'post_title', 'post_text', 'post_image', 'post_start_date'];
var sendgrid = require("sendgrid")(process.env.SEND_GRID_KEY);
var helper = require('sendgrid').mail;

const likeParser = new Json2csvParser({likeFields});
const commentParser = new Json2csvParser({commentFields});
let dev = {
  host:"35.200.228.199",
  user:"root",
  password:"Iamking@123",
  database:"classzoo1"
}
let prod = {
  host: "latest-production.cluster-ro-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "dn-prod",
  password: "D0ubtnut@2143",
  database: "classzoo1"
}
let credentials
if(is_prod){
  credentials = prod
}else{
  credentials = dev
}
const moment = require('moment');
const fs = require('fs');
console.log(credentials)
const mysql = new database(credentials);

main(mysql);

async function  main(mysql){
  let data = await getAllData(mysql);

  for(let i=0;i<data.length;i++){
    // console.log(data[i]['image_path'])
    let image_path = data[i]['image_path']
    image_path = image_path.split("/")
    console.log(image_path)
    let path = image_path[3]
    let image = image_path[4]
    let id = data[i]['id']
    await update(path,image,id,mysql)
  }
}

function getAllData(mysql) {
  let sql = "SELECT * FROM `image_data`"
  return mysql.query(sql)
}
function update(path,image,id,mysql) {
  let sql = "UPDATE image_data SET `image` = '"+image+"' , path = '"+path+"' WHERE id = "+id
  console.log(sql)
  return mysql.query(sql)
}






