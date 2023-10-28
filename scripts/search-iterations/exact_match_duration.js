const mysql = require('mysql2');
const fs = require('fs');
const _ = require('lodash');
const request = require('request');
// const Data = require('../api_server/data/data');
require('dotenv').config({path : __dirname + '/../../api_server/.env.dev'});
const config = require(__dirname+'/../../api_server/config/config');
const Database = require(__dirname+'/../../api_server/config/database');
const { jsonToHTMLTable } = require('nested-json-to-table');
// const sendgrid = require("sendgrid")(config.send_grid_key);
// const helper = require("sendgrid").mail
const { Parser } = require('json2csv');
// const fields = ['question_id','ocr_text','subject','locale','matched_question_id','match_position','is_matched'];
const fields = ['question_id', 'ocr_text', 'subject', 'locale', 'matched_question_id', 'top1', 'top5', 'top20'];
const JSONparser = new Parser({fields});
const csv = require('fast-csv');
const readMysql = new Database(config.read_mysql);
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://mongo-rs0-1.internal.doubtnut.com:27017,mongo-rs0-2.internal.doubtnut.com:27017,mongo-rs0-3.internal.doubtnut.com:27017/doubtnut?replicaSet=rs0&readPreference=secondaryPreferred&connectTimeoutMS=60000&socketTimeoutMS=60000&retryWrites=true&readPreferenceTags=analytics:yes';
const dbName = 'doubtnut';


const connection = mysql.createConnection({
    host: 'main-db.internal.doubtnut.com',
    user: 'Yash.airen',
    password: '',
    database: 'classzoo1'
  }); 


async function getDuplicatesByQid(db, question_id) {
    const query = {
        question_ids: question_id.toString(),
    };
    // console.log(query);
    return new Promise((resolve, reject) => {
        db.collection("dn_ques_duplicates").find(query)
        .toArray(function(err, result) {
            if (err) {
                console.error(err);
                return reject(err);
            }
            return resolve(result);
        });
    });
}

function getDetailsForDuplicateQids(qids){
    const sql = `select a.question_id, b.video_language from ((select * from questions where question_id in (${qids.join(',')})) as a left join (select * from studentid_package_mapping_new) as b on a.student_id = b.student_id) where b.video_language in ('en','hi-en')`;
    return readMysql.query(sql);
}

function getDurationTimeByQid(qid) {
    const sql = `select question_id, answer_id, duration from answers where question_id = ${qid} order by answer_id desc limit 1`;
    return readMysql.query(sql);
}

async function getDurationTimes(qids) {
    const promises = [];
    for (let i=0; i < qids.length; i++) {
        promises.push(getDurationTimeByQid(qids[i]));
    }
    const resolvedPromises = await Promise.all(promises);
    return resolvedPromises;
}

async function readCSV(path) {
    return new Promise((resolve, reject) => {
        const fileRows = [];
        csv.parseFile(path)
            .on('data', (data) => {
                fileRows.push(data);
            })
            .on('end', () => {
                resolve(fileRows);
            });
    });
}


async function main () {
    try {
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function (err, client) {
                try {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    }
                    const mongodb = client.db(dbName);
                    // const exactMatches = await getExactMatches();
                    //TODO just check the path once
                    let exactMatches = await readCSV("./askApiResponse.csv");
                    // console.log(exactMatches);
                    let loss_duration = 0;
                    for (let i=1; i < exactMatches.length; i++) {
                        console.log(i);
                        let questionId = exactMatches[i][1].toString();
                        let duplicates = await getDuplicatesByQid(mongodb, questionId);
                        if (duplicates.length > 0) {
                            const duplicateQids = duplicates[0]['question_ids'];
                            const duplicateQidsDetails = await getDetailsForDuplicateQids(duplicateQids);
                            const eligibleQids = duplicateQidsDetails.map((x)=> x.question_id);
                            let eligibleQidsDurationTimes = await getDurationTimes(eligibleQids);
                            eligibleQidsDurationTimes = eligibleQidsDurationTimes.filter((x) => x.length > 0);
                            // console.log(eligibleQidsDurationTimes);

                            if (eligibleQidsDurationTimes.length > 1) {
                                // const duration_time = 
                                let max_duration_time = 0;
                                let max_duration_question_id = null;
                                let existing_duration_time = null;
                                for (let r=0; r < eligibleQidsDurationTimes.length; r++) {
                                    let question_id = eligibleQidsDurationTimes[r][0]['question_id'];
                                    let time = parseInt(eligibleQidsDurationTimes[r][0]['duration']);
                                    if (time > max_duration_time) {
                                        max_duration_time = time;
                                    }
                                    
                                    if (max_duration_question_id == null) {
                                        max_duration_question_id = question_id;
                                    } else if (max_duration_question_id !== question_id) {
                                        max_duration_question_id = question_id;
                                    }

                                    if (question_id == questionId) {
                                        existing_duration_time = time;
                                    }
                                }

                                // console.log("max_duration_time", max_duration_time, "existing_duration_time", existing_duration_time, questionId);

                                if ( existing_duration_time !== null  &&  max_duration_time > existing_duration_time ) {
                                    console.log(' ---------- we are losssing  --------- ', max_duration_time - existing_duration_time, questionId);
                                    loss_duration += max_duration_time - existing_duration_time;
                                }   
                            }
                            
                            
                        }
                    }
                    console.log("TOOOTAL LOSSS DURATION __________", loss_duration);
                } catch(e) {
                    console.log(e);
                }
            });
    } catch(E) {
        console.log(E);
    }
}

main();