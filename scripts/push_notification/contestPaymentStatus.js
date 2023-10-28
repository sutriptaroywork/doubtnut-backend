"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'})
const config = require(__dirname+'/../../api_server/config/config')
const database = require('./database')
var mongoose = require('mongoose');
const bluebird = require('bluebird');
bluebird.promisifyAll(mongoose);
const _ = require("lodash")
var sendgrid = require("sendgrid")(config.send_grid_key)
var helper = require("sendgrid").mail;
const moment = require("moment");
var request = require("request")
var rp = require('request-promise');
const cdnUrl = config.cdn_url;
const twoFaKey = config.two_fa_key;
const admin = require('firebase-admin');
const puppeteer = require('puppeteer')
const fs = require('fs')
var mime = require('mime-types')

const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const { exec } = require('child_process');
const path = require('path')
const aws = require('aws-sdk')
const serviceAccount = `${__dirname}/../../api_server/${config.GOOGLE_KEYFILE}`;
console.log(serviceAccount)
aws.config.setPromisesDependency(bluebird);
aws.config.update({
    accessKeyId: config.aws_access_id,
    secretAccessKey: config.aws_secret,
    region: config.aws_region,
    signatureVersion: config.aws_signature_version,
});
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.firebase.baseUrl,
});
config.mongo.database_url = config.mongo.database_url.replace("{database}", "doubtnut");
let Utility = require('../../api_server/modules/utility');
let PaytmHelper = require('../../api_server/modules/paytm/helper');
let PostModel = require('../../api_server/modules/mongo/post');
var PostSchema = PostModel.schema;
PostModel = mongoose.model('Post', PostSchema);

const conRead = config.mysql_analytics;
const conTestRead = config.read_mysql;
const conWrite = config.write_mysql;
console.log(conRead)
console.log(conTestRead)
console.log(conWrite)
console.log(config.mongo.database_url)
const mysqlRead = new database(conRead)
const mysqlTestRead = new database(conTestRead)
const mysqlWrite = new database(conWrite)

let db;
const scriptConfig = {
    insertWinnersProcess: 0,
    notification: 0,
    sms: 0,
    feedPost: 0,
    whatsApp: 0,
    payment: 0,
    generateCertificate: 0,
    checkStatus: 1
};
let monthList = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"
];
const s3 = new aws.S3();

