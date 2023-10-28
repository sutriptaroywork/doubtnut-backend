const request = require('request');
const moment = require('moment');
const _ = require('lodash');
const config = require('../../config/config');

module.exports = class ShipRocketHelper {
    static async fetchAccessToken() {
        const options = {
            method: 'POST',
            url: `${config.SHIPROCKET.BASE_URL}/v1/external/auth/login`,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: `${config.SHIPROCKET.EMAIL}`,
                password: `${config.SHIPROCKET.PASSWORD}`,
            }),

        };
        const accessTokenBody = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });

        console.log(accessTokenBody);
        const accessToken = `Bearer ${JSON.parse(accessTokenBody).token}`;
        return accessToken;
    }

    static async createOrder(payload) {
        const options = {
            method: 'POST',
            url: `${config.SHIPROCKET.BASE_URL}/v1/external/orders/create/adhoc`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${await this.fetchAccessToken()}`,
            },
            body: payload,
        };

        const shiprocketResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });
        return JSON.parse(shiprocketResponse);
    }

    static async pinCodeCheck(queryString) {
        const options = {
            method: 'GET',
            url: `${config.SHIPROCKET.BASE_URL}/v1/external/courier/serviceability/`,
            qs: queryString,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${await this.fetchAccessToken()}`,
            },
        };

        const shiprocketResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });
        return shiprocketResponse;
    }

    static async cancelOrder(shiprocket_order_id) {
        const options = {
            method: 'POST',
            url: `${config.SHIPROCKET.BASE_URL}/v1/external/orders/cancel`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${await this.fetchAccessToken()}`,
            },
            body: JSON.stringify({
                ids: [
                    shiprocket_order_id,
                ],
            }),
        };

        const shiprocketResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });
        return JSON.parse(shiprocketResponse);
    }

    static async trackOrder(shipment_id) {
        const options = {
            method: 'GET',
            url: `${config.SHIPROCKET.BASE_URL}/v1/external/courier/track/shipment/`,
            qs: shipment_id,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${await this.fetchAccessToken()}`,
            },
        };

        const shiprocketResponse = await new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });
        return shiprocketResponse;
    }
};
