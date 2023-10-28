const axios = require('axios');
const _ = require('lodash');
const querystring = require('querystring');
const logger = require('../../../config/winston').winstonLogger;
const Student = require('../../../modules/student');

class ValueFirst {
    async sendMessage(mobile, messageText, otp, dbMysqlWrite, sessionId, is_web) {
        const vfusername = process.env.VALUEFIRST_USERNAME;
        const vfpassword = process.env.VALUEFIRST_PASSWORD;
        const vfsender = process.env.VALUE_FIRST_SENDER;

        return new Promise(function(resolve, reject){
            const messageId = sessionId;
            axios.get(`https://http.myvfirst.com/smpp/sendsms?username=${vfusername}&password=${vfpassword}&to=${mobile}&from=${vfsender}&text=${messageText}`, {
                params: {
                    timeout: 5000,
                },
            })
            .then(function (response) {
                // handle success
                if (response.status === 200 && response.data.startsWith('Sent.')) {
                    return resolve({ Status: 'Success', Details: messageId, service: 'valueFirst' });
                }
                Student.addOtpRecord({
                    mobile,
                    otp,
                    session_id: messageId,
                    service_type: 'valueFirst',
                    status: 'ERROR',
                    err_msg: response.data,
                    is_web,
                }, dbMysqlWrite);
                return reject({ Status: 'Fail', Details: messageId, service: 'valueFirst' });
            })
            .catch(function (error) {
                // handle error
                reject({ Status: 'Fail', Details: messageId, service: 'valueFirst' });
            });
        });
    }

    async sendOtp(mobile, otp, dbMysqlWrite, sessionId, is_web) {
        const message = querystring.escape(`<#> ${otp} is your OTP to login to the awesome world of Doubtnut.                                                                                Tp3vko4fb/t`);
        try {
            return await this.sendMessage(mobile, message, otp, dbMysqlWrite, sessionId, is_web);
        } catch (e) {
            console.log(e);
        }
    }
}

async function sendOtp(params) {
    const vf = new ValueFirst();
    return vf.sendOtp(params.phone, params.otp, params.db_mysql_write, params.sessionId, params.is_web);
}

module.exports = {
    sendOtp,
};
