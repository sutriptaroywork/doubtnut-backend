require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const Database = require(__dirname+'/../../api_server/config/database');
const config = require(__dirname+'/../../api_server/config/config');
const mysql = new Database(config.mysql_analytics);
const QuestionHelper = require('../../api_server/server/helpers/question.helper');
const Utility = require('../../api_server/modules/utility');
const mathsteps = require('mathsteps');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://mongo-rs1-1.doubtnut.internal:27017,mongo-rs1-2.doubtnut.internal:27017,mongo-rs1-3.doubtnut.internal:27017/{database}?replicaSet=rs0&readPreference=secondaryPreferred&connectTimeoutMS=60000&socketTimeoutMS=60000&retryWrites=true';
const dbName = 'doubtnut';
const sendgrid = require("sendgrid")(config.send_grid_key);
const helper = require('sendgrid').mail;
const { Parser } = require('json2csv');
const fields = ['question_id', 'ocr_text', 'compute'];
const JSONparser = new Parser({fields});


function query() {
    const sql = `SELECT question_id, original_ocr_text from questions WHERE timestamp>=CURRENT_DATE LIMIT 10000`;
    return mysql.query(sql);
}

async function mongoQuery(db) {
    return new Promise(async function (resolve, reject) {
        try {
            // 1589813080000
            console.log('this is gte: ', new Date(1589812352000+19800000))
            // console.log('this is lte: ', new Date(1586802600000+19800000))
            const response = {};
            let query =
              { 
                "$and": [{
                    "createdAt" : 
                    { 
                    "$gte": new Date(1589812352000+19800000),
                    // "$lte": new Date(1586802600000+19800000)
                    }
                },
                {
                    "iteration_name": "v13"
                }
                ] 
              };
              const projection = {
                    "_id": 0,
                    "qid": 1,
                    "elastic_index": 1
                }
            console.log('EXECUTING QUERY:');
            console.log(query);
            db.collection("question_logs_user").find(query, {projection: projection})
                .toArray(function(err, result) {
                    if (err) {
                        console.error(err);
                        return reject(err);
                    }
                    // result.forEach(res => {
                        
                    // });
                    return resolve(result);
                });

        } catch (e) {
          console.log(e)
          process.exit(1);
        }
    });
}


function createCsv(data) {
    const csv = JSONparser.parse(data);
    const csvName = 'ComputationalQuestions.csv';
  
    fs.writeFile(csvName, csv, 'utf8', function (err) {
      if (err) {
        console.error('Some error occured - file either not saved or corrupted file saved.');
        process.exit(1);
      } else {
        console.log('question (with mathsteps answer) csv saved!');
        sendTheMail(sendgrid, "meghna.gupta@doubtnut.com", csvName, helper)
      }
    })
}

function sendTheMail(sendgrid, toMail, csvName, helper) {
    let from_email = new helper.Email("meghna.gupta@doubtnut.com");
    let to_email = new helper.Email(toMail);
    let subject = "Questions with computational results";
    let content = new helper.Content("text/plain", "Questions with results");
    var attachment = new helper.Attachment();
    var file = fs.readFileSync(csvName);
    var base64File = new Buffer(file).toString('base64');
    attachment.setContent(base64File);
    attachment.setType('text/csv');
    attachment.setFilename(csvName);
    attachment.setDisposition('attachment');
    let mail = new helper.Mail(from_email, subject, to_email, content);
    mail.addAttachment(attachment);
    var sg = sendgrid.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON()
    });  
    sendgrid.API(sg, function (error, response) {
      console.log(response.statusCode);
      console.log(response.body);
      console.log(response.headers);
      process.exit(0);
    })
}

async function main() {
    try {
        let csvData = [];
        
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function (err, client) {
            try {
                if (err) {
                    console.log(err);
                    process.exit(1);
                } else {
                    const db = client.db(dbName);
                    const qidArray = await mongoQuery(db);
                    for (let index = 0; index < qidArray.length; index++) {
                        const qidElement = qidArray[index];
                        if(qidElement && qidElement.elastic_index) {
                            const data = {};
                            const qid = qidElement.qid;
                            const ocr = qidElement.elastic_index;
                            const cleanedOcr = QuestionHelper.getCleanedOcrText(ocr);
                            let computational = [];
                            try {
                                computational = await QuestionHelper.handleComputationalQuestions({
                                    mathsteps,
                                    // AnswerMysql,
                                    cleanedOcr,
                                    UtilityModule: Utility,
                                    qid,
                                    // db,
                                });
                            } catch (error) {
                                console.error('Cant compute!');
                                computational.push(error);
                            }
                            
                            data.question_id = qid;
                            data.ocr_text = ocr;
                            data.compute = computational;
                            csvData.push(data);
                        }
                    }
                    await createCsv(csvData);
                }
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