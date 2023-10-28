const moment = require('moment');

const Redis = require('./utility.redis');
const keys = require('./keys');
const Utility = require('../utility');

module.exports = class WhatsappRedis {
    static async getDailyCountNetcore(client, phone) {
        const dailyCount = await Redis.getHash(client, keys.waDailyCountNetcore, phone);
        if (dailyCount) {
            return JSON.parse(dailyCount);
        }
    }

    static incDailyCountNetcore(client, phone, obj, key, value = 1) {
        obj[key] = (obj[key] || 0) + value;
        return Redis.setHash(client, keys.waDailyCountNetcore, phone, obj, Utility.getExpireTime().expire);
    }

    static async getConversationContextNetcore(client, phone) {
        const context = await Redis.getHash(client, keys.waConversationContextNetcore, phone);
        if (context) {
            return JSON.parse(context);
        }
    }

    static setConversationContextNetcore(client, phone, context) {
        if (!context) {
            return Redis.deleteHashField(client, keys.waConversationContextNetcore, phone);
        }
        context.expiry = moment().add(6, 'h').toDate();
        return Redis.setHash(client, keys.waConversationContextNetcore, phone, context);
    }

    static async getLastVideoWatched(client, studentId) {
        const data = await Redis.checkIfExists(client, `${studentId}lastVideoWatched`);
        if (data) {
            return JSON.parse(data);
        }
    }
};
