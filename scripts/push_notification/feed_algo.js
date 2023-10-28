require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const MongoClient = require("mongodb").MongoClient;
const {ObjectId} = require('mongodb'); // or ObjectID 
const moment = require('moment')
const bluebird = require("bluebird");
const Redis = require('ioredis');
const Promise = require('bluebird');
Promise.promisifyAll(Redis);
Promise.promisifyAll(Redis.prototype);
var write_redis = new Redis({
      host: config.write_redis.host,
      port: config.write_redis.port
 });
 var read_redis = new Redis({
    host: config.read_redis.host,
    port: config.read_redis.port
})

async function connectToMongo() {
    return new Promise((resolve,reject)=>{
        MongoClient.connect(config.mongo.database_url,{ useUnifiedTopology: true }, { useNewUrlParser: true }, async function(err,client) {
            if (err) process.exit()
            console.log("connected")
            return resolve(client.db('doubtnut'))
        });
    });
}
(async ()=> {
let mongo = await connectToMongo();
let   impression_data = [
    {
        entity_id:'5e81cfbc3cdf9a3261bd7abf',
        impressions:30,
        duration:2
    },
    {
        entity_id:'5e834e63901b153429bc61cb',
        impressions:30,
        duration:2
    },
    {
        entity_id:'5e834c1a901b153429bc61c9',
        impressions:3000,
        duration:2
    }
]
let i = 0
for (const impression of impression_data) {
    console.log(impression)
    let  bookmarks = await mongo.collection('teslabookmarks').find({entity_id:ObjectId(impression.entity_id)}).toArray();
    let rating = await mongo.collection('teslarating').find({entity_id:ObjectId(impression.entity_id)}).toArray();
    console.log(bookmarks)
    console.log(rating)
    let comments = await mongo.collection('comment').find({entity_id:ObjectId(impression.entity_id)}).toArray();
    console.log(comments)
    let engagments = bookmarks.length+rating.length+comments.length
    engagments  = engagments + i
    i++
    let impression_var = impression.impressions + impression.duration
    let impression_engagment_ratio = (engagments/impression_var)
    let created_at = ObjectId(impression.entity_id).getTimestamp()
    let timepassed = moment(moment()).diff(created_at)
    let affinity_score = impression_engagment_ratio*10000 - timepassed*0.00000000001
    console.log(affinity_score)
   let set_feed =  await write_redis.zaddAsync('feed-rank',affinity_score,impression.entity_id)
    console.log(set_feed)
}
let see_feed = await write_redis.zrevrangeAsync('feed-rank',0,-1)
console.log(see_feed)
process.exit()

})();

