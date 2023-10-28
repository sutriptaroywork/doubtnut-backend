const axios = require('axios');
const _ = require('lodash');
const logger = require('../../../config/winston').winstonLogger;
const Student = require('../../../modules/student');

async function sendOtp(params) {
    try {
        const options = {
            method: 'GET',
            url: `https://2factor.in/API/V1/${params.two_fa_key}/SMS/${params.phone}/${params.otp}/${params.two_fa_template_name}`,
            timeout: 5000,
        };

        let twoFaResponse;
        try {
            twoFaResponse = (await axios(options)).data;
        } catch(e) {
            const errorLog = JSON.stringify(e);
            logger.error({ tag: 'login', source: 'sendOtp', error: errorLog });
            throw (e);
        }

        if (typeof twoFaResponse != 'undefined' && !_.isNull(twoFaResponse) && (twoFaResponse.Status === 'Success') && !_.isNull(twoFaResponse.Details)) {
            const response = { Status: twoFaResponse.Status, Details: params.sessionId, service: '2factor' };
            return response;
        }
        return { Status: 'Fail', service: '2factor' };
    } catch (e) {
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        Student.addOtpRecord({
            mobile: params.phone,
            otp: params.otp,
            session_id: params.sessionId,
            service_type: '2factor',
            status: 'ERROR',
            err_msg: errorLog.response.data.Details,
            is_web: params.is_web,
        }, params.db_mysql_write);
        logger.error({ tag: 'login', source: 'sendOtp', error: errorLog });
        console.log(e);
    }
}

module.exports = {
    sendOtp,
};
