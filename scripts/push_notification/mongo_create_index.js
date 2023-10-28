/* Function to create indexes */
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const PROD_MONGO_URL = config.mongo.database_url
const PROD_MONGO_DB_NAME = config.mongo.database_name; 
let db = {};
db.mongo = {};


//Specify the order correctly
let collectionIndexes = ['student_id', 'time', 'type', 'status'];
let collectionName = "notification_logs";

MongoClient.connect(config.mongo.database_url, {useNewUrlParser: true}, function (err, client) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    const mongo = client.db(config.mongo.database_name);
    db.mongo.read = mongo
    db.mongo.write = mongo
    createMongoIndexes(collectionName, collectionIndexes);
});

/* Function That will return the Object with the index fields */
function setIndexes(indexes) {
    let indexObj = {};
    for (let i = 0; i < indexes.length; i++) {
        indexObj[indexes[i]] = 1;
    }
    return indexObj;
}


function createMongoIndexes(collectionName, collectionIndexes) {
    //console.log(setIndexes(collectionIndexes));
    db.mongo.write.collection(collectionName).createIndex(setIndexes(collectionIndexes), {name: "our_index"}).then((res) => {
        console.log(res);
    }).catch((err) => {
        console.log(err);
    });
}


// function createMongoIndexes(collectionName){
// 	mongo.collection(collectionName).createIndex({student_id:1,time:1,type:1,status:1});
// }