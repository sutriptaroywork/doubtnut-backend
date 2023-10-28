/**
 * @Author: Meghna
 * @Date:   2020-06-20
 * @Email:  meghna.gupta@doubtnut.com
 * @Last modified by: Meghna Gupta
 * @Last modified date: 2020-06-24
 */
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const Database = require(__dirname+'/../../api_server/config/database');
const config = require(__dirname+'/../../api_server/config/config');
const mysql = new Database(config.mysql_analytics);
const QuestionHelper = require('../../api_server/server/helpers/question.helper');
const Utility = require('../../api_server/modules/utility');
const mathsteps = require('mathsteps');
const fs = require('fs');
const sendgrid = require("sendgrid")(config.send_grid_key);
const helper = require('sendgrid').mail;
const { Parser } = require('json2csv');
const fields = ['ocr_text', 'compute'];
const JSONparser = new Parser({fields});


function query(qidArray) {
    const sql = `SELECT question_id, original_ocr_text from questions WHERE question_id IN (${qidArray})`;
    return mysql.query(sql);
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
        try {
            // const db = client.db(dbName);
            const file = fs.readFileSync('data.csv', {encoding: 'utf8'})
            const qidArray = file.split('\n');
            // const qidArray = await query(fileArray);
            for (let index = 0; index < qidArray.length; index++) {
                const ocr = qidArray[index];
                if(ocr) {
                    const data = {};
                    // const qid = qidElement.question_id;
                    // const ocr = qidElement.original_ocr_text;
                    const qid = 1234;
                    // const ocr = ``;
                    let cleanedOcr = QuestionHelper.getCleanedOcrText(ocr);
                    cleanedOcr = QuestionHelper.getCleanedOcrText2(cleanedOcr);
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
                    console.log(computational);
                    // data.question_id = qid;
                    data.ocr_text = ocr;
                    data.compute = computational;
                    csvData.push(data);
                }
            }
            await createCsv(csvData);
        } catch(e){
        console.log(e)
        process.exit(1);
        }
    } catch (error) {
        console.error('error: ', error);
        process.exit(1);
    }
}

main()