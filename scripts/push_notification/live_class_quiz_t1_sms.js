"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
const mysqlR = new database(config.read_mysql);
const mysqlW = new database(config.mysql_write);
const request = require('request');
const _ = require('lodash');


main()
async function main (){
	try{
        const quizStudents = await getQuizStudents();
        const students = quizStudents.map((a) => a.mobile);
        console.log(students);
        if(students.length > 0) {
            const contestWinner = await getWinner();
            const deeplink = await generateDeeplink(config, "SMS",'video', 'SMS_LIVE_CLASS_T1', contestWinner[0].question_id, '', 'DEEPLINK', 115);
            console.log(deeplink.url)
            if(deeplink.url) {
                for(let i=0;i <students.length ; i++) {
                    const response = await sendSms(config, deeplink.url, students[i]);
                    console.log(response);
                    const insertObj = {
                        mobile:students[i],
                        response,
                        deeplink: deeplink.url,
                        type:1,
                    }
                    await insertData(insertObj);
                }
            }
        }

    }catch(e){
        console.log(e)
        mysqlR.connection.end();
        mysqlW.connection.end();
    }finally {
          console.log("the script successfully ran at "+ new Date())
          mysqlR.connection.end();
          mysqlW.connection.end();
    }
}

function insertData(insertObj) {
    let sql = "insert into quiz_sms_campaign_data SET ?";
    return mysqlW.query(sql,[insertObj]);
}

function getQuizStudents() {
    let sql = "select b.student_id, b.mobile from (select distinct(student_id) from liveclass_quiz_response where date(created_at) = CURRENT_DATE) a left join students b on a.student_id=b.student_id where b.student_id is not null";
    // let sql = "select student_id, mobile from students where student_id='14067957'";
    return mysqlR.query(sql);
}


function getWinner() {
    let sql = "SELECT question_id from classzoo1.questions where student_id=80 and question like 'Winners Announcement%' and date(timestamp) = CURRENT_DATE order by question_id DESC limit 1";
    return mysqlR.query(sql);
}


function generateDeeplink(config, channel, feature, campaign, question_id, type, page, student_id) {
    // console.log(post_id)
    return new Promise(((resolve, reject) => {
        try {
            const myJSONObject = {
                branch_key: config.branch_key,
                channel,
                feature,
                campaign,
            };
            const data = {};
            if (!_.isNull(page)) {
                data.page = page;
            }
            if (!_.isNull(question_id)) {
                data.qid = question_id;
                data.resource_type = 'video';
            }
            if (!_.isNull(type)) {
                data.type = type;
            }
            if (!_.isNull(student_id)) {
                data.sid = student_id;
            }
            myJSONObject.data = data;
            console.log(myJSONObject);
            request(
                {
                    url: 'https://api.branch.io/v1/url',
                    method: 'POST',
                    json: true, // <--Very important!!!
                    body: myJSONObject,
                },
                (error, response, body) => {
                    if (error) {
                        console.log(error);
                    } else {
                        // console.log(body);
                        return resolve(body);
                    }
                },
            );
        } catch (e) {
            console.log(e);
            return reject(e);
        }
    }));
}

function sendSms(config, deeplink, mobile) {
    return new Promise(((resolve, reject) => {
        try {
            var options = { method: 'GET',
            url: 'https://api.msg91.com/api/sendhttp.php',
            qs: 
            { authkey: config.MSG91_AUTH_KEY,
                mobiles: mobile,
                country: '91',
                message: 'Well Done!! Thankyou for quiz participation. Dekhiye ki kya aap h aaj ke WINNER | Check now :'+deeplink,
                sender: 'DOUBTN',
                route: '4' }};
                request(options, function (error, response, body) {
                    if (error) throw new Error(error);
                    return resolve(body);
                    });

        } catch (e) {
            console.log(e);
            return reject(e);
        }
    }));
}