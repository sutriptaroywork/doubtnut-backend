const request = require('request');
const moment = require('moment');
const _ = require('lodash');
const config = require('../../config/config');


module.exports = class PayPalHelper {
    static async fetchAccessToken() {
        const options = {
            method: 'POST',
            url: `${config.PAYPAL_US.BASE_URL}/v1/oauth2/token`,
            headers: {
                Accept: 'application/json',
                'Accept-Language': 'en_US',
                Authorization: `Basic ${config.PAYPAL_US.AUTH}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            form: {
                grant_type: 'client_credentials',
            },
        };
        const accessTokenBody = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });

        console.log(accessTokenBody);
        const accessToken = JSON.parse(accessTokenBody).access_token;
        return accessToken;
    }

    static async cancelSubscription(subscriptionId, reasonForCancel) {
        const options = {
            method: 'POST',
            url: `${config.PAYPAL_US.BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await this.fetchAccessToken()}`,
            },
            body: JSON.stringify({ reason: reasonForCancel }),

        };
        const cancelResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);
                console.log(response);
                resolve(response);
            });
        });

        console.log('cancelResponse', cancelResponse);
        return cancelResponse;
    }

    static async getSubscriptionInfo(subscriptionId) {
        const options = {
            method: 'GET',
            url: `${config.PAYPAL_US.BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await this.fetchAccessToken()}`,
            },
        };

        console.log("options",  options);

        const subscriptionInfo = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });
        console.log('subscriptionInfo', subscriptionInfo);
        return JSON.parse(subscriptionInfo);
    }


    static async getSubscriptionLink(planId, orderId, studentInfo) {
        const options = {
            method: 'POST',
            url: `${config.PAYPAL_US.BASE_URL}/v1/billing/subscriptions`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await this.fetchAccessToken()}`,
                'PayPal-Request-Id': orderId,
            },
            body: JSON.stringify({
                plan_id: planId,
                custom_id: orderId,
                start_time: moment().add(30, 'minutes').toISOString(),
                quantity: '1',
                subscriber: {
                    name: { given_name: studentInfo.student_fname, surname: studentInfo.student_lname },
                },
                application_context: {
                    brand_name: 'doubtnut', shipping_preference: 'NO_SHIPPING', user_action: 'SUBSCRIBE_NOW', payment_method: { payer_selected: 'PAYPAL', payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED' }, return_url: `https://api.doubtnut.app/static/paypal_status.html?id=${orderId}`, cancel_url: `https://api.doubtnut.app/static/paypal_status.html?id=${orderId}`,
                },
            }),

        };
        console.log(options);
        const responseBody = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });

        console.log(responseBody);
        const jsonResponseBody = JSON.parse(responseBody);

        if (jsonResponseBody.name == 'INVALID_REQUEST') {
            throw new Error('invalid url');
        }

        const link = JSON.parse(responseBody).links[0].href;
        return { buyLink: link, partner_order_id: jsonResponseBody.id };
    }
};
