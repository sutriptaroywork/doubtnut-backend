const _ = require('lodash');
const config = require('../../config/config');
// let Utility = require('./utility');
// let _ = require('./utility');
const mysqlAppConfig = require('../mysql/appConfig');
const nodeCacheAppConfig = require('../dn-cache/AppConfig');

module.exports = class AppConfiguration {
    static async getConfigByKey(db, key) {
        let data;
        if (config.caching) {
            data = await nodeCacheAppConfig.get(`config_${key}`);
        }
        if (data) {
            return JSON.parse(data);
        }
        data = await mysqlAppConfig.getAppConfigByKey(db.mysql.read, key);
        if (config.caching) {
            nodeCacheAppConfig.set(`config_${key}`, JSON.stringify(data), 12 * 60 * 60);// 12 hrs
        }
        return data;
    }

    static async getConfigByKeyAndClass(db, key, studentClass) {
        let data;
        if (config.caching) {
            data = await nodeCacheAppConfig.get(`configkc_${key}_${studentClass}`);
        }
        if (data) {
            return JSON.parse(data);
        }
        data = await mysqlAppConfig.getAppConfigByKeyAndClass(db.mysql.read, key, studentClass);
        if (config.caching) {
            nodeCacheAppConfig.set(`configkc_${key}_${studentClass}`, JSON.stringify(data), 12 * 60 * 60);// 12 hrs
        }
        return data;
    }

    static async getConfig(db) {
        let data;
        if (config.caching) {
            data = await nodeCacheAppConfig.get('all_config');
        }
        if (data) {
            return JSON.parse(data);
        }
        data = await mysqlAppConfig.getConfig(db.mysql.read);
        if (config.caching) {
            nodeCacheAppConfig.set('all_config}', JSON.stringify(data), 12 * 60 * 60);// 12 hrs
        }
        return data;
    }
};
