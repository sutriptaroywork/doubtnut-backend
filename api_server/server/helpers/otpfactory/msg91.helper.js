const SendOtp = require('sendotp');
const _ = require('lodash');
const logger = require('../../../config/winston').winstonLogger;

async function sendOtp(params) {
    try {
        const sendMsg91Otp = new SendOtp(params.msg_91_key, '<#> {{otp}} is your OTP to login to the awesome world of Doubtnut.                                                                                Tp3vko4fb/t');
        return new Promise((resolve) => {
            sendMsg91Otp.send(`91${params.phone}`, 'DOUBTN', params.otp, (error, data) => {
                if (!error && typeof data != 'undefined' && !_.isNull(data) && data.type === 'success' && !_.isNull(data.message)) {
                    console.log('send by msg91');
                    const response = { Status: data.type, Details: params.sessionId, service: 'msg91' };
                    resolve(response);
                } else {
                    resolve();
                }
            });
        });
    } catch (e) {
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'login', source: 'sendOtp', error: errorLog });
        console.log(e);
    }
}

module.exports = {
    sendOtp,
};
