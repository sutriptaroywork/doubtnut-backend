const mysql = require('mysql');
var mongoose = require('mongoose');
const bluebird = require("bluebird");
const configFile = require(__dirname+'/../../api_server/config/config');
const database = require('./database')
mongoose.Promise = require('bluebird');
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://13.233.54.212:27017/doubtnut";
const WhatsAppMessageModel = require('./mongo/whatsapp')
const telemetry = require('../../../doubtnut_backend/api_server/config/telemetry');
var request = require("request");
const dbName = "doubtnut";
const redis = require("redis");
bluebird.promisifyAll(redis);

let medium = process.argv[2]; 
let caption = process.argv[3];
let urlImage = process.argv[4];
let event = process.argv[5];
let msgToSend = process.argv[6];

const config = {
  host: "dn-prod-db-cluster.cluster-ro-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "dn-prod",
  password: "D0ubtnut@2143",
  database: "classzoo1"
}
const config_write = {
  host: "dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "dn-prod",
  password: "D0ubtnut@2143",
  database: "classzoo1"
}

async function redisConnection(){
  return new Promise((resolve,reject)=>{
    try{
      resolve(redis.createClient({host : configFile.redis.host}));
    }catch(e){
      reject(e)
    }

  })
}

async function redisConnectionOn(client){
  client.on("connect", async function() {
    console.log("Redis client connected successfully");
    try{
    	
	}catch(e){
		console.log(e)
	} 
}) 
client.on("error", function (err){
	console.log("Error" + err);
});
}

async function mongooseConnection(){
  return new Promise((resolve,reject)=>{
    mongoose.connect(url, { useNewUrlParser: true, autoIndex: false }, function (
      err,
      client
    ) {
      if (err) {
          // throw err;
          reject(err)
      } else {
          // mongo = client.db(dbName);
          console.log('connected mongo')
          resolve(true)
      }
    });
  })
}

async function mongoConnection(){
  return new Promise((resolve,reject)=>{
    MongoClient.connect(url, { useNewUrlParser: true }, function (
      err,
      client
    ) {
      if (err) {
          // throw err;
          reject(err);
      } else {
          mongo = client.db(dbName);
          resolve(true)
          // main(mongo)
      }
    });
  })
}

const dbread = new database(config)
const dbwrite = new database(config_write)
main(dbread,dbwrite)

async function getIsActiveValue(client){
  return client.getAsync('isActive')
}

async function whatsappLogs(phone , data){
    let wha = new WhatsAppMessageModel({phone: phone,data: data});
    console.log('2')
    await wha.save()
    console.log('3')
}

async function main(dbread,dbwrite){
    // try{
  
    const client = await redisConnection();
    console.log('redis connecting');
    await redisConnectionOn(client);
    console.log('connected');
    await mongoConnection();
    console.log('mongo connected');
    await mongooseConnection();
    console.log('mongoose');
    let config1 = {
        login : 2000186697,
        password: '1MraeMJhP'
    }   
    let numbers = await getNum(dbread)
    console.log('length',numbers.length)
    if(medium == 'image'){

      for(let i = 0 ; i<numbers.length;i++){
        console.log(i)
        if(await getIsActiveValue(client) == 'yes'){
            await waitForSecs()
            await sendImageOnWhatsApp(numbers[i]['mobile_w'],urlImage,config1, caption, urlImage, event)
            console.log('deleting', numbers[i]['mobile_w'])
            await delNum(numbers[i]['mobile_w'],mysql)
            console.log('deleted', numbers[i]['mobile_w'])
        }
        else{
          console.log('something fishy')
        }
    }  
  }
    else{
      for (let i = 0 ; i<numbers.length;i++){
        if(await getIsActiveValue(client) == 'yes'){
        await waitForSecs()
        let msg = msgToSend
        await sendWhatsAppMessageToOptInPeople(numbers[i]['mobile_w'], msg, config1, event);
        await delNum(numbers[i]['mobile_w'],dbwrite)
    }
    else{
      console.log('something fishy')
      }
    }
  }
    console.log('done')
    }
               
  function waitForSecs(){
    return new Promise((resolve,reject)=>{
      setTimeout(()=>{
        console.log('wait')
        resolve(true)
      },1500)        
        // reject(e)
    })
  }
 
function sendImageOnWhatsApp(phone_number, urlImage, config, caption, urlImage, event){
  let obj = {}
  obj.type = event
  obj.data = urlImage
  return new Promise(async function (resolve, reject) {
    var options = {
      method: 'GET',
      url: 'https://media.smsgupshup.com/GatewayAPI/rest',
      qs:
        {
          method: "SendMediaMessage",
          send_to: phone_number,
          msg_type: "image",
          userid: config.login,
          auth_scheme: "plain",
          data_encoding: "Unicode_text",
          password: config.password,
          v: "1.1",
          format: "text",
          media_url: urlImage,
          caption: caption,
        }
    };
    request(options, function (error, response, body) {
      if(response.body.includes('success')){
        obj.response = response.body
        obj.success = '1'
          console.log(response.body)
          console.log('objj', obj)
          whatsappLogs(phone_number,obj)
        resolve(true)
    }else{
        obj.response = response
        obj.success = '0'
        whatsappLogs(phone_number,obj)
        resolve(false)
    }
    });
  });
}

function sendWhatsAppMessageToOptInPeople(phone,text,config,event){
   // let self = this;
    let obj = {}
    obj.type = event
    obj.data = text
    return new Promise(async function (resolve, reject) {
      var options = {
        method: 'GET',
        url: 'https://media.smsgupshup.com/GatewayAPI/rest',
        qs:
          {
            method: "SendMessage",
            send_to: phone,
            msg: text,
            msg_type: "DATA_TEXT",
            userid: config.login,
            auth_scheme: "plain",
            data_encoding: "Unicode_text",
            password: config.password,
            v: "1.1",
            format: "text"
          }
      };

      request(options, function (error, response, body) {
        // console.log('---1---' , obj)
        if(response.body.includes('success')){
            obj.response = response.body
            obj.success = '1'
              console.log(response.body)
              console.log('objj', obj)
             whatsappLogs(phone,obj)
           resolve(true)
        }else{
            obj.response = response
            obj.success = '0'
            whatsappLogs(phone,obj)
            resolve(false)
        }
      });
    });
      
    }

function getNum(mysql){
    let sql = 'SELECT mobile_w FROM whatsapp_push'
    return new Promise((resolve, reject) => {
        dbread.query(sql, function (error, AllOptInNum, fields) {

            console.log('Sssss' , AllOptInNum.length)
            if(error){
                console.log(error)
                reject()
            }
            resolve(AllOptInNum)

          })
    })  
}

function delNum(phone, database) {
  const sql = `Delete from whatsapp_push where mobile_w = ${phone}`;
  return new Promise((resolve, reject) => {
      dbwrite.query(sql, (error, delNum) => {
          if (error) {
              console.log(error);
              reject();
          }
          resolve(delNum);
      });
  });
}

function getName(num,mysql){
  let sql = "SELECT student_fname from students where mobile = " +num
  return new Promise ((resolve,reject)=>{
  
    dbread.query(sql, function (error, name, fields) {

      if(error){
          console.log(error)
          reject()
      }
      resolve(name)

    })

  })

}






  
