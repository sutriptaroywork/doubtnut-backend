const _ = require('lodash');
const config = require('../../config/config');
// let Utility = require('./utility');
// let _ = require('./utility');
const mysqlAppConfig = require('../mysql/appConfig');
const redisAppConfig = require('../redis/appConfig');
const mysql = require('../mysql/student');
const redis = require('../redis/student');
const AppConfigurationContainer = require('./AppConfiguration');
// const redisAnswer = require("../redis/answer")
module.exports = class AppConfig {
    static async getLanguages(db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data;
                if (config.caching) {
                    data = await redisAppConfig.getLanguages(db.redis.read);
                    console.log('redis langugage');
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysqlAppConfig.getLanguages(db.mysql.read);
                    console.log('mysql language');
                    console.log(data);
                    if (data.length > 0) {
                        // set in redis
                        await redisAppConfig.setLanguages(data, db.redis.write);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysqlAppConfig.getLanguages(db.mysql.read);
                console.log('mysql langugage');
                console.log(data);
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getConfig(db) {
        const data = await AppConfigurationContainer.getConfig(db);
        if (data.length > 0) {
            const jsonObj = {};
            for (let i = 0; i < data.length; i++) {
                jsonObj[data[i].key_name] = data[i].key_value;
            }
        } else {
            return {};
        }
    }

    static async getInvite(sclass, db) {
        return AppConfigurationContainer.getConfigByKeyAndClass(db, 'invite', sclass);
    }

    static async getInviteVIP(sclass, db) {
        return AppConfigurationContainer.getConfigByKeyAndClass(db, 'invite_vip', sclass);
    }

    static async getWhatsappData(db, studentClass) {
        return AppConfigurationContainer.getConfigByKeyAndClass(db, 'whatsapp_ask', studentClass);
    }
};
