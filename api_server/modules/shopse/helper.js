const axios = require('axios');
const _ = require('lodash');
const crypt = require('./crypt');
const config = require('../../config/config');
const logger = require('../../config/winston').winstonLogger;

module.exports = class ShopseHelper {
    static async createTransaction(obj) {
        try {
            const {
                studentId, amount, mobile, orderId, email, courseName, variantId, consumerName,
            } = obj;
            const payload = {
                amount,
                mobile,
                orderId,
                email,
                consumerName,
                returnUrl: config.SHOPSE.RETURN_URL,
                webhookUrl: config.SHOPSE.WEBHOOK_URL,
                customParams: {
                    studentId,
                },
                products: [
                    {
                        productId: variantId,
                        name: courseName,
                        amount,
                        category: 'course',
                        quantity: '1',
                    },
                ],
            };

            const encryptedPayload = crypt.encrypt(JSON.stringify(payload));

            const options = {
                url: `${config.SHOPSE.BASE_URL}/merchant/secure/api/v1/transactions`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: config.SHOPSE.API_TOKEN,
                },
                data: {
                    encryptedRequest: encryptedPayload,
                },
                json: true,
            };

            console.log(options);

            let shopseResponse;
            try {
                shopseResponse = (await axios(options)).data;
            } catch (e) {
                console.error(e);
            }
            console.log('shopseResponse', shopseResponse);
            const decryptedResponse = crypt.decrypt(shopseResponse.encryptedResponse);
            return JSON.parse(decryptedResponse);
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ShopSe', source: 'createTransaction', error: errorLog });
        }
    }

    static async verifyStatus(orderId) {
        try {
            const options = {
                url: `${config.SHOPSE.BASE_URL}/merchant/secure/api/v1/transactions/${orderId}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: config.SHOPSE.API_TOKEN,
                },
            };

            console.log(options);

            let shopseResponse;
            try {
                shopseResponse = (await axios(options)).data;
            } catch (e) {
                console.error(e);
            }

            console.log(shopseResponse);
            const decryptedResponse = crypt.decrypt(shopseResponse.encryptedResponse);
            return JSON.parse(decryptedResponse);
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ShopSe', source: 'verifyStatus', error: errorLog });
        }
    }

    static async getOTP(obj) {
        try {
            const {
                studentId, amount, mobile, email, courseName, variantId, consumerName,
            } = obj;
            const payload = {
                consumerName,
                amount,
                mobile,
                email,
                customParams: {
                    studentId,
                },
                products: [
                    {
                        productId: variantId,
                        name: courseName,
                        amount,
                        category: 'course',
                        quantity: '1',
                    },
                ],
            };

            const encryptedPayload = crypt.encrypt(JSON.stringify(payload));

            const options = {
                url: `${config.SHOPSE.BASE_URL}/merchant/secure/api/v1/eligibility/check`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: config.SHOPSE.API_TOKEN,
                },
                data: {
                    encryptedRequest: encryptedPayload,
                },
                json: true,
            };

            console.log(options);

            let shopseResponse;
            try {
                shopseResponse = (await axios(options)).data;
            } catch (e) {
                console.error(e);
            }

            console.log(shopseResponse);
            const decryptedResponse = crypt.decrypt(shopseResponse.encryptedResponse);
            return JSON.parse(decryptedResponse);
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ShopSe', source: 'getOTP', error: errorLog });
        }
    }

    static async verifyOTP(obj) {
        try {
            const { otp, shopSeRefNo } = obj;
            const payload = {
                otp,
                shopSeRefNo,
            };

            const encryptedPayload = crypt.encrypt(JSON.stringify(payload));

            const options = {
                url: `${config.SHOPSE.BASE_URL}/merchant/secure/api/v1/eligibility/validateOtp`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: config.SHOPSE.API_TOKEN,
                },
                data: {
                    encryptedRequest: encryptedPayload,
                },
                json: true,
            };

            console.log(options);

            let shopseResponse;
            try {
                shopseResponse = (await axios(options)).data;
            } catch (e) {
                console.error(e);
            }

            console.log(shopseResponse);
            const decryptedResponse = crypt.decrypt(shopseResponse.encryptedResponse);
            return JSON.parse(decryptedResponse);
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ShopSe', source: 'verifyOTP', error: errorLog });
        }
    }

    static async checkEligibility(obj) {
        try {
            const {
                studentId, amount, mobile, email, courseName, variantId, consumerName, expertId,
            } = obj;
            const payload = {
                consumerName,
                amount,
                mobile,
                email,
                customParams: {
                    studentId,
                    expertId,
                },
                products: [
                    {
                        productId: variantId,
                        name: courseName,
                        amount,
                        category: 'course',
                        quantity: '1',
                    },
                ],
            };

            const encryptedPayload = crypt.encrypt(JSON.stringify(payload));

            const options = {
                url: `${config.SHOPSE.BASE_URL}/merchant/secure/api/v1/checkEligibility`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: config.SHOPSE.API_TOKEN,
                },
                data: {
                    encryptedRequest: encryptedPayload,
                },
                json: true,
            };

            console.log(options);

            let shopseResponse;
            try {
                shopseResponse = (await axios(options)).data;
            } catch (e) {
                console.error(e);
            }

            console.log(shopseResponse);
            const decryptedResponse = crypt.decrypt(shopseResponse.encryptedResponse);
            return JSON.parse(decryptedResponse);
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ShopSe', source: 'checkEligibility', error: errorLog });
        }
    }

    static async createPaymentLink(obj) {
        try {
            const {
                studentId, amount, mobile, orderId, email, courseName, variantId, consumerName, expertId,
            } = obj;
            const payload = {
                amount,
                mobile,
                orderId,
                email,
                consumerName,
                returnUrl: config.SHOPSE.RETURN_URL,
                webhookUrl: config.SHOPSE.WEBHOOK_URL,
                customParams: {
                    studentId,
                    expertId,
                },
                products: [
                    {
                        productId: variantId,
                        name: courseName,
                        amount,
                        category: 'course',
                        quantity: '1',
                    },
                ],
            };

            const encryptedPayload = crypt.encrypt(JSON.stringify(payload));

            const options = {
                url: `${config.SHOPSE.BASE_URL}/merchant/secure/api/v2/paymentLinks`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: config.SHOPSE.API_TOKEN,
                },
                data: {
                    encryptedRequest: encryptedPayload,
                },
                json: true,
            };

            console.log(options);

            let shopseResponse;
            try {
                shopseResponse = (await axios(options)).data;
            } catch (e) {
                console.error(e);
            }

            console.log('shopseResponse', shopseResponse);
            const decryptedResponse = crypt.decrypt(shopseResponse.encryptedResponse);
            return JSON.parse(decryptedResponse);
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ShopSe', source: 'createPaymentLink', error: errorLog });
        }
    }
};
