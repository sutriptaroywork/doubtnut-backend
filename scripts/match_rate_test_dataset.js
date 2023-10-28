const mysql = require('mysql2');
const fs = require('fs');
const _ = require('lodash');
const request = require('request');
// const Data = require('../api_server/data/data');
require('dotenv').config({path : __dirname + '/../api_server/.env.dev'});
const config = require(__dirname+'/../api_server/config/config');
const { jsonToHTMLTable } = require('nested-json-to-table')
const sendgrid = require("sendgrid")(config.send_grid_key);
const helper = require("sendgrid").mail

const myArgs = process.argv.slice(2);
const flagr_get_variants = `/api/v1/flags/3/variants`;
function getIterationAttachment() {
    const options = {
        method: 'GET',
        uri: `${process.env.FLAGR_URL}${flagr_get_variants}`,
        json:true
    };
    return new Promise(((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve((body.filter((x)=> x.key == myArgs[0]))[0].attachment);
            }
        });
    }));
}

function getSearchServiceResp(payload) {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'POST',
            'url': 'http://search-service.doubtnut.internal/api/vexp/search',
            'headers': {
                'Content-Type': 'application/json'
            },
            body: payload,
            json: true,
        };
        request(options, function (error, response) {
            if (error){
                console.log(error);
            }
            let qidsArr;
            try {
                qidsArr = response.body.question.map((x)=> x.id);
            } catch (e) {
                console.log(e);
                qidsArr = [];
            }
            resolve(qidsArr);   
        });
    })
}

// create the connection to database
const connection = mysql.createConnection({
  host: 'analytics-reader.cpymfjcydr4n.ap-south-1.rds.amazonaws.com',
  user: '',
  password: '',
  database: 'classzoo1'
});




function sendMail(subject, to_email, content_html) {
    const style_html = `
        <style>
                table, td, th {
                border: 2px solid black;
                padding: 3px;
                text-align:center;
            }
        </style>`;
    let html = `<html><head>${style_html}</head><body>${content_html}</body></html>`;
    let from_email = new helper.Email("autobot@doubtnut.com");
    let content = new helper.Content("text/html", html);
    let mail = new helper.Mail(from_email, subject, new helper.Email(to_email), content);
    var sg = sendgrid.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
    });

    sendgrid.API(sg, function (error, response) {
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
    })
  } 

async function main(){
    const masterArr=[];
    try{
        connection.query(
            'SELECT * FROM `questions_new` WHERE `allocated_to` IN ("10401", "10402", "10403") and matched_question is not null and ocr_text is not null and subject in ("MATHS","PHYSICS","CHEMISTRY","BIOLOGY") and student_id>100  LIMIT 100',
            async function (err, results) {
                if(err){
                    console.log(err);
                    throw new Error('ERROR');
                }else{
                    if(!results.length){
                        throw new Error('NO RESULTS');
                    }else{
                        let attachment = await getIterationAttachment(myArgs[0]);
                        for(let i=0; i < results.length; i++){
                            let question_id = results[i]['question_id'];
                            let ocr_text = results[i]['ocr_text'];
                            let ocr_type = results[i]['is_trial'];
                            let locale = results[i]['locale'];
                            let subject = results[i]['subject'];
                            let matched_question_id = results[i]['matched_question'];
                            
                            let payload = {
                                ...attachment,
                                ocrType: ocr_type,
                                ocrText: ocr_text,
                                questionLocale: locale
                            }
                            let questionMatches = await getSearchServiceResp(payload);
                            const match_position = questionMatches.indexOf(matched_question_id.toString()) + 1;
                            const is_matched = match_position > 0 ? 1 : 0;
                            masterArr.push({
                                question_id,
                                ocr_text,
                                ocr_type,
                                subject,
                                locale,
                                matched_question_id,
                                match_position,
                                is_matched
                            
                            });
                        }

                        const grouped_subjects = _.groupBy(masterArr, 'subject');
                        const masterJson = [];
                        for(let j=0; j < Object.keys(grouped_subjects).length; j++){
                            let key = Object.keys(grouped_subjects)[j];
                            let data = {
                                subject: key,
                                count: grouped_subjects[key].length,
                                locale: _.groupBy(grouped_subjects[key], 'locale')
                            }
                            for(let m=0; m < Object.keys(data.locale).length; m++){
                                let localeKey = Object.keys(data.locale)[m];
                                data.locale[localeKey] = [
                                    {
                                        title: 'top1',
                                        count: data.locale[localeKey].length,
                                        match_rate: (( data.locale[localeKey].filter((x)=> x.is_matched && x.match_position <= 1).length/ data.locale[localeKey].length ) * 100).toFixed(2)
                                    },
                                    {
                                        title: 'top5',
                                        count: data.locale[localeKey].length,
                                        match_rate: (( data.locale[localeKey].filter((x)=> x.is_matched && x.match_position <= 5).length/ data.locale[localeKey].length ) * 100).toFixed(2)
                                    },
                                    {
                                        title: 'top20',
                                        count: data.locale[localeKey].length,
                                        match_rate: (( data.locale[localeKey].filter((x)=> x.is_matched && x.match_position <= 20).length/ data.locale[localeKey].length ) * 100).toFixed(2)
                                    }
                                ]
                            }
                            masterJson.push(data);
                        }
                        const tableHTML = jsonToHTMLTable(masterJson);
                        sendMail(`${myArgs[0]} TEST DATASET METRICS`, myArgs[1], tableHTML);
                        process.exit();

                    }
                }
            });
    }catch(e){
        console.log('E R R O R');
        console.log(e);
    }
}


main();