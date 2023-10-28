const bluebird = require('bluebird');
const redis = require('redis');
const _ = require('lodash');
const SendOtp = require('sendotp');
bluebird.promisifyAll(redis);
const redisClient = redis.createClient(`redis://${process.env.REDIS_HOST}:6379`);
const msgKey = process.env.MSG91_KEY;

const mysql = require('mysql');

const OtpCallback = require('./getData')
const FlagrUtility = require('./flagrData')

exports.handler = async (event) => {
	try {
        const message = JSON.parse(event.Records[0].Sns.Message);
        const mobile = message.To;
        var mysql_conn = mysql.createConnection({ host: process.env.HOST, user: process.env.USER, password: process.env.PASSWORD, database: process.env.DB_NAME});
        mysql_conn.connect();
        // let studentData = await OtpCallback.getStudentIdByMobile(mysql_conn, mobile);
        let flagrResp = await FlagrUtility.getVariantAttachment(mobile.toString(), {}, 26, 1000)
        if (flagrResp != undefined) {
            console.log('flagrResp <<<>>>', flagrResp);
            if (flagrResp.enabled) {
                let data = await getOtpByContact(mobile, redisClient);
                if(!_.isNull(data)){
                    data = JSON.parse(data);
                    const sessionnId = data.session_id;
                    const otp = data.otp;
                    //check if it is 2fa or msg91
                    if(sessionnId.indexOf('-') > -1){
                        //send sms via msg91
                        await sendOtp(mobile, otp, msgKey);
                    } else {
                        //send sms via 2fa
                    }
                    return new Promise(((resolve) => {
                        resolve('Completed');
                    }));
                }else{
                    return new Promise(((resolve, reject) => {
                        reject(new Error('Galat Scene in redis'));
                    }));
                }
            }
        }
	} catch (e) {
		console.log(e);
		return new Promise(((resolve, reject) => {
			reject(new Error('Galat Scene in catch block'));
		}));
	}finally {
        mysql_conn.end(function(err){
          if (err) {
            console.log("connection not closed")
            console.log(err)
          }else{
            console.log("DB connection ended")
          }
        })
    }
};


function sendOtp(mobile, otp, key) {
    const sendMsg91Otp = new SendOtp(key, '<#> {{otp}} is your OTP to login to the awesome world of Doubtnut.                                                                                Tp3vko4fb/t');
    return new Promise((resolve, reject) => {
        sendMsg91Otp.send(mobile, 'DOUBTN', otp, (error, data) => {
            if (!error && typeof data != 'undefined' && !_.isNull(data) && data.type === 'success' && !_.isNull(data.message)) {
                const response = { Status: data.type, Details: data.message, service_type: 'msg91' };
                resolve(response);
            } else {
                console.log(error);
                reject(error);
            }
        });
    });
}

function getOtpByContact(mobile,client) {
  return client.getAsync(`otp_${mobile}`);
}
