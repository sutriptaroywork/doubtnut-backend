const MongoClient = require("mongodb").MongoClient;
let url = process.env.MONGO_URL;
const dbName = process.env.MONGO_DB_NAME;
let db;

console.log('mongooooo', url,dbName)
async function mongoConnection(){
    return new Promise((resolve,reject)=>{
      MongoClient.connect(url, { useUnifiedTopology: true }, function (
        err,
        client
      ) {
        if (err) {
            // throw err;
            reject(err);
        } else {
            let mongo = client.db(dbName);
            resolve(mongo)
            // main(mongo)
        }
      });
    })
  }

async function getDbHandle(){
    if(db){
      console.log('connection already', db)
      return db;
    }
    db = await mongoConnection();
    console.log('connection making', db)
    return db
  }

module.exports = {getDbHandle}
