/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const request = require('request-promise');
const logger = require('../../../config/winston').winstonLogger;
const config = require('../../../config/config');
// const inst = require('../../../modules/axiosInstances');

const rp = request.defaults({
    forever: true,
    pool: { maxSockets: 50 },
    agent: false,
    baseUrl: config.microUrl,
});

async function otpServices(params) {
    try {
        return rp.put({
            url: '/api/otp/send',
            headers: { country: params.region },
            body: params,
            json: true,
        });
    } catch (e) {
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'login', source: 'otpServices', error: errorLog });
        console.log(e);
        return false;
    }
}

async function verifyOtpResponse(params) {
    try {
        return rp.put({
            url: '/api/otp/verify',
            headers: { country: params.region },
            body: {
                otp: params.otp_entered_by_user, sessionId: params.sessionId, channel: params.channel, alreadyVerified: params.alreadyVerified,
            },
            json: true,
        });
    } catch (e) {
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'verify', source: 'verifyOtpResponse', error: errorLog });
        console.log(e);
        return false;
    }
}

module.exports = {
    otpServices,
    verifyOtpResponse,
};
