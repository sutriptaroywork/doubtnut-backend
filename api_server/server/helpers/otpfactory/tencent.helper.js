const _ = require('lodash');
const logger = require('../../../config/winston').winstonLogger;
const QcloudSms = require("qcloudsms_js");
const Student = require('../../../modules/student');

function sendSmsTencent(ssender, phone, templateId, params, options) {
    return new Promise(function(resolve, reject){
        const messageId = options.sessionId;
        function callback(err, res, resData) {
            if (err) {
                console.log("err: ", err);
            } else {
                if (resData && resData.result === 0 && resData.errmsg === 'OK') {
                    return resolve({ Status: 'Success', Details: messageId, service: 'tencent' });
                }
                Student.addOtpRecord({
                    mobile: res.req.body.tel.mobile,
                    otp: res.req.body.params[0],
                    session_id: messageId,
                    service_type: 'tencent',
                    status: 'ERROR',
                    err_msg: resData.errmsg,
                    is_web: options.is_web,
                }, options.db_mysql_write);
                return reject({ Status: 'Fail', service: 'tencent' });
            }
        }
        ssender.sendWithParam(91, phone, templateId, params, '', '', '', callback);
    });
}

async function sendOtp(options) {
    try {
        const phone = options.phone;
        const params = [options.otp];
        const appid = options.tencent_app_id;
        const appkey = options.tencent_app_key;
        const templateId = options.tencent_app_template_id;
        const qcloudsms = QcloudSms(appid, appkey);
        const ssender = qcloudsms.SmsSingleSender();

        const response = await sendSmsTencent(ssender, phone, templateId, params, options);
        if (response.Status === 'Success') {
            return response;
        }
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
