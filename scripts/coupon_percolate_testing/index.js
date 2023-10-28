"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'})
const config = require(__dirname+'/../../api_server/config/config')
const database = require('../../api_server/config/database')
const conRead = config.mysql_analytics;
const mysql = new database(conRead)
const Token = require('../../api_server/modules/token');
const request = require("request");
const StudentContainer = require('../../api_server/modules/mysql/student');
const fs = require('fs');
const path = require('path');
const json2csv = require('json2csv').parse;
const _ = require('lodash');
const db = {};
db.mysql = {
    read: mysql
};
db.mongo = {};
db.events_mongo = {};
db.redis = {};


function getAllSubscribedStudents() {
    const sql = 'select distinct student_id from  student_package_subscription where created_at > (now() - interval 30 day) order by rand() LIMIT 1000';
    // const sql = 'select max(view_id) as view_id from video_view_stats where created_at >= (now() - interval 60 minute) and created_at < (now() - interval 30 minute) and parent_id <> 0 group by student_id order by view_id DESC';
    return mysql.query(sql);
}

function getAllNewStudents() {
    const sql = 'select distinct s.student_id from  students as s left join student_package_subscription as sps on  s.student_id=sps.student_id where s.timestamp > (now() - interval 7 day) and sps.student_id is null  and s.is_online is not null order by rand() LIMIT 1000 ';
    return mysql.query(sql);
}

function getCoupons() {
    const sql = "select * from coupons_new where is_show in (3,2,1) and is_active=1 and created_by <> 'referral' and created_by <> 'rewards' and start_date <= CURDATE() and end_date >= CURDATE()";
    return mysql.query(sql);
}

function getVariants() {
    const sql = "select distinct variant_id from payment_summary where created_at > (now() - interval 30 day) LIMIT 100";
    return mysql.query(sql);
}

async function getApplicableCouponResponse(token, versionCode, variantId, studentId, domain) {
    const options = {
        method: 'POST',
        url: `${domain}/v1/coupon/applicable-coupon-codes`,
        headers:
            {
                'content-type': 'application/x-www-form-urlencoded',
                'x-auth-token': token,
                version_code: versionCode,
            },
        form: {
                variant_id: variantId,
                student_id: studentId,
                payment_for: 'course_package',
            }
    };
    console.log(options);
    const responseBody = await new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            console.log('*******************************')
            console.log(domain)
            console.log(error)
            console.log('*******************************')
            if (error) throw new Error(error);
            resolve(response.body);
            console.log(body);
        });
    });
    return JSON.parse(responseBody);
}

async function generateCSVFile(fileName, fields, data) {
    try {
        // output file in the same folder
        const filename = path.join(__dirname, 'CSV', `${fileName}`);
        let rows;
        // If file doesn't exist, we will create new file and add rows with headers.
        if (!fs.existsSync(filename)) {
            rows = json2csv(data, { header: true });
        } else {
            // Rows without headers.
            rows = json2csv(data, { header: false });
        }

        // Append file function can create new file too.
        fs.appendFileSync(filename, rows);
        // Always add new line if file already exists.
        fs.appendFileSync(filename, "\r\n");
    } catch (e) {
        console.log("csv error", e);
        return e;
    }
}

async function validate(token, versionCode, couponCode, variantId, domain) {
    const options = {
        'method': 'POST',
        'url': `${domain}/v2/payment/checkout/payment-details`,
        'headers': {
            'version_code': versionCode,
            'x-auth-token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "amount": "",
            "variant_id": variantId,
            "coupon_code": couponCode,
            "use_wallet_reward": false,
            "switch_assortment": "",
            "payment_for": "course_package",
            "use_wallet_cash": false
        })

    };
    const responseBody = await new Promise((resolve, reject) => {
        request(options, function (error, response) {
            console.log('*******************************')
            console.log(domain)
            console.log(error)
            console.log('*******************************')
            if (error) throw new Error(error);
            console.log(response.body);
            resolve(response.body);
        });
    });
    return JSON.parse(responseBody);
}

