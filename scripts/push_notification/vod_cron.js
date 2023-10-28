require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const MongoClient = require("mongodb").MongoClient;
const { ObjectId } = require('mongodb'); // or ObjectID 
const moment = require('moment')
const bluebird = require("bluebird");
const Promise = require('bluebird');
const tencentcloud = require(__dirname + '/../../api_server/node_modules/tencentcloud-sdk-nodejs-intl-en');
const md5 = require('md5');
const Tencent = require(__dirname + '/../../api_server/modules/tencent/tencent');

async function connectToMongo() {
    return new Promise((resolve, reject) => {
        MongoClient.connect(config.mongo.database_url, { useUnifiedTopology: true }, { useNewUrlParser: true }, async function (err, client) {
            if (err) process.exit()
            console.log("connected")
            return resolve(client.db('doubtnut'))
        });
    });
}
(async () => {
    let mongo = await connectToMongo();
    let posts = await mongo.collection('tesla').find({ "type": "live", "live_status": 3, "vod_link": { $exists: false } }).toArray()
    for (let index = 0; index < posts.length; index++) {
        const element = posts[index];
        await checkVod(mongo, element._id)
    }

    console.log(posts)
    process.exit()

})();

async function checkVod(mongo, resourceID) {
    return new Promise((resolve, reject) => {
        const secretID = config.tencent_secret_id;
        const secretKey = config.tencent_secret_key;
        const VodClient = tencentcloud.vod.v20180717.Client;
        //  const models = tencentcloud.vod.v20180717.Models;
        const { Credential } = tencentcloud.common;
        const cred = new Credential(secretID, secretKey);
        const client = new VodClient(cred, 'ap-mumbai');
        const req1 = new Tencent.SearchMediaRequest({ StreamId: resourceID });
        client.SearchMedia(req1, async (err, response) => {
            // console.log(response)
            // The request is returned exceptionally, and the exception information is printed
            if (err) {
                console.log(err);
                resolve(1)
                // res.send(err);
            }
            console.log(response)
            // The request is returned normally, and the response object is printed
            const now = moment();
            let vodUrl = '';
            for (let j = 0; j < response.MediaInfoSet.length; j++) {
                //const creationDate = moment(response.MediaInfoSet[j].BasicInfo.CreateTime);
                const resourceIDPattern = new RegExp(resourceID, 'g');
                console.log(response.MediaInfoSet[j].BasicInfo.Name)
                if (response.MediaInfoSet[j].BasicInfo.Name.match(resourceIDPattern) && response.MediaInfoSet[j].BasicInfo.Type === 'm3u8') {
                    if (vodUrl.length === 0) {
                        vodUrl = response.MediaInfoSet[j].BasicInfo.MediaUrl;
                    }
                }
            }
            if (vodUrl.length > 0) {
                console.log(vodUrl)
                // update vod url
                let updatePost = await mongo.collection("tesla").findOneAndUpdate(
                    { _id: ObjectId(resourceID) }, // query
                    {
                        $set: {
                            live_status: 3,
                            vod_link: vodUrl
                        },
                    },
                    {
                        upsert: false,
                    }
                );
            }
            resolve(1)
        });
    })
}