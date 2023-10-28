require('dotenv').config({path : __dirname + '/../../../api_server/.env'});
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://mongo-rs1-1.doubtnut.internal:27017,mongo-rs1-2.doubtnut.internal:27017,mongo-rs1-3.doubtnut.internal:27017/{database}?replicaSet=rs0&readPreference=secondaryPreferred&connectTimeoutMS=60000&socketTimeoutMS=60000&retryWrites=true';
const dbName = 'doubtnut';
const { Parser } = require('json2csv');
const fields = ['question_id', 'image_link', 'ocr', 'confidence'];
const JSONparser = new Parser({fields});

function createCsv(data, startTime) {
    const csv = JSONparser.parse(data);
    let csvName = 'vision_' + startTime + '.csv'
    try {
        let i = 1;
        while (fs.existsSync(csvName)) {
            csvName = `vision_${startTime}_${i}.csv`
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
                }, {
                    "$or": [{
                        "ocr_type" : "img_gv_translate"
                    }, {
                        "ocr_type" : "img_google_vision"
                    }]
                }
                ] 
            };
            const projection = {
                "_id": 0,
                "qid": 1,
                "ocr": 1,
                "isAbEligible": 1,
                "question_image": 1,
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
    let startTime, endTime;
    if (argv && Array.isArray(argv) && argv[0] && argv[1]) {
        startTime = parseInt(argv[0]);
        endTime = parseInt(argv[1]);
        return {startTime, endTime};
    }
    console.error('Please use command in the format: node your/file/path start-time-epoch end-time-epoch');
    process.exit(1);
}

async function main() {
    try {
        let csvData = [];
        const argv = process.argv.slice(2);
        let {startTime, endTime} = getParamsFromCLI(argv);
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
                    if (qidElement) {
                        const questionImage = qidElement.question_image;
                        const data = {};
                        data.question_id = qidElement.qid;
                        data.image_link = `https://d10lpgp6xz60nq.cloudfront.net/images/${questionImage}`;
                        data.ocr = qidElement.ocr;
                        data.confidence = qidElement.isAbEligible;
                        csvData.push(data);
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