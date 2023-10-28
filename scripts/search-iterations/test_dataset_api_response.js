require('dotenv').config({path : __dirname + '/../../api_server/.env.dev'});
const _ = require('lodash');
const moment = require('moment');
const request = require('request');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://mongo-rs0-1.internal.doubtnut.com:27017,mongo-rs0-2.internal.doubtnut.com:27017,mongo-rs0-3.internal.doubtnut.com:27017/doubtnut?replicaSet=rs0&readPreference=secondaryPreferred&connectTimeoutMS=60000&socketTimeoutMS=60000&retryWrites=true&readPreferenceTags=analytics:yes';
const dbName = 'doubtnut';
const config = require(__dirname+'/../../api_server/config/config');
const Database = require(__dirname+'/../../api_server/config/database');
const mysql = new Database(config.mysql_analytics);


function getGlobalMatchesFromSearchService(payload) {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'POST',
            'url': 'https://api.doubtnut.com/v1/search/get-global-matches-from-search-service',
            'headers': {
                'Content-Type': 'application/json',
                'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTE3Njk2NTAsImlhdCI6MTYzNTg1MjY1NSwiZXhwIjoxNjk4OTI0NjU1fQ.q2QncGMQSiL6nDnhrQAZXm5lS8a78OXGTkMA9R3uSF4'
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
                qidsArr = response.body.data;
            } catch (e) {
                console.log(e);
                qidsArr = [];
            }
            resolve(qidsArr);   
        });
    })
}

function getQuestions() {
    const sql = `select locale, is_trial, question_id, ocr_text, question_image, student_id, subject,class from classzoo1.questions_new where timestamp>=CURRENT_DATE-1 and timestamp<CURRENT_DATE and ocr_text is not null and question_image is not null order by rand() limit 100`;
    return mysql.query(sql);
}

function getUserBoard(studentId) {
    const sql = `select b.course from ((select ccm_id from student_course_mapping where student_id=${studentId}) as a inner join (select id,course,category from class_course_mapping where category='board') as b on a.ccm_id=b.id)`;
    return mysql.query(sql);
}

function getUserLocale(student_id) {
    const sql = `select locale from classzoo1.students where student_id = ${student_id}`;
    return mysql.query(sql);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function main() {
    try {
        let csvData = [];
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function (err, client) {
            try {
                if (err) {
                    console.log(err);
                    process.exit(1);
                }
                const mongodb = client.db(dbName);
                const videoLanguageFilters = ['no_filters','en','hi','bn','gu','te','ta','mr','ml','kn','od']
                const results = await getQuestions();
                for (let k =0; k<results.length;k++) {
                    console.log("k=",k)
                    const { question_id, ocr_text, question_image, is_trial, locale, student_id, subject} = results[k];
                    const studentClass = results[k].class;
                    let mysqlresponse = await Promise.all([getUserBoard(student_id), getUserLocale(student_id)]);
                    const app_locale = mysqlresponse[1].length ? _.get(mysqlresponse[1][0], 'locale', 'en') : 'en';
                    const user_board = mysqlresponse[0].length ? _.get(mysqlresponse[0][0], 'course', '') : '';
                    const req_obj = {
                        "fileName": question_image,
                        "ocrText": ocr_text,
                        "userQid": question_id,
                        "ocrType": is_trial,
                        "questionLocale": locale,
                        "appLocale": app_locale,
                        "schoolBoard": user_board,
                        "isTyd": false,

                    }
                    console.log(question_id)
                    const insert_obj = {};
                    let should_insert = true;
                    for (let i =0; i<videoLanguageFilters.length; i++) {
                        if(videoLanguageFilters[i] != 'no_filters') {
                            req_obj.videoLanguageFilters = videoLanguageFilters[i]
                        }   
                        const response = await getGlobalMatchesFromSearchService(req_obj);  
                        await sleep(1000);
                        const myObj = {}
                        if (typeof response !== 'undefined') {
                            for(let j =0;j<response.length;j++) {
                                myObj[Object.keys(response[j])[0]] = {}
                                myObj[Object.keys(response[j])[0]]['matches'] = response[j][Object.keys(response[j])[0]].matches.map((x) => x._id);
                                myObj[Object.keys(response[j])[0]]['query_ocr_text'] = response[j][Object.keys(response[j])[0]].query_ocr_text;
                            }
                            insert_obj[videoLanguageFilters[i]] = myObj;
                        } else {
                            should_insert = false;
                            break;
                        }
                    }
                    if (should_insert) {
                        console.log("insert");
                        await mongodb.collection('test_dataset_api_responses').insertOne({
                            question_id: question_id,
                            question_image,
                            ocr_text,
                            question_locale: locale,
                            subject,
                            student_id,
                            class: studentClass,
                            createdAt: moment.now(),
                            app_locale,
                            board: user_board,
                            locale_wise_matches: {...insert_obj}
                        })
                    }
                }
                process.exit(0);
            } catch(e) {
                console.error(e);
                process.exit(1);
            }
        })
    } catch(e) {
        console.error(e)
        process.exit(1);
    }
}

main()
