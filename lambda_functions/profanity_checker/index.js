"use strict";
const _ = require("lodash")
const MongoClient = require('mongodb').MongoClient;
const mongo = require('mongodb');
const vision = require('@google-cloud/vision')
const MONGODB_URI = process.env.MONGODB_URI;
let cachedDb = null;
let Enum = require('enum');
const fetch = require('node-fetch');

function connectToDatabase(uri) {

    if (cachedDb && cachedDb.serverConfig.isConnected()) {
        console.log('=> using cached database instance');
        return Promise.resolve(cachedDb);
    }
    const dbName = 'doubtnut';
    return MongoClient.connect(uri, { useUnifiedTopology: true })
        .then(client => { cachedDb = client.db(dbName); return cachedDb; });
}
// if (typeof client_read === 'undefined') {
//   var client_read = mysql.createConnection({ host: process.env.MYSQL_HOST_READ, user: process.env.MYSQL_USER_READ, password: process.env.MYSQL_PASS_READ, database: process.env.MYSQL_DB});
//   client_read.connect();
// }
// if (typeof client_write === 'undefined') {
//   var client_write = mysql.createConnection({ host: process.env.MYSQL_HOST_WRITE, user:process.env.MYSQL_USER_WRITE,password:process.env.MYSQL_PASS_WRITE,database: process.env.MYSQL_DB});
//   client_write.connect();
// }


module.exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    console.log("1")
    try {
        console.log("event: " + event)
        let db = await connectToDatabase(MONGODB_URI)

        for (let message of event.Records) {
            let data = JSON.parse(message.body)
            console.log("entity_type :" + data.entity_type)
            console.log("entity text :" + data.entity.text)
            console.log("entity message :" + data.entity.message)
            let contains_image = 0
            let contains_images = 0
            let contains_text = 0
            let recordUpdateDb
            let text
            let image
            let images = []
            let is_text_profane = 0
            let is_image_profane = 0
            switch (data.entity_type) {
                case 'GROUP_CHAT':
                    if (data.entity.message && data.entity.message !== "") {
                        contains_text = 1
                        text = data.entity.message
                    }
                    if (data.entity.image && data.entity.image !== "") {
                        contains_image = 1
                        image = data.entity.image
                    }
                    recordUpdateDb = db.collection('groupchatmessages')
                    break;
                case 'POST':
                    if (data.entity.text && data.entity.text !== "") {
                        contains_text = 1
                        text = data.entity.text
                    }
                    if (data.entity.image && data.entity.image !== "") {
                        contains_image = 1
                        image = data.entity.image
                    }
                    recordUpdateDb = db.collection('posts')
                    break;
                case 'COMMENT':
                    if (data.entity.message && data.entity.message !== "") {
                        contains_text = 1
                        text = data.entity.message
                    }
                    if (data.entity.image && data.entity.image !== "") {
                        contains_image = 1
                        image = data.entity.image
                    }
                    recordUpdateDb = db.collection('comments')
                    break;
                case 'POST_TESLA':
                    if (data.entity.msg && data.entity.msg !== "") {
                        contains_text = 1
                        text = data.entity.msg
                    }
                    if (data.entity.type && data.entity.type === 'image') {
                        contains_images = 1
                        images = _.map(data.entity.attachment, (image) => {
                            return data.entity.cdn_url + image
                        })
                    }
                    recordUpdateDb = db.collection('tesla')
                    break;
                default:
                    return Promise.reject('NO entity_type found')
            }

            console.log(contains_text)
            if (contains_text) {
                is_text_profane = await processText(db, text)
                const pattern = /((\+){1}\s??9\s?1\s??){0,1}\s?[1-9]{1}\s?[0-9\s-\._<>]{9,17}/;
                const rx = new RegExp(pattern, 'gi');
                if (rx.test(text)) {
                    is_text_profane = 1
                }
            }
            if (contains_image) {
                is_image_profane = await processImage(image)
            }
            if (contains_images) {
                for (let image of images) {
                    console.log(image)
                    if (!is_image_profane) {
                        is_image_profane = await processImage(image)
                        // let selfieCheckerData =  await selfieChecker(image)
                        // let selfieDataInsert = {
                        //   entity_id:new mongo.ObjectID(data.entity._id),
                        //   image:image,
                        //   label:selfieCheckerData
                        // }
                        // db.collection('tesla_label').save(selfieDataInsert)
                    }
                }
            }
            if (is_text_profane || is_image_profane) {
                console.log("text :", is_text_profane, "image :", is_image_profane)
                let profaneMarker = await markEntityProfane(db, recordUpdateDb, data.entity, data.entity_type)
                // let insertOffenceEntry = await insertOffence(data.entity,data.entity_type)
            } else {
                let cleanEntity = await undeleteEntity(recordUpdateDb, data.entity, data.entity_type)
            }
            console.log('ended')
            return Promise.resolve(1)

        }
    } catch (e) {
        console.log('ended with error:', e)
        return Promise.reject(0)
    }
};
async function processText(db, text) {
    try {
        text = text.replace(/\W/g, ' ');
        console.log(text)
        let response = await fetch(`http://172.31.18.213:8888/query=${text}`)
        console.log(response)
        let body = await response.text();
        body = !parseInt(body)
        console.log("profane_check :", body)
        return Promise.resolve(body)
    } catch (e) {
        return Promise.reject(e)
    }
}
async function processImage(image) {
    try {
        let client = new vision.ImageAnnotatorClient()
        let checkedImage = await client.safeSearchDetection(image)
        // let checkedImage = await client.safeSearchDetection('https://cdn.vox-cdn.com/thumbor/NtgHwgBedas3nxzUofhFhNxQfgQ=/0x0:2040x1360/920x613/filters:focal(857x517:1183x843):format(webp)/cdn.vox-cdn.com/uploads/chorus_image/image/65093706/mdoying_180118_2249_0338stills.0.jpg')
        let imageCheckresult = new Enum(['POSSIBLE', 'VERY_LIKELY', 'LIKELY'])
        if (imageCheckresult.isDefined(checkedImage[0]['safeSearchAnnotation']['adult'])) {
            return Promise.resolve(1)
        } else {
            return Promise.resolve(0)
        }
    } catch (e) {
        return Promise.reject(e)
    }
}
async function selfieChecker(image) {
    try {
        let client = new vision.ImageAnnotatorClient();
        let [result] = await client.labelDetection(image);
        const labels = result.labelAnnotations;
        return Promise.resolve(labels)

    } catch (e) {
        return Promise.resolve(0)
    }
}

async function markEntityProfane(db, recordUpdateDb, entity, entity_type) {
    try {
        let id = new mongo.ObjectID(entity._id);
        let markprofane = await recordUpdateDb.findOneAndUpdate({ _id: id }, { $set: { is_profane: true, is_deleted: true } })
        console.log(markprofane)
        return Promise.resolve(1)
    } catch (e) {
        return Promise.reject(e)
    }
}
async function undeleteEntity(recordUpdateDb, entity, entity_type) {
    var id = new mongo.ObjectID(entity._id);
    if (entity_type === 'GROUP_CHAT') {
        let newmessageCopy = entity
        delete newmessageCopy._id
        newmessageCopy.is_deleted = false
        let insertNewMessage = await recordUpdateDb.insertOne(newmessageCopy)
        //let deleteOldMessage = await recordUpdateDb.deleteOne({_id:id})
    } else {
        let undeleteEntity = await recordUpdateDb.findOneAndUpdate({ _id: id }, { $set: { is_deleted: false } })
    }
}