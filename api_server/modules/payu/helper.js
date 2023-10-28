const axios = require('axios');
const qs = require('qs');
const _ = require('lodash');
const Hash = require('./hash');
const config = require('../../config/config');
const logger = require('../../config/winston').winstonLogger;

const salt = config.PAYU.SALT;

module.exports = class PayUHelper {
    static async checkEligibility(cardNo) {
        try {
            const postObj = {
                key: config.PAYU.KEY,
                command: 'eligibleBinsForEMI',
                var1: 'Bin',
                var2: `${cardNo}`,
            };
            const text = `${postObj.key}|${postObj.command}|${postObj.var1}|${salt}`;
            postObj.hash = Hash.generateHash(text);
            const payload = qs.stringify(postObj);

            const options = {
                url: `${config.PAYU.FORM_BASE_URL}/merchant/postservice?form=2`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: payload,
            };

            const payuResponse = (await axios(options)).data;
            console.log('payuResponse', payuResponse);
            return JSON.parse(JSON.stringify(payuResponse));
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PayU', source: 'checkEligibility', error: errorLog });
        }
    }

    static async computeEmiInterest(amount) {
        try {
            const postObj = {
                key: config.PAYU.KEY,
                command: 'getEmiAmountAccordingToInterest',
                var1: `${amount}`,
            };
            const text = `${postObj.key}|${postObj.command}|${postObj.var1}|${salt}`;
            postObj.hash = Hash.generateHash(text);
            const payload = qs.stringify(postObj);

            const options = {
                url: `${config.PAYU.FORM_BASE_URL}/merchant/postservice?form=2`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: payload,
            };

            const payuResponse = (await axios(options)).data;
            console.log('payuResponse', payuResponse);
            return JSON.parse(JSON.stringify(payuResponse));
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PayU', source: 'computeEmiInterest', error: errorLog });
        }
    }

    static async verifyPayment(orderId) {
        try {
            const postObj = {
                key: config.PAYU.KEY,
                command: 'verify_payment',
                var1: `${orderId}`,
            };
            const text = `${postObj.key}|${postObj.command}|${postObj.var1}|${salt}`;
            postObj.hash = Hash.generateHash(text);
            const payload = qs.stringify(postObj);

            const options = {
                url: `${config.PAYU.FORM_BASE_URL}/merchant/postservice?form=2`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: payload,
            };

            const payuResponse = (await axios(options)).data;
            console.log('payuResponse', payuResponse);
            return JSON.parse(JSON.stringify(payuResponse));
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PayU', source: 'verifyPayment', error: errorLog });
        }
    }
};
