const request = require('request');
const _ = require('lodash');
const logger = require('../../../config/winston').winstonLogger;
const Student = require('../../../modules/student');

function callUrl(options) {
    return new Promise((resolve, reject) => {
        try {
            request(options, (error, response, body) => {
                if (error) throw new Error(error);
                const bodyResponse = JSON.parse(body);
                if (bodyResponse.response.status === 'success') {
                    const resp = { Status: 'Success', Details: bodyResponse.data.response_messages[0].id, service: 'gupshup' };
                    return resolve(resp);
                }
                Student.addOtpRecord({
                    mobile: options.form.send_to,
                    otp: options.err_msg_data.otp,
                    session_id: options.err_msg_data.sessionId,
                    service_type: 'gupshup',
                    status: 'ERROR',
                    err_msg: JSON.parse(body).response.details,
                    is_web: options.is_web,
                }, options.err_msg_data.write_db);
                return reject({ Status: 'Fail', service: 'gupshup' });
            });
        } catch (err) {
            return reject({ Status: 'Fail', service: 'gupshup' });
        }
    });
}

async function sendOtp(params) {
    try {
        const options = { method: 'POST',
            url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
            form: {
                method: 'sendMessage',
                send_to: params.phone,
                msg: `<#> ${params.otp} is your OTP to login to the awesome world of Doubtnut.                                                                                Tp3vko4fb/t`,
                msg_type: 'TEXT',
                userid: process.env.GUPSHUP_USERID,
                auth_scheme: process.env.GUPSHUP_AUTH_SCHEME,
                password: process.env.GUPSHUP_PASSWORD,
                format: 'JSON',
            },
            err_msg_data : {
                otp: params.otp,
                sessionId: params.sessionId,
                write_db: params.db_mysql_write,
            },
            is_web: params.is_web,
        };

        const gupsupResponse = await callUrl(options);
        return gupsupResponse;
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
