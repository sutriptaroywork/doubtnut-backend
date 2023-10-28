const _ = require('lodash');
// let Utility = require('./utility');
module.exports = class AppConfig {
    static getLanguages(client) {
        return client.hgetAsync('app_config', 'language');
    }

    static setLanguages(languages, client) {
        return client.hsetAsync('app_config', 'language', JSON.stringify(languages));
    }

    static getConfig(client) {
        return client.getAsync('APP_CONFIGURATION');
    }

    static setConfig(data, client) {
        return client.setAsync('APP_CONFIGURATION', JSON.stringify(data));
    }

    static deleteLanguages(client) {
        return client.hdelAsync('app_config', 'language');
    }

    static getWhatsappData(client, student_class) {
        return client.getAsync(`whatsapp_card_${student_class}`);
    }

    static setWhatsappData(data, client, student_class) {
        return client.setAsync(`whatsapp_card_${student_class}`, JSON.stringify(data));
    }
};
