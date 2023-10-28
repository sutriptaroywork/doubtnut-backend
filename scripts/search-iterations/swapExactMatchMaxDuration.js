"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env.dev'});
const fs = require('fs');
const config = require(__dirname+'/../../api_server/config/config');
const Database = require(__dirname+'/../../api_server/config/database');
const mysql = new Database(config.mysql_write);
const moment = require('moment');
const { Parser } = require('json2csv');
const fields = ['question_id', 'ocr_text', 'locale', 'question_image', 'flag', 'match_solution'];
const JSONparser = new Parser({fields});
const request = require('request');
const _ = require('lodash');


function getQuestions() {
    const sql = "select a.video_watched, b.* from (select question_id, video_watched from questions_exact_match order by id desc limit 50) as a left join (select question_id, question_image, locale from questions_new where timestamp>=CURRENT_DATE-1) as b on a.question_id=b.question_id where b.question_id is not null";
    return mysql.query(sql);
}

function getAskApiResponse(question_image, question_id, locale) {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'POST',
            'url': "http://localhost:3001/v10/questions/ask",
            'headers': {
                'Content-Type': 'application/json',
                'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTE3Njk2NTAsImlhdCI6MTY1MjA4NTEwMCwiZXhwIjoxNzE1MTU3MTAwfQ.nBfCbHxyM88ilMsYGQt1S7Y8A4SedKgq8C0neAW9htk',
			    'version_code': '990',
            },
            body: {
                'question_image' : 'image_url',
                'uploaded_image_name': question_image,
                'question': 'WEB',
                'uploaded_image_question_id': question_id,
                locale,
                'question_text': "",
                "checkExactMatch": true,
                "clientSource": "app"
            },
            json: true,
        };
        request(options, function (error, response) {
            if (error){
                console.log(error);
            }
            let qidsArr;
            try {
                qidsArr = response.body.data;
            } catch (e) {
                console.log(e);
                qidsArr = {};
            }
            resolve(qidsArr);   
        });
    })
}

async function main () {   
    try {
        const questions = await getQuestions();
        for (let i=0; i < questions.length; i++) {
            console.log("PROGRESS", Math.floor((i/questions.length)*100));
            const {question_id, question_image, locale, video_watched} = questions[i];
            const response = await getAskApiResponse(question_image, question_id, locale);
        }
    } catch (e) {
        console.error(e)
    }
}

main()