main()
async function main() {
    mongoose.connect(config.mongo.database_url, { useNewUrlParser: true, autoIndex: false, useUnifiedTopology: true }).then(async () => {
        console.log('Successfully connected to mongoose');
        try{
            //select contest winners
            const contestId = 2;
            if(scriptConfig.insertWinnersProcess){
                await insertWinnerProcess(mysqlTestRead, mysqlRead, mysqlWrite, contestId);
            }
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setViewport({
              width: 1350,
              height: 2400,
              deviceScaleFactor: 1,
            })
            let template = await readFileAsync('./certificate_generation/thumbnail-design.html','utf8')

            let contestWinners = await getWinnersFromContestWinners(mysqlTestRead, contestId);
            console.log(contestWinners)
            for(let i = 0;i < contestWinners.length; i++){
                let postId = null;
                const contestWinnerId = contestWinners[i].contest_winner_id;
                const userName = contestWinners[i].student_username;
                const winningAmount = contestWinners[i].winning_amount;
                const studentId = contestWinners[i].student_id;
                const mobile = contestWinners[i].mobile;
                const gcmId = contestWinners[i].gcm_reg_id;
                const date = moment().format('YYYY-MM-DD');
                const fileName = `${date}_${studentId}.png`;
                const certificateLink = `${cdnUrl}contest_winners/${fileName}`;
                const reliefAmount = parseInt(contestWinners[i].amount) - contestWinners[i].winning_amount;
                const winningCaption = `Mubaarak ho! ₹${winningAmount} GoCoronaGo Contest mein jitne pe! 🥳
Aur PM Cares Fund mein ₹${reliefAmount} ke yogadaan ke liye धन्यवाद! 🙏`;
                const orderId = (_.isNull(contestWinners[i].order_id)) ? `${contestWinnerId}-${mobile}-paytm`: (contestWinners[i].order_id);

// {"status":"SUCCESS","statusCode":"DE_001","statusMessage":"Successful disbursal to Wallet is done","result":{"mid":"Class217310097989351","orderId":"16632-9873434911-paytm","paytmOrderId":"202004032143166828327545","amount":"1.00","commissionAmount":"0.00","tax":"0.00","rrn":null,"beneficiaryName":null}}
                if(scriptConfig.checkStatus){
                    const result = await PaytmHelper.disburseStatus(orderId);
                    let statusMessage = 'failed'
                    //update contest winner
                    if(result.status === 'SUCCESS'){
                        statusMessage = 'success';
                    }
                    await updatePaymentStatus(mysqlWrite, contestWinnerId, 'paytm', statusMessage)

                    let insertObject = {}
                    insertObject.contest_winner_id = contestWinnerId;
                    insertObject.order_id = result.result.orderId;
                    insertObject.status = result.status;
                    insertObject.status_message = result.statusMessage;
                    insertObject.status_code = result.statusCode;
                    insertObject.mid = result.result.mid;
                    insertObject.paytm_order_id = result.result.paytmOrderId;
                    insertObject.amount = result.result.amount;
                    insertObject.commission_amount = result.result.commissionAmount;
                    insertObject.tax = result.result.tax;
                    insertObject.rrn = result.result.rrn;
                    insertObject.beneficiary_name = result.result.beneficiaryName;
                    console.log(insertObject)
                    // await addPaymentMeta(mysqlWrite,insertObject);
                }
            }
            // let res = await PaytmHelper.disburse('9873434911','1234','1') // paytm
            // let res = await PaytmHelper.bankDisburse('123456789','1', 'UPI', {upi:'9873434911@ybl'}, '9873434911') //upi
            // let res = await PaytmHelper.bankDisburse('1234567','1', 'bank', {accountNumber:'00000030856686853',ifsc:'SBIN0009370'}, '9873434911') //bank
            // let res = await PaytmHelper.disburseStatus('12345678') //
            // 00000030856686853
            // SBIN0009370
            // console.log(res)
            // let res = await sendWhatsAppNotification('https://d10lpgp6xz60nq.cloudfront.net/contest_winners/2020-04-03_2524641.png', 'tree', '9873434911')
            // let res = await sendWhatsAppMessage('9873434911', 'tree')
            // console.log(res)
            // await sendWinningSms('500','100','test.png','9873434911')
        } catch (e) {
            console.log(e)
        } finally{
            mysqlRead.connection.end();
            mysqlWrite.connection.end();
            mysqlTestRead.connection.end();
            mongoose.connection.close();
        }
    }).catch((err) => {
        console.error(`Could not connect to the database. Exiting now...${err}`);
        process.exit();
    });
}



async function makeThumbnail(template, page, userName, reliefAmount, date, fileName) {
    console.log('test')
  template =  template.replace('##',userName)
  template =  template.replace('#!',userName)
  template =  template.replace('$$',reliefAmount)
  template =  template.replace('!!',date)

  await page.setContent(template)

  return new Promise(async (resolve, reject) => {
      try {
        let c = await page.screenshot({path:  './certificate_generation/contest_winners/'+ fileName ,type:"png"})
        const fileContent = await fs.readFileSync('./certificate_generation/contest_winners/'+fileName);
        // const stats =  await fs.statSync('./certificate_generation/contest_winners/'+fileName)
        console.log(mime.lookup('./certificate_generation/contest_winners/'+fileName) )
        // console.log(stats)
        const params = {
            Bucket: 'doubtnut-static',
            Key: 'contest_winners/'+fileName, // File name you want to save as in S3
            Body: fileContent,
            ContentType: mime.lookup('./certificate_generation/contest_winners/'+fileName),
            ACL: 'public-read',
            // ContentLength: stats.size
        };

        // Uploading files to the bucket
        let a = await s3.upload(params, function(err, data) {
            console.log(data)
            if (err) {
                throw err;
            }
            console.log(`File uploaded successfully. ${data.Location}`);
            resolve();
        });
      } catch (err) {
          console.log(err);
          throw new Error(err);
      }
  })
}
function sendWhatsAppNotification(imageUrl, caption, mobile) {
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
    console.log(options)
    return rp(options);
}

