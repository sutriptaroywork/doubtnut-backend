const Redis = require("ioredis");
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname + '/../../api_server/config/config');
const redisClient = require(__dirname + '/../../api_server/config/redis');
const database = require(__dirname + '/../../api_server/config/database');
const mysql = new database(config.mysql_analytics);


function qIds(){
    const sql = `SELECT question_id FROM answers where timestamp >= '2020-07-15'`;
    return mysql.query(sql);
}




async function main(){
    let hset = ["answers_with_text_solution","answers","questions_url_new"]
    let key= await qIds();
    console.log(key.length)
    for(let i=0; i<hset.length; i++){
        for(let j=0;j<key.length;j++){
            console.log(key[j].question_id)
            // console.log(await redisClient.hget(hset[i],key[j].question_id))
            await redisClient.hdel(hset[i],key[j].question_id)
        }
    }
    console.log("success ful")
    redisClient.disconnect();
}


main()