/*
* @Author: Meghna
* @Email: meghna.gupta@doubtnut.com
* @Date:   2020-02-02 14:33:30
* @Last modified by:   Meghna
* @Last modified time: 2020-02-07
*/

const mongoose = require('mongoose');
const moment = require('moment');
const aws = require('aws-sdk')
const bluebird = require('bluebird')
const request = require('request')
const _ = require('lodash')
const MONGODB_URI = process.env.mongo_database_url.replace('{username}', process.env.mongo_database_user).replace('{password}', process.env.mongo_database_pass).replace('{database}', process.env.mongo_database_name);
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, autoIndex: false, useUnifiedTopology: true }).then(() => {
    console.log('Successfully connected to mongoose');
}).catch((err) => {
    console.error(`Could not connect to the database. Exiting now...${err}`);
});
let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
let QuestionLogSchema = new Schema({
    student_id: { type: String, index: true, required: true },
    // isAbEligible: { type: String, default: "" },
    qid: { type: String, index: true, required: true },
    ocr_type: { type: String, index: true, required: true },
    elastic_index: { type: String, default: "" },
    // qid_matches_array: { type: [String], index: true, required: true },
    // meta_index: { type: String, trim: true, default: "" },
    iteration_name: { type: String, index: true, default: null },
    // request_version: { type: String, default: "" },
    is_match :{type:Number,default:0},
    question_image: {type: String, default:null},
    ocr:{type: String, default:null},
    user_locale: {type: String, default: null},
    relevance_score: {type : Object, default: []},
    tags: { type: Array, default: [] },
    viser_resp: {type : Object, default: {}},
    vision_ocr_android: {type: String, default:null},
    },{
    timestamps: true
}, { collection: "question_logs_user"});
QuestionLogSchema.pre('save', function (next) {
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    this.updatedAt = moment(this.updatedAt).add(5, "h").add(30, "m").toISOString();
    next();
});
let QuestionLogModel = mongoose.model('question_logs_user', QuestionLogSchema, 'question_logs_user');

aws.config.setPromisesDependency(bluebird)
aws.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION,
    signatureVersion: process.env.SIGNATURE_VERSION
});

function getTagsFromSearchService(tagData) {
    const options = {
        method: 'GET',
        uri: `${process.env.SEARCH_SERVICE_API_PREFIX}${process.env.TAG_URL_SUFFIX}`,
        body: tagData,
        json: true,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    return new Promise(((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                console.log(err);
                return reject(err);
            } else {
                let tags = new Set();
                // keep this in sync with 'constants' file of 'ques_search' repo
                if(body && body.qid && body.tags) {
                    body.tags.forEach(tag => {
                        if(tag == 1)
                            tags.add('option');
                        if(tag == 2)
                            tags.add('stopword');
                        if(tag == 3)
                            tags.add('synonym');
                        if(tag == 4)
                            tags.add('question_number');
                        if(tag == 5)
                            tags.add('solution');
                        if(tag == 6)
                            tags.add('dictionary');
                    });
                    body.tags = tags;
                }
            
                return resolve(body);
            }
        });
    }));
};

async function dumpToMongo(data) {
    let {locale, ocrType, studentClass, ...masterIterationMongo} = data;
    const relevanceScoreArr = _.get(masterIterationMongo, 'relevance_score', []);
    let matchesArray = relevanceScoreArr.map((x) => x.qid);
    let tags = [];
    tags.push(locale);
    tags.push(studentClass)
    masterIterationMongo.elastic_index ? masterIterationMongo.elastic_index : ' ';
    masterIterationMongo.ocr ? null : tags.push('random');
    masterIterationMongo.subject ? tags.push(masterIterationMongo.subject) : null;
    ocrType === 4 ? ocrType = 0 : null;
    ocrType === 0 ? tags.push('mathpix') : null;
    ocrType === 1 ? tags.push('google') : null;
    ocrType === 3 ? tags.push('tesseract') : null;
    (Array.isArray(matchesArray) && !matchesArray.length) ? tags.push('no_results') : null;
    if (0) {
        // tags api on
        let resp = await getTagsFromSearchService({
            qid: masterIterationMongo.qid,
            ocrText: masterIterationMongo.ocr,
            ocrType,
        });
        
        if(resp && resp.qid && resp.tags) {
            let list = Array.from(resp.tags);
            tags = tags.concat(list);
            masterIterationMongo.tags = tags;
            masterIterationMongo.is_match = 0;
            masterIterationMongo.qid = String(masterIterationMongo.qid);
            let questionLogModel = new QuestionLogModel(masterIterationMongo);
            questionLogModel.save(function (err, response) {
                if (err) {
                    console.error(err);
                    return Promise.reject();
                } else {
                    return 1;
                }
              });
            } else {
                console.log('unexpected SS tag response received while inserting');
                return Promise.reject();
            }
    } else {
        // tags api off
        masterIterationMongo.tags = tags;
        masterIterationMongo.is_match = 0;
        masterIterationMongo.qid = String(masterIterationMongo.qid);
        let questionLogModel = new QuestionLogModel(masterIterationMongo);
        questionLogModel.save(function (err, response) {
            if (err) {
                console.error(err);
                return Promise.reject();
            } else {
                return 1;
            }
        });
    }
}

async function updateMongo(data) {
    let parent_id = String(data);
    QuestionLogModel.findOneAndUpdate({'qid':parent_id},{$set:{'is_match':1}}, {useFindAndModify: false})
                        .then((res) => {
                        })
                        .catch((err) => {
                            console.error('error while updating: ',err);
                        })
}

module.exports.handler = async (event, context) => {
    try {
        let object = _.get(event, 'Records[0].body', 'notFound');
        if(object != 'notFound') {
            let body = JSON.parse(object);
            if (body && body.data && body.type) {
                let { data, type } = body;
                switch (type) {
                    case 'mongoWrite':
                        await dumpToMongo(data)
                        return Promise.resolve();
                    case 'mongoUpdate':
                        await updateMongo(data)
                        return Promise.resolve();
                    default:
                        console.log('Unexpected event type occured');
                        return Promise.reject();
                }
            } else {
                console.log('not able to parse object');
                return Promise.reject();
            }
        } else {
            console.log('unexpected event object received in lambda');
            return Promise.reject();
        }
            
    } catch (error) {
        console.error('Error occured in execution of ask audit lambda : ', error);
        return Promise.reject();
    }
}