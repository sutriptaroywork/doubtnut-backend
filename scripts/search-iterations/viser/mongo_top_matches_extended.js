require('dotenv').config({path : __dirname + '/../../../api_server/.env'});
const Database = require(__dirname+'/../../../api_server/config/database');
const config = require(__dirname+'/../../../api_server/config/config');
const AnswerContainer = require('../../../api_server/modules/containers/answer');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://mongo-rs1-1.doubtnut.internal:27017,mongo-rs1-2.doubtnut.internal:27017,mongo-rs1-3.doubtnut.internal:27017/{database}?replicaSet=rs0&readPreference=secondaryPreferred&connectTimeoutMS=60000&socketTimeoutMS=60000&retryWrites=true';
const dbName = 'doubtnut';
const { Parser } = require('json2csv');
const fields = ['question_id', 'qid_matched', 'asked_ocr', 'ocr_matched', 'score', 'secondary_score', 'ocr_type','user_clicked','watch_duration','video_url'];
const JSONparser = new Parser({fields});
const readMysql = new Database(config.mysql_analytics);
const redisClientRead = require('../../../api_server/config/redis');
const redisClientWrite = redisClientRead;

const db = {};
db.mysql = {};
db.redis = {};
db.redshift ={};
db.mysql.read = readMysql;
db.redis.read = redisClientRead;
db.redis.write = redisClientWrite;

function createCsv(data, startTime) {
    const csv = JSONparser.parse(data);
    let csvName = 'modified_' + startTime + '.csv'
    try {
        let i = 1;
        while (fs.existsSync(csvName)) {
            csvName = `modified_${startTime}_${i}.csv`
            i+=1;
        }   
    } catch (error) {
        console.error(`Error while saving script.`);
        process.exit(1);
    }
    fs.writeFile(csvName, csv, 'utf8', function (err) {
      if (err) {
        console.error('Some error occured - file either not saved or corrupted file saved.');
        process.exit(1);
      } else {
        console.log('csv saved!');
        process.exit(0);
        // sendTheMail(sendgrid, "meghna.gupta@doubtnut.com", csvName, helper, startTime)
      }
    })
}

async function mongoQuery(db, startTime, endTime) {
    return new Promise(async function (resolve, reject) {
        try {
            // 1623140686000
            console.log('this is gte: ', new Date(startTime+19800000))
            console.log('this is lte: ', new Date(endTime+19800000))
            let query =
            { 
                "$and": [{
                    "createdAt" : 
                    { 
                    "$gte": new Date(startTime+19800000),
                    "$lte": new Date(endTime+19800000)
                    }
                }
                ] 
            };
            const projection = {
                "_id": 0,
                "qid": 1,
                "ocr": 1,
                "relevance_score": 1,
                "ocr_type": 1
            }
            console.log('EXECUTING QUERY:');
            console.log(query);
            db.collection("question_logs_user").find(query, {projection: projection})
                .toArray(function(err, result) {
                    if (err) {
                        console.error(err);
                        return reject(err);
                    }
                    return resolve(result);
                });

        } catch (e) {
          console.log(e)
          process.exit(1);
        }
    });
}

function getParamsFromCLI(argv) {
    let startTime, endTime, ocrTypeString;
    if (argv && Array.isArray(argv) && argv[0] && argv[1]) {
        startTime = parseInt(argv[0]);
        endTime = parseInt(argv[1]);
        ocrTypeString = argv[2]
        return {startTime, endTime, ocrTypeString};
    }
    console.error('Please use command in the format: node your/file/path start-time-epoch end-time-epoch');
    process.exit(1);
}

function getOcrType(ocrType) {
    if (!ocrType) {
        return "NA"
    }
    if (ocrType.includes('viser')) {
        return "7"
    } else if (ocrType.includes('mathpix')) {
        return "0"
    } else if (ocrType.includes('google')) {
        return "1"
    } else if (ocrType.includes('question_text')) {
        return "t"
    } else {
        return "NA"
    }
}

function getVideosWatched(client, qid){
    let sql = `select * from classzoo1.video_view_stats where parent_id=${qid}`;
    console.log(sql);
    return client.query(sql);
}


async function main() {
    try {
        let csvData = [];
        const argv = process.argv.slice(2);
        let {startTime, endTime, ocrTypeString} = getParamsFromCLI(argv);
        let mainCount = 0;
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function (err, client) {
            try {
                if (err) {
                    console.log(err);
                    process.exit(1);
                }
                const mongodb = client.db(dbName);
                const qidArray = await mongoQuery(mongodb, startTime, endTime);
                const length = qidArray.length;
                for (let index = 0; index < qidArray.length; index++) {
                    const qidElement = qidArray[index];
                    console.log(`Processed ${index} documents out of ${length} total`);
                    if (qidElement && qidElement.relevance_score) {
                        const qid = qidElement.qid;
                        const ocr = qidElement.ocr;
                        const score_array = qidElement.relevance_score;
                        const ocr_type = getOcrType(qidElement.ocr_type);
                        if( ocrTypeString === 'all'
                        || (ocr_type === '0' && ocrTypeString === 'mathpix')
                        || (ocr_type === '7' && ocrTypeString === 'viser')
                        ) {
                            const min = Math.min(5, score_array.length);
                            const videos_watched= await getVideosWatched(db.mysql.read,qid);
                            for (let j = 0; j < min; j++) {
                                const element = score_array[j];
                                mainCount++;
                                let res = await AnswerContainer.getByQuestionIdWithTextSolution(element.qid, db)
                                if (res && Array.isArray(res) && res.length) {
                                    const data = {};
                                    data.question_id = qid;      // user asked qid
                                    data.qid_matched = element.qid;      // question matched qid
                                    data.asked_ocr = ocr;
                                    data.ocr_matched = res[0].ocr_text;
                                    data.score = element.string_diff_score;
                                    if (!data.score || data.score === '') {
                                        data.score = 0
                                    }
                                    data.secondary_score = element._score;
                                    data.ocr_type = ocr_type;
                                    video_view_row = videos_watched.filter((x) => x.question_id == element.qid);
                                    data.user_clicked = video_view_row.length > 0 ? 1 : 0;
                                    data.watch_duration = data.user_clicked ? video_view_row[0]['video_time'] : 0;
                                    data.video_url = data.user_clicked  && video_view_row[0]['answer_video'] !='text' ? `https://d3cvwyf9ksu0h5.cloudfront.net/${video_view_row[0]['answer_video']}`: '';
                                    console.log(data);
                                    csvData.push(data);
                                }
                            }
                        }
                    }
                }
                console.log('Total count found to be ', mainCount);
                await createCsv(csvData, startTime);
          } catch(e){
            console.log(e)
            process.exit(1);
          }
        })
    } catch (error) {
        console.error('error: ', error);
        process.exit(1);
    }
}

main()