function sendFailWhatsAppMessage(phone_number, formUrl) {

    const obj = {};
    obj.type = 'reply';
    obj.data = `GoCoronaGo Paytm Payment Failed ❌
Inaam paane ke liye details submit karein👇😃
${formUrl}`;
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

function sendWinningNotification(winningAmount, reliefAmount, postId, gcmId, admin){
    const notification_data = {
        event: 'feed_details',
        title: `GoCoronaGo Contest ke ₹${winningAmount} hue aapke 😃🎉`,
        message: `PM Cares Fund में ₹${reliefAmount} के योगदान के लिए धन्यवाद🙏`,
        image: `https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5A742AA8-D6DF-0CA5-388B-39C340FD2AA0.webp`,
        data: JSON.stringify({ type: 'ugc', id: postId }),
    };
    return sendNotification(gcmId, notification_data, admin);
}

function sendPaymentFailNotification(webUrl, gcmId, admin){
    const notification_data = {
        event: 'external_url',
        title: 'GoCoronaGo Paytm Payment Failed ❌',
        message: 'Inaam paane ke liye details submit karein👇😃',
        image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/88AF102A-56BD-2E82-C8C3-5B77247B5C67.webp',
        data: JSON.stringify({ url: webUrl }),
    };
    return sendNotification(gcmId, notification_data, admin);
}

function sendNotification(gcmId, message, admin) {
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

function sendWinningSms(winningAmount, reliefAmount, certificateLink, mobile){
    const formData = {
        To: mobile,
        TemplateName:'contest_winner_3',
        From: 'DOUBTN',
        VAR1: winningAmount,
        VAR2: reliefAmount,
        VAR3: certificateLink
    };
    const options = {
        method: 'POST',
        uri: `https://2factor.in/API/V1/${config.two_fa_key}/ADDON_SERVICES/SEND/TSMS`,
        formData: formData,
    };
    return rp(options);
}
function sendPaymentFailSms(formLink, mobile){
    const formData = {
        To: mobile,
        TemplateName:'paytm_fail',
        From: 'DOUBTN',
        VAR3: formLink
    };
    var options = {
        method: 'POST',
        uri: `https://2factor.in/API/V1/${config.two_fa_key}/ADDON_SERVICES/SEND/TSMS`,
        formData: formData,
    };
    return rp(options);
}
async function addFeedPost(contestWinnerId, studentUsername, winningAmount, reliefAmount, certificateLink) {
    try{
        const studentId = 1706545;
        const text = `Mubarak ho! ${studentUsername} aaj aap ₹${winningAmount} GoCoronaGo Contest mein jeete hai! 🥳, aur PM Cares Fund mein ₹${reliefAmount} ka Yogadaan humne aapko aur se kiya hai! धन्यवाद! 🙏`;
        const imageUrl = certificateLink;
        const studentClass = 12;
        const postUserName = 'Doubtnut';
        const studentAvatar = 'https://d10lpgp6xz60nq.cloudfront.net/images/logo.png';
        let result = await savePost({studentId,text,imageUrl,postUserName,studentAvatar}, PostModel);
        //update the id in contest winners table
        await updatePostId(mysqlWrite, contestWinnerId, result['_id']);
        return result._id;
    } catch(e){
        console.log("Error while inserting feed post")
        console.log(e)
        throw new Error(e);
    }
}

function savePost(data, Postmodel) {
    try{
        const {
            studentId,
            text,
            imageUrl,
            studentClass,
            studentUsername,
            studentAvatar,
        } = data;
        let sample = {}
        sample.type = 'JustAThought'
        sample.student_id = studentId
        sample.text = text
        sample.image = imageUrl
        if (sample.text.length > 0) {
          sample.contain_text = true
        } else {
          sample.contain_text = false
        }
        sample.contain_audio = false
        if (sample.image.length > 0) {
          sample.contain_image = true
        } else {
          sample.contain_image = true
        }
        sample.class_group = studentClass
        sample.student_username = studentUsername
        sample.student_avatar = studentAvatar
        let post = new Postmodel(sample);
        return post.save();
    }catch(e){
      console.log(e)
      throw new Error(e);
    }
}

function updatePostId(mysql, contestWinnerId, postId) {
    let query = `UPDATE contest_winners SET post_id = '${postId}' where id = ${contestWinnerId}`;
    return mysql.query(query)
}
function updateOrderId(mysql, contestWinnerId, orderId) {
    let query = `UPDATE contest_winners SET order_id = '${orderId}' where id = ${contestWinnerId}`;
    return mysql.query(query)
}
function updatePaymentStatus(mysql, contestWinnerId, mode, status) {
    let query = `UPDATE contest_winners SET payment_mode = '${mode}', payment_status= '${status}' where id = ${contestWinnerId}`;
    return mysql.query(query)
}
function addPaymentMeta(mysql, data){
    const query = 'INSERT INTO contest_winner_payment_meta SET ?';
    return mysql.query(query);
}

function getWinnersFromContestWinners(mysql, contestId){
    let query = `select * from (SELECT id as contest_winner_id,order_id,student_id,amount as winning_amount,date,position,contest_id,type,parameter,count as c_count FROM contest_winners WHERE contest_id='${contestId}' and date = date_sub(CURRENT_DATE,INTERVAL 0 DAY) order by position asc) as a left join (select student_id,gcm_reg_id, student_fname,student_lname, gender, student_email,img_url, school_name, ex_board, mobile, country_code,pincode,student_class,student_username,coaching,dob from students) as b on a.student_id=b.student_id left join (select * from contest_details) as c on a.contest_id=c.id`;
    console.log(query)
    return mysql.query(query);
}

async function insertWinnerProcess(mysqlTestRead, mysqlRead, mysqlWrite, contestId) {
    const contestDetails = await getContestDetails(contestId, mysqlRead);
    console.log(contestDetails)
    const winnerCount = contestDetails[0].winner_count;
    const amount = (_.isNull(contestDetails[0].deduction)) ? contestDetails[0].amount : (contestDetails[0].amount - ((contestDetails[0].deduction/100) * contestDetails[0].amount));
    const contestType = contestDetails[0].type;
    const contestParameter = contestDetails[0].parameter;
    //select winners first
    const contestWinners = await selectWinners(mysqlRead, contestId, winnerCount);
    const date = moment().format('YYYY-MM-DD');
    const promise = [];
    let bulkInsertData = []
    for(let i = 0; i < contestWinners.length; i++ ){
        const studentId = contestWinners[i].student_id;
        const position = i+1;
        const count = contestWinners[i].count_r;
        bulkInsertData.push(bulkDataMaker({studentId, amount, date, position, contestId, contestType, contestParameter, count}))
    }
    return addContestWinners(mysqlWrite, bulkInsertData);
}

function getContestDetails(contestId,mysql){
    let query = `SELECT * FROM contest_details where date_from<=curdate() && date_till>=curdate() and id = ${contestId}`;
    return mysql.query(query);
}

function selectWinners(mysql, contestId, winnerCount){
    let upperLimit = winnerCount+50;
    let query = `Select a.* from (SELECT student_id, count(view_id) as count_r,sum(engage_time) as total_engagement_time, max(created_at),min(created_at) FROM video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAL 0 DAY) and engage_time >=30 and refer_id=0 and source like 'android' group by student_id having count(view_id)>=40 order by rand() limit ${upperLimit}) as a left join contest_debarred_students as b on a.student_id = b.student_id left join (Select student_id from contest_winners where contest_id = '${contestId}' and date >date_sub(CURRENT_DATE, INTERVAL 10 DAY)) as c on a.student_id =c.student_id left join students as d on a.student_id = d.student_id where c.student_id is null and b.student_id is null and d.mobile is not null order by rand() LIMIT ${winnerCount}`;
    return mysql.query(query);
}

function bulkDataMaker(dataObject){
    return [
        dataObject.studentId,
        dataObject.amount,
        dataObject.date,
        dataObject.position,
        dataObject.contestId,
        dataObject.contestType,
        dataObject.contestParameter,
        dataObject.count,
    ];
}

function addContestWinners(mysql, data) {
    let query = `INSERT INTO contest_winners (student_id, amount, date, position, contest_id, type, parameter, count) VALUES ?`;
    return mysql.query(query, [data]);
}