function getRandomArbitrary(min, max) {
    return parseInt(Math.random() * (max - min) + min);
}
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const wrongCasesApplicable = [];
(async () => {
    try {

        console.log(`the script started at ${new Date()}`);
        const [subscribedStudents, newStudents, coupons, variants] = await Promise.all([getAllSubscribedStudents(),getAllNewStudents(), getCoupons(), getVariants()])
        let totalStudents = [...newStudents, ...subscribedStudents];
        shuffle(totalStudents);
        // let totalStudents = [...newStudents];
        for (let i=0; i< totalStudents.length; i++) {
            console.log(totalStudents[i]);
            const studentDetails = await StudentContainer.getById(totalStudents[0].student_id, db.mysql.read)
            let token = Token.sign({ id: totalStudents[i].student_id }, config.jwt_secret_new);
            const variantId = variants[getRandomArbitrary(0, variants.length)].variant_id;
            console.log(variantId);
            // const [applicableCouponLive, applicableCouponNew] = await Promise.all([getApplicableCouponResponse(token, studentDetails[0].is_online, variantId, totalStudents[i].student_id), getApplicableCouponResponse(token, studentDetails[0].is_online, variantId, totalStudents[i].student_id)]);
            const [applicableCouponLive, applicableCouponNew] = await Promise.all([getApplicableCouponResponse(token, studentDetails[0].is_online, variantId, totalStudents[i].student_id, 'https://dev6.doubtnut.com'), getApplicableCouponResponse(token, studentDetails[0].is_online, variantId, totalStudents[i].student_id, 'https://test5.doubtnut.com')]);
            // const applicableCouponNew = applicableCouponLive;
            // console.log(applicableCouponLive);
            for (let j=0; j< applicableCouponNew.data.coupon_list.length; j++) {
                let coupon = _.find(applicableCouponLive.data.coupon_list, {coupon_title: applicableCouponNew.data.coupon_list[j].coupon_title});
                if (coupon) {
                    if (
                        coupon.coupon_title == applicableCouponNew.data.coupon_list[j].coupon_title &&
                        coupon.amount_saved == applicableCouponNew.data.coupon_list[j].amount_saved &&
                        coupon.amount == applicableCouponNew.data.coupon_list[j].amount &&
                        coupon.validity == applicableCouponNew.data.coupon_list[j].validity
                    ) {
                        console.log('right case');
                        const [validateLive, validateNew] = await Promise.all([validate(token, studentDetails[0].is_online,  coupon.coupon_title, variantId, 'https://dev6.doubtnut.com'),validate(token, studentDetails[0].is_online,  coupon.coupon_title, variantId, 'https://test5.doubtnut.com')])
                        console.log('inside');
                        if (validateLive.data.coupon_info.status != validateNew.data.coupon_info.status) {
                            await generateCSVFile('test.csv', ['type', 'student_id', 'coupon_code', 'variant_id', 'token'], {'type' : 'validation-status', 'student_id': studentDetails[0].student_id, 'coupon_code': coupon.coupon_title, 'variant_id': variantId, 'token': token});
                            console.log('wrong case validation');
                            continue;
                        }
                        if (validateLive.data.coupon_info.message != validateNew.data.coupon_info.message) {
                            await generateCSVFile('test.csv', ['type', 'student_id', 'coupon_code', 'variant_id', 'token'], {'type' : 'validation-message', 'student_id': studentDetails[0].student_id, 'coupon_code': coupon.coupon_title, 'variant_id': variantId, 'token': token});
                            console.log('wrong case validation');
                            continue;
                        }
                        if (validateLive.data.coupon_info.code != validateNew.data.coupon_info.code) {
                            await generateCSVFile('test.csv', ['type', 'student_id', 'coupon_code', 'variant_id', 'token'], {'type' : 'validation-code', 'student_id': studentDetails[0].student_id, 'coupon_code': coupon.coupon_title, 'variant_id': variantId, 'token': token});
                            console.log('wrong case validation');
                            continue;
                        }
                        if (validateLive.data.cart_info[2].value != validateNew.data.cart_info[2].value) {
                            await generateCSVFile('test.csv', ['type', 'student_id', 'coupon_code', 'variant_id', 'token'], {'type' : 'validation-value', 'student_id': studentDetails[0].student_id, 'coupon_code': coupon.coupon_title, 'variant_id': variantId, 'token': token});
                            console.log('wrong case validation');
                            continue;
                        }
                        console.log('successfully validated');


                        // if (
                        //     validateLive.data.coupon_info.status == validateNew.data.coupon_info.status &&
                        //     validateLive.data.coupon_info.message == validateNew.data.coupon_info.message &&
                        //     validateLive.data.coupon_info.code == validateNew.data.coupon_info.code &&
                        //     validateLive.data.cart_info[2].value == validateNew.data.cart_info[2].value
                        // ) {
                        // } else {
                        //     await generateCSVFile('test.csv', ['type', 'student_id', 'coupon_code', 'variant_id', 'token'], {'type' : 'validation', 'student_id': studentDetails[0].student_id, 'coupon_code': coupon.coupon_title, 'variant_id': variantId, 'token': token});
                        //     console.log('wrong case validation');
                        //     console.log(totalStudents[i]);
                        //     console.log(variantId);
                        //     console.log(token);
                        // }
                    } else {
                        wrongCasesApplicable.push({student_id: totalStudents[i].student_id, token,variantId})
                        console.log(totalStudents[i]);
                        console.log(variantId);
                        console.log(token);
                        await generateCSVFile('test.csv', ['type', 'student_id', 'coupon_code', 'variant_id', 'token'], {'type' : 'applicable', 'student_id': studentDetails[0].student_id, 'coupon_code': coupon.coupon_title, 'variant_id': variantId, 'token': token});
                        console.log('wrong case');
                    }
                } else {
                    await generateCSVFile('test.csv', ['type', 'student_id', 'coupon_code', 'variant_id', 'token'], {'type' : 'applicable', 'student_id': studentDetails[0].student_id, 'coupon_code': applicableCouponNew.data.coupon_list[j].coupon_title, 'variant_id': variantId, 'token': token});
                    wrongCasesApplicable.push({student_id: totalStudents[i].student_id, token,variantId})
                    console.log(totalStudents[i]);
                    console.log(variantId);
                    console.log(token);
                    console.log('wrong case');
                }
            }
            if (applicableCouponNew.data.coupon_list.length == 0 && applicableCouponLive.data.coupon_list.length == 1 && applicableCouponLive.data.coupon_list[0].coupon_title == 'SSCGD25') {
                console.log('right case');
            } else if (applicableCouponNew.data.coupon_list.length == 0 && applicableCouponLive.data.coupon_list.length == 0) {
                console.log('right case');
            }
            // console.log('****************')
            // console.log(wrongCasesApplicable);
            // console.log('****************')
        }
        console.log(totalStudents.length);
        console.log(`the script ended at ${new Date()}`);
    } catch (error) {
        console.log(error);
    } finally {
        mysql.close();
    }
})();