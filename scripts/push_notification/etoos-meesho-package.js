"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'})
const config = require(__dirname+'/../../api_server/config/config')
const database = require('./database')
const _ = require("lodash")
var sendgrid = require("sendgrid")(config.send_grid_key)
var helper = require("sendgrid").mail;
const moment = require("moment");
var request = require("request")
var rp = require('request-promise');
const cdnUrl = config.cdn_url;
const twoFaKey = config.two_fa_key;
const admin = require('firebase-admin');
const csvArray = require('csv-array');
let csvFilePath = __dirname+'/asciiToText.csv';
const serviceAccount = `${__dirname}/../../api_server/${config.GOOGLE_KEYFILE}`;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.firebase.baseUrl,
});
let Utility = require('../../api_server/modules/utility');

const conRead = config.mysql_analytics;
const conWrite = config.write_mysql;
console.log(conRead)
console.log(conWrite)
const mysqlRead = new database(conRead)
const mysqlWrite = new database(conWrite)
const PACKAGE_DURATION = 30;

let db;
const scriptConfig = {
    activatePackage: 0,
    notification: 1,
    sms: 1,
    whatsApp: 1,
};

main();
async function main() {
        try{
            let mobileNoArray = ['9873434911'];
            //in query
            let studentData = await getStudentInfo(mysqlRead, mobileNoArray);
            let studentPackageId = 7;
            const days = 365;
            // MEESHO_ETOOS
            const campaign = 'MEESHO_ETOOS';
            const feature = 'library_course';
            const channel = 'MEESHO';

            for(let i = 0;i < studentData.length; i++){
                console.log(i);
                // console.log(studentData[i]);
                const studentId = studentData[i].student_id;
                const mobile = studentData[i].mobile;
                const gcmId = studentData[i].gcm_reg_id;
                const payload = {};
                payload.mobile = mobile;
                if(scriptConfig.activatePackage){
                    let insertObject = {
                        is_active : 1,
                        student_id: studentId,
                        amount: 0.00,
                        start_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                        end_date: moment().add(days, "d").format("YYYY-MM-DD HH:mm:ss"),
                        student_package_id: studentPackageId,
                        updated_by: 'etoos-meesho-script',
                    };
                    await makeVip(mysqlWrite, insertObject);
                }
                let deeplink = await generateDeepLink(channel, feature, campaign, payload);
                //send sms
                if(scriptConfig.sms){
                    console.log('sms')
                    await sendSms(course, mobile, deeplink);
                }
                if(scriptConfig.notification){
                    console.log('notification')
                    if(gcmId && gcmId.length > 0){
                        sendNotification(winningAmount, reliefAmount, postId, gcmId, admin);
                    }
                }
                if(scriptConfig.whatsApp){
                    console.log('whatsapp')
                    await sendWhatsAppNotification(certificateLink,winningCaption, mobile);
                }
            }
        } catch (e) {
            console.log(e)
        } finally{
            mysqlRead.connection.end();
            mysqlWrite.connection.end();
        }
}




async function csvReader(path){
    csvArray.parseCSV(path, function(data){
        return data;
    });
}



function sendImageWhatsAppNotification(imageUrl, caption, mobile) {
    const options = {
        method: 'GET',
        url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
        qs:{
            method: 'SendMediaMessage',
            send_to: mobile,
            msg_type: 'image',
            userid: config.whatsapp.login,
            auth_scheme: 'plain',
            data_encoding: 'Unicode_text',
            password: config.whatsapp.password,
            caption,
            v: '1.1',
            format: 'text',
            media_url: imageUrl,
        },
    }
    return rp(options);
}

function getStudentInfo(mysql, idArray){
    const query = 'select * from students where mobile in (?)';
    return mysql.query(query, [idArray]);
}

function makeVip(mysql, obj){
    const query = 'INSERT INTO student_package_subscription set ?'
    return mysql.query(query, obj);
}
function generateDeepLink(channel, feature, campaign , payload=null) {
    // console.log(post_id)
    return new Promise(((resolve, reject) => {
        try {
            const myJSONObject = {
                branch_key: config.branch_key,
                channel,
                feature,
                campaign,
            };
            if(!_.isNull(payload)){
            const data = {};
            myJSONObject.data = payload;
            }
            console.log(myJSONObject)
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

function sendTextWhatsAppMessage(phone_number, message) {
    const obj = {};
    obj.type = 'reply';
    obj.data = message;
        const options = {
            method: 'GET',
            url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
            qs:
            {
                method: 'SendMessage',
                send_to: phone_number,
                msg: text,
                msg_type: 'DATA_TEXT',
                userid: config.whatsapp.login,
                auth_scheme: 'plain',
                data_encoding: 'Unicode_text',
                password: config.whatsapp.password,
                v: '1.1',
                format: 'text',
            },
        };
        return rp(options);
}


function sendNotification(admin, gcmId, event, title, message, imageUrl, data=null, ) {
    const message = {
        event: event,
        title: title,
        message: message,
        image: imageUrl,
    };
    if(!_.isNull(data)) {
        message.data = JSON.stringify(data);
    };
    const messageTosend = {};
    messageTosend.token = gcmId;
    messageTosend.data = message;
    messageTosend.android = {
        priority: 'high',
        ttl: 4500,
    };
    return admin
        .messaging()
        .send(messageTosend)
}

function sendSms(course, mobile, deeplink){
    const formData = {
        To: mobile,
        TemplateName:'etoos_meesho',
        From: 'DOUBTN',
        VAR1: course,
        VAR2: mobile,
        VAR3: deeplink,
    };
    const options = {
        method: 'POST',
        uri: `https://2factor.in/API/V1/${config.two_fa_key}/ADDON_SERVICES/SEND/TSMS`,
        formData: formData,
    };
    return rp(options);
}
