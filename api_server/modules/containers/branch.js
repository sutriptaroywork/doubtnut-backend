const _ = require('lodash');
const mysql = require('../mysql/branch');

const redis = require('../redis/branch');
const config = require('../../config/config');

module.exports = class Branch {
    static async getByCampaign(db, campaign) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getByCampaign(db.redis.read, campaign);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getByCampaign(db.mysql.read, campaign);
            redis.setByCampaign(db.redis.write, campaign, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getScreenTypeByCampaign(db, campaign) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getScreenTypeByCampaign(db.redis.read, campaign);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getScreenTypeByCampaign(db.mysql.read, campaign);
            if (data.length > 0) {
                redis.setScreenTypeByCampaign(db.redis.write, campaign, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
};
