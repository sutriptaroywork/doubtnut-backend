const request = require('request');
const _ = require('lodash');
const logger = require('../../config/winston').winstonLogger;
const config = require('../../config/config');

function callUrl(options) {
    return new Promise((resolve, reject) => {
        try {
            request(options, (error, response, body) => {
                if (error) throw new Error(error);
                const bodyResponse = JSON.parse(body);
                if (bodyResponse.response.status === 'success') {
                    const resp = { Status: 'Success' };
                    return resolve(resp);
                }
                return reject({ Status: 'Fail' });
            });
        } catch (err) {
            return reject({ Status: 'Fail' });
        }
    });
}

async function sendSms(params) {
    try {
        const options = {
            method: 'POST',
            url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
            form: {
                method: 'sendMessage',
                send_to: params.mobile,
                msg: params.msg,
                msg_type: params.msg_type,
                userid: config.gupshup.userid,
                auth_scheme: 'PLAIN',
                password: config.gupshup.password,
                format: 'JSON',
            },
        };

        const gupsupResponse = await callUrl(options);
        return gupsupResponse;
    } catch (e) {
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'pin', source: 'setPin', error: errorLog });
        console.log(e);
    }
}

module.exports = {
    sendSms,
};
