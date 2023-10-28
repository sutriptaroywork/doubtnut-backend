const request = require('request');
const _ = require('lodash');
const PaytmCheckSum = require('./checksum.js');
const config = require('../../config/config');


module.exports = class PaytmHelper {
    static async disburse(phoneNo, orderId, amount) {
        const paytmParams = {
            orderId,
            subwalletGuid: config.PAYTM_DISBURSEMENT.SUB_WALLET_GUID,
            amount,
            beneficiaryPhoneNo: phoneNo,
            callbackUrl: 'https://paytm.com/test/',
        };

        const post_data = JSON.stringify(paytmParams);

        const checksum_lib = PaytmCheckSum;


        const checksum = await new Promise((resolve, reject) => {
            checksum_lib.genchecksumbystring(post_data, config.PAYTM_DISBURSEMENT.KEY, (err, data) => {
                resolve(data);
            });
        });

        const options = {

            url: `${config.PAYTM_DISBURSEMENT.BASE_URL}/bpay/api/v1/disburse/order/wallet/gratification`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-mid': config.PAYTM_DISBURSEMENT.MID,
                'x-checksum': checksum,
                // 'Content-Length': post_data.length,
            },
            body: post_data,
        };

        console.log(options);


        const paytmResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);

                // const res = JSON.parse(response);
                console.log(response.body);
                resolve(response.body);
            });
        });

        console.log(paytmResponse);

        return JSON.parse(paytmResponse);
    }

    static async bankDisburse(orderId, amount, transferMode, modeInfo, phoneNo) {
        const paytmParams = {
            orderId,
            subwalletGuid: config.PAYTM_DISBURSEMENT.SUB_WALLET_GUID,
            amount,
            purpose: 'OTHER',
            callbackUrl: 'https://paytm.com/test/',
            beneficiaryPhoneNo: phoneNo,
        };


        if (transferMode == 'UPI') {
            paytmParams.transferMode = transferMode;
            paytmParams.beneficiaryVPA = modeInfo.upi;
        } else {
            paytmParams.beneficiaryAccount = modeInfo.accountNumber;
            paytmParams.beneficiaryIFSC = modeInfo.ifsc;
        }

        const post_data = JSON.stringify(paytmParams);

        const checksum_lib = PaytmCheckSum;


        const checksum = await new Promise((resolve, reject) => {
            checksum_lib.genchecksumbystring(post_data, config.PAYTM_DISBURSEMENT.KEY, (err, data) => {
                resolve(data);
            });
        });

        const options = {

            url: `${config.PAYTM_DISBURSEMENT.BASE_URL}/bpay/api/v1/disburse/order/bank`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-mid': config.PAYTM_DISBURSEMENT.MID,
                'x-checksum': checksum,
                // 'Content-Length': post_data.length,
            },
            body: post_data,
        };

        console.log(options);


        const paytmResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);

                // const res = JSON.parse(response);
                console.log(response.body);
                resolve(response.body);
            });
        });

        console.log(paytmResponse);

        return JSON.parse(paytmResponse);
    }

    static async disburseStatus(orderId) {
        const paytmParams = {
            orderId,
        };

        const post_data = JSON.stringify(paytmParams);

        const checksum_lib = PaytmCheckSum;


        const checksum = await new Promise((resolve, reject) => {
            checksum_lib.genchecksumbystring(post_data, config.PAYTM_DISBURSEMENT.KEY, (err, data) => {
                resolve(data);
            });
        });

        const options = {

            url: `${config.PAYTM_DISBURSEMENT.BASE_URL}/bpay/api/v1/disburse/order/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-mid': config.PAYTM_DISBURSEMENT.MID,
                'x-checksum': checksum,
                // 'Content-Length': post_data.length,
            },
            body: post_data,
        };

        console.log(options);


        const paytmResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);

                // const res = JSON.parse(response);
                console.log(response.body);
                resolve(response.body);
            });
        });

        console.log(paytmResponse);

        return JSON.parse(paytmResponse);
    }

    static async createTransactionToken(orderId, studentId, amount) {
        const checksum_lib = PaytmCheckSum;

        /* initialize an object */
        const paytmParams = {};

        paytmParams.body = {

            requestType: 'Payment',

            mid: config.PAYTM.MID,

            websiteName: config.PAYTM.WEBSITE_NAME,

            callbackUrl: `${config.PAYTM.BASE_URL}/theia/paytmCallback?ORDER_ID=${orderId}`,

            orderId,

            txnAmount: {
                value: amount,
                currency: 'INR',
            },
            userInfo: {
                custId: studentId,
            },
        };

        const checksum = await new Promise((resolve, reject) => {
            checksum_lib.genchecksumbystring(JSON.stringify(paytmParams.body), config.PAYTM.KEY, (err, data) => {
                resolve(data);
            });
        });

        paytmParams.head = {
            signature: checksum,
        };

        const post_data = JSON.stringify(paytmParams);

        const options = {

            url: `${config.PAYTM.BASE_URL}/theia/api/v1/initiateTransaction?mid=${paytmParams.body.mid}&orderId=${orderId}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length,
            },
            body: paytmParams,
            json: true,
        };

        console.log(options);

        const paytmResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);


                // console.log("response.body",response.body);
                // console.log("response",response);

                resolve(response.body);
            });
        });


        return paytmResponse.body.txnToken;
    }

    static async transactionStatus(orderId) {
        const paytmParams = {};

        paytmParams.body = {

            mid: config.PAYTM.MID,

            orderId,
        };

        const checksum_lib = PaytmCheckSum;


        const checksum = await new Promise((resolve, reject) => {
            checksum_lib.genchecksumbystring(JSON.stringify(paytmParams.body), config.PAYTM.KEY, (err, data) => {
                resolve(data);
            });
        });


        paytmParams.head = {
            signature: checksum,
        };
        const post_data = JSON.stringify(paytmParams);

        const options = {

            url: `${config.PAYTM.BASE_URL}/v3/order/status`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length,
            },
            json: true,
            body: paytmParams,
        };


        console.log(options);

        const paytmResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);

                resolve(response.body);
            });
        });


        return paytmResponse.body.resultInfo.resultStatus;
    }


    static async refund(orderId, txnId, amount) {
        const paytmParams = {};

        paytmParams.body = {
            mid: config.PAYTM.MID,
            txnType: 'REFUND',
            orderId,
            txnId,
            refId: `REFUND_${orderId}`,
            // refId: `REFUND_${orderId}_${Math.floor(Math.random() * 1000) + 1}`,
            refundAmount: amount,
        };

        const checksum_lib = PaytmCheckSum;

        const checksum = await new Promise((resolve, reject) => {
            checksum_lib.genchecksumbystring(JSON.stringify(paytmParams.body), config.PAYTM.KEY, (err, data) => {
                resolve(data);
            });
        });


        paytmParams.head = {
            clientId: 'C11',
            signature: checksum,
        };

        const post_data = JSON.stringify(paytmParams);

        const options = {

            url: `${config.PAYTM.BASE_URL}/refund/apply`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length,
            },
            json: true,
            body: paytmParams,
        };


        console.log(options);

        const paytmResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);

                resolve(response.body);
            });
        });


        return paytmResponse;
    }

};
