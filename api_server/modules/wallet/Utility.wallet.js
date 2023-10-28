const axios = require('axios');
const _ = require('lodash');
const config = require('../../config/config');
const Data = require('../../data/data');
const inst = require('../axiosInstances');

module.exports = class WalletUtility {
    static async getWalletBalance(walletData, timeout = 2000) {
        try {
            const headers = {};
            if (walletData.xAuthToken) {
                headers['x-auth-token'] = walletData.xAuthToken;
            }
            const { data } = await inst.configMicroInst({
                method: 'GET',
                url: `${config.microUrl}/api/wallet/summary/info`,
                timeout,
                headers,
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    }

    static async makeWalletTransaction(walletData, timeout = 2000) {
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (walletData.xAuthToken) {
                headers['x-auth-token'] = walletData.xAuthToken;
            }
            const { data } = await inst.configMicroInst({
                method: 'POST',
                url: `${config.microUrl}/wallet/transaction/create`,
                timeout,
                headers,
                data: walletData,
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    }
};
