"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('./database');
const MongoClient = require("mongodb").MongoClient;
const mysql = new database(config.mysql_analytics);
const _ = require("lodash");
const moment = require("moment");

config.mongo.database_url = config.mongo.database_url.replace("{database}", "doubtnut");

main();
function main() {
    MongoClient.connect(config.mongo.database_url,{ useUnifiedTopology: true }, { useNewUrlParser: true }, async function(err,client) {
		  if (err) {
		    console.log(err);
		  } else {
		   const mongo = client.db(config.mongo.database_name);
		        console.log('Successfully connected to mongo');
		        try{
		        	let data = await getEtoosData();
                    console.log(data)
                    let updateQuery = { is_deleted : true};
                    var bulk = mongo.collection("comments").initializeOrderedBulkOp();
                    for(let i = 0;i<data.length; i++){
                        bulk.find({entity_id: data[i].question_id.toString(), entity_type:'answered'}).update({$set: updateQuery});
                    }
                    bulk.execute(function (error) {
                       if(error){
                           console.log(error);
                       }
                       console.log("Updated");
                   });
		        	} catch (e) {
		            console.log(e);
		        } finally{
		        	mysql.connection.end();
		            client.close();
		        }
		    }
	})
}


async function getEtoosData(){
	try{
		 return getEtoosLectureQid(mysql)
		// let qidData = [],sample;
		// for (let i = 0; i < q_ids.length; i++) {
		// 	sample = {};
		// 	sample.question_id = q_ids[i]["question_id"];
		// 	qidData.push(sample);
		// }
		// return qidData;
	}catch(e){
		console.log(e);
        throw new Error(e);
	}
}

// async function updateComments(question_id,mongo, bulk){
// 	try{
//
// 		updateQuery['is_deleted'] = true;
//
//         return bulk;
// 	}catch(e){
// 		console.log(e);
//         throw new Error(e);
// 	}
//
// }


function getEtoosLectureQid(database){
	let sql ="SELECT question_id FROM etoos_lecture";
	return database.query(sql);
}
